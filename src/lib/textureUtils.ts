export const generateTextTexture = (
  text: string, 
  options: { color: string; fontSize: number }
): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Set canvas size based on text
  ctx.font = `bold ${options.fontSize}px Arial`
  const textWidth = ctx.measureText(text).width
  canvas.width = Math.max(200, textWidth + 40)
  canvas.height = options.fontSize * 2
  
  // Fill background
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw text
  ctx.font = `bold ${options.fontSize}px Arial`
  ctx.fillStyle = options.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  return canvas.toDataURL('image/png')
}