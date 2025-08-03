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

interface TenorGifData {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
      dims: number[];
      duration: number;
      size: number;
    };
    tinygif: {
      url: string;
      dims: number[];
      duration: number;
      size: number;
    };
    mp4: {
      url: string;
      dims: number[];
      duration: number;
      size: number;
    };
  };
  content_description: string;
}

export function GifPicker({ onGifSelect, trigger }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGifData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Tenor API key - free public key for demo
  // In production, you'd want to use environment variables
  const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Google's free public API key for demo

  // Cache duration (e.g., 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  const gifCache = new Map<string, TenorGifData[]>();
  const cacheTimestamps = new Map<string, number>();

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs([]);
      setHasSearched(false);
      return;
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const now = Date.now();

    // Check cache first
    if (gifCache.has(cacheKey) && cacheTimestamps.has(cacheKey)) {
      const cacheTime = cacheTimestamps.get(cacheKey)!;
      if (now - cacheTime < CACHE_DURATION) {
        setGifs(gifCache.get(cacheKey)!);
        setHasSearched(true);
        return;
      }
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif&contentfilter=high`
      );

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];

        // Cache the results
        gifCache.set(cacheKey, results);
        cacheTimestamps.set(cacheKey, now);

        setGifs(results);
      } else {
        console.error('Failed to fetch GIFs from Tenor');
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching GIFs from Tenor:', error);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingGifs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif&contentfilter=high`
      );

      if (response.ok) {
        const data = await response.json();
        setGifs(data.results || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching featured GIFs from Tenor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifSelect = (gif: TenorGifData) => {
    // Use the gif format URL for the best quality
    const gifUrl = gif.media_formats.gif?.url || gif.media_formats.tinygif?.url;
    if (gifUrl) {
      onGifSelect(gifUrl);
      setIsOpen(false);
    }
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
                    src={gif.media_formats.tinygif?.url || gif.media_formats.gif?.url}
                    alt={gif.content_description || gif.title}
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