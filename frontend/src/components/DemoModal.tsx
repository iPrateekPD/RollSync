import { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Loader2, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal = ({ isOpen, onClose }: DemoModalProps) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      startDemo();
    } else {
      setSession(null);
      setPolling(false);
    }
  }, [isOpen]);

  const startDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/demo/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.session) {
          setSession(data.session);
          setPolling(true);
        } else {
          throw new Error(data.error || 'Failed to start demo');
        }
      } else {
        setSession(data);
        setPolling(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (polling && session) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/demo/session', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setSession(data);
              if (data.status === 'review_ready') {
                setPolling(false);
              }
            }
          }
        } catch (err) {
          // silent
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, session]);

  if (!isOpen) return null;

  const url = `${window.location.origin}/camera/demo/${session?.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reviewAttendance = () => {
    onClose();
    navigate('/teacher/attendance', { state: { demoSessionId: session.id } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI Camera Demo</h2>
          <p className="text-sm text-gray-500 mb-6">SEC B • RDB 6 • 3 Minutes</p>

          {loading && !session ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-600">Creating session...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Status Indicator */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  session.status === 'waiting' ? 'bg-amber-100 text-amber-700' :
                  session.status === 'in_progress' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                  session.status === 'processing' ? 'bg-purple-100 text-purple-700 animate-pulse' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {session.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {session.status === 'review_ready' ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Complete</h3>
                  <p className="text-sm text-gray-500 mb-6">AI has classified the frames. Please review the results.</p>
                  <button
                    onClick={reviewAttendance}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Review Attendance
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`}
                      alt="QR Code"
                      className="w-[150px] h-[150px] rounded-lg shadow-sm mb-4"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Scan with any smartphone camera to join as a device.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Camera Link</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={url}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
                      />
                      <button 
                        onClick={copyLink}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => window.open(url, '_blank')}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Browser Instead
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
