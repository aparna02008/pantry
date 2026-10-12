import { useState } from "react";
import { Ingredient, ExpiryStatus } from "../types";
import { Plus as PlusIcon, Trash2 as TrashIcon, Utensils as UtensilsIcon, AlertTriangle as AlertIcon, Salad as SaladIcon } from "lucide-react";

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onAddIngredient: (name: string, expiry: ExpiryStatus) => void;
  onUpdateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
  onClearAll: () => void;
}

export default function IngredientManager({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onClearAll,
}: IngredientManagerProps) {
  const [nameInput, setNameInput] = useState("");
  const [expiryInput, setExpiryInput] = useState<ExpiryStatus>("fresh");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onAddIngredient(nameInput.trim(), expiryInput);
    setNameInput("");
  };

  const getExpiryStyle = (status: ExpiryStatus) => {
    switch (status) {
      case "soon":
        return "bg-rose-50 text-rose-700 border-rose-100/80";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-100/80";
      case "fresh":
        return "bg-emerald-50 text-emerald-700 border-emerald-100/80";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="ingredient-shelf-manager">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <SaladIcon className="h-4.5 w-4.5 text-emerald-600" />
            Kitchen Pantry Shelf
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Manage your available ingredients and expiration tags
          </p>
        </div>
        {ingredients.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors cursor-pointer animate-fade-in"
            id="btn-clear-all-ingredients"
          >
            Clear Shelf
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-5 flex flex-wrap gap-2 items-center" id="form-manual-add">
        <div className="flex-1 min-w-[150px]">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Type ingredient (e.g. Garlic, Tofu)"
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            id="input-ingredient-name"
          />
        </div>
        <div className="shrink-0">
          <select
            value={expiryInput}
            onChange={(e) => setExpiryInput(e.target.value as ExpiryStatus)}
            className="text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
            id="select-ingredient-expiry"
          >
            <option value="fresh">Fresh (Good)</option>
            <option value="medium">Medium (Use soon)</option>
            <option value="soon">Expires Soon (Urgent!)</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          id="btn-add-ingredient"
          title="Add Ingredient"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </form>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin" id="ingredient-list-scroller">
        {ingredients.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200/60">
            Pantry is currently empty. Use the scanner above or type ingredients manually to begin!
          </div>
        ) : (
          ingredients.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50/40 transition-colors"
              id={`item-row-${item.id}`}
            >
              <div className="flex items-center space-x-2.5">
                <UtensilsIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-800 capitalize leading-none">{item.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={item.expiry}
                  onChange={(e) => onUpdateIngredient(item.id, { expiry: e.target.value as ExpiryStatus })}
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border cursor-pointer ${getExpiryStyle(
                    item.expiry
                  )}`}
                  id={`select-expiry-row-${item.id}`}
                >
                  <option value="fresh">Fresh</option>
                  <option value="medium">Medium</option>
                  <option value="soon">Soon ⚠️</option>
                </select>

                <button
                  onClick={() => onDeleteIngredient(item.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer rounded hover:bg-gray-50"
                  title="Remove Item"
                  id={`btn-delete-row-${item.id}`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-start space-x-2">
          <AlertIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Pro-Tip: Ingredients marked with <strong className="text-amber-600 font-bold">SOON</strong> or <strong className="text-amber-600 font-bold">MEDIUM</strong> are prioritized by the Gemini AI Formulation engine to design recipes that reduce kitchen waste.
          </p>
        </div>
      )}
    </div>
  );
}
