import React from 'react'

interface RangeSliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  label: string
  step?: number
}

const RangeSlider: React.FC<RangeSliderProps> = ({ 
  min, max, value, onChange, label, step = 1 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="block text-sm font-medium">{label}</label>
        <span className="text-sm text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  )
}

export default RangeSlider