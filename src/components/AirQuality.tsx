import { useState, useEffect, useCallback } from 'react';
import { Card } from './Card';
import { Wind, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export function AirQuality() {
  const [data, setData] = useState<{ aqi: number; status: string; pm25: number; pm10: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAQI = useCallback(async () => {
    try {
      const res = await fetch('/api/air-quality');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch air quality data.');
    }
  }, []);

  useEffect(() => {
    fetchAQI();

    // Smart polling: pause when tab is not visible
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(fetchAQI, 15000); // 15s interval (more efficient)
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
        interval = null;
      } else {
        fetchAQI();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchAQI]);

  const getStatusColor = (status: string) => {
    if (status === 'Good') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'Moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card 
      title="Ozone & Air" 
      icon={Wind} 
      delay={0.3}
      className="bg-accent-dark text-white rounded-[32px] p-8 flex flex-col justify-between shadow-lg border-0"
      subtitle="Environmental Pulse"
      subtitleColor="text-accent-green"
      iconBgClass="bg-white/10"
      iconColorClass="text-white"
    >
      <div className="flex-1 flex flex-col justify-center mt-4" aria-live="polite" aria-atomic="true">
        {error && (
          <div role="alert" className="text-red-300 text-sm bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {!data ? (
          <div className="flex justify-center py-10" role="status" aria-label="Loading air quality data">
            <Activity className="animate-pulse opacity-50" size={32} aria-hidden="true" />
            <span className="sr-only">Loading air quality data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="flex items-end justify-between mb-4">
              <div>
                <motion.p
                  key={data.aqi}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }} 
                  className="text-6xl font-light tracking-tighter"
                  aria-label={`Air Quality Index: ${data.aqi}`}
                >
                  {data.aqi}
                </motion.p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">AQI</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(data.status)}`}>{data.status}</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 pb-2" aria-hidden="true">
                <div className="w-2 h-4 bg-white/20 rounded-sm"></div>
                <div className="w-2 h-8 bg-white/20 rounded-sm"></div>
                <div className="w-2 h-6 bg-white/60 rounded-sm animate-pulse"></div>
                <div className="w-2 h-10 bg-white/20 rounded-sm"></div>
                <div className="w-2 h-4 bg-white/20 rounded-sm"></div>
              </div>
            </div>

            <div className="text-xs opacity-80 leading-relaxed border-t border-white/10 pt-6">
              <p className="mb-2"><span className="font-bold mr-2 uppercase tracking-tighter text-[10px]">PM2.5:</span> {data.pm25} μg/m³ — Within current limits.</p>
              <p><span className="font-bold mr-2 uppercase tracking-tighter text-[10px]">PM10:</span> {data.pm10} μg/m³ — Moderate level.</p>
            </div>
            
          </div>
        )}
      </div>
    </Card>
  );
}
