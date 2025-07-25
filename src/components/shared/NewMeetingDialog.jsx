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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Save, Clock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SearchableEntitySelect from './SearchableEntitySelect';
import { useAccount } from './AccountContext';
import { format } from 'date-fns';

export default function NewMeetingDialog({ open, onOpenChange, onSuccess, dateTime }) {
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [entityType, setEntityType] = useState('client');
  const [meetingData, setMeetingData] = useState({});
  const [loading, setLoading] = useState(false);
  const { accountId, currentUser } = useAccount();

  const initializeMeetingData = () => {
    const initialDate = dateTime ? new Date(dateTime) : new Date();
    const startTime = format(initialDate, 'HH:mm');
    const endTime = format(new Date(initialDate.getTime() + 60 * 60000), 'HH:mm');

    setMeetingData({
      title: '',
      client_id: null,
      lead_id: null,
      meeting_date_only: format(initialDate, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      duration: 60,
      type: 'פגישת אונליין',
      location: '',
      description: '',
      status: 'מתוכננת',
    });
  };

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
        } catch (e) {
          console.error("Failed to fetch data for new meeting dialog", e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
      initializeMeetingData();
      setEntityType('client');
    }
  }, [open, dateTime]);

  const handleChange = (field, value) => {
    const newMeetingData = { ...meetingData, [field]: value };

    if (field === 'start_time' || field === 'end_time') {
      if (newMeetingData.start_time && newMeetingData.end_time) {
        const [startHour, startMin] = newMeetingData.start_time.split(':').map(Number);
        const [endHour, endMin] = newMeetingData.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = endMinutes - startMinutes;
        if (duration > 0) {
          newMeetingData.duration = duration;
        }
      }
    }
    setMeetingData(newMeetingData);
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
      const dataToSave = { ...meetingData };

      if (dataToSave.meeting_date_only && dataToSave.start_time) {
        dataToSave.meeting_date = `${dataToSave.meeting_date_only}T${dataToSave.start_time}:00`;
      }
      
      delete dataToSave.meeting_date_only;
      delete dataToSave.start_time;
      delete dataToSave.end_time;
      
      dataToSave.account_id = accountId;
      dataToSave.user_id = currentUser?.id;

      await Meeting.create(dataToSave);
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to create meeting", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>יצירת פגישה חדשה</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">נושא הפגישה</Label>
            <Input id="title" value={meetingData.title || ''} onChange={e => handleChange('title', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>שיוך ל:</Label>
            <RadioGroup value={entityType} onValueChange={setEntityType} className="flex gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="client" id="r-new-client" />
                    <Label htmlFor="r-new-client">לקוח</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="lead" id="r-new-lead" />
                    <Label htmlFor="r-new-lead">ליד</Label>
                </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
             <SearchableEntitySelect
                entityType={entityType}
                list={entityType === 'client' ? clients : leads}
                selectedId={entityType === 'client' ? meetingData.client_id : meetingData.lead_id}
                onSelect={handleSelectEntity}
                placeholder={entityType === 'client' ? 'חיפוש לקוח...' : 'חיפוש ליד...'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="meeting_date_only">תאריך הפגישה</Label>
                <Input id="meeting_date_only" type="date" value={meetingData.meeting_date_only || ''} onChange={e => handleChange('meeting_date_only', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start_time">שעת התחלה</Label>
                <Input id="start_time" type="time" value={meetingData.start_time || ''} onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end_time">שעת סיום</Label>
                <Input id="end_time" type="time" value={meetingData.end_time || ''} onChange={e => handleChange('end_time', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="duration">משך (דקות)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="duration" 
                    type="number" 
                    value={meetingData.duration || 60} 
                    onChange={e => handleChange('duration', parseInt(e.target.value))}
                    min="15"
                    step="15"
                  />
                </div>
            </div>
          </div>

          <div className="space-y-2">
                <Label htmlFor="type">סוג פגישה</Label>
                <Select value={meetingData.type || ''} onValueChange={value => handleChange('type', value)}>
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
            <Input id="location" value={meetingData.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="לדוגמה: Zoom link or 'משרדי החברה'"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input id="description" value={meetingData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="פרטים נוספים על הפגישה..." />
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 ml-2" />
            {loading ? 'יוצר...' : 'צור פגישה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}