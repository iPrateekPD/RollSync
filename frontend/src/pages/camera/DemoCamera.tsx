import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Camera, CheckCircle2, Loader2, ShieldCheck, Wifi } from 'lucide-react';

type CameraStatus = 'loading' | 'ready' | 'starting' | 'capturing' | 'uploading' | 'waiting' | 'completed' | 'error';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const CAMERA_API = (import.meta.env.VITE_CAMERA_API_URL || '').replace(/\/$/, '');
const TOTAL_FRAMES = 5;
const CAPTURE_INTERVAL_MS = 10_000;

export const DemoCamera = () => {
  const { token } = useParams<{ token: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);

  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<CameraStatus>('loading');
  const [message, setMessage] = useState('Checking your camera link…');
  const [frameIndex, setFrameIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/demo/session/${token}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This camera link is invalid or unavailable.');
        if (!cancelled) {
          setSession(data);
          setStatus('ready');
          setMessage('Your camera link is ready.');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to verify this camera link.');
          setStatus('error');
        }
      }
    };
    if (token) loadSession();
    return () => { cancelled = true; stopCamera(); };
  }, [token, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const uploadFrame = async (captureNumber: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !CAMERA_API) {
      throw new Error('Camera AI service is not configured yet. Please contact the teacher.');
    }
    if (!video.videoWidth || !video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      throw new Error('Camera is not ready. Please wait a moment and try again.');
    }

    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare the camera frame.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture image.')), 'image/jpeg', 0.78);
    });
    const form = new FormData();
    form.append('file', blob, `rollsync-frame-${captureNumber}.jpg`);

    const response = await fetch(`${CAMERA_API}/api/camera/demo/session/${token}/frame?capture_number=${captureNumber}`, {
      method: 'POST',
      body: form
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || 'Frame upload failed.');
    return data;
  };

  const startCapture = async () => {
    if (!session || !token) return;
    if (!CAMERA_API) {
      setError('The AI camera service URL has not been configured on the RollSync frontend yet.');
      setStatus('error');
      return;
    }

    try {
      setStatus('starting');
      setMessage('Starting your camera…');

      const startResponse = await fetch(`${API_BASE}/demo/session/${token}/start`, { method: 'POST' });
      const startData = await startResponse.json().catch(() => ({}));
      if (!startResponse.ok) throw new Error(startData.error || 'The teacher session could not be started.');

      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
      stoppedRef.current = false;
      setCountdown(3);
      setStatus('capturing');
      setMessage('Camera connected. Keep it steady and point it towards the classroom.');

      for (let frame = 1; frame <= TOTAL_FRAMES; frame += 1) {
        if (stoppedRef.current) return;
        setFrameIndex(frame - 1);
        setStatus('capturing');
        setCountdown(3);
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (stoppedRef.current) return;
        setStatus('uploading');
        setMessage(`Sending frame ${frame} of ${TOTAL_FRAMES} securely for processing…`);
        await uploadFrame(frame);
        setFrameIndex(frame);
        if (frame < TOTAL_FRAMES) {
          setStatus('waiting');
          setMessage('Frame received. Preparing the next capture…');
          await new Promise(resolve => setTimeout(resolve, CAPTURE_INTERVAL_MS));
        }
      }

      setMessage('Finishing the camera session…');
      const completeResponse = await fetch(`${API_BASE}/demo/session/${session.id}/complete`, { method: 'POST' });
      const completeData = await completeResponse.json().catch(() => ({}));
      if (!completeResponse.ok) throw new Error(completeData.error || 'Could not finish the camera session.');

      setStatus('completed');
      setMessage('All frames were sent. You can close this page.');
      stopCamera();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while using the camera.');
      setStatus('error');
      stopCamera();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">RollSync Camera</p>
            <p className="text-xs text-slate-400">Single-camera classroom demo</p>
          </div>
          <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">Camera device</span>
        </header>

        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {status === 'loading' || status === 'starting' || status === 'uploading' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-blue-400" />
              <p className="px-6 text-sm text-slate-200">{message}</p>
            </div>
          ) : null}
          {status === 'capturing' ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold">
              Capture {Math.min(frameIndex + 1, TOTAL_FRAMES)} / {TOTAL_FRAMES}
            </div>
          ) : null}
          {status === 'completed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/90">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <p className="text-xl font-semibold">Camera session complete</p>
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-rose-400" />
              <p className="font-semibold">Unable to continue</p>
              <p className="text-sm text-slate-300">{error}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Wifi className="h-4 w-4" />
            <span>{session?.classroom || 'Classroom'} · {session?.section || 'Attendance session'}</span>
          </div>

          {status === 'ready' ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="mb-2 flex items-center gap-2 font-medium text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Before you start</div>
                Keep this phone plugged in if possible, allow camera access, and point the rear camera towards the classroom. Images are sent to RollSync for processing; the page does not save them to your gallery.
              </div>
              <button onClick={startCapture} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500">
                <Camera className="h-5 w-5" /> Enable camera and start
              </button>
            </>
          ) : null}

          {status === 'capturing' || status === 'waiting' || status === 'uploading' ? (
            <div className="rounded-xl bg-blue-400/10 p-3 text-sm text-blue-200">{message}</div>
          ) : null}
          {status === 'completed' ? <p className="text-center text-sm text-emerald-300">{message}</p> : null}
          {status === 'error' ? <button onClick={() => window.location.reload()} className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15">Reload camera link</button> : null}
          <p className="text-center text-[11px] leading-relaxed text-slate-500">Camera access starts only after you tap the button. Keep the page open until all five frames have been sent.</p>
        </div>
      </section>
    </main>
  );
};
