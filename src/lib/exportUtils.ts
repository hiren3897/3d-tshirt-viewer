import { useDesignStore } from '../stores/designStore' // Correct path

// Helper to set camera position and wait for animation
export const setCameraForExport = (side: 'front' | 'back') => {
  return new Promise<void>((resolve) => {
    const store = useDesignStore.getState(); // Get the state directly
    
    let targetPosition: [number, number, number];
    if (side === 'front') {
      targetPosition = [0, 0, 2.5];
    } else {
      targetPosition = [0, 0, -2.5]; // Assuming you want to rotate the model to show the back
    }
    
    store.setCameraPosition(targetPosition);

    // Wait for camera animation to complete. TWEEN animations happen over time.
    // We need to ensure the animation has completed before taking the screenshot.
    // This is a simplified approach, a more robust solution would involve TWEEN callbacks.
    setTimeout(resolve, 600); 
  });
}

// Capture static image from the WebGL canvas
export const captureImage = async (side?: 'front' | 'back', quality = 1): Promise<Blob> => {
  const canvasElement = document.querySelector('canvas');
  if (!canvasElement) throw new Error('Canvas element not found');

  // Set camera position if specific side requested
  if (side) {
    await setCameraForExport(side);
    // Give a brief moment for the scene to render after camera movement
    await new Promise(resolve => setTimeout(resolve, 100)); 
  }

  // Use the canvas's own toBlob method for direct WebGL capture
  return new Promise((resolve, reject) => {
    canvasElement.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create image blob from canvas'));
      }
    }, 'image/png', quality);
  });
};

// Record video animation from the WebGL canvas
export const recordAnimation = async (duration = 5, fps = 30): Promise<Blob> => {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('Canvas element not found');

  return new Promise((resolve, reject) => {
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    }
    recorder.onerror = (e) => {
      reject(e);
    }
    
    recorder.start();
    setTimeout(() => {
      recorder.stop();
      stream.getTracks().forEach(track => track.stop());
    }, duration * 1000);
  });
};