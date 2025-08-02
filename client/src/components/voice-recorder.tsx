import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  className?: string;
}

export function VoiceRecorder({ onVoiceRecorded, onCancel, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      return null;
    }
  };

  const startRecording = async () => {
    const stream = await requestMicrophonePermission();
    if (!stream) return;

    streamRef.current = stream;
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm'
    });
    
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { 
        type: chunksRef.current[0]?.type || 'audio/webm' 
      });
      setRecordedBlob(blob);
      
      // Create audio element to get duration
      const audio = new Audio(URL.createObjectURL(blob));
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audio.duration));
      });
    };

    mediaRecorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);

    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 0.1);
    }, 100);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(recordedBlob));
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current = null;
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setDuration(0);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const sendRecording = () => {
    if (recordedBlob && duration > 0) {
      onVoiceRecorded(recordedBlob, duration);
      deleteRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className={cn("p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800", className)}>
        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
          Microphone access is required for voice messages.
        </p>
        <Button 
          onClick={requestMicrophonePermission} 
          size="sm"
          variant="outline"
        >
          <Mic className="w-4 h-4 mr-2" />
          Allow Microphone
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
          )} />
          <span className="text-sm font-medium">
            {isRecording ? "Recording..." : recordedBlob ? "Voice Message Ready" : "Voice Message"}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          {isRecording ? formatTime(recordingTime) : recordedBlob ? formatTime(duration) : "0:00"}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        {!recordedBlob ? (
          <>
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white"
              >
                <Mic className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16"
              >
                <Square className="w-6 h-6 fill-current" />
              </Button>
            )}
            
            {onCancel && (
              <Button onClick={onCancel} variant="ghost" size="sm">
                Cancel
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={isPlaying ? pausePlayback : playRecording}
              size="sm"
              variant="outline"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={deleteRecording}
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={sendRecording}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Send Voice Message
            </Button>
            
            {onCancel && (
              <Button onClick={onCancel} variant="ghost" size="sm">
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
      
      {isRecording && (
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-red-500 h-1 rounded-full transition-all duration-100"
            style={{ width: `${Math.min((recordingTime / 120) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}