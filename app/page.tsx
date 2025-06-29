'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Database,
  Download,
  FileText,
  Settings,
  Sparkles,
  Target,
  Upload,
  Users
} from 'lucide-react';
import { useCallback, useState } from 'react';

import AISearchPanel from '@/components/ai/AISearchPanel';
import ExportPanel from '@/components/export/ExportPanel';
import DataGrid from '@/components/grid/DataGrid';
import PriorityPanel from '@/components/priority/PriorityPanel';
import RuleBuilder from '@/components/rules/RuleBuilder';
import FileUploader from '@/components/upload/FileUploader';
import ValidationPanel from '@/components/validation/ValidationPanel';

import { useToast } from '@/hooks/use-toast';
import { FileParser } from '@/lib/file-parser';
import { DataValidator } from '@/lib/validation';
import { Client, DataState, Task, Worker } from '@/types';

export default function Home() {
  const { toast } = useToast();
  const [dataState, setDataState] = useState<DataState>({
    clients: [],
    workers: [],
    tasks: [],
    validationErrors: [],
    businessRules: [],
    priorityWeights: {
      priorityLevel: 0.3,
      taskFulfillment: 0.25,
      fairness: 0.2,
      workloadBalance: 0.15,
      skillMatch: 0.05,
      phasePreference: 0.05
    },
    isLoading: false,
    uploadProgress: 0
  });

  const [activeTab, setActiveTab] = useState('upload');

  const handleDataUploaded = useCallback((data: any[], entityType: 'client' | 'worker' | 'task') => {
    setDataState(prev => {
      const newState = { ...prev };
      
      if (entityType === 'client') {
        newState.clients = data as Client[];
      } else if (entityType === 'worker') {
        newState.workers = data as Worker[];
      } else if (entityType === 'task') {
        newState.tasks = data as Task[];
      }

      // Run validation
      const validator = new DataValidator(newState.clients, newState.workers, newState.tasks);
      newState.validationErrors = validator.validateAll();

      return newState;
    });

    toast({
      title: "Data uploaded successfully",
      description: `${data.length} ${entityType} records processed`,
    });

    // Auto-navigate to data view
    setActiveTab('data');
  }, [toast]);

  const handleError = useCallback((error: string) => {
    toast({
      title: "Upload failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const handleCellEdit = useCallback((entityType: 'client' | 'worker' | 'task', rowIndex: number, field: string, value: any) => {
    setDataState(prev => {
      const newState = { ...prev };
      
      if (entityType === 'client') {
        newState.clients[rowIndex] = { ...newState.clients[rowIndex], [field]: value };
      } else if (entityType === 'worker') {
        newState.workers[rowIndex] = { ...newState.workers[rowIndex], [field]: value };
      } else if (entityType === 'task') {
        newState.tasks[rowIndex] = { ...newState.tasks[rowIndex], [field]: value };
      }

      // Re-run validation
      const validator = new DataValidator(newState.clients, newState.workers, newState.tasks);
      newState.validationErrors = validator.validateAll();

      return newState;
    });
  }, []);

  const handleDataChange = useCallback((entityType: 'client' | 'worker' | 'task', data: any[]) => {
    setDataState(prev => {
      const newState = { ...prev };
      
      if (entityType === 'client') {
        newState.clients = data;
      } else if (entityType === 'worker') {
        newState.workers = data;
      } else if (entityType === 'task') {
        newState.tasks = data;
      }

      // Re-run validation
      const validator = new DataValidator(newState.clients, newState.workers, newState.tasks);
      newState.validationErrors = validator.validateAll();

      return newState;
    });
  }, []);

  const loadSampleData = () => {
    const parser = new FileParser();
    const sampleData = parser.generateSampleData();
    
    setDataState(prev => {
      const newState = {
        ...prev,
        clients: sampleData.clients,
        workers: sampleData.workers,
        tasks: sampleData.tasks
      };

      // Run validation
      const validator = new DataValidator(newState.clients, newState.workers, newState.tasks);
      newState.validationErrors = validator.validateAll();

      return newState;
    });

    toast({
      title: "Sample data loaded",
      description: "Explore the app with pre-loaded sample data",
    });

    setActiveTab('data');
  };

  const getValidationSummary = () => {
    const errors = dataState.validationErrors.filter(v => v.type === 'error').length;
    const warnings = dataState.validationErrors.filter(v => v.type === 'warning').length;
    return { errors, warnings };
  };

  const { errors, warnings } = getValidationSummary();
  const hasData = dataState.clients.length > 0 || dataState.workers.length > 0 || dataState.tasks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Data Alchemist
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-Powered Resource Allocation Configurator
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {hasData && (
                <div className="flex items-center gap-2">
                  {errors > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors} Error{errors !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {warnings > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {warnings} Warning{warnings !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {errors === 0 && warnings === 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3" />
                      All Clear
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadSampleData}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Load Sample
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="priorities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Priorities
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to Data Alchemist</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Transform your messy spreadsheets into clean, validated data with AI assistance
              </p>
              
              {!hasData && (
                <Alert className="max-w-2xl mx-auto">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Upload your CSV or XLSX files for clients, workers, and tasks. Our AI will automatically 
                    parse and validate your data, fixing common issues and providing intelligent suggestions.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUploader
                entityType="client"
                onDataUploaded={(data) => handleDataUploaded(data, 'client')}
                onError={handleError}
              />
              <FileUploader
                entityType="worker"
                onDataUploaded={(data) => handleDataUploaded(data, 'worker')}
                onError={handleError}
              />
              <FileUploader
                entityType="task"
                onDataUploaded={(data) => handleDataUploaded(data, 'task')}
                onError={handleError}
              />
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Data Overview</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {dataState.clients.length} Clients
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {dataState.workers.length} Workers
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {dataState.tasks.length} Tasks
                </Badge>
              </div>
            </div>

            <AISearchPanel 
              clients={dataState.clients}
              workers={dataState.workers}
              tasks={dataState.tasks}
            />

            <Tabs defaultValue="clients" className="space-y-4">
              <TabsList>
                <TabsTrigger value="clients">Clients ({dataState.clients.length})</TabsTrigger>
                <TabsTrigger value="workers">Workers ({dataState.workers.length})</TabsTrigger>
                <TabsTrigger value="tasks">Tasks ({dataState.tasks.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="clients">
                <DataGrid
                  data={dataState.clients}
                  entityType="client"
                  validationErrors={dataState.validationErrors}
                  onDataChange={(data) => handleDataChange('client', data)}
                  onCellEdit={(rowIndex, field, value) => handleCellEdit('client', rowIndex, field, value)}
                />
              </TabsContent>
              
              <TabsContent value="workers">
                <DataGrid
                  data={dataState.workers}
                  entityType="worker"
                  validationErrors={dataState.validationErrors}
                  onDataChange={(data) => handleDataChange('worker', data)}
                  onCellEdit={(rowIndex, field, value) => handleCellEdit('worker', rowIndex, field, value)}
                />
              </TabsContent>
              
              <TabsContent value="tasks">
                <DataGrid
                  data={dataState.tasks}
                  entityType="task"
                  validationErrors={dataState.validationErrors}
                  onDataChange={(data) => handleDataChange('task', data)}
                  onCellEdit={(rowIndex, field, value) => handleCellEdit('task', rowIndex, field, value)}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation">
            <ValidationPanel
              validationErrors={dataState.validationErrors}
              clients={dataState.clients}
              workers={dataState.workers}
              tasks={dataState.tasks}
              onDataChange={handleDataChange}
            />
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <RuleBuilder
              clients={dataState.clients}
              workers={dataState.workers}
              tasks={dataState.tasks}
              businessRules={dataState.businessRules}
              onRulesChange={(rules) => setDataState(prev => ({ ...prev, businessRules: rules }))}
            />
          </TabsContent>

          {/* Priorities Tab */}
          <TabsContent value="priorities">
            <PriorityPanel
              priorityWeights={dataState.priorityWeights}
              onWeightsChange={(weights) => setDataState(prev => ({ ...prev, priorityWeights: weights }))}
            />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <ExportPanel
              clients={dataState.clients}
              workers={dataState.workers}
              tasks={dataState.tasks}
              businessRules={dataState.businessRules}
              priorityWeights={dataState.priorityWeights}
              validationErrors={dataState.validationErrors}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}