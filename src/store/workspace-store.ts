"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SMART_TEMPLATE_ID } from "@/lib/templates";
import type { WorkspaceImage } from "@/types/workspace";

export type WorkspaceState = {
  selectedTemplateId: string;
  zoom: number;
  images: WorkspaceImage[];
  masonryColumns: 2 | 3;
  spacing: number;
  padding: number;
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
};

export type WorkspaceActions = {
  setTemplate: (templateId: string) => void;
  setZoom: (value: number) => void;
  addImages: (items: WorkspaceImage[]) => void;
  removeImage: (imageId: string) => void;
  clearImages: () => void;
  reorderImages: (startIndex: number, endIndex: number) => void;
  resetWorkspace: () => void;
  setMasonryColumns: (columns: 2 | 3) => void;
  setSpacing: (value: number) => void;
  setPadding: (value: number) => void;
  setBackgroundColor: (value: string) => void;
  setBorderRadius: (value: number) => void;
  setBorderWidth: (value: number) => void;
  setBorderColor: (value: string) => void;
  resetExportStyles: () => void;
};

const STORAGE_KEY = "joinpic-workspace";
const STORAGE_VERSION = 1;

const defaultState: WorkspaceState = {
  selectedTemplateId: SMART_TEMPLATE_ID,
  zoom: 0.5,
  images: [],
  masonryColumns: 2,
  spacing: 0,
  padding: 0,
  backgroundColor: "#ffffff",
  borderRadius: 0,
  borderWidth: 0,
  borderColor: "#ffffff",
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set) => ({
      ...defaultState,
      setTemplate: (templateId) => set({ selectedTemplateId: templateId }),
      setZoom: (value) => set({ zoom: value }),
      addImages: (items) =>
        set((state) => ({
          images: [...state.images, ...items],
        })),
      removeImage: (imageId) =>
        set((state) => ({
          images: state.images.filter((image) => image.id !== imageId),
        })),
      clearImages: () => set({ images: [] }),
      resetWorkspace: () => set(() => ({ ...defaultState })),
      setMasonryColumns: (columns) => set({ masonryColumns: columns }),
      setSpacing: (value) => set({ spacing: Math.max(0, value) }),
      setPadding: (value) => set({ padding: Math.max(0, value) }),
      setBackgroundColor: (value) => set({ backgroundColor: value }),
      setBorderRadius: (value) => set({ borderRadius: Math.max(0, value) }),
      setBorderWidth: (value) => set({ borderWidth: Math.max(0, value) }),
      setBorderColor: (value) => set({ borderColor: value }),
      resetExportStyles: () =>
        set(() => ({
          spacing: defaultState.spacing,
          padding: defaultState.padding,
          backgroundColor: defaultState.backgroundColor,
          borderRadius: defaultState.borderRadius,
          borderWidth: defaultState.borderWidth,
          borderColor: defaultState.borderColor,
        })),
      reorderImages: (startIndex, endIndex) =>
        set((state) => {
          if (startIndex === endIndex) {
            return state;
          }

          const next = [...state.images];
          const [moved] = next.splice(startIndex, 1);
          next.splice(endIndex, 0, moved);
          return { images: next };
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      partialize: (state) => ({
        spacing: state.spacing,
        padding: state.padding,
        backgroundColor: state.backgroundColor,
        borderRadius: state.borderRadius,
        borderWidth: state.borderWidth,
        borderColor: state.borderColor,
      }),
      merge(persisted, current) {
        if (!persisted) {
          return current;
        }
        const persistedState = persisted as Partial<WorkspaceState>;
        return {
          ...current,
          ...persistedState,
        };
      },
    },
  ),
);
