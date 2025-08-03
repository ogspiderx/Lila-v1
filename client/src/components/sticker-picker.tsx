import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile } from "lucide-react";

interface StickerPickerProps {
  onStickerSelect: (stickerUrl: string) => void;
  trigger?: React.ReactNode;
}

// Define sticker packs with SVG-based stickers for reliability
const STICKER_PACKS = {
  emotions: {
    name: "Emotions",
    stickers: [
      { id: "happy", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjIyIiBjeT0iMjQiIHI9IjMiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iNDIiIGN5PSIyNCIgcj0iMyIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjAgNDBRMzIgNTAgNDQgNDBRMzIgNDUgMjAgNDBaIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==", name: "Happy" },
      { id: "sad", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiM5M0M1RkQiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjIyIiBjeT0iMjQiIHI9IjMiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iNDIiIGN5PSIyNCIgcj0iMyIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNDQgNDZRMzIgMzYgMjAgNDZRMzIgNDEgNDQgNDZaIiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMzAiIHI9IjEiIGZpbGw9IiM5M0M1RkQiLz4KPGNpcmNsZSBjeD0iMzgiIGN5PSIzMCIgcj0iMSIgZmlsbD0iIzlDNUZEIi8+Cjwvc3ZnPg==", name: "Sad" },
      { id: "love", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0xOCAyMEM4IDIwIDggMzAgMTggMzBMMjIgMzRMMjYgMzBDMzYgMzAgMzYgMjAgMjYgMjBDMjYgMjAgMjIgMjAgMjIgMjBDMjIgMjAgMjIgMjAgMTggMjBaIiBmaWxsPSIjRkY2MzY0Ii8+CjxwYXRoIGQ9Ik0zOCAyMEMzOCAyMCAzOCAyMCAzOCAyMEMzNCAyMCAzNCAyMCAzNCAyMEMzNCAyMCAzOCAyNCAzOCAyNEw0MiAyOEM1MiAyOCA1MiAxOCA0MiAxOEMzOCAxOCAzOCAxOCAzOCAxOFogTTM4IDIwQzI4IDIwIDI4IDMwIDM4IDMwTDQyIDM0TDQ2IDMwQzU2IDMwIDU2IDIwIDQ2IDIwQzQ2IDIwIDQyIDIwIDQyIDIwQzQyIDIwIDQyIDIwIDM4IDIwWiIgZmlsbD0iI0ZGNjM2NCIvPgo8cGF0aCBkPSJNMjAgNDBRMzIgNTAgNDQgNDBRMzIgNDUgMjAgNDBaIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==", name: "Love" },
      { id: "angry", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNGRjYzNjQiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjIyIiBjeT0iMjQiIHI9IjMiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iNDIiIGN5PSIyNCIgcj0iMyIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNDQgNDZRMzIgMzYgMjAgNDZRMzIgNDEgNDQgNDZaIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xOCAxOEwyNiAyNiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNNDYgMThMMzggMjYiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+", name: "Angry" },
      { id: "surprised", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjIyIiBjeT0iMjQiIHI9IjQiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iNDIiIGN5PSIyNCIgcj0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjQ0IiByPSI0IiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==", name: "Surprised" },
      { id: "wink", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjQyIiBjeT0iMjQiIHI9IjMiIGZpbGw9IiMzMzMzMzMiLz4KPHBhdGggZD0iTTIwIDQwUTMyIDUwIDQ0IDQwUTMyIDQ1IDIwIDQwWiIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMTggMjJRMjYgMjYgMTggMjYiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+", name: "Wink" }
    ]
  },
  animals: {
    name: "Animals",
    stickers: [
      { id: "cat", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzNiIgcj0iMjQiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0cmlhbmdsZSBjeDE9IjIwIiBjeTI9IjE0IiBjeDM9IjI2IiBjeTM9IjI2IiBmaWxsPSIjRkZBMTY5IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgo8dHJpYW5nbGUgY3gxPSI0NCIgY3kyPSIxNCIgY3gzPSIzOCIgY3kzPSIyNiIgZmlsbD0iI0ZGQTEyOSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjYiIGN5PSIzMCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIzOCIgY3k9IjMwIiByPSIyIiBmaWxsPSIjMzMzMzMzIi8+Cjx0cmlhbmdsZSBjeDE9IjMyIiBjeTI9IjM0IiBjeDM9IjMwIiBjeTM9IjM4IiBjeDQ9IjM0IiBjeTQ9IjM4IiBmaWxsPSIjRkY2MzY0Ii8+CjxwYXRoIGQ9Ik0yNiA0Mk00MiA0MiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMzIgMzhMNDggNTQiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTMyIDM4TDE2IDU0IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==", name: "Cat" },
      { id: "dog", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjMyIiBjeT0iMzYiIHJ4PSIyNCIgcnk9IjIwIiBmaWxsPSIjQ0Q4NTNGIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgo8ZWxsaXBzZSBjeD0iMTgiIGN5PSIyMCIgcng9IjgiIHJ5PSIxNCIgZmlsbD0iI0NEODUzRiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGVsbGlwc2UgY3g9IjQ2IiBjeT0iMjAiIHJ4PSI4IiByeT0iMTQiIGZpbGw9IiNDRDg1M0YiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMzAiIHI9IjMiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMzgiIGN5PSIzMCIgcj0iMyIgZmlsbD0iIzMzMzMzMyIvPgo8ZWxsaXBzZSBjeD0iMzIiIGN5PSI0MCIgcng9IjQiIHJ5PSIzIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0yNiA0NlE0MCA0NiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=", name: "Dog" },
      { id: "panda", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzNCIgcj0iMjIiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIxOCIgY3k9IjIwIiByPSIxMCIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSI0NiIgY3k9IjIwIiByPSIxMCIgZmlsbD0iIzMzMzMzMyIvPgo8ZWxsaXBzZSBjeD0iMjQiIGN5PSIzMCIgcng9IjYiIHJ5PSI4IiBmaWxsPSIjMzMzMzMzIi8+CjxlbGxpcHNlIGN4PSI0MCIgY3k9IjMwIiByeD0iNiIgcnk9IjgiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiLz4KPGVsbGlwc2UgY3g9IjMyIiBjeT0iMzgiIHJ4PSIzIiByeT0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMjggNDJRMzYgNDIiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+", name: "Panda" },
      { id: "bear", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzNCIgcj0iMjIiIGZpbGw9IiNDRDg1M0YiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjE4IiBjeT0iMjAiIHI9IjgiIGZpbGw9IiNDRDg1M0YiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjQ2IiBjeT0iMjAiIHI9IjgiIGZpbGw9IiNDRDg1M0YiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMzAiIHI9IjIiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMzgiIGN5PSIzMCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8ZWxsaXBzZSBjeD0iMzIiIGN5PSIzOCIgcng9IjMiIHJ5PSIyIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0yOCA0MlEzNiA0MiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=", name: "Bear" }
    ]
  },
  food: {
    name: "Food",
    stickers: [
      { id: "pizza", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMyIDhMOCA1NkgzMkw1NiA1NkwzMiA4WiIgZmlsbD0iI0ZGRDcwMCIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSI0NCIgcj0iMyIgZmlsbD0iI0ZGNjM2NCIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjM2IiByPSIzIiBmaWxsPSIjRkY2MzY0Ii8+CjxjaXJjbGUgY3g9IjQ0IiBjeT0iNDQiIHI9IjMiIGZpbGw9IiNGRjYzNjQiLz4KPGNpcmNsZSBjeD0iMjYiIGN5PSIyOCIgcj0iMiIgZmlsbD0iIzRBRDA1MyIvPgo8Y2lyY2xlIGN4PSIzOCIgY3k9IjMyIiByPSIyIiBmaWxsPSIjNEFEMDUzIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMzgiIHI9IjIiIGZpbGw9IiM0QUQwNTMiLz4KPC9zdmc+", name: "Pizza" },
      { id: "burger", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjMyIiBjeT0iMjAiIHJ4PSIyNCIgcnk9IjgiIGZpbGw9IiNDRDg1M0YiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxyZWN0IHg9IjgiIHk9IjI4IiB3aWR0aD0iNDgiIGhlaWdodD0iNiIgZmlsbD0iIzRBRDA1MyIvPgo8cmVjdCB4PSI4IiB5PSIzNCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjgiIGZpbGw9IiNDRDg1M0YiLz4KPHJlY3QgeD0iOCIgeT0iNDIiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0IiBmaWxsPSIjRkZEMTk0Ii8+CjxyZWN0IHg9IjgiIHk9IjQ2IiB3aWR0aD0iNDgiIGhlaWdodD0iNCIgZmlsbD0iI0ZGNjM2NCIvPgo8ZWxsaXBzZSBjeD0iMzIiIGN5PSI1NCIgcng9IjI0IiByeT0iNiIgZmlsbD0iI0NEODUzRiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+", name: "Burger" },
      { id: "ice-cream", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTYiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMTgiIHI9IjEwIiBmaWxsPSIjRkZEMTk0IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSI0MCIgY3k9IjE4IiByPSIxMCIgZmlsbD0iI0ZGNjM2NCIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHJlY3QgeD0iMjgiIHk9IjQwIiB3aWR0aD0iOCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0NEODUzRiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iMjgiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI0ZGNjM2NCIvPgo8Y2lyY2xlIGN4PSIzNiIgY3k9IjI4IiByPSIyIiBmaWxsPSIjRkZEMTk0Ii8+Cjwvc3ZnPg==", name: "Ice Cream" },
      { id: "donut", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjQiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHJlY3QgeD0iMjAiIHk9IjE2IiB3aWR0aD0iNCIgaGVpZ2h0PSI4IiBmaWxsPSIjRkY2MzY0IiByeD0iMiIvPgo8cmVjdCB4PSI0MCIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIGZpbGw9IiM0QUQwNTMiIHJ4PSIyIi8+CjxyZWN0IHg9IjQ0IiB5PSI0MCIgd2lkdGg9IjQiIGhlaWdodD0iOCIgZmlsbD0iI0ZGRDcwMCIgcng9IjIiLz4KPHJlY3QgeD0iMTYiIHk9IjQ0IiB3aWR0aD0iNCIgaGVpZ2h0PSI4IiBmaWxsPSIjOTNDNUZEIiByeD0iMiIvPgo8cmVjdCB4PSIyOCIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiNGRkExNjkiIHJ4PSIyIi8+Cjwvc3ZnPg==", name: "Donut" }
    ]
  },
  gestures: {
    name: "Gestures",
    stickers: [
      { id: "thumbs-up", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjAiIHk9IjMyIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iNCIvPgo8cmVjdCB4PSIyOCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkZBMTY5IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgcng9IjQiLz4KPHJlY3QgeD0iMTYiIHk9IjQ0IiB3aWR0aD0iOCIgaGVpZ2h0PSIxMiIgZmlsbD0iI0ZGQTEyOSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+", name: "Thumbs Up" },
      { id: "peace", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjQiIHk9IjQ0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iNCIvPgo8cmVjdCB4PSIyOCIgeT0iMTYiIHdpZHRoPSI0IiBoZWlnaHQ9IjI4IiBmaWxsPSIjRkZBMTY5IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgcng9IjIiLz4KPHJlY3QgeD0iMzIiIHk9IjEyIiB3aWR0aD0iNCIgaGVpZ2h0PSIzMiIgZmlsbD0iI0ZGQTEyOSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiIHJ4PSIyIi8+Cjwvc3ZnPg==", name: "Peace" },
      { id: "ok", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjQiIHk9IjQ0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iNCIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjI0IiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkExNjkiIHN0cm9rZS13aWR0aD0iNCIvPgo8cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI0IiBoZWlnaHQ9IjI4IiBmaWxsPSIjRkZBMTY5IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgcng9IjIiLz4KPHJlY3QgeD0iNDQiIHk9IjIwIiB3aWR0aD0iNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0ZGQTEyOSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiIHJ4PSIyIi8+CjxyZWN0IHg9IjQ4IiB5PSIyNCIgd2lkdGg9IjQiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iMiIvPgo8L3N2Zz4=", name: "OK" },
      { id: "clap", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwIiBjeT0iMzIiIHJ4PSIxMiIgcnk9IjE2IiBmaWxsPSIjRkZBMTY5IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgdHJhbnNmb3JtPSJyb3RhdGUoLTIwIDIwIDMyKSIvPgo8ZWxsaXBzZSBjeD0iNDQiIGN5PSIzMiIgcng9IjEyIiByeT0iMTYiIGZpbGw9IiNGRkExNjkiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiB0cmFuc2Zvcm09InJvdGF0ZSgyMCA0NCAzMikiLz4KPHBhdGggZD0iTTI4IDIwTDM2IDI4IiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0zMiAxNkw0MCAyNCIgc3Ryb2tlPSIjRkZEN1VVIIGG0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyNEwzMiAzMiIgc3Ryb2tlPSIjRkZENVVVIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=", name: "Clap" }
    ]
  }
};

export function StickerPicker({ onStickerSelect, trigger }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("emotions");

  const handleStickerSelect = (stickerUrl: string) => {
    onStickerSelect(stickerUrl);
    setIsOpen(false);
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(STICKER_PACKS).map(([key, pack]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="text-xs px-2"
                title={pack.name}
              >
                {pack.name.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(STICKER_PACKS).map(([key, pack]) => (
            <TabsContent key={key} value={key}>
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {pack.stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerSelect(sticker.url)}
                      className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      title={sticker.name}
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}