import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Save } from 'lucide-react';

export default function DisplayTab() {
    const [preferences, setPreferences] = useState({
        theme: 'light',
        language: 'he',
        dateFormat: 'dd/mm/yyyy',
        timeZone: 'Asia/Jerusalem'
    });

    const handleChange = (field, value) => {
        setPreferences(prev => ({...prev, [field]: value}));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    העדפות תצוגה
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">מצב כהה</Label>
                    <Switch id="dark-mode" checked={preferences.theme === 'dark'} onCheckedChange={(checked) => handleChange('theme', checked ? 'dark' : 'light')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">שפת ממשק</Label>
                    <Select value={preferences.language} onValueChange={(value) => handleChange('language', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="he">עברית</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date-format">פורמט תאריך</Label>
                    <Select value={preferences.dateFormat} onValueChange={(value) => handleChange('dateFormat', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                            <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timezone">אזור זמן</Label>
                    <Select value={preferences.timeZone} onValueChange={(value) => handleChange('timeZone', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Asia/Jerusalem">ישראל (GMT+3)</SelectItem>
                            <SelectItem value="America/New_York">ניו יורק (GMT-4)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button>
                    <Save className="h-4 w-4 ml-2"/>
                    שמור העדפות
                </Button>
            </CardFooter>
        </Card>
    );
}