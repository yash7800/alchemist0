'use client';

import React, { useState, useMemo } from 'react';
import { Edit3, Save, X, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationError } from '@/types';

interface DataGridProps {
  data: any[];
  entityType: 'client' | 'worker' | 'task';
  validationErrors: ValidationError[];
  onDataChange: (data: any[]) => void;
  onCellEdit: (rowIndex: number, field: string, value: any) => void;
}

export default function DataGrid({ 
  data, 
  entityType, 
  validationErrors, 
  onDataChange, 
  onCellEdit 
}: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const getEntityLabel = () => {
    switch (entityType) {
      case 'client': return 'Clients';
      case 'worker': return 'Workers';
      case 'task': return 'Tasks';
      default: return 'Data';
    }
  };

  const getEntityErrors = (entityId: string) => {
    return validationErrors.filter(error => 
      error.entity === entityType && error.entityId === entityId
    );
  };

  const getCellErrors = (entityId: string, field: string) => {
    return validationErrors.filter(error => 
      error.entity === entityType && error.entityId === entityId && error.field === field
    );
  };

  const startEdit = (rowIndex: number, field: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, field });
    setEditValue(String(currentValue));
  };

  const saveEdit = () => {
    if (editingCell) {
      let processedValue: any = editValue;
      
      // Process value based on field type
      if (editValue.match(/^\d+$/)) {
        processedValue = parseInt(editValue);
      } else if (editValue.match(/^\d+\.\d+$/)) {
        processedValue = parseFloat(editValue);
      }
      
      onCellEdit(editingCell.row, editingCell.field, processedValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getFieldType = (field: string) => {
    if (field.includes('Level') || field.includes('Priority') || field.includes('Duration') || 
        field.includes('MaxLoad') || field.includes('MaxConcurrent') || field.includes('Qualification')) {
      return 'number';
    }
    return 'text';
  };

  const formatCellValue = (value: any, field: string) => {
    if (value === null || value === undefined) return '';
    
    // Handle JSON fields
    if (field.includes('JSON') || field.includes('Slots') || field.includes('Phases')) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.join(', ') : JSON.stringify(parsed);
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No {getEntityLabel().toLowerCase()} data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a file to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getEntityLabel()} Data
            <Badge variant="secondary">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${getEntityLabel().toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th key={column} className="text-left p-3 font-medium text-sm">
                    {column}
                  </th>
                ))}
                <th className="text-left p-3 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => {
                const entityId = row[`${entityType.charAt(0).toUpperCase() + entityType.slice(1)}ID`];
                const entityErrors = getEntityErrors(entityId);
                const hasErrors = entityErrors.length > 0;
                
                return (
                  <tr key={rowIndex} className={`border-b hover:bg-muted/50 transition-colors ${hasErrors ? 'bg-red-50/50' : ''}`}>
                    {columns.map((column) => {
                      const cellErrors = getCellErrors(entityId, column);
                      const hasCellErrors = cellErrors.length > 0;
                      const isEditing = editingCell?.row === rowIndex && editingCell?.field === column;
                      
                      return (
                        <td key={column} className={`p-3 relative ${hasCellErrors ? 'bg-red-100 border-red-200' : ''}`}>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type={getFieldType(column)}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0">
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                              onClick={() => startEdit(rowIndex, column, row[column])}
                            >
                              <span className="text-sm">
                                {formatCellValue(row[column], column)}
                              </span>
                              <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          
                          {hasCellErrors && (
                            <div className="absolute top-1 right-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3">
                      {hasErrors ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <Badge variant="destructive" className="text-xs">
                            {entityErrors.length} error{entityErrors.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Badge variant="outline" className="text-xs">
                            Valid
                          </Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No {getEntityLabel().toLowerCase()} found matching "{searchTerm}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}