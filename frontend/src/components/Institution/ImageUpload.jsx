// src/components/Institution/ImageUpload.jsx

import { useRef } from 'react';

const ImageUpload = ({ preview, onImageChange, onClear }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageChange(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Logo
      </label>

      <div className="w-36 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3 overflow-hidden bg-gray-50">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400">Image preview</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-600"
        >
          Choose image
        </button>

        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-500"
        >
          Clear
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;