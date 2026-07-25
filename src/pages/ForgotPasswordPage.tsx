import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your university email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Password reset instructions sent');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-white p-6 text-center text-black border-b border-slate-200">
          <div className="w-12 h-12 rounded-lg bg-worn-gold text-black flex items-center justify-center font-bold mx-auto mb-3">
            <KeyRound className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-black font-heading tracking-tight text-black">Reset Password</h2>
          <p className="text-xs text-worn-gold font-bold mt-1 font-mono-data uppercase tracking-wider">
            CampusFix Account Recovery
          </p>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-resolved-green rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-ledger-navy">Check Your Inbox</h3>
            <p className="text-sm text-ink/70">
              We've sent a password reset link to <strong className="text-ledger-navy">{email}</strong>. Follow the instructions to set your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-ledger-navy hover:underline pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-ink/70">
              Enter your registered university email address below and we will send you a reset link.
            </p>

            <div>
              <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />}
              <span>Send Reset Link</span>
            </button>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs font-bold text-ledger-navy hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
