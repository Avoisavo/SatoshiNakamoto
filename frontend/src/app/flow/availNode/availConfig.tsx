'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { initializeNexusClient, isNexusClientInitialized } from '@/lib/avail/nexusClient';
import { executeBridge } from '@/lib/avail/bridgeExecutor';

interface NodeData {
  sourceNetwork?: string;
  destinationNetwork?: string;
  amount?: string;
  recipientAddress?: string;
  parentNode?: {
    type: string;
    data: {
      [key: string]: unknown;
    };
    name: string;
  };
  [key: string]: unknown;
}

interface AvailConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData?: NodeData;
  onSave?: (data: NodeData) => void;
}

export default function AvailConfigPanel({ 
  isOpen, 
  onClose, 
  nodeData,
  onSave 
}: AvailConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'settings' | 'bridge'>('parameters');
  
  // Bridge configuration state
  const [sourceNetwork, setSourceNetwork] = useState(nodeData?.sourceNetwork || 'ethereum-sepolia');
  const [destinationNetwork, setDestinationNetwork] = useState(nodeData?.destinationNetwork || 'base-sepolia');
  const [bridgeAmount, setBridgeAmount] = useState(nodeData?.amount || '0.1');
  const [recipientAddress, setRecipientAddress] = useState(nodeData?.recipientAddress || '');
  const [tokenType, setTokenType] = useState('usdc');
  
  // Balance state
  const [ethBalance, setEthBalance] = useState('0');
  const [availBalance, setAvailBalance] = useState('0');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
  
  // Wallet connection
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Fetch balances when panel opens and wallet is connected
  useEffect(() => {
    if (isOpen && isConnected && walletClient) {
      fetchBalances();
    }
  }, [isOpen, isConnected, walletClient]);

  const fetchBalances = async () => {
    if (!walletClient) return;

    try {
      const provider = new BrowserProvider(walletClient);
      const balance = await provider.getBalance(address!);
      setEthBalance(parseFloat(balance.toString()) / 1e18 + '');
      
      // TODO: Fetch Avail balance from Avail network
      setAvailBalance('0');
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleExecuteBridge = async () => {
    if (!walletClient || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!recipientAddress) {
      alert('Please enter a recipient address');
      return;
    }

    setIsBridging(true);
    setBridgeStatus('Initializing Nexus SDK...');

    try {
      // Get the wallet provider from the connected wallet client (from header)
      // This ensures we use the same wallet that's connected (MetaMask, Coinbase, etc.)
      
      // Step 1: Initialize Avail Nexus SDK if not already initialized
      if (!isNexusClientInitialized()) {
        setBridgeStatus('Please approve signature in your wallet...');
        console.log('🔧 Initializing Avail Nexus SDK (@avail-project/nexus-core)...');
        console.log('⚠️ You will need to approve a signature in your connected wallet (one-time setup)');
        console.log('ℹ️ This creates your Chain Abstraction account for crosschain intents');
        console.log('ℹ️ Using wallet:', walletClient.account.address);
        
        // Check current network
        if (typeof window !== 'undefined' && window.ethereum) {
          const ethereum = window.ethereum as {
            request: (args: { method: string }) => Promise<string>;
            providers?: Array<{
              selectedAddress?: string;
            }>;
            selectedAddress?: string;
          };
          
          try {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            const chainIdDecimal = parseInt(chainId, 16);
            console.log('🌐 Current network chain ID:', chainIdDecimal);
            
            // Check if on Ethereum Sepolia (11155111)
            if (chainIdDecimal !== 11155111) {
              throw new Error(
                `❌ Wrong network detected!\n\n` +
                `You are on chain ID: ${chainIdDecimal}\n` +
                `Avail Nexus requires: Ethereum Sepolia (11155111)\n\n` +
                `Please switch to Ethereum Sepolia in your wallet and try again.`
              );
            }
            
            console.log('✅ Correct network: Ethereum Sepolia');
          } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('Wrong network')) {
              throw error;
            }
            console.warn('⚠️ Could not verify network, proceeding anyway...');
          }
          
          // If there are multiple wallets, try to select the right one
          if (ethereum.providers?.length) {
            console.log('🔍 Multiple wallets detected, using connected wallet...');
            // Use the wallet that matches the connected address
            const matchingProvider = ethereum.providers.find((p) => 
              p.selectedAddress?.toLowerCase() === address?.toLowerCase()
            );
            
            console.log('📡 Initializing Nexus SDK with selected provider...');
            console.log('⏳ This may take 10-20 seconds...');
            await initializeNexusClient(matchingProvider || ethereum);
          } else {
            console.log('📡 Initializing Nexus SDK...');
            console.log('⏳ This may take 10-20 seconds...');
            await initializeNexusClient(ethereum);
          }
          
          console.log('✅ Avail Nexus SDK initialized successfully!');
        } else {
          throw new Error('Wallet not found. Please connect your wallet via the header.');
        }
      } else {
        console.log('✅ Avail Nexus SDK already initialized');
      }

      // Step 2: Execute bridge using Avail Nexus SDK
      setBridgeStatus('Executing Avail Nexus bridge...');
      console.log('🌉 Starting Avail Nexus bridge from ETH Sepolia → Base Sepolia:');
      console.log('  📍 Source:', sourceNetwork, '(auto-detected from your MetaMask)');
      console.log('  📍 Destination:', destinationNetwork);
      console.log('  💰 Token:', tokenType.toUpperCase());
      console.log('  💵 Amount:', bridgeAmount);
      console.log('  📮 Recipient:', recipientAddress);

      // Map UI network IDs to Nexus SDK format
      const networkMap: Record<string, string> = {
        'base-sepolia': 'base',
        'ethereum-sepolia': 'sepolia',
        'polygon-mumbai': 'polygon',
        'arbitrum-sepolia': 'arbitrum',
        'optimism-sepolia': 'optimism',
      };

      const targetChain = networkMap[destinationNetwork] || destinationNetwork;

      // Execute bridge via Avail Nexus SDK
      // This uses nexusClient.bridge() under the hood
      const result = await executeBridge({
        sourceChain: 'sepolia', // Auto-detected by SDK from MetaMask
        targetChain: targetChain,
        token: tokenType.toUpperCase(),
        amount: bridgeAmount,
      });

      if (result.success) {
        setBridgeStatus('✅ Bridge successful!');
        console.log('✅ Bridge result:', result);
        
        alert(
          `✅ Bridge Successful!\n\n` +
          `From: ${sourceNetwork}\n` +
          `To: ${destinationNetwork}\n` +
          `Amount: ${bridgeAmount} ${tokenType.toUpperCase()}\n` +
          `Recipient: ${recipientAddress}\n\n` +
          `${result.message}\n\n` +
          `Note: Crosschain bridges take 10-15 minutes to complete.`
        );
        
        // Refresh balances
        setTimeout(() => fetchBalances(), 2000);
      } else {
        throw new Error(result.error || 'Bridge failed');
      }
    } catch (error: unknown) {
      console.error('❌ Bridge error:', error);
      setBridgeStatus('❌ Bridge failed');
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (errorMessage.includes('User rejected')) {
        errorMessage = 'You rejected the signature. Please try again and approve the wallet prompt.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction. Please check your balance.';
      } else if (errorMessage.includes('404') || errorMessage.includes('fee grant')) {
        errorMessage = 
          '⚠️ Avail Nexus Testnet Backend Issue\n\n' +
          'The Nexus testnet is experiencing issues (404 error when requesting fee grant).\n\n' +
          'This could mean:\n' +
          '1. The testnet is temporarily down\n' +
          '2. You\'re on the wrong network (must be Ethereum Sepolia)\n' +
          '3. The fee grant service is unavailable\n\n' +
          'Solutions:\n' +
          '✅ Verify you\'re on Ethereum Sepolia (Chain ID: 11155111)\n' +
          '✅ Try again in a few minutes\n' +
          '✅ Check Avail Discord for testnet status\n\n' +
          'Note: This is a backend infrastructure issue, not your code!';
      } else if (errorMessage.includes('Wrong network')) {
        // Already has good error message
      }
      
      alert(`❌ Bridge Failed\n\n${errorMessage}\n\nCheck the console for more details.`);
    } finally {
      setIsBridging(false);
      setTimeout(() => setBridgeStatus(null), 5000);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...nodeData,
        sourceNetwork,
        destinationNetwork,
        amount: bridgeAmount,
        recipientAddress,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const networks = [
    // Source networks (Nexus SDK auto-detects from wallet)
    { id: 'ethereum-sepolia', name: 'Ethereum Sepolia (Source)', logo: '/eth-logo.png', isSource: true },
    
    // Destination networks (supported by Nexus testnet)
    { id: 'base-sepolia', name: 'Base Sepolia', logo: '/baselogo.png', isSource: false },
    { id: 'polygon-mumbai', name: 'Polygon Amoy', logo: '/polygon-logo.png', isSource: false },
    { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', logo: '/arbitrum-logo.png', isSource: false },
    { id: 'optimism-sepolia', name: 'Optimism Sepolia', logo: '/optimism-logo.png', isSource: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative flex"
        style={{
          width: '95%',
          maxWidth: '1600px',
          height: '90vh',
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel - INPUT */}
        <div
          className="flex flex-col"
          style={{
            width: '280px',
            background: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
            }}
          >
            <h2
              className="text-lg font-bold"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              INPUT
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {nodeData?.parentNode ? (
              <div
                className="p-4 rounded-lg border border-gray-300 bg-white"
                style={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #00C896, #00B884)',
                    }}
                  >
                    <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: '#6b7280' }}>
                      INPUT FROM
                    </p>
                    <p className="text-sm font-bold" style={{ color: '#1f2937' }}>
                      {nodeData.parentNode.name}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-1">Previous Node Data</p>
                  <p className="text-xs text-green-800">
                    Data from the previous node will be available here for bridge configuration.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-lg border border-gray-300 bg-white"
                style={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">No Input Connected</p>
                  <p className="text-xs text-blue-800">
                    Connect a previous node to receive input data for the bridge operation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - CONFIGURATION */}
        <div
          className="flex-1 flex flex-col"
          style={{
            background: 'white',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00C896, #00B884)',
                }}
              >
                <img 
                  src="/availlogo.png" 
                  alt="Avail Logo"
                  className="w-6 h-6"
                />
              </div>
              <h2
                className="text-xl font-bold"
                style={{
                  color: '#1f2937',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Avail Bridge
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #00C896, #00B884)',
                  color: 'white',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Save Configuration
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex px-6"
            style={{
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <button
              className="px-4 py-3 font-semibold transition-colors"
              style={{
                color: activeTab === 'parameters' ? '#00C896' : '#6b7280',
                borderBottom: activeTab === 'parameters' ? '2px solid #00C896' : '2px solid transparent',
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={() => setActiveTab('parameters')}
            >
              Parameters
            </button>
            <button
              className="px-4 py-3 font-semibold transition-colors"
              style={{
                color: activeTab === 'settings' ? '#00C896' : '#6b7280',
                borderBottom: activeTab === 'settings' ? '2px solid #00C896' : '2px solid transparent',
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button
              className="px-4 py-3 font-semibold transition-colors"
              style={{
                color: activeTab === 'bridge' ? '#00C896' : '#6b7280',
                borderBottom: activeTab === 'bridge' ? '2px solid #00C896' : '2px solid transparent',
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={() => setActiveTab('bridge')}
            >
              🌉 Execute Bridge
            </button>
            <a
              href="https://docs.availproject.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-3 font-semibold flex items-center gap-1"
              style={{
                color: '#6b7280',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
              }}
            >
              Avail Docs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'parameters' && (
              <div className="max-w-3xl space-y-6">
                {/* Info Banner */}
                <div
                  className="p-4 rounded-lg flex items-start gap-3"
                  style={{
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                  }}
                >
                  <svg className="w-5 h-5 mt-0.5" fill="#059669" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#065f46' }}>
                      <strong>Avail Nexus SDK Integration</strong>
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#065f46' }}>
                      Bridge tokens between Ethereum Sepolia and L2 networks (Base, Polygon, Arbitrum, Optimism) using intent-based crosschain operations. The SDK auto-detects your wallet&apos;s network.
                    </p>
                  </div>
                </div>

                {/* Source Network */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Source Network <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceNetwork}
                    onChange={(e) => setSourceNetwork(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                    }}
                  >
                    {networks.filter(n => n.isSource).map(network => (
                      <option key={network.id} value={network.id}>
                        {network.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The blockchain network you&apos;re bridging from (auto-detected by SDK)
                  </p>
                </div>

                {/* Destination Network */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Destination Network <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={destinationNetwork}
                    onChange={(e) => setDestinationNetwork(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                    }}
                  >
                    {networks.filter(n => !n.isSource).map(network => (
                      <option key={network.id} value={network.id}>
                        {network.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The Layer 2 network you&apos;re bridging to (via Avail Nexus)
                  </p>
                </div>

                {/* Token Type */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Token Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tokenType}
                    onChange={(e) => setTokenType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                    }}
                  >
                    <option value="eth">ETH</option>
                    <option value="usdc">USDC</option>
                    <option value="usdt">USDT</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The token you want to bridge
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                    }}
                    placeholder="0.001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount to bridge in {tokenType.toUpperCase()}
                  </p>
                </div>

                {/* Recipient Address */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Recipient Address <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none"
                      style={{
                        fontFamily: "'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                      }}
                      placeholder="0x..."
                    />
                    <button
                      onClick={() => address && setRecipientAddress(address)}
                      className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #00C896, #00B884)',
                        color: 'white',
                      }}
                      disabled={!address}
                    >
                      Use My Address
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The address on <strong>{networks.find(n => n.id === destinationNetwork)?.name}</strong> that will receive the tokens (same address across chains)
                  </p>
                </div>

                {/* Bridge Route Visualization */}
                <div
                  className="p-6 rounded-lg"
                  style={{
                    background: '#f0fdf4',
                    border: '2px solid #86efac',
                  }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#166534' }}>
                    🔄 Bridge Route
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-green-300 flex items-center justify-center">
                        <img src="/baselogo.png" alt="Source" className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {networks.find(n => n.id === sourceNetwork)?.name}
                        </p>
                        <p className="text-xs text-gray-600">Source</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 mx-4 flex items-center">
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-green-600"></div>
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 text-right">
                          {networks.find(n => n.id === destinationNetwork)?.name}
                        </p>
                        <p className="text-xs text-gray-600 text-right">Destination</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-green-300 flex items-center justify-center">
                        <img src="/availlogo.png" alt="Destination" className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-green-800">
                      <strong>Amount:</strong> {bridgeAmount} {tokenType.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-3xl space-y-6">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#374151' }}>
                    ⚙️ Advanced Settings
                  </h3>
                  
                  {/* Gas Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300">
                      <div>
                        <label className="block text-sm font-semibold" style={{ color: '#374151' }}>
                          Auto Gas Estimation
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Automatically estimate gas fees for the transaction
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300">
                      <div>
                        <label className="block text-sm font-semibold" style={{ color: '#374151' }}>
                          Transaction Notifications
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Get notified about transaction status updates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bridge' && (
              <div className="max-w-3xl space-y-6">
                {/* Avail Nexus Info Banner */}
                <div
                  className="p-4 rounded-lg flex items-start gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                    border: '2px solid #6ee7b7',
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <img src="/availlogo.png" alt="Avail" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: '#065f46' }}>
                      🚀 Powered by Avail Nexus SDK
                    </p>
                    <p className="text-xs" style={{ color: '#047857' }}>
                      This bridge uses <strong>@avail-project/nexus-core</strong> for intent-based crosschain operations. 
                      Connect your wallet (via header) on <strong>Ethereum Sepolia</strong>, and tokens will be bridged to <strong>Base Sepolia</strong> in one transaction!
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#047857' }}>
                      ℹ️ Source chain is auto-detected from your wallet. First-time users will sign once to create a Chain Abstraction account.
                    </p>
                    {address && (
                      <p className="text-xs mt-2 font-mono" style={{ color: '#047857' }}>
                        📝 Connected: {address.slice(0, 6)}...{address.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Multiple Wallets Warning */}
                {typeof window !== 'undefined' && (window as unknown as { ethereum?: { providers?: unknown[] } })?.ethereum?.providers && ((window as unknown as { ethereum?: { providers?: unknown[] } })?.ethereum?.providers?.length ?? 0) > 1 && (
                  <div
                    className="p-3 rounded-lg flex items-start gap-2"
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fcd34d',
                    }}
                  >
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="#f59e0b" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                        Multiple Wallets Detected
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#78350f' }}>
                        We&apos;ve detected multiple wallet extensions (MetaMask, Coinbase, etc.). 
                        The bridge will use the wallet you connected from the header. If you want to use a different wallet, disconnect and reconnect with the correct one.
                      </p>
                    </div>
                  </div>
                )}

                {/* Troubleshooting: Common 404 Error */}
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: '#fef9c3',
                    border: '1px solid #fde047',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="#ca8a04" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#854d0e' }}>
                        💡 Troubleshooting: If you get a 404 error
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#713f12' }}>
                        If the bridge fails with a &quot;404 fee grant&quot; error, it means the Avail Nexus testnet backend is experiencing issues. 
                        <strong> Make sure you&apos;re on Ethereum Sepolia (Chain ID: 11155111)</strong> and try again in a few minutes. 
                        This is a testnet infrastructure issue, not your code!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Connection Status */}
                {!isConnected ? (
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{
                      background: '#fef2f2',
                      borderColor: '#fca5a5',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-6 h-6" fill="#ef4444" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-bold" style={{ color: '#991b1b' }}>
                        Wallet Not Connected
                      </h3>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#7f1d1d' }}>
                      Please click <strong>&quot;Connect Wallet&quot;</strong> in the header and connect to MetaMask.
                    </p>
                    <p className="text-xs" style={{ color: '#991b1b' }}>
                      Make sure you&apos;re on <strong>Ethereum Sepolia</strong> testnet to bridge to Base Sepolia.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Connected Wallet Status */}
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="#10b981" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: '#065f46' }}>
                              ✅ MetaMask Connected
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#047857' }}>
                              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold" style={{ color: '#065f46' }}>
                            Network
                          </p>
                          <p className="text-xs" style={{ color: '#047857' }}>
                            Ethereum Sepolia
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Balance Display */}
                    <div
                      className="p-6 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        border: '2px solid #6ee7b7',
                      }}
                    >
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#065f46' }}>
                        💰 Your Balances
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">ETH Balance</p>
                          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                            {parseFloat(ethBalance).toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">ETH</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">AVAIL Balance</p>
                          <p className="text-2xl font-bold" style={{ color: '#00C896' }}>
                            {availBalance}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">AVAIL</p>
                        </div>
                      </div>
                      <button
                        onClick={fetchBalances}
                        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                        style={{
                          background: 'white',
                          border: '1px solid #6ee7b7',
                          color: '#065f46',
                        }}
                      >
                        🔄 Refresh Balances
                      </button>
                    </div>

                    {/* Bridge Summary */}
                    <div
                      className="p-6 rounded-lg"
                      style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#374151' }}>
                        🌉 Bridge Summary
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">From</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {networks.find(n => n.id === sourceNetwork)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">To</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {networks.find(n => n.id === destinationNetwork)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {bridgeAmount} {tokenType.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Recipient</span>
                          <span className="text-sm font-semibold text-gray-900 font-mono">
                            {recipientAddress ? `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}` : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Estimated Time</span>
                          <span className="text-sm font-semibold text-gray-900">
                            2-5 minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Execute Bridge Button */}
                    <button
                      onClick={handleExecuteBridge}
                      disabled={isBridging || !recipientAddress || !bridgeAmount}
                      className="w-full px-6 py-4 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: isBridging 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                          : 'linear-gradient(135deg, #00C896, #00B884)',
                        color: 'white',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '16px',
                        boxShadow: '0 4px 12px rgba(0, 200, 150, 0.3)',
                      }}
                    >
                      {isBridging ? '🔄 Bridging...' : '🚀 Execute Bridge Now'}
                    </button>

                    {/* Bridge Status */}
                    {bridgeStatus && (
                      <div
                        className="p-4 rounded-lg text-center"
                        style={{
                          background: bridgeStatus.includes('successful') ? '#d1fae5' : '#fef3c7',
                          border: `1px solid ${bridgeStatus.includes('successful') ? '#6ee7b7' : '#fcd34d'}`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ 
                          color: bridgeStatus.includes('successful') ? '#065f46' : '#92400e' 
                        }}>
                          {bridgeStatus}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - OUTPUT */}
        <div
          className="flex flex-col"
          style={{
            width: '350px',
            background: '#f9fafb',
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
            }}
          >
            <h2
              className="text-lg font-bold"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              OUTPUT
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div
              className="rounded-lg border border-gray-300 bg-white p-6"
              style={{
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="#10b981" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bridge Output</p>
                  <p className="text-xs text-gray-500">Transaction results will appear here</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-2">Expected Output</p>
                <div className="space-y-2 text-xs text-green-800">
                  <p><strong>Transaction Hash:</strong> 0x...</p>
                  <p><strong>Status:</strong> Confirmed</p>
                  <p><strong>Block Number:</strong> #</p>
                  <p><strong>Gas Used:</strong> Amount</p>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">Next Node</p>
                <p className="text-xs text-blue-800">
                  Connect this output to the next node to continue your workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

