import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const CameraCapture = () => {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<'initializing' | 'ready' | 'counting' | 'processing' | 'success' | 'error'>('initializing');
  const [countdown, setCountdown] = useState(3);
  const [message, setMessage] = useState('Initializing camera...');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    // Start camera stream
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('ready');
          setMessage('Camera Ready');
          
          // Wait 2 seconds before starting countdown to let user position themselves
          setTimeout(() => {
            setStatus('counting');
          }, 2000);
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Camera permission denied or unavailable.');
      }
    };

    startCamera();

    return () => {
      // Clean up camera stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [token]);

  useEffect(() => {
    let timer: any;
    if (status === 'counting') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        captureAndUpload();
      }
    }
    return () => clearTimeout(timer);
  }, [status, countdown]);

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('processing');
    setMessage('Processing Image...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Draw current frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');
      
      try {
        const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/camera/session/${token}/frame`, {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await res.json();
        if (data.status === 'success') {
          setStatus('success');
          setResults(data.results);
          setMessage('Attendance Processed!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Error processing attendance');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to connect to RollSync server.');
      }
      
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl">
        <div className="p-6 text-center border-b border-[#E5E7EB]">
          <h1 className="text-[20px] font-bold tracking-tight text-[#111827]">RollSync Camera</h1>
          <p className="text-[14px] text-[#667085] mt-1">Live Face Recognition</p>
        </div>
        
        <div className="relative aspect-[3/4] bg-black">
          {status !== 'success' && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${status === 'processing' ? 'opacity-50 blur-sm' : ''}`}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlays */}
          {status === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Starting Camera...</p>
            </div>
          )}
          
          {status === 'counting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                <span className="text-[64px] font-bold text-white">{countdown}</span>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-md">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-[18px] font-medium tracking-wide">Processing Faces...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6">
              <CheckCircle2 className="w-16 h-16 text-[#10B981] mb-4" />
              <h2 className="text-[24px] font-bold text-[#111827] mb-6">Faces Processed</h2>
              
              <div className="w-full space-y-3">
                {results.map((r, i) => (
                  <div key={i} className={`p-4 rounded-[12px] border flex items-center justify-between ${
                    r.status === 'VERIFIED' ? 'bg-[#ECFDF5] border-[#10B981]/20' : 
                    r.status === 'NO_FACE_DETECTED' ? 'bg-[#FFFBEB] border-[#F59E0B]/20' : 
                    'bg-[#FEF2F2] border-[#EF4444]/20'
                  }`}>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[#111827]">
                        {r.name || 'Unknown Person'}
                      </span>
                      {r.roll_number && (
                        <span className="text-[12px] text-[#667085]">{r.roll_number}</span>
                      )}
                    </div>
                    <span className={`text-[13px] font-bold uppercase tracking-wider ${
                      r.status === 'VERIFIED' ? 'text-[#065F46]' :
                      r.status === 'NO_FACE_DETECTED' ? 'text-[#B45309]' :
                      'text-[#991B1B]'
                    }`}>
                      {r.status === 'VERIFIED' ? 'PRESENT' : r.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-center p-6">
              <AlertCircle className="w-16 h-16 text-[#EF4444] mb-4" />
              <p className="text-[16px] text-[#111827] font-medium">{message}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-[#F9FAFB] flex items-center justify-center gap-2">
          {status === 'ready' || status === 'counting' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[13px] font-medium text-[#10B981]">Live Capture Active</span>
            </>
          ) : (
            <span className="text-[13px] font-medium text-[#667085]">
              {status === 'success' ? 'Session Completed' : 'Waiting...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
