import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerWithSupabase, isSupabaseConfigured } from '../lib/api/authApi';
import { Wrench, User as UserIcon, Mail, Building, Lock } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid university email'),
    department_or_hostel: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/\d/, 'Password must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isLiveSupabase = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      if (isLiveSupabase) {
        // Real Supabase User Registration
        await registerWithSupabase(
          data.full_name,
          data.email,
          data.password,
          data.department_or_hostel
        );
        toast.success('Real user account created in Supabase! Please sign in.');
        navigate('/login');
      } else {
        // Mock User Registration
        setTimeout(() => {
          setLoading(false);
          toast.success('Account created successfully! Please sign in.');
          navigate('/login');
        }, 500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden my-8">
        <div className="bg-white p-6 text-center text-black border-b border-slate-200">
          <div className="w-12 h-12 rounded-lg bg-worn-gold text-black flex items-center justify-center font-bold mx-auto mb-3">
            <Wrench className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-black font-heading tracking-tight text-black">Create Account</h2>
          <p className="text-xs text-worn-gold font-bold mt-1 font-mono-data uppercase tracking-wider">
            {isLiveSupabase ? 'Register Real Supabase Account' : 'Student & Staff Access Only'}
          </p>
        </div>

        {/* Security Note per §2 */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs text-ink/70">
          <strong>Security Notice:</strong> All new registrations default to Student/Staff role. Officer or Admin privileges must be granted by an Administrator from the Manage Users portal.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('full_name')}
                className={`w-full pl-9 pr-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                  errors.full_name ? 'border-site-orange' : 'border-slate-300'
                }`}
                placeholder="Jane Doe"
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              University Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-9 pr-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                  errors.email ? 'border-site-orange' : 'border-slate-300'
                }`}
                placeholder="jane.doe@university.edu"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Department / Hostel */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Department or Hostel Room (Optional)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('department_or_hostel')}
                className="w-full pl-9 pr-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
                placeholder="e.g. Hall 4 - Room 102 or Computer Science Dept"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Password (Min 8 chars, 1 number) *
            </label>
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                {...register('confirm_password')}
                className={`w-full pl-9 pr-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                  errors.confirm_password ? 'border-site-orange' : 'border-slate-300'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading && <div className="w-4 h-4 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />}
            <span>Create Account</span>
          </button>
        </form>

        <div className="p-4 bg-chalk border-t border-slate-200 text-center text-xs text-ink/70">
          Already registered?{' '}
          <Link to="/login" className="text-ledger-navy font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
