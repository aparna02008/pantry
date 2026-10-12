export const MOCK_DETECTED_INGREDIENTS = [
  "Tomato",
  "Egg",
  "Onion",
  "Spinach",
  "Cheese",
  "Chicken Breast",
  "Cucumber"
];

export const MOCK_RECIPES = [
  {
    name: "Chef's Garden Miracle Sauté",
    time_minutes: 15,
    ingredients_used: ["Tomato", "Onion", "Spinach"],
    ingredients_missing: ["Garlic", "Olive Oil"],
    match_percentage: 60,
    steps: [
      "Chop the tomato, onion, and spinach into uniform pieces.",
      "Heat olive oil (or any available cooking oil) in a skillet over medium heat.",
      "Sauté onions and garlic (if available) until fragrant and translucent, about 3 minutes.",
      "Add tomatoes and spinach, stir-frying gently for another 4-5 minutes.",
      "Season with salt and pepper to taste and serve as a wholesome, fresh side!"
    ]
  },
  {
    name: "Heritage Golden Skillet Bowl",
    time_minutes: 10,
    ingredients_used: ["Egg", "Onion", "Cheese"],
    ingredients_missing: ["Butter", "Chili Flakes"],
    match_percentage: 60,
    steps: [
      "Whisk eggs in a small bowl with a pinch of salt.",
      "Finely chop onions. Grate or crumble cheese of choice.",
      "Heat a small knob of butter in your non-stick skillet over medium-low heat.",
      "Pour whisked eggs in, scatter onions and cheese on top immediately.",
      "Fold the omelet carefully as it sets. Slide onto a warm plate and enjoy hot!"
    ]
  },
  {
    name: "Rustic Zero-Waste Savory Medley",
    time_minutes: 8,
    ingredients_used: ["Tomato", "Cucumber", "Cheese"],
    ingredients_missing: ["Olive Oil", "Lemon Juice"],
    match_percentage: 75,
    steps: [
      "Rinse tomatoes and cucumber, then slice into bite-sized cubes.",
      "Combine them in a wide mixing bowl.",
      "Toss in crumbled cheese and drizzle with olive oil and fresh lemon juice if available.",
      "Garnish with black pepper or salt for a simple, light salad."
    ]
  }
];
