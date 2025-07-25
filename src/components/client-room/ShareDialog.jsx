
import React, { useState, useEffect } from 'react';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Mail, Eye, EyeOff, Loader2, LinkIcon, CheckIcon, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SendEmail } from '@/api/integrations';

export default function ShareDialog({ open, onOpenChange, client, lead, onUpdate }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // For general saving operations like password update, email send
  const [isGenerating, setIsGenerating] = useState(false); // For initial link generation
  const [copied, setCopied] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(true);
  const { toast } = useToast();
  
  const entity = client || lead;
  const entityType = client ? 'client' : 'lead';

  useEffect(() => {
    if (open && entity) {
      const initialPassword = entity.room_password || '';
      setPassword(initialPassword);
      setIsPasswordProtected(!!initialPassword);
      setCopied(false);
    }
  }, [open, entity]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSaveChanges = async () => {
    if (!entity) return;
    setIsSaving(true);
    try {
      const EntityClass = entityType === 'client' ? Client : Lead;
      const passwordToSave = isPasswordProtected ? password : '';
      
      // Fetch current entity to ensure we have the latest room_id if it exists
      const currentEntity = await EntityClass.get(entity.id);
      if (!currentEntity) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: `${entityType === 'client' ? 'הלקוח' : 'הליד'} לא נמצא במערכת.`,
        });
        return;
      }

      // Preserve existing room_id and room_share_token unless explicitly generating a new one
      const dataToUpdate = {
        room_password: passwordToSave,
        room_id: currentEntity.room_id, // Keep existing room_id
        room_share_token: currentEntity.room_share_token // Keep existing token
      };

      await EntityClass.update(entity.id, dataToUpdate);
      
      toast({ title: "השינויים נשמרו", description: "הגדרות השיתוף עודכנו בהצלחה." });
      await onUpdate();
    } catch (e) {
      console.error("Failed to save changes:", e);
      toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לשמור את השינויים." });
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLink = async () => {
    if (!entity) return;
    setIsGenerating(true);
    try {
      const entityId = entity.id;
      const hasPassword = isPasswordProtected; // Use the current state of the switch

      const roomId = `room_${entityId}_${Date.now()}`;
      const roomPassword = hasPassword ? generatePassword() : ''; // Generate a new password for initial setup
      const shareToken = Math.random().toString(36).substring(2, 15);
      
      const EntityClass = entityType === 'client' ? Client : Lead;
      
      // בדיקה שהישות קיימת לפני העדכון
      const currentEntity = await EntityClass.get(entityId);
      if (!currentEntity) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: `${entityType === 'client' ? 'הלקוח' : 'הליד'} לא נמצא במערכת.`,
        });
        return;
      }

      await EntityClass.update(entityId, {
        room_id: roomId,
        room_password: roomPassword,
        room_share_token: shareToken
      });

      // Update local state to reflect new values immediately
      setPassword(roomPassword);
      setIsPasswordProtected(!!roomPassword); // Ensure password protection is on if a password was set

      if (onUpdate) {
        onUpdate(); // רענון הנתונים בקומפוננט האב
      }

      toast({
        title: "קישור נוצר בהצלחה!",
        description: `קישור השיתוף ל${entityType === 'client' ? 'לקוח' : 'ליד'} נוצר והוא מוכן לשימוש.`,
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        variant: "destructive",
        title: "שגיאה ביצירת קישור",
        description: "אירעה שגיאה ביצירת קישור השיתוף. אנא נסה שוב.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const portalUrl = entity?.room_share_token 
    ? `${window.location.origin}/ClientPortal?token=${entity.room_share_token}` 
    : '';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSendEmail = async () => {
    if (!entity) return;
    setIsSaving(true);
    try {
      const entityName = entityType === 'client' ? `${entity.first_name} ${entity.last_name}` : entity.full_name;
      const subject = `קישור לחדר הדיגיטלי שלך`;
      const body = `
        שלום ${entityName},<br><br>
        זהו קישור הכניסה לחדר הדיגיטלי האישי שלך:<br>
        <a href="${portalUrl}">${portalUrl}</a><br><br>
        ${isPasswordProtected && password ? `הסיסמה לכניסה היא: <strong>${password}</strong><br><br>` : ''}
        בברכה,
      `;
      
      await SendEmail({ to: entity.email, subject, body });
      toast({ title: "מייל נשלח", description: `מייל עם פרטי גישה נשלח ל${entity.email}.` });
    } catch (error) {
      console.error("Email sending failed:", error);
      toast({ variant: "destructive", title: "שגיאה בשליחת מייל", description: "לא ניתן היה לשלוח את המייל." });
    } finally {
      setIsSaving(false);
    }
  };

  const getEntityName = () => {
      if (!entity) return '';
      return entityType === 'client' ? `${entity.first_name} ${entity.last_name}` : entity.full_name;
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>שתף חדר דיגיטלי עם {getEntityName()}</DialogTitle>
          <DialogDescription>
            שתף קישור מאובטח עם הלקוח שלך כדי שיוכל לצפות בהתקדמות, מסמכים ופגישות.
          </DialogDescription>
        </DialogHeader>

        {entity && entity.room_share_token ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portal-link">קישור לפורטל הדיגיטלי</Label>
              <div className="flex gap-2">
                <Input
                  id="portal-link"
                  value={portalUrl}
                  readOnly
                  className="text-sm flex-grow"
                />
                <Button onClick={() => copyToClipboard(portalUrl)} variant="outline" size="icon">
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-right">
                זהו הקישור הציבורי שאותו יש לשלוח ללקוח.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <Label htmlFor="password-protection" className="font-medium text-gray-800">הגנה בסיסמה</Label>
              <Switch
                id="password-protection"
                checked={isPasswordProtected}
                onCheckedChange={setIsPasswordProtected}
              />
            </div>

            {isPasswordProtected && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="room-password">הגדר סיסמה</Label>
                <div className="flex gap-2">
                  <Input
                    id="room-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="הזן סיסמה או צור חדשה"
                    className="flex-grow"
                  />
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    variant="outline"
                    size="icon"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button onClick={() => setPassword(generatePassword())} variant="outline" size="icon" aria-label="Generate new password">
                      <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4 mt-2 flex justify-between items-center">
              <h4 className="text-md font-semibold">אפשרויות נוספות</h4>
              <Button onClick={handleSendEmail} disabled={isSaving || !entity.email || !portalUrl} variant="outline" size="sm">
                {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Mail className="h-4 w-4 ml-2" />}
                שלח גישה במייל
              </Button>
            </div>

          </div>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">השיתוף עדיין לא הופעל</h3>
            <p className="text-gray-600 mb-4">לחץ על הכפתור כדי ליצור חדר דיגיטלי מאובטח עבור הלקוח.</p>
            <Button onClick={generateShareLink} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <LinkIcon className="h-4 w-4 ml-2" />}
              {isGenerating ? 'יוצר קישור...' : 'צור קישור מאובטח'}
            </Button>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2 items-center pt-4 border-t">
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isGenerating}>
            סגור
          </Button>
          {entity?.room_share_token && (
            <Button onClick={handleSaveChanges} disabled={isSaving || isGenerating}>
              {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
              שמור שינויים
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
