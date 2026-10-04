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
      const response = await apiClient.post('/auth/login', data);
      
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);
      
      // Redirect to the intended page or default dashboard
      const from = (location.state as any)?.from?.pathname || `/${user.role.toLowerCase()}`;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-start text-sm border border-destructive/20">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" strokeWidth={2} />
          <p>{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground">Email address</label>
        <div className="mt-2">
          <input
            {...register('email')}
            type="email"
            placeholder="name@example.com"
            className="w-full rounded-xl border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-4 py-3 bg-transparent transition-all placeholder:text-muted-foreground text-foreground"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Password</label>
        <div className="mt-2">
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-4 py-3 bg-transparent transition-all placeholder:text-muted-foreground text-foreground"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Sign in to account'
          )}
        </button>
      </div>
    </form>
  );
};
