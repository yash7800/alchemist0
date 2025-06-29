import { Client, Worker, Task, AISearchResult, AIRuleRecommendation, BusinessRule } from '@/types';

export class AIEngine {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  constructor(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  // Natural Language Search
  async searchData(query: string): Promise<AISearchResult[]> {
    const results: AISearchResult[] = [];
    const normalizedQuery = query.toLowerCase();

    // Parse common search patterns
    const durationPattern = /duration.*?(\d+)/i;
    const phasePattern = /phase.*?(\d+)/i;
    const skillPattern = /skill.*?([a-zA-Z]+)/i;
    const priorityPattern = /priority.*?(\d+)/i;

    // Search tasks
    if (normalizedQuery.includes('task')) {
      const taskMatches = this.tasks.filter(task => {
        let match = false;
        
        // Check duration conditions
        const durationMatch = normalizedQuery.match(durationPattern);
        if (durationMatch) {
          const targetDuration = parseInt(durationMatch[1]);
          if (normalizedQuery.includes('more than') && task.Duration > targetDuration) match = true;
          if (normalizedQuery.includes('less than') && task.Duration < targetDuration) match = true;
          if (normalizedQuery.includes('equal') && task.Duration === targetDuration) match = true;
        }

        // Check phase conditions
        const phaseMatch = normalizedQuery.match(phasePattern);
        if (phaseMatch) {
          const targetPhase = phaseMatch[1];
          if (task.PreferredPhases.includes(targetPhase)) match = true;
        }

        // Check skill conditions
        const skillMatch = normalizedQuery.match(skillPattern);
        if (skillMatch) {
          const targetSkill = skillMatch[1];
          if (task.RequiredSkills.toLowerCase().includes(targetSkill.toLowerCase())) match = true;
        }

        // General text search
        if (normalizedQuery.includes(task.TaskName.toLowerCase()) || 
            normalizedQuery.includes(task.Category.toLowerCase())) {
          match = true;
        }

        return match;
      });

      if (taskMatches.length > 0) {
        results.push({
          entity: 'task',
          matches: taskMatches,
          confidence: 0.85,
          query: query
        });
      }
    }

    // Search clients
    if (normalizedQuery.includes('client')) {
      const clientMatches = this.clients.filter(client => {
        let match = false;

        // Check priority conditions
        const priorityMatch = normalizedQuery.match(priorityPattern);
        if (priorityMatch) {
          const targetPriority = parseInt(priorityMatch[1]);
          if (normalizedQuery.includes('priority') && client.PriorityLevel === targetPriority) match = true;
          if (normalizedQuery.includes('high priority') && client.PriorityLevel >= 4) match = true;
          if (normalizedQuery.includes('low priority') && client.PriorityLevel <= 2) match = true;
        }

        // General text search
        if (normalizedQuery.includes(client.ClientName.toLowerCase()) ||
            normalizedQuery.includes(client.GroupTag.toLowerCase())) {
          match = true;
        }

        return match;
      });

      if (clientMatches.length > 0) {
        results.push({
          entity: 'client',
          matches: clientMatches,
          confidence: 0.80,
          query: query
        });
      }
    }

    // Search workers
    if (normalizedQuery.includes('worker')) {
      const workerMatches = this.workers.filter(worker => {
        let match = false;

        // Check skill conditions
        const skillMatch = normalizedQuery.match(skillPattern);
        if (skillMatch) {
          const targetSkill = skillMatch[1];
          if (worker.Skills.toLowerCase().includes(targetSkill.toLowerCase())) match = true;
        }

        // Check availability
        if (normalizedQuery.includes('available')) {
          try {
            const slots = JSON.parse(worker.AvailableSlots);
            if (Array.isArray(slots) && slots.length > 0) match = true;
          } catch {
            // Skip malformed slots
          }
        }

        // General text search
        if (normalizedQuery.includes(worker.WorkerName.toLowerCase()) ||
            normalizedQuery.includes(worker.WorkerGroup.toLowerCase())) {
          match = true;
        }

        return match;
      });

      if (workerMatches.length > 0) {
        results.push({
          entity: 'worker',
          matches: workerMatches,
          confidence: 0.80,
          query: query
        });
      }
    }

    return results;
  }

  // Natural Language to Rules Converter
  async convertToRule(naturalLanguageRule: string): Promise<BusinessRule | null> {
    const rule = naturalLanguageRule.toLowerCase();
    
    // Co-run detection
    if (rule.includes('together') || rule.includes('same time') || rule.includes('co-run')) {
      const taskPattern = /task[s]?\s*([a-zA-Z0-9,\s]+)/i;
      const taskMatch = rule.match(taskPattern);
      
      if (taskMatch) {
        const taskIds = taskMatch[1].split(',').map(id => id.trim());
        return {
          id: `corun-${Date.now()}`,
          type: 'coRun',
          name: 'Co-run Tasks',
          description: `Tasks ${taskIds.join(', ')} must run together`,
          parameters: { tasks: taskIds },
          priority: 1,
          active: true
        };
      }
    }

    // Load limit detection
    if (rule.includes('limit') || rule.includes('maximum') || rule.includes('no more than')) {
      const limitPattern = /(\d+).*?tasks?/i;
      const limitMatch = rule.match(limitPattern);
      
      if (limitMatch) {
        const maxTasks = parseInt(limitMatch[1]);
        return {
          id: `loadlimit-${Date.now()}`,
          type: 'loadLimit',
          name: 'Load Limit',
          description: `Maximum ${maxTasks} tasks per phase`,
          parameters: { maxSlotsPerPhase: maxTasks },
          priority: 1,
          active: true
        };
      }
    }

    // Phase window detection
    if (rule.includes('phase') && (rule.includes('only') || rule.includes('must'))) {
      const phasePattern = /phase[s]?\s*(\d+(?:-\d+)?|\[\d+(?:,\d+)*\])/i;
      const phaseMatch = rule.match(phasePattern);
      
      if (phaseMatch) {
        const phaseSpec = phaseMatch[1];
        return {
          id: `phasewindow-${Date.now()}`,
          type: 'phaseWindow',
          name: 'Phase Window',
          description: `Restrict to phases ${phaseSpec}`,
          parameters: { allowedPhases: phaseSpec },
          priority: 1,
          active: true
        };
      }
    }

    return null;
  }

  // AI Rule Recommendations
  async generateRuleRecommendations(): Promise<AIRuleRecommendation[]> {
    const recommendations: AIRuleRecommendation[] = [];

    // Analyze task patterns for co-run recommendations
    const taskGroups = this.analyzeTaskPatterns();
    taskGroups.forEach(group => {
      if (group.tasks.length > 1) {
        recommendations.push({
          id: `corun-rec-${Date.now()}`,
          type: 'coRun',
          description: `Tasks ${group.tasks.join(', ')} often have similar requirements`,
          confidence: group.confidence,
          parameters: { tasks: group.tasks },
          reasoning: `These tasks share ${group.commonSkills.length} common skills and have similar durations`
        });
      }
    });

    // Analyze worker overload patterns
    const overloadedGroups = this.analyzeWorkerOverload();
    overloadedGroups.forEach(group => {
      recommendations.push({
        id: `loadlimit-rec-${Date.now()}`,
        type: 'loadLimit',
        description: `Limit ${group.workerGroup} to ${group.suggestedLimit} tasks per phase`,
        confidence: group.confidence,
        parameters: { 
          workerGroup: group.workerGroup,
          maxSlotsPerPhase: group.suggestedLimit 
        },
        reasoning: `Workers in ${group.workerGroup} are currently overloaded based on capacity analysis`
      });
    });

    // Analyze skill gaps
    const skillGaps = this.analyzeSkillGaps();
    skillGaps.forEach(gap => {
      recommendations.push({
        id: `skill-rec-${Date.now()}`,
        type: 'patternMatch',
        description: `Consider adding workers with ${gap.skill} skill`,
        confidence: gap.confidence,
        parameters: { skill: gap.skill },
        reasoning: `${gap.taskCount} tasks require ${gap.skill} but only ${gap.workerCount} workers have this skill`
      });
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeTaskPatterns() {
    const groups: Array<{
      tasks: string[];
      commonSkills: string[];
      confidence: number;
    }> = [];

    // Group tasks by similar skill requirements
    const skillGroups = new Map<string, string[]>();
    
    this.tasks.forEach(task => {
      const skills = task.RequiredSkills.split(',').map(s => s.trim()).sort();
      const skillKey = skills.join('|');
      
      if (!skillGroups.has(skillKey)) {
        skillGroups.set(skillKey, []);
      }
      skillGroups.get(skillKey)!.push(task.TaskID);
    });

    skillGroups.forEach((taskIds, skillKey) => {
      if (taskIds.length > 1) {
        groups.push({
          tasks: taskIds,
          commonSkills: skillKey.split('|'),
          confidence: Math.min(0.9, 0.5 + (taskIds.length * 0.1))
        });
      }
    });

    return groups;
  }

  private analyzeWorkerOverload() {
    const overloadedGroups: Array<{
      workerGroup: string;
      suggestedLimit: number;
      confidence: number;
    }> = [];

    const groupCapacity = new Map<string, number[]>();
    
    this.workers.forEach(worker => {
      if (!groupCapacity.has(worker.WorkerGroup)) {
        groupCapacity.set(worker.WorkerGroup, []);
      }
      groupCapacity.get(worker.WorkerGroup)!.push(worker.MaxLoadPerPhase);
    });

    groupCapacity.forEach((capacities, group) => {
      const avgCapacity = capacities.reduce((a, b) => a + b, 0) / capacities.length;
      const maxCapacity = Math.max(...capacities);
      
      if (maxCapacity > avgCapacity * 1.5) {
        overloadedGroups.push({
          workerGroup: group,
          suggestedLimit: Math.floor(avgCapacity * 1.2),
          confidence: 0.75
        });
      }
    });

    return overloadedGroups;
  }

  private analyzeSkillGaps() {
    const skillGaps: Array<{
      skill: string;
      taskCount: number;
      workerCount: number;
      confidence: number;
    }> = [];

    const skillDemand = new Map<string, number>();
    const skillSupply = new Map<string, number>();

    // Count skill demand from tasks
    this.tasks.forEach(task => {
      const skills = task.RequiredSkills.split(',').map(s => s.trim());
      skills.forEach(skill => {
        skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
      });
    });

    // Count skill supply from workers
    this.workers.forEach(worker => {
      const skills = worker.Skills.split(',').map(s => s.trim());
      skills.forEach(skill => {
        skillSupply.set(skill, (skillSupply.get(skill) || 0) + 1);
      });
    });

    // Find gaps
    skillDemand.forEach((demand, skill) => {
      const supply = skillSupply.get(skill) || 0;
      const ratio = supply / demand;
      
      if (ratio < 0.5) {
        skillGaps.push({
          skill,
          taskCount: demand,
          workerCount: supply,
          confidence: Math.min(0.9, 0.5 + (demand - supply) * 0.1)
        });
      }
    });

    return skillGaps;
  }

  // AI Data Corrections
  async suggestCorrections(data: any[], entity: 'client' | 'worker' | 'task'): Promise<Array<{
    id: string;
    field: string;
    currentValue: any;
    suggestedValue: any;
    confidence: number;
    reasoning: string;
  }>> {
    const corrections: Array<{
      id: string;
      field: string;
      currentValue: any;
      suggestedValue: any;
      confidence: number;
      reasoning: string;
    }> = [];

    if (entity === 'client') {
      data.forEach(client => {
        // Suggest priority corrections based on task complexity
        if (client.RequestedTaskIDs) {
          const requestedTasks = client.RequestedTaskIDs.split(',').map((id: string) => id.trim());
          const complexTasks = requestedTasks.filter((taskId: string) => {
            const task = this.tasks.find(t => t.TaskID === taskId);
            return task && (task.Duration > 3 || task.RequiredSkills.split(',').length > 2);
          });

          if (complexTasks.length > 0 && client.PriorityLevel < 3) {
            corrections.push({
              id: client.ClientID,
              field: 'PriorityLevel',
              currentValue: client.PriorityLevel,
              suggestedValue: 4,
              confidence: 0.75,
              reasoning: `Client has ${complexTasks.length} complex tasks but low priority`
            });
          }
        }
      });
    }

    return corrections;
  }

  // Smart Header Mapping
  mapHeaders(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    const clientFieldMappings = {
      'client_id': 'ClientID',
      'clientid': 'ClientID',
      'id': 'ClientID',
      'client_name': 'ClientName',
      'clientname': 'ClientName',
      'name': 'ClientName',
      'priority': 'PriorityLevel',
      'priority_level': 'PriorityLevel',
      'requested_tasks': 'RequestedTaskIDs',
      'task_ids': 'RequestedTaskIDs',
      'group': 'GroupTag',
      'attributes': 'AttributesJSON'
    };

    const workerFieldMappings = {
      'worker_id': 'WorkerID',
      'workerid': 'WorkerID',
      'id': 'WorkerID',
      'worker_name': 'WorkerName',
      'workername': 'WorkerName',
      'name': 'WorkerName',
      'skill': 'Skills',
      'skills': 'Skills',
      'available_slots': 'AvailableSlots',
      'slots': 'AvailableSlots',
      'max_load': 'MaxLoadPerPhase',
      'maxload': 'MaxLoadPerPhase',
      'group': 'WorkerGroup',
      'qualification': 'QualificationLevel'
    };

    const taskFieldMappings = {
      'task_id': 'TaskID',
      'taskid': 'TaskID',
      'id': 'TaskID',
      'task_name': 'TaskName',
      'taskname': 'TaskName',
      'name': 'TaskName',
      'category': 'Category',
      'duration': 'Duration',
      'required_skills': 'RequiredSkills',
      'skills': 'RequiredSkills',
      'preferred_phases': 'PreferredPhases',
      'phases': 'PreferredPhases',
      'max_concurrent': 'MaxConcurrent',
      'concurrent': 'MaxConcurrent'
    };

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Try all mappings
      const allMappings = { ...clientFieldMappings, ...workerFieldMappings, ...taskFieldMappings };
      
      if (allMappings[normalizedHeader]) {
        mapping[header] = allMappings[normalizedHeader];
      } else {
        // Fuzzy matching for partial matches
        const bestMatch = Object.keys(allMappings).find(key => 
          key.includes(normalizedHeader) || normalizedHeader.includes(key)
        );
        if (bestMatch) {
          mapping[header] = allMappings[bestMatch];
        }
      }
    });

    return mapping;
  }
}