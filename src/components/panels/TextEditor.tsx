import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useDesignStore } from '../../contexts/DesignStoreProvider';
import ColorPicker from './ColorPicker';
import { generateTextTexture } from '../../lib/textureUtils';

const TextEditor: React.FC = () => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  const addDecal = useDesignStore((state) => state.addDecal);

  const handleAddText = () => {
    if (text.trim()) {
      const texture = generateTextTexture(text, { color, fontSize });
      addDecal(texture, 'text');
      setText('');
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Add Text</h3>
      <div className="flex gap-2 items-end">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text"
          className="flex-1"
        />
        
        <div className="w-8 h-8">
          <ColorPicker 
            color={color} 
            onChange={setColor} 
          />
        </div>
        
        <select 
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="h-9 text-sm border rounded px-2"
        >
          <option value="12">12px</option>
          <option value="16">16px</option>
          <option value="20">20px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
        </select>
        
        <Button
          onClick={handleAddText}
          size="sm"
          className="whitespace-nowrap"
          disabled={!text.trim()}
        >
          Add Text
        </Button>
      </div>
    </div>
  );
};

export default TextEditor;