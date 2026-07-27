import { useState } from 'react';
import type { StreamEvent } from '../hooks/useSocket';
import type { StreamItem } from '../store/workspaceStore';
import { 
  BarChart3, Activity, Zap, Plus, Trash2, Gauge, 
  X, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

export interface WidgetConfig {
  id: string;
  type: 'stat' | 'gauge' | 'chart' | 'log';
  title: string;
  streamKey?: string;
  targetValue?: number;
}

interface Props {
  dashboardId?: string;
  widgets: WidgetConfig[];
  streams: StreamItem[];
  events: StreamEvent[];
  isConnected?: boolean;
  onWidgetsChange: (newWidgets: WidgetConfig[]) => void;
}

export function WidgetGrid({ dashboardId, widgets, streams, events, onWidgetsChange }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'stat' | 'gauge' | 'chart' | 'log'>('stat');
  const [newStreamKey, setNewStreamKey] = useState('');
  const [newTargetValue, setNewTargetValue] = useState(100);

  const saveWidgets = async (updated: WidgetConfig[]) => {
    onWidgetsChange(updated);
    if (dashboardId) {
      try {
        await axios.patch(`/api/dashboards/${dashboardId}/widgets`, { widgets: updated });
      } catch (err) {
        console.error('Failed to save widget configuration:', err);
      }
    }
  };

  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newWidget: WidgetConfig = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: newTitle.trim(),
      type: newType,
      streamKey: newStreamKey || (streams[0]?.streamKey || ''),
      targetValue: Number(newTargetValue) || 100
    };

    const updated = [...widgets, newWidget];
    saveWidgets(updated);
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const handleDeleteWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    saveWidgets(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Configured Dashboard Widgets</h3>
          <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
            {widgets.length} {widgets.length === 1 ? 'Widget' : 'Widgets'}
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Custom Widget
        </button>
      </div>

      {/* Widget Grid Layout */}
      {widgets.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <Activity className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">No custom widgets on this dashboard</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Click "Add Custom Widget" to build custom Stat Cards, Target Gauges, or Event Log Tickers.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Add First Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {widgets.map((widget) => {
            const filteredEvents = events.filter(e => !widget.streamKey || e.streamKey === widget.streamKey);
            const latest = filteredEvents[0];
            const targetStream = streams.find(s => s.streamKey === widget.streamKey);

            return (
              <div
                key={widget.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between group hover:border-slate-700 transition-all"
              >
                {/* Delete Button Header */}
                <div className="flex items-start justify-between mb-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{widget.title}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
                        {widget.type}
                      </span>
                    </div>
                    {targetStream && (
                      <div className="text-[10px] text-slate-400 mt-0.5">Stream: {targetStream.name}</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove Widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Render Specific Widget Type */}
                {widget.type === 'stat' && (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white">
                        {latest ? latest.value.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs text-emerald-400 flex items-center font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Live
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>Events: {filteredEvents.length}</span>
                      <span>Target stream: {widget.streamKey?.slice(0, 10) || 'All'}...</span>
                    </div>
                  </div>
                )}

                {widget.type === 'gauge' && (() => {
                  const currentVal = latest ? latest.value : 0;
                  const maxTarget = widget.targetValue || 100;
                  const pct = Math.min(Math.round((currentVal / maxTarget) * 100), 100);

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-indigo-400" /> Threshold Progress
                        </span>
                        <span className="font-mono font-bold text-indigo-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Val: {currentVal.toFixed(1)}</span>
                        <span>Max Target: {maxTarget}</span>
                      </div>
                    </div>
                  );
                })()}

                {widget.type === 'log' && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Incoming Payload Feed
                    </div>
                    {filteredEvents.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-3 text-center">No stream events logged</div>
                    ) : (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {filteredEvents.slice(0, 3).map((evt, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-300 truncate max-w-[120px]">{evt.label || 'Event'}</span>
                            <span className="font-mono text-emerald-400 font-bold">+{evt.value.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {widget.type === 'chart' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Stream Telemetry</span>
                      <span className="text-[10px] text-indigo-400">{filteredEvents.length} samples</span>
                    </div>
                    <div className="h-16 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-400">
                      {filteredEvents.length > 0 ? (
                        <span className="text-indigo-400 font-bold font-mono">
                          Latest: {latest?.value.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-500">Waiting for stream feed...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add Custom Dashboard Widget
            </h3>

            <form onSubmit={handleAddWidget} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Widget Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CPU Utilization Target"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Widget Type
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                >
                  <option value="stat">Single Metric Stat Card</option>
                  <option value="gauge">Threshold Gauge Progress Bar</option>
                  <option value="log">Live Event Ingestion Ticker</option>
                  <option value="chart">Mini Stream Chart</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Target Data Stream
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newStreamKey}
                  onChange={(e) => setNewStreamKey(e.target.value)}
                >
                  <option value="">All Streams (Aggregate)</option>
                  {streams.map((s) => (
                    <option key={s._id} value={s.streamKey}>
                      {s.name} ({s.streamKey.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              {newType === 'gauge' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Target Max Threshold
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Create Widget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
