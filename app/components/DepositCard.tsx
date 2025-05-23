'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../theme-provider';
import Image from 'next/image';
import { useAccount, useWriteContract, useReadContract, useBalance, useWatchContractEvent, usePublicClient } from 'wagmi';
import { VaultABI } from '../contracts/VaultABI';
import { parseEther, formatEther, createPublicClient, http, Log } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, CHAIN_IDS, getContractAddress } from "../config/contractAddresses";

// Create a dedicated Optimism Sepolia client
const optimismSepoliaClient = createPublicClient({
  chain: optimismSepolia,
  transport: http('https://sepolia.optimism.io')
});

// Interface for intent events
interface IntentEvent {
  id: string;
  date: string;
  netFee: string;
}

export default function DepositCard() {
  console.log('DepositCard component initialized');
  const [ethAmount, setEthAmount] = useState('0');
  const [usdValue, setUsdValue] = useState('$0.00');
  const [intentsExpanded, setIntentsExpanded] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [totalFeesEarned, setTotalFeesEarned] = useState('0 ETH');
  const [intentEvents, setIntentEvents] = useState<IntentEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const { theme } = useTheme();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();

  // Get aggressive vault address
  const aggressiveVaultAddress = getContractAddress(CHAIN_IDS.OPTIMISM_SEPOLIA, 'aggressiveVault');
  
  // Log chain information for debugging
  useEffect(() => {
    console.log('Connected chain ID:', chainId);
    console.log('Is Optimism Sepolia:', chainId === CHAIN_IDS.OPTIMISM_SEPOLIA);
    console.log('Public client chain:', publicClient?.chain?.id);
  }, [chainId, publicClient]);
  
  // Get user's ETH balance
  const { data: balanceData } = useBalance({
    address: address,
  });
  
  // Read total assets (TVL) and fees from the contract using Optimism Sepolia client
  const { data: totalAssetsData, refetch: refetchTotalAssets } = useReadContract({
    address: aggressiveVaultAddress,
    abi: VaultABI,
    functionName: 'totalAssets',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA // Force Optimism Sepolia
  });
  
  const { data: totalFeesData, refetch: refetchTotalFees } = useReadContract({
    address: aggressiveVaultAddress,
    abi: VaultABI,
    functionName: 'totalGrossFeesEarned',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA
  });
  
  // Watch contract events using Optimism Sepolia
  useWatchContractEvent({
    address: aggressiveVaultAddress,
    abi: VaultABI,
    eventName: 'Deposit',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: () => {
      console.log("Deposit event detected on Optimism Sepolia - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  useWatchContractEvent({
    address: aggressiveVaultAddress,
    abi: VaultABI,
    eventName: 'Withdraw',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: () => {
      console.log("Withdraw event detected on Optimism Sepolia - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  useWatchContractEvent({
    address: aggressiveVaultAddress,
    abi: VaultABI,
    eventName: 'IntentExecuted',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: (logs) => {
      console.log('IntentExecuted event received from Optimism Sepolia:', logs);
      logs.forEach((log) => {
        console.log('Processing log:', log);
        if (log.args) {
          const { outputAmount, inputAmount, depositId, originChainId } = log.args;
          console.log('Event args:', { outputAmount, inputAmount, depositId, originChainId });
          
          // Calculate fee in ETH (inputAmount - outputAmount)
          const outputAmountEth = formatEther(outputAmount as bigint);
          const inputAmountEth = formatEther(inputAmount as bigint);
          const feeCollected = (Number(inputAmountEth) - Number(outputAmountEth)).toFixed(5);
          console.log('Calculated values:', { outputAmountEth, inputAmountEth, feeCollected });
          
          // Format current date
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Create new intent event
          const newIntent: IntentEvent = {
            id: depositId?.toString() || '0',
            date: currentDate,
            netFee: `${feeCollected} ETH`
          };
          console.log('Adding new intent to UI:', newIntent);
          
          // Add to the list (prepend to show newest first)
          setIntentEvents(prevEvents => {
            const updatedEvents = [newIntent, ...prevEvents];
            console.log('Updated events list:', updatedEvents);
            
            return updatedEvents;
          });
        }
      });
    },
  });
  
  // Write contract hook
  const { writeContractAsync, status } = useWriteContract();
  
  // Update ethAmount and totalFees when data changes
  useEffect(() => {
    if (totalAssetsData) {
      const ethValue = formatEther(totalAssetsData);
      setEthAmount(Number(ethValue).toFixed(4));
    }
    if (totalFeesData) {
      const feesValue = formatEther(totalFeesData as bigint);
      setTotalFeesEarned(`${Number(feesValue).toFixed(5)} ETH`);
    }
  }, [totalAssetsData, totalFeesData]);
  
  // Add polling for TVL and fees updates
  useEffect(() => {
    console.log("Setting up Aggressive Vault TVL and fees polling on Optimism Sepolia");
    
    // Initial fetch
    refetchTotalAssets();
    refetchTotalFees();
    
    // Set up polling interval
    const interval = setInterval(() => {
      console.log("Polling Aggressive Vault TVL and fees update on Optimism Sepolia");
      refetchTotalAssets();
      refetchTotalFees();
    }, 20000); // 20 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [refetchTotalAssets, refetchTotalFees]);
  
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
        <h1 className="text-xl font-bold mb-4">Aggressive Filler</h1>
        <div className="text-sm mb-1 text-gray-400">TVL</div>
        <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{ethAmount} ETH</h2>
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
              This vault strategy captures value by filling intents on the Across protocol. Depositors share in the fees generated. The strategy fills intents after 2 seconds wait and is therefore considered agressive on reorg risk.
            </p>
          </div>
        )}
        
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
              <div>Fee Collected</div>
            </div>
            
            {intentEvents.length > 0 ? (
              intentEvents.map((intent, index) => (
                <div key={`${intent.id}-${index}`} className="grid grid-cols-3 gap-3 py-3 border-t border-[var(--border-color)]">
                  <div className="truncate">{intent.id}</div>
                  <div>{intent.date}</div>
                  <div className={`${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`}>{intent.netFee}</div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[var(--foreground)] opacity-70">
                No intents filled yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 