import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      // If user is not logged in, preserve token in query param
      return;
    }
  }, [user]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await axios.post('/api/workspaces/accept-invite', { token });
      setStatus('success');
      setMessage(data.message || 'Invitation accepted! Redirecting to workspace...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to accept invitation. The link may have expired (48hr limit).');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-60 pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-lg shadow-indigo-500/20 mb-6">
          <Activity className="w-6 h-6 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Workspace Invitation
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          You have been invited to join a Streamline workspace team.
        </p>

        {!user ? (
          <div className="mt-8 p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs leading-relaxed space-y-4">
            <p>Please sign in to your Streamline account to accept this invitation.</p>
            <Link
              to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
            >
              Sign In to Accept
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-xs flex items-start gap-3 text-left ${
                status === 'success' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/60 border border-red-500/30 text-red-300'
              }`}>
                {status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <p>{message}</p>
              </div>
            )}

            {status !== 'success' && (
              <button
                onClick={handleAccept}
                disabled={status === 'loading' || !token}
                className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 cursor-pointer"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Accept & Join Workspace <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
