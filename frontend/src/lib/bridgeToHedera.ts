import { ethers } from 'ethers';

// Contract ABI for MyOFT (simplified - only the methods we need)
const OFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, (uint256 nativeFee, uint256 lzTokenFee) _fee, address _refundAddress) payable returns (tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee) receipt)',
  'function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, bool _payInLzToken) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee) fee)',
];

// Configuration (matching auto-bridge-base-to-hedera.js)
// sc address
const BASE_OFT_ADDRESS = "0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a";
const BASE_SEPOLIA_CHAIN_ID = 84532;
const HEDERA_EID = 40285; // LayerZero endpoint ID for Hedera
const BASE_EID = 40245; // LayerZero endpoint ID for Base Sepolia

export interface BridgeParams {
  recipientAddress: string;
  amount: string; // Amount in ETH/tokens (e.g., "0.001")
}

export interface BridgeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  receipt?: Record<string, unknown>;
}

export interface BridgeProgress {
  step: 'preparing' | 'quoting' | 'approving' | 'signing' | 'confirming' | 'completed' | 'error';
  message: string;
  txHash?: string;
}

/**
 * Bridge tokens from Base Sepolia to Hedera using LayerZero OFT
 * @param provider - Ethers provider from wallet (e.g., from wagmi)
 * @param params - Bridge parameters
 * @param onProgress - Callback for progress updates
 */
export async function bridgeToHedera(
  provider: unknown,
  params: BridgeParams,
  onProgress?: (progress: BridgeProgress) => void
): Promise<BridgeResult> {
  try {
    // Step 1: Prepare
    onProgress?.({
      step: 'preparing',
      message: 'Preparing bridge transaction...',
    });

    // Get signer from provider
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Check network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(BASE_SEPOLIA_CHAIN_ID)) {
      throw new Error('Please switch to Base Sepolia network');
    }

    // Connect to OFT contract
    const oftContract = new ethers.Contract(BASE_OFT_ADDRESS, OFT_ABI, signer);

    // Check balance
    const balance = await oftContract.balanceOf(signerAddress);
    const amountInWei = ethers.parseEther(params.amount);

    if (balance < amountInWei) {
      throw new Error(
        `Insufficient balance. You have ${ethers.formatEther(balance)} tokens, but trying to send ${params.amount}`
      );
    }

    // Step 2: Quote the fee
    onProgress?.({
      step: 'quoting',
      message: 'Getting bridge fee quote...',
    });

    // Convert recipient address to bytes32
    const recipientBytes32 = ethers.zeroPadValue(params.recipientAddress, 32);

    // Prepare send parameters
    const sendParam = {
      dstEid: HEDERA_EID,
      to: recipientBytes32,
      amountLD: amountInWei,
      minAmountLD: amountInWei,
      extraOptions: '0x',
      composeMsg: '0x',
      oftCmd: '0x',
    };

    // Quote the fee
    const feeQuote = await oftContract.quoteSend(sendParam, false);
    const nativeFee = feeQuote.nativeFee;

    console.log('Bridge fee:', ethers.formatEther(nativeFee), 'ETH');

    // Step 3: Execute send
    onProgress?.({
      step: 'signing',
      message: 'Please sign the transaction in your wallet...',
    });

    // Send the transaction
    const tx = await oftContract.send(
      sendParam,
      { nativeFee: nativeFee, lzTokenFee: 0 },
      signerAddress,
      { value: nativeFee }
    );

    onProgress?.({
      step: 'confirming',
      message: 'Transaction submitted! Waiting for confirmation...',
      txHash: tx.hash,
    });

    console.log('Transaction submitted:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    onProgress?.({
      step: 'completed',
      message: 'Bridge transaction completed! Cross-chain delivery will take 2-5 minutes.',
      txHash: receipt.hash,
    });

    return {
      success: true,
      txHash: receipt.hash,
      receipt,
    };
  } catch (error) {
    console.error('Bridge error:', error);
    
    onProgress?.({
      step: 'error',
      message: error instanceof Error ? error.message : 'Bridge transaction failed',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check token balance
 */
export async function checkOFTBalance(provider: unknown): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    const oftContract = new ethers.Contract(BASE_OFT_ADDRESS, OFT_ABI, provider);
    const balance = await oftContract.balanceOf(signerAddress);
    
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error checking balance:', error);
    return '0';
  }
}

/**
 * Get ETH balance
 */
export async function checkETHBalance(provider: unknown): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    const balance = await provider.getBalance(signerAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error checking ETH balance:', error);
    return '0';
  }
}


