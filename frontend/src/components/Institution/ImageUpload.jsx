// src/components/Institution/ImageUpload.jsx
import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import Button from '../ui/Button';

const ImageUpload = ({ preview, onImageChange, onClear }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageChange(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-ink-soft tracking-wide mb-2">Logo</label>

      <div className="w-36 h-24 border-2 border-dashed border-ink/15 rounded-lg flex items-center justify-center mb-3 overflow-hidden bg-ink/[0.02]">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-ink-faint flex flex-col items-center gap-1">
            <ImagePlus size={16} />
            Image preview
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()}>
          Choose image
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export default ImageUpload;
