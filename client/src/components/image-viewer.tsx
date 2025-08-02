
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  images?: Array<{ url: string; name: string }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function ImageViewer({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageName, 
  images = [], 
  currentIndex = 0, 
  onNavigate 
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom and position when image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageUrl, isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '=':
        case '+':
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 5));
          break;
        case '-':
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.1));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          setRotation(0);
          break;
        case 'r':
          e.preventDefault();
          setRotation(prev => (prev + 90) % 360);
          break;
        case 'ArrowLeft':
          if (images.length > 1 && onNavigate && currentIndex > 0) {
            e.preventDefault();
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (images.length > 1 && onNavigate && currentIndex < images.length - 1) {
            e.preventDefault();
            onNavigate(currentIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, zoom, images.length, currentIndex, onNavigate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) return; // Only allow dragging on the image
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    link.click();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-white text-sm truncate max-w-md">
          {imageName}
          {images.length > 1 && (
            <span className="ml-2 text-gray-300">
              ({currentIndex + 1} of {images.length})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20"
            title="Zoom out (-)"
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20"
            title="Zoom in (+)"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-white/20"
            title="Rotate (R)"
          >
            <RotateCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
            title="Download"
          >
            <Download size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            title="Close (Esc)"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && onNavigate && (
        <>
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              title="Previous image (←)"
            >
              ←
            </Button>
          )}
          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              title="Next image (→)"
            >
              →
            </Button>
          )}
        </>
      )}

      {/* Image container */}
      <div
        className="w-full h-full flex items-center justify-center cursor-move"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-none max-h-none object-contain select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleReset}
          draggable={false}
        />
      </div>

      {/* Footer with controls info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs text-center opacity-75">
        <div>Double-click to reset • Drag to pan • Scroll or +/- to zoom</div>
        <div>R to rotate • ← → to navigate • ESC to close</div>
      </div>
    </div>
  );
}
