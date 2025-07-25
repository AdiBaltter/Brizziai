import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lead } from '@/api/entities';
import { Process } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/lib/utils";

export default function NewLeadDialog({ open, onOpenChange, onSuccess, accountId }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    source: 'ידני',
    custom_source: '',
    notes: '',
    process_type: ''
  });
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && accountId) {
      const fetchProcesses = async () => {
        try {
          const activeProcesses = await Process.filter({ is_active: true, account_id: accountId });
          setProcesses(activeProcesses);
        } catch (e) {
          console.error("Failed to load processes", e);
          toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת התהליכים." });
        }
      };
      fetchProcesses();
    }
  }, [open, accountId, toast]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "כתובת אימייל היא שדה חובה.",
      });
      return;
    }

    if (!formData.process_type) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "חובה לבחור סוג תהליך.",
      });
      return;
    }

    setLoading(true);
    try {
      const finalSource = formData.source === 'אחר' ? formData.custom_source : formData.source;
      
      const leadData = { ...formData, source: finalSource, account_id: accountId };
      delete leadData.custom_source;

      await Lead.create(leadData);
      toast({ title: "הצלחה", description: "ליד חדש נוצר בהצלחה!" });
      onSuccess();
      onOpenChange(false);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        source: 'ידני',
        custom_source: '',
        notes: '',
        process_type: ''
      });
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן היה ליצור את הליד. אנא נסה שוב."
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      source: 'ידני',
      custom_source: '',
      notes: '',
      process_type: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>יצירת ליד חדש</DialogTitle>
          <DialogDescription>מלא את הפרטים כדי להוסיף ליד חדש למערכת.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">שם מלא *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              placeholder="הכנס שם מלא"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                placeholder="050-1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>מקור הליד</Label>
            <Select value={formData.source} onValueChange={(value) => handleChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ידני">ידני</SelectItem>
                <SelectItem value="טופס אתר">טופס אתר</SelectItem>
                <SelectItem value="וואטסאפ">וואטסאפ</SelectItem>
                <SelectItem value="שיחה">שיחה</SelectItem>
                <SelectItem value="פייסבוק">פייסבוק</SelectItem>
                <SelectItem value="גוגל">גוגל</SelectItem>
                <SelectItem value="המלצה">המלצה</SelectItem>
                <SelectItem value="אחר">אחר</SelectItem>
              </SelectContent>
            </Select>
            {formData.source === 'אחר' && (
              <div className="mt-2">
                <Input 
                  value={formData.custom_source} 
                  onChange={(e) => handleChange('custom_source', e.target.value)} 
                  placeholder="הכנס מקור מותאם..."
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="process_type">סוג תהליך *</Label>
            <Select
              value={formData.process_type}
              onValueChange={(value) => handleChange('process_type', value)}
            >
              <SelectTrigger id="process_type">
                <SelectValue placeholder="בחר תהליך לשיוך..." />
              </SelectTrigger>
              <SelectContent>
                {processes.length > 0 ? (
                  processes.map((process) => (
                    <SelectItem key={process.id} value={process.name}>
                      {process.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-center p-4 text-sm text-gray-500">
                    לא נמצאו תהליכים פעילים.
                    <br />
                    <Link
                      to={createPageUrl("Processes")}
                      className="text-blue-600 hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      לחץ כאן ליצירת תהליך חדש
                    </Link>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="הערות נוספות על הליד..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={resetAndClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {loading ? 'יוצר...' : 'צור ליד'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
