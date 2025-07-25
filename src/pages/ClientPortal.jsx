
import React, { useState, useEffect } from 'react';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Task } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Document } from '@/api/entities';
import { Process } from '@/api/entities';
import { Account } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Lock, ShieldAlert, Loader2, Eye, EyeOff, CheckCircle, Calendar, FileText, ArrowRight, Home, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ClientPortal() {
  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);
  const [account, setAccount] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [process, setProcess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError('Token לא חוקי או חסר.');
      setLoading(false);
      return;
    }

    findEntityByToken(token);
  }, []);

  const findEntityByToken = async (token) => {
    setLoading(true);
    setError(null);
    try {
        console.log(`Searching for entity with token: ${token}`);

        // Search for a client first
        const clientResults = await Client.filter({ room_share_token: token });
        if (clientResults.length > 0) {
            console.log("Found client:", clientResults[0]);
            setEntity(clientResults[0]);
            setEntityType('client');
            if (!clientResults[0].room_password) {
                setIsAuthenticated(true);
                await loadEntityData(clientResults[0], 'client');
            }
            setLoading(false);
            return;
        }

        // If no client found, search for a lead
        const leadResults = await Lead.filter({ room_share_token: token });
        if (leadResults.length > 0) {
            console.log("Found lead:", leadResults[0]);
            setEntity(leadResults[0]);
            setEntityType('lead');
            if (!leadResults[0].room_password) {
                setIsAuthenticated(true);
                await loadEntityData(leadResults[0], 'lead');
            }
            setLoading(false);
            return;
        }

        // If nothing is found
        setError(`חדר דיגיטלי לא נמצא עבור טוקן זה. ייתכן שהקישור שגוי או שפג תוקפו. אנא בקש קישור חדש.`);
        setLoading(false);
    } catch (err) {
        console.error("Error in findEntityByToken:", err);
        setError("אירעה שגיאה בטעינת החדר הדיגיטלי. אנא נסה שוב.");
        setLoading(false);
    }
  };

  const loadEntityData = async (entityData, type) => {
    try {
      // טעינת נתוני חשבון
      if (entityData.account_id) {
        try {
          const accountData = await Account.get(entityData.account_id);
          setAccount(accountData);
        } catch (e) {
          console.warn('Could not load account data:', e);
        }
      }

      const filterParams = type === 'client' 
        ? { client_id: entityData.id }
        : { lead_id: entityData.id };

      // טעינת נתונים נוספים
      const [tasksData, meetingsData, documentsData] = await Promise.all([
        Task.filter(filterParams, "-created_date").catch(() => []),
        Meeting.filter(filterParams, "-created_date").catch(() => []),
        Document.filter(filterParams, "-created_date").catch(() => [])
      ]);

      setTasks(tasksData);
      setMeetings(meetingsData);
      setDocuments(documentsData.filter(doc => doc.visibility === 'חיצוני'));

      // טעינת תהליך
      if (entityData.process_type && entityData.account_id) {
        try {
          const processes = await Process.filter({ 
            name: entityData.process_type, 
            account_id: entityData.account_id 
          });
          if (processes.length > 0) {
            setProcess(processes[0]);
          }
        } catch (e) {
          console.warn('Could not load process data:', e);
        }
      }
    } catch (e) {
      console.error("Error loading entity data:", e);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (entity && password === entity.room_password) {
      setIsAuthenticated(true);
      await loadEntityData(entity, entityType);
    } else {
      toast({
        variant: "destructive",
        title: "סיסמה שגויה",
        description: "הסיסמה שהזנת אינה נכונה. אנא נסה שוב.",
      });
    }
  };

  const getEntityName = () => {
    if (!entity) return '';
    return entityType === 'client' 
      ? `${entity.first_name} ${entity.last_name}` 
      : entity.full_name;
  };

  const getEntityInitials = () => {
    if (!entity) return '';
    if (entityType === 'client') {
      return `${entity.first_name?.[0] || ''}${entity.last_name?.[0] || ''}`;
    }
    const nameParts = entity.full_name?.split(' ') || [];
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    }
    return entity.full_name?.[0] || '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">טוען חדר דיגיטלי...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-6" dir="rtl">
        <Card className="max-w-md text-center">
          <CardHeader>
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>שגיאה</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>
              חזרה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required state
  if (!isAuthenticated && entity?.room_password) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>נדרשת סיסמה</CardTitle>
            <CardDescription>כדי לגשת לחדר הדיגיטלי, אנא הזן את הסיסמה שקיבלת.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full">
                <LogIn className="h-4 w-4 ml-2" />
                כניסה לחדר
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main portal content
  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              {account?.logo_url ? (
                <img src={account.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-contain bg-white p-1 shadow-sm" />
              ) : (
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                    {getEntityInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {`חדר דיגיטלי - ${getEntityName() || 'טוען...'}`}
                </h1>
                <p className="text-gray-600 mt-1">
                  {account?.name || 'העסק שלך'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="ml-2 h-4 w-4" />
              חזרה לאתר
            </Button>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end text-blue-800">
              הודעת ברוכים הבאים
              <CheckCircle className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-right">
                {entity?.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              פרטי הישות
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                גלוי {entityType === 'client' ? 'ללקוח' : 'לליד'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-right">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">שם מלא</label>
                <p className="text-gray-900">{getEntityName()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">אימייל</label>
                <p className="text-gray-900">{entity?.email || 'לא צוין'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">טלפון</label>
                <p className="text-gray-900">{entity?.phone || 'לא צוין'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">חברה</label>
                <p className="text-gray-900">{entity?.company || 'לא צוין'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">סוג התהליך</label>
                <p className="text-gray-900">{entity?.process_type || 'לא צוין'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">סטטוס</label>
                <Badge variant="outline">
                  {entityType === 'client' 
                    ? (entity?.is_active ? 'פעיל' : 'לא פעיל') 
                    : (entity?.status || 'לא צוין')
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process Progress */}
        {process && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                התקדמות הפרויקט
                <ArrowRight className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {process.stages.filter(stage => stage.visibility === 'external').map((stage, index) => {
                  const isCurrentStage = (entity?.current_stage || 1) === index + 1;
                  const isCompleted = (entity?.current_stage || 1) > index + 1;
                  
                  return (
                    <div key={stage.id} className="flex items-center gap-4">
                      <div className="flex-1 text-right">
                        <div className={`font-medium ${isCurrentStage ? 'text-blue-600' : 'text-gray-900'}`}>
                          {stage.client_display_name || stage.name} {isCurrentStage && '(שלב נוכחי)'}
                        </div>
                        {stage.description && (
                          <div className="text-sm text-gray-600">{stage.description}</div>
                        )}
                      </div>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : 
                        isCurrentStage ? 'bg-blue-500 text-white' : 
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Meetings */}
        {meetings.filter(m => new Date(m.meeting_date) > new Date() && m.status === 'מתוכננת').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                הפגישות הקרובות שלכם
                <Calendar className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meetings.filter(m => new Date(m.meeting_date) > new Date() && m.status === 'מתוכננת').map(meeting => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline">{meeting.type}</Badge>
                    <div className="text-right">
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                      </div>
                      {meeting.location && (
                        <div className="text-sm text-blue-600 mt-1">
                          📍 {meeting.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                המסמכים שלכם
                <FileText className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {doc.requires_signature && !doc.is_signed && (
                        <Badge variant="destructive" className="text-xs">נדרשת חתימה</Badge>
                      )}
                      {doc.is_signed && (
                        <Badge variant="default" className="text-xs bg-green-600">נחתם</Badge>
                      )}
                      <Badge variant="outline">{doc.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(doc.created_date), "d MMM yyyy", { locale: he })}
                        </div>
                      </div>
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
