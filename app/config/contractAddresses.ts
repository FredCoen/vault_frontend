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
    spokePoolWrapper: '0xcC85EF8D237D357ff2760CA7e637709f981348F1' as `0x${string}`, // Replace with actual address
    weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as `0x${string}`,
  },
  // Optimism Sepolia (11155420)
  11155420: {
    aggressiveVault: '0x39a48DF6e2C06E946bf32A2771169F93F7fA3d43' as `0x${string}`, // Replace with actual address
    conservativeVault: '0x4E09860bBB0F65Cd8E40d6E2d57Ec63097dd0e91' as `0x${string}`, // Replace with actual address
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