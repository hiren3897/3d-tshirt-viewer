import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface Decal {
  id: string;
  texture: string;
  type: 'image' | 'text';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  side: 'front' | 'back' | 'left_sleeve' | 'right_sleeve';
  visible: boolean;
}
interface DesignState {
  color: string;
  model: string;
  decals: Decal[];
  activeDecalId: string | null;
  activeSide: 'front' | 'back' | 'left_sleeve' | 'right_sleeve';
  backgroundColor: string;
  intro: boolean;
  isDraggingUI: boolean; // NEW: State to indicate if UI element is being dragged
  // Actions
  setColor: (color: string) => void;
  setActiveSide: (side: 'front' | 'back' | 'left_sleeve' | 'right_sleeve') => void;
  addDecal: (texture: string, type: 'image' | 'text') => void;
  updateDecal: (id: string, updates: Partial<Omit<Decal, 'id'>>) => void;
  removeDecal: (id: string) => void;
  resetDesign: () => void;
  saveLayout: () => void;
  loadLayout: () => void;
  setBackgroundColor: (color: string) => void;
  setActiveDecalId: (id: string | null) => void;
  setIsDraggingUI: (dragging: boolean) => void; // NEW: Action to set dragging state
}
export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      color: '#ffffff',
      model: 'classic-fit',
      decals: [],
      activeDecalId: null,
      activeSide: 'front',
      backgroundColor: '#808080',
      intro: true,
      isDraggingUI: false, // Initialize as false
      setColor: (color) => set({ color }),
      setActiveSide: (side) => set({ activeSide: side }),
      setActiveDecalId: (id) => set({ activeDecalId: id }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setIsDraggingUI: (dragging) => set({ isDraggingUI: dragging }), // Implement the new action
// In useDesignStore.ts
addDecal: (texture, type) => {
  const activeSide = get().activeSide;
  // Initial positions should be visually centered on the 2D guide and map to a sensible 3D spot.
  // These initial values will likely need fine-tuning.
  let initialPosition: [number, number, number] = [0, 0, 0.1]; // Default for front
  let initialRotation: [number, number, number] = [0, 0, 0];
  const initialScale: [number, number, number]= [0.4, 0.4, 0.4]; // Start with a reasonable scale for 3D

  // Adjust initial position and rotation based on activeSide for better defaults
  switch (activeSide) {
    case 'front':
      initialPosition = [0, 0, 0.1]; // Center of front
      initialRotation = [0, 0, 0];
      break;
    case 'back':
      initialPosition = [0, 0, -0.1]; // Center of back, negative Z
      initialRotation = [0, Math.PI, 0]; // Rotate 180 degrees around Y for back
      break;
    case 'left_sleeve':
      initialPosition = [0.4, 0, 0.05]; // Example for left sleeve
      initialRotation = [0, Math.PI / 2, 0]; // Rotate for sleeve
      break;
    case 'right_sleeve':
      initialPosition = [-0.4, 0, 0.05]; // Example for right sleeve
      initialRotation = [0, -Math.PI / 2, 0]; // Rotate for sleeve
      break;
    default:
      break;
  }

  const newDecal: Decal = {
    id: Date.now().toString(),
    texture,
    type,
    position: initialPosition,
    rotation: initialRotation,
    scale: initialScale,
    side: activeSide,
    visible: true,
  };
  set((state) => ({
    decals: [...state.decals, newDecal],
    activeDecalId: newDecal.id,
  }));
},
      updateDecal: (id, updates) =>
        set((state) => ({
          decals: state.decals.map((decal) =>
            decal.id === id ? { ...decal, ...updates } : decal
          ),
        })),
      removeDecal: (id) =>
        set((state) => ({
          decals: state.decals.filter((decal) => decal.id !== id),
          activeDecalId: state.activeDecalId === id ? null : state.activeDecalId,
        })),
      resetDesign: () =>
        set({
          decals: [],
          color: '#ffffff',
          activeSide: 'front',
          backgroundColor: '#ffffff',
          activeDecalId: null,
          isDraggingUI: false, // Also reset this
        }),
      saveLayout: () => {
        const state = get();
        localStorage.setItem(
          'designLayout',
          JSON.stringify({
            decals: state.decals,
            color: state.color,
            backgroundColor: state.backgroundColor,
          })
        );
      },
      loadLayout: () => {
        const saved = localStorage.getItem('designLayout');
        if (saved) {
          try {
            const { decals, color, backgroundColor } = JSON.parse(saved);
            set({ decals, color, backgroundColor });
          } catch (e) {
            console.error('Failed to load layout:', e);
          }
        }
      },
    }),
    {
      name: 'design-store',
      partialize: (state) => ({
        color: state.color,
        decals: state.decals,
        backgroundColor: state.backgroundColor,
      }),
    }
  )
);