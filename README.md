# Base Smart Contract Demo Frontend

A frontend for interacting with a smart contract deployed on the Base Ethereum L2 network. This project uses Next.js, TypeScript, Viem, and RainbowKit.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A WalletConnect Cloud ProjectID (get one at [WalletConnect Cloud](https://cloud.walletconnect.com))

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd vault_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the ProjectID:
   - Open `app/providers.tsx`
   - Replace `YOUR_PROJECT_ID` with your actual WalletConnect ProjectID

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

Build the project:
```bash
npm run build
```

## Deployment to Vercel

This project can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure your environment variables if needed
4. Deploy!

## Features

- Wallet connection via RainbowKit
- Support for Base network
- TypeScript for type safety
- Viem for blockchain interactions
- Mobile-responsive design with Tailwind CSS

## License

MIT
