// Workflow storage utility for auto-save and restore

export interface WorkflowData {
  id: string;
  title: string;
  nodes: Record<string, unknown>[];
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  lastUpdated: string;
  created: string;
  isActive: boolean;
}

const WORKFLOWS_KEY = 'linkedout_workflows';

// Get all workflows
export const getAllWorkflows = (): WorkflowData[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(WORKFLOWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading workflows:', error);
    return [];
  }
};

// Get a specific workflow by ID
export const getWorkflow = (id: string): WorkflowData | null => {
  const workflows = getAllWorkflows();
  return workflows.find(w => w.id === id) || null;
};

// Save or update a workflow
export const saveWorkflow = (workflow: WorkflowData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const workflows = getAllWorkflows();
    const existingIndex = workflows.findIndex(w => w.id === workflow.id);
    
    const updatedWorkflow = {
      ...workflow,
      lastUpdated: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      workflows[existingIndex] = updatedWorkflow;
    } else {
      workflows.push(updatedWorkflow);
    }
    
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
    console.log('Workflow saved:', updatedWorkflow.title);
  } catch (error) {
    console.error('Error saving workflow:', error);
  }
};

// Delete a workflow
export const deleteWorkflow = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const workflows = getAllWorkflows();
    const filtered = workflows.filter(w => w.id !== id);
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(filtered));
    console.log('Workflow deleted:', id);
  } catch (error) {
    console.error('Error deleting workflow:', error);
  }
};

// Update workflow status
export const updateWorkflowStatus = (id: string, isActive: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const workflows = getAllWorkflows();
    const workflow = workflows.find(w => w.id === id);
    
    if (workflow) {
      workflow.isActive = isActive;
      workflow.lastUpdated = new Date().toISOString();
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
    }
  } catch (error) {
    console.error('Error updating workflow status:', error);
  }
};

// Create a new workflow
export const createNewWorkflow = (title: string = 'My workflow'): WorkflowData => {
  const now = new Date().toISOString();
  return {
    id: `workflow-${Date.now()}`,
    title,
    nodes: [],
    transform: { x: 0, y: 0, scale: 1 },
    lastUpdated: now,
    created: now,
    isActive: false,
  };
};

// Format relative time (like "16 hours ago")
export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
};

// Format creation date (like "20 October")
export const formatCreationDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  return `${day} ${month}`;
};

