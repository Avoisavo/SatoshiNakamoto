/**
 * Send a message to a Telegram bot
 * @param botToken - Telegram bot token
 * @param chatId - Chat ID to send message to
 * @param message - Message text to send
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  message: string
): Promise<boolean> {
  try {
    // Use our API route to avoid CORS issues
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botToken,
        chatId: String(chatId),
        message,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Telegram message sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send Telegram message:', {
        error: data.error,
        errorCode: data.errorCode,
        chatId: chatId,
        botToken: botToken.substring(0, 10) + '...' // Only log first part for security
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Send bridge transaction notification to Telegram
 * @param botToken - Telegram bot token
 * @param chatId - Chat ID to send message to
 * @param txHash - Transaction hash
 * @param amount - Amount bridged
 * @param fromNetwork - Source network
 * @param toNetwork - Destination network
 */
export async function sendBridgeNotification(
  botToken: string,
  chatId: string | number,
  txHash: string,
  amount: string,
  fromNetwork: string = 'Base Sepolia',
  toNetwork: string = 'Hedera'
): Promise<boolean> {
  const message = `
🌉 <b>Bridge Transaction Successful!</b>

💰 <b>Amount:</b> ${amount} MyOFT
🔗 <b>From:</b> ${fromNetwork}
🔗 <b>To:</b> ${toNetwork}

📝 <b>Transaction Hash:</b>
<code>${txHash}</code>

🔍 <b>View on BaseScan:</b>
https://sepolia.basescan.org/tx/${txHash}

📊 <b>Track Cross-Chain:</b>
https://testnet.layerzeroscan.com/

⏳ <i>Cross-chain delivery: 2-5 minutes</i>
  `.trim();

  return sendTelegramMessage(botToken, chatId, message);
}

