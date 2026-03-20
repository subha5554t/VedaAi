'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function FileUploadZone({ file, onFileSelect }: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    const FileIcon = getFileIcon(file);
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileIcon size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-800 truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-[11px] text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-orange-400 bg-orange-50'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <Upload size={28} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] text-gray-600">
            {isDragActive ? 'Drop file here' : 'Choose a file or drag & drop it here'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">JPEG, PNG, upto 10MB</p>
        </div>
        <button
          type="button"
          className="mt-1 px-4 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-white transition-colors bg-white"
        >
          Browse Files
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-3">Upload images of your preferred document/image</p>
    </div>
  );
}
