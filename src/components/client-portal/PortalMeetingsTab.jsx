import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Check, X, Clock } from 'lucide-react';

export default function PortalMeetingsTab({ meetings }) {
    const now = new Date();
    const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) >= now).sort((a,b) => new Date(a.meeting_date) - new Date(b.meeting_date));
    const pastMeetings = meetings.filter(m => new Date(m.meeting_date) < now).sort((a,b) => new Date(b.meeting_date) - new Date(a.meeting_date));

    const statusMap = {
        'מתוכננת': { icon: <Clock className="h-4 w-4 text-blue-500" />, text: 'מתוכננת', color: 'bg-blue-100 text-blue-800' },
        'התקיימה': { icon: <Check className="h-4 w-4 text-green-500" />, text: 'התקיימה', color: 'bg-green-100 text-green-800' },
        'בוטלה': { icon: <X className="h-4 w-4 text-red-500" />, text: 'בוטלה', color: 'bg-red-100 text-red-800' },
        'נדחתה': { icon: <Clock className="h-4 w-4 text-orange-500" />, text: 'נדחתה', color: 'bg-orange-100 text-orange-800' },
    }

    const MeetingCard = ({ meeting }) => (
        <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
                <p className="font-semibold">{meeting.title}</p>
                <p className="text-sm text-gray-600 my-1">
                  {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                </p>
                <Badge variant="secondary" className={statusMap[meeting.status]?.color || ''}>
                  {statusMap[meeting.status]?.icon}
                  <span className="mr-1">{statusMap[meeting.status]?.text || meeting.status}</span>
                </Badge>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
                {meeting.status === 'מתוכננת' && meeting.meeting_link && (
                    <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">הצטרף לפגישה</Button>
                    </a>
                )}
                 <Button size="sm" variant="outline">בקש שינוי מועד</Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>פגישות קרובות</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {upcomingMeetings.length > 0 ? (
                        upcomingMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)
                    ) : <p className="text-center text-gray-500 py-4">אין פגישות מתוכננות.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>פגישות עבר</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {pastMeetings.length > 0 ? (
                        pastMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)
                    ) : <p className="text-center text-gray-500 py-4">אין היסטוריית פגישות.</p>}
                </CardContent>
            </Card>
        </div>
    );
}