
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, X } from 'lucide-react';

const timingPresets = [
    { value: 'immediately', label: 'מיידית' },
    { value: '12_hours', label: 'אחרי 12 שעות' },
    { value: '1_day', label: 'אחרי יום אחד' },
    { value: '3_days', label: 'אחרי 3 ימים' },
    { value: 'custom', label: 'מותאם אישית' },
];

export default function EditStagePanel({ stage, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState(stage.name);
  const [description, setDescription] = useState(stage.description);
  
  const handleUpdate = (field, value) => {
    onUpdate(stage.id, field, value);
  };
  
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <Input 
                className="text-2xl font-bold border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleUpdate('name', name)}
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="description">תיאור השלב</Label>
            <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleUpdate('description', description)}
                placeholder="הסבר קצר על מה שקורה בשלב זה..."
                rows={3}
            />
        </div>

        <Card>
            <CardHeader><CardTitle className="text-base">תזמון</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>מתי להריץ את השלב?</Label>
                    <Select value={stage.timing_preset} onValueChange={(v) => handleUpdate('timing_preset', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {timingPresets.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {stage.timing_preset === 'custom' && (
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label>ערך</Label>
                            <Input 
                                type="number" 
                                value={stage.timing_custom_value} 
                                onChange={(e) => handleUpdate('timing_custom_value', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>יחידת זמן</Label>
                            <Select value={stage.timing_custom_unit} onValueChange={(v) => handleUpdate('timing_custom_unit', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">שעות</SelectItem>
                                    <SelectItem value="days">ימים</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-base">אוטומציה</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>פעולה</Label>
                    <Select value={stage.action} onValueChange={(v) => handleUpdate('action', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="send_message">שליחת הודעה</SelectItem>
                            <SelectItem value="create_task">יצירת משימה</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {stage.action === 'send_message' && (
                    <div className="space-y-2">
                        <Label>תוכן ההודעה</Label>
                        <Textarea 
                            value={stage.action_config?.message_template || ''} 
                            onChange={(e) => handleUpdate('action_config', { ...stage.action_config, message_template: e.target.value })}
                            rows={4} 
                            placeholder="הכנס את תוכן ההודעה כאן... השתמש ב-{{שם}} לתבניות."
                        />
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-base">הגדרות נוספות</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>דורש אישור לפני ביצוע?</Label>
                    <Switch 
                        checked={stage.requires_approval}
                        onCheckedChange={(c) => handleUpdate('requires_approval', c)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label>הצג שלב זה ללקוח</Label>
                    <Switch 
                        checked={stage.visibility === 'external'}
                        onCheckedChange={(c) => handleUpdate('visibility', c ? 'external' : 'internal')}
                    />
                </div>
            </CardContent>
            <CardFooter>
                 <Button variant="destructive" className="w-full" onClick={() => onDelete(stage.id)}>
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק שלב
                 </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
