'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Lightbulb, 
  Zap,
  RefreshCw,
  Target,
  Link,
  Shield,
  Clock,
  Filter
} from 'lucide-react';
import { Client, Worker, Task, BusinessRule, AIRuleRecommendation } from '@/types';
import { AIEngine } from '@/lib/ai-engine';

interface RuleBuilderProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  businessRules: BusinessRule[];
  onRulesChange: (rules: BusinessRule[]) => void;
}

export default function RuleBuilder({ 
  clients, 
  workers, 
  tasks, 
  businessRules, 
  onRulesChange 
}: RuleBuilderProps) {
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRuleRecommendation[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    type: 'coRun',
    name: '',
    description: '',
    parameters: {},
    priority: 1,
    active: true
  });

  const aiEngine = useMemo(() => new AIEngine(clients, workers, tasks), [clients, workers, tasks]);

  const handleAddRule = () => {
    if (!newRule.name || !newRule.description) return;

    const rule: BusinessRule = {
      id: `rule-${Date.now()}`,
      type: newRule.type!,
      name: newRule.name,
      description: newRule.description,
      parameters: newRule.parameters || {},
      priority: newRule.priority || 1,
      active: newRule.active !== false
    };

    onRulesChange([...businessRules, rule]);
    setNewRule({
      type: 'coRun',
      name: '',
      description: '',
      parameters: {},
      priority: 1,
      active: true
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    onRulesChange(businessRules.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    onRulesChange(businessRules.map(rule => 
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    ));
  };

  const processNaturalLanguageRule = async () => {
    if (!naturalLanguageRule.trim()) return;

    setIsProcessingNL(true);
    try {
      const rule = await aiEngine.convertToRule(naturalLanguageRule);
      if (rule) {
        onRulesChange([...businessRules, rule]);
        setNaturalLanguageRule('');
      }
    } catch (error) {
      console.error('Failed to process natural language rule:', error);
    } finally {
      setIsProcessingNL(false);
    }
  };

  const generateAIRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    try {
      const recommendations = await aiEngine.generateRuleRecommendations();
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const acceptRecommendation = (recommendation: AIRuleRecommendation) => {
    const rule: BusinessRule = {
      id: recommendation.id,
      type: recommendation.type,
      name: recommendation.description,
      description: recommendation.reasoning,
      parameters: recommendation.parameters,
      priority: 1,
      active: true
    };

    onRulesChange([...businessRules, rule]);
    setAiRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'coRun': return <Link className="h-4 w-4" />;
      case 'slotRestriction': return <Shield className="h-4 w-4" />;
      case 'loadLimit': return <Target className="h-4 w-4" />;
      case 'phaseWindow': return <Clock className="h-4 w-4" />;
      case 'patternMatch': return <Filter className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'coRun': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'slotRestriction': return 'bg-green-100 text-green-800 border-green-200';
      case 'loadLimit': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'phaseWindow': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'patternMatch': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Rules</h2>
          <p className="text-muted-foreground">
            Define constraints and requirements for resource allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {businessRules.length} rule{businessRules.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            onClick={generateAIRecommendations}
            disabled={isGeneratingRecommendations}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isGeneratingRecommendations ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            AI Suggestions
          </Button>
        </div>
      </div>

      <Tabs defaultValue="natural" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="natural">Natural Language</TabsTrigger>
          <TabsTrigger value="manual">Manual Builder</TabsTrigger>
          <TabsTrigger value="existing">Existing Rules</TabsTrigger>
        </TabsList>

        {/* Natural Language Tab */}
        <TabsContent value="natural" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Natural Language Rule Creation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe your business rule in plain English, and AI will convert it to a structured rule
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nlRule">Describe your rule</Label>
                <Textarea
                  id="nlRule"
                  placeholder="e.g., 'Tasks T001 and T002 must run together' or 'Limit Frontend workers to maximum 3 tasks per phase'"
                  value={naturalLanguageRule}
                  onChange={(e) => setNaturalLanguageRule(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={processNaturalLanguageRule}
                disabled={isProcessingNL || !naturalLanguageRule.trim()}
                className="flex items-center gap-2"
              >
                {isProcessingNL ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Create Rule
              </Button>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Examples:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>"Tasks T001 and T002 must run together"</li>
                    <li>"Limit Backend workers to maximum 2 tasks per phase"</li>
                    <li>"Task T003 can only run in phases 1-3"</li>
                    <li>"Workers in Healthcare group need at least 2 common slots"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {aiRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Rule Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getRuleColor(recommendation.type)}>
                            {getRuleIcon(recommendation.type)}
                            {recommendation.type}
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(recommendation.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="font-medium mb-1">{recommendation.description}</p>
                        <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptRecommendation(recommendation)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAiRecommendations(prev => prev.filter(r => r.id !== recommendation.id))}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Builder Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manual Rule Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleType">Rule Type</Label>
                  <Select
                    value={newRule.type}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coRun">Co-run Tasks</SelectItem>
                      <SelectItem value="slotRestriction">Slot Restriction</SelectItem>
                      <SelectItem value="loadLimit">Load Limit</SelectItem>
                      <SelectItem value="phaseWindow">Phase Window</SelectItem>
                      <SelectItem value="patternMatch">Pattern Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newRule.priority?.toString()}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High (1)</SelectItem>
                      <SelectItem value="2">Medium (2)</SelectItem>
                      <SelectItem value="3">Low (3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleDescription">Description</Label>
                <Textarea
                  id="ruleDescription"
                  placeholder="Describe what this rule does"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleAddRule}
                disabled={!newRule.name || !newRule.description}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Rules Tab */}
        <TabsContent value="existing" className="space-y-4">
          {businessRules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No rules defined yet</h3>
                <p className="text-muted-foreground">
                  Create your first business rule using natural language or the manual builder
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {businessRules.map((rule, index) => (
                  <Card key={rule.id} className={`${rule.active ? '' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getRuleColor(rule.type)}>
                              {getRuleIcon(rule.type)}
                              {rule.type}
                            </Badge>
                            <Badge variant="secondary">
                              Priority {rule.priority}
                            </Badge>
                            <Switch
                              checked={rule.active}
                              onCheckedChange={() => handleToggleRule(rule.id)}
                            />
                          </div>
                          <h4 className="font-medium mb-1">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}