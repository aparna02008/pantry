import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "20mb" }));

  const apiKey = process.env.GEMINI_API_KEY;
  let aiClient: any = null;

  if (apiKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("[Gemini Client] Initialized successfully with telemetry.");
    } catch (err) {
      console.error("[Gemini Client] Failed to initialize GoogleGenAI SDK:", err);
    }
  } else {
    console.warn("[Gemini Client] Warning: GEMINI_API_KEY environment variable is not defined. Falling back to local offline generation engine.");
  }

  // Timeout helper to prevent hanging requests on overloaded models
  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  // Fallback logic to support transient 503/429 overloads with ultra-fast model switching
  async function generateContentWithFallback(params: {
    contents: any;
    config?: any;
  }): Promise<{ response: any; modelUsed: string }> {
    if (!aiClient) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    // We prioritize the modern gemini-3.5-flash, but have fast fallbacks
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite"
    ];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini API] Requesting ${modelName} with 16-second timeout limit...`);
        // Use a 16-second timeout so that if a model is hanging or congested, we try the next one after a reasonable wait
        const result = await withTimeout(
          aiClient.models.generateContent({
            ...params,
            model: modelName,
          }),
          16000,
          `Request to ${modelName} timed out after 16 seconds`
        );
        
        console.log(`[Gemini API] Success using model: ${modelName}`);
        return { response: result, modelUsed: modelName };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini API] Model ${modelName} failed or timed out: ${errMsg}. Switching candidate...`);
      }
    }
    throw lastError;
  }

  // Local Fallback Generator in case of persistent Gemini API unavailability
  function generateFallbackRecipes(ingredients: any[]): any[] {
    const userIngredientNames = ingredients.map(ing => ing.name.toLowerCase().trim());

    const recipeTemplates = [
      {
        name: "Chef's Garden Miracle Sauté",
        base_ingredients: ["onion", "tomato", "garlic", "carrot", "celery", "potato", "bell pepper", "broccoli"],
        essential_additions: ["cooking oil", "salt", "black pepper", "italian herbs"],
        prep_time: 20,
        dietary_tags: ["Vegetarian", "Vegan", "Gluten-Free"],
        steps: [
          "Chop all available vegetable ingredients into small, uniform bite-sized pieces.",
          "Heat two tablespoons of cooking oil or butter in a skillet over medium heat.",
          "Add firmer ingredients first (potatoes, carrots, broccoli) and sauté until they start to soften.",
          "Toss in softer ingredients (onions, garlic, bell peppers, tomatoes) and season generously with your favorite herbs, salt, and black pepper.",
          "Stir continuously for an additional 5-7 minutes until tender-crisp. Serve warm!"
        ]
      },
      {
        name: "Heritage Golden Skillet Bowl",
        base_ingredients: ["egg", "rice", "onion", "garlic", "spinach", "mushroom", "cheese", "chicken"],
        essential_additions: ["butter", "soy sauce", "salt", "chili flakes"],
        prep_time: 15,
        dietary_tags: ["Gluten-Free"],
        steps: [
          "Prep your ingredients: finely mince onions and garlic, and beat egg yolks in a bowl.",
          "Melt high-quality butter in a wide frying pan over medium heat.",
          "Sauté onions and garlic together with proteins (like chicken or cheese) or greens for 3 minutes.",
          "Push ingredients to the side, pour beaten eggs into the empty space, and scramble gently.",
          "Combine all ingredients, drizzle with a splash of soy sauce or salt, and garnish with cheese."
        ]
      },
      {
        name: "Rustic Zero-Waste Savory Medley",
        base_ingredients: ["tomato", "cucumber", "bread", "cheese", "avocado", "lemon", "apple", "spinach", "lettuce"],
        essential_additions: ["olive oil", "balsamic vinegar", "salt", "parsley"],
        prep_time: 10,
        dietary_tags: ["Vegetarian"],
        steps: [
          "Thoroughly wash and dry your fresh ingredients, then slice into vibrant cubes.",
          "Assemble greens like spinach or lettuce on an elegant plate.",
          "Assemble the salad, adding crumbled cheese, cucumber, or tomato slices on top.",
          "Drizzle with a light coat of olive oil, fresh lemon juice, and a pinch of salt.",
          "Toast any bread slices you have on hand and enjoy side-by-side with your fresh medley!"
        ]
      }
    ];

    return recipeTemplates.map(tpl => {
      const used = tpl.base_ingredients.filter(ing => userIngredientNames.includes(ing));

      if (used.length === 0 && userIngredientNames.length > 0) {
        const adaptCount = Math.min(2, userIngredientNames.length);
        for (let i = 0; i < adaptCount; i++) {
          used.push(userIngredientNames[i]);
        }
      }

      const missingBase = tpl.base_ingredients.filter(ing => !userIngredientNames.includes(ing));
      const missingBaseSample = missingBase.slice(0, 3);
      const missing = [...missingBaseSample, ...tpl.essential_additions];

      const totalIngCount = used.length + missing.length;
      const match_percentage = Math.round((used.length / (totalIngCount || 1)) * 100);

      return {
        name: tpl.name,
        time_minutes: tpl.prep_time + (used.length * 2),
        ingredients_used: used.map(capitalize),
        ingredients_missing: missing.map(capitalize),
        match_percentage: Math.min(95, Math.max(15, match_percentage)),
        steps: tpl.steps,
        difficulty: tpl.prep_time <= 15 ? "Easy" : "Medium",
        servings: 2,
        calories: 250 + (used.length * 45),
        dietary_tags: tpl.dietary_tags
      };
    });
  }

  function capitalize(s: string): string {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // 1. Image analyzer endpoint
  app.post("/api/detect-ingredients", async (req, res) => {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image base64 data." });
    }

    if (!apiKey || !aiClient) {
      console.warn("[detect-ingredients] Missing API key, simulating detection...");
      const simulated = ["Tomato", "Egg", "Onion", "Cheese", "Spinach"];
      return res.json({ ingredients: simulated, isFallback: true });
    }

    try {
      const imagePart = {
        inlineData: {
          data: image,
          mimeType: mimeType || "image/png",
        },
      };

      const promptPart = {
        text: "Identify all visible raw/fresh food items, vegetables, proteins, and ingredients in this kitchen fridge image. Return ONLY a JSON array of ingredient names in lowercase, with no extra formatting, markdown ticks, or text outside the array. Example format: [\"tomato\", \"egg\", \"onion\"]",
      };

      const { response, modelUsed } = await generateContentWithFallback({
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: "application/json",
        },
      });

      const textOutput = response.text || "[]";
      const parsed = JSON.parse(textOutput.trim());
      return res.json({ ingredients: parsed, modelUsed });
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error(`[detect-ingredients] Fail: ${errorMsg}`);
      const simulated = ["Tomato", "Egg", "Onion", "Cheese", "Spinach"];
      return res.json({ ingredients: simulated, isFallback: true });
    }
  });

  // 2. Recipe generation endpoint
  app.post("/api/generate-recipes", async (req, res) => {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Missing ingredients collection." });
    }

    if (!apiKey || !aiClient) {
      console.log("[generate-recipes] Missing key, returning offline generated fallback recipes.");
      const recipes = generateFallbackRecipes(ingredients);
      return res.json({ recipes, isFallback: true });
    }

    try {
      const ingredientListStr = ingredients
        .map((ing) => `${ing.name} (expiry: ${ing.expiry})`)
        .join(", ");

      const prompt = `You are a professional zero-waste gourmet chef. Formulate exactly 3 distinct, creative, healthy recipes utilizing the following kitchen ingredients: [${ingredientListStr}].
      
      CRITICAL INSTRUCTIONS:
      1. Actively prioritize using ingredients marked with expiry tags: "soon" or "medium" to avoid household food waste.
      2. Suggest minor standard household staples (such as oil, salt, garlic, pepper, water) for the missing list to ensure the recipe is fully complete.
      3. Return your output strictly as a JSON array matching this typescript schema:
      interface Recipe {
        name: string;
        time_minutes: number;
        ingredients_used: string[];
        ingredients_missing: string[];
        match_percentage: number;
        steps: string[];
        difficulty: string; // "Easy", "Medium", or "Advanced"
        servings: number; // e.g. 2, 4
        calories: number; // estimated kcal count
        dietary_tags: string[]; // list of matching dietary styles from: "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb" (provide any that apply)
      }
      For each recipe, calculate the "match_percentage" as: (total count of ingredients_used / (ingredients_used count + ingredients_missing count)) * 100.
      Do not wrap the JSON output in markdown blocks or extra characters. Just raw, pure valid JSON text matching the schema.`;

      const { response, modelUsed } = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const textOutput = response.text || "[]";
      const parsed = JSON.parse(textOutput.trim());
      return res.json({ recipes: parsed, isFallback: false, modelUsed });
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.warn(`[generate-recipes] Failed with error: ${errorMsg}. Activating offline fallback...`);
      const recipes = generateFallbackRecipes(ingredients);
      return res.json({ recipes, isFallback: true, error: errorMsg });
    }
  });

  // Vite middleware in development or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PantryChef Server] Active on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"} mode)`);
  });
}

startServer();

