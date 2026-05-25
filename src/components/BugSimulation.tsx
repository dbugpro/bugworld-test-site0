/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Flame, ShieldAlert, Moon, Droplets, UserCheck, Eye, PlusCircle } from 'lucide-react';
import {
  BugInstance,
  PlantInstance,
  ObstacleInstance,
  GeneticProfile,
  SimulationStats,
  ScenarioDef
} from '../types';

interface BugSimulationProps {
  customSpecies: GeneticProfile | null;
  activeScenario: ScenarioDef | null;
  onScenarioComplete: (stats: SimulationStats) => void;
  simulationStats: SimulationStats;
  setSimulationStats: React.Dispatch<React.SetStateAction<SimulationStats>>;
  onActiveBugsChange: (bugs: BugInstance[]) => void;
  onRequestModelAssessment: () => void;
  tickRateMultiplier: number; // 1x, 2x, 5x
  setTickRateMultiplier: (val: number) => void;
}

// 1. Core Simulation Constant Configs
const CANVAS_DEFAULT_WIDTH = 800;
const CANVAS_DEFAULT_HEIGHT = 500;

const DIET_COLORS = {
  Herbivore: '#10B981', // Emerald
  Carnivore: '#EF4444', // Rose/Red
  Omnivore: '#F59E0B'   // Amber
};

const CLASS_COLORS = {
  Beetle: '#3B82F6',    // Blue
  Spider: '#8B5CF6',    // Purple/Indigo
  Wasp: '#F59E0B',      // Amber
  Mantis: '#EC4899',    // Pink
  Butterfly: '#10B981'  // Green
};

export const BugSimulation: React.FC<BugSimulationProps> = ({
  customSpecies,
  activeScenario,
  onScenarioComplete,
  simulationStats,
  setSimulationStats,
  onActiveBugsChange,
  onRequestModelAssessment,
  tickRateMultiplier,
  setTickRateMultiplier
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeHazards, setActiveHazards] = useState<string[]>([]);
  const [hoveredBug, setHoveredBug] = useState<BugInstance | null>(null);

  // Physics Collections
  const bugsRef = useRef<BugInstance[]>([]);
  const plantsRef = useRef<PlantInstance[]>([]);
  const obstaclesRef = useRef<ObstacleInstance[]>([]);
  const arenaWidthRef = useRef<number>(CANVAS_DEFAULT_WIDTH);
  const arenaHeightRef = useRef<number>(CANVAS_DEFAULT_HEIGHT);

  // Loop & timing
  const requestRef = useRef<number | null>(null);
  const totalTicksRef = useRef<number>(0);
  const timerRef = useRef<number>(0); // actual elapsed simulation seconds
  const lastTimeRef = useRef<number>(0);

  // Track scenario tracking
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);
  const [scenarioTimer, setScenarioTimer] = useState<number>(0);

  // Sound Synth reference for audios
  const playBeep = (freq: number, type: 'sine' | 'square' | 'triangle' = 'sine', duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio permission or browser sandbox block
    }
  };

  // Resize Handling
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const w = Math.max(width, 400);
        const h = Math.max(height, 350);
        arenaWidthRef.current = w;
        arenaHeightRef.current = h;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize food presets
  const spawnInitialPlants = (count = 15) => {
    const arr: PlantInstance[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: Math.random().toString(),
        x: Math.random() * arenaWidthRef.current * 0.9 + arenaWidthRef.current * 0.05,
        y: Math.random() * arenaHeightRef.current * 0.9 + arenaHeightRef.current * 0.05,
        energyValue: 25 + Math.random() * 20,
        growth: 50 + Math.random() * 50,
        type: Math.random() > 0.6 ? 'mushroom' : (Math.random() > 0.4 ? 'sugar' : 'leaf')
      });
    }
    plantsRef.current = arr;
  };

  // Helper to make preset standard species
  const createPresetBug = (
    name: string,
    cls: 'Beetle' | 'Spider' | 'Wasp' | 'Mantis' | 'Butterfly',
    diet: 'Herbivore' | 'Carnivore' | 'Omnivore',
    x: number,
    y: number,
    optAttributes?: Partial<BugInstance['attributes']>
  ): BugInstance => {
    const baseAttrs = {
      attack: cls === 'Mantis' ? 8 : (cls === 'Wasp' ? 6 : 3),
      defense: cls === 'Beetle' ? 9 : (cls === 'Spider' ? 4 : 2),
      speed: cls === 'Butterfly' ? 8 : (cls === 'Wasp' ? 7 : (cls === 'Spider' ? 6 : 4)),
      vision: cls === 'Spider' ? 8 : 5,
      metabolism: 5,
      ...optAttributes
    };

    return {
      id: `${cls}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      baseClass: cls,
      diet,
      x,
      y,
      vx: (Math.random() - 0.5) * (baseAttrs.speed * 0.5 + 1),
      vy: (Math.random() - 0.5) * (baseAttrs.speed * 0.5 + 1),
      radius: cls === 'Beetle' ? 12 : (cls === 'Spider' ? 9 : (cls === 'Butterfly' ? 10 : 11)),
      color: CLASS_COLORS[cls],
      health: 100,
      energy: 70 + Math.random() * 30,
      age: 0,
      generation: 1,
      kills: 0,
      reproductions: 0,
      attributes: baseAttrs,
      mutationTrait: cls === 'Wasp' ? 'Searing Sting' : 'None',
      state: 'wandering',
      stateTimer: 0
    };
  };

  // Set up scenario or sandbox defaults
  const resetSimulation = () => {
    totalTicksRef.current = 0;
    timerRef.current = 0;
    setScenarioTimer(0);
    setActiveHazards([]);

    const w = arenaWidthRef.current;
    const h = arenaHeightRef.current;

    if (activeScenario) {
      try {
        const setupResult = activeScenario.setup(w, h, customSpecies);
        bugsRef.current = setupResult.bugs;
        plantsRef.current = setupResult.plants;
        obstaclesRef.current = setupResult.obstacles;
        setScenarioMessage(`INITIATING: ${activeScenario.name}. Goal: Get survivors & hold objectives!`);
      } catch (err) {
        console.error("Scenario setting failed:", err);
      }
    } else {
      // Default Sandbox Setup
      setScenarioMessage(null);
      spawnInitialPlants(16);

      // Simple boulders
      obstaclesRef.current = [
        { id: '1', x: w * 0.3, y: h * 0.4, radius: 25 },
        { id: '2', x: w * 0.7, y: h * 0.6, radius: 35 }
      ];

      // Spawn a robust default group of standard competitor bugs
      const startingBugs: BugInstance[] = [];

      // Add standard bugs
      for (let i = 0; i < 4; i++) {
        startingBugs.push(createPresetBug(`Oak Beetle-${i}`, 'Beetle', 'Herbivore', Math.random() * w * 0.8 + 50, Math.random() * h * 0.8 + 50));
      }
      for (let i = 0; i < 2; i++) {
        startingBugs.push(createPresetBug(`Wolf Spider-${i}`, 'Spider', 'Carnivore', Math.random() * w * 0.8 + 50, Math.random() * h * 0.8 + 50));
      }
      for (let i = 0; i < 3; i++) {
        startingBugs.push(createPresetBug(`Yellow Jacket-${i}`, 'Wasp', 'Omnivore', Math.random() * w * 0.8 + 50, Math.random() * h * 0.8 + 50));
      }

      // Automatically seed 2 custom species bugs if the user synthesized one!
      if (customSpecies) {
        for (let i = 0; i < 3; i++) {
          startingBugs.push({
            id: `custom-${Math.random().toString(36).substring(2, 7)}`,
            name: customSpecies.name,
            baseClass: customSpecies.baseClass,
            diet: customSpecies.diet,
            x: Math.random() * w * 0.8 + w * 0.1,
            y: Math.random() * h * 0.8 + h * 0.1,
            vx: (Math.random() - 0.5) * (customSpecies.attributes.speed * 0.5 + 1),
            vy: (Math.random() - 0.5) * (customSpecies.attributes.speed * 0.5 + 1),
            radius: customSpecies.baseClass === 'Beetle' ? 12 : 10,
            color: '#14B8A6', // High visibility lab teal
            health: 100,
            energy: 90,
            age: 0,
            generation: 1,
            kills: 0,
            reproductions: 0,
            attributes: customSpecies.attributes,
            mutationTrait: customSpecies.mutationTrait || 'Biofabrication',
            state: 'wandering',
            stateTimer: 0
          });
        }
      }

      bugsRef.current = startingBugs;
    }

    // Reset parent metrics
    const initialStats: SimulationStats = {
      tickCount: 0,
      populationHistory: [{
        tick: 0,
        herbivores: bugsRef.current.filter(b => b.diet === 'Herbivore').length,
        carnivores: bugsRef.current.filter(b => b.diet === 'Carnivore').length,
        omnivores: bugsRef.current.filter(b => b.diet === 'Omnivore').length,
        plants: plantsRef.current.length
      }],
      speciesCount: {},
      extinctionCount: 0,
      birthCount: 0,
      deathCount: 0
    };
    // Initialize count
    bugsRef.current.forEach(b => {
      initialStats.speciesCount[b.name] = (initialStats.speciesCount[b.name] || 0) + 1;
    });

    setSimulationStats(initialStats);
    onActiveBugsChange(bugsRef.current);
  };

  // Run Reset on launch or Scenario load
  useEffect(() => {
    resetSimulation();
  }, [activeScenario]);

  // Spawn Custom Bug Manual Injector Tool
  const spawnCustomBug = () => {
    if (!customSpecies) return;
    const w = arenaWidthRef.current;
    const h = arenaHeightRef.current;
    
    const newBug: BugInstance = {
      id: `custom-${Math.random().toString(36).substring(2, 7)}`,
      name: customSpecies.name,
      baseClass: customSpecies.baseClass,
      diet: customSpecies.diet,
      x: w/2 + (Math.random() - 0.5) * 80,
      y: h/2 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * (customSpecies.attributes.speed * 0.5 + 2),
      vy: (Math.random() - 0.5) * (customSpecies.attributes.speed * 0.5 + 2),
      radius: customSpecies.baseClass === 'Beetle' ? 12 : 10,
      color: '#14B8A6', // Brilliant laboratory teal
      health: 100,
      energy: 100,
      age: 0,
      generation: 1,
      kills: 0,
      reproductions: 0,
      attributes: customSpecies.attributes,
      mutationTrait: customSpecies.mutationTrait || 'Synthetic Adaptation',
      state: 'wandering',
      stateTimer: 0,
      statusBubble: '🧪'
    };

    bugsRef.current.push(newBug);
    onActiveBugsChange([...bugsRef.current]);
    playBeep(440, 'triangle', 0.15);

    // Update birth triggers
    setSimulationStats(prev => ({
      ...prev,
      birthCount: prev.birthCount + 1,
      speciesCount: {
        ...prev.speciesCount,
        [customSpecies.name]: (prev.speciesCount[customSpecies.name] || 0) + 1
      }
    }));
  };

  // Manual Food Spawn trigger
  const spawnFoodCluster = () => {
    const w = arenaWidthRef.current;
    const h = arenaHeightRef.current;
    const newPlants: PlantInstance[] = [];
    
    for (let i = 0; i < 4; i++) {
      newPlants.push({
        id: Math.random().toString(),
        x: w * 0.2 + Math.random() * w * 0.6,
        y: h * 0.2 + Math.random() * h * 0.6,
        energyValue: 30 + Math.random() * 20,
        growth: 80 + Math.random() * 20,
        type: Math.random() > 0.5 ? 'leaf' : 'sugar'
      });
    }

    plantsRef.current = [...plantsRef.current, ...newPlants];
    playBeep(659, 'sine', 0.1);
  };

  // Toggle dynamic regional/global environmental hazards
  const toggleHazard = (hazard: string) => {
    setActiveHazards(prev => {
      const exists = prev.includes(hazard);
      const updated = exists ? prev.filter(h => h !== hazard) : [...prev, hazard];
      
      if (!exists) {
        // play alert sound
        playBeep(220, 'square', 0.25);
      }
      return updated;
    });
  };

  // Physics, steering engine, and visual renders
  const updatePhysics = (ticks: number) => {
    const w = arenaWidthRef.current;
    const h = arenaHeightRef.current;

    // 1. Environmental settings tweaks based on hazard modifiers
    const isHeatwave = activeHazards.includes('Heatwave');
    const isMidnight = activeHazards.includes('Midnight');
    const isDrought = activeHazards.includes('Drought');
    const isPesticide = activeHazards.includes('Pesticide');

    // 2. Grow existing flora / Spontaneous spawns
    if (!isDrought && Math.random() < 0.05) {
      // Regrowth limit
      if (plantsRef.current.length < 30) {
        plantsRef.current.push({
          id: Math.random().toString(),
          x: Math.random() * w * 0.94 + w * 0.03,
          y: Math.random() * h * 0.94 + h * 0.03,
          energyValue: 20 + Math.random() * 20,
          growth: 10 + Math.random() * 20,
          type: Math.random() > 0.75 ? 'mushroom' : (Math.random() > 0.5 ? 'sugar' : 'leaf')
        });
      }
    }

    // Update flora growth levels
    plantsRef.current = plantsRef.current.map(p => {
      if (p.growth < 100) {
        // Leaves grow faster on heatwaves
        const growthStep = isHeatwave ? 0.6 : 0.3;
        return { ...p, growth: Math.min(100, p.growth + growthStep) };
      }
      return p;
    });

    // 3. Pesticide Chemical Spills impact
    if (isPesticide && Math.random() < 0.02) {
      // Poison random spot, bugs which pass near it lose health instantly
      // We will draw pesticide haze and resolve damage inline
    }

    const currentBugs = [...bugsRef.current];
    const survivingBugs: BugInstance[] = [];

    // Let's loop clean bugs list
    for (let bug of currentBugs) {
      if (bug.health <= 0) {
        // Bug Decomposes!
        // Spawns a toxic dynamic spore plant exactly where it passed away:
        if (Math.random() > 0.3 && plantsRef.current.length < 35) {
          plantsRef.current.push({
            id: `decom-${Math.random()}`,
            x: bug.x,
            y: bug.y,
            energyValue: 35 + bug.attributes.defense * 2,
            growth: 80,
            type: 'mushroom'
          });
        }
        
        setSimulationStats(prev => ({
          ...prev,
          deathCount: prev.deathCount + 1
        }));
        continue;
      }

      // Age tracker
      bug.age += 1;
      bug.stateTimer = Math.max(0, bug.stateTimer - 1);
      if (bug.stateTimer === 0) {
        bug.statusBubble = undefined;
      }

      // 4. Update core life metrics: Metabolic Energy depletion
      // Base usage, scaled up/down with bug speed, size, and hazards (Heatwaves burn more!)
      const baseMetabolism = (11 - bug.attributes.metabolism) * 0.01;
      const speedCost = bug.attributes.speed * 0.005;
      const environmentCost = isHeatwave ? 1.6 : 1.0;
      const energyDecay = (baseMetabolism + speedCost) * environmentCost;

      bug.energy = Math.max(0, bug.energy - energyDecay);

      // Starvation drops health
      if (bug.energy <= 0) {
        bug.health = Math.max(0, bug.health - 0.4);
        bug.statusBubble = '💀';
      } else if (bug.energy > 50 && bug.health < 100) {
        // Healing
        bug.health = Math.min(100, bug.health + 0.1);
      }

      // Adapt vision based on midnight hazard
      const baseVisionRange = bug.attributes.vision * 25 + 50;
      const activeVision = isMidnight ? baseVisionRange * 0.35 : baseVisionRange;

      // 5. INTENSITY DECISIONS: Sensory Target AI Steering
      let targetX = bug.vx;
      let targetY = bug.vy;
      let steerToTarget = false;

      // Classify behavior decisions based on stats
      if (bug.energy < 40 && bug.state !== 'dead') {
        bug.state = 'seeking_food';
        
        // Find closest appetizing meal
        let closestFood: PlantInstance | null = null;
        let closestDist = activeVision;

        // Herbivores seek Leaves (leaf/mushroom/sugar), Carnivores seek OTHER BUGS!
        if (bug.diet === 'Herbivore' || bug.diet === 'Omnivore') {
          for (let p of plantsRef.current) {
            if (p.growth < 40) continue; // skip immature seeds
            const dx = p.x - bug.x;
            const dy = p.y - bug.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
              closestDist = dist;
              closestFood = p;
            }
          }
        }

        // Carnivores / Omnivores look for dynamic preys (another bug of some different species)
        let closestPrey: BugInstance | null = null;
        if (bug.diet === 'Carnivore' || bug.diet === 'Omnivore') {
          let minPreyDist = activeVision;
          for (let other of currentBugs) {
            if (other.id === bug.id || other.health <= 0) continue;
            
            // Do not target own group/clones
            if (other.name === bug.name) continue;

            const dx = other.x - bug.x;
            const dy = other.y - bug.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minPreyDist) {
              minPreyDist = dist;
              closestPrey = other;
            }
          }
        }

        // Drive towards closest available source
        if (closestFood && (closestPrey === null || closestDist < activeVision * 0.5)) {
          const dx = closestFood.x - bug.x;
          const dy = closestFood.y - bug.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            bug.vx = (dx / len) * (bug.attributes.speed * 0.3 + 1);
            bug.vy = (dy / len) * (bug.attributes.speed * 0.3 + 1);
            bug.statusBubble = '🍗';
            bug.stateTimer = 5;

            // Eat detection
            if (len < bug.radius + 10) {
              // Consume!
              bug.energy = Math.min(100, bug.energy + closestFood.energyValue);
              plantsRef.current = plantsRef.current.filter(p => p.id !== closestFood!.id);
              bug.state = 'wandering';
              playBeep(494, 'sine', 0.05);
            }
          }
        } else if (closestPrey) {
          const dx = closestPrey.x - bug.x;
          const dy = closestPrey.y - bug.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            bug.vx = (dx / len) * (bug.attributes.speed * 0.3 + 1.2); // chase slightly faster
            bug.vy = (dy / len) * (bug.attributes.speed * 0.3 + 1.2);
            bug.statusBubble = '⚔️';
            bug.stateTimer = 5;

            // Attack check: Close contact
            if (len < bug.radius + closestPrey.radius + 5) {
              // Resolve damage: Damage = (Attacker_Attack * 3) - (Defender_Defense * 1)
              const rawDmg = bug.attributes.attack * 4.5 - closestPrey.attributes.defense * 1.5;
              const actualDmg = Math.max(5, rawDmg);
              closestPrey.health = Math.max(0, closestPrey.health - actualDmg);
              
              // Recoil push
              bug.vx = -bug.vx * 0.8;
              bug.vy = -bug.vy * 0.8;

              // Check if kill achieved
              if (closestPrey.health <= 0) {
                bug.kills += 1;
                bug.energy = Math.min(100, bug.energy + 50);
                playBeep(290, 'square', 0.12);
              } else {
                playBeep(180, 'triangle', 0.08);
              }
            }
          }
        }
      } else if (bug.energy > 75) {
        // High resource levels trigger species mating behavior!
        bug.state = 'seeking_mate';
        
        let closestPartner: BugInstance | null = null;
        let pDist = activeVision;

        for (let other of currentBugs) {
          if (other.id === bug.id || other.health <= 0 || other.name !== bug.name) continue;
          if (other.energy < 70) continue; // too tired to breed

          const dx = other.x - bug.x;
          const dy = other.y - bug.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pDist) {
            pDist = dist;
            closestPartner = other;
          }
        }

        if (closestPartner) {
          const dx = closestPartner.x - bug.x;
          const dy = closestPartner.y - bug.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            bug.vx = (dx / len) * (bug.attributes.speed * 0.2 + 0.8);
            bug.vy = (dy / len) * (bug.attributes.speed * 0.2 + 0.8);
            bug.statusBubble = '❤️';
            bug.stateTimer = 10;

            // Love sparks connection!
            if (len < bug.radius + closestPartner.radius + 8) {
              // Create child with a slight chance of genetic mutation drift!
              bug.energy -= 45;
              closestPartner.energy -= 45;
              bug.reproductions += 1;
              closestPartner.reproductions += 1;

              // Cross attributes & add mutation drift
              const childAttrs = {
                attack: Math.max(1, Math.min(10, Math.round((bug.attributes.attack + closestPartner.attributes.attack) / 2 + (Math.random() - 0.5) * 1.5))),
                defense: Math.max(1, Math.min(10, Math.round((bug.attributes.defense + closestPartner.attributes.defense) / 2 + (Math.random() - 0.5) * 1.5))),
                speed: Math.max(1, Math.min(10, Math.round((bug.attributes.speed + closestPartner.attributes.speed) / 2 + (Math.random() - 0.5) * 1.5))),
                vision: Math.max(1, Math.min(10, Math.round((bug.attributes.vision + closestPartner.attributes.vision) / 2 + (Math.random() - 0.5) * 1.5))),
                metabolism: Math.max(1, Math.min(10, Math.round((bug.attributes.metabolism + closestPartner.attributes.metabolism) / 2 + (Math.random() - 0.5) * 1.5)))
              };

              const child: BugInstance = {
                id: `${bug.baseClass}-${Math.random().toString(36).substring(2, 7)}`,
                name: bug.name,
                baseClass: bug.baseClass,
                diet: bug.diet,
                x: bug.x + (Math.random() - 0.5) * 30,
                y: bug.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: bug.radius,
                color: bug.color,
                health: 100,
                energy: 65,
                age: 0,
                generation: Math.max(bug.generation, closestPartner.generation) + 1,
                kills: 0,
                reproductions: 0,
                attributes: childAttrs,
                mutationTrait: bug.mutationTrait,
                state: 'wandering',
                stateTimer: 20,
                statusBubble: '🎉'
              };

              bugsRef.current.push(child);
              playBeep(880, 'triangle', 0.2);

              setSimulationStats(prev => ({
                ...prev,
                birthCount: prev.birthCount + 1
              }));
            }
          }
        }
      } else {
        bug.state = 'wandering';
        // Naturally slow down a bit
        if (Math.random() < 0.08) {
          const angle = Math.random() * Math.PI * 2;
          const mag = bug.attributes.speed * 0.15 + 0.5;
          bug.vx = Math.cos(angle) * mag;
          bug.vy = Math.sin(angle) * mag;
        }
      }

      // 6. Natural Pesticide Exposure Damage
      if (isPesticide) {
        // Chemical zones make bugs toxicly weak.
        // If a bug matches high defense or custom metabolism, they take fraction of damage
        const toxicSpotX = w * 0.5;
        const toxicSpotY = h * 0.5;
        const toxicRadius = 140;
        const dx = bug.x - toxicSpotX;
        const dy = bug.y - toxicSpotY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < toxicRadius) {
          const defenseMitigation = bug.attributes.defense * 0.03;
          const toxDmg = Math.max(0.1, 0.45 - defenseMitigation);
          bug.health = Math.max(0, bug.health - toxDmg);
          bug.statusBubble = '🤢';
        }
      }

      // Avoidance of obstacles
      for (let obs of obstaclesRef.current) {
        const dx = bug.x - obs.x;
        const dy = bug.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bug.radius + obs.radius;
        if (dist < minDist) {
          // Push away from boulder center
          const pushX = dx / dist;
          const pushY = dy / dist;
          bug.x = obs.x + pushX * minDist;
          // Reverse velocity component
          const dot = bug.vx * pushX + bug.vy * pushY;
          if (dot < 0) {
            bug.vx = bug.vx - 2 * dot * pushX;
            bug.vy = bug.vy - 2 * dot * pushY;
          }
        }
      }

      // 7. Movement Integration & Bounding checks
      bug.x += bug.vx;
      bug.y += bug.vy;

      if (bug.x < bug.radius) {
        bug.x = bug.radius;
        bug.vx = -bug.vx * 0.8;
      } else if (bug.x > w - bug.radius) {
        bug.x = w - bug.radius;
        bug.vx = -bug.vx * 0.8;
      }

      if (bug.y < bug.radius) {
        bug.y = bug.radius;
        bug.vy = -bug.vy * 0.8;
      } else if (bug.y > h - bug.radius) {
        bug.y = h - bug.radius;
        bug.vy = -bug.vy * 0.8;
      }

      survivingBugs.push(bug);
    }

    bugsRef.current = survivingBugs;
  };

  // Perform a whole visual frame render
  const drawSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear Canvas
    ctx.fillStyle = '#ECFDF5'; // Bright, delightful petri-dish background
    ctx.fillRect(0, 0, w, h);

    // Grid lines for high tech biosandbox feel
    ctx.strokeStyle = '#D1FAE5'; // Soft green grid
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Render Boulders/Stones
    obstaclesRef.current.forEach(obs => {
      // Draw outer tech line
      ctx.strokeStyle = '#A7F3D0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Filled gradient stone
      const grad = ctx.createRadialGradient(obs.x - 5, obs.y - 5, 2, obs.x, obs.y, obs.radius);
      grad.addColorStop(0, '#E2E8F0'); // Slate 100
      grad.addColorStop(1, '#94A3B8'); // Slate 400
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius - 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Chemical Pesticide Haze if active
    if (activeHazards.includes('Pesticide')) {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, 170);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.00)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 170, 0, Math.PI * 2);
      ctx.fill();

      // Pesticide ring
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash
    }

    // Render Plants (Leaf, Mushroom, Sugar crystals)
    plantsRef.current.forEach(plant => {
      const size = (plant.growth / 100) * 8 + 3;

      if (plant.type === 'leaf') {
        ctx.fillStyle = '#10B981'; // Emerald Leaf
        ctx.beginPath();
        ctx.ellipse(plant.x, plant.y, size, size * 0.6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (plant.type === 'mushroom') {
        ctx.fillStyle = '#A855F7'; // Orchid Spore
        ctx.beginPath();
        ctx.arc(plant.x, plant.y, size * 0.9, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#818CF8';
        ctx.fillRect(plant.x - 1.5, plant.y, 3, size);
      } else {
        // Sugar crystals
        ctx.fillStyle = '#F59E0B'; // Gold Amber
        ctx.beginPath();
        ctx.moveTo(plant.x, plant.y - size);
        ctx.lineTo(plant.x + size * 0.8, plant.y);
        ctx.lineTo(plant.x, plant.y + size);
        ctx.lineTo(plant.x - size * 0.8, plant.y);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Render Bugs
    bugsRef.current.forEach(bug => {
      ctx.save();
      // Translate to coordinates
      ctx.translate(bug.x, bug.y);

      // Core rotation vector based on velocity
      const angle = Math.atan2(bug.vy, bug.vx);
      ctx.rotate(angle);

      const color = bug.color;

      // Draw Sensory Aura / Perception cone optionally if hovered or selected
      const isHovered = hoveredBug && hoveredBug.id === bug.id;
      if (isHovered) {
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, bug.attributes.vision * 25 + 50, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Class Specific Bodies (Ant/Beetles, Spiders, Wasps, Mantis, Butterfly)
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;

      if (bug.baseClass === 'Beetle') {
        // Heavy Shell
        ctx.beginPath();
        ctx.ellipse(-2, 0, bug.radius, bug.radius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Split shell line
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(-bug.radius, 0);
        ctx.lineTo(bug.radius - 2, 0);
        ctx.stroke();

        // Beetle Mandibles
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bug.radius - 1, -4, 5, -Math.PI / 4, Math.PI / 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bug.radius - 1, 4, 5, -Math.PI / 3, Math.PI / 4);
        ctx.stroke();

      } else if (bug.baseClass === 'Spider') {
        // Arachnid body segment splitting: Head & Abdomen
        ctx.fillStyle = '#4338CA'; // deep indigo
        ctx.beginPath();
        ctx.arc(-4, 0, bug.radius * 0.9, 0, Math.PI * 2); // abdomen
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(4, 0, bug.radius * 0.6, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.stroke();

        // Slender Spider legs (8 legs radiating out)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        const animationTick = Math.sin(Date.now() * 0.015) * 0.2;
        [-4, -1, 2, 5].forEach((offset, idx) => {
          // Left legs
          ctx.beginPath();
          ctx.moveTo(offset, 0);
          ctx.quadraticCurveTo(offset - 2, -15 - idx, offset - 8, -12 + animationTick * 5);
          ctx.stroke();

          // Right legs
          ctx.beginPath();
          ctx.moveTo(offset, 0);
          ctx.quadraticCurveTo(offset - 2, 15 + idx, offset - 8, 12 - animationTick * 5);
          ctx.stroke();
        });

      } else if (bug.baseClass === 'Wasp') {
        // Slender segment stripes (wasp body)
        ctx.beginPath();
        ctx.ellipse(-1, 0, bug.radius * 1.1, bug.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Yellow-Black stripes
        ctx.fillStyle = '#000000';
        ctx.fillRect(-bug.radius + 3, -bug.radius * 0.5, 3, bug.radius);
        ctx.fillRect(-bug.radius + 10, -bug.radius * 0.6, 3, bug.radius * 1.2);

        // Buzzing Translucent Wings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        const wingRate = Math.sin(Date.now() * 0.09) * 12;
        ctx.beginPath();
        ctx.ellipse(-2, -5, 12, 4 + wingRate * 0.1, -Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-2, 5, 12, 4 - wingRate * 0.1, Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stinger tail
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-bug.radius, 0);
        ctx.lineTo(-bug.radius - 4, 0);
        ctx.stroke();

      } else if (bug.baseClass === 'Mantis') {
        // Long body
        ctx.beginPath();
        ctx.ellipse(0, 0, bug.radius * 1.3, bug.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Triangular Mantis Head
        ctx.beginPath();
        ctx.moveTo(bug.radius, -5);
        ctx.lineTo(bug.radius + 6, 0);
        ctx.lineTo(bug.radius, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Scythe arms
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(bug.radius - 2, -3);
        ctx.lineTo(bug.radius + 8, -10);
        ctx.lineTo(bug.radius + 3, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bug.radius - 2, 3);
        ctx.lineTo(bug.radius + 8, 10);
        ctx.lineTo(bug.radius + 3, 6);
        ctx.stroke();

      } else if (bug.baseClass === 'Butterfly') {
        // Butterfly Flutter base
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(0, 0, bug.radius * 0.8, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Huge fluttering wings
        ctx.fillStyle = color;
        const wingCycle = Math.sin(Date.now() * 0.04) * 0.7;
        
        // Fore-wing Left
        ctx.beginPath();
        ctx.ellipse(2, -6, 12 * Math.abs(wingCycle), 12, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fore-wing Right
        ctx.beginPath();
        ctx.ellipse(2, 6, 12 * Math.abs(wingCycle), 12, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hind-wing Left
        ctx.fillStyle = '#059669'; // darker emerald
        ctx.beginPath();
        ctx.ellipse(-6, -4, 8 * Math.abs(wingCycle), 8, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hind-wing Right
        ctx.beginPath();
        ctx.ellipse(-6, 4, 8 * Math.abs(wingCycle), 8, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 8. Health and energy visual state ring overlay
      ctx.restore();

      // Energy Health indicator thin lines surrounding bug body
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(bug.x, bug.y, bug.radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Health Green Arc
      ctx.strokeStyle = '#10B981'; // green
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bug.x, bug.y, bug.radius + 4, -Math.PI / 2, -Math.PI / 2 + (bug.health / 100) * (Math.PI * 2));
      ctx.stroke();

      // Short metabolic energy bar slightly underneath
      ctx.strokeStyle = '#F59E0B'; // Gold Amber
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bug.x, bug.y, bug.radius + 6, -Math.PI / 2, -Math.PI / 2 + (bug.energy / 100) * (Math.PI * 2));
      ctx.stroke();

      // Speech bubble emotion symbols
      if (bug.statusBubble) {
        ctx.fillStyle = '#0F172A'; // Deep dark charcoal
        ctx.font = '10px Roboto, sans-serif';
        ctx.fillText(bug.statusBubble, bug.x - 5, bug.y - bug.radius - 12);
      }
    });

    // Dark Midnight Vignette if active
    if (activeHazards.includes('Midnight')) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Heatwave reddish glow if active
    if (activeHazards.includes('Heatwave')) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.07)';
      ctx.fillRect(0, 0, w, h);
    }
  };

  // Main high-frequency requestAnimationFrame Tick loop
  const mainLoop = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Fast-forwards simulation updates based on speed multiples
    if (isPlaying) {
      for (let step = 0; step < tickRateMultiplier; step++) {
        totalTicksRef.current += 1;
        updatePhysics(totalTicksRef.current);
      }

      // Gather telemetry metrics every 15 frames for charts
      if (totalTicksRef.current % 15 === 0) {
        const hBugs = bugsRef.current.filter(b => b.diet === 'Herbivore').length;
        const cBugs = bugsRef.current.filter(b => b.diet === 'Carnivore').length;
        const oBugs = bugsRef.current.filter(b => b.diet === 'Omnivore').length;
        const pSize = plantsRef.current.length;

        // Tally species breakdown
        const counts: Record<string, number> = {};
        bugsRef.current.forEach(bug => {
          counts[bug.name] = (counts[bug.name] || 0) + 1;
        });

        setSimulationStats(prev => {
          const updatedHistory = [...prev.populationHistory, {
            tick: totalTicksRef.current,
            herbivores: hBugs,
            carnivores: cBugs,
            omnivores: oBugs,
            plants: pSize
          }].slice(-60); // Keep last 60 plot intervals

          // If a scenario fails/succeeds
          return {
            ...prev,
            tickCount: totalTicksRef.current,
            populationHistory: updatedHistory,
            speciesCount: counts
          };
        });

        // Trigger updates to main applet
        onActiveBugsChange([...bugsRef.current]);
      }
    }

    // Draw frame
    drawSimulation();

    // Trigger scenario limit timer checking
    if (activeScenario && isPlaying) {
      const elapsedSec = Math.floor(totalTicksRef.current / 60);
      setScenarioTimer(elapsedSec);

      if (elapsedSec >= activeScenario.durationLimit) {
        setIsPlaying(false);
        setScenarioMessage(`SCENARIO CONCLUDED: ${activeScenario.name} evaluation ready!`);
        // callback complete
        onScenarioComplete({ ...simulationStats, tickCount: totalTicksRef.current });
      }
    }

    requestRef.current = requestAnimationFrame(mainLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(mainLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, tickRateMultiplier, activeScenario, activeHazards]);

  // Click on Canvas to add plants or query details
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get true offsets
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect if we clicked a bug for details details
    const clickedBug = bugsRef.current.find(bug => {
      const d = Math.sqrt((bug.x - clickX) ** 2 + (bug.y - clickY) ** 2);
      return d <= bug.radius + 5;
    });

    if (clickedBug) {
      setHoveredBug(clickedBug);
      playBeep(523, 'sine', 0.1);
    } else {
      setHoveredBug(null);
      // Spawn leaf node on current click coordinates if in sandbox mode!
      if (!activeScenario) {
        plantsRef.current.push({
          id: Math.random().toString(),
          x: clickX,
          y: clickY,
          energyValue: 25,
          growth: 100,
          type: Math.random() > 0.5 ? 'leaf' : 'sugar'
        });
        playBeep(587, 'sine', 0.05);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-4 border-emerald-100 rounded-[2rem] overflow-hidden shadow-sm">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-emerald-50/50 border-b-2 border-emerald-100">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h2 className="text-sm font-black tracking-wide text-emerald-900 uppercase">
            {activeScenario ? `Benchmarking Suite: ${activeScenario.name}` : "Core Ecology Lab Arena"}
          </h2>
          {activeScenario && (
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-orange-100 text-orange-700 rounded-full border border-orange-200">
              {scenarioTimer}s / {activeScenario.durationLimit}s limit
            </span>
          )}
        </div>

        {/* Hazard Panels */}
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {/* Simulation Rate Trigger */}
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border-2 border-emerald-100 mr-2">
            {[1, 2, 5].map((rate) => (
              <button
                key={rate}
                onClick={() => setTickRateMultiplier(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all ${
                  tickRateMultiplier === rate
                    ? 'bg-emerald-500 text-white border-b-2 border-emerald-700 shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            onClick={() => toggleHazard('Heatwave')}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
              activeHazards.includes('Heatwave')
                ? 'bg-rose-500 text-white border-rose-700 border-b-4'
                : 'bg-white border-emerald-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
            }`}
            title="Inject regional heatwave anomaly (Higher metabolic decay)"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleHazard('Midnight')}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
              activeHazards.includes('Midnight')
                ? 'bg-indigo-500 text-white border-indigo-700 border-b-4'
                : 'bg-white border-emerald-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500'
            }`}
            title="Inject midnight anomaly (Vision ranges diminished)"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleHazard('Drought')}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
              activeHazards.includes('Drought')
                ? 'bg-orange-500 text-white border-orange-700 border-b-4'
                : 'bg-white border-emerald-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500'
            }`}
            title="Inject prolonged drought (No vegetation regrowth)"
          >
            <Droplets className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleHazard('Pesticide')}
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
              activeHazards.includes('Pesticide')
                ? 'bg-rose-600 text-white border-rose-800 border-b-4'
                : 'bg-white border-emerald-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
            }`}
            title="Deploy agricultural chemicals (Toxic center zone)"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lab Banner / Instructions */}
      {scenarioMessage && (
        <div className="bg-emerald-950 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-300 truncate font-semibold">{scenarioMessage}</span>
          <button
            onClick={() => setScenarioMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-mono lg:pl-4 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Canvas Segment */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair overflow-hidden min-h-[300px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-4 left-4 p-2 bg-white/95 rounded-2xl border-2 border-emerald-100 backdrop-blur-md flex items-center gap-2 shadow-sm">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-xl font-bold flex items-center justify-center border-b-4 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-orange-400 hover:bg-orange-500 text-white border-orange-600 shadow-sm'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 shadow-sm'
            }`}
            title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={resetSimulation}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 border-b-4 border-slate-400 transition-all cursor-pointer"
            title="Reset sandbox"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {customSpecies && (
            <button
              onClick={spawnCustomBug}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 border-b-4 border-rose-700 transition-all cursor-pointer"
              title="Spawn cloning culture"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Clone: {customSpecies.name}</span>
            </button>
          )}

          {!activeScenario && (
            <button
              onClick={spawnFoodCluster}
              className="px-3.5 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-500 text-white text-xs font-bold border-b-4 border-sky-600 transition-all cursor-pointer"
            >
              Spawn Food
            </button>
          )}
        </div>

        {/* Hovered Bug Micro Card Overlay */}
        {hoveredBug && (
          <div className="absolute top-4 right-4 p-4 bg-white/95 border-2 border-emerald-100 rounded-2xl text-slate-800 max-w-[240px] shadow-lg backdrop-blur-md">
            <h3 className="font-sans text-xs font-black text-emerald-900 pb-1.5 border-b border-emerald-100">
              {hoveredBug.name}
            </h3>
            <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[11px] pt-2 font-mono">
              <span className="text-slate-400 font-bold">Class:</span>
              <span className="text-slate-800 text-right font-black">{hoveredBug.baseClass}</span>
              
              <span className="text-slate-400 font-bold">Diet Type:</span>
              <span className="text-right font-black" style={{ color: DIET_COLORS[hoveredBug.diet] }}>
                {hoveredBug.diet}
              </span>

              <span className="text-slate-400 font-bold">Health:</span>
              <span className="text-emerald-600 text-right font-black">{Math.round(hoveredBug.health)}%</span>

              <span className="text-slate-400 font-bold">Energy:</span>
              <span className="text-orange-500 text-right font-black">{Math.round(hoveredBug.energy)}%</span>

              <span className="text-slate-400 font-bold">Age:</span>
              <span className="text-slate-800 text-right">{hoveredBug.age}</span>

              <span className="text-slate-400 font-bold">Offspring:</span>
              <span className="text-slate-800 text-right">{hoveredBug.reproductions}</span>

              <span className="text-slate-400 font-bold">Kills:</span>
              <span className="text-rose-500 text-right font-black">{hoveredBug.kills}</span>

              {hoveredBug.mutationTrait !== 'None' && (
                <>
                  <span className="text-slate-400 font-bold">Mutator:</span>
                  <span className="text-teal-600 text-right font-black truncate overflow-hidden" title={hoveredBug.mutationTrait}>
                    {hoveredBug.mutationTrait}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setHoveredBug(null)}
              className="mt-3.5 w-full py-1.5 bg-slate-100 hover:bg-slate-200 border-b-2 border-slate-300 rounded-lg text-[10px] font-black uppercase text-slate-700 cursor-pointer"
            >
              Close Diagnostics
            </button>
          </div>
        )}
      </div>

      {/* Legend & Stats Quick bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 p-4 bg-emerald-50/50 text-xs font-mono border-t-2 border-emerald-100 gap-3">
        <div className="flex flex-col">
          <span className="text-emerald-700 text-[10px] uppercase font-bold">Active Population</span>
          <span className="text-slate-800 font-black text-sm">
            {bugsRef.current.length} <span className="text-xs text-slate-500 font-normal">insects</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-emerald-700 text-[10px] uppercase font-bold">Vegetation Density</span>
          <span className="text-slate-800 font-black text-sm">
            {plantsRef.current.length} <span className="text-xs text-slate-500 font-normal">nodes</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-emerald-700 text-[10px] uppercase font-bold">Cloned Births</span>
          <span className="text-rose-500 font-black text-sm">{simulationStats.birthCount}</span>
        </div>
        <div className="flex flex-col justify-center">
          <button
            onClick={onRequestModelAssessment}
            className="py-2 px-3 bg-rose-500 text-white border-b-4 border-rose-700 rounded-xl text-[10px] font-black tracking-wide uppercase hover:bg-rose-600 text-center transition-all cursor-pointer"
          >
            Assess Lab Logs
          </button>
        </div>
      </div>
    </div>
  );
};
