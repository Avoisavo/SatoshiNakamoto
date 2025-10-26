import db from "../db/database.js";
import { randomBytes } from "crypto";

export class Execution {
  static create({ workflowId, status, logs, errorMessage, txHashes }) {
    const id = randomBytes(16).toString("hex");
    const startTime = Date.now();

    const stmt = db.prepare(`
      INSERT INTO executions (id, workflowId, status, startTime, logs, errorMessage, txHashes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      workflowId,
      status,
      startTime,
      JSON.stringify(logs || []),
      errorMessage || null,
      JSON.stringify(txHashes || [])
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare("SELECT * FROM executions WHERE id = ?");
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      logs: JSON.parse(row.logs || "[]"),
      txHashes: JSON.parse(row.txHashes || "[]"),
    };
  }

  static findByWorkflowId(workflowId) {
    const stmt = db.prepare(
      "SELECT * FROM executions WHERE workflowId = ? ORDER BY startTime DESC"
    );
    const rows = stmt.all(workflowId);

    return rows.map((row) => ({
      ...row,
      logs: JSON.parse(row.logs || "[]"),
      txHashes: JSON.parse(row.txHashes || "[]"),
    }));
  }

  static update(id, { status, endTime, logs, errorMessage, txHashes }) {
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (endTime !== undefined) {
      updates.push("endTime = ?");
      values.push(endTime);
    }
    if (logs !== undefined) {
      updates.push("logs = ?");
      values.push(JSON.stringify(logs));
    }
    if (errorMessage !== undefined) {
      updates.push("errorMessage = ?");
      values.push(errorMessage);
    }
    if (txHashes !== undefined) {
      updates.push("txHashes = ?");
      values.push(JSON.stringify(txHashes));
    }

    if (updates.length === 0) return null;

    values.push(id);

    const stmt = db.prepare(`
      UPDATE executions 
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }
}
