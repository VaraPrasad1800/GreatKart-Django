from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Account


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

        # create_user() doesn't accept phone_number, so it is set after
        # creation - same approach as the old HTML register view
        user = Account.objects.create_user(
            username=username,
            password=password,
            **validated_data,
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
