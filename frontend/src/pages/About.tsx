import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Activity } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SEO 
        title="About Us" 
        description="Learn more about RollSync, our mission, and the technology powering the next generation of smart college ERP systems."
        canonical="/about"
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 font-outfit">RollSync</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-blue-600 transition-colors font-medium">About</Link>
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

      {/* Main Content */}
      <main className="flex-grow py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-outfit mb-8">
            About RollSync
          </h1>
          
          <div className="prose prose-blue prose-lg max-w-none text-gray-600">
            <p>
              RollSync was created to solve the persistent challenges in modern college administration. Manual attendance tracking is time-consuming and prone to errors, while traditional ERP systems remain fragmented and difficult to use.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>
            <p>
              We aim to eliminate administrative overhead so educators can focus on teaching. By combining intelligent IoT hardware with modern, cloud-based software, RollSync automates the most tedious aspects of campus management.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">The Technology</h2>
            <p>
              Our dual-verification attendance system uses a combination of secure RFID scanning and ambient BLE (Bluetooth Low Energy) detection. This ensures unparalleled accuracy, preventing proxy attendance while remaining entirely frictionless for students. The entire system is built on scalable, high-performance architecture guaranteeing real-time updates across all administrative dashboards.
            </p>
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
