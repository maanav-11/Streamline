import { type StreamEvent } from '../hooks/useSocket';
import { Activity, Zap } from 'lucide-react';

interface Props {
  events: StreamEvent[];
  isConnected: boolean;
}

export function LiveStreamChart({ events, isConnected }: Props) {
  // Extract values from events or generate smooth fallback baseline if empty
  const dataPoints = events.length > 0 
    ? [...events].reverse().slice(-15).map(e => e.value)
    : [25, 38, 45, 32, 60, 55, 78, 65, 82, 70, 95, 88, 102, 98, 115];

  const maxVal = Math.max(...dataPoints, 100);
  const minVal = Math.min(...dataPoints, 0);

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padding = 20;

  // Generate SVG path coordinates
  const points = dataPoints.map((val, idx) => {
    const x = padding + (idx / (dataPoints.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  const latestEvent = events[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Real-Time Event Stream
              {isConnected ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Socket Connected
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Connecting...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Live SVG telemetry visualization updating in real-time.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Latest Value</div>
            <div className="text-lg font-extrabold text-indigo-400">
              {latestEvent ? latestEvent.value.toFixed(1) : (dataPoints[dataPoints.length - 1]).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Events Streamed</div>
            <div className="text-lg font-extrabold text-white">
              {events.length}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="w-full h-44 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#gradientLine)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Pulsing Active Node Dot */}
          {points.length > 0 && (() => {
            const lastCoord = points[points.length - 1].split(',');
            const cx = parseFloat(lastCoord[0]);
            const cy = parseFloat(lastCoord[1]);
            return (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="7" fill="#818cf8" opacity="0.3" className="animate-ping" />
                <circle cx={cx} cy={cy} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Live Stream Feed Ticker */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Recent Stream Ingestion Events
        </div>
        {events.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-2">
            No live events received yet. Click "Simulate Live Data" to test the pipeline.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {events.slice(0, 4).map((evt, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="font-semibold text-slate-200">{evt.label || 'Metric'}</span>
                  <span className="text-slate-500 text-[10px]">({evt.streamKey})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400">+{evt.value.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
