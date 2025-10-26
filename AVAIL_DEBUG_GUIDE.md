# Avail Bridge Debugging Guide

## Quick Diagnostics

When you encounter an error with the Avail bridge, follow these steps:

### Step 1: Open Browser Console

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)

**Firefox:**
- Press `F12` or `Ctrl+Shift+K`

**Safari:**
- Enable Developer menu in Preferences → Advanced
- Press `Cmd+Option+C`

### Step 2: Look for Detailed Error Messages

The console will now show detailed logs with these markers:

- ✅ = Success/validation passed
- ❌ = Error/failure
- 🚀 = Process started
- 📋 = Parameters/data
- 🔄 = In progress

### Step 3: Common Error Patterns

#### Error: "Nexus SDK not initialized"

**Cause:** The SDK failed to initialize or wallet wasn't properly connected.

**Solution:**
1. Refresh the page
2. Connect your wallet via the header
3. Make sure you're on Ethereum Sepolia
4. Try the bridge again

#### Error: "Wrong network detected"

**Cause:** You're not on Ethereum Sepolia testnet.

**Solution:**
1. The app will now automatically prompt you to switch networks
2. Approve the network switch in MetaMask
3. If it doesn't add automatically, add manually:
   - Chain ID: 11155111
   - RPC URL: https://rpc.sepolia.org
   - Symbol: ETH

#### Error: "404 fee grant" or "deadline exceeded"

**Cause:** Avail Nexus testnet backend is slow or down.

**Solution:**
1. Wait 2-3 minutes and try again
2. Try a smaller amount (e.g., 0.001 ETH)
3. Check [Avail Discord](https://discord.gg/avail) for testnet status
4. This is a testnet infrastructure issue, not your code!

#### Error: "Bridge method not available"

**Cause:** SDK not properly initialized or version mismatch.

**Solution:**
1. Check console for "Nexus SDK bridge method not found"
2. Look for "Available methods:" log to see what methods exist
3. Refresh page and reinitialize

### Step 4: Enhanced Logging

The bridge now logs every step:

```
🚀 executeBridge called with params: {...}
✅ Nexus client retrieved successfully
✅ Target chain config: {...}
✅ Amount validated: 0.001
✅ Token validated: ETH
✅ Current chain ID: 11155111
✅ Nexus SDK bridge method available
📋 Bridge parameters: {...}
🔄 Calling nexusClient.bridge()...
```

If you see an error, note which step it failed at!

### Step 5: Check Network Status

1. **Verify you're on Ethereum Sepolia:**
   - Look at your MetaMask network dropdown
   - Should show "Sepolia" or "Ethereum Sepolia"
   - Chain ID should be 11155111

2. **Check your balance:**
   - You need ETH on Sepolia to pay gas
   - Get free testnet ETH from [Sepolia faucet](https://sepoliafaucet.com/)

3. **Verify MetaMask is unlocked:**
   - Make sure you're logged into MetaMask
   - Wallet should be connected to the app

### Step 6: Report Issues

If the error persists, provide these details:

1. **Full console output** (copy all ❌ error messages)
2. **Network you're on** (from MetaMask)
3. **Bridge parameters** (amount, token, destination)
4. **Error message** from the alert dialog
5. **Full error details** from console JSON output

## Advanced Debugging

### Enable Full Error Stack Traces

The bridge now automatically logs:
- Error type and name
- Error message
- Full stack trace
- Complete error object as JSON

Look for these in console:
```
❌ Error type: Error
❌ Error name: TypeError
❌ Error message: Cannot read property 'bridge' of undefined
❌ Error stack: [full stack trace]
❌ Full error object: {...}
```

### Test SDK Initialization

Open browser console and run:
```javascript
// Check if window.ethereum exists
console.log('Ethereum provider:', window.ethereum);

// Check current chain
window.ethereum.request({ method: 'eth_chainId' })
  .then(chainId => console.log('Chain ID:', parseInt(chainId, 16)));

// Check connected accounts
window.ethereum.request({ method: 'eth_accounts' })
  .then(accounts => console.log('Accounts:', accounts));
```

### Force Network Switch

If automatic switching fails, manually switch in MetaMask:
1. Click network dropdown in MetaMask
2. Select "Ethereum Sepolia"
3. If not listed, click "Add Network" → "Add a network manually"
4. Enter Sepolia details (see above)

## Known Issues & Workarounds

### Issue: Multiple Wallets Detected

**Symptom:** Warning about multiple wallet extensions

**Solution:**
- Use the wallet you connected from the header
- Disable other wallet extensions temporarily
- Or disconnect other wallets from the site

### Issue: Testnet Congestion

**Symptom:** Slow or timing out transactions

**Solution:**
- Use smaller amounts for testing
- Wait for off-peak hours
- Consider using LayerZero bridge as alternative

### Issue: Fee Grant Service Down

**Symptom:** 404 error when requesting fee grant

**Solution:**
- This is a testnet backend issue
- Wait 5-10 minutes and retry
- Check Avail Discord for maintenance notices
- Try during European/US business hours

## Getting Help

1. **Check Console First** - 90% of issues are explained in console logs
2. **Discord** - [Avail Discord](https://discord.gg/avail) for testnet status
3. **Documentation** - [Avail Docs](https://docs.availproject.org/)
4. **GitHub Issues** - Report persistent bugs with full logs

## Success Indicators

When the bridge works correctly, you'll see:
```
✅ Bridge SDK call completed. Result: {...}
✅ Bridge transaction result: {...}
✅ Bridge successful!
```

The alert will show:
```
✅ Bridge Successful!
From: ethereum-sepolia
To: base-sepolia
Amount: 0.001 ETH
Recipient: 0x...
Note: Crosschain bridges take 10-15 minutes to complete.
```

