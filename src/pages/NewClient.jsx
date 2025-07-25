
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/api/entities';
import { Process } from '@/api/entities';
import { User } from '@/api/entities'; // Import User entity
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, UserPlus } from 'lucide-react';

export default function NewClient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    referral_source: '',
    status: 'ליד חדש',
    process_type: '',
  });
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProcesses = async () => {
      try {
        // סינון רק תהליכים פעילים
        const activeProcesses = await Process.filter({ is_active: true });
        setProcesses(activeProcesses);
      } catch (e) {
        console.error("Failed to load processes", e);
        setError("לא ניתן לטעון את רשימת התהליכים.");
      }
    };
    loadProcesses();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.process_type) {
      setError("חובה לבחור סוג תהליך.");
      return;
    }
    setLoading(true);
    try {
      const user = await User.me(); // Get current user
      const clientData = { ...formData, user_id: user.id }; // Add user_id
      const newClient = await Client.create(clientData);
      
      // טריגור אוטומציה לליד חדש (יצירת חדר דיגיטלי ומעבר לשלב הבא)
      const { ProcessAutomationService } = await import('../components/process-automation/ProcessAutomationService');
      await ProcessAutomationService.handleNewLead(newClient);
      
      navigate(createPageUrl('ClientRoom', `?id=${newClient.id}`));
    } catch (err) {
      setError("אירעה שגיאה ביצירת הלקוח. אנא נסה שוב.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Clients'))}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold text-gray-900">יצירת לקוח חדש</h1>
            <p className="text-gray-600 mt-1">מלא את הפרטים כדי להוסיף לקוח או ליד חדש למערכת</p>
        </div>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <UserPlus />
                פרטי הלקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">שם פרטי</Label>
              <Input id="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">שם משפחה</Label>
              <Input id="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral_source">מקור ליד</Label>
              <Input 
                id="referral_source" 
                value={formData.referral_source} 
                onChange={handleChange} 
                placeholder="למשל: גוגל, פייסבוק, המלצה..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="process_type">סוג תהליך</Label>
              <Select value={formData.process_type} onValueChange={(v) => handleSelectChange('process_type', v)} required>
                <SelectTrigger id="process_type">
                  <SelectValue placeholder="בחר תהליך לשיוך..." />
                </SelectTrigger>
                <SelectContent>
                  {processes.map(process => (
                      <SelectItem key={process.id} value={process.name}>
                          {process.name}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-4">
             {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? 'יוצר...' : 'צור לקוח'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
