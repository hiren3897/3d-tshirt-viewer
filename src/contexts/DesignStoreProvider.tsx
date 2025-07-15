import { useState, useCallback, type ReactNode } from 'react';
import { createContext, useContextSelector } from "use-context-selector";
import { generateUUID } from 'three/src/math/MathUtils.js';
export type Side = 'front' | 'back' | 'left_sleeve' | 'right_sleeve';
// Define the Decal interface
export interface Decal {
  id: string;
  texture: string;
  type: 'image' | 'text';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  side: Side
  visible: boolean;
}

// Define the shape of our design state
interface DesignState {
  color: string;
  model: string; // Not currently used in the provided code for persistence, but good to keep
  decals: Decal[];
  activeDecalId: string | null;
  activeSide: Side
  backgroundColor: string;
  intro: boolean; // Not currently used in the provided code for persistence, but good to keep
  isDraggingUI: boolean;
}

// Define the shape of the actions that can be performed on the state
interface DesignActions {
  setColor: (color: string) => void;
  setActiveSide: (side: Side) => void;
  addDecal: (texture: string, type: 'image' | 'text') => void;
  updateDecal: (id: string, updates: Partial<Omit<Decal, 'id'>>) => void;
  removeDecal: (id: string) => void;
  resetDesign: () => void;
  // saveLayout and loadLayout are removed as context handles state directly
  setBackgroundColor: (color: string) => void;
  setActiveDecalId: (id: string | null) => void;
  setIsDraggingUI: (dragging: boolean) => void;
}

// Combine state and actions into a single context value type
type DesignContextType = DesignState & DesignActions;

// Create the context with a default undefined value, which will be set by the provider
const DesignContext = createContext<DesignContextType | undefined>(undefined);

// Define the props for the DesignProvider component
interface DesignProviderProps {
  children: ReactNode;
}

// Initial state for the design
const initialDesignState: DesignState = {
  color: '#ffffff',
  model: 'classic-fit',
  decals: [],
  activeDecalId: null,
  activeSide: 'front',
  backgroundColor: '#808080',
  intro: true,
  isDraggingUI: false,
};

export const DesignProvider = ({ children }: DesignProviderProps) => {
  const [state, setState] = useState<DesignState>(initialDesignState);

  // Memoized action creators using useCallback to prevent unnecessary re-renders
  const setColor = useCallback((color: string) => {
    setState((prevState) => ({ ...prevState, color }));
  }, []);

  const setActiveSide = useCallback((side: Side) => {
    setState((prevState) => ({ ...prevState, activeSide: side }));
  }, []);

  const setActiveDecalId = useCallback((id: string | null) => {
    setState((prevState) => ({ ...prevState, activeDecalId: id }));
  }, []);

  const setBackgroundColor = useCallback((backgroundColor: string) => {
    setState((prevState) => ({ ...prevState, backgroundColor }));
  }, []);

  const setIsDraggingUI = useCallback((dragging: boolean) => {
    setState((prevState) => ({ ...prevState, isDraggingUI: dragging }));
  }, []);

  const addDecal = useCallback((texture: string, type: 'image' | 'text') => {
    setState((prevState) => {
      const activeSide = prevState.activeSide;
      let initialPosition: [number, number, number] = [0, 0, 0.1]; // Default for front
      let initialRotation: [number, number, number] = [0, 0, 0];
      const initialScale: [number, number, number] = [0.4, 0.4, 0.4];

      switch (activeSide) {
        case 'front':
          initialPosition = [0, 0, 0.1];
          initialRotation = [0, 0, 0];
          break;
        case 'back':
          initialPosition = [0, 0, -0.1];
          initialRotation = [0, Math.PI, 0];
          break;
        case 'left_sleeve':
          initialPosition = [0.4, 0, 0.05];
          initialRotation = [0, Math.PI / 2, 0];
          break;
        case 'right_sleeve':
          initialPosition = [-0.4, 0, 0.05];
          initialRotation = [0, -Math.PI / 2, 0];
          break;
        default:
          break;
      }

      const newDecal: Decal = {
        id: generateUUID(),
        texture,
        type,
        position: initialPosition,
        rotation: initialRotation,
        scale: initialScale,
        side: activeSide,
        visible: true,
      };

      return {
        ...prevState,
        decals: [...prevState.decals, newDecal],
        activeDecalId: newDecal.id,
      };
    });
  }, []);

  const updateDecal = useCallback((id: string, updates: Partial<Omit<Decal, 'id'>>) => {
    setState((prevState) => ({
      ...prevState,
      decals: prevState.decals.map((decal) =>
        decal.id === id ? { ...decal, ...updates } : decal
      ),
    }));
  }, []);

  const removeDecal = useCallback((id: string) => {
    setState((prevState) => ({
      ...prevState,
      decals: prevState.decals.filter((decal) => decal.id !== id),
      activeDecalId: prevState.activeDecalId === id ? null : prevState.activeDecalId,
    }));
  }, []);

  const resetDesign = useCallback(() => {
    setState({
      ...initialDesignState, // Reset to initial state, ensuring all properties are covered
      isDraggingUI: false, // Explicitly reset this
    });
  }, []);

  // The value provided by the context
  const contextValue = {
    ...state,
    setColor,
    setActiveSide,
    addDecal,
    updateDecal,
    removeDecal,
    resetDesign,
    setBackgroundColor,
    setActiveDecalId,
    setIsDraggingUI,
  };

  return <DesignContext.Provider value={contextValue}>{children}</DesignContext.Provider>;
};

// Custom hook to consume the design context
// eslint-disable-next-line react-refresh/only-export-components
export const useDesignStore = <T,>(selector: (state: DesignContextType) => T): T => {
  return useContextSelector(DesignContext, (state) => {
    if (!state) {
      throw new Error('useDesignStore must be used within a DesignProvider');
    }
    return selector(state);
  });
};
