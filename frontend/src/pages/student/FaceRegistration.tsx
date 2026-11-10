import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';

type Pose = 'front' | 'left' | 'right' | 'up' | 'down';
const POSES: Pose[] = ['front', 'left', 'right', 'up', 'down'];
const API_BASE = (import.meta.env.VITE_CAMERA_API_URL || '').replace(/\/$/, '');

const instructions: Record<Pose, string> = {
  front: 'Look straight at the camera',
  left: 'Turn your head slightly to the left',
  right: 'Turn your head slightly to the right',
  up: 'Tilt your head slightly up',
  down: 'Tilt your head slightly down'
};

export const FaceRegistration = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'success' | 'error'>('idle');
  const [poseIndex, setPoseIndex] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [captureCount, setCaptureCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    apiClient.get(`/students/${user.id}/dashboard`)
      .then(response => setHasProfile(Boolean(response.data.faceRegistered)))
      .catch(() => setHasProfile(false));
  }, [user?.id]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const startCamera = async () => {
    setError('');
    capturesRef.current = [];
    setCaptureCount(0);
    setPoseIndex(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost and a supported browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setStatus('capturing');
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setError(err.message || 'Could not access the camera.');
      setStatus('error');
    }
  };

  const submitCaptures = async (images: Blob[]) => {
    if (!user?.id) throw new Error('Please sign in again before registering your face.');
    if (!API_BASE) throw new Error('VITE_CAMERA_API_URL is not configured for the AI camera service.');

    setStatus('uploading');
    stopCamera();

    // Ask the authenticated Node API for a short-lived token bound to this student's own record.
    const tokenResponse = await apiClient.post('/face-enrollment/token', { studentId: user.id });
    const enrollmentToken = tokenResponse.data?.token;
    if (!enrollmentToken) throw new Error('The backend did not issue an enrollment token.');

    const form = new FormData();
    form.append('token', enrollmentToken);
    images.forEach((blob, index) => form.append('files', blob, `face-pose-${index + 1}.jpg`));

    const response = await fetch(`${API_BASE}/api/camera/enroll`, { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || 'Face registration failed.');

    setHasProfile(true);
    setStatus('success');
  };

  const capturePose = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError('Camera is not ready yet. Please wait a moment.');
      return;
    }
    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Could not prepare the captured image.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture this pose.')), 'image/jpeg', 0.86);
    });

    const nextImages = [...capturesRef.current, blob];
    capturesRef.current = nextImages;
    setCaptureCount(nextImages.length);
    if (nextImages.length === POSES.length) {
      try {
        await submitCaptures(nextImages);
      } catch (err: any) {
        setError(err.message || 'Face registration failed.');
        setStatus('error');
      }
    } else {
      setPoseIndex(nextImages.length);
    }
  };

  const reset = () => {
    stopCamera();
    capturesRef.current = [];
    setCaptureCount(0);
    setPoseIndex(0);
    setError('');
    setStatus('idle');
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Face Registration</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Register your face once for classroom attendance recognition.</p>
      </div>

      {hasProfile && status === 'idle' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Face profile already registered</p>
            <p className="text-sm text-emerald-700">You can re-register if your profile needs updating.</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Capture instructions</h2>
            <p className="mt-1 text-sm text-[#667085]">Capture five clear images. Keep your face inside the guide and follow each pose.</p>
          </div>
          <ol className="space-y-3 text-sm text-[#4B5563]">
            {POSES.map((pose, index) => (
              <li key={pose} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${index < captureCount ? 'bg-emerald-100 text-emerald-700' : index === poseIndex && status === 'capturing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {index < captureCount ? '✓' : index + 1}
                </span>
                <span>{instructions[pose]}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            Use good lighting, remove sunglasses and keep only your face in the frame. The images are processed to create one numerical face profile; the uploaded photographs are not saved as profile images.
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-950">
            {status === 'capturing' ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[65%] w-[58%] rounded-[45%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute bottom-4 left-3 right-3 rounded-full bg-black/70 px-3 py-2 text-center text-sm font-medium text-white">
                  {instructions[POSES[poseIndex]]}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                {status === 'uploading' ? <Loader2 className="h-12 w-12 animate-spin text-blue-400" /> :
                 status === 'success' ? <CheckCircle2 className="h-14 w-14 text-emerald-400" /> :
                 <Camera className="h-14 w-14 text-blue-300" />}
                <p className="text-lg font-semibold">
                  {status === 'uploading' ? 'Creating face profile…' : status === 'success' ? 'Registration complete!' : status === 'error' ? 'Registration needs retry' : 'Ready to register'}
                </p>
                <p className="text-sm text-slate-300">
                  {status === 'uploading' ? 'InsightFace is processing your five captures.' : status === 'success' ? 'Your face embedding has been saved successfully.' : 'The camera starts only when you press Start Camera.'}
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {status === 'idle' || status === 'error' ? (
            <button onClick={startCamera} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B65FE] py-3 font-medium text-white hover:bg-[#004BCC]">
              <Camera className="h-5 w-5" /> {status === 'error' ? 'Try Again' : hasProfile ? 'Re-register Face' : 'Start Camera'}
            </button>
          ) : status === 'capturing' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#667085]"><span>Capture progress</span><span>{captureCount} / 5</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-blue-600 transition-all" style={{ width: `${captureCount * 20}%` }} /></div>
              <button onClick={capturePose} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B65FE] py-3 font-medium text-white hover:bg-[#004BCC]">
                <Camera className="h-5 w-5" /> Capture {POSES[poseIndex]}
              </button>
              <button onClick={reset} className="w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600">Cancel</button>
            </div>
          ) : status === 'success' ? (
            <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-medium text-gray-700">
              <RotateCcw className="h-4 w-4" /> Done
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500">Please keep this page open while processing.</p>
          )}
        </div>
      </div>
    </div>
  );
};
