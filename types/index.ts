export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
}

export interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  message: string;
  entity: 'client' | 'worker' | 'task';
  entityId: string;
  field?: string;
  suggestion?: string;
}

export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride';
  name: string;
  description: string;
  parameters: Record<string, any>;
  priority: number;
  active: boolean;
}

export interface PriorityWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairness: number;
  workloadBalance: number;
  skillMatch: number;
  phasePreference: number;
}

export interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  businessRules: BusinessRule[];
  priorityWeights: PriorityWeights;
  isLoading: boolean;
  uploadProgress: number;
}

export interface AISearchResult {
  entity: 'client' | 'worker' | 'task';
  matches: any[];
  confidence: number;
  query: string;
}

export interface AIRuleRecommendation {
  id: string;
  type: BusinessRule['type'];
  description: string;
  confidence: number;
  parameters: Record<string, any>;
  reasoning: string;
}