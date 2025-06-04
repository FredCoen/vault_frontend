interface ChainAddresses {
  spokePoolWrapper?: `0x${string}`;
  aggressiveVault?: `0x${string}`;
  conservativeVault?: `0x${string}`;
  weth?: `0x${string}`;
  executor?: `0x${string}`;
}

interface ContractAddresses {
  [chainId: number]: ChainAddresses;
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  // Arbitrum Sepolia (421614)
  421614: {
    spokePoolWrapper: '0x3E54E049e347CBde496E7CFf9d07451d6946C8C8' as `0x${string}`, // Replace with actual address
    weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as `0x${string}`,
  },
  // Optimism Sepolia (11155420)
  11155420: {
    aggressiveVault: '0xe5F38C01e71e0D755eA56A8a2d3491EB64136A27' as `0x${string}`, // Replace with actual address
    conservativeVault: '0xb50FDc176Da964c12925fAF7802F807C0Cf430d3' as `0x${string}`, // Replace with actual address
    weth: '0x4200000000000000000000000000000000000006' as `0x${string}`,
    executor: '0x8E4c0ee82dc4AbA6f98f1f3c61f7F9DD1a496E17' as `0x${string}`, // Replace with actual executor address
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