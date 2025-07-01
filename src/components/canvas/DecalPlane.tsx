import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'; // Ensure correct import path

// Define the Decal interface here or import it from your designStore types.
interface Decal {
  id: string;
  texture: string;
  type: 'image' | 'text';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  side: 'front' | 'back';
  visible: boolean;
}

interface DecalProps {
  decal: Decal;
  tshirtMeshes: THREE.Mesh[]; // Now an array of meshes
  activeSide: 'front' | 'back'; // Pass activeSide to control decal visibility
}

const textureLoader = new THREE.TextureLoader();

const DecalRenderer: React.FC<DecalProps> = ({ decal, tshirtMeshes, activeSide }) => {
  // Use state to manage multiple decal meshes (one for each part of the t-shirt)
  const [decalParts, setDecalParts] = useState<THREE.Mesh[]>([]);
  const [decalMaterial, setDecalMaterial] = useState<THREE.Material | null>(null);
  const [decalTexture, setDecalTexture] = useState<THREE.Texture | null>(null);

  const { position, rotation, scale, texture, type, side, visible } = decal;

  // Effect to load image texture or create canvas texture for text
  useEffect(() => {
    let loadedTexture: THREE.Texture | null = null;
    if (type === 'image' && texture) {
      loadedTexture = textureLoader.load(texture, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setDecalTexture(tex);
      });
    } else if (type === 'text' && texture) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        // Set canvas dimensions (power of 2 is good for textures)
        canvas.width = 1024;
        canvas.height = 512;
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
        context.font = 'bold 120px Arial'; // Adjust font size as needed
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'black'; // Default text color (can be customized via store)
        context.fillText(texture, canvas.width / 2, canvas.height / 2);
      }
      loadedTexture = new THREE.CanvasTexture(canvas);
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      setDecalTexture(loadedTexture);
    } else {
      setDecalTexture(null);
    }

    return () => {
      if (loadedTexture) loadedTexture.dispose(); // Clean up texture on unmount or change
    };
  }, [texture, type]);

  // Effect to create/update decal material once texture is ready
  useEffect(() => {
    if (decalTexture) {
      const material = new THREE.MeshStandardMaterial({
        map: decalTexture,
        transparent: true,
        depthTest: true,
        depthWrite: false, // Important to prevent decals from interfering with model depth
        polygonOffset: true, // Ensures decals are rendered slightly "above" the mesh
        polygonOffsetFactor: -4, // Adjust this value if decals are z-fighting
        roughness: 1, // Example: for a matte look
        metalness: 0, // Example: for a non-metallic look
        alphaTest: 0.5, // Helps with alpha transparency artifacts
      });
      setDecalMaterial(material);
    } else {
      setDecalMaterial(null);
    }
  }, [decalTexture]);

  // Effect to create/update DecalGeometry for each t-shirt part
  useEffect(() => {
    if (tshirtMeshes.length > 0 && decalMaterial && decalTexture) {
      const newDecalParts: THREE.Mesh[] = [];
      const p = new THREE.Vector3(...position);
      const o = new THREE.Euler(...rotation);
      const s = new THREE.Vector3(...scale);

      // Dispose of old geometries and materials if they exist before setting new ones
      decalParts.forEach(part => {
        if (part.geometry) part.geometry.dispose(); // Check if geometry exists before disposing
      });

      tshirtMeshes.forEach((meshPart) => { // Removed `index` as it's not used
        // Create DecalGeometry for each individual t-shirt mesh part
        const geometry = new DecalGeometry(meshPart, p, o, s);
        const decalMesh = new THREE.Mesh(geometry, decalMaterial);
        decalMesh.renderOrder = 1; // Ensures decals are rendered after the main t-shirt
        newDecalParts.push(decalMesh);
      });

      setDecalParts(newDecalParts);
    } else {
      // Clean up if conditions are no longer met
      decalParts.forEach(part => {
        if (part.geometry) part.geometry.dispose(); // Check if geometry exists before disposing
      });
      setDecalParts([]);
    }

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      decalParts.forEach(part => {
        if (part.geometry) part.geometry.dispose();
      });
      if (decalMaterial) decalMaterial.dispose();
    };

  }, [tshirtMeshes, position, rotation, scale, decalMaterial, decalTexture, decalParts]); // Added decalParts to dependency array

  // Determine overall visibility based on decal settings and active side
  const isVisible = visible && (activeSide === 'front' ? side === 'front' : side === 'back');

  // Render multiple mesh objects for each decal part
  return (
    <>
      {decalParts.map((mesh, index) => (
        <primitive key={index} object={mesh} visible={isVisible} />
      ))}
    </>
  );
};

export default DecalRenderer;
