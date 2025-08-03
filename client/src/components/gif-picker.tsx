import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Image } from "lucide-react";

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  trigger?: React.ReactNode;
}

interface GifData {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
    };
  };
}

export function GifPicker({ onGifSelect, trigger }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // For demo purposes, we'll use a free Giphy API key or show placeholder
  // In production, you'd want to use environment variables
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Free public API key for demo

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data || []);
      } else {
        console.error('Failed to fetch GIFs');
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingGifs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifSelect = (gif: GifData) => {
    onGifSelect(gif.images.fixed_height.url);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchQuery);
  };

  useEffect(() => {
    if (isOpen && !hasSearched) {
      loadTrendingGifs();
    }
  }, [isOpen, hasSearched]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="p-2">
            <Image className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for GIFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        <ScrollArea className="h-[400px]">
          {isLoading && !gifs.length ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading GIFs...</span>
            </div>
          ) : gifs.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={gif.images.preview_gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Image className="h-12 w-12 mb-2" />
              <p>No GIFs found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Image className="h-12 w-12 mb-2" />
              <p>Search for GIFs or browse trending</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}