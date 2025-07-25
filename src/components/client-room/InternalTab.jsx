
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/api/entities";
import { Task } from "@/api/entities";
import { ProcessAction } from "@/api/entities"; // Changed from ApprovalTask
import { Meeting } from "@/api/entities";
import { Process } from "@/api/entities";
import { Save, Lock, User, Calendar, MapPin, Phone, DollarSign, Users, CheckCircle, Clock, AlertCircle, ArrowRight, MessageSquare, FileText, Target } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "ליד חדש": "bg-blue-100 text-blue-700",
  "בתהליך": "bg-yellow-100 text-yellow-700",
  "הצעה נשלחה": "bg-purple-100 text-purple-700",
  "ממתין לתשובה": "bg-orange-100 text-orange-700",
  "לקוח": "bg-green-100 text-green-700",
  "סגור": "bg-gray-100 text-gray-700"
};

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-700",
  "בינונית": "bg-blue-100 text-blue-700",
  "גבוהה": "bg-orange-100 text-orange-700",
  "דחופה": "bg-red-100 text-red-700"
};

export default function InternalTab({ client, onUpdate }) {
  const [formData, setFormData] = useState({
    address: client?.address || '',
    id_number: client?.id_number || '',
    birth_date: client?.birth_date || '',
    emergency_contact: client?.emergency_contact || '',
    budget: client?.budget || '',
    referral_source: client?.referral_source || '',
    internal_notes: client?.internal_notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [clientTasks, setClientTasks] = useState([]);
  const [approvalTasks, setApprovalTasks] = useState([]); // This state variable name remains, but it will hold ProcessAction objects
  const [meetings, setMeetings] = useState([]);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInternalData();
  }, [client?.id]);

  const loadInternalData = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const [tasksData, approvalsData, meetingsData] = await Promise.all([
        Task.filter({ client_id: client.id }, "-created_date"),
        ProcessAction.filter({ client_id: client.id }, "-created_date"), // Changed from ApprovalTask.filter
        Meeting.filter({ client_id: client.id }, "-created_date")
      ]);

      setClientTasks(tasksData);
      setApprovalTasks(approvalsData);
      setMeetings(meetingsData);

      // Load process information
      if (client.process_type) {
        const processData = await Process.filter({ name: client.process_type });
        if (processData.length > 0) {
          setProcess(processData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading internal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Client.update(client.id, formData);
      onUpdate();
    } catch (error) {
      console.error("Error updating client internal data:", error);
    } finally {
      setSaving(false);
    }
  };

  const completedMeetings = meetings.filter(m => m.status === 'התקיימה').length;
  const upcomingMeetings = meetings.filter(m => m.status === 'מתוכננת').length;
  const openTasks = clientTasks.filter(t => t.status !== 'הושלמה').length;
  // `pendingApprovals` still filters on the `status` property, assuming ProcessAction has it.
  const pendingApprovals = approvalTasks.filter(t => t.status === 'ממתין לאישור').length;

  return (
    <div className="space-y-6">
      {/* Header Warning */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="flex items-center gap-3 p-4">
          <Lock className="h-5 w-5 text-orange-600" />
          <p className="text-orange-800 font-medium">
            מידע פנימי - לא גלוי ללקוח
          </p>
        </CardContent>
      </Card>

      {/* Client Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              סטטוס נוכחי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">סטטוס:</span>
              <Badge className={statusColors[client?.status]}>{client?.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">תהליך:</span>
              <span className="font-medium">{client?.process_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">שלב נוכחי:</span>
              <span className="font-medium">{client?.current_stage || 1}</span>
              {process && <span className="text-sm text-gray-500">מתוך {process.stages.length}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Meeting Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              סיכום פגישות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{completedMeetings} פגישות התקיימו</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{upcomingMeetings} פגישות מתוכננות</span>
            </div>
            <div className="text-xs text-gray-500">
              פגישה אחרונה: {meetings.length > 0 ? format(new Date(meetings[0].created_date), "d MMM yyyy", { locale: he }) : 'אין פגישות'}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              סיכום משימות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{openTasks} משימות פתוחות</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm">{pendingApprovals} ממתינות לאישור</span>
            </div>
            <div className="text-xs text-gray-500">
              משימה אחרונה: {clientTasks.length > 0 ? format(new Date(clientTasks[0].created_date), "d MMM yyyy", { locale: he }) : 'אין משימות'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Progress */}
      {process && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              התקדמות בתהליך - {process.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">התקדמות:</span>
                <span className="font-medium">{client?.current_stage || 1} / {process.stages.length}</span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">שלבים הבאים:</h4>
                <div className="space-y-1">
                  {process.stages.slice((client?.current_stage || 1) - 1, (client?.current_stage || 1) + 2).map((stage, index) => (
                    <div key={stage.id} className={`flex items-center gap-2 p-2 rounded ${index === 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-sm ${index === 0 ? 'font-medium text-blue-700' : 'text-gray-600'}`}>
                        {stage.name} {index === 0 && '(נוכחי)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            משימות פתוחות ({openTasks})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientTasks.filter(t => t.status !== 'הושלמה').length > 0 ? (
            <div className="space-y-3">
              {clientTasks.filter(t => t.status !== 'הושלמה').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={priorityColors[task.priority]}>{task.priority}</Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">אין משימות פתוחות</p>
          )}
        </CardContent>
      </Card>

      {/* Approval Tasks - now displays ProcessAction items */}
      {approvalTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              משימות ממתינות לאישור ({pendingApprovals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvalTasks.filter(t => t.status === 'ממתין לאישור').slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600">{task.content.substring(0, 100)}...</p>
                  </div>
                  {/* Assuming ProcessAction also has a `type` property relevant here */}
                  <Badge className="bg-yellow-100 text-yellow-700">{task.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            סיכומי פגישות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.filter(m => m.summary).length > 0 ? (
            <div className="space-y-4">
              {meetings.filter(m => m.summary).slice(0, 3).map(meeting => (
                <div key={meeting.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{meeting.title}</h4>
                    <Badge variant="outline">{format(new Date(meeting.meeting_date), "d MMM yyyy", { locale: he })}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{meeting.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">אין סיכומי פגישות</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטים אישיים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="address">כתובת מגורים</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="רחוב, עיר, מיקוד"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="id_number">מספר תעודת זהות</Label>
            <Input
              id="id_number"
              value={formData.id_number}
              onChange={(e) => handleChange('id_number', e.target.value)}
              placeholder="123456789"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birth_date">תאריך לידה</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">איש קשר חירום</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => handleChange('emergency_contact', e.target.value)}
              placeholder="שם ומספר טלפון"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            מידע עסקי
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="budget">תקציב מוערך (₪)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              placeholder="50000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referral_source">מקור הפנייה</Label>
            <Input
              id="referral_source"
              value={formData.referral_source}
              onChange={(e) => handleChange('referral_source', e.target.value)}
              placeholder="גוגל, המלצה, פייסבוק..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            הערות פנימיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.internal_notes}
            onChange={(e) => handleChange('internal_notes', e.target.value)}
            placeholder="הערות, תובנות, דברים לזכור על הלקוח..."
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            סיכום פרויקט
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{meetings.length}</div>
                <div className="text-sm text-blue-600">סה״כ פגישות</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{clientTasks.filter(t => t.status === 'הושלמה').length}</div>
                <div className="text-sm text-green-600">משימות הושלמו</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{openTasks}</div>
                <div className="text-sm text-orange-600">משימות פתוחות</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{client?.current_stage || 1}/{process?.stages.length || 1}</div>
                <div className="text-sm text-purple-600">שלב בתהליך</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">הישגים עיקריים:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {completedMeetings} פגישות בוצעו בהצלחה</li>
                <li>• {clientTasks.filter(t => t.status === 'הושלמה').length} משימות הושלמו</li>
                <li>• לקוח נמצא בשלב {client?.current_stage || 1} מתוך {process?.stages.length || 1}</li>
                {formData.budget && <li>• תקציב מוערך: ₪{formData.budget}</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
    </div>
  );
}
