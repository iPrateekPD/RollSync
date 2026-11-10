import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid institutional email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const response = await apiClient.post('/auth/login', data);
      const { accessToken, refreshToken, user } = response.data;

      if (user?.role !== 'TEACHER') {
        setError('This portal is available to teacher accounts only. Please contact your RollSync administrator.');
        return;
      }

      login(accessToken, refreshToken, user);
      const from = (location.state as any)?.from?.pathname;
      navigate(from?.startsWith('/teacher') ? from : '/teacher', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to sign in. Check your credentials and try again.');
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div role="alert" className="bg-[#FEE2E2] text-[#991B1B] p-4 rounded-[12px] flex items-start text-[14px]">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" strokeWidth={2} />
          <p>{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-[14px] font-medium text-[#111827] mb-1.5">Institutional email</label>
        <input
          id="email"
          {...register('email')}
          type="email"
          autoComplete="username"
          placeholder="name@university.edu"
          className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[15px] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] focus:border-transparent transition-shadow shadow-sm"
        />
        {errors.email && <p className="mt-1.5 text-[13px] text-[#EF4444]">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-[14px] font-medium text-[#111827] mb-1.5">Password</label>
        <input
          id="password"
          {...register('password')}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[15px] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] focus:border-transparent transition-shadow shadow-sm"
        />
        {errors.password && <p className="mt-1.5 text-[13px] text-[#EF4444]">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center h-11 px-4 rounded-[10px] text-[15px] font-medium text-white bg-[#0B65FE] hover:bg-[#004BCC] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to RollSync'}
      </button>

      <p className="text-center text-[13px] text-[#667085]">
        Teacher accounts are issued by your RollSync administrator. Self-registration is disabled.
      </p>
    </form>
  );
};
