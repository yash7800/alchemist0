'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  Zap,
  RefreshCw,
  Target,
  Users,
  Briefcase,
  FileText
} from 'lucide-react';
import { ValidationError, Client, Worker, Task } from '@/types';
import { AIEngine } from '@/lib/ai-engine';

interface ValidationPanelProps {
  validationErrors: ValidationError[];
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataChange: (entityType: 'client' | 'worker' | 'task', data: any[]) => void;
}

export default function ValidationPanel({ 
  validationErrors, 
  clients, 
  workers, 
  tasks, 
  onDataChange 
}: ValidationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'error' | 'warning'>('all');
  const [selectedEntity, setSelectedEntity] = useState<'all' | 'client' | 'worker' | 'task'>('all');
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [aiCorrections, setAiCorrections] = useState<any[]>([]);

  const aiEngine = useMemo(() => new AIEngine(clients, workers, tasks), [clients, workers, tasks]);

  const filteredErrors = useMemo(() => {
    return validationErrors.filter(error => {
      const matchesSearch = error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           error.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           error.entityId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || error.type === selectedType;
      const matchesEntity = selectedEntity === 'all' || error.entity === selectedEntity;
      
      return matchesSearch && matchesType && matchesEntity;
    });
  }, [validationErrors, searchTerm, selectedType, selectedEntity]);

  const errorsByEntity = useMemo(() => {
    const summary = {
      client: { errors: 0, warnings: 0 },
      worker: { errors: 0, warnings: 0 },
      task: { errors: 0, warnings: 0 }
    };

    validationErrors.forEach(error => {
      if (error.type === 'error') {
        summary[error.entity].errors++;
      } else {
        summary[error.entity].warnings++;
      }
    });

    return summary;
  }, [validationErrors]);

  const generateAICorrections = async () => {
    setIsGeneratingRecommendations(true);
    try {
      const clientCorrections = await aiEngine.suggestCorrections(clients, 'client');
      const workerCorrections = await aiEngine.suggestCorrections(workers, 'worker');
      const taskCorrections = await aiEngine.suggestCorrections(tasks, 'task');
      
      setAiCorrections([...clientCorrections, ...workerCorrections, ...taskCorrections]);
    } catch (error) {
      console.error('Failed to generate AI corrections:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const applyCorrection = (correction: any) => {
    const entityType = correction.id.startsWith('C') ? 'client' : 
                      correction.id.startsWith('W') ? 'worker' : 'task';
    
    if (entityType === 'client') {
      const updatedClients = clients.map(client => 
        client.ClientID === correction.id 
          ? { ...client, [correction.field]: correction.suggestedValue }
          : client
      );
      onDataChange('client', updatedClients);
    } else if (entityType === 'worker') {
      const updatedWorkers = workers.map(worker => 
        worker.WorkerID === correction.id 
          ? { ...worker, [correction.field]: correction.suggestedValue }
          : worker
      );
      onDataChange('worker', updatedWorkers);
    } else if (entityType === 'task') {
      const updatedTasks = tasks.map(task => 
        task.TaskID === correction.id 
          ? { ...task, [correction.field]: correction.suggestedValue }
          : task
      );
      onDataChange('task', updatedTasks);
    }

    // Remove the applied correction
    setAiCorrections(prev => prev.filter(c => c !== correction));
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'client': return <Users className="h-4 w-4" />;
      case 'worker': return <Briefcase className="h-4 w-4" />;
      case 'task': return <FileText className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'worker': return 'bg-green-100 text-green-800 border-green-200';
      case 'task': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalErrors = validationErrors.filter(e => e.type === 'error').length;
  const totalWarnings = validationErrors.filter(e => e.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Validation</h2>
          <p className="text-muted-foreground">
            Review and fix validation issues in your data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generateAICorrections}
            disabled={isGeneratingRecommendations}
            className="flex items-center gap-2"
          >
            {isGeneratingRecommendations ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            AI Suggestions
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{totalErrors + totalWarnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{totalWarnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalErrors === 0 ? '100%' : `${Math.max(0, Math.round(100 - (totalErrors * 10)))}%`}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Corrections */}
      {aiCorrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI-Suggested Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiCorrections.map((correction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getEntityColor(correction.id.startsWith('C') ? 'client' : correction.id.startsWith('W') ? 'worker' : 'task')}>
                        {correction.id}
                      </Badge>
                      <span className="font-medium">{correction.field}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{correction.reasoning}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600">Current: {correction.currentValue}</span>
                      <span>→</span>
                      <span className="text-green-600">Suggested: {correction.suggestedValue}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {Math.round(correction.confidence * 100)}% confidence
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => applyCorrection(correction)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Validation Issues</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
              </select>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Entities</option>
                <option value="client">Clients</option>
                <option value="worker">Workers</option>
                <option value="task">Tasks</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8">
              {validationErrors.length === 0 ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">All validations passed!</h3>
                  <p className="text-muted-foreground">Your data is clean and ready to use.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No issues match your filters</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredErrors.map((error, index) => (
                  <div
                    key={error.id}
                    className={`p-4 border rounded-lg ${
                      error.type === 'error' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded ${
                          error.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {error.type === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getEntityColor(error.entity)}>
                              {getEntityIcon(error.entity)}
                              {error.entity}
                            </Badge>
                            <Badge variant="outline">
                              {error.entityId}
                            </Badge>
                            {error.field && (
                              <Badge variant="secondary">
                                {error.field}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium mb-1">{error.message}</p>
                          {error.suggestion && (
                            <p className="text-sm text-muted-foreground">
                              💡 {error.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={error.type === 'error' ? 'destructive' : 'secondary'}>
                        {error.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Entity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Errors</span>
                <Badge variant="destructive" className="text-xs">
                  {errorsByEntity.client.errors}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warnings</span>
                <Badge variant="secondary" className="text-xs">
                  {errorsByEntity.client.warnings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Errors</span>
                <Badge variant="destructive" className="text-xs">
                  {errorsByEntity.worker.errors}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warnings</span>
                <Badge variant="secondary" className="text-xs">
                  {errorsByEntity.worker.warnings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Errors</span>
                <Badge variant="destructive" className="text-xs">
                  {errorsByEntity.task.errors}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warnings</span>
                <Badge variant="secondary" className="text-xs">
                  {errorsByEntity.task.warnings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}