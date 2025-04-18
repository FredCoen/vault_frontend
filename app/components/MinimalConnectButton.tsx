'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function MinimalConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    className="bg-[var(--accent-color)] hover:opacity-90 transition-all px-4 py-2 rounded-full text-white text-sm font-medium"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-[var(--background)] border border-[var(--border-color)]"
                  >
                    {chain.hasIcon && (
                      <div
                        className="w-4 h-4 overflow-hidden"
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                  </button>

                  <button 
                    onClick={openAccountModal} 
                    className="flex items-center px-3 py-1 rounded-full text-sm bg-[var(--background)] border border-[var(--border-color)]"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
} 