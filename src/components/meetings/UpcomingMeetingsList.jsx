import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Monitor, Phone, Building, MoreHorizontal, Clock, AlertCircle, Edit, MessageSquare, Calendar, FileText } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import { Meeting } from '@/api/entities';

const statusColors = {
    'מתוכננת': 'bg-blue-100 text-blue-700',
    'התקיימה': 'bg-green-100 text-green-700',
    'בוטלה': 'bg-gray-100 text-gray-700',
    'לא הגיע': 'bg-red-100 text-red-700',
};

const typeIcons = {
    'פגישת אונליין': <Monitor className="h-4 w-4" />,
    'פגישה פיזית': <Building className="h-4 w-4" />,
    'שיחת טלפון': <Phone className="h-4 w-4" />,
};

export default function UpcomingMeetingsList({ meetings, clients, onMeetingClick, onEditMeeting, onRefresh }) {
    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return '?';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const getDateText = (date) => {
        const meetingDate = new Date(date);
        if (isToday(meetingDate)) return 'היום';
        if (isTomorrow(meetingDate)) return 'מחר';
        if (isYesterday(meetingDate)) return 'אתמול';
        return format(meetingDate, 'EEEE הקרוב', { locale: he });
    };

    const needsSummary = (meeting) => {
        return meeting.status === 'התקיימה' && !meeting.summary;
    };

    const handleSendReminder = async (meeting) => {
        // TODO: Implement reminder sending
        console.log('Sending reminder for meeting:', meeting.id);
    };

    const handleMarkComplete = async (meeting) => {
        try {
            await Meeting.update(meeting.id, { status: 'התקיימה' });
            onRefresh();
        } catch (error) {
            console.error('Failed to mark meeting as complete:', error);
        }
    };

    const handleCancel = async (meeting) => {
        if (confirm('האם אתה בטוח שברצונך לבטל את הפגישה?')) {
            try {
                await Meeting.update(meeting.id, { status: 'בוטלה' });
                onRefresh();
            } catch (error) {
                console.error('Failed to cancel meeting:', error);
            }
        }
    };

    if (meetings.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">אין פגישות קרובות</p>
                <p className="text-sm mt-1">כל הפגישות שלך מתוכננות מראש</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 max-h-full overflow-y-auto">
            {meetings.map(meeting => {
                const client = clients[meeting.client_id];
                if (!client) return null;

                return (
                    <div
                        key={meeting.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onMeetingClick(meeting)}
                    >
                        <div className="flex items-start gap-3">
                            {/* Time and Date */}
                            <div className="flex flex-col items-center min-w-[60px]">
                                <div className="text-lg font-bold text-gray-900">
                                    {format(new Date(meeting.meeting_date), 'HH:mm')}
                                </div>
                                <div className="text-xs text-gray-500 text-center">
                                    {getDateText(meeting.meeting_date)}
                                </div>
                            </div>

                            {/* Client and Meeting Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                            {getInitials(client.first_name, client.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">
                                            {client.first_name} {client.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {meeting.title}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`text-xs ${statusColors[meeting.status] || statusColors['מתוכננת']}`}>
                                        {meeting.status}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        {typeIcons[meeting.type]}
                                        <span>{meeting.type}</span>
                                    </div>
                                    {needsSummary(meeting) && (
                                        <div className="flex items-center gap-1 text-xs text-red-600">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>טרם סוכמה</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => onEditMeeting(meeting)}>
                                        <Edit className="h-4 w-4 ml-2" />
                                        ערוך פגישה
                                    </DropdownMenuItem>
                                    
                                    {meeting.status === 'מתוכננת' && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleSendReminder(meeting)}>
                                                <MessageSquare className="h-4 w-4 ml-2" />
                                                שלח תזכורת
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleMarkComplete(meeting)}>
                                                <Clock className="h-4 w-4 ml-2" />
                                                סמן כהושלמה
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleCancel(meeting)}
                                                className="text-red-600"
                                            >
                                                <Calendar className="h-4 w-4 ml-2" />
                                                בטל פגישה
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    
                                    {needsSummary(meeting) && (
                                        <DropdownMenuItem onClick={() => onMeetingClick(meeting)}>
                                            <FileText className="h-4 w-4 ml-2" />
                                            הוסף סיכום
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}