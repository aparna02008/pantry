import { useState } from "react";
import { Recipe, Ingredient, CookedMealLog } from "../types";
import { Clock, CheckCircle2, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, RefreshCw, ChefHat, Info, Sparkles, XCircle } from "lucide-react";
import IngredientUsageChart from "./IngredientUsageChart";

interface RecipeSectionProps {
  recipes: Recipe[];
  isLoading: boolean;
  onGenerate: () => void;
  onRateRecipe: (id: string, rating: "up" | "down") => void;
  pantryIngredients: Ingredient[];
  apiError: string | null;
  onCookRecipe: (recipeName: string, usedIngredients: string[]) => void;
  cookedLogs: CookedMealLog[];
  onClearCookedLogs?: () => void;
  onSeedSampleData?: () => void;
}

export default function RecipeSection({
  recipes,
  isLoading,
  onGenerate,
  onRateRecipe,
  pantryIngredients,
  apiError,
  onCookRecipe,
  cookedLogs,
  onClearCookedLogs,
  onSeedSampleData,
}: RecipeSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<string>("All");

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (percentage >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const filteredRecipes = recipes.filter((recipe) => {
    if (dietaryFilter === "All") return true;
    if (!recipe.dietary_tags) return false;
    return recipe.dietary_tags.some(
      (tag) => tag.toLowerCase() === dietaryFilter.toLowerCase()
    );
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="recipe-engine-dashboard">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <ChefHat className="h-4.5 w-4.5 text-emerald-600" />
            Zero-Waste Menu Planner
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Custom chef formulas tailored to your active kitchen ingredients
          </p>
        </div>

        {pantryIngredients.length > 0 && (
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className={`text-xs font-extrabold tracking-wide text-white px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md active:scale-98"
            }`}
            id="btn-trigger-formulation"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Formulating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Formulate Recipes
              </>
            )}
          </button>
        )}
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-800 animate-fade-in" id="api-error-banner">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-medium">
            <strong className="font-extrabold block mb-0.5">AI Recipe Formulation Offline</strong>
            <p className="text-red-700">{apiError}</p>
            <p className="mt-2 text-red-600">
              💡 <strong>Instant Solution:</strong> Toggle <strong>"Simulation Demo Mode"</strong> in the top toolbar to run the generator offline using pre-cached Chef formulations instantly.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center" id="recipe-loading-state">
          <div className="relative inline-block mb-4">
            <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
            <ChefHat className="h-5 w-5 text-emerald-600 absolute top-3.5 left-3.5 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-gray-800">Chef is formulating custom dishes...</p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Sending your pantry inventory to Gemini Flash to match ingredients, minimize household food waste, and suggest clean culinary options.
          </p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="py-12 text-center" id="recipes-empty-state">
          <ChefHat className="h-10 w-10 text-gray-300 mx-auto mb-3.5" />
          {pantryIngredients.length === 0 ? (
            <div className="max-w-md mx-auto">
              <p className="text-sm font-bold text-gray-800">Your kitchen is a blank canvas!</p>
              <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                Add some leftover ingredients or scan a picture of your fridge. Once you have items on your shelf, click <strong>"Formulate Recipes"</strong> to generate zero-waste culinary options!
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <p className="text-sm font-bold text-gray-800">Your pantry is ready, let's cook!</p>
              <p className="text-xs text-gray-400 mt-1 px-4 leading-relaxed">
                You have {pantryIngredients.length} item(s) on your shelf. Click the <strong>"Formulate Recipes"</strong> button at the top right of this section to consult the AI chef!
              </p>
              <button
                onClick={onGenerate}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                id="btn-formulate-middle"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Formulate Recipes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4" id="recipes-grid">
          {/* Dietary Filters Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-150" id="dietary-filter-panel">
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              🥗 Dietary Filter:
            </span>
            <div className="flex flex-wrap gap-1">
              {["All", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb"].map((filter) => {
                const isActive = dietaryFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setDietaryFilter(filter)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer select-none ${
                      isActive
                        ? "bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                    }`}
                    id={`filter-btn-${filter.toLowerCase()}`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="py-12 text-center bg-gray-50/40 rounded-xl border border-dashed border-gray-250 p-6" id="recipes-filter-empty">
              <Info className="h-7 w-7 text-gray-350 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No matching dietary recipes found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                None of your 3 formulated recipes are tagged as "{dietaryFilter}". Try a different filter or tap "Formulate Recipes" again to cook something new!
              </p>
              <button
                onClick={() => setDietaryFilter("All")}
                className="mt-4 text-xs font-bold bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl transition-all cursor-pointer select-none shadow-xs"
                id="btn-clear-filter"
              >
                Show All Recipes
              </button>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const isExpanded = expandedId === recipe.id;
              return (
                <div
                  key={recipe.id}
                  className={`border rounded-xl transition-all ${
                    isExpanded ? "border-emerald-500 bg-emerald-50/5" : "border-gray-100 hover:bg-gray-50/30"
                  }`}
                  id={`recipe-card-${recipe.id}`}
                >
                  <div
                    onClick={() => toggleExpand(recipe.id)}
                    className="p-4 flex items-start justify-between cursor-pointer select-none"
                    id={`recipe-header-${recipe.id}`}
                  >
                    <div className="flex-1 pr-3">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight flex items-center gap-1.5 capitalize">
                        {recipe.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center mt-2">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {recipe.time_minutes} min
                        </span>
                        {recipe.difficulty && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            recipe.difficulty.toLowerCase() === "easy"
                              ? "bg-sky-50/60 text-sky-700 border-sky-100/70"
                              : recipe.difficulty.toLowerCase() === "medium"
                              ? "bg-amber-50/60 text-amber-700 border-amber-100/70"
                              : "bg-purple-50/60 text-purple-700 border-purple-100/70"
                          }`}>
                            {recipe.difficulty}
                          </span>
                        )}
                        {recipe.servings && (
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                            🍴 {recipe.servings} Servings
                          </span>
                        )}
                        {recipe.calories && (
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                            🔥 {recipe.calories} kcal
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getMatchColor(recipe.match_percentage)}`}>
                          {recipe.match_percentage}% Match
                        </span>
                        {recipe.dietary_tags && recipe.dietary_tags.map((tag) => (
                          <span key={tag} className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                            🌱 {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                  <div className="flex items-center space-x-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => onRateRecipe(recipe.id, "up")}
                        className={`p-1 rounded transition-colors ${
                          recipe.feedback === "up" ? "text-emerald-600 bg-white" : "text-gray-300 hover:text-gray-500"
                        }`}
                        title="Thumb Up"
                        id={`btn-rate-up-${recipe.id}`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onRateRecipe(recipe.id, "down")}
                        className={`p-1 rounded transition-colors ${
                          recipe.feedback === "down" ? "text-rose-600 bg-white" : "text-gray-300 hover:text-gray-500"
                        }`}
                        title="Thumb Down"
                        id={`btn-rate-down-${recipe.id}`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleExpand(recipe.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      id={`btn-toggle-expand-${recipe.id}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50/10 animate-fade-in" id={`recipe-expanded-${recipe.id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-700 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Pantry items used ({recipe.ingredients_used.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients_used.map((ing, i) => (
                            <span key={i} className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md capitalize">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 flex items-center gap-1.5 mb-2">
                          <Info className="h-3.5 w-3.5 text-slate-400" />
                          Extra staples / Missing ({recipe.ingredients_missing.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients_missing.length === 0 ? (
                            <span className="text-[10px] italic text-emerald-600 font-medium">None! Perfect zero-waste matchup! 🎉</span>
                          ) : (
                            recipe.ingredients_missing.map((ing, i) => (
                              <span key={i} className="text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-md capitalize">
                                {ing}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-gray-400 mb-2">
                        Culinary Instructions
                      </h4>
                      <ol className="space-y-2.5">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="flex items-start space-x-2.5">
                            <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 select-none">
                              {i + 1}
                            </span>
                            <span className="text-xs text-gray-700 leading-relaxed font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/15 p-3 rounded-xl border border-emerald-500/10">
                      <p className="text-[11px] text-gray-500 font-medium max-w-[280px]">
                        Finished cooking? Click to automatically clear the matched ingredients from your pantry shelf.
                      </p>
                      <button
                        onClick={() => onCookRecipe(recipe.name, recipe.ingredients_used)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5 select-none"
                        id={`btn-cook-recipe-${recipe.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                        I Cooked This! 🍳
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    )}

      {/* Ingredient Usage Analytics Section (Recharts Visualization) */}
      <IngredientUsageChart
        cookedLogs={cookedLogs}
        onClearLogs={onClearCookedLogs}
        onSeedSampleData={onSeedSampleData}
      />
    </div>
  );
}
