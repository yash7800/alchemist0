// app/components/AISearchPanel.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Client {
  id: string;
  ClientName: string;
  PriorityLevel: 'High' | 'Medium' | 'Low';
  Group?: string;
  Location?: string;
}

interface Worker {
  id: string;
  WorkerName: string;
  Skills: string[];
  Availability: string[];
}

interface Task {
  id: string;
  TaskName: string;
  Duration: number;
  RequiredSkills: string[];
  Group?: string;
  Attributes?: Record<string, string>;
}

interface AISearchResult {
  entity: string;
  matches: any[];
  confidence: number;
  explanation?: string;
}

interface AISearchPanelProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

class MockAIEngine {
  constructor(private clients: Client[], private workers: Worker[], private tasks: Task[]) {}

  private matchPhrase(query: string, phrases: string[]): boolean {
    const lowerQuery = query.toLowerCase();
    return phrases.some(phrase => lowerQuery.includes(phrase.toLowerCase()));
  }

  private extractNumber(query: string): number | null {
    const match = query.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private extractAttribute(query: string): string | null {
    const afterAttribute = query.split('attribute')[1]?.trim();
    return afterAttribute || null;
  }

  async searchData(query: string): Promise<AISearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const lowerQuery = query.toLowerCase();
    const results: AISearchResult[] = [];

    if (this.matchPhrase(lowerQuery, ['task', 'tasks'])) {
      const taskMatches = this.tasks.filter(task => {
        if (this.matchPhrase(lowerQuery, ['duration'])) {
          const minDuration = this.extractNumber(lowerQuery) || 2;
          return task.Duration > minDuration;
        }
        if (this.matchPhrase(lowerQuery, ['attribute'])) {
          const attr = this.extractAttribute(lowerQuery);
          return Object.values(task.Attributes || {}).some(val => val.toLowerCase().includes(attr || ''));
        }
        if (this.matchPhrase(lowerQuery, ['group'])) {
          const group = lowerQuery.split('group')[1]?.trim();
          return group && task.Group?.toLowerCase().includes(group);
        }
        return true;
      });
      if (taskMatches.length)
        results.push({ entity: 'task', matches: taskMatches, confidence: 0.85, explanation: `Found ${taskMatches.length} tasks matching "${query}"` });
    }

    if (this.matchPhrase(lowerQuery, ['worker', 'workers'])) {
      const workerMatches = this.workers.filter(worker => {
        if (this.matchPhrase(lowerQuery, ['skill'])) {
          const skill = lowerQuery.split('skill')[1]?.trim();
          return skill && worker.Skills.some(s => s.toLowerCase().includes(skill));
        }
        if (this.matchPhrase(lowerQuery, ['available'])) {
          const phase = this.extractNumber(lowerQuery)?.toString();
          return phase && worker.Availability.includes(phase);
        }
        return true;
      });
      if (workerMatches.length)
        results.push({ entity: 'worker', matches: workerMatches, confidence: 0.78, explanation: `Found ${workerMatches.length} workers matching "${query}"` });
    }

    if (this.matchPhrase(lowerQuery, ['client', 'clients'])) {
      const clientMatches = this.clients.filter(client => {
        if (this.matchPhrase(lowerQuery, ['priority'])) {
          const priority = lowerQuery.includes('high') ? 'High' : lowerQuery.includes('medium') ? 'Medium' : lowerQuery.includes('low') ? 'Low' : null;
          return priority && client.PriorityLevel === priority;
        }
        if (this.matchPhrase(lowerQuery, ['group'])) {
          const group = lowerQuery.split('group')[1]?.trim();
          return group && client.Group?.toLowerCase().includes(group);
        }
        return true;
      });
      if (clientMatches.length)
        results.push({ entity: 'client', matches: clientMatches, confidence: 0.92, explanation: `Found ${clientMatches.length} clients matching "${query}"` });
    }

    return results.length ? results : [{ entity: 'none', matches: [], confidence: 0, explanation: `No results found for "${query}"` }];
  }
}

export default function AISearchPanel({ clients, workers, tasks }: AISearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AISearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const aiEngine = useMemo(() => new MockAIEngine(clients, workers, tasks), [clients, workers, tasks]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await aiEngine.searchData(searchQuery);
      setSearchResults(results);
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI-Powered Search
        </CardTitle>
        <p className="text-sm text-muted-foreground">Search your data using natural language queries</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about tasks, workers or clients"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Zap className="animate-pulse h-4 w-4" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge>{result.entity}s</Badge>
                    <Badge variant="outline">{Math.round(result.confidence * 100)}% confidence</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">{result.explanation}</p>
                </CardHeader>
                <CardContent>
                  {result.matches.map((match, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-md text-sm">
                      {JSON.stringify(match)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
