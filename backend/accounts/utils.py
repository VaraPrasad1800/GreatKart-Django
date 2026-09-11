"""Helper functions for the accounts app (email utilities).

Centralises email sending so views stay thin and the message content
(e.g. the GreatKart branding) lives in one place.
"""
from django.conf import settings
from django.core.mail import send_mail


def send_password_reset_email(user, reset_url):
    """Email a password-reset link to ``user``.

    ``reset_url`` is the full link (frontend URL + uid + token) that the
    user clicks to choose a new password. We send both a plain-text version
    (for clients that only read text) and an HTML version (for pretty ones).

    Returns the number of emails successfully sent (1 on success) — used by
    the test suite to assert the email went out.
    """
    subject = 'Reset your GreatKart password'
    first_name = user.first_name.strip() or 'there'

    # Plain-text fallback for email clients that disable HTML.
    text_body = (
        f'Hi {first_name},\n\n'
        f'We received a request to reset the password for your GreatKart '
        f'account ({user.email}).\n\n'
        f'Click the link below to choose a new password:\n'
        f'{reset_url}\n\n'
        f'This link is valid for 3 days and can only be used once.\n'
        f'If you did not request this, you can safely ignore this email.\n\n'
        f'Thanks,\nThe GreatKart Team'
    )

    html_body = f"""
    <div style="max-width:520px;margin:auto;font-family:Arial,Helvetica,sans-serif;
                color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;
                border-radius:16px;padding:32px;">
      <div style="width:48px;height:48px;border-radius:12px;background:#2563eb;
                  display:flex;align-items:center;justify-content:center;
                  color:#ffffff;font-weight:800;font-size:22px;">G</div>
      <h1 style="font-size:20px;margin:20px 0 8px;">Reset your password</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Hi {first_name},<br><br>
        We received a request to reset the password for
        <strong>{user.email}</strong>.
      </p>
      <a href="{reset_url}" style="display:inline-block;margin:20px 0 24px;
         background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;
         text-decoration:none;padding:13px 24px;border-radius:10px;">
        Choose a new password
      </a>
      <p style="font-size:12px;color:#64748b;line-height:1.6;">
        This link is valid for 3 days and can only be used once.
        If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;">Thanks,<br>The GreatKart Team</p>
    </div>
    """

    return send_mail(
        subject,
        text_body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_body,
        fail_silently=False,
    )