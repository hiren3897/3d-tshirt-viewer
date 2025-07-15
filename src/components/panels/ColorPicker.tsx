import React from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
        />
        <div 
          className="w-8 h-8 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default ColorPicker