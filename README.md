# Forgot Password — Feature Guide

<details align="center"><summary><strong>GreatKart · Django REST Framework + React</strong></summary></details>

A complete, secure **"I forgot my password"** flow for GreatKart: the user enters
their email, receives a one-time reset link, clicks it, and sets a new password —
all without telling an attacker which emails are registered.

> This guide explains **why** and **how** every piece works, so you can walk into
> an interview and explain it. Each section pairs the *theory* with the *code*
> reference to the actual files you just built.

---

## 1. What the feature does (end to end)

```
┌──────────────┐   POST /accounts/api/password-reset/   ┌─────────────────────────┐
│ Forgot page  │ ─────────────────────────────────────► │ generate uid + one-time │
│ (React)      │                 {email}                │ token, email reset link │
└──────────────┘                                          └────────────┬────────────┘
                                                                       │ SMTP / console
                                                                       ▼
                                                          ┌──────────────────────┐
                                                          │ Reset link in inbox │
                                                          │ /reset-password/uid/ │
                                                          │         token        │
                                                          └────────────┬──────────┘
                                                                       │ user clicks
┌──────────────┐   GET  …/validate/?uid&token=<link>                  ▼
│ Reset page   │ ──────────────► (check link still valid)   ┌─────────────────────┐
│ (React)      │                                              │ new password form │
└──────────────┘                                              └──────────┬──────────┘
       ▲                                                                 │
       │  POST …/confirm/ {uid, token, new_password}                     ▼
       │  ─────────────────────────────────────────────►  set_password() on account
       │                                                     (old token now invalid)
   ┌───┴───────────┐
   │ Sign In page  │  ← user logs in again with the new password
   └───────────────┘
```

**Four moving parts:**

| Part | Files |
|------|-------|
| Backend API | [`accounts/views.py`](accounts/views.py) · [`accounts/serializers.py`](accounts/serializers.py) · [`accounts/urls.py`](accounts/urls.py) |
| Email | [`accounts/utils.py`](accounts/utils.py) · email settings in [`greatkart/settings.py`](greatkart/settings.py) |
| Frontend pages | [`ForgotPasswordPage.jsx`](frontend/src/pages/ForgotPasswordPage.jsx) · [`ResetPasswordPage.jsx`](frontend/src/pages/ResetPasswordPage.jsx) |
| Frontend plumbing | [`api/auth.js`](frontend/src/api/auth.js) · routes in [`App.jsx`](frontend/src/App.jsx) · link on [`LoginPage.jsx`](frontend/src/pages/LoginPage.jsx) |

---

## 2. The theory: Django's time-limited, single-use token

The heart of the feature is **not** a database table of reset tokens — there is
none. Django generates a token on the fly and is able to *verify it later* without
storing anything. That works because the token is a **signed, salted, time-limited
value computed from the user's current password hash**.

```python
# accounts/serializers.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
```

**The two halves of a reset link:**

- **`uid`** — the user's database primary key, encoded so it's URL-safe:
  `urlsafe_base64_encode(force_bytes(user.pk))`. On the way back we decode it
  with `urlsafe_base64_decode` and look the user up. (We base64 it just to keep
  the id out of plain sight in the URL / email and to stay length-safe; it is
  *not* a secret — the **token** is the real access control.)

- **`token`** — `default_token_generator.make_token(user)`. Internally Django's
  `PasswordResetTokenGenerator` builds an HMAC (SHA-256-salted) over a payload
  that includes **the user's password hash**, their last-login, the current time,
  and a secret:

  ```python
  # (conceptually, inside Django)
  value = (str(user.pk) + user.password + str(user.last_login)
           + str(timestamp) + (unladen if user.is_active else ""))
  ts = int(time.time() // timeout)                      # current time bucket
  token = base36(ts) + "-" + truncate(hmac(SECRET, value))   # signed
  ```

  Because the **password hash is part of the signed value**, a token is **single
  use**: once the user changes their password, the hash changes, so the old token
  no longer verifies — even if it was copied. And because the **time is in a
  bucket**, the token auto-expires: `check_token` compares the token's timestamp
  to `PASSWORD_RESET_TIMEOUT` (default 3 days, set in
  [`greatkart/settings.py`](greatkart/settings.py)).

**The verify step** (used by *both* the validate endpoint and the confirm flow):

```python
# accounts/serializers.py
def get_user_from_reset_token(uid, token):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = AccountUser.objects.get(id=user_id)
    except (TypeError, ValueError, OverflowError, AccountUser.DoesNotExist):
        return None
    if not default_token_generator.check_token(user, token):
        return None
    return user
```

We **never store the token** and **never** need to revoke it — expiry and
single-use are mathematical properties of the signed value. That is the key idea
to be able to explain: *"stateless, self-verifying tokens"*.

---

## 3. Backend walk-through

### 3.1 Request a reset link — `POST /accounts/api/password-reset/`

```python
class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = Account.objects.filter(email__iexact=email).first()

        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_password_reset_email(user, reset_url)

        return Response({'message': 'If an account with that email exists, ...'}, 200)
```

A few deliberate choices worth being able to defend:

- **`AllowAny`** — a user who forgot their password obviously can't send a JWT.
- **Always returns 200 with one generic message**, even for unknown emails. This is
  **anti-account-enumeration**: an attacker can't query the endpoint to learn which
  addresses have accounts, because both "no such account" and "account found" look
  identical.
- **Case-insensitive lookup** (`email__iexact`) because `last_login` and email are
  compared at token-verify time — the token from a reset only works for the exact
  account it was issued to.

### 3.2 Validate a link early — `GET /accounts/api/password-reset/validate/?uid=&token=`

Lets the React reset page immediately tell the user *"this link is invalid or
expired"* on load, instead of making them type a new password to find out. It just
reuses `get_user_from_reset_token`.

### 3.3 Set the new password — `POST /accounts/api/password-reset/confirm/`

```python
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()          # sets the new password on the verified user
        return Response({'message': 'Password reset successfully. ...'}, 200)
```

The serializer is the security gate — it must pass **three checks** in order:

1. **Passwords match** — `new_password == confirm_password`.
2. **Password strength** — Django's built-in `validate_password` (min length, not
   too common, not too similar to the email/username) — deliberately reused from
   the existing `RegisterSerializer` so policies stay consistent.
3. **Token is genuine + unexpired + unused** — via `get_user_from_reset_token`;
   on failure it raises `{'token': 'This reset link is invalid or has expired.'}`.

Only then does it call `user.set_password(...)` and save. `set_password` stores a
carefully salted PBKDF2 hash — that's why we can safely ship a link in email; even
if it leaks, it's not the raw password, and it stops working the moment it's used.

---

## 4. Email — where do the emails actually go?

GreatKart ships with **two** email backends; pick per environment. There are **no
new packages to install** — this is all Django stdlib + `os.environ`.

| Backend | When to use | What happens |
|---------|-------------|--------------|
| `django.core.mail.backends.console.EmailBackend` (**default**) | Local development | Emails are **printed to the terminal** running `runserver`. Perfect for testing — no SMTP account needed. |
| `django.core.mail.backends.smtp.EmailBackend` | Production / real "send" | Emails are actually delivered over SMTP (e.g. Gmail). |

```python
# greatkart/settings.py
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'noreply@greatkart.com')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
```

**To switch to real email (Gmail example):**

1. Enable **2-Step Verification** on your Google account, then create an
   **App Password** under *Security → App passwords*.
2. Either set environment variables, or add a `.env` to the project root and load
   it (note: `.env` is already gitignored — see below) and export them when you run:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend      \
   EMAIL_HOST=smtp.gmail.com EMAIL_PORT=587 EMAIL_USE_TLS=True    \
   EMAIL_HOST_USER=you@gmail.com                                  \
   EMAIL_HOST_PASSWORD=<your 16-char app password>
   ```
3. `FRONTEND_URL` must point at the **React** app so the emailed link opens the
   right page (default `http://localhost:5173`).

The email itself (branded HTML + a plain-text fallback) is built in
[`accounts/utils.py`](accounts/utils.py) via `django.core.mail.send_mail`.

> `.env` is already in your `.gitignore`, so credentials stay out of version control.

---

## 5. Frontend walk-through

### 5.1 API client — [`frontend/src/api/auth.js`](frontend/src/api/auth.js)

Three thin axios methods that hit your backend through the Vite `/accounts/api`
proxy (`http://127.0.0.1:8000`):

```js
forgotPassword(email)          // POST /accounts/api/password-reset/
validateResetToken(uid, token) // GET  /accounts/api/password-reset/validate/
resetPassword(uid, token, new, confirm) // POST .../confirm/
```

### 5.2 ForgotPasswordPage — [`frontend/src/pages/ForgotPasswordPage.jsx`](frontend/src/pages/ForgotPasswordPage.jsx)

- One email field → on submit calls `forgotPassword`.
- On success it swaps to a **"Check your email"** screen. It shows the *same*
  neutral message whether or not an account exists — mirroring the backend's
  enumeration protection on the UI side.
- Back link to `/login`.

### 5.3 ResetPasswordPage — [`frontend/src/pages/ResetPasswordPage.jsx`](frontend/src/pages/ResetPasswordPage.jsx)

- Route is `/reset-password/:uid/:token`. On mount it reads those two params with
  React Router's `useParams()` and calls `validateResetToken`.
- **Three states** render from that one call:
  - `checking` — spinner while the request is in flight.
  - `invalid` — if the backend says the link is dead, show the "expired" card with
    a button to request a new link.
  - `valid` — show the new-password form.
- On submit it calls `resetPassword`; the backend enforces match + strength +
  token. Any user-facing error (e.g. the token turned out expired mid-submit) is
  surfaced from `err.response.data`.

### 5.4 Wiring it in

- Routes added in [`App.jsx`](frontend/src/App.jsx) alongside the other public auth
  routes (not inside `ProtectedRoute`, because the user is logged out).
- A **"Forgot password?"** link added to the login form in
  [`LoginPage.jsx`](frontend/src/pages/LoginPage.jsx).

---

## 6. Security & correctness checklist (interview gold)

When asked "what did you consider?", mention:

- **Account enumeration** → both endpoints behave identically for known/unknown
  emails; expires messages are identical.
- **Stateless, self-expiring tokens** → no DB storage; 3-day `PASSWORD_RESET_TIMEOUT`;
  single-use because the password hash is part of the signed value.
- **Password-hashing** → Django `set_password()` (PBKDF2, salt/iterations per-key);
  we never store or echo the raw password.
- **No password echo in responses** → `new_password`/`confirm_password` are
  `write_only=True`; errors are field-keyed but generic.
- **Strength policy** → `validate_password` reused so registration and reset share
  one rule set.
- **Credential hygiene** → SMTP secrets via env vars / `.env` (gitignored).
- **Frontend state discipline** → the reset page never trusts the URL; it asks the
  backend to confirm the link is valid before showing a form.

---

## 7. Files changed in this feature

| File | Purpose |
|------|---------|
| [`greatkart/settings.py`](greatkart/settings.py) | Email backend config, `FRONTEND_URL`, `PASSWORD_RESET_TIMEOUT` |
| [`accounts/utils.py`](accounts/utils.py) | `send_password_reset_email()` — branded email helper |
| [`accounts/serializers.py`](accounts/serializers.py) | Reset request/confirm serializers + shared `get_user_from_reset_token` |
| [`accounts/views.py`](accounts/views.py) | 3 API views: request, validate, confirm |
| [`accounts/urls.py`](accounts/urls.py) | 3 API routes under `/accounts/api/password-reset/…` |
| [`frontend/src/api/auth.js`](frontend/src/api/auth.js) | `forgotPassword` / `validateResetToken` / `resetPassword` |
| [`frontend/src/pages/ForgotPasswordPage.jsx`](frontend/src/pages/ForgotPasswordPage.jsx) | "Enter email" → success screen |
| [`frontend/src/pages/ResetPasswordPage.jsx`](frontend/src/pages/ResetPasswordPage.jsx) | Validate link → set new password → done |
| [`frontend/src/App.jsx`](frontend/src/App.jsx) | Two new public routes |
| [`frontend/src/pages/LoginPage.jsx`](frontend/src/pages/LoginPage.jsx) | "Forgot password?" link |

---

## 8. How to test it locally (5 minutes)

1. Make sure **Django** is running with the **console** email backend (the default):
   ```bash
   cd <project>
   python manage.py runserver 127.0.0.1:8000
   ```
2. Make sure **Vite** is running (`cd frontend && npm run dev`).
3. Open `http://localhost:5173/login` → click **"Forgot password?"**.
4. Submit an email you used to register.
5. Watch the **`runserver` terminal** — the email (with your reset link) prints there:
   ```
   MIME-Version: 1.0 ...
   Content-Type: text/plain; charset="utf-8"
   Hi <first_name>, ...
   Click the link below to choose a new password:
   http://localhost:5173/reset-password/<uid>/<token>
   ```
6. Copy the **`/reset-password/<uid>/<token>`** link, open it in the browser.
7. Type a new password twice → **Update Password** → success screen.
8. Sign in at `/login` with the new password. ✅

**Try the failure paths too:**

- Re-open the *same* reset link again → **invalid** (it was single-use).
- Submit a non-existent email on the forgot page → you still get the generic
  "Check your email" message (no enumeration leak).
- Set a weak / mismatched password → the backend rejects it.

---

*GreatKart — built as a placement-prep project: Django REST Framework API + React
frontend, JWT auth, and this stateless password-reset flow.*