export const VaultABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_weth", "type": "address", "internalType": "contract IERC20"},
      {"name": "_name", "type": "string", "internalType": "string"},
      {"name": "_symbol", "type": "string", "internalType": "string"},
      {"name": "_spokePool", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address", "internalType": "address"},
      {"name": "spender", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "appGateway",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address", "internalType": "address"},
      {"name": "value", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "asset",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "convertToAssets",
    "inputs": [{"name": "shares", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "convertToShares",
    "inputs": [{"name": "assets", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {"name": "assets", "type": "uint256", "internalType": "uint256"},
      {"name": "receiver", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeIntent",
    "inputs": [
      {
        "name": "relayData",
        "type": "tuple",
        "internalType": "struct V3SpokePoolInterface.V3RelayData",
        "components": [
          {"name": "depositor", "type": "bytes32", "internalType": "bytes32"},
          {"name": "recipient", "type": "bytes32", "internalType": "bytes32"},
          {"name": "exclusiveRelayer", "type": "bytes32", "internalType": "bytes32"},
          {"name": "inputToken", "type": "bytes32", "internalType": "bytes32"},
          {"name": "outputToken", "type": "bytes32", "internalType": "bytes32"},
          {"name": "inputAmount", "type": "uint256", "internalType": "uint256"},
          {"name": "outputAmount", "type": "uint256", "internalType": "uint256"},
          {"name": "originChainId", "type": "uint256", "internalType": "uint256"},
          {"name": "depositId", "type": "uint256", "internalType": "uint256"},
          {"name": "fillDeadline", "type": "uint32", "internalType": "uint32"},
          {"name": "exclusivityDeadline", "type": "uint32", "internalType": "uint32"},
          {"name": "message", "type": "bytes", "internalType": "bytes"}
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initSocket",
    "inputs": [
      {"name": "appGateway_", "type": "address", "internalType": "address"},
      {"name": "socket_", "type": "address", "internalType": "address"},
      {"name": "switchboard_", "type": "address", "internalType": "address"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isSocketInitialized",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxDeposit",
    "inputs": [{"name": "", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxMint",
    "inputs": [{"name": "", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxRedeem",
    "inputs": [{"name": "owner", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxWithdraw",
    "inputs": [{"name": "owner", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {"name": "shares", "type": "uint256", "internalType": "uint256"},
      {"name": "receiver", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string", "internalType": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "previewDeposit",
    "inputs": [{"name": "assets", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "previewMint",
    "inputs": [{"name": "shares", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "previewRedeem",
    "inputs": [{"name": "shares", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "previewWithdraw",
    "inputs": [{"name": "assets", "type": "uint256", "internalType": "uint256"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "redeem",
    "inputs": [
      {"name": "shares", "type": "uint256", "internalType": "uint256"},
      {"name": "receiver", "type": "address", "internalType": "address"},
      {"name": "owner", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "socket__",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "contract ISocket"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "spokePool",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "contract V3SpokePoolInterface"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string", "internalType": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "timelock",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalAssets",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "value", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {"name": "from", "type": "address", "internalType": "address"},
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "value", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {"name": "assets", "type": "uint256", "internalType": "uint256"},
      {"name": "receiver", "type": "address", "internalType": "address"},
      {"name": "owner", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "spender", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "value", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ConnectorPlugDisconnected",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Deposit",
    "inputs": [
      {"name": "sender", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "assets", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "shares", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IntentExecuted",
    "inputs": [
      {"name": "outputAmount", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "depositId", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "originChainId", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "to", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "value", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Withdraw",
    "inputs": [
      {"name": "sender", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "receiver", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "assets", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "shares", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
] as const; 