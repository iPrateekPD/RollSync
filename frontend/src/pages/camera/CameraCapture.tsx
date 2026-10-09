import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, FastForward, Clock } from 'lucide-react';

export const CameraCapture = () => {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<'initializing' | 'ready' | 'counting' | 'processing' | 'waiting' | 'success' | 'error' | 'finalizing' | 'completed'>('initializing');
  const [countdown, setCountdown] = useState(3);
  const [waitTimer, setWaitTimer] = useState(60);
  const [message, setMessage] = useState('Initializing camera...');
  const [results, setResults] = useState<any[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const TOTAL_FRAMES = 5;

  const [finalVerdict, setFinalVerdict] = useState<any>(null);

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
          
          // Wait 2 seconds before starting first countdown
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

  useEffect(() => {
    let timer: any;
    if (status === 'waiting') {
      if (waitTimer > 0) {
        timer = setTimeout(() => setWaitTimer(c => c - 1), 1000);
      } else {
        setCountdown(3);
        setStatus('counting');
      }
    }
    return () => clearTimeout(timer);
  }, [status, waitTimer]);

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('processing');
    setMessage(`Processing Frame ${frameIndex + 1}/${TOTAL_FRAMES}...`);

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
          setResults(prev => [...prev, data.results[0]]);
          
          if (frameIndex + 1 < TOTAL_FRAMES) {
            setFrameIndex(prev => prev + 1);
            setWaitTimer(60);
            setStatus('waiting');
          } else {
            finalizeSession();
          }
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

  const finalizeSession = async () => {
    setStatus('finalizing');
    setMessage('Finalizing Session...');
    
    try {
      const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/camera/session/${token}/finalize`, {
        method: 'POST'
      });
      
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setFinalVerdict(data);
        setStatus('completed');
      } else {
        setStatus('error');
        setMessage(data.detail || 'Error finalizing session');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to connect to RollSync server.');
    }
  };

  const skipWait = () => {
    setWaitTimer(0);
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl">
        <div className="p-6 text-center border-b border-[#E5E7EB]">
          <h1 className="text-[20px] font-bold tracking-tight text-[#111827]">RollSync Camera</h1>
          <p className="text-[14px] text-[#667085] mt-1">Live Face Recognition ({frameIndex}/{TOTAL_FRAMES})</p>
          
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: TOTAL_FRAMES }).map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 flex-1 rounded-full ${
                  idx < frameIndex ? 'bg-[#10B981]' : 
                  idx === frameIndex && status !== 'completed' ? 'bg-[#0B65FE] animate-pulse' : 
                  status === 'completed' ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="relative aspect-[3/4] bg-black">
          {status !== 'completed' && status !== 'finalizing' && (
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
              <p className="text-[18px] font-medium tracking-wide">Processing Frame...</p>
            </div>
          )}
          
          {status === 'waiting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-md p-6 text-center">
                <Clock className="w-12 h-12 mb-4 text-[#10B981]" />
                <h3 className="text-[20px] font-bold mb-2">Next capture in {waitTimer}s</h3>
                <p className="text-[14px] text-white/80 mb-6">Please keep the phone pointed towards the classroom.</p>
                <button 
                  onClick={skipWait}
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full flex items-center gap-2 text-sm backdrop-blur-sm transition-colors"
                >
                  <FastForward className="w-4 h-4" /> Skip Wait (Demo)
                </button>
            </div>
          )}

          {status === 'finalizing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white backdrop-blur-md">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#0B65FE]" />
              <p className="text-[18px] font-medium tracking-wide">Finalizing Session...</p>
            </div>
          )}

          {status === 'completed' && finalVerdict && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 overflow-y-auto">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${finalVerdict.verdict === 'Present' ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}>
                {finalVerdict.verdict === 'Present' ? (
                  <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-[#EF4444]" />
                )}
              </div>
              <h2 className="text-[24px] font-bold text-[#111827] mb-2">{finalVerdict.verdict}</h2>
              <p className="text-[14px] text-[#667085] mb-6">
                Verified {finalVerdict.verified} out of {finalVerdict.total_frames} frames.
              </p>
              
              <div className="w-full space-y-3 mt-4">
                <h3 className="text-[13px] font-bold text-[#111827] uppercase tracking-wider mb-2 text-left w-full border-b pb-2">Frame Results</h3>
                {results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-[12px] border flex items-center justify-between ${
                    r?.status === 'VERIFIED' ? 'bg-[#ECFDF5] border-[#10B981]/20' : 
                    r?.status === 'NO_FACE_DETECTED' ? 'bg-[#FFFBEB] border-[#F59E0B]/20' : 
                    'bg-[#FEF2F2] border-[#EF4444]/20'
                  }`}>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[#111827] text-[13px]">
                        Frame {i + 1}: {r?.name || 'Unknown'}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      r?.status === 'VERIFIED' ? 'text-[#065F46]' :
                      r?.status === 'NO_FACE_DETECTED' ? 'text-[#B45309]' :
                      'text-[#991B1B]'
                    }`}>
                      {r?.status === 'VERIFIED' ? 'MATCH' : r?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
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
          {status === 'ready' || status === 'counting' || status === 'waiting' || status === 'processing' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[13px] font-medium text-[#10B981]">Live Capture Active</span>
            </>
          ) : (
            <span className="text-[13px] font-medium text-[#667085]">
              {status === 'completed' ? 'Session Completed' : 'Session Stopped'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

