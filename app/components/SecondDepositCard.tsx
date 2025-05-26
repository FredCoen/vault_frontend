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

interface IntentEvent {
  id: string;
  date: string;
  netFee: string;
}

export default function SecondDepositCard() {
  console.log('SecondDepositCard component initialized');
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

  // Get conservative vault address
  const conservativeVaultAddress = getContractAddress(CHAIN_IDS.OPTIMISM_SEPOLIA, 'conservativeVault');
  
  // Log chain information for debugging
  useEffect(() => {
    console.log('Connected chain ID:', chainId);
    console.log('Is Optimism Sepolia:', chainId === CHAIN_IDS.OPTIMISM_SEPOLIA);
    console.log('Public client chain:', publicClient?.chain?.id);
  }, [chainId, publicClient]);
  
  // Get user's ETH balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });
  
  // Read total assets (TVL) and fees from the contract using Optimism Sepolia client
  const { data: totalAssetsData, refetch: refetchTotalAssets } = useReadContract({
    address: conservativeVaultAddress,
    abi: VaultABI,
    functionName: 'totalAssets',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA // Force Optimism Sepolia
  });
  
  const { data: totalFeesData, refetch: refetchTotalFees } = useReadContract({
    address: conservativeVaultAddress,
    abi: VaultABI,
    functionName: 'totalGrossFeesEarned',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA
  });
  
  // Watch contract events using Optimism Sepolia
  useWatchContractEvent({
    address: conservativeVaultAddress,
    abi: VaultABI,
    eventName: 'Deposit',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: (logs) => {
      console.log("Deposit event detected on Optimism Sepolia - refreshing vault data:", logs);
      refetchTotalAssets();
    },
  });
  
  useWatchContractEvent({
    address: conservativeVaultAddress,
    abi: VaultABI,
    eventName: 'Withdraw',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: () => {
      console.log("Withdraw event detected on Optimism Sepolia - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  useWatchContractEvent({
    address: conservativeVaultAddress,
    abi: VaultABI,
    eventName: 'IntentExecuted',
    chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
    onLogs: async (logs) => {
      console.log("IntentExecuted event detected on Optimism Sepolia:", logs);
      
      // Immediately refresh TVL and fees
      await Promise.all([refetchTotalAssets(), refetchTotalFees()]);
      
      if (logs.length > 0) {
        // Process and add the new intent event
        const newEvents = logs.map(log => {
          if (log.args) {
            const { outputAmount, inputAmount, depositId } = log.args;
            
            // Calculate fee in ETH
            const outputAmountEth = formatEther(outputAmount as bigint);
            const inputAmountEth = formatEther(inputAmount as bigint);
            const feeCollected = (Number(inputAmountEth) - Number(outputAmountEth)).toFixed(5);
            
            // Format current date
            const currentDate = new Date().toISOString().split('T')[0];
            
            return {
              id: depositId?.toString() || '0',
              date: currentDate,
              netFee: `${feeCollected} ETH`
            };
          }
          return null;
        }).filter((event): event is IntentEvent => event !== null);
        
        setIntentEvents(prev => [...newEvents, ...prev]);
      }
    },
  });
  
  // Format ETH amount and fees for display
  useEffect(() => {
    if (totalAssetsData) {
      const formatted = formatEther(totalAssetsData as bigint);
      setEthAmount(Number(formatted).toFixed(4));
      
      // Mock USD calculation (in real app would use actual exchange rate)
      const mockEthPrice = 3000;
      const usdAmount = Number(formatted) * mockEthPrice;
      setUsdValue(`$${usdAmount.toFixed(2)}`);
    }
    if (totalFeesData) {
      const feesValue = formatEther(totalFeesData as bigint);
      setTotalFeesEarned(`${Number(feesValue).toFixed(5)} ETH`);
    }
  }, [totalAssetsData, totalFeesData]);

  // Consolidated polling for all vault data
  useEffect(() => {
    console.log("Setting up consolidated Conservative Vault data polling on Optimism Sepolia");
    
    const fetchAllVaultData = async () => {
      try {
        console.log("Polling Conservative Vault data update on Optimism Sepolia");
        
        // Fetch TVL and fees
        await refetchTotalAssets();
        await refetchTotalFees();
        
        // Get current block number
        const blockNumber = await optimismSepoliaClient.getBlockNumber();
        const fromBlock = blockNumber > BigInt(1000) ? blockNumber - BigInt(1000) : BigInt(0);
        
        // Fetch recent IntentExecuted events
        const logs = await optimismSepoliaClient.getLogs({
          address: conservativeVaultAddress,
          event: {
            type: 'event',
            name: 'IntentExecuted',
            inputs: [
              { name: 'outputAmount', type: 'uint256', indexed: false },
              { name: 'inputAmount', type: 'uint256', indexed: false },
              { name: 'depositId', type: 'uint256', indexed: false },
              { name: 'originChainId', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock: blockNumber
        });
        
        // Process new events
        if (logs.length > 0) {
          const newEvents = logs.map(log => {
            if (log.args) {
              const { outputAmount, inputAmount, depositId } = log.args;
              
              // Calculate fee in ETH
              const outputAmountEth = formatEther(outputAmount as bigint);
              const inputAmountEth = formatEther(inputAmount as bigint);
              const feeCollected = (Number(inputAmountEth) - Number(outputAmountEth)).toFixed(5);
              
              // Format current date
              const currentDate = new Date().toISOString().split('T')[0];
              
              return {
                id: depositId?.toString() || '0',
                date: currentDate,
                netFee: `${feeCollected} ETH`
              };
            }
            return null;
          }).filter((event): event is IntentEvent => event !== null);
          
          // Update events list (avoiding duplicates)
          setIntentEvents(prevEvents => {
            const uniqueEvents = newEvents.filter(newEvent => 
              !prevEvents.some(prevEvent => prevEvent.id === newEvent.id)
            );
            return [...uniqueEvents, ...prevEvents];
          });
        }
      } catch (error) {
        console.error("Error fetching Conservative Vault data:", error);
      }
    };
    
    // Initial fetch
    fetchAllVaultData();
    
    // Set up polling interval
    const interval = setInterval(fetchAllVaultData, 20000); // 20 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [refetchTotalAssets, refetchTotalFees, conservativeVaultAddress]);

  // Setup for contract writes
  const { writeContractAsync, status, error: writeError } = useWriteContract();
  
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      setError(writeError);
    }
  }, [writeError]);
  
  // Listen for account changes, which should trigger a balance refresh
  useEffect(() => {
    if (address) {
      console.log("Account detected, refreshing balance");
      refetchBalance();
    }
  }, [address, refetchBalance]);

  // Listen for transaction success
  useEffect(() => {
    if (status === 'success') {
      console.log("Transaction success detected - refreshing vault data");
      refetchTotalAssets();
    }
  }, [status, refetchTotalAssets]);
  
  // Reset events when account or chain changes
  useEffect(() => {
    if (address || chainId) {
      console.log("Account/chain changed - resetting vault intents and refreshing data");
      // Clear events
      setIntentEvents([]);
      setTotalFeesEarned('0 ETH');
      
      // Refresh vault data
      refetchTotalAssets();
    }
  }, [address, chainId, refetchTotalAssets]);

  // Setup automatic refresh when chain changes
  useEffect(() => {
    if (chainId) {
      console.log("Chain changed, refreshing balance");
      refetchBalance();
    }
  }, [chainId, refetchBalance]);
  
  const isDarkMode = theme === 'dark';

  // Remove all deposit-related handlers and state
  const handleDeposit = undefined;
  const handleOpenModal = undefined;
  const handleCloseModal = undefined;
  const handleSetMaxAmount = undefined;
  const isModalOpen = undefined;
  const depositAmount = undefined;
  const isDepositing = undefined;
  const setDepositAmount = undefined;
  const setIsDepositing = undefined;
  const setIsModalOpen = undefined;

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
        <h1 className="text-xl font-bold mb-4">Conservative Filler Vault</h1>
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
              This vault strategy captures value by filling intents on the Across protocol. Depositors share in the fees generated. The strategy fills intents after 2 seconds wait and is therefore considered conservative on reorg risk.
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