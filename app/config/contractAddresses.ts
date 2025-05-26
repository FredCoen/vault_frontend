interface ChainAddresses {
  spokePoolWrapper?: `0x${string}`;
  aggressiveVault?: `0x${string}`;
  conservativeVault?: `0x${string}`;
  weth?: `0x${string}`;
}

interface ContractAddresses {
  [chainId: number]: ChainAddresses;
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  // Arbitrum Sepolia (421614)
  421614: {
    spokePoolWrapper: '0x05308e8C686464A1C9562b8423f9ba61B6ACF3c5' as `0x${string}`, // Replace with actual address
    weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as `0x${string}`,
  },
  // Optimism Sepolia (11155420)
  11155420: {
    aggressiveVault: '0x5D47478284Bca3658fABCfcC07426a676D424e36' as `0x${string}`, // Replace with actual address
    conservativeVault: '0x59efD591b9B6F277126C4c2323EdBba346141000' as `0x${string}`, // Replace with actual address
    weth: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  },
};

// Chain IDs for easy reference
export const CHAIN_IDS = {
  ARBITRUM_SEPOLIA: 421614,
  OPTIMISM_SEPOLIA: 11155420,
} as const;

// Helper function to get contract address
export function getContractAddress(chainId: number, contractName: keyof ChainAddresses): `0x${string}` {
  const chainAddresses = CONTRACT_ADDRESSES[chainId];
  if (!chainAddresses) {
    throw new Error(`No addresses found for chain ID ${chainId}`);
  }

  const address = chainAddresses[contractName];
  if (!address) {
    throw new Error(`No address found for contract ${contractName} on chain ID ${chainId}`);
  }

  return address;
} 