import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ScanLine, Radio, UserCheck, RefreshCw, BarChart2, FileText, Shield, ChevronRight, Calendar } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#111827]">
      <SEO 
        title="RollSync - Smart Attendance System" 
        description="A reliable attendance platform connecting teachers, students and smart attendance devices in one place."
        canonical="/"
      />
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4338CA] rounded-[10px] flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-[20px] font-semibold tracking-tight">RollSync</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#product" className="text-[15px] font-medium text-[#667085] hover:text-[#111827] transition-colors">Product</a>
            <a href="#features" className="text-[15px] font-medium text-[#667085] hover:text-[#111827] transition-colors">Features</a>
            <a href="#how-it-works" className="text-[15px] font-medium text-[#667085] hover:text-[#111827] transition-colors">How it Works</a>
            <a href="#security" className="text-[15px] font-medium text-[#667085] hover:text-[#111827] transition-colors">Security</a>
            <a href="#contact" className="text-[15px] font-medium text-[#667085] hover:text-[#111827] transition-colors">Contact</a>
          </nav>
          <div>
            <Link 
              to="/login"
              className="inline-flex items-center justify-center h-10 px-6 rounded-[10px] font-medium text-[14px] text-white bg-[#4338CA] hover:bg-[#3730A3] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* HERO */}
        <section className="pt-32 pb-24 px-6 lg:px-10 max-w-[1440px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFA] text-[#4338CA] text-[13px] font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
            Now supporting ESP32-S3 IoT Hardware
          </div>
          <h1 className="text-[56px] lg:text-[72px] font-semibold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
            Smart attendance.<br />Simplified.
          </h1>
          <p className="text-[20px] text-[#667085] max-w-2xl mx-auto mb-10 leading-relaxed">
            A reliable attendance platform connecting teachers, students and smart attendance devices in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-12 px-8 rounded-[12px] font-medium text-[16px] text-white bg-[#4338CA] hover:bg-[#3730A3] transition-colors w-full sm:w-auto"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-12 px-8 rounded-[12px] font-medium text-[16px] text-[#111827] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FC] transition-colors w-full sm:w-auto gap-2"
            >
              See How It Works
              <ChevronRight className="w-4 h-4 text-[#667085]" />
            </a>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-[#F8F9FC]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-[36px] font-semibold tracking-tight mb-4">How it works</h2>
              <p className="text-[18px] text-[#667085]">Five simple steps to automate your attendance.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-[16px] border border-[#E5E7EB] flex items-center justify-center shadow-subtle mb-6">
                  <Radio className="w-7 h-7 text-[#4338CA]" />
                </div>
                <h3 className="text-[18px] font-medium mb-2">1. Connect</h3>
                <p className="text-[14px] text-[#667085]">Connect the RollSync attendance device.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-[16px] border border-[#E5E7EB] flex items-center justify-center shadow-subtle mb-6">
                  <ScanLine className="w-7 h-7 text-[#4338CA]" />
                </div>
                <h3 className="text-[18px] font-medium mb-2">2. Scan</h3>
                <p className="text-[14px] text-[#667085]">Students tap their RFID cards.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-[16px] border border-[#E5E7EB] flex items-center justify-center shadow-subtle mb-6">
                  <RefreshCw className="w-7 h-7 text-[#4338CA]" />
                </div>
                <h3 className="text-[18px] font-medium mb-2">3. Sync</h3>
                <p className="text-[14px] text-[#667085]">Attendance is synced instantly over Wi-Fi.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-[16px] border border-[#E5E7EB] flex items-center justify-center shadow-subtle mb-6">
                  <BarChart2 className="w-7 h-7 text-[#4338CA]" />
                </div>
                <h3 className="text-[18px] font-medium mb-2">4. Analyze</h3>
                <p className="text-[14px] text-[#667085]">Teachers view attendance analytics.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-[16px] border border-[#E5E7EB] flex items-center justify-center shadow-subtle mb-6">
                  <FileText className="w-7 h-7 text-[#4338CA]" />
                </div>
                <h3 className="text-[18px] font-medium mb-2">5. Report</h3>
                <p className="text-[14px] text-[#667085]">Generate and export attendance reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-[36px] font-semibold tracking-tight mb-4">Everything you need</h2>
              <p className="text-[18px] text-[#667085]">A complete toolkit for modern attendance management.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <ScanLine className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">RFID Attendance</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Fast, contact-free check-ins using secure RFID technology integrated with IoT devices.</p>
              </div>
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <UserCheck className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">Student Management</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Maintain comprehensive records of students, rolls, classes, and individual histories.</p>
              </div>
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <BarChart2 className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">Attendance Analytics</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Visualize trends, daily percentages, and long-term data for actionable insights.</p>
              </div>
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <FileText className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">Reports</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Export detailed PDF and CSV reports for administrative reviews and compliance.</p>
              </div>
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <Calendar className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">Leave Management</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Streamlined leave request submissions and teacher approvals directly in the app.</p>
              </div>
              <div className="p-8 rounded-[20px] border border-[#E5E7EB] hover:shadow-subtle transition-shadow">
                <Radio className="w-8 h-8 text-[#4338CA] mb-6" />
                <h3 className="text-[20px] font-medium mb-3">Device Monitoring</h3>
                <p className="text-[15px] text-[#667085] leading-relaxed">Monitor MQTT connectivity, Wi-Fi status, and hardware health in real-time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="py-24 bg-[#111827] text-white">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 text-center">
            <Shield className="w-12 h-12 text-[#7C3AED] mx-auto mb-8" />
            <h2 className="text-[36px] font-semibold tracking-tight mb-6">Built for privacy & security</h2>
            <p className="text-[18px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Role-based access control (RBAC), secure JWT authentication, encrypted MQTT communication, and standard database encryption ensure your institution's data remains safe.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 text-center">
          <h2 className="text-[40px] font-semibold tracking-tight mb-8">Ready to simplify attendance?</h2>
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-14 px-10 rounded-[12px] font-medium text-[16px] text-white bg-[#4338CA] hover:bg-[#3730A3] transition-colors"
          >
            Get Started
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E7EB] py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4338CA] rounded-[6px] flex items-center justify-center">
              <ScanLine className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[16px] font-semibold">RollSync</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[14px] text-[#667085] font-medium">
            <a href="#" className="hover:text-[#111827]">Product</a>
            <a href="#" className="hover:text-[#111827]">Resources</a>
            <a href="#" className="hover:text-[#111827]">Legal</a>
            <a href="#" className="hover:text-[#111827]">Contact</a>
            <a href="#" className="hover:text-[#111827]">Privacy Policy</a>
            <a href="#" className="hover:text-[#111827]">Terms</a>
          </div>
          
          <div className="text-[13px] text-[#667085]">
            &copy; {new Date().getFullYear()} RollSync System.
          </div>
        </div>
      </footer>
    </div>
  );
};
