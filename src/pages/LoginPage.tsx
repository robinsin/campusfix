import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../lib/auth/AuthContext';
import { loginWithSupabase, isSupabaseConfigured } from '../lib/api/authApi';
import { Wrench, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { switchUser, allUsers, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);

  const isLiveSupabase = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setGenericError(null);

    try {
      if (isLiveSupabase) {
        // Real Supabase Authentication
        const user = await loginWithSupabase(data.email, data.password);
        await refreshUser();
        toast.success(`Welcome back, ${user.full_name}!`);

        if (user.role_id === 'admin') {
          navigate('/app/admin');
        } else if (user.role_id === 'officer') {
          navigate('/app/officer');
        } else {
          navigate('/app/requests');
        }
      } else {
        // Mock fallback authentication
        setTimeout(async () => {
          const match = allUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
          if (!match) {
            setGenericError('Incorrect email or password');
            setLoading(false);
            toast.error('Incorrect email or password');
            return;
          }

          await switchUser(match.id);
          setLoading(false);
          toast.success(`Welcome back, ${match.full_name}`);

          if (match.role_id === 'admin') {
            navigate('/app/admin');
          } else if (match.role_id === 'officer') {
            navigate('/app/officer');
          } else {
            navigate('/app/requests');
          }
        }, 400);
      }
    } catch (err: any) {
      setGenericError(err.message || 'Incorrect email or password');
      toast.error(err.message || 'Incorrect email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-white p-6 text-center text-black border-b border-slate-200">
          <div className="w-12 h-12 rounded-lg bg-worn-gold text-black flex items-center justify-center font-bold mx-auto mb-3">
            <Wrench className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-black font-heading tracking-tight text-black">CampusFix Sign In</h2>
          <p className="text-xs text-worn-gold font-bold mt-1 font-mono-data uppercase tracking-wider">
            University Maintenance Portal
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {genericError && (
            <div className="p-3 bg-red-50 border border-red-200 text-site-orange rounded text-sm font-medium">
              {genericError}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-9 pr-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                  errors.email ? 'border-site-orange' : 'border-slate-300'
                }`}
                placeholder="name@university.edu"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-ledger-navy uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-worn-gold hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                className={`w-full pl-9 pr-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                  errors.password ? 'border-site-orange' : 'border-slate-300'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading && <div className="w-4 h-4 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />}
            <span>Sign In to Dashboard</span>
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 bg-chalk border-t border-slate-200 text-center text-xs text-ink/70">
          Need an account?{' '}
          <Link to="/register" className="text-ledger-navy font-bold hover:underline">
            Register as Student/Staff
          </Link>
        </div>
      </div>
    </div>
  );
};
