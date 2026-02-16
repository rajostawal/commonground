import {
  Apple,
  Croissant,
  Milk,
  Leaf,
  Snowflake,
  SprayCan,
  Home,
  Wine,
  Pill,
  Baby,
  Dog,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: "fruits-vegetables", label: "Fruits & Vegetables", icon: Apple, emoji: "🥬" },
  { id: "bread-pastries", label: "Bread & Pastries", icon: Croissant, emoji: "🍞" },
  { id: "dairy", label: "Milk & Cheese", icon: Milk, emoji: "🧀" },
  { id: "ingredients-spices", label: "Ingredients & Spices", icon: Leaf, emoji: "🧂" },
  { id: "frozen", label: "Frozen Items", icon: Snowflake, emoji: "🧊" },
  { id: "cleaning", label: "Cleaning Supplies", icon: SprayCan, emoji: "🧹" },
  { id: "household", label: "Household Items", icon: Home, emoji: "🏠" },
  { id: "beverages", label: "Beverages", icon: Wine, emoji: "🥤" },
  { id: "health", label: "Health & Pharmacy", icon: Pill, emoji: "💊" },
  { id: "baby", label: "Baby & Kids", icon: Baby, emoji: "👶" },
  { id: "pets", label: "Pets", icon: Dog, emoji: "🐾" },
  { id: "other", label: "Other", icon: Package, emoji: "📦" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryForItem(name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  return ITEM_CATEGORY_MAP[lower];
}

export function getCategoryIcon(categoryId: string | undefined): Category | undefined {
  if (!categoryId) return undefined;
  return CATEGORY_MAP[categoryId];
}

/**
 * Default item image emoji for common grocery items.
 * Maps lowercase item name -> emoji.
 */
export const ITEM_EMOJI_MAP: Record<string, string> = {
  // Fruits & Vegetables
  tomato: "🍅", tomatoes: "🍅",
  potato: "🥔", potatoes: "🥔",
  onion: "🧅", onions: "🧅",
  garlic: "🧄",
  carrot: "🥕", carrots: "🥕",
  broccoli: "🥦",
  lettuce: "🥬", salad: "🥗",
  cucumber: "🥒", cucumbers: "🥒",
  pepper: "🌶️", peppers: "🌶️", "bell pepper": "🫑",
  corn: "🌽",
  mushroom: "🍄", mushrooms: "🍄",
  avocado: "🥑",
  apple: "🍎", apples: "🍎",
  banana: "🍌", bananas: "🍌",
  orange: "🍊", oranges: "🍊",
  lemon: "🍋", lemons: "🍋",
  strawberry: "🍓", strawberries: "🍓",
  blueberry: "🫐", blueberries: "🫐",
  grape: "🍇", grapes: "🍇",
  watermelon: "🍉",
  pineapple: "🍍",
  mango: "🥭",
  peach: "🍑", peaches: "🍑",
  cherry: "🍒", cherries: "🍒",
  pear: "🍐", pears: "🍐",
  kiwi: "🥝",
  coconut: "🥥",
  ginger: "🫚",
  spinach: "🥬",

  // Bread & Pastries
  bread: "🍞",
  bagel: "🥯", bagels: "🥯",
  croissant: "🥐", croissants: "🥐",
  pretzel: "🥨",
  pancake: "🥞", pancakes: "🥞",
  waffle: "🧇", waffles: "🧇",
  tortilla: "🫓", tortillas: "🫓",

  // Dairy
  milk: "🥛",
  cheese: "🧀",
  butter: "🧈",
  yogurt: "🥛",
  cream: "🥛",
  egg: "🥚", eggs: "🥚",
  "ice cream": "🍦",

  // Meat & Protein
  chicken: "🍗",
  beef: "🥩", steak: "🥩",
  pork: "🥓", bacon: "🥓",
  sausage: "🌭",
  fish: "🐟", salmon: "🐟", tuna: "🐟",
  shrimp: "🍤",

  // Pantry & Staples
  rice: "🍚",
  pasta: "🍝", spaghetti: "🍝", noodles: "🍝",
  flour: "🌾",
  sugar: "🧂",
  salt: "🧂",
  oil: "🫒", "olive oil": "🫒",
  honey: "🍯",
  "peanut butter": "🥜",
  jam: "🍯",
  cereal: "🥣",
  oats: "🥣",

  // Beverages
  water: "💧",
  juice: "🧃",
  coffee: "☕",
  tea: "🍵",
  beer: "🍺",
  wine: "🍷",
  soda: "🥤", cola: "🥤",

  // Snacks
  chips: "🍟",
  chocolate: "🍫",
  cookie: "🍪", cookies: "🍪",
  candy: "🍬",
  popcorn: "🍿",
  nuts: "🥜",

  // Cleaning & Household
  soap: "🧼",
  detergent: "🧴",
  shampoo: "🧴",
  toothpaste: "🪥",
  "toilet paper": "🧻",
  "paper towels": "🧻",
  sponge: "🧽",
  "trash bags": "🗑️",
  candles: "🕯️",
  batteries: "🔋",
  lightbulb: "💡",

  // Baby
  diapers: "🧷",
  "baby food": "🍼",
  formula: "🍼",
};

/** Auto-detect category from item name */
const ITEM_CATEGORY_MAP: Record<string, string> = {};

// Fruits & Vegetables
for (const name of [
  "tomato", "tomatoes", "potato", "potatoes", "onion", "onions", "garlic",
  "carrot", "carrots", "broccoli", "lettuce", "salad", "cucumber", "cucumbers",
  "pepper", "peppers", "bell pepper", "corn", "mushroom", "mushrooms",
  "avocado", "apple", "apples", "banana", "bananas", "orange", "oranges",
  "lemon", "lemons", "strawberry", "strawberries", "blueberry", "blueberries",
  "grape", "grapes", "watermelon", "pineapple", "mango", "peach", "peaches",
  "cherry", "cherries", "pear", "pears", "kiwi", "coconut", "ginger", "spinach",
]) {
  ITEM_CATEGORY_MAP[name] = "fruits-vegetables";
}

// Bread & Pastries
for (const name of [
  "bread", "bagel", "bagels", "croissant", "croissants", "pretzel",
  "pancake", "pancakes", "waffle", "waffles", "tortilla", "tortillas",
]) {
  ITEM_CATEGORY_MAP[name] = "bread-pastries";
}

// Dairy
for (const name of [
  "milk", "cheese", "butter", "yogurt", "cream", "egg", "eggs", "ice cream",
]) {
  ITEM_CATEGORY_MAP[name] = "dairy";
}

// Beverages
for (const name of [
  "water", "juice", "coffee", "tea", "beer", "wine", "soda", "cola",
]) {
  ITEM_CATEGORY_MAP[name] = "beverages";
}

// Cleaning
for (const name of [
  "soap", "detergent", "shampoo", "sponge", "trash bags",
]) {
  ITEM_CATEGORY_MAP[name] = "cleaning";
}

// Household
for (const name of [
  "toilet paper", "paper towels", "candles", "batteries", "lightbulb",
  "toothpaste",
]) {
  ITEM_CATEGORY_MAP[name] = "household";
}

// Health
for (const name of [
  "vitamins", "bandaids", "medicine", "aspirin", "ibuprofen",
]) {
  ITEM_CATEGORY_MAP[name] = "health";
}

// Baby
for (const name of ["diapers", "baby food", "formula"]) {
  ITEM_CATEGORY_MAP[name] = "baby";
}

// Frozen
for (const name of ["frozen pizza", "frozen vegetables", "ice cream"]) {
  ITEM_CATEGORY_MAP[name] = "frozen";
}

export function getItemEmoji(name: string): string {
  return ITEM_EMOJI_MAP[name.toLowerCase().trim()] ?? "🛒";
}
