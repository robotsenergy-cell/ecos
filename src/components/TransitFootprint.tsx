import { useState, useRef } from 'react';
import { Card } from './Card';
import { Route, Car, Bus, Train, Bike, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrackingHistory } from '../hooks/useTrackingHistory';

type Mode = 'car' | 'bus' | 'train' | 'bike';

export function TransitFootprint() {
  const [distance, setDistance] = useState<string>('15');
  const [mode, setMode] = useState<Mode>('car');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ emissionsKg: number; equivalentTrees: number } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { addEntry } = useTrackingHistory();

  const calculate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!distance || parseFloat(distance) <= 0) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceKm: parseFloat(distance), mode }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResult(data);
      addEntry('transit', { distanceKm: parseFloat(distance), mode, emissionsKg: data.emissionsKg, equivalentTrees: data.equivalentTrees });
      // Focus management: move focus to results for a11y
      setTimeout(() => resultRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate emissions. Please try again.');
    }
    setLoading(false);
  };

  const modes = [
    { id: 'car', icon: Car, label: 'Car' },
    { id: 'bus', icon: Bus, label: 'Bus' },
    { id: 'train', icon: Train, label: 'Train' },
    { id: 'bike', icon: Bike, label: 'Bike' },
  ] as const;

  return (
    <Card 
      title="Emissions Tracking" 
      icon={Route} 
      delay={0.1}
      subtitle="Transit Intelligence"
      subtitleColor="text-accent-green"
    >
      <form onSubmit={calculate} className="space-y-5 flex-1 flex flex-col">
        <div>
          <label htmlFor="transit-distance" className="block text-[10px] font-bold text-accent-dark uppercase tracking-[0.2em] mb-2 opacity-70">Distance (km)</label>
          <input
            id="transit-distance"
            type="number"
            min="0.1"
            max="50000"
            step="any"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full bg-primary-bg border border-border-light rounded-xl px-4 py-2.5 text-primary-text outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
            placeholder="e.g. 15"
            aria-label="Transit distance in kilometers"
            aria-describedby="transit-distance-hint"
            required
          />
          <p id="transit-distance-hint" className="sr-only">Enter a distance between 0.1 and 50000 kilometers</p>
        </div>

        <fieldset>
          <legend className="block text-[10px] font-bold text-accent-dark uppercase tracking-[0.2em] mb-2 opacity-70">Transit Mode</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Select transit mode">
            {modes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                role="radio"
                aria-checked={mode === id}
                aria-label={`${label}`}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  mode === id
                    ? 'border-accent-green bg-accent-green/10 text-accent-green'
                    : 'border-border-light bg-primary-bg text-primary-text/50 hover:border-accent-green/50'
                }`}
              >
                <Icon size={18} className="mb-1.5 stroke-[1.5]" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading || !distance}
          aria-label="Calculate transit impact"
          className="w-full bg-accent-dark text-white font-medium py-3 rounded-full hover:bg-accent-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[10px] uppercase tracking-widest font-bold mt-auto"
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-label="Calculating" /> : 'Calculate Impact'}
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
                 className="pt-4 mt-4 border-t border-border-light outline-none"
                 aria-label={`Results: ${modes.find(m => m.id === mode)?.label} produces ${result.emissionsKg}kg CO₂. Emission offset: ${Math.max(0, Math.round((1 - (result.emissionsKg / (parseFloat(distance)*0.192))) * 100) || 0)}%`}
               >
                 <div className="flex items-center gap-8">
                   <div className="flex-1">
                     <p className="text-xs opacity-50 mb-1">Current Route Estimate</p>
                     <div className="h-1.5 w-full bg-primary-bg rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={Math.max(10, Math.min(100, (result.emissionsKg / (parseFloat(distance)*0.192)) * 100))} aria-valuemin={0} aria-valuemax={100} aria-label="Emission comparison">
                       <div className="h-full bg-accent-green" style={{ width: `${Math.max(10, Math.min(100, (result.emissionsKg / (parseFloat(distance)*0.192)) * 100))}%` }}></div>
                     </div>
                     <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                       <span>{modes.find(m => m.id === mode)?.label}: {result.emissionsKg}kg</span>
                       <span className="opacity-30">ICE: {(parseFloat(distance)*0.192).toFixed(1)}kg</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-5xl font-light tracking-tighter">
                       {Math.max(0, Math.round((1 - (result.emissionsKg / (parseFloat(distance)*0.192))) * 100) || 0)}<span className="text-lg ml-1 opacity-40">%</span>
                     </p>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Emission Offset</p>
                   </div>
                 </div>
                 <p className="text-sm italic opacity-70 leading-relaxed mt-4">\u201cThe Travel Impact Model (TIM) identifies {modes.find(m => m.id === mode)?.label} as producing {result.emissionsKg}kg CO\u2082 for this trip.\u201d</p>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Card>
  );
}
