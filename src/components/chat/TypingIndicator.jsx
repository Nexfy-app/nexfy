import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator({ name = 'Digitando' }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          />
        ))}
      </div>
      <span>{name} está digitando...</span>
    </div>
  );
}