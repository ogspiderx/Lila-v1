import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File, Image, FileText, Download, Music, Video, Archive, Code, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageViewer } from "@/components/image-viewer";
import { LazyImage } from "@/components/lazy-image";

interface FileAttachmentProps {
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  selectedFile?: File | null;
  disabled?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
}

export function EnhancedFileAttachment({ onFileSelect, onRemove, selectedFile, disabled, uploadProgress = 0, isUploading = false }: FileAttachmentProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle file validation and selection
  const handleFileValidationAndSelect = (file: File) => {
    // Check file size (300MB limit)
    if (file.size > 300 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 300MB",
        variant: "destructive",
      });
      return false;
    }

    onFileSelect(file);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleFileValidationAndSelect(file);
    
    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileValidationAndSelect(files[0]);
    }
  };

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || isUploading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleFileValidationAndSelect(file);
            toast({
              title: "File pasted",
              description: `${file.name} pasted from clipboard`,
            });
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled, isUploading]);

  const getFileIcon = (type: string, fileName?: string) => {
    // Get file extension for better detection
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
    
    if (type.startsWith('image/')) {
      return <Image size={16} className="text-blue-500" />;
    } else if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension || '')) {
      return <Music size={16} className="text-green-500" />;
    } else if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension || '')) {
      return <Video size={16} className="text-purple-500" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive size={16} className="text-orange-500" />;
    } else if (type.includes('javascript') || type.includes('json') || type.includes('xml') || ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'sh', 'bat'].includes(extension || '')) {
      return <Code size={16} className="text-indigo-500" />;
    } else if (type === 'application/pdf' || type.includes('document') || ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText size={16} className="text-red-500" />;
    } else {
      return <File size={16} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border">
        {getFileIcon(selectedFile.type, selectedFile.name)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedFile.name}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            {isUploading && (
              <div className="flex-1 min-w-0">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="p-1 h-6 w-6"
          disabled={disabled}
        >
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {/* Drop zone overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-dashed border-blue-500">
            <div className="text-center">
              <Upload size={48} className="mx-auto text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">Drop your file here</p>
              <p className="text-sm text-gray-500">Up to 300MB supported</p>
            </div>
          </div>
        </div>
      )}

      {/* Invisible drop zone */}
      <div
        ref={dropZoneRef}
        className="fixed inset-0 z-40"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ display: isDragOver ? 'block' : 'none' }}
      />

      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.zip,.rar,.7z,.tar,.gz,.mp3,.wav,.flac,.aac,.ogg,.m4a,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.js,.ts,.tsx,.jsx,.html,.css,.json,.xml,.yaml,.yml,.md,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.sql,.sh,.bat,.ps1,.log,.ini,.cfg,.conf,.env"
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2"
        title="Attach file (or drag & drop, or paste from clipboard)"
      >
        {isUploading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        ) : (
          <Paperclip size={16} />
        )}
      </Button>
    </div>
  );
}

// File upload utility function
export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; name: string; type: string; size: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('chat_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          
          // Calculate size in appropriate units
          const sizeInBytes = file.size;
          let sizeString;
          if (sizeInBytes < 1024) {
            sizeString = `${sizeInBytes} B`;
          } else if (sizeInBytes < 1024 * 1024) {
            sizeString = `${(sizeInBytes / 1024).toFixed(2)} KB`;
          } else {
            sizeString = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
          }

          resolve({
            url: result.url,
            name: file.name,
            type: file.type,
            size: sizeString
          });
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

interface FileDisplayProps {
  attachment: {
    url: string;
    name: string;
    type: string;
    size: string;
  };
}

export function FileDisplay({ attachment }: FileDisplayProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const isImage = attachment.type.startsWith('image/');

  const getFileIcon = (type: string, fileName?: string) => {
    // Get file extension for better detection
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
    
    if (type.startsWith('image/')) {
      return <Image size={20} className="text-blue-500" />;
    } else if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension || '')) {
      return <Music size={20} className="text-green-500" />;
    } else if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension || '')) {
      return <Video size={20} className="text-purple-500" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive size={20} className="text-orange-500" />;
    } else if (type.includes('javascript') || type.includes('json') || type.includes('xml') || ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'sh', 'bat'].includes(extension || '')) {
      return <Code size={20} className="text-indigo-500" />;
    } else if (type === 'application/pdf' || type.includes('document') || ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText size={20} className="text-red-500" />;
    } else {
      return <File size={20} className="text-gray-500" />;
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  if (isImage) {
    return (
      <>
        <div className="mt-2 max-w-sm">
          <LazyImage
            src={attachment.url}
            alt={attachment.name}
            className="rounded-lg border max-h-48 w-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsViewerOpen(true)}
            showSkeleton={false}
            aspectRatio="auto"
          />
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span className="truncate flex-1">{attachment.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 w-6 p-0 ml-2"
              title="Download"
            >
              <Download size={12} />
            </Button>
          </div>
        </div>
        
        <ImageViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={attachment.url}
          imageName={attachment.name}
        />
      </>
    );
  }

  return (
    <div className="mt-2 max-w-sm">
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleDownload}>
        {getFileIcon(attachment.type, attachment.name)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.name}
          </p>
          <p className="text-xs text-gray-500">{attachment.size}</p>
        </div>
        <Download size={16} className="text-gray-400" />
      </div>
    </div>
  );
}