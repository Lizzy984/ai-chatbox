import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '../types';

interface Props {
  transcripts: TranscriptItem[];
}

export const ChatInterface: React.FC<Props> = ({ transcripts }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-8 text-center">
        <p>Conversation history will appear here.</p>
        <p className="mt-2">Press "Start Conversation" to begin.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {transcripts.map((item, index) => (
        <div
          key={index}
          className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
              item.sender === 'user'
                ? 'bg-brand-500 text-white rounded-br-none'
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}
          >
            {item.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
