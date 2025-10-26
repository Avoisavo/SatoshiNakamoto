const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Record<string, unknown>[];
  connections?: Record<string, unknown>[];
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  nodes: Record<string, unknown>[];
  connections?: Record<string, unknown>[];
  tags: string[];
  featured: boolean;
  createdBy: string;
  createdAt: number;
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: {
  name: string;
  description?: string;
  nodes: Record<string, unknown>[];
  connections?: Record<string, unknown>[];
  userId?: string;
}): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/workflows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create workflow");
  }

  return response.json();
}

/**
 * Get all workflows for a user
 */
export async function getWorkflows(
  userId: string = "anonymous"
): Promise<Workflow[]> {
  const response = await fetch(`${API_URL}/api/workflows?userId=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch workflows");
  }

  return response.json();
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/workflows/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch workflow");
  }

  return response.json();
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  id: string,
  data: {
    name: string;
    description?: string;
    nodes: Record<string, unknown>[];
    connections?: Record<string, unknown>[];
  }
): Promise<Workflow> {
  const response = await fetch(`${API_URL}/api/workflows/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update workflow");
  }

  return response.json();
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/workflows/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete workflow");
  }
}

/**
 * Get all templates
 */
export async function getTemplates(params?: {
  category?: string;
  featured?: boolean;
}): Promise<Template[]> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set("category", params.category);
  if (params?.featured) queryParams.set("featured", "true");

  const url = `${API_URL}/api/templates${
    queryParams.toString() ? "?" + queryParams.toString() : ""
  }`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch templates");
  }

  return response.json();
}

/**
 * Get a template by ID
 */
export async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`${API_URL}/api/templates/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch template");
  }

  return response.json();
}

/**
 * Create a workflow from a template
 */
export async function createWorkflowFromTemplate(
  templateId: string,
  workflowName?: string,
  userId?: string
): Promise<Workflow> {
  const template = await getTemplate(templateId);

  return createWorkflow({
    name: workflowName || template.name,
    description: template.description,
    nodes: template.nodes,
    connections: template.connections,
    userId,
  });
}
