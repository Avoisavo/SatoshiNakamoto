import express from "express";
import { Workflow } from "../models/Workflow.js";

const router = express.Router();

// Create workflow
router.post("/", (req, res) => {
  try {
    const { name, description, nodes, connections, userId } = req.body;

    if (!name || !nodes) {
      return res.status(400).json({ error: "Name and nodes are required" });
    }

    const workflow = Workflow.create({
      name,
      description,
      nodes,
      connections,
      userId,
    });
    res.status(201).json(workflow);
  } catch (error) {
    console.error("Error creating workflow:", error);
    res.status(500).json({ error: "Failed to create workflow" });
  }
});

// Get all workflows
router.get("/", (req, res) => {
  try {
    const { userId = "anonymous" } = req.query;
    const workflows = Workflow.findAll(userId);
    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// Get workflow by ID
router.get("/:id", (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

// Update workflow
router.put("/:id", (req, res) => {
  try {
    const { name, description, nodes, connections } = req.body;

    if (!name || !nodes) {
      return res.status(400).json({ error: "Name and nodes are required" });
    }

    const workflow = Workflow.update(req.params.id, {
      name,
      description,
      nodes,
      connections,
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    res.status(500).json({ error: "Failed to update workflow" });
  }
});

// Delete workflow
router.delete("/:id", (req, res) => {
  try {
    const deleted = Workflow.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({ error: "Failed to delete workflow" });
  }
});

export default router;
