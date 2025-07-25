import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Save, Clock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SearchableEntitySelect from '../shared/SearchableEntitySelect';
import { useAccount } from '../shared/AccountContext';
import { format } from 'date-fns';

export default function EditMeetingDialog({ open, onOpenChange, meeting, onSuccess }) {
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [entityType, setEntityType] = useState('client');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { accountId, currentUser } = useAccount();

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoading(true);
        try {
            const [clientList, leadList] = await Promise.all([
                Client.filter({ is_active: true }),
                Lead.filter({ is_active: true })
            ]);
            setClients(clientList);
            setLeads(leadList);
        } catch(e) {
            console.error("Failed to fetch data for meeting dialog", e);
        } finally {
            setLoading(false);
        }
      };
      fetchData();
      
      if (meeting) {
        const meetingDate = new Date(meeting.meeting_date);
        // Using `format` to avoid timezone issues that can arise from `substring`
        const dateString = format(meetingDate, 'yyyy-MM-dd');
        const startTime = format(meetingDate, 'HH:mm');
        
        // Calculate end time based on duration
        const duration = meeting.duration || 60;
        const endDate = new Date(meetingDate.getTime() + duration * 60000);
        const endTime = format(endDate, 'HH:mm');
        
        setFormData({ 
            ...meeting,
            meeting_date_only: dateString,
            start_time: startTime,
            end_time: endTime,
            duration: duration,
        });

        if (meeting.client_id) {
            setEntityType('client');
        } else if (meeting.lead_id) {
            setEntityType('lead');
        }
      } else {
        // Reset for new meeting, though this component is for editing
        setEntityType('client');
        setFormData({
            title: '', 
            client_id: null, 
            lead_id: null,
            meeting_date_only: format(new Date(), 'yyyy-MM-dd'), 
            start_time: '09:00',
            end_time: '10:00',
            type: 'פגישת אונליין', 
            location: '', 
            description: '', 
            status: 'מתוכננת',
            duration: 60
        });
      }
    }
  }, [open, meeting]);

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate duration when times change
    if (field === 'start_time' || field === 'end_time') {
      if (newFormData.start_time && newFormData.end_time) {
        const [startHour, startMin] = newFormData.start_time.split(':').map(Number);
        const [endHour, endMin] = newFormData.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = endMinutes - startMinutes;
        if (duration > 0) {
          newFormData.duration = duration;
        }
      }
    }
    setFormData(newFormData);
  };

  const handleSelectEntity = (id) => {
    if (entityType === 'client') {
        handleChange('client_id', id);
        handleChange('lead_id', null);
    } else {
        handleChange('lead_id', id);
        handleChange('client_id', null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dataToSave = { ...formData };
      
      // Combine date and time
      if (dataToSave.meeting_date_only && dataToSave.start_time) {
        const dateStr = dataToSave.meeting_date_only;
        const timeStr = dataToSave.start_time;
        dataToSave.meeting_date = `${dateStr}T${timeStr}:00`;
      }
      
      // Remove UI-only fields
      delete dataToSave.meeting_date_only;
      delete dataToSave.start_time;
      delete dataToSave.end_time;
      delete dataToSave.client; // Remove potentially populated object
      delete dataToSave.lead;   // Remove potentially populated object

      if (formData.id) {
        await Meeting.update(formData.id, dataToSave);
      } else {
        dataToSave.account_id = accountId;
        dataToSave.user_id = currentUser?.id;
        await Meeting.create(dataToSave);
      }
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to save meeting", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">{formData.id ? 'עריכת פגישה' : 'יצירת פגישה חדשה'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">נושא הפגישה</Label>
            <Input id="title" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>שיוך ל:</Label>
            <RadioGroup value={entityType} onValueChange={setEntityType} className="flex gap-4" dir="rtl">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="client" id="r-client" />
                    <Label htmlFor="r-client">לקוח</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="lead" id="r-lead" />
                    <Label htmlFor="r-lead">ליד</Label>
                </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <SearchableEntitySelect
                entityType={entityType}
                list={entityType === 'client' ? clients : leads}
                selectedId={entityType === 'client' ? formData.client_id : formData.lead_id}
                onSelect={handleSelectEntity}
                placeholder={entityType === 'client' ? 'חיפוש לקוח...' : 'חיפוש ליד...'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="meeting_date_only">תאריך הפגישה</Label>
                <Input id="meeting_date_only" type="date" value={formData.meeting_date_only || ''} onChange={e => handleChange('meeting_date_only', e.target.value)} />
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start_time">שעת התחלה</Label>
                <Input id="start_time" type="time" value={formData.start_time || ''} onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end_time">שעת סיום</Label>
                <Input id="end_time" type="time" value={formData.end_time || ''} onChange={e => handleChange('end_time', e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="duration">משך (דקות)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="duration" 
                    type="number" 
                    value={formData.duration || 60} 
                    onChange={e => handleChange('duration', parseInt(e.target.value))}
                    min="15"
                    step="15"
                  />
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">סוג פגישה</Label>
            <Select value={formData.type || ''} onValueChange={value => handleChange('type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="פגישת אונליין">פגישת אונליין</SelectItem>
                    <SelectItem value="פגישה פיזית">פגישה פיזית</SelectItem>
                    <SelectItem value="שיחת טלפון">שיחת טלפון</SelectItem>
                </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label htmlFor="location">מיקום / קישור</Label>
            <Input id="location" value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="לדוגמה: Zoom link או 'משרדי החברה'"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="פרטים נוספים על הפגישה..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select value={formData.status || 'מתוכננת'} onValueChange={value => handleChange('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="מתוכננת">מתוכננת</SelectItem>
                    <SelectItem value="התקיימה">התקיימה</SelectItem>
                    <SelectItem value="בוטלה">בוטלה</SelectItem>
                    <SelectItem value="לא הגיע">לא הגיע</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 ml-2" />
            {loading ? 'שומר...' : 'שמור פגישה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}