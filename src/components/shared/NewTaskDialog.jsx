import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Client, Task } from '@/api/entities';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function NewTaskDialog({ open, onOpenChange, onSuccess }) {
  const [clients, setClients] = useState([]);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    client_id: null,
    due_date: null,
    priority: 'בינונית',
    status: 'פתוחה'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        const clientList = await Client.list();
        setClients(clientList);
      };
      fetchClients();
    }
  }, [open]);

  const handleChange = (field, value) => {
    setTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await Task.create(taskData);
      onSuccess();
      onOpenChange(false);
      // Reset form
      setTaskData({
        title: '', description: '', client_id: null, due_date: null, priority: 'בינונית', status: 'פתוחה'
      });
    } catch (e) {
      console.error("Failed to create task", e);
      // You can add error handling feedback here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>יצירת משימה חדשה</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת</Label>
            <Input id="title" value={taskData.title} onChange={e => handleChange('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" value={taskData.description} onChange={e => handleChange('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_id">שיוך ללקוח (אופציונלי)</Label>
            <Select onValueChange={value => handleChange('client_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.first_name} {client.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="due_date">תאריך יעד</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal">
                             <CalendarIcon className="ml-2 h-4 w-4" />
                             {taskData.due_date ? format(taskData.due_date, 'PPP') : <span>בחר תאריך</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={taskData.due_date} onSelect={date => handleChange('due_date', date)} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2">
                <Label htmlFor="priority">עדיפות</Label>
                <Select value={taskData.priority} onValueChange={value => handleChange('priority', value)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="נמוכה">נמוכה</SelectItem>
                        <SelectItem value="בינונית">בינונית</SelectItem>
                        <SelectItem value="גבוהה">גבוהה</SelectItem>
                        <SelectItem value="דחופה">דחופה</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 ml-2" />
            {loading ? 'שומר...' : 'שמור משימה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}