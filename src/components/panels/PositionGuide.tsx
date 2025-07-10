import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import Moveable from 'react-moveable';
import type { OnDrag, OnDragStart, OnResizeStart, OnRotate, OnResize } from 'react-moveable';
import { useDesignStore, type Decal } from '../../contexts/DesignStoreProvider';

// IMPORTANT: These 2D regions must precisely match the visual layout in placementguide.jpg
// Measure these values carefully from your image, relative to its total dimensions (900x800 here).
const PIXEL_REGIONS_2D = {
  front: { x: 0.05, y: 0.18, width: 0.43, height: 0.65 }, // Example values, needs fine-tuning
  back: { x: 0.52, y: 0.18, width: 0.43, height: 0.65 }, // Example values, needs fine-tuning
  left_sleeve: { x: 0.02, y: 0.85, width: 0.48, height: 0.15 }, // Example values, needs fine-tuning
  right_sleeve: { x: 0.50, y: 0.85, width: 0.48, height: 0.15 }, // Example values, needs fine-tuning
};

// IMPORTANT: These 3D regions must precisely match the UV coordinates on your 3D model.
// Obtain these from your 3D modeling software (e.g., Blender UV Editor).
const MESH_REGIONS_3D = {
  front: { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5, fixedZ: 0.1, defaultRotationY: 0 },
  back: { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5, fixedZ: -0.1, defaultRotationY: Math.PI },
  left_sleeve: { minX: 0.2, maxX: 0.7, minY: -0.2, maxY: 0.2, fixedZ: 0.05, defaultRotationY: Math.PI / 2 },
  right_sleeve: { minX: -0.7, maxX: -0.2, minY: -0.2, maxY: 0.2, fixedZ: 0.05, defaultRotationY: -Math.PI / 2 },
};

// Helper function to map a 2D pixel coordinate (relative to container) to a 3D decal coordinate
const map2Dto3D = (
  pixelX: number,
  pixelY: number,
  containerRect: DOMRect,
  side: Decal['side']
): [number, number, number] => {
  const region2D = PIXEL_REGIONS_2D[side];
  const region3D = MESH_REGIONS_3D[side];

  if (!region2D || !region3D) return [0, 0, 0];

  // Calculate pixel position relative to the specific 2D region on the guide
  // We're converting absolute pixel positions to a 0-1 range within the region.
  const relativeX = (pixelX - (containerRect.width * region2D.x)) / (containerRect.width * region2D.width);
  const relativeY = (pixelY - (containerRect.height * region2D.y)) / (containerRect.height * region2D.height);

  // Map this 0-1 relative position to the 3D mesh region
  const x3D = region3D.minX + relativeX * (region3D.maxX - region3D.minX);
  // Y-axis inversion: positive Y in pixels is down, positive Y in 3D is up.
  // So, 0 at top of 2D region maps to maxY, 1 at bottom of 2D region maps to minY.
  const y3D = region3D.maxY - relativeY * (region3D.maxY - region3D.minY);

  // console.log(`map2Dto3D: 2D(${pixelX.toFixed(2)},${pixelY.toFixed(2)}) -> relative(${relativeX.toFixed(2)},${relativeY.toFixed(2)}) -> 3D(${x3D.toFixed(2)},${y3D.toFixed(2)}) for ${side}`); // Debugging
  return [x3D, y3D, region3D.fixedZ];
};

// Helper function to map a 3D decal coordinate back to a 2D pixel coordinate for display
const map3Dto2D = (
  decalPosition: [number, number, number],
  containerRect: DOMRect,
  side: Decal['side']
): { x: number; y: number } => {
  const region2D = PIXEL_REGIONS_2D[side];
  const region3D = MESH_REGIONS_3D[side];

  if (!region2D || !region3D) return { x: 0, y: 0 };

  const x3D = decalPosition[0];
  const y3D = decalPosition[1];

  // Inverse map X from 3D range to relative X (0-1) within the region
  const relativeX = (x3D - region3D.minX) / (region3D.maxX - region3D.minX);
  // Inverse map Y from 3D range to relative Y (0-1) within the region (remember Y inversion)
  const relativeY = (region3D.maxY - y3D) / (region3D.maxY - region3D.minY);

  // Map relative X,Y back to pixel coordinates within the container
  const pixelX = (region2D.x + relativeX * region2D.width) * containerRect.width;
  const pixelY = (region2D.y + relativeY * region2D.height) * containerRect.height;

  // console.log(`map3Dto2D: 3D(${x3D.toFixed(2)},${y3D.toFixed(2)}) -> relative(${relativeX.toFixed(2)},${relativeY.toFixed(2)}) -> 2D(${pixelX.toFixed(2)},${pixelY.toFixed(2)}) for ${side}`); // Debugging
  return { x: pixelX, y: pixelY };
};

interface DecalDisplayProps {
  decal: Decal;
  containerRef: React.RefObject<HTMLDivElement | null>;
  updateDecal: (id: string, updates: Partial<Omit<Decal, 'id'>>) => void;
  setActiveDecalId: (id: string | null) => void;
  isActive: boolean;
  setIsDraggingUI: (dragging: boolean) => void;
  setActiveSide: (side: Decal['side']) => void;
}

const DecalDisplay: React.FC<DecalDisplayProps> = ({
  decal,
  containerRef,
  updateDecal,
  setActiveDecalId,
  isActive,
  setIsDraggingUI,
  setActiveSide,
}) => {
  const decalRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);

  // These constants are crucial for consistent scaling between 2D and 3D.
  // Ensure they accurately reflect the relationship.
  const base2DPixelSizeFor3DScale = 80; // e.g., 80px width in 2D guide
  const base3DScale = 0.4;              // ... corresponds to 0.4 units in 3D

  // Recalculate 2D position when decal properties or container size changes.
  const current2DPosition = useMemo(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = map3Dto2D(decal.position, containerRect, decal.side);

    // Adjust for decal's own size so its center aligns with mapped point
    // This correction is for positioning the top-left corner of the div.
    if (decalRef.current) {
      const decalWidth = decalRef.current.offsetWidth;
      const decalHeight = decalRef.current.offsetHeight;
      pos.x -= decalWidth / 2;
      pos.y -= decalHeight / 2;
    }
    return pos;
  }, [decal.position, decal.side, containerRef, decalRef]);

  // Helper to update position & side simultaneously (used by onDrag)
  const updateDecalPositionAndSide = useCallback((
    currentPixelX: number,
    currentPixelY: number,
    currentRotationZ: number
  ) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    let newSide = decal.side;
    // Determine which side the decal's center is currently over
    for (const sideKey in PIXEL_REGIONS_2D) {
      const region = PIXEL_REGIONS_2D[sideKey as Decal['side']];
      const regionAbsX = containerRect.width * region.x;
      const regionAbsY = containerRect.height * region.y;
      const regionAbsWidth = containerRect.width * region.width;
      const regionAbsHeight = containerRect.height * region.height;

      if (
        currentPixelX >= regionAbsX &&
        currentPixelX <= (regionAbsX + regionAbsWidth) &&
        currentPixelY >= regionAbsY &&
        currentPixelY <= (regionAbsY + regionAbsHeight)
      ) {
        newSide = sideKey as Decal['side'];
        break;
      }
    }

    const [newX3D, newY3D, newZ3D] = map2Dto3D(currentPixelX, currentPixelY, containerRect, newSide);
    const newRotationY = MESH_REGIONS_3D[newSide].defaultRotationY;

    if (newSide !== decal.side) {
      setActiveSide(newSide); // Update active side if moved to a new region
    }

    updateDecal(decal.id, {
      position: [newX3D, newY3D, newZ3D],
      side: newSide,
      rotation: [decal.rotation[0], newRotationY, currentRotationZ],
    });
  }, [containerRef, decal.side, decal.id, decal.rotation, updateDecal, setActiveSide]);


  const onDrag = useCallback((e: OnDrag) => {
    // Apply immediate visual update to the DOM element for smooth drag
    e.target.style.left = `${e.beforeTranslate[0]}px`;
    e.target.style.top = `${e.beforeTranslate[1]}px`;

    if (!containerRef.current || !decalRef.current) return;

    // Calculate the center of the decal div in pixel coordinates relative to the container
    const currentPixelX = e.beforeTranslate[0] + decalRef.current.offsetWidth / 2;
    const currentPixelY = e.beforeTranslate[1] + decalRef.current.offsetHeight / 2;

    // Update the decal's position and potentially side in the store live
    updateDecalPositionAndSide(currentPixelX, currentPixelY, decal.rotation[2]);

  }, [containerRef, decal.rotation, updateDecalPositionAndSide]);


  const onDragEnd = useCallback(() => {
    setIsDraggingUI(false);
  }, [setIsDraggingUI]);

  const onResize = useCallback((e: OnResize) => {
    // Apply immediate visual update to the DOM element for smooth resize
    e.target.style.width = `${e.width}px`;
    e.target.style.height = `${e.height}px`;
    e.target.style.transform = e.transform; // Use e.transform for consistency

    // Calculate new 3D scale based on new pixel dimensions
    const pixelTo3DScaleFactor = base3DScale / base2DPixelSizeFor3DScale;
    const newScaleX = e.width * pixelTo3DScaleFactor;
    const newScaleY = e.height * pixelTo3DScaleFactor;

    // Ensure a minimum scale to prevent decals from becoming infinitesimally small or zero
    const minAllowedScale = 0.001;
    const finalScaleX = Math.max(minAllowedScale, newScaleX);
    const finalScaleY = Math.max(minAllowedScale, newScaleY);

    // Update the decal in the store live during resize
    updateDecal(decal.id, {
      scale: [finalScaleX, finalScaleY, decal.scale[2]],
    });
  }, [decal.id, decal.scale, updateDecal, base2DPixelSizeFor3DScale, base3DScale]);

  const onResizeEnd = useCallback(() => {
    setIsDraggingUI(false); // Release UI lock after resize
  }, [setIsDraggingUI]);

  const onRotate = useCallback((e: OnRotate) => {
    // Apply immediate visual update to the DOM element for smooth rotate
    e.target.style.transform = e.transform;

    // Convert degrees to radians for 3D model.
    // Negate if positive CSS rotation (clockwise) should map to positive Three.js Z (counter-clockwise).
    // Your current setup: positive e.rotate (clockwise visual) -> negative newRotationZ (counter-clockwise Three.js)
    // This makes the 2D visual and 3D model rotate in the same perceived direction from user's perspective.
    const newRotationZ = -e.rotate * (Math.PI / 180);

    // Update the decal in the store live during rotation
    updateDecal(decal.id, {
        rotation: [decal.rotation[0], decal.rotation[1], newRotationZ],
    });
  }, [decal.id, decal.rotation, updateDecal]);

  const onRotateEnd = useCallback(() => {
    setIsDraggingUI(false); // Release UI lock after rotate
  }, [setIsDraggingUI]);

  // Use an effect to update Moveable's internal state if decal properties change
  // This helps keep the Moveable box synced with the decal's actual state (from store)
  useEffect(() => {
    if (moveableRef.current && decalRef.current) {
      // Force Moveable to update its internal bounding box and transformation matrix
      // This is crucial for two-way binding as the decal's size/pos/rot might change from store
      // (e.g., when switching sides, or initial render)
      moveableRef.current.updateRect();
    }
  }, [decal.position, decal.scale, decal.rotation, decal.side, isActive]); // Depend on decal properties and active state

  return (
    <>
      <div
        ref={decalRef}
        id={`decal-${decal.id}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent clicks on decal from deactivating it by clicking on parent guide
          setActiveDecalId(decal.id);
        }}
        style={{
          position: 'absolute',
          left: current2DPosition.x,
          top: current2DPosition.y,
          // Calculate 2D width/height based on current 3D scale and base ratio
          width: `${decal.scale[0] / base3DScale * base2DPixelSizeFor3DScale}px`,
          height: `${decal.scale[1] / base3DScale * base2DPixelSizeFor3DScale}px`,
          backgroundImage: `url(${decal.texture})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          cursor: isActive ? 'grab' : 'pointer',
          border: isActive ? '2px dashed blue' : 'none',
          // Apply rotation for 2D display. Negate decal.rotation[2] to align with Moveable's visual direction.
          transform: `rotate(${-decal.rotation[2] * (180 / Math.PI)}deg)`,
          transformOrigin: 'center', // Important for correct rotation
          zIndex: isActive ? 100 : 10,
          boxSizing: 'border-box',
          pointerEvents: isActive ? 'auto' : 'auto', // Allow pointer events on active decal
        }}
      />
      {isActive && (
        <Moveable
          ref={moveableRef}
          target={decalRef.current}
          container={containerRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          // keepRatio={true} // Maintain aspect ratio during resize
          throttleDrag={1}
          throttleResize={1}
          throttleRotate={1}
          renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
          edge={false}
          zoom={1}
          // origin={true} // Show the origin dot
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}

          onDragStart={(e: OnDragStart) => {
            // Set initial drag position based on current decal's 2D position
            e.set([current2DPosition.x, current2DPosition.y]);
            setIsDraggingUI(true);
          }}
          onDrag={onDrag}
          onDragEnd={onDragEnd}

          onResizeStart={(e: OnResizeStart) => {
            setIsDraggingUI(true);
            if (e.dragStart) {
              e.dragStart.set([0, 0]); // Reset drag translation for resize
            }
          }}
          onResize={onResize} // Live update
          onResizeEnd={onResizeEnd}

          onRotateStart={() => {
            setIsDraggingUI(true);
          }}
          onRotate={onRotate} // Live update
          onRotateEnd={onRotateEnd}
        />
      )}
    </>
  );
};

const PositionGuide: React.FC = () => {
  const { decals, activeSide, updateDecal, setActiveDecalId, activeDecalId, setIsDraggingUI, setActiveSide } = useDesignStore((state) => ({
    decals: state.decals,
    activeSide: state.activeSide,
    updateDecal: state.updateDecal,
    setActiveDecalId: state.setActiveDecalId,
    activeDecalId: state.activeDecalId,
    setIsDraggingUI: state.setIsDraggingUI,
    setActiveSide: state.setActiveSide,
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  const getSideHighlightStyles = useCallback((side: Decal['side']): React.CSSProperties => {
    const region = PIXEL_REGIONS_2D[side];
    if (!containerRef.current || !region) return {};
    return {
      left: `${region.x * 100}%`,
      top: `${region.y * 100}%`,
      width: `${region.width * 100}%`,
      height: `${region.height * 100}%`,
      position: 'absolute',
      border: activeSide === side ? '2px dashed #0f0' : 'none',
      opacity: 0.7,
      boxSizing: 'border-box',
      pointerEvents: 'none', // Do not block clicks on decals
    } as React.CSSProperties;
  }, [activeSide]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: 'calc(100% * (800 / 900))', // Maintains aspect ratio of 900x800 for placementguide.jpg
        backgroundImage: `url(/placementguide.jpg)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: '1px solid #ddd',
        cursor: activeDecalId ? 'default' : 'default',
        overflow: 'hidden', // Hide anything that goes outside the guide area
      }}
      onClick={() => setActiveDecalId(null)} // Click outside decals to deactivate
    >
      {/* Render highlight regions for each side */}
      {Object.keys(PIXEL_REGIONS_2D).map(sideKey => (
        <div key={sideKey} style={getSideHighlightStyles(sideKey as Decal['side'])} />
      ))}

      {/* Render DecalDisplay components for each visible decal */}
      {decals.filter(d => d.visible).map((decal) => (
        <DecalDisplay
          key={decal.id}
          decal={decal}
          containerRef={containerRef}
          updateDecal={updateDecal}
          setActiveDecalId={setActiveDecalId}
          isActive={decal.id === activeDecalId}
          setIsDraggingUI={setIsDraggingUI}
          setActiveSide={setActiveSide}
        />
      ))}
    </div>
  );
};

export default PositionGuide;