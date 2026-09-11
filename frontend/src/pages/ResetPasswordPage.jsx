import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound, Lock, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();

  // Link state: 'checking' -> 'valid' | 'invalid'
  const [linkState, setLinkState] = useState('checking');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // On load, ask the backend whether this reset link is still valid so we can
  // tell the user immediately if it has expired or already been used.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authApi.validateResetToken(uid, token);
        if (!cancelled) setLinkState('valid');
      } catch (err) {
        if (!cancelled) setLinkState('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await authApi.resetPassword(uid, token, password, confirmPassword);
      setDone(true);
    } catch (err) {
      console.error('Reset password error', err);
      const data = err.response?.data;
      // Surface the first field error if the backend sent any.
      const detail =
        data?.confirm_password?.[0] ||
        data?.new_password?.[0] ||
        data?.token ||
        'Unable to reset your password. Please try again.';
      setErrorMsg(detail);
      // If the token turned out invalid/expired mid-submit, switch states.
      if (data?.token) setLinkState('invalid');
    } finally {
      setLoading(false);
    }
  };

  // ---- Loader while checking the link ----
  if (linkState === 'checking') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto animate-pulse">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-500">Checking your reset link...</p>
        </div>
      </div>
    );
  }

  // ---- Invalid / expired link ----
  if (linkState === 'invalid') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            This link is invalid or has expired
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Password reset links are valid for 3 days and can only be used
            once. You'll need to start a new reset request to choose a new
            password.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition text-sm"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  // ---- Done (password saved) ----
  if (done) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Password updated!
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your password has been reset successfully. You can now sign in
            with your new password.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ---- Valid link: show the password form ----
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Choose a new password
          </h1>
          <p className="text-xs text-slate-500">
            Set a new password for your account
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition duration-200 text-sm disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}