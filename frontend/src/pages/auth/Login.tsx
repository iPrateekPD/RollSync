import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
      
      // Mock login for demo purposes
      if (data.email.startsWith('demo_')) {
        const teacherName = data.email.replace('demo_', '').replace('@rollsync.com', '');
        const mockUser = {
          id: `mock-${teacherName}`,
          email: data.email,
          role: 'TEACHER' as const,
          firstName: teacherName.split(' ').slice(0, -1).join(' '),
          lastName: teacherName.split(' ').slice(-1)[0]
        };
        login('mock-access-token', 'mock-refresh-token', mockUser);
        navigate('/teacher', { replace: true });
        return;
      }
      
      const response = await apiClient.post('/auth/login', data);
      
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);
      
      const from = (location.state as any)?.from?.pathname || `/${user.role.toLowerCase()}`;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="bg-[#FEE2E2] text-[#991B1B] p-4 rounded-[12px] flex items-start text-[14px]">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" strokeWidth={2} />
          <p>{error}</p>
        </div>
      )}

      <div>
        <label className="block text-[14px] font-medium text-[#111827] mb-1.5">Email address</label>
        <input
          {...register('email')}
          type="email"
          placeholder="teacher@rollsync.com"
          className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[15px] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] focus:border-transparent transition-shadow shadow-sm"
        />
        {errors.email && (
          <p className="mt-1.5 text-[13px] text-[#EF4444]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-[14px] font-medium text-[#111827] mb-1.5">Password</label>
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[15px] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] focus:border-transparent transition-shadow shadow-sm"
        />
        {errors.password && (
          <p className="mt-1.5 text-[13px] text-[#EF4444]">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded border-[#E5E7EB] text-[#0B65FE] focus:ring-[#0B65FE]" />
          <span className="text-[14px] text-[#667085] group-hover:text-[#111827] transition-colors">Remember me</span>
        </label>
        <a href="#" className="text-[14px] font-medium text-[#0B65FE] hover:text-[#004BCC] transition-colors">
          Forgot password?
        </a>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center h-11 px-4 border border-transparent rounded-[10px] shadow-sm text-[15px] font-medium text-white bg-[#0B65FE] hover:bg-[#004BCC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B65FE] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-[13px] text-[#667085]">Demo access</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSubmit({ email: 'demo_Dr. Jitendra Kumar@rollsync.com', password: 'password123' })}
          className="w-full flex justify-center items-center h-11 px-4 border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] transition-colors"
        >
          Demo: Dr. Jitendra Kumar
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ email: 'demo_Dr. Saran Srihari Sripada Panda@rollsync.com', password: 'password123' })}
          className="w-full flex justify-center items-center h-11 px-4 border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] transition-colors"
        >
          Demo: Dr. Saran Srihari
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ email: 'demo_Dr. Ami Kumar Parida@rollsync.com', password: 'password123' })}
          className="w-full flex justify-center items-center h-11 px-4 border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#0B65FE] transition-colors"
        >
          Demo: Dr. Ami Kumar Parida
        </button>
      </div>
    </form>
  );
};
