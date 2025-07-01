// src/contexts/ModelContext.ts
import { createContext } from 'react';
import * as THREE from 'three';

export const ModelContext = createContext<THREE.Mesh[] | null>(null);