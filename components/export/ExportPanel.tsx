'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Database,
  Target
} from 'lucide-react';
import { Client, Worker, Task, BusinessRule, PriorityWeights, ValidationError } from '@/types';

interface ExportPanelProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  businessRules: BusinessRule[];
  priorityWeights: PriorityWeights;
  validationErrors: ValidationError[];
}

export default function ExportPanel({ 
  clients, 
  workers, 
  tasks, 
  businessRules, 
  priorityWeights,
  validationErrors 
}: ExportPanelProps) {
  const [selectedExports, setSelectedExports] = useState({
    clients: true,
    workers: true,
    tasks: true,
    rules: true,
    priorities: true
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleToggleExport = (type: keyof typeof selectedExports) => {
    setSelectedExports(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      // Export clients
      if (selectedExports.clients && clients.length > 0) {
        const clientHeaders = ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];
        const clientCSV = convertToCSV(clients, clientHeaders);
        downloadFile(clientCSV, 'clients_cleaned.csv');
      }

      // Export workers
      if (selectedExports.workers && workers.length > 0) {
        const workerHeaders = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
        const workerCSV = convertToCSV(workers, workerHeaders);
        downloadFile(workerCSV, 'workers_cleaned.csv');
      }

      // Export tasks
      if (selectedExports.tasks && tasks.length > 0) {
        const taskHeaders = ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];
        const taskCSV = convertToCSV(tasks, taskHeaders);
        downloadFile(taskCSV, 'tasks_cleaned.csv');
      }

      // Export rules
      if (selectedExports.rules) {
        const rulesConfig = {
          rules: businessRules,
          metadata: {
            exportedAt: new Date().toISOString(),
            totalRules: businessRules.length,
            activeRules: businessRules.filter(r => r.active).length
          }
        };
        downloadFile(JSON.stringify(rulesConfig, null, 2), 'rules.json', 'application/json');
      }

      // Export priorities
      if (selectedExports.priorities) {
        const priorityConfig = {
          priorityWeights,
          metadata: {
            exportedAt: new Date().toISOString(),
            totalWeight: Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0)
          }
        };
        downloadFile(JSON.stringify(priorityConfig, null, 2), 'priorities.json', 'application/json');
      }

      // Export summary report
      const summaryReport = {
        exportSummary: {
          exportedAt: new Date().toISOString(),
          dataStats: {
            clients: clients.length,
            workers: workers.length,
            tasks: tasks.length,
            rules: businessRules.length,
            activeRules: businessRules.filter(r => r.active).length
          },
          validationSummary: {
            totalIssues: validationErrors.length,
            errors: validationErrors.filter(v => v.type === 'error').length,
            warnings: validationErrors.filter(v => v.type === 'warning').length
          },
          priorityWeights,
          businessRules: businessRules.map(rule => ({
            id: rule.id,
            type: rule.type,
            name: rule.name,
            active: rule.active,
            priority: rule.priority
          }))
        }
      };
      downloadFile(JSON.stringify(summaryReport, null, 2), 'export_summary.json', 'application/json');

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const hasErrors = validationErrors.filter(v => v.type === 'error').length > 0;
  const hasWarnings = validationErrors.filter(v => v.type === 'warning').length > 0;
  const hasData = clients.length > 0 || workers.length > 0 || tasks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Export Configuration</h2>
        <p className="text-muted-foreground">
          Download your cleaned data and configuration files
        </p>
      </div>

      {/* Export Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Records</p>
                <p className="text-2xl font-bold">{clients.length + workers.length + tasks.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Rules</p>
                <p className="text-2xl font-bold">{businessRules.length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validation Status</p>
                <p className="text-2xl font-bold">
                  {hasErrors ? 'Issues' : 'Clean'}
                </p>
              </div>
              {hasErrors ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Warning */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your data has {validationErrors.filter(v => v.type === 'error').length} validation error(s). 
            Consider fixing these issues before exporting to ensure data quality.
          </AlertDescription>
        </Alert>
      )}

      {hasWarnings && !hasErrors && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your data has {validationErrors.filter(v => v.type === 'warning').length} warning(s). 
            These are non-critical issues but you may want to review them.
          </AlertDescription>
        </Alert>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clients"
                  checked={selectedExports.clients}
                  onCheckedChange={() => handleToggleExport('clients')}
                  disabled={clients.length === 0}
                />
                <label
                  htmlFor="clients"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Clients Data
                  <Badge variant="outline">{clients.length} records</Badge>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workers"
                  checked={selectedExports.workers}
                  onCheckedChange={() => handleToggleExport('workers')}
                  disabled={workers.length === 0}
                />
                <label
                  htmlFor="workers"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Workers Data
                  <Badge variant="outline">{workers.length} records</Badge>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tasks"
                  checked={selectedExports.tasks}
                  onCheckedChange={() => handleToggleExport('tasks')}
                  disabled={tasks.length === 0}
                />
                <label
                  htmlFor="tasks"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Tasks Data
                  <Badge variant="outline">{tasks.length} records</Badge>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rules"
                  checked={selectedExports.rules}
                  onCheckedChange={() => handleToggleExport('rules')}
                />
                <label
                  htmlFor="rules"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Business Rules
                  <Badge variant="outline">{businessRules.length} rules</Badge>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="priorities"
                  checked={selectedExports.priorities}
                  onCheckedChange={() => handleToggleExport('priorities')}
                />
                <label
                  htmlFor="priorities"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Priority Configuration
                  <Badge variant="outline">weights</Badge>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Files to be exported:</span>
              <Badge variant="outline">
                {Object.values(selectedExports).filter(Boolean).length + 1} files
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {selectedExports.clients && clients.length > 0 && <p>• clients_cleaned.csv</p>}
              {selectedExports.workers && workers.length > 0 && <p>• workers_cleaned.csv</p>}
              {selectedExports.tasks && tasks.length > 0 && <p>• tasks_cleaned.csv</p>}
              {selectedExports.rules && <p>• rules.json</p>}
              {selectedExports.priorities && <p>• priorities.json</p>}
              <p>• export_summary.json</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-center">
        <Button
          onClick={exportData}
          disabled={isExporting || !hasData}
          size="lg"
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Data Package
            </>
          )}
        </Button>
      </div>

      {!hasData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No data available for export. Please upload some data first.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}