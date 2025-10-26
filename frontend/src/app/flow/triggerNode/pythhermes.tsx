'use client';

import { useState, useEffect } from 'react';

interface PythHermesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PriceData {
  price: string;
  conf: string;
  expo: number;
  publishTime: number;
}

export default function PythHermes({ isOpen, onClose }: PythHermesProps) {
  const [ethPrice, setEthPrice] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ETH/USD price feed ID from Pyth Network
  const ETH_USD_PRICE_FEED_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
  const HERMES_API_URL = 'https://hermes.pyth.network';

  // Fetch ETH price from Pyth Hermes API
  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        `${HERMES_API_URL}/v2/updates/price/latest?ids[]=${ETH_USD_PRICE_FEED_ID}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }

      const data = await response.json();
      
      if (data.parsed && data.parsed.length > 0) {
        const priceInfo = data.parsed[0].price;
        setEthPrice({
          price: priceInfo.price,
          conf: priceInfo.conf,
          expo: priceInfo.expo,
          publishTime: priceInfo.publish_time,
        });
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching ETH price:', err);
      setError('Failed to fetch price data');
    } finally {
      setIsLoading(false);
    }
  };

  // Format price with proper decimals
  const formatPrice = (price: string, expo: number): string => {
    const priceNum = parseFloat(price) * Math.pow(10, expo);
    return priceNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format confidence interval
  const formatConfidence = (conf: string, expo: number): string => {
    const confNum = parseFloat(conf) * Math.pow(10, expo);
    return confNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Fetch price on mount and set up polling
  useEffect(() => {
    if (isOpen) {
      fetchEthPrice();
      const interval = setInterval(fetchEthPrice, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{
          width: '600px',
          maxHeight: '80vh',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(75, 0, 130, 0.1))',
            borderBottom: '1px solid rgba(138, 43, 226, 0.3)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Pyth Logo */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8b2be2, #4b0082)',
                boxShadow: '0 4px 20px rgba(138, 43, 226, 0.4)',
              }}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
              </svg>
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{
                  color: 'white',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Pyth Network
              </h2>
              <p
                className="text-sm"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Real-Time ETH/USD Price Feed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-t-purple-500 border-purple-200 rounded-full animate-spin"></div>
              <p className="mt-4 text-white/60">Loading price data...</p>
            </div>
          ) : error ? (
            <div
              className="p-6 rounded-lg text-center"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <svg className="w-12 h-12 mx-auto mb-3" fill="#ef4444" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchEthPrice}
                className="mt-4 px-6 py-2 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                }}
              >
                Try Again
              </button>
            </div>
          ) : ethPrice ? (
            <>
              {/* Main Price Display */}
              <div
                className="p-8 rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.2))',
                  border: '2px solid rgba(138, 43, 226, 0.4)',
                  boxShadow: '0 8px 32px rgba(138, 43, 226, 0.3)',
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span
                    className="text-lg font-semibold"
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    ETH/USD
                  </span>
                  <div
                    className="px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-xs font-semibold text-green-400">LIVE</span>
                    </div>
                  </div>
                </div>
                <div
                  className="text-6xl font-bold mb-2"
                  style={{
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: '0 0 30px rgba(138, 43, 226, 0.5)',
                  }}
                >
                  ${formatPrice(ethPrice.price, ethPrice.expo)}
                </div>
                <div
                  className="text-sm"
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ± ${formatConfidence(ethPrice.conf, ethPrice.expo)} confidence
                </div>
              </div>

              {/* Price Details */}
              <div
                className="p-6 rounded-xl space-y-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  📊 Price Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Raw Price</p>
                    <p className="text-sm font-mono text-white/80">{ethPrice.price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Exponent</p>
                    <p className="text-sm font-mono text-white/80">{ethPrice.expo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Confidence</p>
                    <p className="text-sm font-mono text-white/80">{ethPrice.conf}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Last Update</p>
                    <p className="text-sm font-mono text-white/80">
                      {new Date(ethPrice.publishTime * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5" fill="#3b82f6" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      Real-Time Oracle Data
                    </p>
                    <p className="text-xs text-blue-300/60">
                      Price updates every 3 seconds from Pyth Network&apos;s Hermes API. 
                      This is production-ready oracle data used by DeFi protocols.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-refresh indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                <span>Auto-refreshing every 3 seconds</span>
                <span>•</span>
                <span>Last: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>Powered by</span>
            <span className="font-semibold text-purple-400">Pyth Network</span>
          </div>
          <a
            href="https://pyth.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Learn More →
          </a>
        </div>
      </div>
    </div>
  );
}
