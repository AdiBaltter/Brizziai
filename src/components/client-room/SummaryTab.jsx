import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, Clock, FileText, Calendar, MessageSquare, ArrowLeft, Edit3, Save, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Client } from "@/api/entities";

const InteractionIcon = ({ type }) => {
    switch (type) {
        case 'task': return <FileText className="h-5 w-5 text-orange-500" />;
        case 'meeting': return <Calendar className="h-5 w-5 text-green-500" />;
        case 'document': return <MessageSquare className="h-5 w-5 text-blue-500" />;
        default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
};

export default function SummaryTab({ client, tasks, meetings, documents, onUpdate }) {
  const [editingWelcome, setEditingWelcome] = useState(false);
  const [welcomeText, setWelcomeText] = useState(client?.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊");

  const handleSaveWelcome = async () => {
    try {
      await Client.update(client.id, { welcome_message: welcomeText });
      setEditingWelcome(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating welcome message:", error);
    }
  };

  const openTasks = tasks.filter(task => task.status !== "הושלמה");

  const interactions = [
    ...tasks.map(t => ({ type: 'task', data: t, date: t.created_date })),
    ...meetings.map(m => ({ type: 'meeting', data: m, date: m.created_date })),
    ...documents.map(d => ({ type: 'document', data: d, date: d.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {client?.first_name?.[0]}{client?.last_name?.[0]}
            </div>
            <div>
              <CardTitle className="text-lg">ברוכים הבאים! 😊</CardTitle>
              <p className="text-sm text-gray-600">{client?.first_name} {client?.last_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingWelcome(!editingWelcome)}
          >
            {editingWelcome ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {editingWelcome ? (
            <div className="space-y-3">
              <Textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveWelcome}>
                  <Save className="h-4 w-4 ml-2" />
                  שמור
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingWelcome(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{welcomeText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Open Tasks */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">משימות פתוחות</CardTitle>
              <Button size="sm"><Plus className="h-4 w-4 ml-1" /> משימה חדשה</Button>
            </CardHeader>
            <CardContent>
              {openTasks.length > 0 ? (
                <ul className="space-y-3">
                  {openTasks.slice(0, 5).map(task => (
                    <li key={task.id} className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-1 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          יעד: {format(new Date(task.due_date), "d MMM", { locale: he })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>אין משימות פתוחות</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Interactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">אינטראקציות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length > 0 ? (
                <ul className="space-y-4">
                  {interactions.slice(0, 5).map((interaction, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="mt-1">
                        <InteractionIcon type={interaction.type} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {interaction.type === 'task' && `משימה נוצרה: ${interaction.data.title}`}
                          {interaction.type === 'meeting' && `פגישה נקבעה: ${interaction.data.title}`}
                          {interaction.type === 'document' && `מסמך הועלה: ${interaction.data.name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(interaction.date), "d MMMM yyyy, HH:mm", { locale: he })}
                        </p>
                        {interaction.type === 'task' && <p className="text-sm text-gray-600 mt-1">{interaction.data.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">אין אינטראקציות להצגה</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}