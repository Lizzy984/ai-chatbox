import React from 'react';
import { ConnectionState } from '../types';

interface Props {
  state: ConnectionState;
}

export const Visualizer: React.FC<Props> = ({ state }) => {
  if (state !== ConnectionState.CONNECTED) {
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className={`absolute w-full h-full rounded-full bg-brand-100 ${state === ConnectionState.CONNECTING ? 'animate-pulse' : ''}`}></div>
        <div className="z-10 text-4xl text-brand-500">
            {state === ConnectionState.CONNECTING ? '...' : '🎙️'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Decorative animated blobs to simulate voice activity */}
      <div className="absolute w-48 h-48 bg-brand-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 ml-4 mt-4"></div>
      <div className="absolute w-48 h-48 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 -ml-4 -mt-4"></div>
      
      <div className="relative z-10 bg-white bg-opacity-90 rounded-full p-6 shadow-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-3xl shadow-inner">
          <span className="animate-pulse">Sound</span>
        </div>
      </div>
    </div>
  );
};
