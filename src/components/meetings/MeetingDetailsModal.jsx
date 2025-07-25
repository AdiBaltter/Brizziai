
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Monitor, Phone, Building, Calendar, Clock, MapPin, FileText, Edit, Send, ExternalLink, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Meeting } from '@/api/entities';
import { createPageUrl } from "@/lib/utils";
import { Link } from 'react-router-dom';

const statusColors = {
    'מתוכננת': 'bg-blue-100 text-blue-700',
    'התקיימה': 'bg-green-100 text-green-700',
    'בוטלה': 'bg-gray-100 text-gray-700',
    'לא הגיע': 'bg-red-100 text-red-700',
};

const typeIcons = {
    'פגישת אונליין': <Monitor className="h-5 w-5" />,
    'פגישה פיזית': <Building className="h-5 w-5" />,
    'שיחת טלפון': <Phone className="h-5 w-5" />,
};

export default function MeetingDetailsModal({ open, onOpenChange, meeting, client, lead, onEdit, onRefresh }) {
    const [summary, setSummary] = useState(meeting?.summary || '');
    const [isSaving, setIsSaving] = useState(false);

    const entity = client || lead;
    const entityType = client ? 'client' : 'lead';

    React.useEffect(() => {
        setSummary(meeting?.summary || '');
    }, [meeting]);

    const getEntityName = () => {
        if (!entity) return '';
        return entityType === 'client' ? `${entity.first_name} ${entity.last_name}` : entity.full_name;
    };
    
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name?.[0]?.toUpperCase() || '?';
    };

    const handleSaveSummary = async () => {
        if (!meeting) return;
        
        setIsSaving(true);
        try {
            await Meeting.update(meeting.id, { summary });
            onRefresh();
            // Don't close modal, just update the state
        } catch (error) {
            console.error('Failed to save summary:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendReminder = () => {
        // TODO: Implement reminder functionality
        console.log('Sending reminder for meeting:', meeting.id);
    };

    if (!meeting || !entity) return null;
    
    const entityName = getEntityName();
    const entityInitials = getInitials(entityName);
    const meetingDate = new Date(meeting.meeting_date);
    const needsSummary = meeting.status === 'התקיימה' && !meeting.summary;
    const clientRoomUrl = entityType === 'client'
        ? createPageUrl('ClientRoom', `?id=${entity.id}`)
        : createPageUrl('ClientRoom', `?lead_id=${entity.id}`);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                {entityInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-lg font-semibold">
                                פגישה עם {entityName}
                            </div>
                            <div className="text-sm text-gray-500 font-normal">
                                {meeting.title}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Meeting Status Alert */}
                    {needsSummary && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <FileText className="h-5 w-5" />
                                <span className="font-medium">פגישה זו טרם סוכמה</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                                אנא הוסף סיכום לפגישה שהתקיימה
                            </p>
                        </div>
                    )}

                    {/* Meeting Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <div className="font-medium">
                                        {format(meetingDate, 'EEEE, d MMMM yyyy', { locale: he })}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(meetingDate, 'HH:mm')} • {meeting.duration || 60} דקות
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {typeIcons[meeting.type]}
                                <div>
                                    <div className="font-medium">{meeting.type}</div>
                                    {meeting.location && (
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {meeting.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">סטטוס</div>
                                <Badge className={statusColors[meeting.status] || statusColors['מתוכננת']}>
                                    {meeting.status}
                                </Badge>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-2">פרטי {entityType === 'client' ? 'לקוח' : 'ליד'}</div>
                                <div className="space-y-1">
                                    <div className="text-sm">{entity.email}</div>
                                    <div className="text-sm">{entity.phone}</div>
                                    <Link 
                                        to={clientRoomUrl}
                                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        חדר דיגיטלי
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Meeting Description */}
                    {meeting.description && (
                        <div>
                            <h4 className="font-medium mb-2">תיאור הפגישה</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                {meeting.description}
                            </div>
                        </div>
                    )}

                    {/* Meeting Summary */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">סיכום הפגישה</h4>
                            {meeting.summary && !needsSummary && (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    סוכם
                                </span>
                            )}
                        </div>
                        <Textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="הוסף כאן את סיכום הפגישה, נקודות מרכזיות, החלטות ומשימות המשך..."
                            rows={6}
                            className="mb-3"
                        />
                        <Button 
                            onClick={handleSaveSummary}
                            disabled={isSaving || summary === meeting.summary}
                            size="sm"
                        >
                            {isSaving ? 'שומר...' : 'שמור סיכום'}
                        </Button>
                    </div>

                    {/* Attached Documents */}
                    {meeting.attached_documents && meeting.attached_documents.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">מסמכים מצורפים</h4>
                            <div className="space-y-2">
                                {meeting.attached_documents.map((doc, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-blue-600">
                                        <FileText className="h-4 w-4" />
                                        <a href={doc} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            מסמך {index + 1}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recording */}
                    {meeting.recording_url && (
                        <div>
                            <h4 className="font-medium mb-2">הקלטת הפגישה</h4>
                            <a 
                                href={meeting.recording_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                            >
                                <ExternalLink className="h-4 w-4" />
                                צפה בהקלטה
                            </a>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onEdit(meeting)}>
                            <Edit className="h-4 w-4 ml-2" />
                            ערוך פגישה
                        </Button>
                        {meeting.location && meeting.type === 'פגישת אונליין' && (
                            <Button variant="outline" asChild>
                                <a href={meeting.location} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                    פתח קישור
                                </a>
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {meeting.status === 'מתוכננת' && (
                            <Button variant="outline" onClick={handleSendReminder}>
                                <Send className="h-4 w-4 ml-2" />
                                שלח תזכורת
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
