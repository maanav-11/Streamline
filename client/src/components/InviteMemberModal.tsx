import { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Copy, Check, Users, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Member {
  _id: string;
  role: 'owner' | 'editor' | 'viewer';
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | undefined;
}

export function InviteMemberModal({ isOpen, onClose, workspaceId }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    fetchMembers();
  }, [isOpen, workspaceId]);

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get(`/api/workspaces/${workspaceId}/members`);
      setMembers(data);
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  };

  if (!isOpen || !workspaceId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await axios.post(`/api/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role
      });
      const generatedToken = data.invite?.token;
      const fullInviteUrl = generatedToken ? `${window.location.origin}/accept-invite?token=${generatedToken}` : data.inviteUrl;
      setInviteUrl(fullInviteUrl);
      setEmail('');
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invitation link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Invite Team Members</h3>
            <p className="text-xs text-slate-400">Generate a 48-hour signed invitation link for team members.</p>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Teammate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Generate 48hr Invite Link
          </button>
        </form>

        {/* Display Generated Invite Link */}
        {inviteUrl && (
          <div className="mb-8 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
              <span>Signed 48hr Invite Token Link:</span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 select-all"
            />
          </div>
        )}

        {/* Workspace Members List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Users className="w-4 h-4 text-indigo-400" /> Current Workspace Members ({members.length})
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold uppercase text-[10px]">
                    {m.userId?.name?.[0] || m.userId?.email?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{m.userId?.name || m.userId?.email || 'User'}</div>
                    <div className="text-[10px] text-slate-400">{m.userId?.email}</div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                  m.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  m.role === 'editor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
