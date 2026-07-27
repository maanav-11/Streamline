import { useState } from 'react';
import { X, Share2, Copy, Check, Eye, Globe } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dashboard: {
    _id: string;
    name: string;
    shareToken?: string;
    isPublicShareEnabled?: boolean;
    viewCount?: number;
  } | null;
  onUpdate?: () => void;
}

export function ShareDashboardModal({ isOpen, onClose, dashboard, onUpdate }: Props) {
  const [isEnabled, setIsEnabled] = useState(dashboard?.isPublicShareEnabled || false);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dashboard) return null;

  const shareUrl = `${window.location.origin}/share/${dashboard.shareToken}`;

  const handleToggleShare = async () => {
    setIsToggling(true);
    try {
      const newStatus = !isEnabled;
      const { data } = await axios.patch(`/api/dashboards/${dashboard._id}/share`, { enabled: newStatus });
      setIsEnabled(data.isPublicShareEnabled);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Toggle share error:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Share Dashboard</h3>
            <p className="text-xs text-slate-400">Configure public link sharing for: <strong className="text-white">{dashboard.name}</strong></p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Switcher Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Public Link Access</div>
                <div className="text-xs text-slate-400">Anyone with the link can view live metrics.</div>
              </div>
            </div>

            <button
              onClick={handleToggleShare}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isEnabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Total Public Access Views:
            </span>
            <strong className="text-white font-mono font-bold text-sm">{dashboard.viewCount || 0}</strong>
          </div>

          {/* Share Link */}
          {isEnabled && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Public Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
