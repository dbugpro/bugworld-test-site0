/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bot, RefreshCw, Send, Terminal, AlertTriangle, ListChecks, HelpCircle } from 'lucide-react';
import { SimulationStats, ScenarioDef, GeneticProfile } from '../types';

interface LabCompanionProps {
  stats: SimulationStats;
  livingBugsCount: number;
  selectedScenario: ScenarioDef | null;
  customProfile: GeneticProfile | null;
  activeHazards: string[];
}

interface DrMandibleReport {
  overallRating: string;
  diagnosis: string;
  geneticEfficacy: string;
  directives: string[];
}

export const LabCompanion: React.FC<LabCompanionProps> = ({
  stats,
  livingBugsCount,
  selectedScenario,
  customProfile,
  activeHazards
}) => {
  const [report, setReport] = useState<DrMandibleReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Conversational states
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    {
      role: 'ai',
      text: "Greetings, biological designer. I am Dr. Mandible, your automated biosafety simulation supervisor. How may I optimize your synthetic insect profiles today?"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Compile AI Diagnosis Report
  const generateLabReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const postPayload = {
      stats: {
        tickCount: stats.tickCount,
        birthCount: stats.birthCount,
        deathCount: stats.deathCount,
        speciesCount: stats.speciesCount
      },
      scenario: selectedScenario ? { name: selectedScenario.name } : null,
      customSpecies: customProfile,
      activeHazards
    };

    try {
      const response = await fetch('/api/gemini/evaluate-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postPayload)
      });

      if (!response.ok) {
        throw new Error("Failed to receive feedback from Dr. Mandible's server.");
      }

      const generatedReport = await response.json();
      setReport(generatedReport);
    } catch (err: any) {
      setErrorMsg(err.message || "Diagnostic report failed to compile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Chat with Dr. Mandible console command handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Mock-like response if server is fully mock or endpoint failures, but we'll try to use general chat via synthesize-lore or generate simple smart explanations
      const response = await fetch('/api/gemini/synthesize-lore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Consultation Session',
          baseClass: customProfile ? customProfile.baseClass : 'Wasp',
          diet: customProfile ? customProfile.diet : 'Carnivore',
          attributes: customProfile ? customProfile.attributes : { attack: 5, defense: 5, speed: 5, vision: 5, metabolism: 5 },
          mutationTrait: 'AI Chat Consultation',
          behaviorGuidance: `Respond as Dr. Mandible directly answering: "${userMsg}" in context of this active sandbox running with ${livingBugsCount} surviving bugs.`
        })
      });

      if (response.ok) {
        const loreCard = await response.json();
        // Since we hijack synthesize-lore as fallback, we can parse its content nicely
        const answer = loreCard.lore || "Interesting question, biological observer. My cognitive circuits suggest altering your speeds or metabolic profiles to bypass this exact hazard.";
        setMessages(prev => [...prev, { role: 'ai', text: answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: "Cognitive sub-cores are recalibrating. I advice tuning up Defense or seeking plant reserves until complete." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Apologies, telemetry link is unstable during high drought ratings! Check your local parameters." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 h-full">
      {/* Simulation Diagnosis Report Column */}
      <div className="flex flex-col justify-between bg-white border-4 border-emerald-100 rounded-[2rem] p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b-2 border-emerald-100">
            <div className="flex items-center gap-2">
              <ListChecks className="text-emerald-600 w-4.5 h-4.5" />
              <span className="text-xs font-black tracking-wide uppercase text-emerald-950">
                Dr. Mandible's AI Diagnostic Report
              </span>
            </div>
            <button
              onClick={generateLabReport}
              disabled={isLoading}
              className={`py-1.5 px-3.5 rounded-xl bg-emerald-500 border-b-4 border-emerald-700 text-white hover:bg-emerald-600 hover:border-emerald-850 text-[10px] font-sans font-black uppercase transition-all flex items-center gap-1.5 ${
                isLoading ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Compile Report</span>
            </button>
          </div>
 
          {errorMsg && (
            <div className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl text-xs font-sans font-bold">
              {errorMsg}
            </div>
          )}
 
          {report ? (
            <div className="space-y-4 animate-fade-in text-slate-800">
              {/* Overall status index banner */}
              <div className="p-3.5 bg-emerald-50/75 border-2 border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-sans font-black tracking-wider text-emerald-800 block">Stability Classification</span>
                  <span className="text-xs font-black tracking-wide text-emerald-950">{report.overallRating}</span>
                </div>
                <div className="px-2.5 py-0.5 text-[9px] font-sans font-extrabold bg-white text-emerald-900 rounded-lg border border-emerald-150">
                  {stats.tickCount} ticks computed
                </div>
              </div>
 
              {/* Detailed diagnosis statement */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-sans font-black tracking-wide text-emerald-800">Trophic Interaction Feedback</span>
                <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed bg-emerald-50/10 p-4 rounded-2xl border-2 border-emerald-100/50 text-justify">
                  {report.diagnosis}
                </p>
              </div>
 
              {/* Genetic success evaluation */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-sans font-black tracking-wide text-emerald-800">Subject Efficacy Statement</span>
                <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed bg-emerald-50/10 p-4 rounded-2xl border-2 border-emerald-100/50 text-justify">
                  {report.geneticEfficacy}
                </p>
              </div>
 
              {/* Strategic directives list */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-sans font-black tracking-wide text-emerald-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Strategic Directives
                </span>
                <div className="space-y-1.5">
                  {report.directives.map((dir, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 text-amber-900 text-xs font-sans font-semibold rounded-2xl border-2 border-amber-200/50 flex items-start gap-2 shadow-sm">
                      <span className="font-black text-amber-700 shrink-0">D-[0{idx+1}]:</span>
                      <span>{dir}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-4 border-dashed border-emerald-100 bg-emerald-50/10 rounded-[2rem] space-y-3.5">
              <Bot className="w-8 h-8 text-emerald-500 animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-xs font-sans font-black text-emerald-900 uppercase tracking-wide">Reports Standby</h4>
                <p className="text-xs font-sans font-medium text-slate-550 max-w-sm leading-relaxed">
                  Let the simulation cycle grow for a couple of frames, then click <strong>Compile Report</strong> above to allow Dr. Mandible to study current trophic levels and genetic results.
                </p>
              </div>
            </div>
          )}
        </div>
 
        {/* Diagnostic info note */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100/50 mt-4 text-[10px] font-sans font-bold text-slate-600 flex gap-2 items-start">
          <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Diagnosis analyzes your running food web matrices (ratio of herbivores to plant regeneration, predator counts, and active hazards like Heatwaves) using Google Gemini.
          </span>
        </div>
      </div>
 
      {/* Cybernetic Command Terminal Chat Column */}
      <div className="flex flex-col justify-between bg-white border-4 border-emerald-100 rounded-[2rem] p-6 shadow-sm">
        <div className="space-y-3 flex-1 flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 pb-3.5 border-b-2 border-emerald-100 shrink-0">
            <Terminal className="text-emerald-600 w-4.5 h-4.5" />
            <span className="text-xs font-black tracking-wide uppercase text-emerald-950">
              Dr. Mandible's Research Console
            </span>
          </div>
 
          {/* Messages Board */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-emerald-50/20 rounded-[1.5rem] border-2 border-emerald-100/50 min-h-[220px] max-h-[350px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed transition-all max-w-[90%] shadow-sm ${
                  m.role === 'ai'
                    ? 'bg-white border-2 border-emerald-100 text-slate-855 mr-auto rounded-tl-sm'
                    : 'bg-emerald-500 border-b-4 border-emerald-700 text-white ml-auto rounded-tr-sm shadow-md'
                }`}
              >
                <div className={`text-[9px] uppercase font-black tracking-wider mb-1 ${m.role === 'ai' ? 'text-emerald-800' : 'text-emerald-100'}`}>
                  {m.role === 'ai' ? '• Dr. Mandible' : '• Lead Researcher'}
                </div>
                <div className="font-semibold">{m.text}</div>
              </div>
            ))}
            {isChatLoading && (
              <div className="p-3 bg-white border-2 border-emerald-105 text-emerald-800 text-xs font-sans font-bold rounded-2xl rounded-tl-sm flex items-center gap-1.5 max-w-[70%] mr-auto shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Interpreting genome layers...</span>
              </div>
            )}
          </div>
 
          {/* Form console input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 pt-3 border-t-2 border-emerald-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. How do I survive the Predator Crucible? / Ask about wasp defense..."
              className="flex-1 bg-emerald-50/15 border-2 border-emerald-100 focus:border-emerald-400 px-4 py-2.5 text-xs font-sans font-bold rounded-xl focus:outline-none text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2.5 px-4 rounded-xl bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 hover:border-emerald-850 text-white transition-all text-xs font-sans font-black flex items-center justify-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
