import React from 'react';
import { Button } from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import ColorPicker from './ColorPicker';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs'; // Ensure TabsContent is imported
import PositionGuide from './PositionGuide'; // Import the new component
import { useDesignStore } from '../../contexts/DesignStoreProvider';

const DesignPanel: React.FC = () => {
  const {
    color,
    activeSide,
    setColor,
    setActiveSide,
    addDecal,
    resetDesign,
    backgroundColor,
    setBackgroundColor,
    activeDecalId,
    setActiveDecalId,
    decals,
  } = useDesignStore((state) => ({
    color: state.color,
    activeSide: state.activeSide,
    setColor: state.setColor,
    setActiveSide: state.setActiveSide,
    addDecal: state.addDecal,
    resetDesign: state.resetDesign,
    backgroundColor: state.backgroundColor,
    setBackgroundColor: state.setBackgroundColor,
    activeDecalId: state.activeDecalId,
    setActiveDecalId: state.setActiveDecalId,
    decals: state.decals,
  }));

  const handleImageUpload = (file: File) => {
    const texture = URL.createObjectURL(file);
    addDecal(texture, 'image');
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg" style={{overflow: "auto"}}>
      <Tabs
        value={activeSide}
        onValueChange={(value) =>
          setActiveSide(value as 'front' | 'back' | 'left_sleeve' | 'right_sleeve')
        }
        className="w-full mb-4"
      >
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="front">Front</TabsTrigger>
          <TabsTrigger value="back">Back</TabsTrigger>
          <TabsTrigger value="left_sleeve">Left Sleeve</TabsTrigger>
          <TabsTrigger value="right_sleeve">Right Sleeve</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4 space-y-6">
        {/* Position Guide Section */}
        <div className="border rounded-md p-2">
          <h3 className="font-medium mb-2">Adjust Decal Positions</h3>
          <PositionGuide />
        </div>

        {/* Active Decal Selection */}
        {decals.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Active Designs ({activeSide})</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border rounded-md">
              {decals
                .filter((decal) => decal.side === activeSide) // Only show decals for the active side
                .map((decal) => (
                  <button
                    key={decal.id}
                    className={`p-1 border rounded-md ${
                      activeDecalId === decal.id
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300'
                    }`}
                    onClick={() => setActiveDecalId(decal.id)}
                  >
                    <div
                      className="w-10 h-10 bg-cover bg-center"
                      style={{ backgroundImage: `url(${decal.texture})` }}
                    />
                  </button>
                ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="font-medium mb-2">T-Shirt Color</h3>
          <ColorPicker color={color} onChange={setColor} />
        </div>
        <div>
          <h3 className="font-medium mb-2">Background Color</h3>
          <ColorPicker color={backgroundColor} onChange={setBackgroundColor} />
        </div>
        <FileUpload
          accept="image/*"
          label="Upload Design"
          onFileUpload={handleImageUpload}
        />
        <div className="flex gap-2 pt-4">
          <Button onClick={resetDesign} className="flex-1">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
export default DesignPanel;