import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const DemoCamera = () => {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'counting' | 'processing' | 'waiting' | 'error' | 'completed'>('initializing');
  const [countdown, setCountdown] = useState(3);
  const [waitTimer, setWaitTimer] = useState(10);
  const [message, setMessage] = useState('Initializing camera...');
  const [frameIndex, setFrameIndex] = useState(0);
  const TOTAL_FRAMES = 5;

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`/api/demo/session/${token}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          setStatus('error');
          setMessage('Invalid demo link');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error');
      }
    };
    loadSession();
  }, [token]);

  useEffect(() => {
    if (!session || status === 'error') return;

    // Start camera stream
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('ready');
          setMessage('Camera Ready');
          
          setTimeout(() => {
            setStatus('counting');
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Camera permission denied or unavailable.');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [session]);

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
    if (!videoRef.current || !canvasRef.current || !session) return;
    
    setStatus('processing');
    setMessage(`Processing Frame ${frameIndex + 1}/${TOTAL_FRAMES}...`);

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
      formData.append('file', blob, 'capture.jpg');
      
      try {
        // Post to FastAPI camera backend
        const API_BASE = import.meta.env.VITE_CAMERA_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/camera/demo/session/${token}/frame?capture_number=${frameIndex + 1}`, {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          console.error("Frame capture failed");
        }
        
        if (frameIndex + 1 < TOTAL_FRAMES) {
          setFrameIndex(prev => prev + 1);
          setWaitTimer(10);
          setStatus('waiting');
        } else {
          finalizeSession();
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error connecting to camera server.');
      }
      
    }, 'image/jpeg', 0.8);
  };

  const finalizeSession = async () => {
    setMessage('Finalizing Session...');
    
    try {
      // Complete via Node backend
      const res = await fetch(`/api/demo/session/${session.id}/complete`, {
        method: 'POST'
      });
      
      if (res.ok) {
        setStatus('completed');
        setMessage('Processing Complete');
      } else {
        setStatus('error');
        setMessage('Error finalizing session.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to complete session.');
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Camera Error</h1>
        <p className="text-gray-400 text-center">{message}</p>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Demo Complete</h1>
        <p className="text-gray-400 text-center mb-8">
          The teacher has been notified on their dashboard. You may close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start">
        <div>
          <div className="text-white font-bold text-lg">AI Demo Camera</div>
          <div className="text-white/70 text-sm font-medium">Session: SEC B • RDB 6</div>
        </div>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">
            {frameIndex}/{TOTAL_FRAMES}
          </span>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full max-w-2xl mx-auto flex items-center justify-center bg-gray-900">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlays */}
        {status === 'counting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
            <div className="text-[120px] font-bold text-white tracking-tighter drop-shadow-2xl animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {(status === 'processing' || status === 'initializing' || status === 'ready') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 transition-all duration-300">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
              <p className="text-white font-medium text-lg">{message}</p>
            </div>
          </div>
        )}

        {status === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
            <div className="text-center">
              <div className="text-white text-xl font-medium mb-2">Next capture in</div>
              <div className="text-6xl font-bold text-white font-mono">{waitTimer}s</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
