import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Radio, Eye, ShieldCheck, Zap } from 'lucide-react';
import { LiveStreamChart } from '../components/LiveStreamChart';
import { usePublicShareSocket } from '../hooks/useSocket';

interface SharedDashboardData {
  _id: string;
  name: string;
  viewCount: number;
  widgets: any[];
  streamIds: Array<{
    _id: string;
    name: string;
    streamKey: string;
  }>;
}

export default function PublicDashboard() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [dashboard, setDashboard] = useState<SharedDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { events, isConnected } = usePublicShareSocket(shareToken);

  useEffect(() => {
    if (!shareToken) return;

    // Fetch public dashboard data
    axios.get(`/api/v1/dashboards/share/${shareToken}`)
      .then(({ data }) => {
        setDashboard(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Public dashboard not found or link has been disabled.');
        setIsLoading(false);
      });
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Activity className="w-5 h-5 animate-pulse text-indigo-400" />
          <span>Loading live public dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Dashboard Unavailable</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <Link to="/login" className="inline-block mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            Return to Streamline Home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-40 pointer-events-none" />

      {/* Navbar */}
      <nav className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Streamline<span className="text-indigo-400">.</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold uppercase">
                Public Shared View
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Views: <strong className="text-white font-bold">{dashboard.viewCount}</strong></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">{isConnected ? 'Live Socket Feed' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Public Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5" /> Read-Only Live Stream
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {dashboard.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Displaying real-time event telemetry scoped for shared streams.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" /> Verified Public Feed
          </div>
        </div>

        {/* Live SVG Chart */}
        <LiveStreamChart events={events} isConnected={isConnected} />
      </main>
    </div>
  );
}
