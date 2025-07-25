import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy, Lightbulb, Send } from 'lucide-react';
import { FeatureRequest } from '@/api/entities';

export default function HelpTab() {
  const [request, setRequest] = useState({ title: '', description: '', importance: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await FeatureRequest.create(request);
      setSent(true);
      setRequest({ title: '', description: '', importance: '' });
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error("Error sending feature request:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            תמיכה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-600">זקוק לעזרה? אנחנו כאן בשבילך.</p>
          <Button>צור קשר עם התמיכה</Button>
          <Button variant="link">עבור למרכז העזרה (FAQ)</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            יש לך רעיון לפיצ'ר חדש?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature_title">כותרת הפיצ'ר</Label>
              <Input id="feature_title" value={request.title} onChange={e => setRequest({...request, title: e.target.value})} placeholder="לדוגמה: סינכרון אנשי קשר" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature_desc">תיאור</Label>
              <Textarea id="feature_desc" value={request.description} onChange={e => setRequest({...request, description: e.target.value})} placeholder="תאר את הרעיון שלך בפירוט..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature_importance">למה זה חשוב לך?</Label>
              <Textarea id="feature_importance" value={request.importance} onChange={e => setRequest({...request, importance: e.target.value})} placeholder="איך זה יעזור לך בעבודה היומיומית?" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || sent}>
                <Send className="h-4 w-4 ml-2" />
                {sent ? 'הבקשה נשלחה!' : sending ? 'שולח...' : 'שלח הצעה'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}