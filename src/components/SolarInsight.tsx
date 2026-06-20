import { useState, useRef } from 'react';
import { Card } from './Card';
import { Sun, Expand, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrackingHistory } from '../hooks/useTrackingHistory';

export function SolarInsight() {
  const [area, setArea] = useState<string>('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ capacityKw: number; estimatedAnnualEnergyKwh: number; annualCo2OffsetKg: number } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { addEntry } = useTrackingHistory();

  const analyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!area || parseFloat(area) <= 0) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/solar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roofAreaSqM: parseFloat(area) }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResult(data);
      addEntry('solar', { roofAreaSqM: parseFloat(area), capacityKw: data.capacityKw, annualCo2OffsetKg: data.annualCo2OffsetKg });
      setTimeout(() => resultRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate solar offset. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Card 
      title="Clean Energy" 
      icon={Sun} 
      delay={0.2}
      subtitle="Rooftop Analysis"
      subtitleColor="text-accent-solar"
      iconBgClass="bg-solar-light"
      iconColorClass="text-accent-solar"
    >
      <form onSubmit={analyze} className="space-y-5 flex-1 flex flex-col">
        <div className="flex-1">
          <label htmlFor="solar-area" className="block text-[10px] font-bold text-accent-dark uppercase tracking-[0.2em] mb-2 opacity-70 whitespace-nowrap overflow-hidden text-ellipsis">Available Roof Area (m²)</label>
          <div className="relative">
            <input
              id="solar-area"
              type="number"
              min="1"
              max="100000"
              step="any"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-primary-bg border border-border-light rounded-xl px-4 py-2.5 pl-10 text-primary-text outline-none focus:ring-1 focus:ring-accent-solar focus:border-accent-solar transition-all"
              placeholder="e.g. 50"
              aria-label="Available roof area in square meters"
              aria-describedby="solar-area-hint"
              required
            />
            <Expand size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 text-primary-text" aria-hidden="true" />
          </div>
          <p id="solar-area-hint" className="text-xs opacity-50 mt-2 italic">
            Simulates Google Maps Solar API geometry analysis based on area size.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !area}
          aria-label="Project solar offset"
          className="w-full bg-accent-dark text-white font-medium py-3 rounded-full hover:bg-accent-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[10px] uppercase tracking-widest font-bold mt-auto"
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-label="Calculating" /> : 'Project Solar Offset'}
        </button>

        {error && (
          <div role="alert" aria-live="assertive" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          <AnimatePresence>
            {result && !loading && (
               <motion.div
                 ref={resultRef}
                 tabIndex={-1}
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="pt-4 outline-none"
                 aria-label={`Results: ${result.capacityKw} kW capacity, ${(result.annualCo2OffsetKg / 1000).toFixed(1)} tons CO₂ offset per year`}
               >
                 <div className="grid grid-cols-2 gap-4 my-2">
                   <div className="bg-primary-bg p-4 rounded-2xl">
                     <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Capacity</p>
                     <p className="text-3xl font-light tracking-tight">{result.capacityKw}<span className="text-sm opacity-40 ml-1">kW</span></p>
                   </div>
                   <div className="bg-primary-bg p-4 rounded-2xl">
                     <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Est. Offset</p>
                     <p className="text-3xl font-light tracking-tight">{(result.annualCo2OffsetKg / 1000).toFixed(1)}<span className="text-sm opacity-40 ml-1">Tons</span></p>
                   </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Card>
  );
}
