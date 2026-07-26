'use client';

import React, { useState, useRef } from 'react';
import { Upload, Trash2, RefreshCw, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { useToast } from '../context/toastContext';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (base64Image: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

export default function ImageUpload({ currentImageUrl, onUpload, onRemove }: ImageUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  const validateAndProcessFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      showToast('Please upload JPG, PNG, or WEBP image.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('Image size must be below 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBase64Data(result);
      setPreviewUrl(result);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleSaveImage = async () => {
    if (!base64Data) return;
    setUploading(true);
    try {
      await onUpload(base64Data);
      showToast('Profile image updated successfully', 'success');
      setSelectedFile(null);
      setBase64Data(null);
      setPreviewUrl(null);
    } catch (err: any) {
      showToast(err.message || 'Unable to update profile image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl && !previewUrl) return;
    setRemoving(true);
    try {
      await onRemove();
      showToast('Profile image removed', 'success');
      setPreviewUrl(null);
      setSelectedFile(null);
      setBase64Data(null);
    } catch (err: any) {
      showToast(err.message || 'Unable to remove profile image.', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setBase64Data(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeImage = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl bg-neutral-950/70 border border-neutral-900/80">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-200">Profile Image</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            JPG, PNG, or WEBP. Maximum file size 5MB.
          </p>
        </div>
        {previewUrl && (
          <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2.5 py-1 rounded-full animate-pulse">
            Unsaved Preview
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Current / Preview Image Display */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-900 shadow-xl flex items-center justify-center shrink-0">
            {activeImage ? (
              <img src={activeImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-neutral-600" />
            )}
          </div>
        </div>

        {/* Drag & Drop / Input area */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-300">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{selectedFile ? selectedFile.name : 'Click or drag image to upload'}</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Supported formats: JPG, PNG, WEBP (Max 5MB)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {previewUrl && (
              <>
                <button
                  type="button"
                  onClick={handleSaveImage}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Image
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={uploading}
                  className="px-3.5 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 text-xs font-medium transition"
                >
                  Cancel
                </button>
              </>
            )}

            {!previewUrl && currentImageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={removing}
                className="px-3.5 py-2 rounded-xl bg-red-950/20 border border-red-900/40 hover:bg-red-900/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Remove Image
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
