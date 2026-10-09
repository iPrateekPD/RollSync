import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, CheckCircle2, AlertCircle, Loader2, Info, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';

type Pose = 'front' | 'left' | 'right' | 'up' | 'down';
const REQUIRED_POSES: Pose[] = ['front', 'left', 'right'];
const OPTIONAL_POSES: Pose[] = ['up', 'down'];

export const FaceRegistration = () => {
  const { user } = useAuth();
  
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'capturing' | 'uploading' | 'success' | 'error'>('idle');
  const [trainingError, setTrainingError] = useState('');
  const [hasExistingProfile, setHasExistingProfile] = useState<boolean | null>(null);
  
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<Pose, Blob | null>>({
    front: null, left: null, right: null, up: null, down: null
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const allPoses = [...REQUIRED_POSES, ...OPTIONAL_POSES];
  const currentPose = allPoses[currentPoseIndex];

  useEffect(() => {
    if (user?.id) {
      apiClient.get(`/students/${user.id}/dashboard`)
        .then(res => {
          setHasExistingProfile(res.data.faceRegistered);
        })
        .catch(err => console.error("Failed to fetch profile status", err));
    }
  }, [user]);

  const startCamera = () => {
    if (trainingStatus === 'idle') {
      setTrainingStatus('capturing');
      setCurrentPoseIndex(0);
      setCapturedImages({ front: null, left: null, right: null, up: null, down: null });
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera error:", err);
          setTrainingError("Camera access denied or unavailable.");
          setTrainingStatus('error');
        });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (trainingStatus === 'capturing' || trainingStatus === 'error') {
      setTrainingStatus('idle');
    }
  };

  useEffect(() => {
    return stopCamera;
  }, []);

  const capturePose = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImages(prev => ({ ...prev, [currentPose]: blob }));
        
        // Move to next pose or submit
        if (currentPoseIndex < allPoses.length - 1) {
            setCurrentPoseIndex(prev => prev + 1);
        } else {
            submitAll();
        }
      }
    }, 'image/jpeg', 0.8);
  };

  const submitAll = async () => {
    if (!user?.id) return;
    setTrainingStatus('uploading');
    stopCamera();
    
    const formData = new FormData();
    Object.entries(capturedImages).forEach(([pose, blob]) => {
      if (blob) {
        formData.append(pose, blob, `${pose}.jpg`);
      }
    });
    
    try {
      const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/camera/enroll/${user.id}/advanced`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTrainingStatus('success');
        setHasExistingProfile(true);
      } else {
        setTrainingError(data.detail || "Failed to train face. Please ensure you are looking clearly at the camera.");
        setTrainingStatus('error');
      }
    } catch (err) {
      console.error("Backend connection error:", err);
      setTrainingError("Failed to connect to AI backend.");
      setTrainingStatus('error');
    }
  };

  const skipOptional = () => {
    // If we are on an optional pose, we can just submit what we have
    submitAll();
  };

  const getPoseInstruction = (pose: Pose) => {
    switch(pose) {
        case 'front': return "Look straight at the camera";
        case 'left': return "Turn your head slightly to the left";
        case 'right': return "Turn your head slightly to the right";
        case 'up': return "Tilt your head slightly up (Optional)";
        case 'down': return "Tilt your head slightly down (Optional)";
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Face Registration</h1>
        <p className="mt-1 text-[15px] text-[#667085]">
          Register or update your biometric face profile for automated attendance.
        </p>
      </div>

      {hasExistingProfile && trainingStatus === 'idle' && (
        <div className="bg-[#ECFDF5] p-6 rounded-[20px] border border-[#10B981]/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#065F46]">Face Profile Active</h3>
            <p className="text-[14px] text-[#064E3B] mt-1">
              You have successfully registered your face. You can use the classroom cameras for automatic attendance verification.
            </p>
            <button 
              onClick={startCamera}
              className="mt-4 text-[14px] font-medium text-[#10B981] hover:text-[#059669] px-4 py-2 border border-[#10B981] rounded-lg transition-colors"
            >
              Re-register Face Profile
            </button>
          </div>
        </div>
      )}

      {(!hasExistingProfile || trainingStatus !== 'idle') && (
        <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-[#E5E7EB]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Guidelines Column */}
            <div className="space-y-6">
              <div>
                <h2 className="text-[18px] font-semibold text-[#111827] mb-2">Registration Guidelines</h2>
                <p className="text-[14px] text-[#667085]">
                  To ensure accurate attendance tracking, we will capture your face from multiple angles.
                </p>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Ensure you are in a well-lit environment.",
                  "Remove sunglasses or heavy face coverings.",
                  "Follow the on-screen prompts for each pose."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center shrink-0 text-[12px] font-medium mt-0.5">
                      {i + 1}
                    </div>
                    <span className="text-[14px] text-[#4B5563]">{item}</span>
                  </li>
                ))}
              </ul>

              {trainingStatus === 'capturing' && (
                <div className="mt-8">
                    <h3 className="text-[14px] font-semibold text-gray-700 mb-3">Progress</h3>
                    <div className="flex gap-2 mb-2">
                        {allPoses.map((p, idx) => (
                            <div 
                                key={p} 
                                className={`h-2 flex-1 rounded-full ${idx < currentPoseIndex ? 'bg-[#10B981]' : idx === currentPoseIndex ? 'bg-[#0B65FE]' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                    <p className="text-[13px] font-medium text-gray-600">
                        {currentPoseIndex + 1} of {allPoses.length}: {getPoseInstruction(currentPose)}
                    </p>
                </div>
              )}
              
              <div className="bg-[#FFFBEB] p-4 rounded-xl border border-[#F59E0B]/20 flex gap-3">
                <Info className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <p className="text-[13px] text-[#B45309] leading-relaxed">
                  Your biometric data is encrypted and securely stored. It will only be used for the purpose of attendance verification within the RollSync system.
                </p>
              </div>
            </div>

            {/* Camera Column */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[320px] aspect-[3/4] bg-[#F9FAFB] rounded-[24px] overflow-hidden border-2 border-dashed border-[#D1D5DB] flex flex-col items-center justify-center">
                
                {trainingStatus === 'idle' ? (
                  <div className="flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 bg-[#E5F0FF] rounded-full flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-[#0B65FE]" />
                    </div>
                    <h3 className="text-[16px] font-medium text-[#111827] mb-2">Ready to Capture</h3>
                    <p className="text-[13px] text-[#667085] mb-6">Click below to start your camera and begin the multi-angle registration.</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-2.5 bg-[#0B65FE] text-white text-[14px] font-medium rounded-xl hover:bg-[#004BCC] transition-colors shadow-sm"
                    >
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <>
                    {(trainingStatus === 'capturing' || trainingStatus === 'error') && (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                    )}
                    
                    {/* Face Guide Overlay */}
                    {trainingStatus === 'capturing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-[60%] aspect-[3/4] border-2 border-white/80 rounded-[40%] animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] relative">
                                <div className="absolute -bottom-10 left-0 right-0 text-center">
                                    <span className="bg-black/70 text-white text-[12px] px-3 py-1 rounded-full font-medium">
                                        {getPoseInstruction(currentPose)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {trainingStatus === 'uploading' && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-[#0B65FE] mb-4" />
                        <h3 className="text-[16px] font-medium">Processing Profile...</h3>
                        <p className="text-[13px] text-white/70 mt-2">Extracting facial features from {Object.values(capturedImages).filter(Boolean).length} poses.</p>
                      </div>
                    )}

                    {trainingStatus === 'success' && (
                      <div className="absolute inset-0 bg-[#10B981]/90 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-md">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                        </div>
                        <h3 className="text-[18px] font-semibold">Success!</h3>
                        <p className="text-[14px] text-white/90 mt-2">Your multi-angle face profile is registered.</p>
                      </div>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {trainingStatus === 'capturing' && (
                <div className="flex flex-col items-center gap-3 mt-6 w-full max-w-[320px]">
                  <button
                    onClick={capturePose}
                    className="w-full py-3 bg-[#0B65FE] text-white text-[15px] font-medium rounded-xl hover:bg-[#004BCC] transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    <Camera className="w-5 h-5" /> 
                    Capture {currentPose.charAt(0).toUpperCase() + currentPose.slice(1)}
                  </button>
                  
                  <div className="flex w-full gap-3">
                      <button
                        onClick={stopCamera}
                        className="flex-1 py-2 bg-white border border-[#D1D5DB] text-[#4B5563] text-[13px] font-medium rounded-xl hover:bg-[#F9FAFB] transition-colors"
                      >
                        Cancel
                      </button>
                      
                      {OPTIONAL_POSES.includes(currentPose) && (
                          <button
                            onClick={skipOptional}
                            className="flex-1 py-2 bg-[#F3F4F6] text-[#4B5563] text-[13px] font-medium rounded-xl hover:bg-[#E5E7EB] transition-colors flex justify-center items-center gap-1"
                          >
                            Skip <ChevronRight className="w-4 h-4" />
                          </button>
                      )}
                  </div>
                </div>
              )}

              {trainingStatus === 'error' && (
                <div className="mt-6 w-full max-w-[320px]">
                  <div className="bg-[#FEF2F2] border border-[#EF4444]/20 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-medium text-[#991B1B]">Registration Failed</p>
                      <p className="text-[12px] text-[#B91C1C] mt-1">{trainingError}</p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={startCamera}
                      className="px-6 py-2 bg-white border border-[#D1D5DB] text-[#4B5563] text-[13px] font-medium rounded-lg hover:bg-[#F9FAFB]"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

