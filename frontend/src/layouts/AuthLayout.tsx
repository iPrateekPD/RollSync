import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-4xl font-display font-semibold tracking-tight text-foreground">
          RollSync.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground tracking-wide">
          Enter your credentials to access the platform.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[420px]">
        <div className="bg-card py-10 px-6 shadow-sm sm:rounded-2xl sm:px-12 border border-border">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
