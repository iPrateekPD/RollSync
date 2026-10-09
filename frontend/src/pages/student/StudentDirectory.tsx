import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Loader2, User, BookOpen, Fingerprint, Mail, Building, Hash } from 'lucide-react';

interface StudentProfile {
  id: string;
  roll_number: string;
  ug_no: string | null;
  name: string;
  email: string | null;
  department: string | null;
  semester: number | null;
  section: string | null;
}

export const StudentDirectory = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      apiClient.get(`/students/${user.id}`)
        .then(res => {
          setProfile(res.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load profile', err);
          setError('We couldn\'t load your profile details.');
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B65FE]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <p>{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Academic Profile</h1>
        <p className="mt-1 text-[15px] text-[#667085]">View your identity and academic registration details.</p>
      </div>

      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-[#E5E7EB]">
          <div className="w-24 h-24 bg-[#F3F4F6] text-[#9CA3AF] rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-[#111827]">{profile.name}</h2>
            <p className="text-[15px] text-[#667085] mt-1">{profile.roll_number}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-[#E5F0FF] text-[#0B65FE]">
                Active Student
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                {profile.department || 'General'} Dept
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
          <div className="space-y-6">
            <h3 className="text-[14px] font-bold tracking-wider text-[#9CA3AF] uppercase">Registration Info</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#667085] shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#667085]">Roll Number</p>
                <p className="text-[15px] font-medium text-[#111827] mt-0.5">{profile.roll_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#667085] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#667085]">Academic Status</p>
                <p className="text-[15px] font-medium text-[#111827] mt-0.5">
                  Semester {profile.semester || 'N/A'} • {profile.section || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#667085] shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#667085]">Department</p>
                <p className="text-[15px] font-medium text-[#111827] mt-0.5">{profile.department || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[14px] font-bold tracking-wider text-[#9CA3AF] uppercase">Contact & Credentials</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#667085] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#667085]">University Email</p>
                <p className="text-[15px] font-medium text-[#111827] mt-0.5">{profile.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#667085] shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#667085]">RFID Smart Card (UG No)</p>
                <p className="text-[15px] font-medium text-[#111827] mt-0.5">{profile.ug_no || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
