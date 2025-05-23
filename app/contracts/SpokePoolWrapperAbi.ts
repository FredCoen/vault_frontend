export const SpokePoolWrapperAbi = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_spokePool", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "MAX_EXCLUSIVITY_PERIOD_SECONDS",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint32", "internalType": "uint32"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "appGatewayId",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "bytes32", "internalType": "bytes32"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {"name": "depositor", "type": "bytes32", "internalType": "bytes32"},
      {"name": "recipient", "type": "bytes32", "internalType": "bytes32"},
      {"name": "inputToken", "type": "bytes32", "internalType": "bytes32"},
      {"name": "outputToken", "type": "bytes32", "internalType": "bytes32"},
      {"name": "inputAmount", "type": "uint256", "internalType": "uint256"},
      {"name": "outputAmount", "type": "uint256", "internalType": "uint256"},
      {"name": "destinationChainId", "type": "uint256", "internalType": "uint256"},
      {"name": "exclusiveRelayer", "type": "bytes32", "internalType": "bytes32"},
      {"name": "quoteTimestamp", "type": "uint32", "internalType": "uint32"},
      {"name": "fillDeadline", "type": "uint32", "internalType": "uint32"},
      {"name": "exclusivityParameter", "type": "uint32", "internalType": "uint32"},
      {"name": "message", "type": "bytes", "internalType": "bytes"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "initSocket",
    "inputs": [
      {"name": "appGatewayId_", "type": "bytes32", "internalType": "bytes32"},
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
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "overrides",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "bytes", "internalType": "bytes"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "socket__",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "address", "internalType": "contract ISocket"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "spokePool",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ConnectorPlugDisconnected",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InvalidExclusiveRelayer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInput",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SocketAlreadyInitialized",
    "inputs": []
  }
] as const; 