export interface Ingredient {
  id: string;
  name: string;
  expiry: ExpiryStatus;
  dateAdded: string;
}

export interface Recipe {
  id: string;
  name: string;
  time_minutes: number;
  ingredients_used: string[];
  ingredients_missing: string[];
  match_percentage: number;
  steps: string[];
  feedback?: "up" | "down" | null;
  difficulty?: string;
  servings?: number;
  calories?: number;
  dietary_tags?: string[];
}

export type ExpiryStatus = "soon" | "medium" | "fresh";

export interface CookedMealLog {
  id: string;
  recipeName: string;
  ingredientsUsed: string[];
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
}
