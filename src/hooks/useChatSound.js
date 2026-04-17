import { useEffect } from 'react';

export function useChatSound() {
  const audioRef = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
  
  const playSound = () => {
    try {
      audioRef.currentTime = 0;
      audioRef.play().catch(() => {});
    } catch (e) {}
  };

  return { playSound };
}