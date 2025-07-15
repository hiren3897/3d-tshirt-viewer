import React from 'react';
import { Button } from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import ColorPicker from './ColorPicker';
import PositionGuide from './PositionGuide';
import { useDesignStore } from '../../contexts/DesignStoreProvider';
import ExportPanel from './ExportPanel';

const DesignPanel: React.FC = () => {
  const {
    color,
    setColor,
    addDecal,
    resetDesign,
    backgroundColor,
    setBackgroundColor,
  } = useDesignStore((state) => ({
    color: state.color,
    setColor: state.setColor,
    addDecal: state.addDecal,
    resetDesign: state.resetDesign,
    backgroundColor: state.backgroundColor,
    setBackgroundColor: state.setBackgroundColor,
  }));

  const handleImageUpload = (file: File) => {
    const texture = URL.createObjectURL(file);
    addDecal(texture, 'image');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white p-4 space-y-4">
      {/* Header with reset button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">T-Shirt Designer</h2>
        <Button 
          onClick={resetDesign} 
          variant="outline" 
          size="sm"
          className="text-xs px-3"
        >
          Reset
        </Button>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">T-Shirt Color</label>
          <ColorPicker color={color} onChange={setColor} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Background</label>
          <ColorPicker color={backgroundColor} onChange={setBackgroundColor} />
        </div>
              {/* Simplified File Upload */}
      <div>
        <FileUpload
          onFileUpload={handleImageUpload}
          className="bg-black text-white hover:bg-gray-800 py-2 px-4 rounded"
        >
          Upload Design
        </FileUpload>
      </div>
      </div>
      {/* <TextEditor /> */}

      {/* Position Guide */}
      <div>
        <h3 className="text-sm font-medium mb-2">Position Guide</h3>
        <PositionGuide />
      </div>

      {/* Export Options */}
      <div>
        <ExportPanel />
      </div>
    </div>
  );
};

export default DesignPanel;