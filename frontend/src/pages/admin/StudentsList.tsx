import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

import { fetchStudentsFromDB, insertStudentToDB } from '../../api/supabase';

export const StudentsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [selectedStudentForTrain, setSelectedStudentForTrain] = useState<any>(null);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'capturing' | 'uploading' | 'success' | 'error'>('idle');
  const [trainingError, setTrainingError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const fetchStudents = async () => {
    try {
      const { data, error } = await fetchStudentsFromDB(undefined, true);
        
      if (error) {
        console.error("Supabase fetch error:", error);
        setFetchError(error.message || "Failed to fetch students");
      } else {
        setFetchError(null);
      }
        
      if (data) {
        setStudents(data.map((s: any) => ({
          id: s.id,
          studentId: s.roll_number,
          firstName: s.name,
          lastName: s.section || '',
          user: { 
            email: s.email || `${s.roll_number.toLowerCase()}.${(s.name || '').toLowerCase().replace(/\\s+/g, '')}@giet.edu` 
          },
          rfidTag: s.ug_no || 'None',
          bleMacAddress: null
        })));
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setFetchError(err.message || "Unknown error fetching students");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const studentData = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        roll_number: data.studentId.toUpperCase(),
        email: data.email,
        ug_no: data.rfidTag || null,
        section: data.lastName.toUpperCase().includes('SEC') ? data.lastName.toUpperCase() : null // Hack to allow setting section via last name for now
      };
      
      const { error } = await insertStudentToDB(studentData);
      
      if (error) {
        alert("Failed to add student: " + error.message);
      } else {
        // Refresh the students list from DB to ensure consistency
        fetchStudents();
        setIsModalOpen(false);
        reset();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTrainModal = (student: any) => {
    setSelectedStudentForTrain(student);
    setTrainModalOpen(true);
    setTrainingStatus('idle');
  };

  useEffect(() => {
    if (trainModalOpen && trainingStatus === 'idle') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setTrainingStatus('capturing');
          }
        })
        .catch(err => {
          setTrainingError("Camera access denied or unavailable.");
          setTrainingStatus('error');
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [trainModalOpen, trainingStatus]);

  const captureAndTrain = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedStudentForTrain) return;
    
    setTrainingStatus('uploading');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append('file', blob, 'train.jpg');
      
      try {
        const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/camera/enroll/${selectedStudentForTrain.id}`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setTrainingStatus('success');
        } else {
          setTrainingError(data.detail || "Failed to train face");
          setTrainingStatus('error');
        }
      } catch (err) {
        setTrainingError("Failed to connect to backend");
        setTrainingStatus('error');
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="space-y-[32px] animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Students</h1>
          <p className="mt-1 text-[15px] text-[#667085]">Manage student records, credentials, and access devices.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[10px] font-medium text-[14px] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          Error loading data: {fetchError}
        </div>
      )}

      <div className="bg-white rounded-[20px] shadow-subtle border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] bg-white">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#FFFFFF] border-none rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#667085] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none transition-shadow"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#FFFFFF]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#667085] uppercase tracking-wider">Student ID</th>
                <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#667085] uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#667085] uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#667085] uppercase tracking-wider">Access Badges</th>
                <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#667085] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#667085]">
                    {fetchError ? "Cannot load students." : "No students found."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#FFFFFF] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-[#111827]">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#111827]">
                      <div className="font-medium">{student.firstName} {student.lastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#667085]">{student.user?.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#667085]">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-md bg-[#E5F0FF] px-2 py-1 text-[12px] font-medium text-[#0B65FE]">
                          RFID: {student.rfidTag || 'None'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[14px] font-medium">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openTrainModal(student)}
                          title="Train Face"
                          className="text-[#667085] hover:text-[#10B981] p-1"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button className="text-[#667085] hover:text-[#0B65FE] p-1"><Edit2 className="w-4 h-4" /></button>
                        <button className="text-[#EF4444] hover:text-[#B91C1C] p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Student">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-1">First Name</label>
              <input {...register('firstName', { required: true })} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-1">Last Name</label>
              <input {...register('lastName', { required: true })} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-1">Email Address</label>
            <input type="email" {...register('email', { required: true })} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-1">Student ID (Roll No)</label>
            <input {...register('studentId', { required: true })} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-1">RFID Tag</label>
              <input {...register('rfidTag')} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-1">BLE MAC Address</label>
              <input {...register('bleMacAddress')} className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-[#E5E7EB] pt-5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#FFFFFF] transition-colors">
              Cancel
            </button>
            <button type="submit" className="h-10 px-4 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[10px] font-medium text-[14px] transition-colors shadow-sm">
              Save Student
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Train Face Modal */}
      <Modal isOpen={trainModalOpen} onClose={() => setTrainModalOpen(false)} title={`Train Face: ${selectedStudentForTrain?.firstName}`}>
        <div className="flex flex-col items-center">
          <p className="text-[14px] text-[#667085] mb-4 text-center">
            Position the student clearly in the frame, ensure good lighting, and click capture.
          </p>
          
          <div className="relative w-full aspect-video bg-black rounded-[12px] overflow-hidden flex items-center justify-center">
            {(trainingStatus === 'idle' || trainingStatus === 'capturing') && (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            
            <canvas ref={canvasRef} className="hidden" />
            
            {trainingStatus === 'uploading' && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span>Extracting Facial Features...</span>
              </div>
            )}
            
            {trainingStatus === 'success' && (
              <div className="absolute inset-0 bg-[#065F46] flex flex-col items-center justify-center text-white">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="font-bold">Face Trained Successfully!</span>
              </div>
            )}
            
            {trainingStatus === 'error' && (
              <div className="absolute inset-0 bg-[#991B1B] flex flex-col items-center justify-center text-white p-4 text-center">
                <span className="font-bold mb-2">Error</span>
                <span className="text-[14px]">{trainingError}</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 w-full flex justify-end gap-3">
            <button 
              onClick={() => setTrainModalOpen(false)} 
              className="h-10 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              Close
            </button>
            {trainingStatus === 'capturing' && (
              <button 
                onClick={captureAndTrain}
                className="h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-[10px] font-medium text-[14px] shadow-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture & Train
              </button>
            )}
            {trainingStatus === 'error' && (
              <button 
                onClick={() => setTrainingStatus('idle')}
                className="h-10 px-4 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[10px] font-medium text-[14px] shadow-sm"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};
