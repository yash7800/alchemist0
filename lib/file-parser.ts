import * as XLSX from 'xlsx';
import { Client, Worker, Task } from '@/types';
import { AIEngine } from './ai-engine';

export class FileParser {
  private aiEngine: AIEngine;

  constructor() {
    this.aiEngine = new AIEngine([], [], []);
  }

  async parseFile(file: File, entityType: 'client' | 'worker' | 'task'): Promise<any[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      return this.parseCSV(file, entityType);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseXLSX(file, entityType);
    } else {
      throw new Error('Unsupported file format. Please use CSV or XLSX files.');
    }
  }

  private async parseCSV(file: File, entityType: 'client' | 'worker' | 'task'): Promise<any[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const mappedHeaders = this.aiEngine.mapHeaders(headers);
    
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        const mappedHeader = mappedHeaders[header] || header;
        row[mappedHeader] = values[index] || '';
      });
      
      data.push(this.normalizeRow(row, entityType));
    }

    return data;
  }

  private async parseXLSX(file: File, entityType: 'client' | 'worker' | 'task'): Promise<any[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = (jsonData[0] as any[]).map(h => String(h).trim());
    const mappedHeaders = this.aiEngine.mapHeaders(headers);
    
    const data: any[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i] as any[];
      const row: any = {};
      
      headers.forEach((header, index) => {
        const mappedHeader = mappedHeaders[header] || header;
        row[mappedHeader] = values[index] || '';
      });
      
      data.push(this.normalizeRow(row, entityType));
    }

    return data;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private normalizeRow(row: any, entityType: 'client' | 'worker' | 'task'): any {
    const normalized: any = { ...row };
    
    // Convert string numbers to actual numbers
    Object.keys(normalized).forEach(key => {
      const value = normalized[key];
      if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        if (key.includes('Level') || key.includes('Priority') || key.includes('Duration') || 
            key.includes('MaxLoad') || key.includes('MaxConcurrent') || key.includes('Qualification')) {
          normalized[key] = Number(value);
        }
      }
    });

    // Normalize arrays
    if (entityType === 'worker' && normalized.AvailableSlots) {
      if (typeof normalized.AvailableSlots === 'string') {
        try {
          // Try to parse as JSON first
          normalized.AvailableSlots = JSON.parse(normalized.AvailableSlots);
        } catch {
          // If not JSON, try to parse as comma-separated values
          const slots = normalized.AvailableSlots.split(',').map((s: string) => {
            const num = parseInt(s.trim());
            return isNaN(num) ? s.trim() : num;
          });
          normalized.AvailableSlots = JSON.stringify(slots);
        }
      }
    }

    // Normalize preferred phases
    if (entityType === 'task' && normalized.PreferredPhases) {
      if (typeof normalized.PreferredPhases === 'string') {
        // Handle range notation (e.g., "1-3")
        if (normalized.PreferredPhases.includes('-')) {
          const [start, end] = normalized.PreferredPhases.split('-').map(s => parseInt(s.trim()));
          const phases = [];
          for (let i = start; i <= end; i++) {
            phases.push(i);
          }
          normalized.PreferredPhases = JSON.stringify(phases);
        } else {
          try {
            JSON.parse(normalized.PreferredPhases);
          } catch {
            // Convert comma-separated to JSON array
            const phases = normalized.PreferredPhases.split(',').map((p: string) => {
              const num = parseInt(p.trim());
              return isNaN(num) ? p.trim() : num;
            });
            normalized.PreferredPhases = JSON.stringify(phases);
          }
        }
      }
    }

    return normalized;
  }

  // Generate sample data for testing
  generateSampleData(): { clients: Client[], workers: Worker[], tasks: Task[] } {
    const clients: Client[] = [
      {
        ClientID: 'C001',
        ClientName: 'TechCorp Solutions',
        PriorityLevel: 5,
        RequestedTaskIDs: 'T001,T002,T003',
        GroupTag: 'Enterprise',
        AttributesJSON: '{"industry": "Technology", "size": "Large"}'
      },
      {
        ClientID: 'C002',
        ClientName: 'Healthcare Plus',
        PriorityLevel: 4,
        RequestedTaskIDs: 'T004,T005',
        GroupTag: 'Healthcare',
        AttributesJSON: '{"industry": "Healthcare", "compliance": "HIPAA"}'
      },
      {
        ClientID: 'C003',
        ClientName: 'StartupX',
        PriorityLevel: 2,
        RequestedTaskIDs: 'T006,T007',
        GroupTag: 'Startup',
        AttributesJSON: '{"stage": "Series A", "team_size": 15}'
      }
    ];

    const workers: Worker[] = [
      {
        WorkerID: 'W001',
        WorkerName: 'Alice Johnson',
        Skills: 'JavaScript,React,Node.js',
        AvailableSlots: '[1,2,3,4,5]',
        MaxLoadPerPhase: 3,
        WorkerGroup: 'Frontend',
        QualificationLevel: 5
      },
      {
        WorkerID: 'W002',
        WorkerName: 'Bob Smith',
        Skills: 'Python,Django,PostgreSQL',
        AvailableSlots: '[1,3,5]',
        MaxLoadPerPhase: 2,
        WorkerGroup: 'Backend',
        QualificationLevel: 4
      },
      {
        WorkerID: 'W003',
        WorkerName: 'Carol Davis',
        Skills: 'Java,Spring,MongoDB',
        AvailableSlots: '[2,4,6]',
        MaxLoadPerPhase: 2,
        WorkerGroup: 'Backend',
        QualificationLevel: 4
      },
      {
        WorkerID: 'W004',
        WorkerName: 'David Wilson',
        Skills: 'React,TypeScript,GraphQL',
        AvailableSlots: '[1,2,3]',
        MaxLoadPerPhase: 3,
        WorkerGroup: 'Frontend',
        QualificationLevel: 5
      }
    ];

    const tasks: Task[] = [
      {
        TaskID: 'T001',
        TaskName: 'Frontend Development',
        Category: 'Development',
        Duration: 3,
        RequiredSkills: 'JavaScript,React',
        PreferredPhases: '[1,2,3]',
        MaxConcurrent: 2
      },
      {
        TaskID: 'T002',
        TaskName: 'API Integration',
        Category: 'Integration',
        Duration: 2,
        RequiredSkills: 'JavaScript,Node.js',
        PreferredPhases: '[2,3,4]',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T003',
        TaskName: 'Database Design',
        Category: 'Database',
        Duration: 4,
        RequiredSkills: 'PostgreSQL',
        PreferredPhases: '[1,2]',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T004',
        TaskName: 'HIPAA Compliance',
        Category: 'Compliance',
        Duration: 2,
        RequiredSkills: 'Java,Spring',
        PreferredPhases: '[3,4,5]',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T005',
        TaskName: 'Healthcare Dashboard',
        Category: 'UI/UX',
        Duration: 3,
        RequiredSkills: 'React,TypeScript',
        PreferredPhases: '[4,5,6]',
        MaxConcurrent: 2
      },
      {
        TaskID: 'T006',
        TaskName: 'MVP Development',
        Category: 'Development',
        Duration: 5,
        RequiredSkills: 'Python,Django',
        PreferredPhases: '[1,2,3,4,5]',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T007',
        TaskName: 'Mobile App',
        Category: 'Mobile',
        Duration: 4,
        RequiredSkills: 'React,GraphQL',
        PreferredPhases: '[3,4,5,6]',
        MaxConcurrent: 1
      }
    ];

    return { clients, workers, tasks };
  }
}