import { useState, useEffect } from "react";
import { Sparkles, Soup, Heart, Cpu } from "lucide-react";
import confetti from "canvas-confetti";
import { Ingredient, Recipe, ExpiryStatus, CookedMealLog } from "./types";

const INITIAL_SAMPLE_COOKED_LOGS: CookedMealLog[] = [
  {
    id: "sample-1",
    recipeName: "Rustic Tomato & Garlic Omelette",
    ingredientsUsed: ["tomato", "egg", "garlic", "olive oil"],
    timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
    date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-2",
    recipeName: "Creamy Tomato Basil Soup",
    ingredientsUsed: ["tomato", "basil", "cream", "onion"],
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-3",
    recipeName: "Caramelized Onion & Spinach Frittata",
    ingredientsUsed: ["onion", "spinach", "egg", "cheese"],
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-4",
    recipeName: "Garlic Butter Mushroom Pasta",
    ingredientsUsed: ["mushroom", "garlic", "butter", "pasta", "parmesan"],
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-5",
    recipeName: "Zesty Bell Pepper Stir-Fry",
    ingredientsUsed: ["bell pepper", "onion", "soy sauce", "garlic", "tofu"],
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-6",
    recipeName: "Savory Tomato Onion Tart",
    ingredientsUsed: ["tomato", "onion", "egg", "puff pastry"],
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "sample-7",
    recipeName: "Pantry Hash with Egg & Peppers",
    ingredientsUsed: ["potato", "egg", "bell pepper", "onion"],
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
  },
];
import { MOCK_DETECTED_INGREDIENTS } from "./mockData";
import ImageUploader from "./components/ImageUploader";
import IngredientManager from "./components/IngredientManager";
import RecipeSection from "./components/RecipeSection";
import LogConsole, { LogEntry } from "./components/LogConsole";
import { getFirebase } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [cookedLogs, setCookedLogs] = useState<CookedMealLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  // Firebase integration states
  const [authInstance, setAuthInstance] = useState<any>(null);
  const [dbInstance, setDbInstance] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  const addLog = (type: "success" | "error" | "info", message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newEntry: LogEntry = {
      timestamp: timeStr,
      type,
      message,
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  // 1. Initialize Firebase services and state
  useEffect(() => {
    addLog("info", "Welcome to PantryChef! Ready to plan zero-waste menus.");
    getFirebase()
      .then(({ auth, db }) => {
        setAuthInstance(auth);
        setDbInstance(db);
        setFirebaseLoading(false);

        onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            addLog("success", `Signed in successfully as ${currentUser.email}!`);
            
            // Auto-merge local items into Cloud on login
            try {
              const localStored = localStorage.getItem("pantry_items_offline");
              if (localStored) {
                const parsed: Ingredient[] = JSON.parse(localStored);
                if (parsed.length > 0) {
                  addLog("info", `Merging ${parsed.length} local pantry items into your cloud account...`);
                  const batch = writeBatch(db);
                  parsed.forEach((item) => {
                    const itemRef = doc(db, "users", currentUser.uid, "ingredients", item.id);
                    batch.set(itemRef, item);
                  });
                  await batch.commit();
                  addLog("success", `Successfully synced and merged local items into cloud account!`);
                  localStorage.removeItem("pantry_items_offline");
                }
              }
            } catch (mergeErr: any) {
              console.error("Merge error:", mergeErr);
              addLog("error", `Could not merge local items to Cloud: ${mergeErr.message}`);
            }
          } else {
            addLog("info", "Running in offline Guest mode. Click 'Cloud Sign In' to keep your items synced.");
          }
        });
      })
      .catch((err) => {
        console.error("Firebase initialization failed:", err);
        setFirebaseLoading(false);
        addLog("error", "Could not connect to Firebase database. Running in local-only offline mode.");
      });
  }, []);

  // 2. Synchronize ingredients from Firestore (if logged in) or LocalStorage (if Guest)
  useEffect(() => {
    if (!dbInstance || !user) {
      // Offline/Guest Mode
      try {
        const stored = localStorage.getItem("pantry_items_offline");
        if (stored) {
          const parsed: Ingredient[] = JSON.parse(stored);
          setIngredients(parsed);
        } else {
          const defaults: Ingredient[] = [
            {
              id: `init-1-${Date.now()}`,
              name: "tomato",
              expiry: "soon",
              dateAdded: new Date().toISOString(),
            },
            {
              id: `init-2-${Date.now()}`,
              name: "egg",
              expiry: "medium",
              dateAdded: new Date().toISOString(),
            },
            {
              id: `init-3-${Date.now()}`,
              name: "onion",
              expiry: "fresh",
              dateAdded: new Date().toISOString(),
            },
          ];
          setIngredients(defaults);
          localStorage.setItem("pantry_items_offline", JSON.stringify(defaults));
          addLog("info", "Initialized starter shelf ingredients (Tomato, Egg, Onion) for testing!");
        }
      } catch (err: any) {
        addLog("error", "Could not load pantry items from local browser state.");
      }
      return;
    }

    // Cloud Mode: Listen to user's personal collection reactively
    const unsubscribe = onSnapshot(
      collection(dbInstance, "users", user.uid, "ingredients"),
      (snapshot) => {
        const cloudIngredients: Ingredient[] = [];
        snapshot.forEach((doc) => {
          cloudIngredients.push(doc.data() as Ingredient);
        });
        cloudIngredients.sort((a, b) => a.name.localeCompare(b.name));
        setIngredients(cloudIngredients);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        addLog("error", `Cloud synchronization failure: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, [dbInstance, user]);

  // 3. Synchronize cooked logs from Firestore or LocalStorage
  useEffect(() => {
    if (!dbInstance || !user) {
      try {
        const storedLogs = localStorage.getItem("pantry_cooked_logs_offline");
        if (storedLogs) {
          setCookedLogs(JSON.parse(storedLogs));
        } else {
          setCookedLogs(INITIAL_SAMPLE_COOKED_LOGS);
          localStorage.setItem("pantry_cooked_logs_offline", JSON.stringify(INITIAL_SAMPLE_COOKED_LOGS));
        }
      } catch (err: any) {
        console.error("Could not load cooked logs from local browser storage", err);
      }
      return;
    }

    const unsubscribe = onSnapshot(
      collection(dbInstance, "users", user.uid, "cookedLogs"),
      (snapshot) => {
        const logsList: CookedMealLog[] = [];
        snapshot.forEach((d) => {
          logsList.push(d.data() as CookedMealLog);
        });
        logsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setCookedLogs(logsList);
      },
      (error) => {
        console.error("Cooked logs subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [dbInstance, user]);

  const handleClearCookedLogs = async () => {
    if (user && dbInstance) {
      try {
        const batch = writeBatch(dbInstance);
        cookedLogs.forEach((log) => {
          const ref = doc(dbInstance, "users", user.uid, "cookedLogs", log.id);
          batch.delete(ref);
        });
        await batch.commit();
        addLog("info", "Cleared cooking history analytics from Cloud profile.");
      } catch (err: any) {
        addLog("error", `Failed to clear cooked logs from Cloud: ${err.message}`);
      }
    } else {
      setCookedLogs([]);
      localStorage.removeItem("pantry_cooked_logs_offline");
      addLog("info", "Cleared local cooking history analytics.");
    }
  };

  const handleSeedSampleData = async () => {
    if (user && dbInstance) {
      try {
        const batch = writeBatch(dbInstance);
        INITIAL_SAMPLE_COOKED_LOGS.forEach((log) => {
          const ref = doc(dbInstance, "users", user.uid, "cookedLogs", log.id);
          batch.set(ref, log);
        });
        await batch.commit();
        addLog("success", "Loaded sample cooking analytics data to Cloud profile!");
      } catch (err: any) {
        addLog("error", `Failed to seed sample logs: ${err.message}`);
      }
    } else {
      setCookedLogs(INITIAL_SAMPLE_COOKED_LOGS);
      localStorage.setItem("pantry_cooked_logs_offline", JSON.stringify(INITIAL_SAMPLE_COOKED_LOGS));
      addLog("success", "Loaded sample cooking analytics data!");
    }
  };

  const saveToStorage = (updatedList: Ingredient[]) => {
    try {
      localStorage.setItem("pantry_items_offline", JSON.stringify(updatedList));
      setIngredients(updatedList);
    } catch (err: any) {
      addLog("error", "State synchronization write error on local browser cache.");
    }
  };

  const handleIngredientsDetected = async (newDetectedNames: string[]) => {
    if (newDetectedNames.length === 0) return;

    addLog("info", `Ingredient parser action: Adding ${newDetectedNames.length} scanned items...`);
    const currentNames = ingredients.map((i) => i.name.toLowerCase());
    const duplicatesFiltered: string[] = [];
    const itemsToAdd: Ingredient[] = [];

    newDetectedNames.forEach((name, idx) => {
      const cleanName = name.toLowerCase().trim();
      if (!currentNames.includes(cleanName)) {
        const newItem: Ingredient = {
          id: `det-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
          name: cleanName,
          expiry: "fresh",
          dateAdded: new Date().toISOString()
        };
        itemsToAdd.push(newItem);
        duplicatesFiltered.push(cleanName);
      }
    });

    if (itemsToAdd.length > 0) {
      if (user && dbInstance) {
        try {
          const batch = writeBatch(dbInstance);
          itemsToAdd.forEach((item) => {
            const itemRef = doc(dbInstance, "users", user.uid, "ingredients", item.id);
            batch.set(itemRef, item);
          });
          await batch.commit();
        } catch (err: any) {
          addLog("error", `Failed to save detected items to Cloud: ${err.message}`);
        }
      } else {
        const updated = [...ingredients, ...itemsToAdd];
        updated.sort((a, b) => a.name.localeCompare(b.name));
        saveToStorage(updated);
      }

      addLog("success", `Newly detected items registered on shelf: [${duplicatesFiltered.join(", ")}]`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } else {
      addLog("info", "All parsed scanned items were already present in your pantry list.");
    }
  };

  const handleSetDemoIngredients = async () => {
    addLog("info", "Demo trigger requested. Loading comprehensive starter pack...");
    const demoItems: Ingredient[] = MOCK_DETECTED_INGREDIENTS.map((name, idx) => {
      const expChoices: ExpiryStatus[] = ["soon", "medium", "fresh"];
      const expiry = expChoices[idx % expChoices.length];
      return {
        id: `demo-${idx}-${Date.now()}`,
        name: name.toLowerCase().trim(),
        expiry,
        dateAdded: new Date().toISOString()
      };
    });

    demoItems.sort((a, b) => a.name.localeCompare(b.name));

    if (user && dbInstance) {
      try {
        const batch = writeBatch(dbInstance);
        demoItems.forEach((item) => {
          const itemRef = doc(dbInstance, "users", user.uid, "ingredients", item.id);
          batch.set(itemRef, item);
        });
        await batch.commit();
      } catch (err: any) {
        addLog("error", `Failed to set demo ingredients in Cloud: ${err.message}`);
      }
    } else {
      saveToStorage(demoItems);
    }

    addLog("success", "Demo state synchronized: Shelf populated with realistic ingredients.");
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  const addIngredient = async (name: string, expiry: ExpiryStatus) => {
    const itemClean = name.toLowerCase().trim();
    if (ingredients.some((i) => i.name.toLowerCase() === itemClean)) {
      addLog("info", `"${name}" is already listed in your pantry.`);
      return;
    }

    const newItem: Ingredient = {
      id: `add-${Date.now()}`,
      name: itemClean,
      expiry,
      dateAdded: new Date().toISOString()
    };

    if (user && dbInstance) {
      try {
        await setDoc(doc(dbInstance, "users", user.uid, "ingredients", newItem.id), newItem);
      } catch (err: any) {
        addLog("error", `Failed to add ingredient to Cloud: ${err.message}`);
      }
    } else {
      const updated = [...ingredients, newItem];
      updated.sort((a, b) => a.name.localeCompare(b.name));
      saveToStorage(updated);
    }

    addLog("success", `Added ingredient: "${itemClean}" (${expiry.toUpperCase()})`);
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const item = ingredients.find((i) => i.id === id);
    if (!item) return;

    if (updates.expiry) {
      addLog("info", `Updated expiration tag of "${item.name}" to: ${updates.expiry.toUpperCase()}`);
    }

    if (user && dbInstance) {
      try {
        const updatedItem = { ...item, ...updates };
        await setDoc(doc(dbInstance, "users", user.uid, "ingredients", id), updatedItem);
      } catch (err: any) {
        addLog("error", `Failed to update ingredient in Cloud: ${err.message}`);
      }
    } else {
      const updated = ingredients.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      });
      saveToStorage(updated);
    }
  };

  const deleteIngredient = async (id: string) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target) return;

    if (user && dbInstance) {
      try {
        await deleteDoc(doc(dbInstance, "users", user.uid, "ingredients", id));
        addLog("info", `Removed "${target.name}" from your cloud pantry list.`);
      } catch (err: any) {
        addLog("error", `Failed to delete ingredient from Cloud: ${err.message}`);
      }
    } else {
      const updated = ingredients.filter((i) => i.id !== id);
      saveToStorage(updated);
      addLog("info", `Removed "${target.name}" from your active pantry list.`);
    }
  };

  const clearAllIngredients = async () => {
    if (user && dbInstance) {
      try {
        addLog("info", "Clearing all ingredients from your cloud pantry...");
        const batch = writeBatch(dbInstance);
        ingredients.forEach((item) => {
          const itemRef = doc(dbInstance, "users", user.uid, "ingredients", item.id);
          batch.delete(itemRef);
        });
        await batch.commit();
        setRecipes([]);
        setApiError(null);
        addLog("success", "Cleared cloud kitchen shelf.");
      } catch (err: any) {
        addLog("error", `Failed to clear Cloud shelf: ${err.message}`);
      }
    } else {
      saveToStorage([]);
      setRecipes([]);
      setApiError(null);
      addLog("info", "Cleared kitchen workspace and cached recipes.");
    }
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      addLog("error", "Action failed: Pantry shelf is empty. Add elements before generating.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    addLog("info", `Connecting to server proxy ... Sending list of ${ingredients.length} items to Gemini Flash AI.`);
    try {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients, demoMode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server returned error status: ${response.status}`);
      }

      const generatedList = data.recipes || [];
      const formattedList = generatedList.map((rec: any, idx: number) => ({
        ...rec,
        id: rec.id || `rec-gem-${idx}-${Date.now()}`
      }));

      setRecipes(formattedList);
      setIsLoading(false);

      if (data.isFallback) {
        addLog("info", "Notice: Gemini API is under heavy load (503). PantryChef Fallback Engine dynamically generated matching recipes for you!");
      } else {
        const modelInfo = data.modelUsed ? ` via ${data.modelUsed}` : "";
        addLog("success", `AI Formulation query completed successfully${modelInfo}! Received ${formattedList.length} customized recipes.`);
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setIsLoading(false);
      const rawMsg = err?.message || String(err);
      setApiError(rawMsg);
      addLog("error", `AI request failed: [${rawMsg}]. You can toggle "Demo Mode" on the toolbar to try instant customized mock recipes!`);
    }
  };

  const rateRecipe = (id: string, rating: "up" | "down") => {
    const updated = recipes.map((rec) => {
      if (rec.id === id) {
        const nextFeedback = rec.feedback === rating ? null : rating;
        addLog(
          "info",
          `User rating on "${rec.name}": ${nextFeedback ? nextFeedback.toUpperCase() : "CLEARED"}`
        );
        return { ...rec, feedback: nextFeedback };
      }
      return rec;
    });
    setRecipes(updated);
  };

  const handleCookRecipe = async (recipeName: string, usedIngredients: string[]) => {
    addLog("info", `Registering meal consumption: "${recipeName}" ...`);
    const lowercaseUsed = usedIngredients.map((i) => i.toLowerCase().trim());
    
    const matchedItems = ingredients.filter((item) => 
      lowercaseUsed.includes(item.name.toLowerCase().trim())
    );

    const nowIso = new Date().toISOString();
    const newLog: CookedMealLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipeName,
      ingredientsUsed: usedIngredients,
      timestamp: nowIso,
      date: nowIso.split("T")[0],
    };

    if (user && dbInstance) {
      try {
        const batch = writeBatch(dbInstance);
        matchedItems.forEach((item) => {
          const itemRef = doc(dbInstance, "users", user.uid, "ingredients", item.id);
          batch.delete(itemRef);
        });
        const logRef = doc(dbInstance, "users", user.uid, "cookedLogs", newLog.id);
        batch.set(logRef, newLog);
        await batch.commit();
      } catch (err: any) {
        addLog("error", `Failed to deplete ingredients or record cooking log in Cloud: ${err.message}`);
      }
    } else {
      const updated = ingredients.filter((item) => {
        const match = lowercaseUsed.includes(item.name.toLowerCase().trim());
        return !match;
      });
      saveToStorage(updated);

      const updatedLogs = [...cookedLogs, newLog];
      setCookedLogs(updatedLogs);
      localStorage.setItem("pantry_cooked_logs_offline", JSON.stringify(updatedLogs));
    }

    if (matchedItems.length > 0) {
      const deletedNames = matchedItems.map((item) => item.name);
      addLog(
        "success",
        `Enjoy your meal! Depleted ${deletedNames.length} cooked items from pantry: [${deletedNames.join(", ")}] and logged analytics!`
      );
    } else {
      addLog(
        "success",
        `Enjoy your meal! Logged "${recipeName}" in cooking analytics history.`
      );
    }

    confetti({
      particleCount: 150,
      spread: 85,
      origin: { y: 0.5 }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-800 flex flex-col font-sans" id="chef-app-root">
      {/* Dev Status Toolbar */}
      <div className="bg-gray-950 border-b border-gray-900 text-gray-300 py-2.5 px-4 flex flex-wrap items-center justify-between text-xs font-mono gap-3 select-none" id="developer-shelf-toolbar">
        <div className="flex items-center space-x-2.5">
          <Cpu className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="text-gray-400">PROVIDER ACTIVE:</span>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
            Google Gemini API
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">MODE:</span>
          {user ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              ☁️ Cloud Sync Active
            </span>
          ) : (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              ⚡ Offline Local Storage
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4" id="toolbar-actions-group">
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-850 py-0.5 px-2.5 rounded-lg" id="demo-mode-toggle-block">
            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">
              Simulation Demo Mode:
            </span>
            <label className="relative inline-flex items-center cursor-pointer" id="toggle-label">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setDemoMode(nextVal);
                  setRecipes([]);
                  addLog(
                    "info",
                    nextVal
                      ? "Switched to DEMO mock mode. Recipes will generate instantly without requiring active server proxy channels."
                      : "Switched to LIVE proxy mode. Recipes will process live using Google Gemini flash service."
                  );
                }}
                className="sr-only peer"
                id="demo-mode-checkbox"
              />
              <div className="w-8 h-4 bg-gray-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="border-l border-gray-800 h-4" />

          {firebaseLoading ? (
            <span className="text-gray-500 font-bold text-[10px] animate-pulse">Connecting Cloud...</span>
          ) : user ? (
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/40 truncate max-w-[120px]">
                👤 {user.email}
              </span>
              <button
                onClick={() => {
                  if (authInstance) {
                    authInstance.signOut();
                    addLog("info", "Signed out of your Cloud profile.");
                  }
                }}
                className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-bold px-2 py-0.5 rounded border border-gray-800 transition-colors cursor-pointer text-[9px] uppercase tracking-wider"
                id="btn-signout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded border border-emerald-500/20 transition-all cursor-pointer text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs font-mono"
              id="btn-signin-modal"
            >
              ☁️ Cloud Sign In
            </button>
          )}
        </div>
      </div>

      <header className="max-w-7xl mx-auto w-full px-4 pt-8 pb-4" id="app-visual-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/60 pb-5 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-xs transition-colors" id="logo-icon-wrap">
              <Soup className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5 leading-none">
                PantryChef
                <Sparkles className="h-4.5 w-4.5 text-emerald-600 inline animate-pulse" />
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Scan fridge photos to detect items and formulate waste-free meals.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {user ? (
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Cloud Synced
                </span>
                <span className="text-xs font-bold text-gray-900">{user.email}</span>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-150 cursor-pointer transition-all"
                id="header-cloud-btn"
              >
                ☁️ Sync Account
              </button>
            )}
            
            <div className="flex gap-1.5 items-center font-serif italic text-sm text-gray-500 bg-gray-100/60 px-3 py-1.5 rounded-lg border border-gray-200/40">
              <Heart className="h-4 w-4 text-emerald-600 shrink-0 fill-emerald-600" />
              Zero Waste Kitchen
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="app-main-grid">
        <div className="lg:col-span-5 space-y-6" id="setup-column">
          <ImageUploader
            onIngredientsDetected={handleIngredientsDetected}
            onAddLog={addLog}
            demoMode={demoMode}
            onSetDemoIngredients={handleSetDemoIngredients}
          />

          <IngredientManager
            ingredients={ingredients}
            onAddIngredient={addIngredient}
            onUpdateIngredient={updateIngredient}
            onDeleteIngredient={deleteIngredient}
            onClearAll={clearAllIngredients}
          />
        </div>

        <div className="lg:col-span-7" id="recipe-results-column">
          <RecipeSection
            recipes={recipes}
            isLoading={isLoading}
            onGenerate={generateRecipes}
            onRateRecipe={rateRecipe}
            pantryIngredients={ingredients}
            apiError={apiError}
            onCookRecipe={handleCookRecipe}
            cookedLogs={cookedLogs}
            onClearCookedLogs={handleClearCookedLogs}
            onSeedSampleData={handleSeedSampleData}
          />
        </div>
      </main>

      <footer className="mt-12 bg-gray-100 border-t border-gray-200 pb-8 pt-6" id="logs-diagnostics-footer">
        <div className="max-w-7xl mx-auto w-full px-4">
          <LogConsole logs={logs} onClear={() => setLogs([])} />
        </div>
      </footer>

      {authInstance && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          auth={authInstance}
          onSuccess={(email, action) => {
            if (action === "signup") {
              addLog("success", `Created Cloud profile for ${email}!`);
            } else {
              addLog("success", `Signed in as ${email}. Your pantry is synced!`);
            }
          }}
        />
      )}
    </div>
  );
}
