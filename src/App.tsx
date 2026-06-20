/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransitFootprint } from './components/TransitFootprint';
import { SolarInsight } from './components/SolarInsight';
import { AirQuality } from './components/AirQuality';
import { EcoCoach } from './components/EcoCoach';
import { CarbonSummary } from './components/CarbonSummary';

export default function App() {
  return (
    <div className="min-h-screen p-6 md:p-8 flex flex-col w-[1024px] max-w-full mx-auto font-sans">
      
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-dark focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
        Skip to main content
      </a>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-light font-serif tracking-tight text-accent-dark">
            E-C-O-S
          </h1>
          <p className="text-sm opacity-60 mt-1 uppercase tracking-wider font-sans">Environmental Carbon Optimization System</p>
        </div>
      </header>

      <CarbonSummary />

      <main id="main-content" className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[minmax(380px,1fr)]">
        <TransitFootprint />
        <SolarInsight />
        <AirQuality />
        <EcoCoach />
      </main>

    </div>
  );
}
