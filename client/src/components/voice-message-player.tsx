import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  voiceUrl: string;
  duration: number;
  className?: string;
  variant?: 'sent' | 'received';
}

export function VoiceMessagePlayer({ 
  voiceUrl, 
  duration, 
  className,
  variant = 'received' 
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceUrl);
    audioRef.current = audio;

    const handleLoadedData = () => setIsLoaded(true);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [voiceUrl]);

  const togglePlayback = () => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !isLoaded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const downloadVoice = () => {
    const link = document.createElement('a');
    link.href = voiceUrl;
    link.download = `voice-message-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg min-w-64",
      variant === 'sent' 
        ? "bg-blue-500 text-white" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      className
    )}>
      <Button
        onClick={togglePlayback}
        size="sm"
        variant={variant === 'sent' ? 'secondary' : 'ghost'}
        className={cn(
          "rounded-full w-10 h-10 p-0",
          variant === 'sent' 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
        disabled={!isLoaded}
      >
        {isLoaded ? (
          isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />
        ) : (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </Button>

      <div className="flex-1">
        <div 
          className={cn(
            "relative h-2 rounded-full cursor-pointer",
            variant === 'sent' 
              ? "bg-white/20" 
              : "bg-gray-300 dark:bg-gray-600"
          )}
          onClick={handleSeek}
        >
          <div 
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-100",
              variant === 'sent' 
                ? "bg-white" 
                : "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
          <div 
            className={cn(
              "absolute top-0 w-3 h-3 rounded-full transform -translate-y-0.5 -translate-x-1.5 transition-all duration-100",
              variant === 'sent' 
                ? "bg-white" 
                : "bg-blue-500"
            )}
            style={{ left: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            "text-xs",
            variant === 'sent' 
              ? "text-white/70" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <Button
            onClick={downloadVoice}
            size="sm"
            variant="ghost"
            className={cn(
              "p-1 h-auto",
              variant === 'sent' 
                ? "text-white/70 hover:text-white hover:bg-white/10" 
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}