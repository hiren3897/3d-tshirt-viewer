import React from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#c0c0c0', '#808080'
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          className={`w-8 h-8 rounded-full border-2 ${
            color === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
          }`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
          aria-label={`Select color ${c}`}
        />
      ))}
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