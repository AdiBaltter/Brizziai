import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FeatureRequest } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { UploadFile } from "@/api/integrations";

export default function IdeaButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState('');
  const [priority, setPriority] = useState('בינוני');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idea.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אנא הכנס תיאור של הרעיון או הבקשה.",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await User.me();
      let finalScreenshotUrl = screenshotUrl;
      
      // העלאת צילום מסך אם קיים
      if (screenshot) {
        const uploadResult = await UploadFile({ file: screenshot });
        finalScreenshotUrl = uploadResult.file_url;
      }

      await FeatureRequest.create({
        user_email: user.email,
        feature_idea: idea,
        priority: priority,
        screenshot_url: finalScreenshotUrl || undefined,
        status: 'חדש'
      });

      toast({
        title: "תודה!",
        description: "הרעיון שלך נשלח בהצלחה. אנחנו נבדוק אותו ונחזור אליך.",
      });

      // איפוס הטופס
      setIdea('');
      setPriority('בינוני');
      setScreenshot(null);
      setScreenshotUrl('');
      setOpen(false);
    } catch (error) {
      console.error("Error submitting idea:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן היה לשלוח את הרעיון. אנא נסה שוב.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "קובץ גדול מדי",
          description: "גודל הקובץ חייב להיות פחות מ-5MB.",
        });
        return;
      }
      setScreenshot(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50">
          <Lightbulb className="h-4 w-4" />
          בא לי לבקש משהו
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            בא לי לבקש משהו
          </DialogTitle>
          <DialogDescription>
            יש לך רעיון לשיפור או בקשה לפיצ'ר חדש? אנחנו רוצים לשמוע!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="idea">תאר את הרעיון או הבקשה שלך *</Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="למשל: הייתי רוצה שיהיה אפשר לסנן משימות לפי תאריך..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>כמה חשוב לך זה?</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="נמוך">נמוך - יהיה נחמד</SelectItem>
                <SelectItem value="בינוני">בינוני - אשמח לקבל</SelectItem>
                <SelectItem value="גבוה">גבוה - חסר לי מאוד</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">צילום מסך (אופציונלי)</Label>
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {screenshot && (
              <p className="text-sm text-green-600">
                קובץ נבחר: {screenshot.name}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שולח...' : 'שלח רעיון'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}