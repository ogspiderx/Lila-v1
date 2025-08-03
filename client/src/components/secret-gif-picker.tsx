import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Download } from 'lucide-react';
import { LazyImage } from './lazy-image';

interface SecretGifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gifUrl: string, gifName: string) => void;
}

interface SecretGif {
  name: string;
  url: string;
  size: number;
}

export function SecretGifPicker({ isOpen, onClose, onGifSelect }: SecretGifPickerProps) {
  const [secretGifs, setSecretGifs] = useState<SecretGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSecretGifs();
    }
  }, [isOpen]);

  const fetchSecretGifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('chat_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/secret-gifs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load secret GIFs');
      }
      const gifs = await response.json();
      setSecretGifs(gifs);
    } catch (err) {
      console.error('Error fetching secret GIFs:', err);
      setError('Could not load secret GIFs');
    } finally {
      setLoading(false);
    }
  };

  const handleGifSelect = (gif: SecretGif) => {
    onGifSelect(gif.url, gif.name);
    onClose();
  };

  const handleDownload = (gif: SecretGif, event: React.MouseEvent) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = gif.url;
    link.download = gif.name;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-purple-600">
              🔮 Secret GIF Collection
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Exclusive collection of hand-picked GIFs
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Loading secret collection...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-40 text-center">
              <div className="text-red-500">
                <p className="font-medium">Oops!</p>
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSecretGifs}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && secretGifs.length === 0 && (
            <div className="flex items-center justify-center h-40 text-center">
              <div className="text-gray-500">
                <p className="font-medium">No secret GIFs found</p>
                <p className="text-sm">The secret collection is empty</p>
              </div>
            </div>
          )}

          {!loading && !error && secretGifs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {secretGifs.map((gif, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-purple-300"
                  onClick={() => handleGifSelect(gif)}
                >
                  <div className="aspect-square">
                    <LazyImage
                      src={gif.url}
                      alt={gif.name}
                      className="w-full h-full object-cover"
                      showSkeleton={true}
                      aspectRatio="square"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => handleDownload(gif, e)}
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {gif.name.replace(/\.[^/.]+$/, '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Select a GIF to send it in the chat
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}