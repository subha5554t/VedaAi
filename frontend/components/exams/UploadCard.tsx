'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadCardProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function UploadCard({
  label,
  file,
  onFileSelect,
  onRemove,
  maxSizeMB = 10,
  disabled = false,
}: UploadCardProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) onFileSelect(acceptedFiles[0]);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: disabled || !!file,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-gray-700">{label}</p>

      {file ? (
        /* ── Filled State ── */
        <div className="relative flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-scale-in">
          {/* PDF Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <FileText size={20} className="text-red-500" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
          </div>

          {/* Checkmark */}
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm"
          >
            <X size={11} className="text-white" />
          </button>
        </div>
      ) : (
        /* ── Empty State ── */
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 min-h-[140px]',
            isDragActive
              ? 'border-orange-400 bg-orange-50 scale-[1.01]'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          {/* Max size badge */}
          <span className="absolute top-2.5 right-3 text-[10px] font-medium text-gray-400 bg-white border border-gray-100 rounded-full px-2 py-0.5">
            Max {maxSizeMB}MB
          </span>

          {/* Upload icon */}
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
              isDragActive ? 'bg-orange-100' : 'bg-white border border-gray-200'
            )}
          >
            <Upload
              size={20}
              className={isDragActive ? 'text-orange-500' : 'text-gray-400'}
              strokeWidth={1.75}
            />
          </div>

          <div className="text-center">
            <p className="text-[13px] font-medium text-gray-700">
              {isDragActive ? 'Drop it here!' : 'Drag & drop or'}
            </p>
            {!isDragActive && (
              <button
                type="button"
                className="mt-1 text-[12px] font-semibold text-[#E8520A] hover:underline"
              >
                Browse files
              </button>
            )}
          </div>

          <p className="text-[11px] text-gray-400">PDF, JPG, PNG supported</p>
        </div>
      )}
    </div>
  );
}
