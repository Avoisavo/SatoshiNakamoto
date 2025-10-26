import db from "../db/database.js";
import { randomBytes } from "crypto";

export class Workflow {
  static create({ name, description, nodes, connections, userId }) {
    const id = randomBytes(16).toString("hex");
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO workflows (id, name, description, nodes, connections, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      description || "",
      JSON.stringify(nodes),
      JSON.stringify(connections || []),
      userId || "anonymous",
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare("SELECT * FROM workflows WHERE id = ?");
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      nodes: JSON.parse(row.nodes),
      connections: JSON.parse(row.connections || "[]"),
    };
  }

  static findAll(userId = "anonymous") {
    const stmt = db.prepare(
      "SELECT * FROM workflows WHERE userId = ? ORDER BY updatedAt DESC"
    );
    const rows = stmt.all(userId);

    return rows.map((row) => ({
      ...row,
      nodes: JSON.parse(row.nodes),
      connections: JSON.parse(row.connections || "[]"),
    }));
  }

  static update(id, { name, description, nodes, connections }) {
    const now = Date.now();

    const stmt = db.prepare(`
      UPDATE workflows 
      SET name = ?, description = ?, nodes = ?, connections = ?, updatedAt = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      description || "",
      JSON.stringify(nodes),
      JSON.stringify(connections || []),
      now,
      id
    );

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare("DELETE FROM workflows WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
