import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronDown, Building, Monitor, Phone, Check, AlertTriangle, Clock, Calendar, Link as LinkIcon, Edit, Trash, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusConfig = {
    'ממתינה לאישור': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" /> },
    'מתוכננת': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
    'התקיימה': { color: 'bg-green-100 text-green-800', icon: <Check className="h-4 w-4" /> },
    'בוטלה': { color: 'bg-red-100 text-red-800', icon: <Trash className="h-4 w-4" /> }
};

const typeIcons = {
    'פגישה פיזית': <Building className="h-4 w-4" />,
    'פגישת אונליין': <Monitor className="h-4 w-4" />,
    'שיחת טלפון': <Phone className="h-4 w-4" />
};

export default function MeetingRow({ meeting, client, onUpdate, onEdit, onDelete, onSummary }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = statusConfig[meeting.status] || statusConfig['מתוכננת'];
    
    return (
        <>
            <tr className="border-b hover:bg-gray-50/50" onClick={() => setIsExpanded(!isExpanded)}>
                <td className="p-3">
                    <div className="flex flex-col">
                        <span className="font-medium">{format(new Date(meeting.meeting_date), 'dd.MM.yy')}</span>
                        <span className="text-xs text-gray-500">{format(new Date(meeting.meeting_date), 'HH:mm')}</span>
                    </div>
                </td>
                <td className="p-3">
                    <Link to={createPageUrl("ClientRoom", `?id=${client?.id}`)} onClick={e => e.stopPropagation()} className="hover:underline font-medium">
                        {client?.first_name} {client?.last_name}
                    </Link>
                </td>
                <td className="p-3">{meeting.title}</td>
                <td className="p-3">
                    <Badge variant="secondary" className={`gap-2 ${config.color}`}>
                        {config.icon}
                        {meeting.status}
                    </Badge>
                </td>
                <td className="p-3">
                    <div className="flex items-center gap-2">
                        {typeIcons[meeting.type]}
                        {meeting.type}
                    </div>
                </td>
                <td className="p-3 text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(meeting)}><Edit className="h-4 w-4 ml-2" />ערוך פגישה</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSummary(meeting)}><FileText className="h-4 w-4 ml-2" />הוסף סיכום</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert('Sending reminder...')}><Send className="h-4 w-4 ml-2" />שלח תזכורת</DropdownMenuItem>
                            {meeting.location && meeting.type === 'פגישת אונליין' && 
                                <a href={meeting.location} target="_blank" rel="noreferrer"><DropdownMenuItem><LinkIcon className="h-4 w-4 ml-2" />פתח קישור</DropdownMenuItem></a>}
                            <DropdownMenuItem onClick={() => onDelete(meeting.id)} className="text-red-600"><Trash className="h-4 w-4 ml-2" />בטל פגישה</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50">
                    <td colSpan={6} className="p-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">תיאור</h4>
                                <p className="text-sm text-gray-700">{meeting.description || 'אין תיאור.'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-1">סיכום</h4>
                                <p className="text-sm text-gray-700 p-2 bg-white rounded border whitespace-pre-wrap">{meeting.summary || 'אין סיכום.'}</p>
                            </div>
                            {meeting.recording_url && 
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">הקלטה</h4>
                                    <a href={meeting.recording_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">{meeting.recording_url}</a>
                                </div>
                            }
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}