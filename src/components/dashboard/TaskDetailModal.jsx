import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Task } from '@/api/entities';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-700",
  "בינונית": "bg-blue-100 text-blue-700",
  "גבוהה": "bg-orange-100 text-orange-700",
  "דחופה": "bg-red-100 text-red-700"
};

export default function TaskDetailModal({ task, client, open, onOpenChange, onUpdate }) {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleUpdateStatus = async (status) => {
    setLoading(true);
    try {
      await Task.update(task.id, { status });
      onUpdate();
    } catch (e) {
      console.error("Failed to update task status", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            עבור: {client ? `${client.first_name} ${client.last_name}` : 'לא משויך'} | 
            נוצר ב: {format(new Date(task.created_date), "d/M/yyyy", { locale: he })}
            {task.due_date && ` | יעד: ${format(new Date(task.due_date), "d/M/yyyy", { locale: he })}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <Badge className={priorityColors[task.priority || 'בינונית']}>{task.priority || 'בינונית'}</Badge>
            <Badge variant="outline">{task.status}</Badge>
          </div>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {task.description || 'אין תיאור למשימה.'}
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">הוסף הערה</h4>
            <Textarea 
              placeholder="כתוב הערה..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button size="sm" disabled={!newComment}>הוסף הערה</Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>סגור</Button>
          {task.status !== 'הושלמה' && (
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => handleUpdateStatus('הושלמה')}
              disabled={loading}
            >
              {loading ? 'מעדכן...' : 'סמן כהושלמה'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}