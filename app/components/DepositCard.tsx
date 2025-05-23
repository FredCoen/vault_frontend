'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../theme-provider';
import Image from 'next/image';
import { useAccount, useWriteContract, useReadContract, useBalance, useWatchContractEvent, usePublicClient } from 'wagmi';
import { VaultABI } from '../contracts/VaultABI';
import { parseEther, formatEther } from 'viem';

// Contract address for the Vault
const AGGRESSIVE_VAULT = '0xf50E3a3aD3344712856Cd16CE8c77f7142a97d3C'; // Contract address on Optimism Sepolia
// Note: This contract is deployed on Optimism Sepolia (11155420) network
// If events are emitted on a different network than the one you're connected to, they won't appear

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
  const [intentsExpanded, setIntentsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [totalFeesEarned, setTotalFeesEarned] = useState('0 ETH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [intentEvents, setIntentEvents] = useState<IntentEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const { theme } = useTheme();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  
  // Log chain information for debugging
  useEffect(() => {
    console.log('Connected chain ID:', chainId);
    console.log('Is Optimism Sepolia:', chainId === 11155420);
    console.log('Public client chain:', publicClient?.chain?.id);
  }, [chainId, publicClient]);
  
  // Get user's ETH balance
  const { data: balanceData } = useBalance({
    address: address,
  });
  
  // Read total assets (TVL) from the contract
  const { data: totalAssetsData, refetch: refetchTotalAssets } = useReadContract({
    address: AGGRESSIVE_VAULT,
    abi: VaultABI,
    functionName: 'totalAssets',
  });
  
  // Watch for Deposit events to update TVL
  useWatchContractEvent({
    address: AGGRESSIVE_VAULT,
    abi: VaultABI,
    eventName: 'Deposit',
    onLogs: () => {
      console.log("Deposit event detected - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  // Watch for Withdraw events to update TVL
  useWatchContractEvent({
    address: AGGRESSIVE_VAULT,
    abi: VaultABI,
    eventName: 'Withdraw',
    onLogs: () => {
      console.log("Withdraw event detected - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  // Function to update total fees earned
  const updateTotalFeesEarned = (events: IntentEvent[]) => {
    // Sum all fees (remove " ETH" suffix and convert to number)
    const totalFees = events.reduce((sum, event) => {
      const feeValue = parseFloat(event.netFee.replace(' ETH', ''));
      return sum + feeValue;
    }, 0);
    
    // Format with 5 decimal places
    setTotalFeesEarned(`${totalFees.toFixed(5)} ETH`);
  };
  
  // Watch for IntentExecuted events to update intent list
  useWatchContractEvent({
    address: AGGRESSIVE_VAULT,
    abi: VaultABI,
    eventName: 'IntentExecuted',
    onLogs: (logs) => {
      console.log('IntentExecuted event received:', logs);
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
            
            // Update total fees whenever we add a new event
            updateTotalFeesEarned(updatedEvents);
            
            return updatedEvents;
          });
        }
      });
    },
  });
  
  // Write contract hook
  const { writeContractAsync, status } = useWriteContract();
  
  // Update ethAmount when totalAssetsData changes
  useEffect(() => {
    if (totalAssetsData) {
      const ethValue = formatEther(totalAssetsData);
      setEthAmount(Number(ethValue).toFixed(4));
    }
  }, [totalAssetsData]);
  
  // Add polling for TVL updates every 10 seconds
  useEffect(() => {
    console.log("Setting up TVL polling every 10 seconds");
    
    // Initial fetch
    refetchTotalAssets();
    
    // Set up polling interval
    const interval = setInterval(() => {
      console.log("Polling TVL update");
      refetchTotalAssets();
    }, 10000); // 10 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [refetchTotalAssets]);
  
  // Manual polling for IntentExecuted events
  useEffect(() => {
    if (!publicClient) return;
    
    console.log("Setting up manual event polling");
    console.log("Current chain ID:", publicClient.chain.id);
    console.log("Contract address being monitored:", AGGRESSIVE_VAULT);
    
    const fetchRecentEvents = async () => {
      try {
        console.log("Manually checking for IntentExecuted events...");
        
        // Get current block number
        const blockNumber = await publicClient.getBlockNumber();
        // Look back ~1000 blocks, convert to number if needed
        const fromBlock = blockNumber > BigInt(1000) ? blockNumber - BigInt(1000) : BigInt(0);
        
        console.log(`Checking for events from block ${fromBlock} to ${blockNumber}`);
        
        // Manually get logs
        const logs = await publicClient.getLogs({
          address: AGGRESSIVE_VAULT,
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
        
        console.log("Manual event check complete, found logs:", logs);
        
        if (logs.length > 0) {
          // Process the logs
          logs.forEach(log => {
            if (log.args) {
              const { outputAmount, inputAmount, depositId, originChainId } = log.args;
              
              // Check for undefined values and provide defaults
              const safeOutputAmount = outputAmount || BigInt(0);
              const safeInputAmount = inputAmount || BigInt(0);
              const safeDepositId = depositId || BigInt(0);
              
              // Calculate fee in ETH (inputAmount - outputAmount)
              const outputAmountEth = formatEther(safeOutputAmount);
              const inputAmountEth = formatEther(safeInputAmount);
              const feeCollected = (Number(inputAmountEth) - Number(outputAmountEth)).toFixed(5);
              
              // Format current date
              const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
              
              // Create new intent event
              const newIntent: IntentEvent = {
                id: safeDepositId.toString(),
                date: currentDate,
                netFee: `${feeCollected} ETH`
              };
              
              // Add to the list (avoiding duplicates by checking id)
              setIntentEvents(prevEvents => {
                const eventExists = prevEvents.some(event => event.id === newIntent.id);
                if (eventExists) return prevEvents;
                
                const updatedEvents = [newIntent, ...prevEvents];
                // Update total fees whenever we add a new event
                updateTotalFeesEarned(updatedEvents);
                return updatedEvents;
              });
            }
          });
        }
      } catch (error) {
        console.error("Error fetching manual events:", error);
      }
    };
    
    // Call once immediately
    fetchRecentEvents();
    
    // Set up polling interval
    const interval = setInterval(fetchRecentEvents, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [publicClient]);
  
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
        address: AGGRESSIVE_VAULT,
        abi: VaultABI,
        functionName: 'deposit',
        args: [parsedAmount, address]
      });
      
      // Close modal and reset form after successful deposit
      handleCloseModal();
      
      // Refresh the TVL after deposit (though the event listener should handle this too)
      refetchTotalAssets();
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