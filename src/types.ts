/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeciesClass = 'Beetle' | 'Spider' | 'Wasp' | 'Mantis' | 'Butterfly';

export type DietType = 'Herbivore' | 'Carnivore' | 'Omnivore';

export interface BugAttributes {
  attack: number;     // 1 to 10
  defense: number;    // 1 to 10
  speed: number;      // 1 to 10
  vision: number;     // 1 to 10
  metabolism: number; // 1 to 10 (higher means lower food rate decay, less constant starvation)
}

export interface GeneticProfile {
  name: string;
  baseClass: SpeciesClass;
  diet: DietType;
  attributes: BugAttributes;
  mutationTrait: string; // e.g., "Acidic Pincers", "Stealth Shadows", "Toxic Bloom"
  behaviorGuidance?: string;
}

export interface BugSpeciesCard {
  name: string;
  baseClass: SpeciesClass;
  latinName: string;
  lore: string;
  ecosystemRole: string;
  survivalForecast: string;
  strengths: string[];
  weaknesses: string[];
}

export interface BugInstance {
  id: string;
  name: string;
  baseClass: SpeciesClass;
  diet: DietType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  health: number;       // 0 to 100
  energy: number;       // 0 to 100
  age: number;          // in ticks/seconds
  generation: number;
  kills: number;
  reproductions: number;
  attributes: BugAttributes;
  mutationTrait: string;
  state: 'wandering' | 'seeking_food' | 'seeking_mate' | 'escaping' | 'resting' | 'dead';
  stateTimer: number;   // ticks for status bubble or state transitions
  statusBubble?: string;// '❤️' | '⚔️' | '🍗' | '💤' | '🏃'
}

export interface PlantInstance {
  id: string;
  x: number;
  y: number;
  energyValue: number;
  growth: number;       // 0 to 100 (ready to eat at 50+)
  type: 'leaf' | 'mushroom' | 'sugar';
}

export interface ObstacleInstance {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface SimulationStats {
  tickCount: number;
  populationHistory: {
    tick: number;
    herbivores: number;
    carnivores: number;
    omnivores: number;
    plants: number;
  }[];
  speciesCount: Record<string, number>;
  extinctionCount: number;
  birthCount: number;
  deathCount: number;
}

export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  durationLimit: number; // in seconds, e.g. 60 or 90
  setup: (width: number, height: number, customSpecies: GeneticProfile | null) => {
    bugs: BugInstance[];
    plants: PlantInstance[];
    obstacles: ObstacleInstance[];
  };
}
