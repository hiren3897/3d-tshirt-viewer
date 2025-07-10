import React, { useState } from 'react'
import { generateTextTexture } from '../../lib/textureUtils'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useDesignStore } from '../../contexts/DesignStoreProvider'


const TextEditor: React.FC = () => {
  const [text, setText] = useState('')
  const [color, setColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(36)
  const addDecal = useDesignStore((state) => state.addDecal)

  const handleAddText = () => {
    if (text.trim()) {
      const texture = generateTextTexture(text, { color, fontSize })
      addDecal(texture, 'text')
      setText('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Add Text</h3>
        <Input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text"
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input 
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded border"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Size: {fontSize}px</label>
          <input 
            type="range"
            min="10"
            max="100"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleAddText}
        className="w-full bg-primary-500 hover:bg-primary-600"
        disabled={!text.trim()}
      >
        Add Text
      </Button>
    </div>
  )
}

export default TextEditor