/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout, AreaChart, Dna, FlaskConical, Bot, Sparkles } from 'lucide-react';
import {
  GeneticProfile,
  BugSpeciesCard,
  BugInstance,
  SimulationStats,
  ScenarioDef
} from './types';
import { BugSimulation } from './components/BugSimulation';
import { BugCreator } from './components/BugCreator';
import { TestScenarios } from './components/TestScenarios';
import { DiagnosticsDashboard } from './components/DiagnosticsDashboard';
import { LabCompanion } from './components/LabCompanion';

export default function App() {
  // Navigation active tab index
  const [activeTab, setActiveTab] = useState<'arena' | 'synthesis' | 'diagnostics' | 'companion'>('arena');

  // Unified Synthesis state
  const [customProfile, setCustomProfile] = useState<GeneticProfile | null>(null);
  const [customCard, setCustomCard] = useState<BugSpeciesCard | null>(null);

  // Active Sandbox Scenario Selection
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDef | null>(null);

  // Real-time telemetry trackers from Canvas loop
  const [livingBugsCount, setLivingBugsCount] = useState<number>(0);
  const [activeBugs, setActiveBugs] = useState<BugInstance[]>([]);
  const [activeHazards, setActiveHazards] = useState<string[]>([]);
  
  // Speed multiples (1x, 2x, 5x)
  const [tickRateMultiplier, setTickRateMultiplier] = useState<number>(1);

  // High-performance numerical logs for charts
  const [stats, setStats] = useState<SimulationStats>({
    tickCount: 0,
    populationHistory: [],
    speciesCount: {},
    extinctionCount: 0,
    birthCount: 0,
    deathCount: 0
  });

  // Automated notification on synthesis
  const handleSpeciesSynthesized = (profile: GeneticProfile, card: BugSpeciesCard) => {
    setCustomProfile(profile);
    setCustomCard(card);
    setActiveTab('arena'); // auto switch to sandbox for trial spawning!
  };

  const handleScenarioSelection = (sc: ScenarioDef | null) => {
    setSelectedScenario(sc);
    setActiveHazards([]); // clear hazards as scenario loads its pre-configured guidelines
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. Laboratory Premium Header Frame */}
      <header className="bg-white border-b-4 border-emerald-100 sticky top-0 z-50 px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center border-b-4 border-rose-700 shrink-0">
            <div className="w-6 h-6 border-2 border-white rounded-full flex flex-wrap p-0.5 gap-0.5 animate-spin-slow">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 id="app-title" className="text-2xl font-black tracking-tight text-emerald-900 flex items-center gap-1.5 leading-none">
              BUG<span className="text-rose-500">WORLD</span>
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">
              Ecology Diagnostics & Genetic Cloning Facility
            </p>
          </div>
        </div>

        {/* Tab selection menu */}
        <nav className="flex flex-wrap items-center bg-emerald-100/40 p-1.5 rounded-2xl border-2 border-emerald-100 gap-1.5">
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
              activeTab === 'arena'
                ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 shadow-md'
                : 'text-emerald-800 hover:bg-emerald-100/65 font-bold'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Arena Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
              activeTab === 'synthesis'
                ? 'bg-rose-500 text-white border-b-4 border-rose-700 shadow-md'
                : 'text-rose-700 hover:bg-rose-100/60 font-bold'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Phylogeny Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-sky-400 text-white border-b-4 border-sky-600 shadow-md'
                : 'text-sky-800 hover:bg-sky-100/60 font-bold'
            }`}
          >
            <AreaChart className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('companion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${
              activeTab === 'companion'
                ? 'bg-orange-400 text-white border-b-4 border-orange-600 shadow-md'
                : 'text-orange-900 hover:bg-orange-100/60 font-bold'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Dr. Mandible AI</span>
          </button>
        </nav>
      </header>

      {/* 2. Main Dashboard Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        {activeTab === 'arena' && (
          <div className="flex flex-col lg:flex-row gap-8 h-full items-stretch">
            {/* Left: Simulation arena */}
            <div className="flex-[2] flex flex-col">
              <BugSimulation
                customSpecies={customProfile}
                activeScenario={selectedScenario}
                onScenarioComplete={(finalStats) => {
                  setStats(finalStats);
                  setActiveTab('companion'); // auto switch to show Dr Mandible's assessment!
                }}
                simulationStats={stats}
                setSimulationStats={setStats}
                onActiveBugsChange={(bugs) => {
                  setLivingBugsCount(bugs.length);
                  setActiveBugs(bugs);
                }}
                onRequestModelAssessment={() => setActiveTab('companion')}
                tickRateMultiplier={tickRateMultiplier}
                setTickRateMultiplier={setTickRateMultiplier}
              />
            </div>

            {/* Right: Benchmarking controller */}
            <div className="flex-1 bg-white rounded-[2rem] p-6 border-b-8 border-emerald-100 max-h-[100%] overflow-y-auto space-y-4 shadow-sm text-slate-800">
              <TestScenarios
                onSelectScenario={handleScenarioSelection}
                selectedScenario={selectedScenario}
                customProfile={customProfile}
              />

              {customProfile && (
                <div className="p-4 bg-teal-50 border-2 border-teal-100 text-slate-755 rounded-2xl font-mono text-xs space-y-2 mt-4">
                  <span className="font-bold text-teal-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Active Genetic Template:
                  </span>
                  <div className="grid grid-cols-2 gap-y-1 text-[11px] pt-2 border-t border-teal-100">
                    <span className="text-slate-400 font-bold">Name:</span>
                    <span className="text-slate-800 font-bold">{customProfile.name}</span>
                    <span className="text-slate-400 font-bold">Class:</span>
                    <span className="text-slate-800 font-bold">{customProfile.baseClass}</span>
                    <span className="text-slate-400 font-bold">Diet Niche:</span>
                    <span className="text-slate-800 font-bold">{customProfile.diet}</span>
                    <span className="text-slate-400 font-bold">Mutation Mod:</span>
                    <span className="text-teal-600 font-bold truncate text-[10px]" title={customProfile.mutationTrait}>{customProfile.mutationTrait}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'synthesis' && (
          <div className="h-full">
            <BugCreator
              onSpeciesSynthesized={handleSpeciesSynthesized}
              currentSpecies={customProfile}
              currentSpeciesCard={customCard}
            />
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="h-full">
            <DiagnosticsDashboard
              stats={stats}
              livingBugs={activeBugs}
            />
          </div>
        )}

        {activeTab === 'companion' && (
          <div className="h-full">
            <LabCompanion
              stats={stats}
              livingBugsCount={livingBugsCount}
              selectedScenario={selectedScenario}
              customProfile={customProfile}
              activeHazards={activeHazards}
            />
          </div>
        )}
      </main>

      {/* 3. Humble Footer Bar */}
      <footer className="px-8 py-4 flex flex-col sm:flex-row items-center justify-between bg-emerald-900 text-emerald-300 text-xs font-bold uppercase tracking-wider gap-3">
        <div className="flex gap-6">
          <span>Local Time: {new Date().toLocaleTimeString()}</span>
          <span>Node: BW-TEST-SITE-01</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            System Online
          </span>
          <span className="opacity-50">Build v1.2.4-STABLE</span>
        </div>
      </footer>
    </div>
  );
}
