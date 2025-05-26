"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useBalance, useWriteContract, usePublicClient } from "wagmi";
import { arbitrumSepolia, optimismSepolia } from 'viem/chains';
import MinimalConnectButton from "./MinimalConnectButton";
import { EthIcon, ChevronDownIcon } from "./Icons";
import { SpokePoolWrapperAbi } from "../contracts/SpokePoolWrapperAbi";
import { parseEther } from "viem";
import { CHAIN_IDS, getContractAddress } from "../config/contractAddresses";
import Image from 'next/image';

const ARBITRUM_SEPOLIA = {
  id: CHAIN_IDS.ARBITRUM_SEPOLIA,
  name: arbitrumSepolia.name,
  hasIcon: true,
  iconUrl: "https://arbitrum.foundation/favicon.ico"
} as const;

const OPTIMISM_SEPOLIA = {
  id: CHAIN_IDS.OPTIMISM_SEPOLIA,
  name: optimismSepolia.name,
  hasIcon: true,
  iconUrl: "https://optimism.io/favicon.ico"
} as const;

const MIN_BRIDGE_AMOUNT = 0.02;

// Error messages
const ERROR_MESSAGES = {
  userRejected: "Transaction was cancelled",
  insufficientFunds: "Insufficient funds for gas + value",
  default: "Failed to bridge. Please try again"
} as const;

export default function BridgeCard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState("");
  const [sourceChain, setSourceChain] = useState<typeof CHAIN_IDS.ARBITRUM_SEPOLIA>(CHAIN_IDS.ARBITRUM_SEPOLIA);
  const [destChain, setDestChain] = useState<typeof CHAIN_IDS.OPTIMISM_SEPOLIA>(CHAIN_IDS.OPTIMISM_SEPOLIA);
  const [sourceAsset, setSourceAsset] = useState("ETH");
  const [destAsset, setDestAsset] = useState("ETH");
  const [isBridging, setIsBridging] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { data: balance } = useBalance({
    address,
    chainId: ARBITRUM_SEPOLIA.id,
  });

  const isOnArbitrumSepolia = chainId === ARBITRUM_SEPOLIA.id;

  const isAmountValid = amount && Number(amount) >= MIN_BRIDGE_AMOUNT;

  const handleSwitchNetwork = async () => {
    try {
      setError(null);
      await switchChain({ chainId: ARBITRUM_SEPOLIA.id });
    } catch (error) {
      console.error("Failed to switch network:", error);
      // Handle user rejection of network switch
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          setError(new Error("Network switch was cancelled"));
        } else {
          setError(new Error("Failed to switch network. Please try again"));
        }
      }
    }
  };

  const handleSetMax = () => {
    if (balance) {
      // Leave some ETH for gas
      const maxAmount = Number(balance.formatted) > 0.01 
        ? (Number(balance.formatted) - 0.01).toFixed(6) 
        : "0";
      setAmount(maxAmount);
    }
  };

  const handleBridge = async () => {
    if (!amount || !address || !isAmountValid || !publicClient) return;
    
    try {
      setIsBridging(true);
      setError(null);

      // Helper function to convert address to bytes32
      const addressToBytes32 = (addr: string): `0x${string}` => {
        return `0x000000000000000000000000${addr.slice(2)}` as `0x${string}`;
      };

      // Helper function to convert token address to bytes32 - fixed to match address format
      const tokenToBytes32 = (addr: string): `0x${string}` => {
        return `0x000000000000000000000000${addr.slice(2)}` as `0x${string}`;
      };
      
      // Get timestamp from one block in the past
      const block = await publicClient.getBlock();
      const previousBlock = await publicClient.getBlock({ blockNumber: block.number - BigInt(5) });
      const quoteTimestamp = Number(previousBlock.timestamp);
      const fillDeadline = quoteTimestamp + (15 * 60); // 15 minutes in seconds
      
      // Parse the amount to wei
      const parsedAmount = parseEther(amount);
      const outputAmount = parsedAmount - parseEther('0.01'); // inputAmount - 0.01 ETH

      // Choose the exclusive relayer based on amount
      const THRESHOLD = parseEther('0.05'); // 0.05 ETH threshold
      const exclusiveRelayerAddress = parsedAmount >= THRESHOLD
        ? getContractAddress(CHAIN_IDS.OPTIMISM_SEPOLIA, 'conservativeVault') // Use conservative for larger amounts
        : getContractAddress(CHAIN_IDS.OPTIMISM_SEPOLIA, 'aggressiveVault'); // Use aggressive for smaller amounts

      console.log(`Using ${parsedAmount >= THRESHOLD ? 'conservative' : 'aggressive'} filler vault as exclusive relayer for amount ${amount} ETH`);

      // Get token addresses
      const inputTokenAddress = getContractAddress(CHAIN_IDS.ARBITRUM_SEPOLIA, 'weth');
      const outputTokenAddress = getContractAddress(CHAIN_IDS.OPTIMISM_SEPOLIA, 'weth');

      console.log('Deposit parameters:', {
        depositor: addressToBytes32(address),
        recipient: addressToBytes32(address),
        inputToken: tokenToBytes32(inputTokenAddress),
        outputToken: tokenToBytes32(outputTokenAddress),
        inputAmount: parsedAmount.toString(),
        outputAmount: outputAmount.toString(),
        destinationChainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
        exclusiveRelayer: addressToBytes32(exclusiveRelayerAddress),
        quoteTimestamp,
        fillDeadline,
      });

      await writeContractAsync({
        address: getContractAddress(CHAIN_IDS.ARBITRUM_SEPOLIA, 'spokePoolWrapper'),
        abi: SpokePoolWrapperAbi,
        functionName: 'deposit',
        args: [
          addressToBytes32(address), // depositor (connected wallet)
          addressToBytes32(address), // recipient (connected wallet)
          tokenToBytes32(inputTokenAddress), // inputToken
          tokenToBytes32(outputTokenAddress), // outputToken
          parsedAmount, // inputAmount
          outputAmount, // outputAmount (inputAmount - 0.01 ETH)
          BigInt(CHAIN_IDS.OPTIMISM_SEPOLIA), // destinationChainId (Optimism Sepolia)
          addressToBytes32(exclusiveRelayerAddress), // exclusiveRelayer (aggressive or conservative vault based on amount)
          Number(quoteTimestamp), // quoteTimestamp (current block timestamp) as uint32
          Number(fillDeadline), // fillDeadline (quoteTimestamp + 15 minutes) as uint32
          Number(fillDeadline), // exclusivityParameter (same as fillDeadline) as uint32
          '0x' as `0x${string}` // message (empty)
        ],
        value: parsedAmount // Send ETH with the transaction
      });

      // Reset amount after successful bridge
      setAmount('');
    } catch (err) {
      console.error('Bridge failed:', err);
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('user rejected') || 
            err.message.toLowerCase().includes('user denied') ||
            err.message.toLowerCase().includes('cancelled')) {
          setError(new Error(ERROR_MESSAGES.userRejected));
        } else if (err.message.toLowerCase().includes('insufficient funds')) {
          setError(new Error(ERROR_MESSAGES.insufficientFunds));
        } else {
          setError(new Error(ERROR_MESSAGES.default));
        }
      } else {
        setError(new Error(ERROR_MESSAGES.default));
      }
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg p-6 dark-card">
      <h2 className="text-xl font-bold mb-2 text-[var(--foreground)]">Test it by firing an intent</h2>
      <p className="text-sm text-gray-400 mb-4">Bridge ETH from Arbitrum Sepolia to Optimism Sepolia</p>
      <div className="flex flex-col gap-4">
        {/* Source Chain Dropdown */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Source Chain</label>
          <div className="relative">
            <select 
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg pl-10 pr-10 py-2 text-[var(--foreground)] appearance-none"
              value={sourceChain}
              onChange={(e) => setSourceChain(Number(e.target.value) as typeof CHAIN_IDS.ARBITRUM_SEPOLIA)}
            >
              <option value={ARBITRUM_SEPOLIA.id}>{ARBITRUM_SEPOLIA.name}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="w-5 h-5 overflow-hidden rounded-full">
                <Image
                  alt={ARBITRUM_SEPOLIA.name}
                  src={ARBITRUM_SEPOLIA.iconUrl}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDownIcon />
            </div>
          </div>
        </div>
        {/* Asset Dropdown (fixed to ETH) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Asset to Bridge</label>
          <div className="relative">
            <select 
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg pl-10 pr-10 py-2 text-[var(--foreground)] appearance-none"
              value={sourceAsset}
              onChange={(e) => setSourceAsset(e.target.value)}
            >
              <option value="ETH">ETH</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <EthIcon />
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDownIcon />
            </div>
          </div>
        </div>
        {/* Destination Chain Dropdown */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Destination Chain</label>
          <div className="relative">
            <select 
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg pl-10 pr-10 py-2 text-[var(--foreground)] appearance-none"
              value={destChain}
              onChange={(e) => setDestChain(Number(e.target.value) as typeof CHAIN_IDS.OPTIMISM_SEPOLIA)}
            >
              <option value={OPTIMISM_SEPOLIA.id}>{OPTIMISM_SEPOLIA.name}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="w-5 h-5 overflow-hidden rounded-full">
                <Image
                  alt={OPTIMISM_SEPOLIA.name}
                  src={OPTIMISM_SEPOLIA.iconUrl}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDownIcon />
            </div>
          </div>
        </div>
        {/* Asset Dropdown (fixed to ETH) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Asset to Receive</label>
          <div className="relative">
            <select 
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg pl-10 pr-10 py-2 text-[var(--foreground)] appearance-none"
              value={destAsset}
              onChange={(e) => setDestAsset(e.target.value)}
            >
              <option value="ETH">ETH</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <EthIcon />
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDownIcon />
            </div>
          </div>
        </div>
        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs text-gray-400">Amount</label>
            <div className="text-xs text-gray-400">
              Balance: {balance ? `${Number(balance.formatted).toFixed(6)} ETH` : '0 ETH'}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="Enter amount of ETH"
              value={amount}
              onChange={e => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              className={`w-full bg-[var(--background)] border ${
                amount && !isAmountValid 
                  ? 'border-red-500' 
                  : 'border-[var(--border-color)]'
              } rounded-lg px-3 pr-16 py-2 text-[var(--foreground)]`}
            />
            <button
              onClick={handleSetMax}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs bg-[var(--accent-color)] text-white rounded hover:opacity-90"
            >
              Max
            </button>
          </div>
          <div className="text-xs mt-1 text-gray-400">
            Minimum amount: {MIN_BRIDGE_AMOUNT} ETH
          </div>
          {amount && !isAmountValid && (
            <div className="text-red-500 text-xs mt-1">
              Amount must be at least {MIN_BRIDGE_AMOUNT} ETH
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-2 p-2 rounded bg-red-50 dark:bg-red-900/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error.message}</span>
          </div>
        )}
        {/* Bridge Button */}
        <div className="flex flex-col gap-2 mt-2">
          {!isConnected ? (
            <MinimalConnectButton />
          ) : !isOnArbitrumSepolia ? (
            <button
              className="bg-[var(--accent-color)] hover:opacity-90 transition-all px-4 py-2 rounded-lg text-white text-base font-semibold"
              onClick={handleSwitchNetwork}
            >
              Switch to Arbitrum Sepolia
            </button>
          ) : (
            <button
              className="bg-[var(--accent-color)] hover:opacity-90 transition-all px-4 py-2 rounded-lg text-white text-base font-semibold"
              disabled={!amount || !isAmountValid || isBridging}
              onClick={handleBridge}
            >
              {isBridging ? 'Bridging...' : 'Bridge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 