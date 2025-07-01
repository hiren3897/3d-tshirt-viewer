import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Decal, Environment, Center, OrbitControls } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { useDesignStore } from '../../stores/designStore';
import type { Decal as DecalType } from '../../stores/designStore';

export const CanvasModel = () => {
  const { color, decals, backgroundColor } = useDesignStore();
  return (
    <div className="relative h-full" style={{ backgroundColor }}>
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 2.5], fov: 30 }} // Adjusted camera for better view of shirt
        dpr={[1, 2]} // High DPI for crisp rendering
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 0, 5]} intensity={0.5} />
          <directionalLight position={[0, 0, -5]} intensity={0.5} /> {/* Light from back */}
          <Environment preset='warehouse' />
          <CameraRig>
            <Center>
              <Shirt oversizedColor={color} decals={decals} />
            </Center>
          </CameraRig>
        </Suspense>
      </Canvas>
    </div>
  );
};

function CameraRig({ children }: { children: React.ReactNode }) {
  const { isDraggingUI, activeSide } = useDesignStore(); // Destructure isDraggingUI and activeSide
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    // Basic camera rotation logic to switch views based on activeSide
    let targetRotationY = 0; // Front
    if (activeSide === 'back') {
      targetRotationY = Math.PI; // Rotate 180 degrees for back
    } else if (activeSide === 'left_sleeve') {
      targetRotationY = Math.PI / 2; // Rotate for left sleeve
    } else if (activeSide === 'right_sleeve') {
      targetRotationY = -Math.PI / 2; // Rotate for right sleeve
    }

    easing.dampE(ref.current.rotation, [0, targetRotationY, 0], 0.25, delta);
  });


  return (
    <group ref={ref}>
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
  const { nodes, materials } = useGLTF('/models/newOT.glb');

  // Assuming all parts use the same unnamed material or similar
  const mainMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: oversizedColor, roughness: 1 });
    return mat;
  }, [oversizedColor]);

  const textureUrls = decals.map(decal => decal.texture);
  const loadedTextures = useTexture(textureUrls); // This returns an array of textures

  const textureMap = useMemo(() => {
    const map = new Map<string, THREE.Texture>();
    textureUrls.forEach((url, index) => {
      map.set(url, loadedTextures[index]);
    });
    return map;
  }, [textureUrls, loadedTextures]);

  useFrame((_state, delta) => {
    // This part handles color damping, it's fine as is
    // Assuming the material responsible for the main shirt color is `materials[""]`
    const materialToDamp = (materials[""] || mainMaterial) as THREE.MeshStandardMaterial;
    if (materialToDamp && materialToDamp instanceof THREE.MeshStandardMaterial) {
      easing.dampC(materialToDamp.color, oversizedColor, 0.25, delta);
    }
  });

  return (
    <group>
      {/* Front */}
      <mesh castShadow geometry={(nodes.front as THREE.Mesh).geometry} material={mainMaterial}>
        {decals.filter(d => d.side === 'front').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) return null;
          return (
            <Decal
              key={decal.id}
              position={decal.position}
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
            />
          );
        })}
      </mesh>

      {/* Back */}
      <mesh castShadow geometry={(nodes.back as THREE.Mesh).geometry} material={mainMaterial}>
        {decals.filter(d => d.side === 'back').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) return null;
          return (
            <Decal
              key={decal.id}
              position={decal.position}
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
            />
          );
        })}
      </mesh>

      {/* Left Sleeve */}
      <mesh castShadow geometry={(nodes.left_sleeve as THREE.Mesh).geometry} material={mainMaterial}>
        {decals.filter(d => d.side === 'left_sleeve').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) return null;
          return (
            <Decal
              key={decal.id}
              position={decal.position}
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
            />
          );
        })}
      </mesh>

      {/* Right Sleeve */}
      <mesh castShadow geometry={(nodes.right_sleeve as THREE.Mesh).geometry} material={mainMaterial}>
        {decals.filter(d => d.side === 'right_sleeve').map((decal) => {
          const texture = textureMap.get(decal.texture);
          if (!texture) return null;
          return (
            <Decal
              key={decal.id}
              position={decal.position}
              rotation={decal.rotation}
              scale={decal.scale}
              map={texture}
            />
          );
        })}
      </mesh>

      {/* Other parts that don't receive decals */}
      <mesh castShadow geometry={(nodes.all_outlines as THREE.Mesh).geometry} material={mainMaterial}></mesh>
      <mesh castShadow geometry={(nodes.coler_border as THREE.Mesh).geometry} material={mainMaterial}></mesh>
      <mesh castShadow geometry={(nodes.both_sleeves as THREE.Mesh).geometry} material={mainMaterial}></mesh>
    </group>
  ); 
}

useGLTF.preload('/models/newOT.glb');