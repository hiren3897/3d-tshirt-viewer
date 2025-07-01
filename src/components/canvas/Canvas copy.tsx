import { useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, AccumulativeShadows, RandomizedLight, Decal, Environment, Center, OrbitControls } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { useDesignStore } from '../../stores/designStore';
import type { Decal as DecalType } from '../../stores/designStore'; // Import the Decal type from your store

export const CanvasModel = () => {
  const { color, decals, backgroundColor } = useDesignStore();

  return (
    <div className="relative h-full" style={{ backgroundColor }}>
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        // eventSource={document.getElementById('root') || undefined}
        // eventPrefix="client"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 0, 5]} intensity={0.5} />
          <Environment preset='warehouse' />
          <CameraRig>
            {/* <Backdrop /> */}
            <Center>
              <Shirt oversizedColor={color} decals={decals} />
            </Center>
          </CameraRig>
        </Suspense>
      </Canvas>
    </div>
  );
};

function Backdrop() {
  const shadows = useRef<React.ElementRef<typeof AccumulativeShadows>>(null);
  const store = useDesignStore();

  useFrame((_state, delta) => {
    if (shadows.current && shadows.current.getMesh) {
      const mesh = shadows.current.getMesh();
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        easing.dampC(
          mesh.material.color,
          new THREE.Color(store.color),
          0.25,
          delta
        );
      }
    }
  });

  return (
    <AccumulativeShadows
      ref={shadows}
      temporal
      frames={60}
      alphaTest={0.85}
      scale={5}
      resolution={2048}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.14]}
    >
      <RandomizedLight amount={4} radius={9} intensity={0.55 * Math.PI} ambient={0.25} position={[5, 5, -10]} />
      <RandomizedLight amount={4} radius={5} intensity={0.25 * Math.PI} ambient={0.55} position={[-5, 5, -9]} />
    </AccumulativeShadows>
  );
}

function CameraRig({ children }: { children: React.ReactNode }) {

  const { isDraggingUI } = useDesignStore(); // Destructure isDraggingUI

  return (
    <group>
      {children}
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        enabled={!isDraggingUI} // Crucial: Disable OrbitControls when isDraggingUI is true
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </group>
  );
}

type ShirtProps = {
  oversizedColor: string;
  decals: DecalType[];
};

function Shirt({ oversizedColor, decals }: ShirtProps) {
  const { nodes, materials } = useGLTF('/models/t_shirt.glb') as unknown as {
    nodes: {
      Object_10: THREE.Mesh; // Front Body (confirmed by Blender)
      Object_14: THREE.Mesh; // Back Body (confirmed by Blender)
      Object_18: THREE.Mesh; // Right Sleeve (confirmed by Blender)
      Object_20: THREE.Mesh; // Left Sleeve (confirmed by Blender)
      Object_8: THREE.Mesh;  // Collar/Neck (confirmed by Blender)
      Object_6: THREE.Mesh;  // Collar/Neck/Back (confirmed by Blender)
    };
    materials: { Sleeves_FRONT_2669: THREE.MeshStandardMaterial };
    scene: THREE.Scene;
  };


  useEffect(() => {
    console.log('Loaded GLTF nodes:', nodes);
    console.log('Loaded GLTF materials:', materials);
    // You can add more specific debug here if needed, e.g.,
    // console.log('Object_14 world position:', nodes.Object_14.getWorldPosition(new THREE.Vector3()));
  }, [nodes, materials]);

  const textureUrls = decals.map(decal => decal.texture);
  const loadedTextures = useTexture(textureUrls);

  const textureMap = useMemo(() => {
    const map = new Map<string, THREE.Texture>();
    textureUrls.forEach((url, index) => {
      map.set(url, loadedTextures[index]);
    });
    return map;
  }, [textureUrls, loadedTextures]);

  useFrame((_state, delta) => {
    const bodyFrontMaterial = materials.Sleeves_FRONT_2669 as THREE.MeshStandardMaterial;
    if (bodyFrontMaterial && bodyFrontMaterial instanceof THREE.MeshStandardMaterial) {
      easing.dampC(bodyFrontMaterial.color, oversizedColor, 0.25, delta);
    }
  });

  return (
    <group receiveShadow castShadow>
      {/* Front of the T-shirt */}
      <mesh castShadow geometry={nodes.Object_10.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}>
        {decals.filter(d => d.side === 'front').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) {
            console.warn(`Texture not found for front decal ID: ${decal.id}, URL: ${decal.texture}`);
            return null;
          }
          console.log(`Rendering front decal ID: ${decal.id}, texture: ${decal.texture}, position: ${decal.position}, rotation: ${decal.rotation}, scale: ${decal.scale}`);
          return (
            <Decal
              key={decal.id}
              // position={[0.09, 1.45, 0.1]}
              position={decal.position} // Use decal position
              rotation={decal.rotation}
              // scale={[0.08, 0.1, 0.1]} // Adjusted scale for front decal
              scale={decal.scale} // Adjusted scale for front decal
              map={texture}

              debug
            />
          );
        })}
      </mesh>

      {/* Back of the T-shirt */}
      <mesh castShadow geometry={nodes.Object_14.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}>
        {/* Debug helper: A small red sphere at the expected decal position */}
        {/* {decals.filter(d => d.side === 'back').map((decal) => (
          <mesh key={`debug-sphere-${decal.id}`} position={decal.position}>
            <sphereGeometry args={[0, 1.3, 0.15]} />
            <meshBasicMaterial color="red" />
          </mesh>
        ))} */}

        {decals.filter(d => d.side === 'back').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) {
            console.warn(`Texture not found for back decal ID: ${decal.id}, URL: ${decal.texture}`);
            return null;
          }
          console.log(`Rendering back decal ID: ${decal.id}, texture: ${decal.texture}, position: ${decal.position}, rotation: ${decal.rotation}, scale: ${decal.scale}`);
          return (
            <Decal
              key={decal.id}
              position={decal.position} // Adjusted position for back decal
              rotation={decal.rotation}
              scale={decal.scale} // Adjusted scale for back decal
              map={texture}
            />
          );
        })}
      </mesh>

      {/* Left Sleeve (Object_20) and Right Sleeve (Object_18) - CONFIRMED FROM BLENDER */}
      <mesh castShadow geometry={nodes.Object_20.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}>
        {decals.filter(d => d.side === 'left_sleeve').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) {
            console.warn(`Texture not found for left sleeve decal ID: ${decal.id}, URL: ${decal.texture}`);
            return null;
          }
          console.log(`Rendering left sleeve decal ID: ${decal.id}, texture: ${decal.texture}, position: ${decal.position}, rotation: ${decal.rotation}, scale: ${decal.scale}`);
          return (
            <Decal
              key={decal.id}
              position={[0, 1.8, 0.30]} // Adjusted position for left sleeve
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
            />
          );
        })}
      </mesh>

      <mesh castShadow geometry={nodes.Object_18.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}>
        {decals.filter(d => d.side === 'right_sleeve').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) {
            console.warn(`Texture not found for right sleeve decal ID: ${decal.id}, URL: ${decal.texture}`);
            return null;
          }
          console.log(`Rendering right sleeve decal ID: ${decal.id}, texture: ${decal.texture}, position: ${decal.position}, rotation: ${decal.rotation}, scale: ${decal.scale}`);
          return (
            <Decal
              key={decal.id}
              position={decal.position}
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
              debug
            />
          );
        })}
      </mesh>

      {/* Collar/Neck */}
      <mesh castShadow geometry={nodes.Object_8.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}></mesh>
      <mesh castShadow geometry={nodes.Object_6.geometry} material={materials.Sleeves_FRONT_2669} material-roughness={1} dispose={null}></mesh>
    </group>
  );
}

useGLTF.preload('/models/oversized.glb');