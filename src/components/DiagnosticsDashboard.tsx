/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LineChart, Users, HeartCrack, Activity, CircleDot, Zap } from 'lucide-react';
import { SimulationStats, BugInstance } from '../types';

interface DiagnosticsDashboardProps {
  stats: SimulationStats;
  livingBugs: BugInstance[];
}

export const DiagnosticsDashboard: React.FC<DiagnosticsDashboardProps> = ({
  stats,
  livingBugs
}) => {
  const history = stats.populationHistory || [];

  // SVG Line Chart Helpers
  const chartWidth = 600;
  const chartHeight = 200;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Find max values for adaptive scale
  let maxPopulation = 10;
  history.forEach(d => {
    const total = Math.max(d.herbivores, d.carnivores, d.omnivores, d.plants);
    if (total > maxPopulation) {
      maxPopulation = total;
    }
  });

  // Calculate points coordinates
  const getPointsPath = (key: 'herbivores' | 'carnivores' | 'omnivores' | 'plants') => {
    if (history.length < 2) return '';
    return history.map((d, index) => {
      const x = paddingLeft + (index / (history.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d[key] / maxPopulation) * graphHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const herbiPoints = getPointsPath('herbivores');
  const carniPoints = getPointsPath('carnivores');
  const omniPoints = getPointsPath('omnivores');
  const plantPoints = getPointsPath('plants');

  // Compute average physical traits of current living swarms
  const traits = { attack: 0, defense: 0, speed: 0, vision: 0, metabolism: 0 };
  const count = livingBugs.length;
  
  if (count > 0) {
    livingBugs.forEach(bug => {
      traits.attack += bug.attributes.attack;
      traits.defense += bug.attributes.defense;
      traits.speed += bug.attributes.speed;
      traits.vision += bug.attributes.vision;
      traits.metabolism += bug.attributes.metabolism;
    });
    traits.attack = parseFloat((traits.attack / count).toFixed(1));
    traits.defense = parseFloat((traits.defense / count).toFixed(1));
    traits.speed = parseFloat((traits.speed / count).toFixed(1));
    traits.vision = parseFloat((traits.vision / count).toFixed(1));
    traits.metabolism = parseFloat((traits.metabolism / count).toFixed(1));
  }

  return (
    <div className="space-y-6">
      {/* 4 Core numerical laboratory nodes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Living bug count */}
        <div className="bg-white border-2 border-emerald-100 border-b-4 border-b-indigo-400 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-xl">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400 block">Surviving Swarms</span>
            <span className="text-2xl font-black text-slate-800">{livingBugs.length}</span>
          </div>
        </div>
 
        {/* Dynamic plant count */}
        <div className="bg-white border-2 border-emerald-100 border-b-4 border-b-emerald-500 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <CircleDot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400 block">Living Flora</span>
            <span className="text-2xl font-black text-slate-800">
              {history.length > 0 ? history[history.length - 1].plants : 0}
            </span>
          </div>
        </div>
 
        {/* Total Births */}
        <div className="bg-white border-2 border-emerald-100 border-b-4 border-b-teal-500 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400 block">Total Births</span>
            <span className="text-2xl font-black text-teal-600">{stats.birthCount}</span>
          </div>
        </div>
 
        {/* Total Deceased Decompositions */}
        <div className="bg-white border-2 border-emerald-100 border-b-4 border-b-rose-500 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl">
            <HeartCrack className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400 block">Decompositions</span>
            <span className="text-2xl font-black text-rose-500">{stats.deathCount}</span>
          </div>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Trophic line graph */}
        <div className="lg:col-span-2 bg-white border-4 border-emerald-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3.5 border-b-2 border-emerald-100/60">
            <span className="text-xs font-black uppercase tracking-wide text-emerald-900 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-600" /> Trophic Density Trend curves (Live)
            </span>
            <div className="flex flex-wrap gap-2.5 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-emerald-500 rounded-full animate-ping" /> Flora</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-indigo-500 rounded-full" /> Herbivore</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-rose-500 rounded-full" /> Carnivore</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-amber-500 rounded-full" /> Omnivore</span>
            </div>
          </div>
 
          {/* SVG Vector Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px]">
              {/* Grid Y Axis markers */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + ratio * graphHeight;
                const value = Math.round(maxPopulation * (1 - ratio));
                return (
                  <g key={idx}>
                    <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <text x={paddingLeft - 8} y={y + 3} fill="#64748B" fontSize="9" fontFamily="Inter, ui-sans-serif" textAnchor="end" className="font-bold">
                      {value}
                    </text>
                  </g>
                );
              })}
 
              {/* Grid X Axis Timeline indicators */}
              <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={chartWidth - paddingRight} y2={paddingTop + graphHeight} stroke="#94A3B8" strokeWidth="1.5" />
              <text x={paddingLeft} y={chartHeight - 6} fill="#64748B" fontSize="9" fontFamily="Inter, ui-sans-serif" textAnchor="start" className="font-bold">
                Timeline Outset
              </text>
              <text x={chartWidth - paddingRight} y={chartHeight - 6} fill="#64748B" fontSize="9" fontFamily="Inter, ui-sans-serif" textAnchor="end" className="font-bold">
                Current ({stats.tickCount} ticks)
              </text>
 
              {/* Render Lines */}
              {herbiPoints && <polyline fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={herbiPoints} />}
              {carniPoints && <polyline fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={carniPoints} />}
              {omniPoints && <polyline fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={omniPoints} />}
              {plantPoints && <polyline fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={plantPoints} />}
            </svg>
          </div>
        </div>
 
        {/* Custom genetic frequency profile sliders */}
        <div className="bg-white border-4 border-emerald-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-emerald-900 flex items-center gap-2 pb-3.5 border-b-2 border-emerald-100">
              <Zap className="w-4 h-4 text-emerald-600 animate-pulse" /> Population Genome Index
            </span>
 
            <div className="space-y-4 pt-4">
              {/* Stat 1 Attack */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Average Attack Factor</span>
                  <span className="font-black text-rose-600">{traits.attack} / 10</span>
                </div>
                <div className="w-full bg-emerald-50 h-3 rounded-full overflow-hidden border border-emerald-100/50 shadow-inner">
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${traits.attack * 10}%` }} />
                </div>
              </div>
 
              {/* Stat 2 Defense */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Average Exoskeleton Chitin</span>
                  <span className="font-black text-blue-600">{traits.defense} / 10</span>
                </div>
                <div className="w-full bg-emerald-50 h-3 rounded-full overflow-hidden border border-emerald-100/50 shadow-inner">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${traits.defense * 10}%` }} />
                </div>
              </div>
 
              {/* Stat 3 Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Average Agility Motion</span>
                  <span className="font-black text-amber-650">{traits.speed} / 10</span>
                </div>
                <div className="w-full bg-emerald-50 h-3 rounded-full overflow-hidden border border-emerald-100/50 shadow-inner">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${traits.speed * 10}%` }} />
                </div>
              </div>
 
              {/* Stat 4 Vision */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Average Sensory Vision</span>
                  <span className="font-black text-purple-650">{traits.vision} / 10</span>
                </div>
                <div className="w-full bg-emerald-50 h-3 rounded-full overflow-hidden border border-emerald-100/50 shadow-inner">
                  <div className="bg-purple-500 h-full transition-all" style={{ width: `${traits.vision * 10}%` }} />
                </div>
              </div>
 
              {/* Stat 5 Metabolism */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Average Metabolism</span>
                  <span className="font-black text-teal-600">{traits.metabolism} / 10</span>
                </div>
                <div className="w-full bg-emerald-50 h-3 rounded-full overflow-hidden border border-emerald-100/50 shadow-inner">
                  <div className="bg-teal-500 h-full transition-all" style={{ width: `${traits.metabolism * 10}%` }} />
                </div>
              </div>
            </div>
          </div>
 
          <div className="pt-3 border-t-2 border-emerald-50 text-[10px] font-sans font-bold text-emerald-700 leading-normal mt-4">
            Graphed variables depict weighted aggregates across all currently living bugs, reflecting active ecological selection.
          </div>
        </div>
      </div>
 
      {/* Roster list of living swarms */}
      <div className="bg-white border-4 border-emerald-100 rounded-[2rem] p-6 shadow-sm space-y-3">
        <span className="text-xs font-black uppercase tracking-wide text-emerald-900 block pb-3.5 border-b-2 border-emerald-100">
          Surviving Clones & Species Census
        </span>
 
        {Object.keys(stats.speciesCount).length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {Object.entries(stats.speciesCount).map(([name, headcount]) => (
              <div key={name} className="p-3.5 bg-emerald-50/50 rounded-xl border-2 border-emerald-100 flex justify-between items-center font-sans text-xs">
                <span className="text-slate-800 font-black truncate">{name}</span>
                <span className="px-2.5 py-1 bg-emerald-500 text-white font-black rounded-lg border-b-2 border-emerald-700 shadow-sm shrink-0 font-mono">
                  {headcount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-sans font-bold text-emerald-700 italic py-2 pt-1">
            Biosphere is currently sterile. Spawn insects or synthesize a subject to observe metrics.
          </p>
        )}
      </div>
    </div>
  );
};
