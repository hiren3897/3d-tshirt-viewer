// Capture static image from the WebGL canvas
export const captureImage = async (quality: number): Promise<Blob> => {
  const canvasElement = document.querySelector('canvas');
  if (!canvasElement) throw new Error('Canvas element not found');


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