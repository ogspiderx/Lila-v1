import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Smile } from "lucide-react";

interface StickerPickerProps {
  onStickerSelect: (stickerUrl: string) => void;
  trigger?: React.ReactNode;
}

interface StickerData {
  id: string;
  url: string;
  title?: string;
  category?: string;
}

// Predefined sticker categories with static URLs from free CDNs
const STICKER_CATEGORIES = {
  emoji: [
    { id: '1', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png', title: 'Grinning Face' },
    { id: '2', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png', title: 'Face with Tears of Joy' },
    { id: '3', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png', title: 'Smiling Face with Heart-Eyes' },
    { id: '4', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f97a.png', title: 'Pleading Face' },
    { id: '5', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png', title: 'Thumbs Up' },
    { id: '6', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44e.png', title: 'Thumbs Down' },
    { id: '7', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png', title: 'Red Heart' },
    { id: '8', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png', title: 'Fire' },
    { id: '9', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f389.png', title: 'Party Popper' },
    { id: '10', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f973.png', title: 'Partying Face' },
    { id: '11', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f914.png', title: 'Thinking Face' },
    { id: '12', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f62d.png', title: 'Loudly Crying Face' },
  ],
  animals: [
    { id: '13', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f436.png', title: 'Dog Face' },
    { id: '14', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png', title: 'Cat Face' },
    { id: '15', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f981.png', title: 'Lion' },
    { id: '16', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f43c.png', title: 'Panda' },
    { id: '17', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f98a.png', title: 'Fox' },
    { id: '18', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f43b.png', title: 'Bear' },
    { id: '19', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f42f.png', title: 'Tiger Face' },
    { id: '20', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f42e.png', title: 'Cow Face' },
  ],
  reactions: [
    { id: '21', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44f.png', title: 'Clapping Hands' },
    { id: '22', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f91d.png', title: 'Handshake' },
    { id: '23', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f64f.png', title: 'Folded Hands' },
    { id: '24', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44c.png', title: 'OK Hand' },
    { id: '25', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/270c.png', title: 'Victory Hand' },
    { id: '26', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f91f.png', title: 'Love-You Gesture' },
    { id: '27', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4aa.png', title: 'Flexed Biceps' },
    { id: '28', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f645.png', title: 'Person Gesturing No' },
  ]
};

export function StickerPicker({ onStickerSelect, trigger }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStickers, setFilteredStickers] = useState<StickerData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("emoji");

  // Get all stickers from the selected category
  const getCategoryStickers = (category: string): StickerData[] => {
    return STICKER_CATEGORIES[category as keyof typeof STICKER_CATEGORIES] || [];
  };

  // Filter stickers based on search query
  useEffect(() => {
    const categoryStickers = getCategoryStickers(selectedCategory);
    
    if (!searchQuery.trim()) {
      setFilteredStickers(categoryStickers);
    } else {
      const filtered = categoryStickers.filter(sticker =>
        sticker.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStickers(filtered);
    }
  }, [searchQuery, selectedCategory]);

  const handleStickerSelect = (sticker: StickerData) => {
    onStickerSelect(sticker.url);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="p-2">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose a Sticker</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emoji">Faces</TabsTrigger>
            <TabsTrigger value="animals">Animals</TabsTrigger>
            <TabsTrigger value="reactions">Gestures</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[400px]">
              {filteredStickers.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 p-2">
                  {filteredStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerSelect(sticker)}
                      className="relative aspect-square overflow-hidden rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 p-2"
                      title={sticker.title}
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.title || 'Sticker'}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Smile className="h-12 w-12 mb-2" />
                  <p>No stickers found</p>
                  <p className="text-sm">Try a different search term or category</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}