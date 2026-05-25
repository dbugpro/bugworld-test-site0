/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Flame, Sliders, Sparkles, AlertCircle, RefreshCw, Cpu, Award } from 'lucide-react';
import { GeneticProfile, BugSpeciesCard } from '../types';

interface BugCreatorProps {
  onSpeciesSynthesized: (profile: GeneticProfile, card: BugSpeciesCard) => void;
  currentSpecies: GeneticProfile | null;
  currentSpeciesCard: BugSpeciesCard | null;
}

const BASE_MUTATION_MUTATORS = [
  'Acidic Pincers (Armor corroders)',
  'Feral Reflexes (Rapid visual dash)',
  'Luminescent Camouflage (Dampened threat detection)',
  'Regenerative Siphon (Leech hitpoints on bites)',
  'Spore-Shedding Shells (Decompose path trails)'
];

const MAX_POINT_ALLOCATION = 30;

export const BugCreator: React.FC<BugCreatorProps> = ({
  onSpeciesSynthesized,
  currentSpecies,
  currentSpeciesCard
}) => {
  // Config States
  const [name, setName] = useState<string>('Scythe-Viper XP1');
  const [baseClass, setBaseClass] = useState<GeneticProfile['baseClass']>('Mantis');
  const [diet, setDiet] = useState<GeneticProfile['diet']>('Carnivore');
  const [mutationTrait, setMutationTrait] = useState<string>(BASE_MUTATION_MUTATORS[0]);
  const [behaviorGuidance, setBehaviorGuidance] = useState<string>(
    'Prefer slow targets or caterpillars. Dodge rogue hornets. Hibernate if starvation hazard looms.'
  );

  const [attributes, setAttributes] = useState<GeneticProfile['attributes']>({
    attack: 7,
    defense: 4,
    speed: 7,
    vision: 6,
    metabolism: 6
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Math point checker
  const totalAllocatedPoints = 
    attributes.attack + attributes.defense + attributes.speed + attributes.vision + attributes.metabolism;

  const handleAttributeChange = (key: keyof GeneticProfile['attributes'], val: number) => {
    setAttributes(prev => {
      const nextAttrs = { ...prev, [key]: val };
      const nextSum = 
        nextAttrs.attack + nextAttrs.defense + nextAttrs.speed + nextAttrs.vision + nextAttrs.metabolism;
      
      // Keep sum within point constraints
      if (nextSum <= MAX_POINT_ALLOCATION) {
        return nextAttrs;
      }
      return prev;
    });
  };

  // Bio Lore synthesis engine
  const handleSynthesizeSpecies = async () => {
    if (!name.trim()) {
      setErrorMsg("Subject identification name required.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const targetProfile: GeneticProfile = {
      name: name.trim(),
      baseClass,
      diet,
      attributes,
      mutationTrait,
      behaviorGuidance: behaviorGuidance.trim()
    };

    try {
      const response = await fetch('/api/gemini/synthesize-lore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetProfile)
      });

      if (!response.ok) {
        throw new Error("Failed to contact the synthesizer node server.");
      }

      const generatedCard = await response.json();
      onSpeciesSynthesized(targetProfile, generatedCard);
    } catch (err: any) {
      setErrorMsg(err.message || "Synthesizer offline. Please authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  const pointsRemaining = MAX_POINT_ALLOCATION - totalAllocatedPoints;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1 h-full items-stretch">
      {/* Configuration Column */}
      <div className="flex-1 bg-white border-4 border-emerald-100 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
        <div className="space-y-4">
          {/* Section banner */}
          <div className="flex items-center gap-2 pb-3.5 border-b-2 border-emerald-100/60">
            <Cpu className="text-rose-500 w-4.5 h-4.5 animate-pulse" />
            <span className="text-xs font-black tracking-wide uppercase text-emerald-900">
              Genetic Synthesis Terminal
            </span>
          </div>
 
          {/* Species identification naming */}
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-xs font-black text-emerald-800">Biological Identifier / Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scythe-Viper XP1"
              className="w-full px-3.5 py-2.5 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl text-sm text-slate-800 font-mono focus:outline-none focus:border-emerald-500 transition-all font-bold shadow-inner"
            />
          </div>
 
          {/* Base Insect Class Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-emerald-800">Somatic Phylogenetic Base</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Beetle', 'Spider', 'Wasp', 'Mantis', 'Butterfly'] as GeneticProfile['baseClass'][]).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setBaseClass(cls)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    baseClass === cls
                      ? 'bg-emerald-500 border-b-4 border-emerald-700 text-white font-bold shadow-sm'
                      : 'bg-emerald-50/60 border-2 border-emerald-100 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/55'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
 
          {/* Core Diet Rules */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-emerald-800">Trophic Niches / Food Diet Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Herbivore', 'Carnivore', 'Omnivore'] as GeneticProfile['diet'][]).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setDiet(dt)}
                  className={`py-1.5 px-2 text-center rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                    diet === dt
                      ? 'bg-amber-500 border-amber-700 border-b-4 text-white font-black shadow-sm'
                      : 'bg-amber-50/30 border-amber-100 text-amber-900 hover:text-amber-950 hover:bg-amber-100/50'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>
 
          {/* Point Slider Allocators */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Genome Splice Points
              </span>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${
                pointsRemaining === 0 ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}>
                {pointsRemaining} slots left
              </span>
            </div>
 
            <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100 shadow-inner">
              {/* Attack stat */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Attack Venom / Pinch:</span>
                  <span className="text-rose-600 font-black">{attributes.attack}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attributes.attack}
                  onChange={(e) => handleAttributeChange('attack', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
 
              {/* Defense stat */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Exoskeleton Chitin Armor:</span>
                  <span className="text-blue-600 font-black">{attributes.defense}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attributes.defense}
                  onChange={(e) => handleAttributeChange('defense', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
 
              {/* Speed stat */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Agility / Action Range:</span>
                  <span className="text-amber-600 font-black">{attributes.speed}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attributes.speed}
                  onChange={(e) => handleAttributeChange('speed', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
 
              {/* Vision stat */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Ocular Vision Radius:</span>
                  <span className="text-purple-600 font-black">{attributes.vision}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attributes.vision}
                  onChange={(e) => handleAttributeChange('vision', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
 
              {/* Metabolism stat */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Energy Conservation:</span>
                  <span className="text-teal-600 font-black">{attributes.metabolism}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attributes.metabolism}
                  onChange={(e) => handleAttributeChange('metabolism', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>
          </div>
 
          {/* AI Mutation Trait */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-emerald-800">Organic Mutation Module</label>
            <select
              value={mutationTrait}
              onChange={(e) => setMutationTrait(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
            >
              {BASE_MUTATION_MUTATORS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
 
          {/* Behavioral Guidance */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-emerald-800">Directed Cognitive Directives / Script</label>
            <textarea
              rows={2}
              value={behaviorGuidance}
              onChange={(e) => setBehaviorGuidance(e.target.value)}
              placeholder="Inject programmatic behavior preferences..."
              className="w-full px-3.5 py-2 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl text-xs text-slate-800 font-sans font-medium focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>
        </div>
 
        {/* Compile / Synthesize species details */}
        <div className="pt-4 border-t-2 border-emerald-100 mt-4 space-y-3">
          {errorMsg && (
            <div className="flex gap-2 p-3.5 bg-red-50 text-red-700 border-2 border-red-100 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
 
          <button
            onClick={handleSynthesizeSpecies}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide text-xs uppercase flex items-center justify-center gap-2 border-b-4 border-emerald-700 transition-all cursor-pointer ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calibrating Biogenesis Cores...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize Bio-Form Species</span>
              </>
            )}
          </button>
        </div>
      </div>
 
      {/* Species Card Display Column */}
      <div className="flex-1 bg-white border-4 border-emerald-100 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
        {/* Decorative background grid and gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(#d1fae5_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
 
        {currentSpeciesCard ? (
          <div className="h-full flex flex-col justify-between space-y-4 relative z-10 animate-fade-in">
            <div className="space-y-4">
              {/* Header Title / latin identifier */}
              <div className="flex justify-between items-start pb-3 border-b-2 border-emerald-100">
                <div>
                  <h3 className="text-lg font-black text-rose-500 tracking-tight">
                    {currentSpeciesCard.name}
                  </h3>
                  <p className="text-xs italic text-slate-500 font-serif">
                    {currentSpeciesCard.latinName}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-black uppercase py-1 px-3 bg-rose-100 text-rose-700 rounded-full border border-rose-200 shadow-sm shrink-0">
                  {currentSpeciesCard.baseClass} ({currentSpecies?.diet})
                </span>
              </div>
 
              {/* Bio description Lore writeup */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 block">
                  Synthesized Ecological Lore
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium text-justify bg-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-100">
                  {currentSpeciesCard.lore}
                </p>
              </div>
 
              {/* Role in biodiversity */}
              <div className="space-y-1 bg-sky-50 p-4 rounded-2xl border-2 border-sky-100 shadow-inner">
                <span className="text-[10px] uppercase font-black tracking-wider text-sky-700 block">
                  Ecosystem Function Profile
                </span>
                <p className="text-xs text-slate-700 font-sans font-semibold">
                  {currentSpeciesCard.ecosystemRole}
                </p>
              </div>
 
              {/* Strengths / weaknesses list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-emerald-50 border-2 border-emerald-100/80 p-4 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Evolutionary Assets
                  </span>
                  <ul className="space-y-1">
                    {currentSpeciesCard.strengths.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="text-[11px] font-sans text-slate-700 flex items-start gap-1 font-medium">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
 
                <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Physiological Debits
                  </span>
                  <ul className="space-y-1">
                    {currentSpeciesCard.weaknesses.slice(0, 3).map((w, idx) => (
                      <li key={idx} className="text-[11px] font-sans text-slate-700 flex items-start gap-1 font-medium">
                        <span className="text-rose-500 font-bold shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
 
            {/* Diagnostic Forecast prognosis */}
            <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl flex items-start gap-3 mt-4">
              <Award className="text-orange-500 w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest block">
                  Biosphere Outlook & Survival Rating
                </span>
                <p className="text-[11px] font-sans font-medium text-slate-700 leading-normal">
                  {currentSpeciesCard.survivalForecast}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border-4 border-dashed border-emerald-100 bg-emerald-50/50 rounded-[2rem] space-y-4">
            <div className="p-4.5 bg-white rounded-full border-2 border-emerald-100 text-rose-500 animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Awaiting Bioform Synthesis
              </h4>
              <p className="text-xs font-sans font-medium text-emerald-700 max-w-sm leading-relaxed">
                Configure attributes, somatic Phylogeny Base, and Mutation modules to generate a customized organism report from the AI lab biologist Dr. Mandible.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
