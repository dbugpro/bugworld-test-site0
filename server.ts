/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with safety guard and User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("placeholder")) {
      console.warn("WARNING: GEMINI_API_KEY is not defined or is placeholder. Gemini functionalities will simulate locally.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_LOCAL_DEMO",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Endpoint to synthesize a biological lore report for a custom bug
app.post("/api/gemini/synthesize-lore", async (req, res) => {
  const { name, baseClass, diet, attributes, mutationTrait, behaviorGuidance } = req.body;

  try {
    const key = process.env.GEMINI_API_KEY;
    const isMock = !key || key === "MY_GEMINI_API_KEY";

    if (isMock) {
      // Return a highly premium mock matching the requested structure for perfect client fallback
      const latinName = `Insectus ${baseClass.substring(0, 3)}us ${name.substring(0, 4).toLowerCase() || "mutatus"}`;
      const mockResult = {
        name: name || "Alpha Hybrid",
        baseClass: baseClass || "Beetle",
        latinName,
        lore: `A bio-engineered hybrid synthesized in the Bugworld Laboratories. By fusing the core genetic base of a ${baseClass} with specialized ${diet.toLowerCase()} survival behaviors, this creature exhibits a highly specialized defensive mechanism known as ${mutationTrait || "Adrenaline Surge"}.`,
        ecosystemRole: `${diet} predator and tactical surveyor. Regulates resource consumption and checks competing populations.`,
        survivalForecast: `Stable. Highly resilient in medium-heat zones, but vulnerable to heavy chemical shock unless armored armor shells are augmented. Guided by directive: "${behaviorGuidance || "none provided"}"`,
        strengths: [
          `Specialized Class trait for ${baseClass} (Armor of +${attributes?.defense || 5})`,
          `Amplified sensory perception via Vision radius: ${attributes?.vision || 5}`,
          `Lethal strike adaptation matching mutation: ${mutationTrait || "None"}`
        ],
        weaknesses: [
          `Increased energetic metabolism matching speed: ${attributes?.speed || 5}`,
          `Sensitive respiratory gills limiting performance in dry/drought conditions`
        ]
      };
      return res.json(mockResult);
    }

    const ai = getGeminiClient();
    const prompt = `
      You are an futuristic, slightly eccentric lead genetic analyst in an cybernetic insect cloning facility.
      Generate a professional scientific bio-profile report for a newly synthesized bug species.
      
      Bug Profile:
      - Name: "${name}"
      - Base Insect Group: ${baseClass}
      - Diet Type: ${diet} (e.g. Herbivore, Carnivore, Omnivore)
      - Genetic Allocations (from scale of 1-10):
        * Attack/Bite power: ${attributes?.attack}/10
        * Armor/Defense: ${attributes?.defense}/10
        * Speed/Agility: ${attributes?.speed}/10
        * Sensory Vision: ${attributes?.vision}/10
        * Metabolic Efficiency: ${attributes?.metabolism}/10
      - Special Genetic Mutation: "${mutationTrait}"
      - Behavioral Directives: "${behaviorGuidance || "None provided"}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Dr. Mandible, a witty and slightly crazy futuristic cybernetic insect biologist. You must output a JSON profile containing the scientific details, lore, Latin name and diagnostic analysis. Ensure Latin names are creatively sound and fields contain sharp details.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["name", "baseClass", "latinName", "lore", "ecosystemRole", "survivalForecast", "strengths", "weaknesses"],
          properties: {
            name: { type: Type.STRING },
            baseClass: { type: Type.STRING },
            latinName: { type: Type.STRING },
            lore: { type: Type.STRING },
            ecosystemRole: { type: Type.STRING },
            survivalForecast: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in synthesize-lore:", error);
    res.status(500).json({ error: error.message || "Failed to generate bio-lore" });
  }
});

// 2. Endpoint to analyze simulation logs / evaluation
app.post("/api/gemini/evaluate-simulation", async (req, res) => {
  const { stats, scenario, activeHazards, customSpecies } = req.body;

  try {
    const key = process.env.GEMINI_API_KEY;
    const isMock = !key || key === "MY_GEMINI_API_KEY";

    if (isMock) {
      const mockResult = {
        overallRating: stats?.tickCount > 60 ? "STABLE ECOSYSTEM EQUILIBRIUM" : "RAPID TROPHIC COLLAPSE",
        diagnosis: `The simulator recorded a total running duration of ${stats?.tickCount || 0} ticks. Analysis indicates high competition near core resources. Spawning hazards (like ${activeHazards?.join(", ") || "none"}) caused immediate stress factors, altering sensory perception across the populations.`,
        geneticEfficacy: customSpecies 
          ? `The custom subject "${customSpecies.name}" behaved moderately. Its genetic trait "${customSpecies.mutationTrait}" showed potential, but metabolic drain caused a high dietary reliance. Survival margin was evaluated at ${stats?.speciesCount?.[customSpecies.name] ? "OPTIMAL" : "CRITICAL"}.`
          : `Standard insect presets behaved as anticipated. The carnivore-herbivore balance suffered from typical cyclic population waves before stabilize.`,
        directives: [
          `Adjust herbivorous food intake boundaries by adding carbon-rich cellulose blocks.`,
          customSpecies ? `Amplify "${customSpecies.name}"'s Metabolism stat (+3 points) to decrease constant feeding trips.` : `Diversify base genetic choices to observe true ecosystem feedback.`,
          `Execute the Drought parameters to test secondary armor water conservation capabilities.`
        ]
      };
      return res.json(mockResult);
    }

    const ai = getGeminiClient();
    const prompt = `
      Perform a biosafety laboratory simulation diagnostic assessment.
      
      Simulation Variables & Data:
      - Active Test Scenario: "${scenario?.name || "Sandbox Mode"}"
      - Run Duration (Simulation Steps): ${stats?.tickCount || 0}
      - Cumulative Births: ${stats?.birthCount || 0}
      - Cumulative Deaths: ${stats?.deathCount || 0}
      - Surving Faction Quantities: ${JSON.stringify(stats?.speciesCount || {})}
      - Environmental Disturbances Engaged: ${activeHazards?.join(", ") || "None"}
      - User-Designed Bug profile: ${customSpecies ? JSON.stringify(customSpecies) : "No custom bug used (standard bugs only)"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Dr. Mandible, a witty robotic biosafety simulation supervisor. Provide a technical bio-evaluation report evaluating the stability, food web interactions, custom genetic success, and strategic directives. Your tone must be immersive, slightly cybernetic/witty, and professional as a real lab tool. Output as JSON satisfying the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overallRating", "diagnosis", "geneticEfficacy", "directives"],
          properties: {
            overallRating: { type: Type.STRING, description: "A high-impact headline status, e.g. ECO-STABILITY ATTAINED, UNCONTROLLED APEX EXTINCTION, METABOLIC DESERTIFICATION" },
            diagnosis: { type: Type.STRING, description: "Detailed scientific analysis of how the bugs behaved, fought, mated, or collapsed." },
            geneticEfficacy: { type: Type.STRING, description: "Specific critique of the custom species' attributes and mutation or the existing genetic presets." },
            directives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable directives for the bug designer to try next (at least 3 directives)."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in evaluate-simulation:", error);
    res.status(500).json({ error: error.message || "Failed to generate evaluation" });
  }
});

// Configure Vite middleware and static asset serving
async function main() {
  if (process.env.NODE_ENV !== "production") {
    // Development server integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bugworld Server] Running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal exception during server bootstrap:", err);
});
