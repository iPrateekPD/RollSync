import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { AlertCircle } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <SEO 
        title="Page Not Found" 
        description="The page you are looking for does not exist or has been moved."
      />
      
      <div className="max-w-md w-full text-center px-4">
        <div className="mx-auto h-20 w-20 text-blue-600 mb-8 bg-blue-50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 font-outfit mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page not found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Return to Homepage
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Go to Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
