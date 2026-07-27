import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useSocket } from './hooks/useSocket';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicDashboard from './pages/PublicDashboard';
import AcceptInvite from './pages/AcceptInvite';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { CreateStreamModal } from './components/CreateStreamModal';
import { ShareDashboardModal } from './components/ShareDashboardModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal';
import { LiveStreamChart } from './components/LiveStreamChart';
import { WidgetGrid } from './components/WidgetGrid';
import { 
  Activity, LogOut, Zap, BarChart3, Radio, Plus, 
  ArrowUpRight, Building2, ChevronDown, Key, Play,
  Share2, UserPlus, Settings, LayoutDashboard
} from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Activity className="w-5 h-5 animate-pulse text-indigo-400" />
          <span>Verifying session authentication...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { 
    workspaces, activeWorkspace, userRole, streams, 
    fetchWorkspaces, setActiveWorkspace, addStreamEvent 
  } = useWorkspaceStore();

  const { events, isConnected } = useSocket(activeWorkspace?._id);

  const [dashboards, setDashboards] = useState<any[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<any | null>(null);

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (activeWorkspace?._id) {
      fetchDashboards(activeWorkspace._id);
    }
  }, [activeWorkspace?._id]);

  // Sync incoming socket events to workspace store event counters
  useEffect(() => {
    if (events.length > 0) {
      const latest = events[0];
      addStreamEvent(latest.streamKey);
    }
  }, [events, addStreamEvent]);

  const fetchDashboards = async (wsId: string) => {
    try {
      const { data } = await axios.get(`/api/dashboards/workspace/${wsId}`);
      setDashboards(data);
      if (data.length > 0) {
        setActiveDashboard(data[0]);
      } else {
        // Create initial default dashboard if none exists
        const newDash = await axios.post('/api/dashboards', {
          name: 'Main Overview Dashboard',
          workspaceId: wsId
        });
        setDashboards([newDash.data]);
        setActiveDashboard(newDash.data);
      }
    } catch (err) {
      console.error('Fetch dashboards error:', err);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      logout();
    });
  };

  // Stream Simulator Trigger
  const handleSimulateData = async () => {
    setIsSimulating(true);
    try {
      let targetStream = streams[0];
      if (!targetStream) {
        // Auto-provision default stream if none exists in workspace
        const newStream = await useWorkspaceStore.getState().createStream('Live Telemetry Stream', 'Default real-time event feed');
        if (!newStream) {
          setIsStreamModalOpen(true);
          setIsSimulating(false);
          return;
        }
        targetStream = newStream;
      }
      await axios.post(`/api/v1/ingest/${targetStream.streamKey}`, {
        value: Math.floor(Math.random() * 80) + 20,
        label: `${targetStream.name} Metric`,
        metadata: { simulatedBy: user?.email }
      });
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 300);
    }
  };

  const totalEventCount = streams.reduce((acc, s) => acc + s.eventCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Ambient background grid */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-40 pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo & Workspace Switcher */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-white hidden sm:inline">
                  Streamline<span className="text-indigo-400">.</span>
                </span>
              </div>

              {/* Workspace Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isWorkspaceDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Workspaces
                    </div>
                    {workspaces.map((ws) => (
                      <button
                        key={ws._id}
                        onClick={() => {
                          setActiveWorkspace(ws);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                          activeWorkspace?._id === ws._id ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {activeWorkspace?._id === ws._id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      </button>
                    ))}
                    <div className="border-t border-slate-800 mt-2 pt-2 px-2">
                      <button
                        onClick={() => {
                          setIsWorkspaceDropdownOpen(false);
                          setIsWorkspaceModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create New Workspace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Status & Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logged-In User Profile & Role Badge */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center text-[11px] border border-indigo-500/30">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-bold text-slate-200 leading-none">{user?.name || user?.email}</span>
                  <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{user?.email}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                  userRole === 'owner' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  userRole === 'editor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {userRole === 'owner' ? '👑 Owner' : userRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                </span>
              </div>

              {userRole === 'owner' && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Invite Team</span>
                </button>
              )}

              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 border border-slate-800 rounded-xl text-slate-300 bg-slate-950 hover:bg-slate-800 transition-all cursor-pointer"
                title="Workspace Settings & Audit Logs"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 border border-slate-800 text-xs sm:text-sm font-semibold rounded-xl text-slate-300 bg-slate-950 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* Workspace Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5" /> {activeWorkspace?.name || 'Workspace'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {activeDashboard ? activeDashboard.name : 'Real-Time Streaming Telemetry'}
              {dashboards.length > 0 && (
                <span className="text-xs text-slate-400 font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 hidden sm:inline">
                  {dashboards.length} {dashboards.length === 1 ? 'Dashboard' : 'Dashboards'}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage data ingestion streams, toggle dashboard sharing, and view Socket.io telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeDashboard && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                Share Dashboard
              </button>
            )}

            <button
              onClick={handleSimulateData}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              {isSimulating ? 'Ingesting...' : 'Simulate Live Event'}
            </button>

            {userRole !== 'viewer' ? (
              <button
                onClick={() => setIsStreamModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Stream Endpoint
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-semibold px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                👁️ Read-Only View Access
              </span>
            )}
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Streams</span>
              <Radio className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{streams.length}</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Endpoints operational
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Ingested Events</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalEventCount + events.length}</div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Real-time feed active
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Pipeline Latency</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">12 ms</div>
            <div className="text-xs text-slate-400 mt-2">Socket.io real-time sync</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Public Dashboard Views</span>
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{activeDashboard?.viewCount || 0}</div>
            <div className="text-xs text-slate-400 mt-2">Unique shareLink accesses</div>
          </div>
        </div>

        {/* Live SVG Visual Chart */}
        <LiveStreamChart events={events} isConnected={isConnected} />

        {/* Custom Dashboard Widget Grid */}
        <WidgetGrid
          dashboardId={activeDashboard?._id}
          widgets={activeDashboard?.widgets || []}
          streams={streams}
          events={events}
          isConnected={isConnected}
          onWidgetsChange={(newWidgets) => {
            if (activeDashboard) {
              setActiveDashboard({ ...activeDashboard, widgets: newWidgets });
            }
          }}
        />

        {/* Active Streams List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Configured Data Stream Keys</h3>
            </div>
            <button
              onClick={() => setIsStreamModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Stream
            </button>
          </div>

          {streams.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
              <Radio className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">No active data streams configured</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Create your first stream key to get a cURL endpoint and start ingesting live metric events.
              </p>
              <button
                onClick={() => setIsStreamModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Create First Stream Endpoint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streams.map((stream) => (
                <div key={stream._id} className="bg-slate-950 border border-slate-800/90 p-4 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{stream.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{stream.description || 'No description'}</p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                      {stream.eventCount} events
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="font-mono text-slate-300 text-[11px]">key: {stream.streamKey.slice(0, 16)}...</span>
                    <span className="text-[10px] text-slate-500">
                      {stream.lastActiveAt ? `Active ${new Date(stream.lastActiveAt).toLocaleTimeString()}` : 'Never'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      <CreateStreamModal
        isOpen={isStreamModalOpen}
        onClose={() => setIsStreamModalOpen(false)}
      />

      <ShareDashboardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dashboard={activeDashboard}
        onUpdate={() => activeWorkspace && fetchDashboards(activeWorkspace._id)}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={activeWorkspace?._id}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        workspaceId={activeWorkspace?._id}
        workspaceName={activeWorkspace?.name}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:shareToken" element={<PublicDashboard />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


