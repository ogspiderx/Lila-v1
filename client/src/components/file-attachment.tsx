import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, File, Image, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileAttachmentProps {
  onFileSelect: (fileData: { url: string; name: string; type: string; size: string }) => void;
  onRemove: () => void;
  selectedFile?: { url: string; name: string; type: string; size: string } | null;
  disabled?: boolean;
}

export function FileAttachment({ onFileSelect, onRemove, selectedFile, disabled }: FileAttachmentProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('chat_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const fileData = await response.json();
      onFileSelect(fileData);
      
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image size={16} className="text-blue-500" />;
    } else if (type === 'application/pdf' || type.includes('document')) {
      return <FileText size={16} className="text-red-500" />;
    } else {
      return <File size={16} className="text-gray-500" />;
    }
  };

  if (selectedFile) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border">
        {getFileIcon(selectedFile.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500">{selectedFile.size}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0"
          disabled={disabled}
        >
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2"
        title="Attach file"
      >
        {uploading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        ) : (
          <Upload size={16} />
        )}
      </Button>
    </div>
  );
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
  const isImage = attachment.type.startsWith('image/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  if (isImage) {
    return (
      <div className="mt-2 max-w-sm">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="rounded-lg border max-h-48 w-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url, '_blank')}
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
    );
  }

  return (
    <div className="mt-2 max-w-sm">
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleDownload}>
        {attachment.type === 'application/pdf' ? (
          <FileText size={20} className="text-red-500" />
        ) : attachment.type.includes('document') ? (
          <FileText size={20} className="text-blue-500" />
        ) : (
          <File size={20} className="text-gray-500" />
        )}
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