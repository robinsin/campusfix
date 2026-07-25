import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FileDropzoneProps {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptTypes?: string[];
  files: File[];
  onChange: (files: File[]) => void;
  existingUrls?: string[];
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  maxFiles = 3,
  maxSizeMB = 5,
  acceptTypes = ['image/jpeg', 'image/png'],
  files,
  onChange,
  existingUrls = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    const valid: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} photos allowed per request.`);
    }

    Array.from(newFiles).forEach((file) => {
      if (files.length + valid.length >= maxFiles) return;

      if (!acceptTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG/PNG images are allowed.`);
        return;
      }

      if (file.size > maxSizeBytes) {
        toast.error(`File too large: ${file.name} exceeds ${maxSizeMB}MB limit.`);
        return;
      }

      valid.push(file);
    });

    if (valid.length > 0) {
      onChange([...files, ...valid]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging ? 'border-worn-gold bg-amber-50/50' : 'border-slate-300 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptTypes.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
        />
        <div className="w-10 h-10 rounded-full bg-chalk flex items-center justify-center text-worn-gold mb-2">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-ledger-navy">
          Drag & drop evidence photos here, or <span className="text-worn-gold underline">browse</span>
        </p>
        <p className="text-xs text-ink/60 mt-1">
          JPG or PNG up to {maxSizeMB}MB (Max {maxFiles} images)
        </p>
      </div>

      {/* Existing and new file previews */}
      {(files.length > 0 || existingUrls.length > 0) && (
        <div className="grid grid-cols-3 gap-3 pt-1">
          {existingUrls.map((url, i) => (
            <div key={`exist-${i}`} className="relative group rounded border border-slate-200 overflow-hidden bg-slate-100 aspect-video">
              <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                Existing photo
              </div>
            </div>
          ))}

          {files.map((file, i) => (
            <div key={`new-${i}`} className="relative group rounded border border-slate-200 overflow-hidden bg-slate-100 aspect-video">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="absolute top-1 right-1 bg-ledger-navy/80 hover:bg-ledger-navy text-white rounded-full p-1 shadow-sm transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] truncate px-1 py-0.5">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
