import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, Save } from 'lucide-react';

export default function SecurityTab() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handlePasswordChange = async () => {
    // Placeholder for actual password change logic
    console.log("Changing password...");
    if (passwords.new !== passwords.confirm) {
      alert("New passwords don't match!");
      return;
    }
    alert("סיסמה שונתה (סימולציה).");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            שינוי סיסמה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">סיסמה נוכחית</Label>
            <Input id="current_password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">סיסמה חדשה</Label>
            <Input id="new_password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">אישור סיסמה חדשה</Label>
            <Input id="confirm_password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handlePasswordChange}>
            <Save className="h-4 w-4 ml-2" />
            עדכן סיסמה
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            אימות דו-שלבי (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">הוסף שכבת אבטחה נוספת לחשבונך.</p>
          <Button disabled>בקרוב: הפעל אימות דו-שלבי</Button>
        </CardContent>
      </Card>
    </div>
  );
}