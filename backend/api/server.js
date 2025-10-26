import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/database.js";
import workflowRoutes from "./routes/workflows.js";
import templateRoutes from "./routes/templates.js";
import executionRoutes from "./routes/executions.js";
import agentRoutes, { initializeAgentSystem } from "./routes/agents.js";
import { Template } from "./models/Template.js";
import { AgentSystem } from "./hedera-kit/agent-system.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Initialize database
initializeDatabase();

// Seed default templates
seedTemplates();

// Initialize Hedera Agent System (optional - can be started via API)
let agentSystem = null;
const AUTO_START_AGENTS = process.env.AUTO_START_AGENTS === "true";

async function initAgents() {
  try {
    agentSystem = new AgentSystem();
    await agentSystem.initialize();
    initializeAgentSystem(agentSystem);

    if (AUTO_START_AGENTS) {
      await agentSystem.start();
    } else {
      console.log(
        "💤 Agent system initialized but not started (use POST /api/agents/start)"
      );
    }
  } catch (error) {
    console.error("⚠️  Failed to initialize agent system:", error.message);
    console.log("   Agents will not be available");
  }
}

initAgents();

// Routes
app.use("/api/workflows", workflowRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/executions", executionRoutes);
app.use("/api/agents", agentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    agents: agentSystem?.getStatus() || { isRunning: false },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 LinkedOut API server running on port ${PORT}`);
  console.log(`📝 CORS enabled for: ${CORS_ORIGIN}`);
});

// Seed initial templates
function seedTemplates() {
  try {
    const existingTemplates = Template.findAll();
    if (existingTemplates.length > 0) {
      console.log("Templates already seeded");
      return;
    }

    // Avail Bridge & Stake Template
    Template.create({
      name: "Bridge USDC & Stake on Aave",
      description:
        "Bridge USDC from Ethereum to Polygon and automatically stake in Aave protocol using Avail Nexus",
      category: "crosschain",
      nodes: [
        {
          id: "trigger-1",
          type: "trigger",
          title: "Manual Trigger",
          icon: "⚡",
          position: { x: 400, y: 100 },
          inputs: {},
        },
        {
          id: "avail-bridge-1",
          type: "avail-bridge-execute",
          title: "Avail Bridge & Execute",
          icon: "🌉",
          position: { x: 400, y: 250 },
          inputs: {
            sourceChain: "ethereum",
            targetChain: "polygon",
            token: "USDC",
            amount: "100",
            executeContract: "0x...",
            executeFunction: "deposit",
          },
        },
        {
          id: "notify-1",
          type: "notification",
          title: "Send Notification",
          icon: "📧",
          position: { x: 400, y: 400 },
          inputs: {},
        },
      ],
      connections: [
        { from: "trigger-1", to: "avail-bridge-1" },
        { from: "avail-bridge-1", to: "notify-1" },
      ],
      tags: ["avail", "crosschain", "defi", "bridge", "aave"],
      featured: true,
      createdBy: "system",
    });

    // Simple Bridge Template
    Template.create({
      name: "Simple Token Bridge",
      description: "Bridge tokens between chains using Avail Nexus",
      category: "crosschain",
      nodes: [
        {
          id: "trigger-1",
          type: "trigger",
          title: "Manual Trigger",
          icon: "⚡",
          position: { x: 400, y: 100 },
          inputs: {},
        },
        {
          id: "avail-bridge-1",
          type: "avail-bridge",
          title: "Avail Bridge",
          icon: "🔗",
          position: { x: 400, y: 250 },
          inputs: {
            sourceChain: "ethereum",
            targetChain: "arbitrum",
            token: "ETH",
            amount: "1",
          },
        },
      ],
      connections: [{ from: "trigger-1", to: "avail-bridge-1" }],
      tags: ["avail", "crosschain", "bridge"],
      featured: true,
      createdBy: "system",
    });

    // Hedera Agent Workflow Template
    Template.create({
      name: "Hedera AI Agent Bridge",
      description:
        "Telegram → AI Decision → Bridge workflow using Hedera Agent Kit with A2A communication",
      category: "hedera",
      nodes: [
        {
          id: "trigger-1",
          type: "trigger",
          title: "Manual Trigger",
          icon: "⚡",
          position: { x: 400, y: 100 },
          inputs: {},
        },
        {
          id: "hedera-agent-1",
          type: "hedera-agent",
          title: "Hedera Agent System",
          icon: "🤖",
          position: { x: 400, y: 250 },
          inputs: {
            chatId: "workflow-demo",
          },
        },
        {
          id: "notify-1",
          type: "notification",
          title: "Send Notification",
          icon: "📧",
          position: { x: 400, y: 400 },
          inputs: {},
        },
      ],
      connections: [
        { from: "trigger-1", to: "hedera-agent-1" },
        { from: "hedera-agent-1", to: "notify-1" },
      ],
      tags: ["hedera", "agent", "ai", "a2a", "bridge"],
      featured: true,
      createdBy: "system",
    });

    console.log("✅ Default templates seeded successfully");
  } catch (error) {
    console.error("Error seeding templates:", error);
  }
}
