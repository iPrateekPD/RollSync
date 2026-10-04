import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ShieldCheck, Calendar, Activity } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SEO 
        title="Smart AI Attendance & College ERP" 
        description="RollSync provides modern college administration with AI-powered attendance, timetable management, and seamless communication."
        canonical="/"
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 font-outfit">RollSync</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight font-outfit mb-6">
              The Future of Campus Administration
            </h1>
            <p className="mt-4 text-xl text-gray-600 mb-10 leading-relaxed">
              RollSync integrates smart IoT attendance tracking with a complete college ERP platform, bringing unprecedented automation to your institution.
            </p>
            <div className="flex justify-center gap-4 flex-col sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
              >
                Access Portal
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-blue-600 flex items-center justify-center mb-4 bg-blue-50 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Attendance</h3>
                <p className="text-gray-600 leading-relaxed">Dual-verification using BLE and RFID ensures highly accurate and secure automated roll calls.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-blue-600 flex items-center justify-center mb-4 bg-blue-50 rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Timetables</h3>
                <p className="text-gray-600 leading-relaxed">Dynamic class scheduling with instant notifications for room changes and substitution.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-blue-600 flex items-center justify-center mb-4 bg-blue-50 rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600 leading-relaxed">Comprehensive dashboards providing actionable insights for admins, teachers, and students.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Activity className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white font-outfit">RollSync</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} RollSync Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
