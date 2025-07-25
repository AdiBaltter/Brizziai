
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Client } from '@/api/entities';
import { createPageUrl } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { useAccount } from '@/components/shared/AccountContext';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';
import { Process } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function NewClientDialog({ open, onOpenChange, onSuccess }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // שימוש בקונטקסט החשבון
  const { accountId } = useAccount();

  useEffect(() => {
    if (open && accountId) {
      setIsLoading(true);
      const fetchProcesses = async () => {
        try {
          const secureOps = new SecureEntityOperations(Process);
          // סינון רק תהליכים פעילים
          const activeProcesses = await secureOps.secureFilter({ is_active: true });
          setProcesses(activeProcesses);
          if (activeProcesses.length > 0) {
            setSelectedProcessId(activeProcesses[0].id); // Automatically select the first process
          } else {
            setSelectedProcessId(''); // No processes found
          }
        } catch (e) {
          console.error("Failed to load processes", e);
          toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת התהליכים." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProcesses();
    } else if (!open) {
      // Reset state when dialog closes
      setProcesses([]);
      setSelectedProcessId('');
      setIsLoading(true); // Reset for next opening
    }
  }, [open, accountId, toast]);

  // Function to handle starting a new client creation process
  const handleStartProcess = () => {
    if (selectedProcessId) {
      // Assuming a new page/route for automated client creation based on a process
      navigate(createPageUrl('NewClientAutomated', { processId: selectedProcessId }));
      onOpenChange(false); // Close the dialog after navigation
    } else {
      toast({ variant: "destructive", title: "שגיאה", description: "אנא בחר תהליך." });
    }
  };

  const resetAndClose = () => {
    onOpenChange(false);
    // Reset states here for clean re-opening
    setProcesses([]);
    setSelectedProcessId('');
    setIsLoading(true);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת לקוח חדש</DialogTitle>
          <DialogDescription>בחר תהליך אוטומטי ליצירת לקוח חדש במערכת.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">טוען תהליכים...</span>
            </div>
          ) : (
            processes.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>לא נמצאו תהליכים פעילים ליצירת לקוחות.</p>
                <p>אנא פנה למנהל המערכת.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="process-select" className="text-right">בחר תהליך</Label>
                <Select onValueChange={setSelectedProcessId} value={selectedProcessId}>
                  <SelectTrigger id="process-select" className="w-full text-right">
                    <SelectValue placeholder="בחר תהליך" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {processes.map(process => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>ביטול</Button>
          <Button onClick={handleStartProcess} disabled={!selectedProcessId || isLoading || processes.length === 0}>
            התחל תהליך
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
