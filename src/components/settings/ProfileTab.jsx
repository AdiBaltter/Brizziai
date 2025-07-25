import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Upload, LogOut } from 'lucide-react';
import { User as UserEntity } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

export default function ProfileTab() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', // Changed from full_name
    last_name: '', // Added last_name
    company: '',
    website: '',
    instagram_link: '',
    facebook_link: '',
    profile_picture_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
        setFormData({
          first_name: currentUser.first_name || '', // Changed from full_name
          last_name: currentUser.last_name || '', // Added last_name
          company: currentUser.company || '',
          website: currentUser.website || '',
          instagram_link: currentUser.instagram_link || '',
          facebook_link: currentUser.facebook_link || '',
          profile_picture_url: currentUser.profile_picture_url || '',
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSaving(true);
      try {
        const { file_url } = await UploadFile({ file });
        setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
        
        await UserEntity.updateMyUserData({ profile_picture_url: file_url });
        
        const updatedUser = await UserEntity.me();
        setUser(updatedUser);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("שגיאה בהעלאת התמונה");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await UserEntity.updateMyUserData(formData);
      
      const updatedUser = await UserEntity.me();
      setUser(updatedUser);
      
      setFormData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        company: updatedUser.company || '',
        website: updatedUser.website || '',
        instagram_link: updatedUser.instagram_link || '',
        facebook_link: updatedUser.facebook_link || '',
        profile_picture_url: updatedUser.profile_picture_url || '',
      });
      
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'הפרטים נשמרו בהצלחה!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error saving user data:", error);
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'שגיאה בשמירת הפרטים: ' + (error.message || 'שגיאה לא ידועה');
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק מהמערכת?')) {
      try {
        await UserEntity.logout();
        window.location.reload();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  if (loading) return <div>טוען...</div>;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטי פרופיל
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.profile_picture_url} />
              <AvatarFallback className="text-2xl bg-gray-200">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" onClick={() => fileInputRef.current.click()}>
                <Upload className="h-4 w-4 ml-2" />
                העלה תמונה
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <p className="text-xs text-gray-500 mt-2">JPG, PNG. עד 5MB.</p>
            </div>
          </div>

          {user && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">אימייל:</span>
                  <div className="text-gray-900">{user.email}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">תפקיד:</span>
                  <div className="text-gray-900">
                    {user.user_role === 'Admin' ? 'מנהל' : 
                     user.user_role === 'Editor' ? 'עורך' : 'צופה'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">ארגון:</span>
                  <div className="text-gray-900">{user.company_name || 'לא צוין'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">סטטוס:</span>
                  <div className="text-gray-900">{user.status || 'פעיל'}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">שם פרטי</Label>
              <Input 
                id="first_name" 
                value={formData.first_name} 
                onChange={handleChange}
                placeholder="הכנס שם פרטי"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">שם משפחה</Label>
              <Input 
                id="last_name" 
                value={formData.last_name} 
                onChange={handleChange}
                placeholder="הכנס שם משפחה"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">שם חברה</Label>
              <Input 
                id="company" 
                value={formData.company} 
                onChange={handleChange}
                placeholder="הכנס שם חברה"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input 
                id="website" 
                value={formData.website} 
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_link">קישור לאינסטגרם</Label>
              <Input 
                id="instagram_link" 
                value={formData.instagram_link} 
                onChange={handleChange}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_link">קישור לפייסבוק</Label>
              <Input 
                id="facebook_link" 
                value={formData.facebook_link} 
                onChange={handleChange}
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 ml-2" />
            התנתק מהמערכת
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 ml-2" />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}