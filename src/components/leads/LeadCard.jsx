
import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Repeat, Trash2, Star, ChevronDown, ChevronUp, Building, Mail, Calendar, CheckSquare, ExternalLink, Info, Tag, Edit, Archive, Save } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Process } from '@/api/entities';
import { ProcessAutomationService } from '@/components/process-automation/ProcessAutomationService';

const statusColors = {
    "חדש": "bg-blue-100 text-blue-700",
    "יצר קשר": "bg-green-100 text-green-700",
    "לא ענה": "bg-orange-100 text-orange-700",
    "בתהליך סגירה": "bg-purple-100 text-purple-700",
    "לא רלוונטי": "bg-gray-100 text-gray-700"
};

// הוספת צבעים לשלבי התהליך
const stageColors = {
    "ליד חדש": "bg-green-100 text-green-700 border-green-200",
    "קביעת פגישה": "bg-blue-100 text-blue-700 border-blue-200", 
    "פגישה": "bg-purple-100 text-purple-700 border-purple-200",
    "שליחת הודעה / תזכורת": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "שליחה / בקשת חומרים": "bg-orange-100 text-orange-700 border-orange-200",
    "הכנת הצעת מחיר": "bg-teal-100 text-teal-700 border-teal-200",
    "שיחת טלפון": "bg-sky-100 text-sky-700 border-sky-200",
    "סגירת עסקה": "bg-emerald-100 text-emerald-700 border-emerald-200"
};

export default function LeadCard({ lead, onDelete, onRefresh, pendingTasksCount = 0, onToggleImportant, onToggleActive, index, processesMap }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [leadTasks, setLeadTasks] = useState([]);
    const [leadMeetings, setLeadMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableLead, setEditableLead] = useState(null);
    const [allProcesses, setAllProcesses] = useState([]);
    const { toast } = useToast();

    const navigate = useNavigate();
    
    useEffect(() => {
        // Fetch processes only if in editing mode and processes haven't been fetched yet
        if (isEditing && allProcesses.length === 0) {
            Process.filter({ is_active: true })
                .then(setAllProcesses)
                .catch(err => console.error("Failed to fetch processes", err));
        }
    }, [isEditing, allProcesses.length]); // Added allProcesses.length as dependency to prevent infinite loop

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const currentStageInfo = useMemo(() => {
        if (lead && lead.process_type && processesMap && processesMap[lead.process_type]) {
            const process = processesMap[lead.process_type];
            if (process && process.stages) {
                const stageIndex = (lead.current_stage || 1) - 1;
                const stage = process.stages[stageIndex];
                if (stage) {
                    return {
                        name: stage.client_display_name || stage.name,
                        category: stage.category,
                        description: stage.description,
                        color: process.color || '#3b82f6' // הוספת צבע התהליך
                    };
                }
            }
        }
        return null;
    }, [lead, processesMap]);

    const loadLeadDetails = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const [openTasks, inProgressTasks, meetings] = await Promise.all([
                Task.filter({ lead_id: lead.id, status: 'open' }),
                Task.filter({ lead_id: lead.id, status: 'in_progress' }),
                Meeting.filter({ lead_id: lead.id, status: 'מתוכננת' })
            ]);
            const allTasks = [...openTasks, ...inProgressTasks];
            setLeadTasks(allTasks);
            setLeadMeetings(meetings.filter(m => new Date(m.meeting_date) > new Date()));
        } catch (error) {
            console.error("Error loading lead details:", error);
            setLeadTasks([]);
            setLeadMeetings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = async (e) => {
        e.stopPropagation();
        if (!isExpanded) {
            await loadLeadDetails();
        }
        setIsExpanded(!isExpanded);
        // If expanding while editing, cancel editing
        if (isExpanded && isEditing) {
            setIsEditing(false);
            setEditableLead(null);
        }
    };

    const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    const hoverColor = index % 2 === 0 ? 'hover:bg-gray-50' : 'hover:bg-gray-100';

    const handleNavigateToDigitalRoom = (e) => {
        e.stopPropagation();
        window.location.href = createPageUrl('ClientRoom', `?lead_id=${lead.id}`);
    };

    const handleConvertToClient = async (e) => {
        e.stopPropagation();
        
        if (!lead.process_type) {
            alert("יש לשייך את הליד לתהליך תחילה לפני ההמרה ללקוח.");
            return;
        }

        const confirmed = window.confirm(
            `האם אתה בטוח שברצונך להמיר את ${lead.full_name} ללקוח? \n\nפעולה זו תהפוך את הליד ללא-פעיל ותיצור לקוח חדש עם כל הפרטים.`
        );

        if (!confirmed) {
            return;
        }

        try {
            const [firstName, ...lastNameParts] = lead.full_name.split(' ');
            const lastName = lastNameParts.join(' ');

            const newClient = await Client.create({
                first_name: firstName,
                last_name: lastName || firstName,
                email: lead.email,
                phone: lead.phone,
                referral_source: lead.source,
                notes: lead.notes,
                process_type: lead.process_type,
                account_id: lead.account_id,
                status: 'לקוח',
                original_lead_id: lead.id
            });
            
            await ProcessAutomationService.createDigitalRoom(newClient.id, 'client');
            // Instead of deleting, we mark the lead as inactive
            await Lead.update(lead.id, { is_active: false });
            
            alert(`${lead.full_name} הומר בהצלחה ללקוח!`);
            onRefresh();
            
            setTimeout(() => {
                navigate(createPageUrl('Clients'));
            }, 500);
            
        } catch (error) {
            console.error("Failed to convert lead to client:", error);
            alert("לא ניתן היה להמיר את הליד ללקוח. אנא נסה שוב.");
        }
    };
    
    const handleMarkAsIrrelevant = (e) => {
        e.stopPropagation();
        const confirmed = window.confirm("האם אתה בטוח שברצונך לסמן ליד זה כלא רלוונטי? הליד יועבר לארכיון.");
        if(confirmed) {
           onToggleActive();
        }
    }

    const handleEditClick = (e) => {
        e.stopPropagation();
        setEditableLead({ ...lead });
        setIsEditing(true);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditableLead(null);
    };

    const handleSaveEdit = async (e) => {
        e.stopPropagation();
        if (!editableLead) return;
        try {
            const { id, ...dataToUpdate } = editableLead;
            await Lead.update(id, dataToUpdate);
            toast({ title: "הצלחה", description: "פרטי הליד עודכנו." });
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            console.error("Failed to update lead", error);
            toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את הליד." });
        }
    };
    
    const handleFieldChange = (field, value) => {
        setEditableLead(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={`${rowBgColor} transition-colors border-b border-gray-200`}>
            {/* שורה ראשית */}
            <div 
                className={`${hoverColor} cursor-pointer`}
                // The original onClick={onSelect} is removed as the prop `onSelect`
                // is no longer available and its functionality (opening external edit)
                // is replaced by inline editing. The expand/collapse is handled
                // by the dedicated button below.
            >
                <div className="px-4 py-3">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        {/* מספר שורה */}
                        <div className="col-span-1 flex items-center gap-2 text-sm text-gray-500">
                            <span>{index + 1}</span>
                        </div>
                        
                        {/* שם מלא */}
                        <div className="flex items-center gap-3 col-span-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onToggleImportant(); }} 
                                className="text-gray-300 hover:text-yellow-400 transition-colors p-1 rounded-full"
                                title={lead.is_important ? "הסר סימון כחשוב" : "סמן כחשוב"}
                            >
                                <Star className={`h-4 w-4 ${lead.is_important ? 'text-yellow-400 fill-current' : ''}`} />
                            </button>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">{lead.full_name}</div>
                            </div>
                        </div>
                        
                        {/* תהליך */}
                        <div className="text-sm text-gray-600 col-span-3">
                            {lead.process_type || 'לא שויך'}
                        </div>
                        
                        {/* שלב נוכחי */}
                        <div className="col-span-2">
                            {currentStageInfo ? (
                                <Badge 
                                  className="text-xs" 
                                  style={{
                                    backgroundColor: `${currentStageInfo.color}20`, // 20 for opacity
                                    color: currentStageInfo.color,
                                    border: `1px solid ${currentStageInfo.color}40`
                                  }}
                                >
                                    {currentStageInfo.name}
                                </Badge>
                            ) : (
                                <Badge className={`${statusColors[lead.status] || 'bg-gray-100'} text-xs`}>
                                    {lead.status || 'לא מוגדר'}
                                </Badge>
                            )}
                        </div>
                        
                        {/* משימות ממתינות */}
                        <div className="col-span-1 text-center">
                            {pendingTasksCount > 0 ? (
                                <Badge variant="destructive" className="text-xs">{pendingTasksCount}</Badge>
                            ) : (
                                <span className="text-gray-400 text-xs">-</span>
                            )}
                        </div>
                        
                        {/* מקור */}
                        <div className="text-xs text-gray-600 col-span-1">
                            {lead.source || 'ידני'}
                        </div>
                        
                        {/* תאריך פתיחה */}
                        <div className="text-xs text-gray-500 col-span-1">
                            {format(new Date(lead.created_date), "d/M/yy", { locale: he })}
                        </div>
                        
                        {/* פעולות והרחבה */}
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
                                            <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                                                {lead.phone}
                                            </a>
                                        </div>
                                        {lead.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                                                    {lead.email}
                                                </a>
                                            </div>
                                        )}
                                        {lead.company && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-700">{lead.company}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-500">מקור:</span>
                                            <span className="font-medium text-gray-800">{lead.source || 'ידני'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-500">תהליך:</span>
                                            <span className="font-medium text-gray-800">{lead.process_type || 'לא שויך'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-500">נוצר:</span>
                                            <span className="font-medium text-gray-800">
                                                {format(new Date(lead.created_date), "d/M/yyyy", { locale: he })}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor={`full_name_${lead.id}`}>שם מלא</Label>
                                            <Input id={`full_name_${lead.id}`} value={editableLead.full_name || ''} onChange={e => handleFieldChange('full_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`phone_${lead.id}`}>טלפון</Label>
                                            <Input id={`phone_${lead.id}`} value={editableLead.phone || ''} onChange={e => handleFieldChange('phone', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`email_${lead.id}`}>אימייל</Label>
                                            <Input id={`email_${lead.id}`} type="email" value={editableLead.email || ''} onChange={e => handleFieldChange('email', e.target.value)} />
                                        </div>
                                        {/* Added Company and Process Type to inline edit */}
                                        <div className="space-y-1">
                                            <Label htmlFor={`company_${lead.id}`}>חברה</Label>
                                            <Input id={`company_${lead.id}`} value={editableLead.company || ''} onChange={e => handleFieldChange('company', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`process_type_${lead.id}`}>תהליך</Label>
                                            <Select value={editableLead.process_type || ''} onValueChange={value => handleFieldChange('process_type', value)}>
                                                <SelectTrigger id={`process_type_${lead.id}`}>
                                                    <SelectValue placeholder="בחר תהליך" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allProcesses.map(process => (
                                                        <SelectItem key={process.id} value={process.name}>
                                                            {process.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`notes_${lead.id}`}>הערות</Label>
                                            <Textarea id={`notes_${lead.id}`} value={editableLead.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)} rows={3} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4 justify-start">
                                {!isEditing ? (
                                    <Button size="sm" variant="outline" onClick={handleEditClick}>
                                        <Edit className="h-4 w-4 ml-1" />
                                        ערוך פרטים
                                    </Button>
                                ) : (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                            ביטול
                                        </Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSaveEdit}>
                                            <Save className="h-4 w-4 ml-1" />
                                            שמור שינויים
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* פגישות ומשימות - במיקום השני */}
                        <div className="bg-slate-100 p-4 rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3">פגישות ומשימות</h4>
                            <div className="space-y-3">
                                {/* פגישות עתידיות */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="h-4 w-4" />
                                        פגישות עתידיות ({leadMeetings.length})
                                    </div>
                                    {leadMeetings.length > 0 ? (
                                        <div className="space-y-1">
                                            {leadMeetings.slice(0, 2).map(meeting => (
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
                                        משימות פתוחות ({leadTasks.length})
                                    </div>
                                    {leadTasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {leadTasks.slice(0, 3).map(task => (
                                                <div key={task.id} className="text-xs text-gray-600 pr-6 flex items-center justify-between">
                                                    <span>{task.title}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                        task.priority === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {task.priority === 'high' ? 'גבוה' : task.priority === 'normal' ? 'בינוני' : 'נמוך'}
                                                    </span>
                                                </div>
                                            ))}
                                            {leadTasks.length > 3 && (
                                                <div className="text-xs text-gray-500 pr-6">
                                                    ועוד {leadTasks.length - 3} משימות...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 pr-6">אין משימות פתוחות</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* מידע ופעולות - במיקום השלישי */}
                        <div className="bg-slate-100 p-4 rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                מידע ופעולות
                            </h4>
                            <div className="space-y-4">
                                <div className="text-sm">
                                    <span className="text-gray-500">עדכון אחרון:</span>
                                    <span className="mr-2">
                                        {lead.last_stage_change ? 
                                            format(new Date(lead.last_stage_change), "d/M/yyyy", { locale: he }) : 
                                            format(new Date(lead.created_date), "d/M/yyyy", { locale: he })
                                        }
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3 pt-2" dir="ltr">
                                    <Switch
                                        checked={!!lead.is_active}
                                        onCheckedChange={onToggleActive}
                                        className="scale-75 data-[state=checked]:bg-green-600"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label className="text-xs font-medium cursor-pointer" dir="rtl">
                                        {lead.is_active ? "פעיל" : "לא פעיל"}
                                    </Label>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                     <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={handleConvertToClient}>
                                        <Repeat className="h-4 w-4 ml-2" />
                                        הפוך ללקוח
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full" onClick={handleMarkAsIrrelevant}>
                                        <Archive className="h-4 w-4 ml-2" />
                                        סמן כלא רלוונטי
                                    </Button>
                                    <Button size="sm" variant="destructive" className="w-full" onClick={onDelete}>
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        מחק ליד
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
