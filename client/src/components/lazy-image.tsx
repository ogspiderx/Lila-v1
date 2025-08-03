import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  placeholder?: string;
  aspectRatio?: "square" | "video" | "auto";
  showSkeleton?: boolean;
  fallbackSrc?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  onClick, 
  placeholder,
  aspectRatio = "auto",
  showSkeleton = true,
  fallbackSrc
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      default:
        return "";
    }
  };

  const containerClasses = cn(
    "relative overflow-hidden rounded-lg",
    getAspectRatioClass(),
    className
  );

  const imageClasses = cn(
    "w-full h-full object-cover transition-all duration-300 ease-out",
    {
      "opacity-0": !isLoaded,
      "opacity-100": isLoaded,
      "cursor-pointer hover:scale-105": onClick,
      "select-none": true
    }
  );

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 rounded-lg">
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="animate-pulse">
                <svg 
                  className="w-8 h-8" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" 
                  />
                </svg>
              </div>
              <span className="text-xs font-medium">Loading...</span>
            </div>
          </div>
        </Skeleton>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center border border-border">
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
            <svg 
              className="w-8 h-8 text-destructive/60" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" 
              />
            </svg>
            <div>
              <p className="text-sm font-medium">Failed to load</p>
              <p className="text-xs text-muted-foreground/70">Image unavailable</p>
            </div>
          </div>
        </div>
      )}

      {/* Actual image - loads immediately */}
      {!hasError && (
        <img
          src={currentSrc}
          alt={alt}
          className={imageClasses}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
        />
      )}

      {/* Placeholder overlay */}
      {placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 text-muted-foreground text-sm">
          {placeholder}
        </div>
      )}
    </div>
  );
}