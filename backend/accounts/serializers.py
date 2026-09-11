from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .models import Account

AccountUser = get_user_model()


def get_user_from_reset_token(uid, token):
    """Decode ``uid`` + ``token`` from a reset link back to a user.

    Returns the matching ``Account`` if the link is genuine, unexpired and
    unused; otherwise returns ``None``. Used by both the confirm serializer
    (to set the new password) and the validate view (to check a link early).
    """
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = AccountUser.objects.get(id=user_id)
    except (TypeError, ValueError, OverflowError, AccountUser.DoesNotExist):
        return None

    if not default_token_generator.check_token(user, token):
        return None

    return user


class RegisterSerializer(serializers.ModelSerializer):
    # write_only => password never appears in JSON responses
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Account
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email',
                  'password', 'confirm_password']

    def validate_password(self, value):
        # Runs Django's built-in password strength checks (min length, not
        # too common, not too similar to username/email, etc.)
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )

        phone = attrs.get('phone_number')
        if phone:
            if not phone.isdigit():
                raise serializers.ValidationError(
                    {'phone_number': 'Phone number must contain only digits.'}
                )
            if len(phone) != 10:
                raise serializers.ValidationError(
                    {'phone_number': 'Phone number must be exactly 10 digits.'}
                )

        if Account.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError(
                {'email': 'An account with this email already exists.'}
            )

        # Username is derived from the email local part; two emails like
        # a@x.com and a@y.com would otherwise collide in the DB.
        candidate_username = attrs.get('email', '').split('@')[0]
        if candidate_username and Account.objects.filter(username=candidate_username).exists():
            raise serializers.ValidationError(
                {'email': 'An account with a similar username already exists.'}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        phone_number = validated_data.pop('phone_number')

        # Reuse the same username logic as the old HTML register view
        username = validated_data['email'].split('@')[0]

        # create_user() expects email as first positional arg, then password, then extra_fields
        user = Account.objects.create_user(
            email=validated_data['email'],
            password=password,
            username=username,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.phone_number = phone_number
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Read-only view of a logged-in user - used to test that JWT works."""
    class Meta:
        model = Account
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number',
                  'date_joined']


# ============================================================
# Password reset
# ============================================================

class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1 — "forgot my password": the user only submits their email.

    We deliberately do NOT reject unknown emails here. The view always
    returns the same message whether or not the account exists, which stops
    attackers using the endpoint to find valid accounts (enumeration).
    """
    email = serializers.EmailField(max_length=50)

    def validate_email(self, value):
        # Normalise to lowercase so lookups are consistent, matching the
        # custom user manager's behaviour.
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Step 2 — the user clicked the emailed link and submits a new password.

    Inputs:
        uid             base64-encoded user id (from the reset link)
        token           one-time token (from the reset link)
        new_password    the chosen password
        confirm_password   must equal new_password

    This serializer is the security gate: it decodes and verifies the token
    (which also enforces the expiry window and one-time use), then saves the
    new password.
    """
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    default_error_messages = {
        'invalid_link': 'This reset link is invalid or has expired.',
        'password_mismatch': 'The two password fields must match.',
    }

    def validate(self, attrs):
        # 1. Passwords must match.
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError(
                {'confirm_password': self.error_messages['password_mismatch']}
            )

        # 2. Enforce Django's password strength policy (min length, not too
        #    common, not too similar to the user's email/username, etc.).
        validate_password(attrs.get('new_password'))

        # 3 + 4. Decode the uid and verify the token. The shared helper
        #    checks that the uid maps to a real account, that the token is
        #    genuine, was issued to this exact user, has not already been used
        #    (Django's token is single-use because the user's password hash is
        #    part of the signed value) and is still within PASSWORD_RESET_TIMEOUT.
        user = get_user_from_reset_token(attrs.get('uid'), attrs.get('token'))
        if user is None:
            raise serializers.ValidationError(
                {'token': self.error_messages['invalid_link']}
            )

        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        """Set the new password on the verified user and persist it."""
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user
