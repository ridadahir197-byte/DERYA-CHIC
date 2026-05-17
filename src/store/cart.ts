import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  favorites: string[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (id: string, size: string, color?: string) => void;
  setQty: (id: string, size: string, qty: number, color?: string) => void;
  clear: () => void;
  toggleFav: (id: string) => void;
  count: () => number;
  total: () => number;
};

const sameVariant = (i: CartItem, id: string, size: string, color?: string) =>
  i.id === id && i.size === size && (i.color ?? "") === (color ?? "");

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      favorites: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => sameVariant(i, item.id, item.size, item.color));
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: item.quantity ?? 1 }] };
        }),
      remove: (id, size, color) =>
        set((s) => ({ items: s.items.filter((i) => !sameVariant(i, id, size, color)) })),
      setQty: (id, size, qty, color) =>
        set((s) => ({
          items: s.items
            .map((i) => (sameVariant(i, id, size, color) ? { ...i, quantity: qty } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      toggleFav: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      total: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    {
      name: "badyss-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never)
      ),
      skipHydration: true,
    }
  )
);
