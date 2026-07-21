'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Upload, Image as ImageIcon, CheckCircle2, Trash2, RefreshCw, X, FolderOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUploader({ label = 'Cover Image *', value, onChange, folder = 'treckwari/treks' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64 and upload to backend
  const processAndUploadFile = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Str = e.target?.result as string;
      try {
        const res = await api.upload.image(base64Str, folder);
        if (res && res.url) {
          onChange(res.url);
        } else {
          alert('Upload failed: Invalid response from server.');
        }
      } catch (err: any) {
        console.error('Image upload error:', err);
        alert(err.message || 'Failed to upload image to server.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndUploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Fetch Media Library images
  const openMediaLibrary = async () => {
    setShowMediaLibrary(true);
    setLoadingLibrary(true);
    try {
      const data = await api.gallery.list();
      setLibraryImages(data || []);
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}</label>}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {/* State 1: Uploading Spinner */}
      {uploading ? (
        <div className="border-2 border-dashed border-primary-orange/50 bg-orange-50/50 rounded-2xl p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary-orange animate-spin mx-auto" />
          <p className="text-xs font-bold text-primary-orange font-display">Uploading image to cloud storage...</p>
        </div>
      ) : value ? (
        /* State 2: Image Uploaded & Live Preview */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group shadow-sm">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover group-hover:scale-103 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'; }}
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/95 text-dark-charcoal text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-white cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary-orange" />
              <span>Change Image</span>
            </button>

            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-650 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-red-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </div>

          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <CheckCircle2 className="h-3 w-3" /> Image Uploaded
          </div>
        </div>
      ) : (
        /* State 3: Drag & Drop Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
            dragOver 
              ? 'border-primary-orange bg-orange-50/50 scale-[1.01]' 
              : 'border-gray-250 bg-gray-50/60 hover:bg-gray-100/50 hover:border-gray-300'
          }`}
        >
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 border border-orange-200 text-primary-orange flex items-center justify-center mx-auto shadow-sm">
              <Upload className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-dark-charcoal font-display">Drag & Drop Image Here</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">JPG, PNG, WEBP up to 10 MB</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-orange hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
              >
                Browse Files
              </button>

              <button
                type="button"
                onClick={openMediaLibrary}
                className="bg-white border border-gray-250 hover:border-dark-charcoal text-dark-charcoal text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <FolderOpen className="h-3.5 w-3.5 text-primary-orange" />
                <span>Media Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Picker Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 rounded-[24px] max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-gray-50 rounded-t-[24px]">
              <div>
                <h3 className="text-base font-extrabold text-dark-charcoal font-display">Choose from Media Library</h3>
                <p className="text-xs text-gray-400 font-semibold">Select any previously uploaded trek photo.</p>
              </div>
              <button onClick={() => setShowMediaLibrary(false)} className="text-gray-400 hover:text-dark-charcoal p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingLibrary ? (
                <div className="p-12 text-center text-gray-400 text-xs font-bold">Loading media library...</div>
              ) : libraryImages.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs font-bold space-y-2">
                  <p>No media found in library.</p>
                  <button
                    type="button"
                    onClick={() => { setShowMediaLibrary(false); fileInputRef.current?.click(); }}
                    className="text-primary-orange hover:underline cursor-pointer"
                  >
                    Upload a new image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {libraryImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        onChange(img.url);
                        setShowMediaLibrary(false);
                      }}
                      className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-square cursor-pointer hover:border-primary-orange hover:shadow-md transition-all"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-primary-orange/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-primary-orange text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
