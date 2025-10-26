import express from "express";
import { Execution } from "../models/Execution.js";

const router = express.Router();

// Create execution log
router.post("/", (req, res) => {
  try {
    const { workflowId, status, logs, errorMessage, txHashes } = req.body;

    if (!workflowId || !status) {
      return res
        .status(400)
        .json({ error: "workflowId and status are required" });
    }

    const execution = Execution.create({
      workflowId,
      status,
      logs,
      errorMessage,
      txHashes,
    });

    res.status(201).json(execution);
  } catch (error) {
    console.error("Error creating execution log:", error);
    res.status(500).json({ error: "Failed to create execution log" });
  }
});

// Get execution history for a workflow
router.get("/:workflowId", (req, res) => {
  try {
    const executions = Execution.findByWorkflowId(req.params.workflowId);
    res.json(executions);
  } catch (error) {
    console.error("Error fetching execution history:", error);
    res.status(500).json({ error: "Failed to fetch execution history" });
  }
});

// Update execution
router.put("/:id", (req, res) => {
  try {
    const { status, endTime, logs, errorMessage, txHashes } = req.body;

    const execution = Execution.update(req.params.id, {
      status,
      endTime,
      logs,
      errorMessage,
      txHashes,
    });

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json(execution);
  } catch (error) {
    console.error("Error updating execution:", error);
    res.status(500).json({ error: "Failed to update execution" });
  }
});

export default router;
