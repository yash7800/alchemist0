import { Client, Worker, Task, ValidationError } from '@/types';

export class DataValidator {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  constructor(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  validateAll(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    errors.push(...this.validateMissingColumns());
    errors.push(...this.validateDuplicateIDs());
    errors.push(...this.validateMalformedLists());
    errors.push(...this.validateOutOfRangeValues());
    errors.push(...this.validateBrokenJSON());
    errors.push(...this.validateUnknownReferences());
    errors.push(...this.validateCircularCoRuns());
    errors.push(...this.validateOverloadedWorkers());
    errors.push(...this.validatePhaseSlotSaturation());
    errors.push(...this.validateSkillCoverage());
    errors.push(...this.validateMaxConcurrency());
    errors.push(...this.validateConflictingRules());

    return errors;
  }

  private validateMissingColumns(): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredClientFields = ['ClientID', 'ClientName', 'PriorityLevel'];
    const requiredWorkerFields = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots'];
    const requiredTaskFields = ['TaskID', 'TaskName', 'Duration', 'RequiredSkills'];

    // Check if any required fields are missing in the data
    this.clients.forEach(client => {
      requiredClientFields.forEach(field => {
        if (!client[field as keyof Client] || client[field as keyof Client] === '') {
          errors.push({
            id: `missing-${client.ClientID}-${field}`,
            type: 'error',
            message: `Missing required field: ${field}`,
            entity: 'client',
            entityId: client.ClientID,
            field: field,
            suggestion: `Please provide a value for ${field}`
          });
        }
      });
    });

    return errors;
  }

  private validateDuplicateIDs(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for duplicate client IDs
    const clientIds = new Set<string>();
    this.clients.forEach(client => {
      if (clientIds.has(client.ClientID)) {
        errors.push({
          id: `duplicate-client-${client.ClientID}`,
          type: 'error',
          message: `Duplicate ClientID: ${client.ClientID}`,
          entity: 'client',
          entityId: client.ClientID,
          suggestion: 'Ensure all ClientIDs are unique'
        });
      }
      clientIds.add(client.ClientID);
    });

    // Check for duplicate worker IDs
    const workerIds = new Set<string>();
    this.workers.forEach(worker => {
      if (workerIds.has(worker.WorkerID)) {
        errors.push({
          id: `duplicate-worker-${worker.WorkerID}`,
          type: 'error',
          message: `Duplicate WorkerID: ${worker.WorkerID}`,
          entity: 'worker',
          entityId: worker.WorkerID,
          suggestion: 'Ensure all WorkerIDs are unique'
        });
      }
      workerIds.add(worker.WorkerID);
    });

    // Check for duplicate task IDs
    const taskIds = new Set<string>();
    this.tasks.forEach(task => {
      if (taskIds.has(task.TaskID)) {
        errors.push({
          id: `duplicate-task-${task.TaskID}`,
          type: 'error',
          message: `Duplicate TaskID: ${task.TaskID}`,
          entity: 'task',
          entityId: task.TaskID,
          suggestion: 'Ensure all TaskIDs are unique'
        });
      }
      taskIds.add(task.TaskID);
    });

    return errors;
  }

  private validateMalformedLists(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.workers.forEach(worker => {
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        if (!Array.isArray(slots) || !slots.every(slot => typeof slot === 'number')) {
          errors.push({
            id: `malformed-slots-${worker.WorkerID}`,
            type: 'error',
            message: `Malformed AvailableSlots: ${worker.AvailableSlots}`,
            entity: 'worker',
            entityId: worker.WorkerID,
            field: 'AvailableSlots',
            suggestion: 'AvailableSlots should be an array of numbers, e.g., [1,2,3]'
          });
        }
      } catch {
        errors.push({
          id: `invalid-slots-${worker.WorkerID}`,
          type: 'error',
          message: `Invalid AvailableSlots format: ${worker.AvailableSlots}`,
          entity: 'worker',
          entityId: worker.WorkerID,
          field: 'AvailableSlots',
          suggestion: 'AvailableSlots should be an array of numbers, e.g., [1,2,3]'
        });
      }
    });

    return errors;
  }

  private validateOutOfRangeValues(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.clients.forEach(client => {
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          id: `priority-range-${client.ClientID}`,
          type: 'error',
          message: `PriorityLevel out of range: ${client.PriorityLevel}`,
          entity: 'client',
          entityId: client.ClientID,
          field: 'PriorityLevel',
          suggestion: 'PriorityLevel must be between 1 and 5'
        });
      }
    });

    this.tasks.forEach(task => {
      if (task.Duration < 1) {
        errors.push({
          id: `duration-range-${task.TaskID}`,
          type: 'error',
          message: `Duration must be at least 1: ${task.Duration}`,
          entity: 'task',
          entityId: task.TaskID,
          field: 'Duration',
          suggestion: 'Duration should be a positive number'
        });
      }
    });

    return errors;
  }

  private validateBrokenJSON(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.clients.forEach(client => {
      if (client.AttributesJSON && client.AttributesJSON.trim() !== '') {
        try {
          JSON.parse(client.AttributesJSON);
        } catch {
          errors.push({
            id: `broken-json-${client.ClientID}`,
            type: 'error',
            message: `Invalid JSON in AttributesJSON`,
            entity: 'client',
            entityId: client.ClientID,
            field: 'AttributesJSON',
            suggestion: 'Please provide valid JSON format'
          });
        }
      }
    });

    return errors;
  }

  private validateUnknownReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    const taskIds = new Set(this.tasks.map(task => task.TaskID));

    this.clients.forEach(client => {
      if (client.RequestedTaskIDs) {
        const requestedIds = client.RequestedTaskIDs.split(',').map(id => id.trim());
        requestedIds.forEach(taskId => {
          if (!taskIds.has(taskId)) {
            errors.push({
              id: `unknown-task-${client.ClientID}-${taskId}`,
              type: 'error',
              message: `Unknown TaskID referenced: ${taskId}`,
              entity: 'client',
              entityId: client.ClientID,
              field: 'RequestedTaskIDs',
              suggestion: `TaskID ${taskId} does not exist in tasks data`
            });
          }
        });
      }
    });

    return errors;
  }

  private validateCircularCoRuns(): ValidationError[] {
    // Placeholder for circular dependency detection
    return [];
  }

  private validateOverloadedWorkers(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.workers.forEach(worker => {
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        if (Array.isArray(slots) && slots.length < worker.MaxLoadPerPhase) {
          errors.push({
            id: `overloaded-${worker.WorkerID}`,
            type: 'warning',
            message: `Worker has more MaxLoadPerPhase (${worker.MaxLoadPerPhase}) than AvailableSlots (${slots.length})`,
            entity: 'worker',
            entityId: worker.WorkerID,
            suggestion: 'Consider reducing MaxLoadPerPhase or increasing AvailableSlots'
          });
        }
      } catch {
        // Skip if AvailableSlots is malformed (handled elsewhere)
      }
    });

    return errors;
  }

  private validatePhaseSlotSaturation(): ValidationError[] {
    // Placeholder for phase-slot saturation analysis
    return [];
  }

  private validateSkillCoverage(): ValidationError[] {
    const errors: ValidationError[] = [];
    const workerSkills = new Set<string>();
    
    this.workers.forEach(worker => {
      const skills = worker.Skills.split(',').map(skill => skill.trim());
      skills.forEach(skill => workerSkills.add(skill));
    });

    this.tasks.forEach(task => {
      const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim());
      requiredSkills.forEach(skill => {
        if (!workerSkills.has(skill)) {
          errors.push({
            id: `skill-coverage-${task.TaskID}-${skill}`,
            type: 'error',
            message: `No worker has required skill: ${skill}`,
            entity: 'task',
            entityId: task.TaskID,
            field: 'RequiredSkills',
            suggestion: `Add workers with skill "${skill}" or remove this skill requirement`
          });
        }
      });
    });

    return errors;
  }

  private validateMaxConcurrency(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.tasks.forEach(task => {
      const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim());
      const qualifiedWorkers = this.workers.filter(worker => {
        const workerSkills = worker.Skills.split(',').map(skill => skill.trim());
        return requiredSkills.every(skill => workerSkills.includes(skill));
      });

      if (task.MaxConcurrent > qualifiedWorkers.length) {
        errors.push({
          id: `max-concurrent-${task.TaskID}`,
          type: 'warning',
          message: `MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          entity: 'task',
          entityId: task.TaskID,
          field: 'MaxConcurrent',
          suggestion: `Consider reducing MaxConcurrent to ${qualifiedWorkers.length} or adding more qualified workers`
        });
      }
    });

    return errors;
  }

  private validateConflictingRules(): ValidationError[] {
    // Placeholder for rule conflict detection
    return [];
  }
}