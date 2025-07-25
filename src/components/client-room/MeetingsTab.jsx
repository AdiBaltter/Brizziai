import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle, Video, Edit } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MeetingsTab({ client, meetings, onUpdate }) {
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) >= now && m.status === 'מתוכננת');
  const pastMeetings = meetings.filter(m => new Date(m.meeting_date) < now || m.status !== 'מתוכננת');
  
  const MeetingCard = ({ meeting }) => (
    <div className="p-4 border rounded-lg flex items-start gap-4">
      <div className="mt-1">
        {new Date(meeting.meeting_date) >= now && meeting.status === 'מתוכננת' ? (
          <Clock className="h-5 w-5 text-blue-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{meeting.title}</p>
        <p className="text-sm text-gray-600">
          {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
        </p>
        <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{meeting.type}</Badge>
            {meeting.meeting_link && <Badge variant="secondary" className="bg-blue-50 text-blue-600">פגישה מקוונת</Badge>}
        </div>
        {meeting.summary && <p className="text-sm mt-2 p-2 bg-gray-50 rounded"><strong>סיכום:</strong> {meeting.summary}</p>}
      </div>
      <div className="flex flex-col gap-2">
        {meeting.meeting_link && (
          <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Video className="h-4 w-4 ml-2" /> הצטרף</Button>
          </a>
        )}
        <Button size="sm" variant="ghost"><Edit className="h-4 w-4 ml-2" /> ערוך</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>פגישות קרובות</CardTitle>
          <Button><Plus className="h-4 w-4 ml-2" /> קבע פגישה חדשה</Button>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-4">
              {upcomingMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין פגישות קרובות.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פגישות ושיחות עבר</CardTitle>
        </CardHeader>
        <CardContent>
          {pastMeetings.length > 0 ? (
            <div className="space-y-4">
              {pastMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין פגישות עבר.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}