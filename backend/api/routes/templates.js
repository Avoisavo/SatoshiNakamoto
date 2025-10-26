import express from "express";
import { Template } from "../models/Template.js";

const router = express.Router();

// Get all templates
router.get("/", (req, res) => {
  try {
    const { category, featured } = req.query;

    let templates;
    if (featured === "true") {
      templates = Template.findFeatured();
    } else {
      templates = Template.findAll(category || null);
    }

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get template by ID
router.get("/:id", (req, res) => {
  try {
    const template = Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Create template
router.post("/", (req, res) => {
  try {
    const {
      name,
      description,
      category,
      nodes,
      connections,
      tags,
      featured,
      createdBy,
    } = req.body;

    if (!name || !nodes) {
      return res.status(400).json({ error: "Name and nodes are required" });
    }

    const template = Template.create({
      name,
      description,
      category,
      nodes,
      connections,
      tags,
      featured,
      createdBy,
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

export default router;
