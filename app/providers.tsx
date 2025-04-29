'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { type Chain } from 'viem';
import { ReactNode, useState } from 'react';

// You need to obtain a projectId from WalletConnect Cloud - https://cloud.walletconnect.com/
const projectId = 'YOUR_PROJECT_ID'; // Replace with your actual project ID

// Define Base Sepolia testnet
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
} as const satisfies Chain;

// Define Arbitrum Sepolia testnet
const arbitrumSepolia = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
} as const satisfies Chain;

// Define Optimism Sepolia testnet
const optimismSepolia = {
  id: 11155420,
  name: 'Optimism Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.optimism.io'],
    },
    public: {
      http: ['https://sepolia.optimism.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Optimism Explorer',
      url: 'https://sepolia-optimism.etherscan.io',
    },
  },
  testnet: true,
} as const satisfies Chain;

const config = getDefaultConfig({
  appName: 'Base Smart Contract Demo',
  projectId,
  chains: [optimismSepolia, baseSepolia, arbitrumSepolia],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org', {
      batch: true,
      retryCount: 5,
      retryDelay: 100,
      timeout: 30_000
    }),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc', {
      batch: true,
      retryCount: 5,
      retryDelay: 100,
      timeout: 30_000
    }),
    [optimismSepolia.id]: http('https://sepolia.optimism.io', {
      batch: true,
      retryCount: 5,
      retryDelay: 100,
      timeout: 30_000
    }),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 