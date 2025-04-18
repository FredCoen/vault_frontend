'use client';

import ThemeToggle from './ThemeToggle';
import MinimalConnectButton from './MinimalConnectButton';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center bg-[var(--background)] border-b border-[var(--border-color)]">
      <div className="flex items-center space-x-10">
        <div className="font-bold text-xl text-[var(--foreground)] flex flex-col">
          <div className="flex items-center">
            <Image
              src="/socket_logo.jpg"
              alt="Socket Logo"
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <span>Filler vaults</span>
          </div>
          <span className="text-xs text-gray-400 ml-14 -mt-1">powered by Socket</span>
        </div>
        
        {/* Navigation menu removed as requested */}
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <MinimalConnectButton />
      </div>
    </header>
  );
} 