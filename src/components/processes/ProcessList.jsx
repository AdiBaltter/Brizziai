
import React from 'react';
import { Process } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, ListChecks, Trash2, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';

const processTypeLabels = {
  'pre-sale': 'לפני מכירה',
  'service-delivery': 'במהלך השירות',
  'post-sale': 'אחרי השירות'
};

export default function ProcessList({ processes, onEdit, onUpdate, onDelete, onDuplicate }) {

  const handleToggleActive = async (process) => {
    try {
      const secureOps = new SecureEntityOperations(Process);
      await secureOps.secureUpdate(process.id, { is_active: !process.is_active });
      onUpdate();
    } catch (error) {
      console.error('Error toggling process status:', error);
    }
  };

  return (
    <div className="space-y-4">
      {processes.map(process => (
        <Card key={process.id} className="hover:shadow-md transition-shadow" style={{ borderRight: `4px solid ${process.color || '#3b82f6'}`}}>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks style={{color: process.color || '#3b82f6' }} />
                {process.name}
                {/* סימון טיוטא */}
                {!process.is_active && !process.id && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    טיוטא
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">{process.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(process)}>
                <Edit className="h-4 w-4 ml-2" />
                ערוך
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDuplicate(process)}>
                <Copy className="h-4 w-4 ml-2" />
                שכפל
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(process)}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                מחק
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>{process.stages?.length || 0} שלבים</span>
                <span>•</span>
                <span>{processTypeLabels[process.process_type] || 'כללי'}</span>
              </div>
               <div className="flex items-center gap-3" dir="ltr">
                  <Switch
                    checked={process.is_active}
                    onCheckedChange={() => handleToggleActive(process)}
                    id={`active-switch-${process.id}`}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor={`active-switch-${process.id}`} className={`${process.is_active ? 'text-green-600 font-medium' : 'text-gray-500'} cursor-pointer`} dir="rtl">
                    {process.is_active ? 'פעיל' : 'לא פעיל'}
                  </Label>
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
