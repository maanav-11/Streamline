import { useState, useEffect } from 'react';
import { X, Settings, ShieldCheck, Clock, Users, User, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface AuditLogItem {
  _id: string;
  action: string;
  details: Record<string, any>;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface MemberItem {
  _id: string;
  role: 'owner' | 'editor' | 'viewer';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | undefined;
  workspaceName?: string;
}

export function WorkspaceSettingsModal({ isOpen, onClose, workspaceId, workspaceName }: Props) {
  const [activeTab, setActiveTab] = useState<'members' | 'audit'>('members');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    fetchData();
  }, [isOpen, workspaceId, activeTab]);

  const fetchData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      if (activeTab === 'audit') {
        const { data } = await axios.get(`/api/workspaces/${workspaceId}/audit-logs`);
        setLogs(data);
      } else {
        const { data } = await axios.get(`/api/workspaces/${workspaceId}/members`);
        setMembers(data);
      }
    } catch (err) {
      console.error('Fetch settings data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !workspaceId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Workspace Management</h3>
            <p className="text-xs text-slate-400">Team RBAC roles & audit log events for: <strong className="text-white">{workspaceName || 'Workspace'}</strong></p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Team Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audit Log Trail
          </button>
        </div>

        {/* Content Section */}
        {activeTab === 'members' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Workspace Members & Privileges
              </span>
              <button
                onClick={fetchData}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-500">
                No team members found.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{m.userId?.name || 'Workspace User'}</div>
                        <div className="text-[11px] text-slate-400">{m.userId?.email || 'N/A'}</div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      m.role === 'owner' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      m.role === 'editor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Immutable Audit Trail
              </div>
              <button
                onClick={fetchData}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Refresh Logs
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading audit log events...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-500">
                No audit log entries recorded yet for this workspace.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/90 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          log.action === 'DASHBOARD_SHARE_TOGGLED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          log.action === 'MEMBER_INVITED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-300 font-medium">{log.userId?.name || log.userId?.email || 'System'}</span>
                      </div>

                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg mt-1 overflow-x-auto">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
