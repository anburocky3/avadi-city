import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WardState {
  overrideWardId: number | null;
  setOverrideWardId: (id: number | null) => void;
}

export const useWardStore = create<WardState>()(
  persist(
    (set) => ({
      overrideWardId: null,
      setOverrideWardId: (id) => set({ overrideWardId: id }),
    }),
    {
      name: "active-ward-storage",
    },
  ),
);
