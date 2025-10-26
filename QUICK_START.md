# 🚀 Quick Start Guide

## Backend is Running! ✅

Your backend server is now successfully running on **port 8000**.

## Current Status

```
✅ Server: http://localhost:8000
✅ Agent System: Initialized (ready to start)
✅ Database: Initialized with templates
✅ API Routes: All endpoints available
```

## Next Steps

### 1. Start the Frontend

Open a **new terminal** and run:

```bash
cd /Users/edw/Desktop/LinkedOut/frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### 2. Access the Workflow Builder

Open your browser and navigate to:

```
http://localhost:3000/workflow
```

### 3. Add Hedera Agent Node

1. Click the **"➕"** button or **"+ Add Node"**
2. Select **"Hedera Agents"** category
3. Choose **"Hedera Agent System"**
4. The node will appear on your canvas

### 4. Start the Agents

In the Hedera Agent node:

1. Click **"▶️ Start Agents"** button
2. Wait 5-10 seconds for initialization
3. Status will change to **🟢 Online**

### 5. Send Your First Message

Type in the message box:

```
Bridge 100 USDC from Ethereum to Polygon
```

Click **"📤 Send Message"**

### 6. Watch the Magic! ✨

Within 10-15 seconds you'll see:

- ⏳ Processing indicator
- 📬 Notification from AI with decision
- 🌉 Pending bridge execution (if approved)
- Click **"Simulate"** to test the bridge

## API Endpoints

Your backend is now serving these endpoints:

### Health Check

```bash
curl http://localhost:8000/health
```

### Agent Status

```bash
curl http://localhost:8000/api/agents/status
```

### Start Agents

```bash
curl -X POST http://localhost:8000/api/agents/start
```

### Send Message

```bash
curl -X POST http://localhost:8000/api/agents/telegram/message \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bridge 100 USDC from Ethereum to Polygon",
    "chatId": "test-123",
    "userId": "user-456"
  }'
```

### Get Notifications

```bash
curl http://localhost:8000/api/agents/telegram/notifications
```

### Get Pending Bridges

```bash
curl http://localhost:8000/api/agents/bridge/pending
```

## Testing the System

### Test 1: Valid Bridge Request

**Input**: "Bridge 100 USDC from Ethereum to Polygon"  
**Expected**: ✅ AI approves, bridge queued

### Test 2: Invalid Request

**Input**: "What is the weather today?"  
**Expected**: ❌ AI rejects (not a bridge request)

### Test 3: Incomplete Request

**Input**: "Bridge some tokens please"  
**Expected**: ❌ AI rejects (missing parameters)

## Verify On-Chain

All agent communications are recorded on Hedera testnet:

**HCS Topic**: https://hashscan.io/testnet/topic/0.0.7131514

You can see every message:

- AI_DECISION_REQ (from your frontend)
- AI_DECISION_RESP (AI's decision)
- BRIDGE_EXEC_REQ (bridge request)
- BRIDGE_EXEC_RESP (execution result)
- NOTIFY (notifications)

## Troubleshooting

### Backend Won't Start

**Issue**: Port already in use  
**Solution**:

```bash
lsof -ti:8000 | xargs kill -9
cd /Users/edw/Desktop/LinkedOut/backend/api
node server.js
```

### Agents Show Offline

**Issue**: Agents not started  
**Solution**: Click "▶️ Start Agents" in the frontend node

### No Response to Messages

**Issue**: Need to wait for processing  
**Solution**: Wait 10-15 seconds, agents are communicating via HCS

### Frontend Can't Connect

**Issue**: Check API URL  
**Solution**: Frontend should use `http://localhost:8000`

## Backend Logs

View real-time server logs:

```bash
tail -f /Users/edw/Desktop/LinkedOut/backend/api/server.log
```

## Stop the Backend

When you're done:

```bash
# Find the process
ps aux | grep "node server.js" | grep -v grep

# Kill it
kill <PID>
```

Or:

```bash
lsof -ti:8000 | xargs kill
```

## Architecture Overview

```
┌─────────────────────────────┐
│   Frontend (:3000)          │
│   Next.js Workflow Builder  │
└──────────┬──────────────────┘
           │ HTTP REST
           ↓
┌─────────────────────────────┐
│   Backend (:8000)           │
│   Express API Server        │
│   ├─ Agent Routes           │
│   ├─ Workflow Routes        │
│   └─ Template Routes        │
└──────────┬──────────────────┘
           │ Controls
           ↓
┌─────────────────────────────┐
│   Hedera Agent System       │
│   ├─ 📱 Telegram Agent      │
│   ├─ 🧠 AI Decision Agent   │
│   └─ 🌉 Bridge Executor     │
│                             │
│   ↕️ A2A via HCS            │
│   Topic: 0.0.7131514        │
└─────────────────────────────┘
```

## What's Working

✅ Backend server running  
✅ Agent system initialized  
✅ Database with templates  
✅ All API endpoints active  
✅ Hedera testnet connection  
✅ A2A communication ready  
✅ Frontend API client configured

## Ready to Demo!

Your system is fully operational and ready to demonstrate:

1. **Visual Workflow Builder** - Drag and drop nodes
2. **Agent Control** - Start/stop via UI
3. **Real-time Communication** - A2A message flow
4. **AI Decision Making** - Approve/reject with reasoning
5. **Bridge Execution** - Simulate or real (with wallet)
6. **On-Chain Verification** - View on HashScan

**Start the frontend now and try it out!** 🎉

## Need Help?

- **Backend Logs**: `tail -f backend/api/server.log`
- **Frontend Console**: Browser DevTools → Console
- **API Status**: `curl http://localhost:8000/health`
- **Agent Status**: `curl http://localhost:8000/api/agents/status`
- **HCS Messages**: https://hashscan.io/testnet/topic/0.0.7131514

## Documentation

- `FRONTEND_INTEGRATION_GUIDE.md` - Complete usage guide
- `HEDERA_AGENT_WORKFLOW.md` - Backend architecture
- `INTEGRATION_COMPLETE.md` - Implementation details
- `TESTNET_VERIFICATION.md` - On-chain verification

---

**Your backend is ready! Start the frontend and begin testing!** 🚀
