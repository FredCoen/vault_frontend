'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../theme-provider';
import Image from 'next/image';
import { useAccount, useWriteContract, useReadContract, useBalance } from 'wagmi';
import { VaultABI } from '../contracts/VaultABI';
import { parseEther, formatEther } from 'viem';

// Contract address for the Vault
const BASE_VAULT_CONTRACT_ADDRESS = '0x557BC97cFbf6Dc01218d42F194e56fB6A0eDEb76'; // Replace with actual contract address

export default function DepositCard() {
  const [ethAmount, setEthAmount] = useState('0');
  const [usdValue, setUsdValue] = useState('$0.00');
  const [intentsExpanded, setIntentsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [totalFeesEarned, setTotalFeesEarned] = useState('0.0025 ETH');
  const [apy24h, setApy24h] = useState('160%');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  
  // Get user's ETH balance
  const { data: balanceData } = useBalance({
    address: address,
  });
  
  // Write contract hook
  const { writeContractAsync, status, error } = useWriteContract();

  // Dummy data for intents filled
  const intentsData = [
    { id: '0x1a2b...3c4d', date: '2023-11-25', netFee: '0.00045 ETH' },
    { id: '0x5e6f...7g8h', date: '2023-11-24', netFee: '0.00032 ETH' },
    { id: '0x9i0j...1k2l', date: '2023-11-23', netFee: '0.00078 ETH' },
    { id: '0x3m4n...5o6p', date: '2023-11-22', netFee: '0.00021 ETH' },
  ];
  
  const isDarkMode = theme === 'dark';

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDepositAmount('');
  };

  const handleSetMaxAmount = () => {
    if (balanceData) {
      // Convert to ETH format and set as deposit amount
      // Formatting to 6 decimal places for better UX
      const maxAmount = Number(formatEther(balanceData.value)).toFixed(6);
      setDepositAmount(maxAmount);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !address) return;
    
    try {
      setIsDepositing(true);
      
      // Parse the deposit amount to wei
      const parsedAmount = parseEther(depositAmount);
      
      await writeContractAsync({
        address: BASE_VAULT_CONTRACT_ADDRESS,
        abi: VaultABI,
        functionName: 'deposit',
        args: [parsedAmount, address]
      });
      
      // Close modal and reset form after successful deposit
      handleCloseModal();
    } catch (err) {
      console.error('Deposit failed:', err);
    } finally {
      setIsDepositing(false);
    }
  };
  
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
        onClick={handleOpenModal}
        className={`w-full hover:opacity-90 transition-opacity text-white py-4 px-6 rounded-full font-medium text-lg tracking-wide ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-[var(--accent-color)]'}`}
      >
        DEPOSIT
      </button>

      {/* Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-[var(--card-bg)] rounded-xl p-6 w-full max-w-md border border-[var(--border-color)] shadow-xl`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Deposit</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  step="0.0001"
                />
                <button 
                  className="absolute right-3 top-3 text-sm text-blue-500"
                  onClick={handleSetMaxAmount}
                >
                  MAX
                </button>
              </div>
              {balanceData && (
                <button 
                  onClick={handleSetMaxAmount}
                  className="mt-2 text-sm hover:text-blue-500 transition-colors cursor-pointer text-left text-[var(--foreground)] opacity-80"
                >
                  Balance: {Number(formatEther(balanceData.value)).toFixed(6)} ETH
                </button>
              )}
              {error && <p className="mt-2 text-red-500 text-sm">{error.message}</p>}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 px-4 rounded-full border border-[var(--border-color)] text-[var(--foreground)] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing || !isConnected}
                className={`flex-1 py-3 px-4 rounded-full font-medium text-white ${isDepositing ? 'opacity-70' : 'hover:opacity-90'} ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-[var(--accent-color)]'}`}
              >
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 