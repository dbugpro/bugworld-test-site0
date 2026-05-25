/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Compass, Swords, Scale, FlaskConical, CircleChevronRight } from 'lucide-react';
import { ScenarioDef, GeneticProfile, BugInstance, PlantInstance, ObstacleInstance } from '../types';

interface TestScenariosProps {
  onSelectScenario: (scenario: ScenarioDef | null) => void;
  selectedScenario: ScenarioDef | null;
  customProfile: GeneticProfile | null;
}

// 1. Defining standard preset scenario mechanics
export const PRESET_SCENARIOS: ScenarioDef[] = [
  {
    id: 'predator_crucible',
    name: 'Predator Crucible',
    description: 'Place 1 specialized user bioform in a swarm of hostile carnivores to evaluate escape, armor resilience, and battle index.',
    objectives: [
      'Survive full 60 seconds simulation duration.',
      'Maintain custom specimen health index above 40%.',
      'Defeat at least 1 wild predator on contact.'
    ],
    durationLimit: 60,
    setup: (w, h, profile) => {
      const bugs: BugInstance[] = [];
      const plants: PlantInstance[] = [];
      const obstacles: ObstacleInstance[] = [
        { id: 'c1', x: w * 0.25, y: h * 0.3, radius: 25 },
        { id: 'c2', x: w * 0.75, y: h * 0.7, radius: 25 }
      ];

      // Spawn custom bug at exact center
      const userBugName = profile ? profile.name : 'Viper Hybrid';
      const userClass = profile ? profile.baseClass : 'Mantis';
      const userDiet = profile ? profile.diet : 'Carnivore';
      const userAttrs = profile ? profile.attributes : { attack: 7, defense: 4, speed: 7, vision: 6, metabolism: 6 };

      bugs.push({
        id: 'specimen_alpha',
        name: userBugName,
        baseClass: userClass,
        diet: userDiet,
        x: w * 0.5,
        y: h * 0.5,
        vx: 0,
        vy: 0,
        radius: 12,
        color: '#14B8A6', // Brilliant lab teal
        health: 100,
        energy: 100,
        age: 0,
        generation: 1,
        kills: 0,
        reproductions: 0,
        attributes: userAttrs,
        mutationTrait: profile?.mutationTrait || 'Bioarmoring',
        state: 'wandering',
        stateTimer: 0
      });

      // Spawn 7 hungry rogue spiders/wasps on the corners
      const classes: ('Spider' | 'Wasp')[] = ['Spider', 'Wasp', 'Spider', 'Wasp', 'Spider', 'Wasp', 'Spider'];
      const positions = [
        [40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40],
        [w * 0.5, 40], [40, h * 0.5], [w - 40, h * 0.5]
      ];

      positions.forEach(([x, y], idx) => {
        const cls = classes[idx % 2];
        bugs.push({
          id: `rogue_${idx}`,
          name: `Rogue ${cls}`,
          baseClass: cls,
          diet: 'Carnivore',
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 9,
          color: '#EF4444', // Red hostile
          health: 80,
          energy: 80,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: { attack: 4, defense: 3, speed: 5, vision: 6, metabolism: 5 },
          mutationTrait: 'None',
          state: 'seeking_food',
          stateTimer: 10
        });
      });

      // Food sources spawned around edges
      for (let i = 0; i < 6; i++) {
        plants.push({
          id: `f_${i}`,
          x: w * 0.15 + Math.random() * w * 0.7,
          y: w * 0.15 + Math.random() * h * 0.7,
          energyValue: 20,
          growth: 100,
          type: 'mushroom'
        });
      }

      return { bugs, plants, obstacles };
    }
  },
  {
    id: 'sugar_rush_maze',
    name: 'Sugar Rush Maze',
    description: 'Simulates high density stone barriers forming simplified pathways. Tests olfactory sensor mechanics as hungry foragers bypass walls seeking Gold Sugar crystals.',
    objectives: [
      'Deploy 10 herbivores at path origins.',
      'Successfully clear 80% spawned sugar crystals.',
      'Complete sensory maze checks in 60 seconds.'
    ],
    durationLimit: 60,
    setup: (w, h, profile) => {
      const bugs: BugInstance[] = [];
      const plants: PlantInstance[] = [];
      
      // Simple grid wall obstacle layout
      const obstacles: ObstacleInstance[] = [
        // Verticals forming lanes
        { id: 'm1', x: w * 0.33, y: h * 0.25, radius: 20 },
        { id: 'm2', x: w * 0.33, y: h * 0.65, radius: 25 },
        { id: 'm3', x: w * 0.66, y: h * 0.35, radius: 20 },
        { id: 'm4', x: w * 0.66, y: h * 0.75, radius: 25 }
      ];

      // Spawns 10 fast herbivore flutterers & beetles
      for (let i = 0; i < 10; i++) {
        const xCoord = w * 0.05 + Math.random() * w * 0.15;
        const yCoord = h * 0.1 + Math.random() * h * 0.8;
        
        bugs.push({
          id: `maze_forager_${i}`,
          name: profile ? profile.name : `Earthy Forager`,
          baseClass: i % 2 === 0 ? 'Beetle' : 'Butterfly',
          diet: 'Herbivore',
          x: xCoord,
          y: yCoord,
          vx: Math.random() * 2 + 1,
          vy: (Math.random() - 0.5) * 2,
          radius: 10,
          color: '#10B981', // green / emerald
          health: 100,
          energy: 70,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: profile ? profile.attributes : { attack: 1, defense: 4, speed: 6, vision: 8, metabolism: 6 },
          mutationTrait: 'None',
          state: 'wandering',
          stateTimer: 0
        });
      }

      // Spawn golden sugar rewards behind boulder blocks
      const coordinates = [
        [w * 0.5, h * 0.15], [w * 0.5, h * 0.5], [w * 0.5, h * 0.85],
        [w * 0.85, h * 0.25], [w * 0.85, h * 0.75]
      ];

      coordinates.forEach(([x, y], idx) => {
        plants.push({
          id: `sg_${idx}`,
          x,
          y,
          energyValue: 40,
          growth: 100,
          type: 'sugar'
        });
      });

      return { bugs, plants, obstacles };
    }
  },
  {
    id: 'faction_war',
    name: 'Hive Faction War',
    description: 'Match two distinct bio-colonies in an isolated tactical turf arena to see which group manages resource gathering, combat ratios, and colonization best.',
    objectives: [
      'Settle a Faction balance with high spawn numbers.',
      'Secure centralized nutrition hubs.',
      'Eliminate rival colony totally before timer expire.'
    ],
    durationLimit: 60,
    setup: (w, h) => {
      const bugs: BugInstance[] = [];
      const plants: PlantInstance[] = [];
      const obstacles: ObstacleInstance[] = [
        { id: 'o1', x: w * 0.5, y: h * 0.5, radius: 40 } // giant central boulder
      ];

      // Faction A: Crimson Stinger Wasps (10 units spawned on left side)
      for (let i = 0; i < 10; i++) {
        bugs.push({
          id: `f_crimson_${i}`,
          name: 'Crimson Hornet',
          baseClass: 'Wasp',
          diet: 'Carnivore',
          x: w * 0.1 + (Math.random() - 0.5) * 40,
          y: h * 0.2 + (i * h * 0.07),
          vx: Math.random() * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 10,
          color: '#EF4444', // Brilliant Rose Red
          health: 100,
          energy: 90,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: { attack: 6, defense: 3, speed: 6, vision: 6, metabolism: 5 },
          mutationTrait: 'Lethal Venom',
          state: 'wandering',
          stateTimer: 0
        });
      }

      // Faction B: Cobalt Shell Beetles (10 units spawned on right side)
      for (let i = 0; i < 10; i++) {
        bugs.push({
          id: `f_cobalt_${i}`,
          name: 'Cobalt Shield',
          baseClass: 'Beetle',
          diet: 'Omnivore',
          x: w * 0.9 + (Math.random() - 0.5) * 40,
          y: h * 0.2 + (i * h * 0.07),
          vx: -Math.random() * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 11,
          color: '#3B82F6', // Cobalt Electric Blue
          health: 100,
          energy: 90,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: { attack: 4, defense: 7, speed: 4, vision: 5, metabolism: 6 },
          mutationTrait: 'Thick Exoskeleton',
          state: 'wandering',
          stateTimer: 0
        });
      }

      // Center surrounding feed heaps
      for (let i = 0; i < 10; i++) {
        const theta = (i / 10) * Math.PI * 2;
        plants.push({
          id: `war_p_${i}`,
          x: w * 0.5 + Math.cos(theta) * 75,
          y: h * 0.5 + Math.sin(theta) * 75,
          energyValue: 25,
          growth: 100,
          type: 'leaf'
        });
      }

      return { bugs, plants, obstacles };
    }
  },
  {
    id: 'eco_equilibrium',
    name: 'Ecological Equilibrium',
    description: 'Fulfill a balanced, self-sustaining multi-tier trophic food web. Features Plants, Herbivore Beetles, and Apex Wasp predators. Can you prevent complete system crash?',
    objectives: [
      'Observe stable population ratios for 90 seconds.',
      'Keep both carnivores and flora alive throughout.',
      'Control starvation and extinction rate indexes.'
    ],
    durationLimit: 90,
    setup: (w, h) => {
      const bugs: BugInstance[] = [];
      const plants: PlantInstance[] = [];
      const obstacles: ObstacleInstance[] = [
        { id: 'eq1', x: w * 0.2, y: h * 0.7, radius: 15 },
        { id: 'eq2', x: w * 0.8, y: h * 0.3, radius: 15 }
      ];

      // Spawn 12 Plants
      for (let i = 0; i < 12; i++) {
        plants.push({
          id: `eq_p_${i}`,
          x: Math.random() * w * 0.8 + w * 0.1,
          y: Math.random() * h * 0.8 + h * 0.1,
          energyValue: 30,
          growth: 60 + Math.random() * 40,
          type: 'leaf'
        });
      }

      // Spawn 8 Herbivore Bugs (Maturity Beetles and Butterflies)
      for (let i = 0; i < 8; i++) {
        bugs.push({
          id: `eq_h_${i}`,
          name: i % 2 === 0 ? 'Pollen Flutter' : 'Armor Herbivore',
          baseClass: i % 2 === 0 ? 'Butterfly' : 'Beetle',
          diet: 'Herbivore',
          x: Math.random() * w * 0.5 + w * 0.25,
          y: Math.random() * h * 0.5 + h * 0.25,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 10,
          color: '#10B981',
          health: 100,
          energy: 60 + Math.random() * 30,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: { attack: 1, defense: 5, speed: 5, vision: 6, metabolism: 7 },
          mutationTrait: 'None',
          state: 'wandering',
          stateTimer: 0
        });
      }

      // Spawn 3 Apex Spiders / Mantis predators
      for (let i = 0; i < 3; i++) {
        bugs.push({
          id: `eq_c_${i}`,
          name: 'Apex Mantis',
          baseClass: 'Mantis',
          diet: 'Carnivore',
          x: Math.random() * w * 0.7 + w * 0.15,
          y: Math.random() * h * 0.7 + h * 0.15,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 12,
          color: '#EF4444',
          health: 100,
          energy: 80,
          age: 0,
          generation: 1,
          kills: 0,
          reproductions: 0,
          attributes: { attack: 7, defense: 4, speed: 6, vision: 7, metabolism: 5 },
          mutationTrait: 'Predation',
          state: 'wandering',
          stateTimer: 0
        });
      }

      return { bugs, plants, obstacles };
    }
  }
];

export const TestScenarios: React.FC<TestScenariosProps> = ({
  onSelectScenario,
  selectedScenario,
  customProfile
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b-2 border-emerald-100">
        <FlaskConical className="text-emerald-600 w-4.5 h-4.5 animate-bounce" />
        <span className="text-xs font-black tracking-wide uppercase text-emerald-950">
          Benchmarking & Stress test cases
        </span>
      </div>
 
      <div className="grid grid-cols-1 gap-4">
        {PRESET_SCENARIOS.map((sc) => {
          const isSelected = selectedScenario && selectedScenario.id === sc.id;
          
          // Select icon based on ID
          let IconComp = Compass;
          if (sc.id === 'predator_crucible') IconComp = Target;
          if (sc.id === 'faction_war') IconComp = Swords;
          if (sc.id === 'eco_equilibrium') IconComp = Scale;
 
          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(isSelected ? null : sc)}
              className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-md text-emerald-950'
                  : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/10 text-slate-850 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-xl border-2 ${isSelected ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-emerald-900">
                    {sc.name}
                  </h3>
                </div>
 
                <p className="text-[11px] font-sans font-medium leading-normal text-slate-500">
                  {sc.description}
                </p>
              </div>
 
              {/* Goal List */}
              <div className="mt-3.5 pt-3.5 border-t-2 border-emerald-100 space-y-2">
                <span className="text-[10px] uppercase font-black text-emerald-800 font-sans">Objective logs:</span>
                <ul className="space-y-1">
                  {sc.objectives.map((obj, i) => (
                    <li key={i} className="text-[10px] font-sans font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
 
              {/* Footer play indicator */}
              <div className="mt-4 flex justify-between items-center text-[10px] font-sans">
                <span className="text-slate-400 font-bold">Duration: {sc.durationLimit} seconds</span>
                <div className="flex items-center gap-1 text-emerald-600 font-black uppercase tracking-wider text-[9px]">
                  <span>{isSelected ? "Engaged" : "Inject Load Case"}</span>
                  <CircleChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
 
      {/* Manual Sandbox Fallback Alert */}
      {selectedScenario && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-2xl text-[11px] font-sans font-semibold leading-relaxed mt-4 shadow-sm">
          <p>
            <strong className="text-emerald-950">SCENARIO STANDBY:</strong> Benchmarking setup injected. Click <strong>Pause/Resume</strong> inside the Arena overlay to spark updates. Click any individual scenario again to exit stress testing and return to standard sandbox mode!
          </p>
        </div>
      )}
    </div>
  );
};
