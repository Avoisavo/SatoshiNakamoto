# LinkedOut - AI-Powered Crosschain Workflow Automation

**LinkedOut** is an intelligent workflow automation platform that transforms natural language prompts into executable crosschain workflows. Users can describe what they want to achieve in plain English, and AI generates a visual workflow that bridges tokens, executes smart contracts, and automates multi-agent interactions across multiple blockchains.

## 🎯 Problem Statement

Building and executing crosschain workflows is complex and inaccessible:

- **Fragmented Tools**: Users need separate interfaces for bridging, DeFi interactions, and agent communication
- **Technical Barriers**: Setting up crosschain operations requires deep blockchain knowledge
- **No Automation**: Multi-step workflows require manual execution of each transaction
- **Poor UX**: Switching between chains, wallets, and dApps creates friction
- **Limited Composability**: Existing solutions don't easily combine DeFi, bridging, and AI agents

**The Result**: Users struggle to execute complex crosschain strategies, limiting blockchain adoption.

## 💡 Solution

LinkedOut solves this with **AI-powered workflow generation** and **unified crosschain execution**:

1. **Natural Language Interface**: Users describe their intent in plain English
2. **AI Flow Generation**: Large language models translate prompts into visual workflows
3. **One-Click Execution**: All steps execute automatically with a single user approval
4. **Crosschain Abstraction**: Seamlessly bridge and execute across Ethereum, Base, Arbitrum, Optimism, Polygon, and Hedera
5. **Agent Coordination**: Hedera A2A protocol enables autonomous agent-to-agent communication
6. **Intent-Based Bridging**: Avail Nexus SDK handles complex crosschain operations in a single transaction

**Example Workflow**:
> "Bridge 100 USDC from Ethereum to Base and deposit into AAVE"

LinkedOut generates a workflow that:
- Bridges USDC using Avail Nexus or LayerZero
- Approves AAVE spending on Base
- Deposits tokens into lending pool
- Notifies user of completion

All in **one signature**.

## 🚀 How We Built This

### The Story Behind LinkedOut

**I was a beginner in Web3**, and everything felt overwhelming.

When I wanted to integrate Web2 applications with Web3 functionality, it was **extremely troublesome**:

- 📚 **Reading endless documentation** - Every protocol has different docs, different SDKs, different patterns
- 🤖 **ChatGPT could only tell me what to do** - "You need to call this function, then that contract, then bridge here..." but it couldn't actually DO it for me
- 🔍 **No tools existed** - I searched everywhere for a platform that could bridge Web2 and Web3 workflows, but there was nothing in the market
- 😰 **Every integration was manual** - Want to bridge tokens? Read LayerZero docs. Want to use agents? Learn Hedera. Want to call contracts on Base? Study Wagmi. Each one took days.

### The "Aha!" Moment

I thought: **"What if I could just TELL the computer what I want in plain English, and it figures out all the Web3 complexity for me?"**

That's when I realized:
- AI can understand natural language intent
- Agents can coordinate complex multi-step operations
- Bridges can handle crosschain execution
- Everything can be combined into **ONE simple interface**

### What Makes This Different

**For beginners like me:**
- ✅ No need to read 10 different protocol docs
- ✅ No need to write complex Web3 code
- ✅ No need to manually bridge, approve, and execute
- ✅ Just type what you want, and it happens

**For Web2 developers:**
- ✅ Integrate Web3 without learning Solidity
- ✅ Build workflows visually like Zapier
- ✅ Use familiar concepts (APIs, agents, automation)
- ✅ Bridge the gap between Web2 and Web3

**For Web3 users:**
- ✅ Execute complex crosschain strategies in one click
- ✅ Combine multiple protocols seamlessly
- ✅ Verify everything on-chain
- ✅ Save time and avoid mistakes


Now, **anyone can build crosschain workflows** - whether you're a Web3 expert or someone who just heard about blockchain yesterday.

That's the power of LinkedOut. 🚀

## 🌉 Avail Nexus Integration

### SDK Used

This project uses **`@avail-project/nexus-core`** (v0.0.1) for intent-based crosschain operations directly in the browser client.

### Why Nexus Core?

We chose the programmatic SDK layer because our app needs:

- **Dynamic workflow execution**: Users create custom workflows at runtime
- **Flexible contract interaction**: Support for any contract address and function
- **Backend-agnostic**: All crosschain logic happens client-side for maximum flexibility
- **AI integration**: Workflows can combine crosschain operations with AI agents

### Integration Architecture

#### 1. **Nexus Client Initialization** (`frontend/src/lib/avail/nexusClient.ts`)

The Nexus SDK is initialized once per user session with their wallet provider:

```typescript
import { NexusSDK } from "@avail-project/nexus-core";

const nexusClientInstance = await NexusSDK.init({
  wallet: userWalletProvider,
  config: {
    // Auto-detects source chain from wallet
    // Supports Sepolia, Base, Arbitrum, Optimism, Polygon
  },
});
```

**Features:**

- One-time Chain Abstraction account setup via MetaMask signature
- Auto-detects user's current chain as source
- Persists across page reloads
- Handles network switching automatically

#### 2. **Bridge Executor** (`frontend/src/lib/avail/bridgeExecutor.ts`)

Core crosschain operations using Nexus SDK methods:

**Simple Bridge:**

```typescript
export async function executeBridge(params: BridgeParams) {
  const result = await nexusClient.bridge({
    chainId: destinationChainId,
    token: "USDC",
    amount: "0.1",
  });
  // Returns intent ID and explorer URL
}
```

**Bridge & Execute:**

```typescript
export async function executeBridgeAndExecute(params: BridgeAndExecuteParams) {
  const result = await nexusClient.bridgeAndExecute({
    toChainId: destinationChainId,
    token: "USDC",
    amount: "0.1",
    execute: {
      contractAddress: "0x...",
      contractAbi: [...],
      functionName: "deposit",
      buildFunctionParams: (token, amount, chainId, user) => ({
        functionParams: [token, amount, user, 0],
        value: "0"
      }),
      tokenApproval: {
        token: "USDC",
        amount: "0.1",
        chainId: destinationChainId
      }
    }
  });
}
```

**Key Implementation Details:**

- Auto-detects source chain from connected wallet (no hardcoding)
- Token approval configuration for ERC20 tokens (USDC, USDT)
- Contract ABI mapping for common protocols (WETH, USDC, AAVE)
- Comprehensive error handling and logging
- Intent tracking with Nexus Explorer links

#### 3. **Visual Workflow Nodes** (`frontend/src/app/workflow/workflowComponents/`)

**Avail Bridge Node:**

- Drag-and-drop interface for simple token bridging
- Supports ETH, USDC, USDT
- Destination chain selection (Base, Arbitrum, Optimism, Polygon)
- Real-time validation

**Avail Bridge & Execute Node:**

- Combines bridging with smart contract execution
- Custom contract address and function inputs
- Dynamic parameter builder
- ABI-aware execution

**Workflow Executor:**

- Executes nodes sequentially
- Initializes Nexus SDK on first use
- Handles MetaMask prompts and approvals
- Logs execution progress in real-time

## 🎯 Crosschain Capabilities

### What You Can Do

1. **Simple Token Bridging**

   - Bridge ETH, USDC, or USDT between chains
   - Tracks intents on Nexus Explorer
   - Completes in 10-15 minutes

2. **Bridge & Execute in One Intent**

   - Bridge tokens to destination chain
   - Automatically approve token spending
   - Execute contract function on destination
   - All in a single user signature

3. **Supported Actions**
   - WETH wrapping/unwrapping
   - Token approvals
   - DeFi deposits (AAVE, etc.)
   - Custom contract calls

### Supported Chains

**Source Chain:**

- Ethereum Sepolia (testnet)

**Destination Chains:**

- Base Sepolia
- Arbitrum Sepolia
- Optimism Sepolia
- Polygon Amoy

## 💡 Intent-Based Interactions

Avail Nexus is built around **intents** — declarative statements of what you want to achieve crosschain, without worrying about the implementation details.

### Example Intent Flow

**User Action:** "Bridge 0.1 USDC from Sepolia to Base and approve spending"

**What Happens:**

1. User configures workflow node with destination, token, amount, contract
2. SDK creates a single **intent** with all steps
3. User approves ONE signature in MetaMask
4. Nexus handles:
   - Source chain transaction
   - Crosschain bridging
   - Destination chain approval
   - Contract execution
5. Intent tracked on [Nexus Explorer](https://explorer.nexus-folly.availproject.org)

**Real Transaction Example:**

- **Intent**: https://explorer.nexus-folly.availproject.org/intent/426
- **Approval tx**: https://sepolia.basescan.org/tx/0x106e0a584cf8583c5a46d9fea04ab68cabeff5c7f03710c3f86a20f144844283
- **Execute tx**: https://sepolia.basescan.org/tx/0xa18b66fe7ed3a1ece5668f7f278dd71fb9870708d11da7197ebcaa6441d6c3c8

### Why Intents?

- **Unified UX**: One signature instead of multiple transactions
- **Chain abstraction**: Users don't manage network switching
- **Failure recovery**: Nexus handles failed crosschain transactions
- **Gas optimization**: Efficient execution across chains

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **MetaMask** browser extension (or compatible Web3 wallet)
- **Testnet tokens**:
  - Sepolia ETH (for gas fees)
  - Sepolia USDC (for bridging)

### Installation

#### 1. Clone the Repository

   ```bash
git clone https://github.com/yourusername/LinkedOut.git
   cd LinkedOut
   ```

#### 2. Install Dependencies

**Frontend:**
   ```bash
   cd frontend
   npm install
   ```

**Backend:**
```bash
cd ../backend/api
npm install
```

#### 3. Set Up Environment Variables

**Backend** (`backend/api/.env`):
   ```bash
# Hedera Agent Accounts
HEDERA_TELEGRAM_ACCOUNT_ID=0.0.7130534
HEDERA_TELEGRAM_PRIVATE_KEY=your_private_key

HEDERA_AI_ACCOUNT_ID=0.0.7130657
HEDERA_AI_PRIVATE_KEY=your_private_key

HEDERA_BRIDGE_ACCOUNT_ID=0.0.7130832
HEDERA_BRIDGE_PRIVATE_KEY=your_private_key

# Hedera Consensus Service
HCS_TOPIC_ID=0.0.7131514

# Auto-start agents (optional)
AUTO_START_AGENTS=false

# Groq API (for AI workflow generation)
GROQ_API_KEY=your_groq_api_key
```

**Frontend** (`frontend/.env.local`):
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: WalletConnect Project ID
   # Get from https://cloud.walletconnect.com/
   # NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Groq API (for prompt processing)
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
   ```

   > **Note:** WalletConnect is optional. MetaMask works without it.

#### 4. Get Testnet Tokens

**Sepolia ETH** (for gas):
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

**Sepolia USDC** (for bridging):
- https://faucet.circle.com/
- Request 10 USDC for testing

**Base Sepolia ETH** (optional):
- https://www.alchemy.com/faucets/base-sepolia

#### 5. Start the Application

Open **two terminals**:

**Terminal 1 - Backend:**
   ```bash
cd backend/api
node server.js
```
The backend will start on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
   npm run dev
   ```
The frontend will start on `http://localhost:3000`

#### 6. Connect Your Wallet

1. Open http://localhost:3000 in your browser
2. Click **"Connect Wallet"** in the header
3. Approve MetaMask connection
4. Switch to **Ethereum Sepolia** network

### Quick Start Script (Optional)

Use the provided script to start both frontend and backend:

```bash
chmod +x run_app.sh
./run_app.sh
```

This will automatically:
- Start the backend on port 8000
- Start the frontend on port 3000
- Open your browser to http://localhost:3000



## 📁 Project Structure

```
LinkedOut/
├── frontend/                           # Next.js 15 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Landing page (3D animation)
│   │   │   ├── prompt/                # AI prompt input page
│   │   │   └── flow/                  # Visual workflow builder
│   │   │       ├── page.tsx           # Main canvas
│   │   │       ├── aiNode/            # AI agent nodes
│   │   │       ├── availNode/         # Avail bridge nodes
│   │   │       ├── baseNode/          # Base chain nodes
│   │   │       ├── hederaNode/        # Hedera agent nodes
│   │   │       └── panel/             # Configuration panels
│   │   ├── avail/                     # Avail Nexus components
│   │   │   ├── AvailBridgeNode.tsx
│   │   │   ├── AvailBridgeExecuteNode.tsx
│   │   │   └── AvailExecutorWagmi.tsx
│   │   ├── lib/
│   │   │   ├── avail/
│   │   │   │   ├── nexusClient.ts     # Nexus SDK init
│   │   │   │   ├── bridgeExecutor.ts  # Bridge operations
│   │   │   │   └── intents.ts         # Intent tracking
│   │   │   ├── bridgeToHedera.ts      # LayerZero bridge
│   │   │   └── wagmi-config.ts        # Wallet connection
│   │   └── providers/
│   │       └── Web3Provider.tsx       # Wagmi + RainbowKit
│   └── package.json                   # Dependencies
│
├── backend/
│   ├── api/                           # Express backend
│   │   ├── server.js                  # Main server
│   │   ├── hedera/
│   │   │   └── a2a-protocol.js        # A2A message schemas
│   │   ├── hedera-kit/
│   │   │   ├── agent-system.js        # Agent orchestrator
│   │   │   ├── telegram-kit-agent.js  # Telegram agent
│   │   │   ├── ai-decision-kit-agent.js  # AI agent
│   │   │   ├── bridge-executor-kit-agent.js  # Bridge agent
│   │   │   └── test-workflow.js       # Test suite
│   │   ├── routes/
│   │   │   ├── agents.js              # Agent API endpoints
│   │   │   ├── workflows.js           # Workflow CRUD
│   │   │   └── templates.js           # Template management
│   │   ├── models/                    # Database models
│   │   └── db/
│   │       └── database.js            # SQLite connection
│   │
│   └── base/                          # LayerZero contracts
│       ├── contracts/
│       │   ├── ConditionalBridge.sol  # Custom OFT
│       │   └── MyOFT.sol              # Standard OFT
│       ├── deployments/
│       │   ├── base-sepolia/          # Base deployments
│       │   └── hedera-testnet/        # Hedera deployments
│       ├── scripts/
│       │   ├── bridge-to-hedera.js    # Bridge script
│       │   └── check-balances.js      # Balance checker
│       └── hardhat.config.ts          # Hardhat config
│
├── HEDERA_AGENT_WORKFLOW.md          # Agent documentation
├── AVAIL_BRIDGE_GUIDE.md              # Avail integration guide
├── QUICK_START.md                     # Quick start tutorial
└── README.md                          # This file
```

## 🔧 Technical Stack

### Frontend
- **Framework**: Next.js 15 (React 19, TypeScript)
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Blockchain**: Wagmi v2, Viem, Ethers v6, RainbowKit
- **Styling**: Tailwind CSS 4
- **AI**: Groq API (Llama 3)

### Backend
- **Server**: Express.js
- **Database**: SQLite3 (Better-SQLite3)
- **AI/LLM**: LangChain, Groq API, OpenAI-compatible endpoints
- **Hedera**: Hedera Agent Kit v3.4.0, @hashgraph/sdk v2

### Blockchain Integrations

#### Crosschain Bridging
- **Avail Nexus SDK** (`@avail-project/nexus-core` v0.0.2)
  - Intent-based bridging between Ethereum Sepolia and L2 testnets
  - Supports: Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy
  - Bridge & Execute in one transaction

- **LayerZero V2**
  - OFT (Omnichain Fungible Token) contracts deployed on Base Sepolia and Hedera Testnet
  - Handles Base ↔ Hedera token bridging
  - Uses LayerZero DVN (Decentralized Verifier Network)

#### Hedera Integration
- **Hedera Consensus Service (HCS)**: Topic 0.0.7131514
- **A2A Protocol**: Custom Agent-to-Agent message protocol
- **Agents**:
  - Telegram Agent (ID: 0.0.7130534)
  - AI Decision Agent (ID: 0.0.7130657)
  - Bridge Executor Agent (ID: 0.0.7130832)

#### Supported Networks
- Ethereum Sepolia (testnet)
- Base Sepolia (testnet) - **Base blockchain integration**
- Arbitrum Sepolia (testnet)
- Optimism Sepolia (testnet)
- Polygon Amoy (testnet)
- Hedera Testnet

### Smart Contracts
- **ConditionalBridge.sol**: LayerZero OFT contract with conditional bridging logic
- **MyOFT.sol**: Standard LayerZero OFT token implementation
- Deployed on Base Sepolia and Hedera Testnet with verified contracts

## 👤 User Flow: From Prompt to Execution

LinkedOut provides a seamless journey from natural language input to crosschain execution:

### Step 1: User Enters Prompt
**Location**: `/prompt` page

User types a natural language request:
```
"Bridge 100 USDC from Ethereum to Base and deposit into AAVE"
```

**What Happens**:
- User input is validated for basic structure
- Redirected to workflow builder with prompt parameter

### Step 2: AI Processes Prompt
**Location**: `/flow` page (workflow builder)

**AI Processing Pipeline**:
```
User Prompt → Groq API (Llama 3) → Workflow JSON → Visual Flow
```

**AI Actions**:
1. **Parse Intent**: Identifies "bridge" + "deposit" operations
2. **Extract Parameters**: 
   - Source: Ethereum
   - Destination: Base
   - Token: USDC
   - Amount: 100
   - Action: AAVE deposit
3. **Generate Workflow JSON**: Creates node structure with configuration
4. **Validate**: Checks for supported chains, tokens, and contracts

**Generated Workflow**:
- **Start Node**: Trigger point
- **Avail Bridge Node**: Bridge 100 USDC (Ethereum → Base)
- **Avail Bridge & Execute Node**: Approve + deposit into AAVE on Base
- **End Node**: Completion

### Step 3: User Reviews Generated Flow
**Visual Workflow Builder**:
- Nodes appear on canvas with connections
- User can:
  - Edit node parameters (amount, addresses, etc.)
  - Add/remove nodes
  - Rearrange workflow
  - Save for later use

### Step 4: User Executes Workflow
**Execution Button Clicked**:

#### 4.1 Initialization
```javascript
// Connect wallet (MetaMask)
connectWallet() → userAddress

// Initialize Avail Nexus SDK (one-time)
await NexusSDK.init({ wallet: provider })
// User signs Chain Abstraction account setup
```

#### 4.2 Sequential Node Execution

**For Avail Bridge Nodes**:
```
Execute Node → nexusClient.bridge({
  chainId: destinationChainId,
  token: "USDC",
  amount: "100"
}) → Intent Created → Transaction Submitted
```

**For Avail Bridge & Execute Nodes**:
```
Execute Node → nexusClient.bridgeAndExecute({
  toChainId: destinationChainId,
  token: "USDC",
  amount: "100",
  execute: {
    contractAddress: "0x...",
    contractAbi: [...],
    functionName: "deposit",
    buildFunctionParams: (token, amount) => ({
      functionParams: [token, amount, user],
      value: "0"
    })
  }
}) → Intent Created → Bridge + Approval + Execute
```

**For Hedera Nodes** (uses A2A Protocol):
```
Execute Node → POST /api/agents/telegram/message
{
  text: "Bridge 100 USDC from Ethereum to Polygon",
  chatId: workflowId,
  userId: userAddress
}

→ Hedera Telegram Agent receives message
→ Sends AI_DECISION_REQ to AI Decision Agent via HCS
→ AI Agent validates request
  ├─ Valid → Sends BRIDGE_EXEC_REQ to Bridge Executor Agent
  │          └─ Returns execution plan to frontend
  └─ Invalid → Sends NOTIFY with rejection reason

→ Frontend polls /api/agents/telegram/notifications
→ Displays result to user
```

### Step 5: Hedera A2A Execution (for Hedera nodes)

**Agent-to-Agent Communication via Hedera Consensus Service**:

```
┌──────────────────────────────────────────────────────────┐
│  1. Telegram Agent (Entry Point)                         │
│     - Receives user message via REST API                 │
│     - Creates AI_DECISION_REQ message                    │
│     - Publishes to HCS Topic 0.0.7131514                 │
└──────────────────┬───────────────────────────────────────┘
                   │ HCS Message
                   ↓
┌──────────────────────────────────────────────────────────┐
│  2. AI Decision Agent (Brain)                            │
│     - Subscribes to HCS Topic                            │
│     - Receives AI_DECISION_REQ                           │
│     - Validates request using if/else logic:             │
│       • Checks for bridge keywords                       │
│       • Extracts: sourceChain, targetChain, token, amt   │
│       • Validates against supported chains/tokens        │
│     - Decision:                                          │
│       ✓ APPROVE → Creates BRIDGE_EXEC_REQ                │
│       ✗ REJECT  → Creates NOTIFY with reason             │
│     - Publishes response to HCS                          │
└──────────────────┬───────────────────────────────────────┘
                   │ HCS Message
                   ↓
┌──────────────────────────────────────────────────────────┐
│  3. Bridge Executor Agent (Action)                       │
│     - Receives BRIDGE_EXEC_REQ from HCS                  │
│     - Stores as pending execution with correlationId     │
│     - Creates execution plan:                            │
│       • Source chain transaction                         │
│       • Bridge protocol (LayerZero/Avail)                │
│       • Destination chain execution                      │
│     - Returns BRIDGE_EXEC_RESP (pending status)          │
│     - Publishes to HCS                                   │
└──────────────────┬───────────────────────────────────────┘
                   │ HCS Message
                   ↓
┌──────────────────────────────────────────────────────────┐
│  4. AI Decision Agent (Notification Router)              │
│     - Receives BRIDGE_EXEC_RESP                          │
│     - Creates NOTIFY message with result                 │
│     - Sends to Telegram Agent                            │
│     - Publishes to HCS                                   │
└──────────────────┬───────────────────────────────────────┘
                   │ HCS Message
                   ↓
┌──────────────────────────────────────────────────────────┐
│  5. Telegram Agent (Notification Store)                  │
│     - Receives NOTIFY from HCS                           │
│     - Stores notification in memory (by chatId)          │
│     - Available for frontend polling                     │
└──────────────────────────────────────────────────────────┘
```

**Verification**: All messages are **on-chain and verifiable** at:
`https://hashscan.io/testnet/topic/0.0.7131514`

### Step 6: LayerZero Bridge Execution (for Base ↔ Hedera)

When bridging between Base and Hedera:

```javascript
// Frontend calls backend API
POST /api/bridge/execute
{
  sourceChain: "base-sepolia",
  targetChain: "hedera-testnet",
  amount: "100",
  token: "USDC"
}

→ Backend executes LayerZero OFT bridge:
  1. User approves token spending (MetaMask)
  2. Calls ConditionalBridge.send() on Base Sepolia
  3. LayerZero DVN verifies and relays
  4. Tokens minted on Hedera Testnet
  5. Returns transaction hash + explorer link

→ Frontend displays:
  - Source tx: Base Sepolia explorer
  - Destination tx: Hedera HashScan
  - Bridge status: Completed
```

**Bridge Contracts**:
- Base Sepolia: `deployments/base-sepolia/ConditionalBridge.json`
- Hedera Testnet: `deployments/hedera-testnet/ConditionalBridge.json`

### Step 7: Real-Time Progress Updates

**During Execution**:
- Progress bar shows current node
- Logs display:
  ```
  ✓ Initializing Nexus SDK...
  ✓ Connected to Ethereum Sepolia
  ✓ Creating bridge intent...
  ⏳ Intent ID: 426 (view on explorer)
  ⏳ Waiting for bridge completion...
  ✓ Bridge successful!
  ✓ Executing contract on Base...
  ✓ Approval tx: 0x106e0a...
  ✓ Deposit tx: 0xa18b66...
  ✅ Workflow completed!
  ```

### Step 8: Completion & Verification

**Results Displayed**:
- All transaction hashes with explorer links
- Intent IDs for Avail Nexus operations
- HCS message IDs for Hedera agent communications
- Gas costs and execution time
- Success/failure status per node

**On-Chain Verification**:
- **Avail Nexus**: https://explorer.nexus-folly.availproject.org/intent/{intentId}
- **Base Sepolia**: https://sepolia.basescan.org/tx/{txHash}
- **Hedera HCS**: https://hashscan.io/testnet/topic/0.0.7131514
- **LayerZero**: https://testnet.layerzeroscan.com/

## 🔗 What Did We Use?

### Hedera Integration

**Hedera Agent Kit** - Full implementation of agent-to-agent communication:

✅ **A2A Protocol** (`backend/api/hedera/a2a-protocol.js`)
- Custom message schemas: `AI_DECISION_REQ`, `AI_DECISION_RESP`, `BRIDGE_EXEC_REQ`, `BRIDGE_EXEC_RESP`, `NOTIFY`
- Message validation and correlation tracking
- Agent IDs: `agent://telegram`, `agent://ai-decision`, `agent://bridge-executor`

✅ **Hedera Consensus Service (HCS)**
- Topic ID: `0.0.7131514`
- All agent messages published on-chain
- Verifiable at: https://hashscan.io/testnet/topic/0.0.7131514

✅ **Three Autonomous Agents**:
1. **Telegram Agent** (Account `0.0.7130534`)
   - Entry point for user messages
   - Stores notifications for polling
   
2. **AI Decision Agent** (Account `0.0.7130657`)
   - Validates bridge requests using if/else logic
   - Extracts parameters (chains, tokens, amounts)
   - Approves or rejects with reasoning
   
3. **Bridge Executor Agent** (Account `0.0.7130832`)
   - Receives bridge requests from AI Agent
   - Creates execution plans
   - Tracks pending/completed operations

**Files**: `backend/api/hedera-kit/*.js`, `backend/api/routes/agents.js`

### LayerZero Integration

**LayerZero V2 OFT (Omnichain Fungible Token)** - Base ↔ Hedera bridging:

✅ **Smart Contracts**
- `ConditionalBridge.sol` - Custom OFT with conditional logic
- `MyOFT.sol` - Standard OFT implementation
- Deployed on Base Sepolia AND Hedera Testnet

✅ **Deployment Files**
- Base Sepolia: `backend/base/deployments/base-sepolia/ConditionalBridge.json`
- Hedera Testnet: `backend/base/deployments/hedera-testnet/ConditionalBridge.json`

✅ **Bridge Scripts**
- `backend/base/scripts/bridge-to-hedera.js` - Execute Base → Hedera bridge
- `backend/base/scripts/auto-bridge-base-to-hedera.js` - Automated bridging
- `backend/base/scripts/check-balances.js` - Verify token balances

✅ **LayerZero Configuration**
- `layerzero.config.ts` - Network endpoints and chain IDs
- Uses LayerZero DVN (Decentralized Verifier Network)
- Supports EVM ↔ Hedera cross-chain messaging

**Files**: `backend/base/contracts/*.sol`, `backend/base/scripts/*.js`, `backend/base/deploy/*.ts`

### Avail Nexus Integration

**Avail Nexus Core SDK** (`@avail-project/nexus-core`) - Multi-chain bridging:

✅ **Client Initialization** (`frontend/src/lib/avail/nexusClient.ts`)
```typescript
const nexusClient = await NexusSDK.init({
  wallet: userWalletProvider,
  config: { /* auto-detects source chain */ }
});
```

✅ **Bridge Operations** (`frontend/src/lib/avail/bridgeExecutor.ts`)
- `executeBridge()` - Simple token bridging
- `executeBridgeAndExecute()` - Bridge + contract execution in one intent

✅ **Supported Routes**
- Ethereum Sepolia → Base Sepolia
- Ethereum Sepolia → Arbitrum Sepolia
- Ethereum Sepolia → Optimism Sepolia
- Ethereum Sepolia → Polygon Amoy

✅ **Visual Workflow Nodes**
- `AvailBridgeNode.tsx` - Simple bridge UI
- `AvailBridgeExecuteNode.tsx` - Bridge + execute UI
- `AvailExecutorWagmi.tsx` - Workflow execution engine

✅ **Intent Tracking**
- All operations tracked on Nexus Explorer
- Example intent: https://explorer.nexus-folly.availproject.org/intent/426
- Real transactions with verifiable proof

**Files**: `frontend/src/lib/avail/*.ts`, `frontend/src/app/avail/*.tsx`

### Base Blockchain Integration

**Base Sepolia Testnet** - Primary L2 for crosschain operations:

✅ **LayerZero OFT Deployment**
- ConditionalBridge contract deployed at verified address
- Supports bridging to/from Hedera via LayerZero

✅ **Avail Nexus Destination**
- Base Sepolia is a primary destination chain for Nexus intents
- Supports bridge + execute workflows (e.g., AAVE deposits on Base)

✅ **DeFi Integration**
- WETH contract: `0x4200000000000000000000000000000000000006`
- USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Contract ABIs included in bridgeExecutor for seamless interaction

✅ **Explorer Links**
- All Base transactions link to https://sepolia.basescan.org
- Real-time verification of bridge and execute operations

**Usage Example**:
```
User: "Bridge 0.1 USDC from Ethereum to Base and wrap as WETH"
→ Nexus SDK bridges USDC to Base
→ Auto-approves WETH contract
→ Calls deposit() on WETH contract
→ All in ONE intent!
```

### AI Integration

**Groq API** (Llama 3) - Workflow generation from natural language:

✅ **Prompt Processing** (`frontend/src/app/prompt/`)
- Converts user text into workflow JSON
- Extracts chains, tokens, amounts, actions
- Validates against supported operations

✅ **Backend AI Agent** (Hedera)
- LangChain integration for agent reasoning
- If/else decision logic (no LLM needed for execution)
- Validates bridge requests in real-time


## 👥 Team

### Tan Zhi Wei
- Full Stack Developer
- Frontend Developer
- LayerZero Integration
- PayPal Integration

### Edwina Hon Kai Xin
- Backend Developer
- Hedera A2A Protocol
- Avail Bridging


