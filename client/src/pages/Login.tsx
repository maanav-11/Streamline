import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, ArrowRight, Loader2, Activity, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      login(data);
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect') || '/';
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 overflow-x-hidden relative font-sans">
      {/* Subtle Ambient Glow & Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-60 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Left Panel: Streamline Enterprise Brand Showcase */}
      <div className="lg:flex-1 p-6 sm:p-10 lg:p-16 flex flex-col justify-between relative z-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/40">
        <div className="w-full max-w-md lg:max-w-xl mx-auto lg:mx-0">
          {/* Brand Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Streamline<span className="text-indigo-400">.</span>
            </span>
          </div>

          <div className="mt-8 sm:mt-12 lg:mt-16 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-4 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Enterprise Analytics Platform
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Turn raw data streams into live visual dashboards.
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-slate-400 leading-relaxed">
              Connect your data sources instantly. No manual scripts, no static exports — just live metrics moving in real-time as events occur.
            </p>

            {/* Live Streaming Data Metrics Card */}
            <div className="mt-6 sm:mt-8 p-5 sm:p-6 rounded-2xl glass-card relative overflow-hidden text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Pipeline Telemetry</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Node
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] sm:text-xs text-slate-400 mb-1">Throughput</div>
                  <div className="text-base sm:text-xl font-bold text-white">1.48M<span className="text-[10px] text-slate-400 font-normal">/s</span></div>
                </div>
                <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] sm:text-xs text-slate-400 mb-1">Latency</div>
                  <div className="text-base sm:text-xl font-bold text-emerald-400">12ms</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] sm:text-xs text-slate-400 mb-1">Uptime</div>
                  <div className="text-base sm:text-xl font-bold text-indigo-400">99.99%</div>
                </div>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Zero-latency pipeline sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Instant web share links</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Enterprise RBAC security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Automated anomaly alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 lg:mt-12 text-xs text-slate-500 flex items-center justify-center lg:justify-start gap-4">
          <span>© 2026 Streamline Inc.</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> SOC2 Type II Certified
          </span>
        </div>
      </div>

      {/* Right Panel: Corporate Sign In Form */}
      <div className="lg:w-[500px] xl:w-[560px] flex items-center justify-center p-6 sm:p-10 lg:p-16 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Card Container */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-10 rounded-2xl shadow-2xl backdrop-blur-xl">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Enter your organization credentials to access your live dashboards.
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <p className="leading-snug">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <a href="#" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center pt-1">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2.5 block text-xs sm:text-sm text-slate-400 cursor-pointer select-none">
                  Remember this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/25 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in to Workspace
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800 text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                Don't have a Streamline workspace?{' '}
                <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


