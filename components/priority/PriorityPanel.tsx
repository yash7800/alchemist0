'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Star, 
  Users, 
  Scale, 
  TrendingUp, 
  Award,
  RotateCcw,
  Info
} from 'lucide-react';
import { PriorityWeights } from '@/types';

interface PriorityPanelProps {
  priorityWeights: PriorityWeights;
  onWeightsChange: (weights: PriorityWeights) => void;
}

const presetProfiles = {
  'maximize-fulfillment': {
    name: 'Maximize Fulfillment',
    description: 'Prioritize completing as many client requests as possible',
    weights: {
      priorityLevel: 0.15,
      taskFulfillment: 0.35,
      fairness: 0.15,
      workloadBalance: 0.15,
      skillMatch: 0.15,
      phasePreference: 0.05
    }
  },
  'fair-distribution': {
    name: 'Fair Distribution',
    description: 'Ensure equitable resource allocation across all clients',
    weights: {
      priorityLevel: 0.2,
      taskFulfillment: 0.2,
      fairness: 0.3,
      workloadBalance: 0.15,
      skillMatch: 0.1,
      phasePreference: 0.05
    }
  },
  'minimize-workload': {
    name: 'Minimize Workload',
    description: 'Focus on balancing worker capacity and preventing overload',
    weights: {
      priorityLevel: 0.15,
      taskFulfillment: 0.2,
      fairness: 0.15,
      workloadBalance: 0.35,
      skillMatch: 0.1,
      phasePreference: 0.05
    }
  },
  'skill-optimization': {
    name: 'Skill Optimization',
    description: 'Prioritize optimal skill matching for better outcomes',
    weights: {
      priorityLevel: 0.2,
      taskFulfillment: 0.2,
      fairness: 0.15,
      workloadBalance: 0.15,
      skillMatch: 0.25,
      phasePreference: 0.05
    }
  },
  'priority-focused': {
    name: 'Priority Focused',
    description: 'Heavily weight client priority levels',
    weights: {
      priorityLevel: 0.4,
      taskFulfillment: 0.25,
      fairness: 0.15,
      workloadBalance: 0.1,
      skillMatch: 0.05,
      phasePreference: 0.05
    }
  }
};

export default function PriorityPanel({ priorityWeights, onWeightsChange }: PriorityPanelProps) {
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const handleWeightChange = (field: keyof PriorityWeights, value: number) => {
    const newWeights = { ...priorityWeights, [field]: value / 100 };
    
    // Ensure all weights sum to 1
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    if (total > 0) {
      Object.keys(newWeights).forEach(key => {
        newWeights[key as keyof PriorityWeights] = newWeights[key as keyof PriorityWeights] / total;
      });
    }
    
    onWeightsChange(newWeights);
    setActiveProfile(null);
  };

  const applyPreset = (profileKey: string) => {
    const profile = presetProfiles[profileKey as keyof typeof presetProfiles];
    onWeightsChange(profile.weights);
    setActiveProfile(profileKey);
  };

  const resetToDefaults = () => {
    onWeightsChange({
      priorityLevel: 0.3,
      taskFulfillment: 0.25,
      fairness: 0.2,
      workloadBalance: 0.15,
      skillMatch: 0.05,
      phasePreference: 0.05
    });
    setActiveProfile(null);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 0.3) return 'text-red-600';
    if (weight >= 0.2) return 'text-orange-600';
    if (weight >= 0.1) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getWeightIcon = (field: string) => {
    switch (field) {
      case 'priorityLevel': return <Star className="h-4 w-4" />;
      case 'taskFulfillment': return <Target className="h-4 w-4" />;
      case 'fairness': return <Scale className="h-4 w-4" />;
      case 'workloadBalance': return <TrendingUp className="h-4 w-4" />;
      case 'skillMatch': return <Award className="h-4 w-4" />;
      case 'phasePreference': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'priorityLevel': return 'Priority Level';
      case 'taskFulfillment': return 'Task Fulfillment';
      case 'fairness': return 'Fairness';
      case 'workloadBalance': return 'Workload Balance';
      case 'skillMatch': return 'Skill Match';
      case 'phasePreference': return 'Phase Preference';
      default: return field;
    }
  };

  const getFieldDescription = (field: string) => {
    switch (field) {
      case 'priorityLevel': return 'How much to consider client priority levels (1-5)';
      case 'taskFulfillment': return 'How important it is to fulfill requested tasks';
      case 'fairness': return 'Ensuring equitable distribution across clients';
      case 'workloadBalance': return 'Balancing workload across workers';
      case 'skillMatch': return 'Matching required skills with worker capabilities';
      case 'phasePreference': return 'Respecting task phase preferences';
      default: return '';
    }
  };

  const totalWeight = Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Priority Configuration</h2>
          <p className="text-muted-foreground">
            Configure the relative importance of different allocation criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeProfile && (
            <Badge variant="secondary">
              {presetProfiles[activeProfile as keyof typeof presetProfiles].name}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sliders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sliders">Weight Configuration</TabsTrigger>
          <TabsTrigger value="presets">Preset Profiles</TabsTrigger>
        </TabsList>

        {/* Sliders Tab */}
        <TabsContent value="sliders" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These weights determine how the allocation system balances different objectives. 
              Higher weights mean higher importance. All weights are automatically normalized to sum to 100%.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(priorityWeights).map(([field, weight]) => (
              <Card key={field}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getWeightIcon(field)}
                      <CardTitle className="text-lg">{getFieldLabel(field)}</CardTitle>
                    </div>
                    <Badge variant="outline" className={getWeightColor(weight)}>
                      {Math.round(weight * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getFieldDescription(field)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Slider
                      value={[Math.round(weight * 100)]}
                      onValueChange={(value) => handleWeightChange(field as keyof PriorityWeights, value[0])}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weight Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Weight:</span>
                  <Badge variant={Math.abs(totalWeight - 1) < 0.01 ? "outline" : "destructive"}>
                    {Math.round(totalWeight * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, totalWeight * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(presetProfiles).map(([key, profile]) => (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeProfile === key ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => applyPreset(key)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    {activeProfile === key && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(profile.weights).map(([field, weight]) => (
                      <div key={field} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          {getWeightIcon(field)}
                          <span>{getFieldLabel(field)}</span>
                        </div>
                        <Badge variant="outline" className={getWeightColor(weight)}>
                          {Math.round(weight * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}