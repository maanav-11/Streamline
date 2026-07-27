import { useState, useEffect } from 'react';
import { X, Radio, Plus, Copy, Check, Terminal, Loader2 } from 'lucide-react';
import { useWorkspaceStore, type StreamItem } from '../store/workspaceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateStreamModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStream, setCreatedStream] = useState<StreamItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStream = useWorkspaceStore((state) => state.createStream);

  // Reset modal state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCreatedStream(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const stream = await createStream(name.trim(), description.trim());
      setIsSubmitting(false);
      if (stream) {
        setCreatedStream(stream);
      } else {
        setError('Failed to create stream endpoint. Please check permissions and try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Error generating stream endpoint');
    }
  };

  const [snippetTab, setSnippetTab] = useState<'curl' | 'js' | 'python'>('curl');

  const getSnippet = (streamKey: string) => {
    const url = `${window.location.origin}/api/v1/ingest/${streamKey}`;
    if (snippetTab === 'js') {
      return `fetch("${url}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ value: 84.2, label: "CPU Metric" })
});`;
    }
    if (snippetTab === 'python') {
      return `import requests

requests.post(
    "${url}",
    json={"value": 84.2, "label": "CPU Metric"}
)`;
    }
    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 84.2, "label": "CPU Metric"}'`;
  };

  const handleCopySnippet = (streamKey: string) => {
    const text = getSnippet(streamKey);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setCreatedStream(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-slate-100">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdStream ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">New Data Stream</h3>
                <p className="text-xs text-slate-400">Generate an API key endpoint for real-time data ingestion.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Stream Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. User Signups Stream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Telemetry metric stream for app auth"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Generate Stream Endpoint
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Stream Created!</h3>
                <p className="text-xs text-slate-400">Stream Key generated for: <strong className="text-white">{createdStream.name}</strong></p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Stream Key
              </label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-indigo-400 font-mono text-sm break-all select-all">
                {createdStream.streamKey}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSnippetTab('curl')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        snippetTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnippetTab('js')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        snippetTab === 'js' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      JavaScript
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnippetTab('python')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        snippetTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Python
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopySnippet(createdStream.streamKey)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto">
{getSnippet(createdStream.streamKey)}
              </pre>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
