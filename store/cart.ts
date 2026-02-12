"use client";

import { create } from "zustand";

export type CartItem = {
  id: string;
  productId: string;
  nameSnapshot: string;
  quantity: number;
  priceCents: number;
  imageUrl?: string; // 👈 AJOUT

  customizations: {
    size?: "senior" | "mega";
    base?: "tomate" | "creme";

    removedIngredients?: string[];
    extraIngredients?: {
      name: string;
      priceCents: number;
    }[];

    meats?: string[]; // 👈 AJOUT
    exclusive?: { type: string }; // 👈 AJOUT
    panini?: any; // 👈 AJOUT
    pizzawich?: any; // 👈 AJOUT
    refreshment?: any; // 👈 AJOUT
    salade?: any; // 👈 AJOUT
    sauces?: string[]; // 👈 AJOUT
    menu?: any; // 👈 AJOUT
    ingredients?: string[]; // 👈 AJOUT
    cheesy?: boolean; // 👈 AJOUT
    extras?: string[]; // 👈 AJOUT
    variant?: string; // 👈 AJOUT
    takeawayOnly?: boolean; // 👈 IMPORTANT
  };
};

type CartState = {
  items: CartItem[];

  add: (item: Omit<CartItem, "id">) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;

  totalCents: () => number;
  count: () => number;
  canDeliver: () => boolean; // 👈 AJOUT
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  add: (item) =>
    set((state) => ({
      items: [...state.items, { ...item, id: uid() }],
    })),

  inc: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  dec: (id) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  clear: () => set({ items: [] }),

  totalCents: () =>
    get().items.reduce((total, item) => {
      const extras =
        item.customizations.extraIngredients?.reduce(
          (t, e) => t + e.priceCents,
          0
        ) ?? 0;

      return total + (item.priceCents + extras) * item.quantity;
    }, 0),

  count: () =>
    get().items.reduce((t, i) => t + i.quantity, 0),

  // ✅ LA FONCTION MANQUANTE
  canDeliver: () =>
    !get().items.some(
      (item) => item.customizations.takeawayOnly === true
    ),
}));

