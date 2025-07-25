import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Edit, Trash2, AlertCircle, Star, ChevronDown, ChevronUp, Building, Mail, Calendar, CheckSquare, ExternalLink, Archive, CheckCircle, Save } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Client } from '@/api/entities';
import { Process } from '@/api/entities';
import { createPageUrl } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";

const statusColors = {
    "ליד חדש": "bg-blue-100 text-blue-700",
    "בתהליך": "bg-yellow-100 text-yellow-700",
    "הצעה נשלחה": "bg-purple-100 text-purple-700",
    "ממתין לתשובה": "bg-orange-100 text-orange-700",
    "לקוח": "bg-green-100 text-green-700",
    "סגור": "bg-gray-100 text-gray-700"
};

export default function ClientCard({ client, onDelete, onRefresh, pendingTasksCount = 0, onToggleImportant, onToggleActive, index }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [clientTasks, setClientTasks] = useState([]);
    const [clientMeetings, setClientMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableClient, setEditableClient] = useState(null);
    const [allProcesses, setAllProcesses] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        if (isEditing && allProcesses.length === 0) {
            Process.filter({ is_active: true })
                .then(setAllProcesses)
                .catch(err => console.error("Failed to fetch processes", err));
        }
    }, [isEditing, allProcesses.length]);

    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return '?';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const loadClientDetails = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const [tasks, meetings] = await Promise.all([
                Task.filter({ client_id: client.id, status: ['open', 'in_progress'] }),
                Meeting.filter({ client_id: client.id, status: 'מתוכננת' })
            ]);
            setClientTasks(tasks);
            setClientMeetings(meetings.filter(m => new Date(m.meeting_date) > new Date()));
        } catch (error) {
            console.error("Error loading client details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToDigitalRoom = (e) => {
        e.stopPropagation();
        window.location.href = createPageUrl('ClientRoom', `?id=${client.id}`);
    };
    
    const handleToggleExpand = async (e) => {
        e.stopPropagation();
        if (!isExpanded) {
            await loadClientDetails();
        }
        setIsExpanded(!isExpanded);
    };

    const handleMarkAsIrrelevant = (e) => {
        e.stopPropagation();
        const confirmed = window.confirm("האם אתה בטוח שברצונך לסמן לקוח זה כלא רלוונטי? הלקוח יועבר לארכיון.");
        if(confirmed) {
           onToggleActive();
        }
    }

    const handleCloseClient = (e) => {
        e.stopPropagation();
        const confirmed = window.confirm("האם אתה בטוח שברצונך לסגור את הלקוח? הלקוח יועבר לארכיון עם סטטוס 'סגור'.");
        if(confirmed) {
           // Update client status to 'סגור' and mark as inactive
           // This would require an additional API call
           onToggleActive();
        }
    }

    const handleEditClick = (e) => {
        e.stopPropagation();
        setEditableClient({ ...client });
        setIsEditing(true);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditableClient(null);
    };

    const handleSaveEdit = async (e) => {
        e.stopPropagation();
        if (!editableClient) return;
        try {
            // Ensure client.id is used for the update
            await Client.update(editableClient.id, { ...editableClient });
            toast({ title: "הצלחה", description: "פרטי הלקוח עודכנו." });
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            console.error("Failed to update client", error);
            toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את הלקוח." });
        }
    };
    
    const handleFieldChange = (field, value) => {
        setEditableClient(prev => ({ ...prev, [field]: value }));
    };

    // צבע מתחלף לפי האינדקס
    const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    const hoverColor = index % 2 === 0 ? 'hover:bg-gray-50' : 'hover:bg-gray-100';

    return (
        <div className={`${rowBgColor} transition-colors border-b border-gray-200`}>
            {/* שורה ראשית */}
            <div 
                className={`${hoverColor} cursor-pointer`}
                onClick={handleToggleExpand}
            >
                <div className="px-4 py-3">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        {/* מספר שורה וחץ הרחבה */}
                        <div className="col-span-1 flex items-center gap-2 text-sm text-gray-500">
                             <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpand(e);
                                }}
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <span>{index + 1}</span>
                        </div>
                        
                        {/* שם מלא */}
                        <div className="flex items-center gap-3 col-span-3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleImportant(); }} 
                                className="text-gray-300 hover:text-yellow-400 transition-colors p-1 rounded-full"
                                title={client.is_important ? "הסר סימון כחשוב" : "סמן כחשוב"}
                            >
                                <Star className={`h-4 w-4 ${client.is_important ? 'text-yellow-400 fill-current' : ''}`} />
                            </button>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">{client.first_name} {client.last_name}</div>
                            </div>
                        </div>
                        
                        {/* תהליך */}
                        <div className="text-sm text-gray-600 col-span-2">
                            {client.process_type || 'לא שויך'}
                        </div>
                        
                        {/* סטטוס */}
                        <div className="col-span-1">
                            <Badge className={`${statusColors[client.status] || 'bg-gray-100'} text-xs`}>
                                {client.status}
                            </Badge>
                        </div>
                        
                        {/* תאריך שינוי אחרון */}
                        <div className="text-xs text-gray-500 col-span-2">
                            {client.last_status_change ? 
                                format(new Date(client.last_status_change), "d/M/yy", { locale: he }) : 
                                format(new Date(client.created_date), "d/M/yy", { locale: he })
                            }
                        </div>
                        
                        {/* משימות ממתינות */}
                        <div className="flex items-center justify-center col-span-1">
                            {pendingTasksCount > 0 ? (
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <Badge className="bg-red-100 text-red-700 text-xs">
                                        {pendingTasksCount}
                                    </Badge>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs">-</span>
                            )}
                        </div>
                        
                        {/* מקור */}
                        <div className="text-xs text-gray-600 col-span-1">
                            {client.referral_source || 'ידני'}
                        </div>
                        
                        {/* פעולות */}
                        <div className="flex justify-end col-span-1 items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={handleNavigateToDigitalRoom}
                                title="כניסה לחדר דיגיטלי"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* פרטים מורחבים */}
            {isExpanded && (
                <div className="px-4 pb-4 bg-gray-25 border-t">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                        {/* פרטי איש קשר */}
                        <div className="bg-slate-100 p-4 rounded-lg shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    פרטי איש קשר
                                </h4>
                                {!isEditing ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                                                {client.phone}
                                            </a>
                                        </div>
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                                                    {client.email}
                                                </a>
                                            </div>
                                        )}
                                        {client.company && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-700">{client.company}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor={`first_name_${client.id}`}>שם פרטי</Label>
                                                <Input id={`first_name_${client.id}`} value={editableClient.first_name || ''} onChange={e => handleFieldChange('first_name', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`last_name_${client.id}`}>שם משפחה</Label>
                                                <Input id={`last_name_${client.id}`} value={editableClient.last_name || ''} onChange={e => handleFieldChange('last_name', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`phone_${client.id}`}>טלפון</Label>
                                            <Input id={`phone_${client.id}`} value={editableClient.phone || ''} onChange={e => handleFieldChange('phone', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`email_${client.id}`}>אימייל</Label>
                                            <Input id={`email_${client.id}`} type="email" value={editableClient.email || ''} onChange={e => handleFieldChange('email', e.target.value)} />
                                        </div>
                                         <div className="space-y-1">
                                            <Label htmlFor={`company_${client.id}`}>חברה</Label>
                                            <Input id={`company_${client.id}`} value={editableClient.company || ''} onChange={e => handleFieldChange('company', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`process_type_${client.id}`}>תהליך</Label>
                                            <Select value={editableClient.process_type || ''} onValueChange={value => handleFieldChange('process_type', value)}>
                                                <SelectTrigger id={`process_type_${client.id}`}><SelectValue placeholder="בחר תהליך" /></SelectTrigger>
                                                <SelectContent>
                                                    {allProcesses.map(process => (
                                                        <SelectItem key={process.id} value={process.name}>{process.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`notes_${client.id}`}>הערות</Label>
                                            <Textarea id={`notes_${client.id}`} value={editableClient.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)} rows={3} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4">
                                {!isEditing ? (
                                    <>
                                        <Button size="sm" variant="outline" onClick={handleEditClick}>
                                            <Edit className="h-4 w-4 ml-1" />
                                            ערוך פרטים
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleNavigateToDigitalRoom}>
                                            <ExternalLink className="h-4 w-4 ml-1" />
                                            חדר דיגיטלי
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>ביטול</Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSaveEdit}>
                                            <Save className="h-4 w-4 ml-1" />
                                            שמור שינויים
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* פגישות ומשימות */}
                        <div className="bg-slate-100 p-4 rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3">פגישות ומשימות</h4>
                            <div className="space-y-3">
                                {/* פגישות עתידיות */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="h-4 w-4" />
                                        פגישות עתידיות ({clientMeetings.length})
                                    </div>
                                    {clientMeetings.length > 0 ? (
                                        <div className="space-y-1">
                                            {clientMeetings.slice(0, 2).map(meeting => (
                                                <div key={meeting.id} className="text-xs text-gray-600 pr-6">
                                                    {meeting.title} - {format(new Date(meeting.meeting_date), "d/M HH:mm", { locale: he })}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 pr-6">אין פגישות מתוכננות</div>
                                    )}
                                </div>

                                {/* משימות פתוחות */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <CheckSquare className="h-4 w-4" />
                                        משימות פתוחות ({clientTasks.length})
                                    </div>
                                    {clientTasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {clientTasks.slice(0, 2).map(task => (
                                                <div key={task.id} className="text-xs text-gray-600 pr-6">
                                                    {task.title}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 pr-6">אין משימות פתוחות</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* עדכונים ופעולות */}
                        <div className="bg-slate-100 p-4 rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3">עדכונים ופעולות</h4>
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <span className="text-gray-500">שלב נוכחי:</span>
                                    <span className="font-medium mr-2">{client.status}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-gray-500">עדכון אחרון:</span>
                                    <span className="mr-2">
                                        {client.last_status_change ? 
                                            format(new Date(client.last_status_change), "d/M/yyyy", { locale: he }) : 
                                            format(new Date(client.created_date), "d/M/yyyy", { locale: he })
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" dir="ltr">
                                    <Switch
                                        checked={!!client.is_active}
                                        onCheckedChange={onToggleActive}
                                        className="scale-75 data-[state=checked]:bg-green-600"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label className="text-xs font-medium cursor-pointer" dir="rtl">
                                        {client.is_active ? "פעיל" : "כבוי"}
                                    </Label>
                                </div>
                                
                                <div className="border-t pt-4 space-y-2">
                                    <Button size="sm" variant="outline" className="w-full" onClick={handleMarkAsIrrelevant}>
                                        <Archive className="h-4 w-4 ml-2" />
                                        לקוח לא רלוונטי
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full" onClick={handleCloseClient}>
                                        <CheckCircle className="h-4 w-4 ml-2" />
                                        סגירת לקוח
                                    </Button>
                                    <Button size="sm" variant="destructive" className="w-full" onClick={onDelete}>
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        מחק לקוח
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}