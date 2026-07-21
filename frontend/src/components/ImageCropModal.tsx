'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, CheckCircle2 } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (base64: string) => void;
}

export function ImageCropModal({ isOpen, imageSrc, onClose, onCropComplete }: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleSave = () => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 400; // Profile avatar standard resolution
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Clear background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Move origin to center of canvas
        ctx.translate(size / 2, size / 2);

        // Rotate canvas
        ctx.rotate((rotation * Math.PI) / 180);

        // Scale canvas for zoom
        ctx.scale(zoom, zoom);

        // Calculate aspect ratios
        const imgRatio = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;

        if (imgRatio > 1) {
          // Landscape
          drawHeight = size;
          drawWidth = size * imgRatio;
        } else {
          // Portrait or Square
          drawWidth = size;
          drawHeight = size / imgRatio;
        }

        // Draw image accounting for drag offsets (rotated correctly)
        // Since coordinate system rotated, we must adjust offsets
        let dx = offset.x;
        let dy = offset.y;

        if (rotation === 90) {
          dx = offset.y;
          dy = -offset.x;
        } else if (rotation === 180) {
          dx = -offset.x;
          dy = -offset.y;
        } else if (rotation === 270) {
          dx = -offset.y;
          dy = offset.x;
        }

        ctx.drawImage(
          img,
          -drawWidth / 2 + dx / zoom,
          -drawHeight / 2 + dy / zoom,
          drawWidth,
          drawHeight
        );

        // Compress image to JPEG format with quality 0.85
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        onCropComplete(base64);
      }
    };
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-150 relative">
        {/* Header bar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-dark-charcoal font-display">Crop & Position Image</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-dark-charcoal bg-gray-50 p-2 rounded-full cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewport crop box container */}
        <div className="p-6 flex flex-col items-center space-y-6">
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="h-64 w-64 rounded-full border-4 border-primary-orange overflow-hidden relative bg-gray-50 cursor-move flex items-center justify-center shadow-inner"
          >
            <img
              src={imageSrc}
              alt="Crop preview source"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                maxWidth: '100%',
                maxHeight: '100%',
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                objectFit: 'contain'
              }}
            />
          </div>

          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Drag to position, Zoom/Rotate below</p>

          {/* Slider and Controls */}
          <div className="w-full space-y-4 pt-2">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-orange"
              />
              <ZoomIn className="h-4 w-4 text-gray-400" />
            </div>

            {/* Actions panel */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1.5 border border-gray-250 text-gray-500 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
              >
                <RotateCw className="h-4 w-4 text-primary-orange" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-primary-orange hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
