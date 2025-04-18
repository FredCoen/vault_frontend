'use client';

import { useState } from 'react';
import { useTheme } from '../theme-provider';
import Image from 'next/image';

export default function DepositCard() {
  const [ethAmount, setEthAmount] = useState('0');
  const [usdValue, setUsdValue] = useState('$0.00');
  const [intentsExpanded, setIntentsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [totalFeesEarned, setTotalFeesEarned] = useState('0.0025 ETH');
  const [apy24h, setApy24h] = useState('160%');
  const { theme } = useTheme();
  
  // Dummy data for intents filled
  const intentsData = [
    { id: '0x1a2b...3c4d', date: '2023-11-25', netFee: '0.00045 ETH' },
    { id: '0x5e6f...7g8h', date: '2023-11-24', netFee: '0.00032 ETH' },
    { id: '0x9i0j...1k2l', date: '2023-11-23', netFee: '0.00078 ETH' },
    { id: '0x3m4n...5o6p', date: '2023-11-22', netFee: '0.00021 ETH' },
  ];
  
  const isDarkMode = theme === 'dark';
  
  return (
    <div className={`bg-[var(--card-bg)] text-[var(--foreground)] rounded-2xl p-8 w-full max-w-md mx-auto shadow-lg border border-[var(--border-color)] ${isDarkMode ? 'dark-card' : ''}`}>
      <div className="flex flex-col items-center mb-4">
        <div className="w-40 mb-4">
          <Image
            src="/Across Primary Logo Aqua.svg"
            alt="Across Logo"
            width={300}
            height={57}
            className="w-full h-auto"
            priority
          />
        </div>
        <h1 className="text-xl font-bold mb-4">ETH intent filler Strategy</h1>
        <div className="text-sm mb-1 text-gray-400">TVL</div>
        <h2 className={`text-2xl md:text-3xl font-bold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{ethAmount} ETH</h2>
        <p className="text-xl">{usdValue}</p>
      </div>
      
      <div className="border-t border-[var(--border-color)] py-6 text-left">
        <div 
          className="flex justify-between items-center mb-5 cursor-pointer hover:bg-[var(--background)] p-3 rounded transition-colors"
          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
        >
          <span className="text-[var(--foreground)] opacity-80 text-left text-lg">Description</span>
          <span>
            {descriptionExpanded ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
        </div>
        
        {descriptionExpanded && (
          <div className="mb-5 bg-[var(--background)] rounded-lg p-4">
            <p className="text-[var(--foreground)] opacity-90">
              This vault strategy captures value by filling intents on the Across protocol. Depositors share in the fees generated from successful bridging operations.
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <span className="text-[var(--foreground)] opacity-80 text-left text-lg">24h APY</span>
          <div className="flex items-center">
            <span className={`font-medium text-lg ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`}>{apy24h}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <span className="text-[var(--foreground)] opacity-80 text-left text-lg">Total Fees Earned</span>
          <div className="flex items-center">
            <span className={`font-medium text-lg ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`}>{totalFeesEarned}</span>
          </div>
        </div>
        
        <div 
          className="flex justify-between items-center mb-5 cursor-pointer hover:bg-[var(--background)] p-3 rounded transition-colors"
          onClick={() => setIntentsExpanded(!intentsExpanded)}
        >
          <span className="text-[var(--foreground)] opacity-80 text-left text-lg">Intents filled</span>
          <span>
            {intentsExpanded ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
        </div>
        
        {intentsExpanded && (
          <div className="mb-5 bg-[var(--background)] rounded-lg p-4 overflow-auto">
            <div className="grid grid-cols-3 gap-3 mb-3 font-medium text-[var(--foreground)] opacity-70">
              <div>ID</div>
              <div>Date</div>
              <div>Net Fee Earned</div>
            </div>
            
            {intentsData.map((intent) => (
              <div key={intent.id} className="grid grid-cols-3 gap-3 py-3 border-t border-[var(--border-color)]">
                <div className="truncate">{intent.id}</div>
                <div>{intent.date}</div>
                <div className={`${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`}>{intent.netFee}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button 
        className={`w-full hover:opacity-90 transition-opacity text-white py-4 px-6 rounded-full font-medium text-lg tracking-wide ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-[var(--accent-color)]'}`}
      >
        DEPOSIT
      </button>
    </div>
  );
} 