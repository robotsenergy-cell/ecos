import { useTrackingHistory } from '../hooks/useTrackingHistory';
import { BarChart3, Leaf, Zap, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export function CarbonSummary() {
  const { summary, clearHistory } = useTrackingHistory();

  if (summary.totalEntries === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border-light rounded-[24px] p-6 mb-6 flex items-center gap-4"
        role="region"
        aria-label="Carbon tracking summary"
      >
        <div className="p-2.5 rounded-xl bg-primary-bg">
          <BarChart3 size={20} className="text-accent-dark stroke-[1.5]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary-text">Start tracking your carbon footprint</p>
          <p className="text-xs opacity-50 mt-0.5">Use the calculators below — your results will be tracked here.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border-light rounded-[24px] p-6 mb-6"
      role="region"
      aria-label="Carbon tracking summary"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-bg">
            <BarChart3 size={20} className="text-accent-dark stroke-[1.5]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-green">Your Carbon Tracker</p>
            <p className="text-lg font-medium text-primary-text">{summary.totalEntries} calculation{summary.totalEntries !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 rounded-lg hover:bg-red-50 text-primary-text/40 hover:text-red-500 transition-colors"
          aria-label="Clear tracking history"
          title="Clear history"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3" aria-live="polite">
        <div className="bg-primary-bg rounded-2xl p-4 text-center">
          <Leaf size={16} className="mx-auto mb-2 text-accent-green" aria-hidden="true" />
          <p className="text-2xl font-light tracking-tight">{summary.totalTransitEmissionsKg.toFixed(1)}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">kg CO₂ emitted</p>
        </div>
        <div className="bg-primary-bg rounded-2xl p-4 text-center">
          <Zap size={16} className="mx-auto mb-2 text-accent-solar" aria-hidden="true" />
          <p className="text-2xl font-light tracking-tight">{(summary.totalSolarOffsetKg / 1000).toFixed(1)}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">Tons offset</p>
        </div>
        <div className="bg-primary-bg rounded-2xl p-4 text-center">
          <BarChart3 size={16} className="mx-auto mb-2 text-accent-darker" aria-hidden="true" />
          <p className="text-2xl font-light tracking-tight">{summary.transitCount + summary.solarCount}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">Total checks</p>
        </div>
      </div>
    </motion.div>
  );
}
