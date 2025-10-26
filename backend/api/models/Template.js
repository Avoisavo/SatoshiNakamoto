import db from "../db/database.js";
import { randomBytes } from "crypto";

export class Template {
  static create({
    name,
    description,
    category,
    nodes,
    connections,
    tags,
    featured,
    createdBy,
  }) {
    const id = randomBytes(16).toString("hex");
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO templates (id, name, description, category, nodes, connections, tags, featured, createdBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      description || "",
      category || "general",
      JSON.stringify(nodes),
      JSON.stringify(connections || []),
      JSON.stringify(tags || []),
      featured ? 1 : 0,
      createdBy || "system",
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare("SELECT * FROM templates WHERE id = ?");
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      nodes: JSON.parse(row.nodes),
      connections: JSON.parse(row.connections || "[]"),
      tags: JSON.parse(row.tags || "[]"),
      featured: Boolean(row.featured),
    };
  }

  static findAll(category = null) {
    let stmt;
    let rows;

    if (category) {
      stmt = db.prepare(
        "SELECT * FROM templates WHERE category = ? ORDER BY featured DESC, createdAt DESC"
      );
      rows = stmt.all(category);
    } else {
      stmt = db.prepare(
        "SELECT * FROM templates ORDER BY featured DESC, createdAt DESC"
      );
      rows = stmt.all();
    }

    return rows.map((row) => ({
      ...row,
      nodes: JSON.parse(row.nodes),
      connections: JSON.parse(row.connections || "[]"),
      tags: JSON.parse(row.tags || "[]"),
      featured: Boolean(row.featured),
    }));
  }

  static findFeatured() {
    const stmt = db.prepare(
      "SELECT * FROM templates WHERE featured = 1 ORDER BY createdAt DESC"
    );
    const rows = stmt.all();

    return rows.map((row) => ({
      ...row,
      nodes: JSON.parse(row.nodes),
      connections: JSON.parse(row.connections || "[]"),
      tags: JSON.parse(row.tags || "[]"),
      featured: Boolean(row.featured),
    }));
  }
}
