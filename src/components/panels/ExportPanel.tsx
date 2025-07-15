// src/components/panels/ExportPanel.tsx
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { captureImage, recordAnimation } from '../../lib/exportUtils';
import { useDesignStore } from '../../contexts/DesignStoreProvider';

const ExportPanel: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const side = useDesignStore((state) => state.activeSide);
  const handleCaptureImage = async () => {
    setIsCapturing(true);
    try {
      const blob = await captureImage(2); // quality 2 for higher resolution
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tshirt_design_${side}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Failed to capture image. Check console for details.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRecordVideo = async () => {
    setIsRecording(true);
    try {
      // For a better recording, you might want to define a specific camera animation here
      // For example, rotate the T-shirt model over the duration of the recording.
      // This example will just record whatever is currently on screen.
      // You can add camera animation logic here using setCameraPosition and TWEEN.
      
      // Example of setting up a rotation animation for recording:
      // const initialRotation = [0, 0, 0]; // Or get current model rotation
      // const finalRotation = [0, Math.PI * 2, 0]; // Full rotation around Y-axis
      // new TWEEN.Tween(initialRotation)
      //   .to(finalRotation, 5000) // 5 seconds for full rotation
      //   .onUpdate(() => {
      //     // Apply rotation to your T-shirt model's mesh
      //     // You would need to expose a ref to your Model component's scene/mesh
      //   })
      //   .start();

      const blob = await recordAnimation(5, 30); // 5 seconds duration, 30 fps
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tshirt_design_video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error recording video:', error);
      alert('Failed to record video. Check console for details.');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 space-y-4">      
      <Button 
        onClick={() => handleCaptureImage()} 
        disabled={isCapturing}
        className="w-full"
      >
        {isCapturing ? 'Capturing...' : 'Save Image'}
      </Button>
      <Button 
        onClick={handleRecordVideo} 
        disabled={isRecording}
        className="w-full bg-green-500 hover:bg-green-600"
      >
        {isRecording ? 'Recording Video...' : 'Record 3D Video'}
      </Button>

      <p className="text-sm text-gray-600">
        Note: Recording 3D video captures the current animation on the canvas.
        For a turntable animation, you'll need to implement that within the 3D scene.
      </p>
    </div>
  );
};

export default ExportPanel;