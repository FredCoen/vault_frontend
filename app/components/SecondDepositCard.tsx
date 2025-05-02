'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../theme-provider';
import Image from 'next/image';
import { useAccount, useWriteContract, useReadContract, useBalance, useWatchContractEvent, usePublicClient } from 'wagmi';
import { VaultABI } from '../contracts/VaultABI';
import { parseEther, formatEther } from 'viem';

const CONSERVATIVE_VAULT = '0xd8c3Ca92C7678394a516E6e13FE0C6E6e008891e';

interface IntentEvent {
  id: string;
  date: string;
  netFee: string;
}

export default function SecondDepositCard() {
  console.log('SecondDepositCard component initialized');
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
    console.log('Is Arbitrum:', chainId === 42161);
    console.log('Public client chain:', publicClient?.chain?.id);
  }, [chainId, publicClient]);
  
  // Get user's ETH balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });
  
  // Read total assets (TVL) from the contract
  const { data: totalAssetsData, refetch: refetchTotalAssets } = useReadContract({
    address: CONSERVATIVE_VAULT,
    abi: VaultABI,
    functionName: 'totalAssets',
  });
  
  // Watch for Deposit events to update TVL
  useWatchContractEvent({
    address: CONSERVATIVE_VAULT,
    abi: VaultABI,
    eventName: 'Deposit',
    onLogs: (logs) => {
      console.log("Deposit event detected - refreshing vault data:", logs);
      refetchTotalAssets();
      // Also refresh intent events since deposits may trigger new intents
      setTimeout(() => {
        fetchRecentEvents();
      }, 2000); // Small delay to ensure events are indexed
    },
  });
  
  // Watch for Withdraw events to update TVL
  useWatchContractEvent({
    address: CONSERVATIVE_VAULT,
    abi: VaultABI,
    eventName: 'Withdraw',
    onLogs: () => {
      console.log("Withdraw event detected - refreshing TVL");
      refetchTotalAssets();
    },
  });
  
  // Watch for IntentFilled events to track fees earned
  useWatchContractEvent({
    address: CONSERVATIVE_VAULT,
    abi: VaultABI,
    eventName: 'IntentExecuted',
    onLogs: (logs) => {
      console.log("IntentExecuted event detected:", logs);
      if (logs.length > 0) {
        // Process and add the new intent event
        const newEvents = logs.map(log => {
          // Format date
          const date = new Date();
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
          
          // Format random ID - in real app this would come from the event data
          const randomId = Math.floor(Math.random() * 1000000).toString();
          
          // Format fee (this is mocked, in real app would use the actual fee from event)
          const netFee = `${(Math.random() * 0.01).toFixed(6)} ETH`;
          
          return {
            id: randomId,
            date: formattedDate,
            netFee: netFee
          };
        });
        
        setIntentEvents(prev => [...newEvents, ...prev]);
        updateTotalFeesEarned([...newEvents, ...intentEvents]);
      }
    },
  });
  
  // Calculate total fees earned from all intent events
  const updateTotalFeesEarned = (events: IntentEvent[]) => {
    let total = 0;
    events.forEach(event => {
      // Parse the ETH amount from the net fee string
      const ethAmount = parseFloat(event.netFee.split(' ')[0]);
      if (!isNaN(ethAmount)) {
        total += ethAmount;
      }
    });
    setTotalFeesEarned(`${total.toFixed(6)} ETH`);
  };
  
  // Format ETH amount for display
  useEffect(() => {
    if (totalAssetsData) {
      const formatted = formatEther(totalAssetsData as bigint);
      setEthAmount(Number(formatted).toFixed(4));
      
      // Mock USD calculation (in real app would use actual exchange rate)
      const mockEthPrice = 3000;
      const usdAmount = Number(formatted) * mockEthPrice;
      setUsdValue(`$${usdAmount.toFixed(2)}`);
    }
  }, [totalAssetsData]);

  // Enhanced polling for vault TVL updates
  useEffect(() => {
    console.log("Setting up Conservative Vault TVL polling every 5 seconds");
    
    // Initial fetch
    refetchTotalAssets();
    
    // Set up more frequent polling interval
    const interval = setInterval(() => {
      console.log("Polling Conservative Vault TVL update");
      refetchTotalAssets();
    }, 5000); // Reduced to 5 seconds for more responsive updates
    
    return () => {
      clearInterval(interval);
    };
  }, [refetchTotalAssets]);

  // Setup for contract writes
  const { writeContractAsync, status, error: writeError } = useWriteContract();
  
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      setError(writeError);
    }
  }, [writeError]);
  
  // Define fetchRecentEvents with improved logging and error handling
  const fetchRecentEvents = async () => {
    try {
      console.log("Checking for new vault intents and fees...");
      
      if (!publicClient) {
        console.log("Public client not available, skipping intent check");
        return;
      }
      
      const blockNumber = await publicClient.getBlockNumber();
      // Look back ~1000 blocks, convert to number if needed
      const fromBlock = blockNumber > BigInt(1000) ? blockNumber - BigInt(1000) : BigInt(0);
      
      console.log(`Checking for vault events from block ${fromBlock} to ${blockNumber}`);
      
      // Manually get logs for the CONSERVATIVE_VAULT
      const logs = await publicClient.getLogs({
        address: CONSERVATIVE_VAULT,
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
      
      console.log(`Found ${logs.length} new vault intent events`);
      
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
      console.error("Error fetching Conservative Vault events:", error);
    }
  };

  // Improved intent events polling with shorter interval
  useEffect(() => {
    if (!publicClient) return;
    
    console.log("Setting up aggressive event polling for Conservative Vault");
    console.log("Current chain ID:", publicClient.chain?.id);
    console.log("Contract address being monitored:", CONSERVATIVE_VAULT);
    
    // Call once immediately
    fetchRecentEvents();
    
    // Set up polling interval with much shorter interval for responsive updates
    const interval = setInterval(fetchRecentEvents, 7500); // Poll every 7.5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [publicClient]);
  
  // Listen for account changes, which should trigger a balance refresh
  useEffect(() => {
    if (address) {
      console.log("Account detected, refreshing balance");
      refetchBalance();
    }
  }, [address, refetchBalance]);

  // Also refresh vault data when deposits or withdrawals happen
  useEffect(() => {
    if (status === 'success') {
      console.log("Transaction success detected - refreshing vault data");
      refetchTotalAssets();
      fetchRecentEvents();
    }
  }, [status, refetchTotalAssets]);
  
  // Initialize intent event list on component mount
  useEffect(() => {
    // Clear any existing events first
    setIntentEvents([]);
    setTotalFeesEarned('0 ETH');
  }, []);

  // Reset events when account or chain changes
  useEffect(() => {
    if (address || chainId) {
      console.log("Account/chain changed - resetting vault intents and refreshing data");
      // Clear events
      setIntentEvents([]);
      setTotalFeesEarned('0 ETH');
      
      // Refresh vault data
      refetchTotalAssets();
      setTimeout(() => {
        fetchRecentEvents();
      }, 1000); // Small delay to ensure chain is fully connected
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
      setError(null);
      
      // Parse the deposit amount to wei
      const parsedAmount = parseEther(depositAmount);
      
      const tx = await writeContractAsync({
        address: CONSERVATIVE_VAULT,
        abi: VaultABI,
        functionName: 'deposit',
        args: [parsedAmount, address]
      });
      
      console.log("Deposit transaction submitted:", tx);
      
      // Close modal and reset form after successful deposit
      handleCloseModal();
      
      // Setup aggressive polling for a short period after deposit
      const refreshInterval = setInterval(() => {
        console.log("Post-deposit refresh of vault data");
        refetchTotalAssets();
        fetchRecentEvents();
        refetchBalance();
      }, 3000);
      
      // Stop aggressive polling after 30 seconds
      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 30000);
      
      // Immediate refresh
      refetchTotalAssets();
      refetchBalance();
    } catch (err) {
      console.error('Deposit failed:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
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
        <h1 className="text-xl font-bold mb-4">Conservative Filler</h1>
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