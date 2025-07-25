
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProcessAction } from '@/api/entities';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Process } from '@/api/entities'; // Added import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Corrected syntax error
import { CheckCircle, Edit, X, RefreshCw, ExternalLink, Clock, AlertTriangle, FileText, Mail, Send, ArrowUp, ArrowDown, User } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { ProcessAutomationService } from '../components/process-automation/ProcessAutomationService';

import ProcessActionModal from '../components/process-automation/ProcessActionModal';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Helper functions
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
}

function getUrgencyLevel(createdDate) {
    const now = new Date();
    const created = new Date(createdDate);
    const hoursAgo = (now - created) / (1000 * 60 * 60);

    if (hoursAgo > 72) return 'overdue';
    if (hoursAgo > 24) return 'urgent';
    return 'normal';
}

function getActionTypeIcon(actionType) {
    switch (actionType) {
        case 'stage_approval': return <Mail className="h-4 w-4 text-blue-500" />;
        case 'meeting_followup': return <FileText className="h-4 w-4 text-green-500" />;
        case 'documents_send_approval': return <Send className="h-4 w-4 text-purple-500" />;
        case 'documents_request_approval': return <FileText className="h-4 w-4 text-orange-500" />;
        case 'quote_preparation_approval': return <FileText className="h-4 w-4 text-indigo-500" />;
        case 'phone_call_completion': return <Mail className="h-4 w-4 text-teal-500" />;
        default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
}

// פונקציה לקבלת צבע השלב מהתהליך
function getStageColor(stageName, entity, processes) {
    if (!entity || !entity.process_type || !processes[entity.process_type]) {
        return '#6b7280'; // צבע ברירת מחדל
    }
    
    const process = processes[entity.process_type];
    if (!process.stages) return '#6b7280';
    
    const stage = process.stages.find(s => 
        s.name === stageName || s.client_display_name === stageName
    );
    
    if (stage && process.color) {
        return process.color;
    }
    
    return process.color || '#6b7280';
}

// פונקציה לקבלת צבעי רקע וטקסט לפי קטגוריית השלב
function getCategoryStyles(category) {
    const categoryStyles = {
        'schedule-meeting': { 
            backgroundColor: '#dbeafe', // כחול בהיר
            color: '#1e40af', // כחול כהה
            borderColor: '#93c5fd'
        },
        'meeting': { 
            backgroundColor: '#e0e7ff', // סגול בהיר
            color: '#5b21b6', // סגול כהה
            borderColor: '#c4b5fd'
        },
        'documents': { 
            backgroundColor: '#fef3c7', // צהוב בהיר
            color: '#92400e', // חום כהה
            borderColor: '#fcd34d'
        },
        'phone-call': { 
            backgroundColor: '#dbeafe', // כחול בהיר
            color: '#1e40af', // כחול כהה
            borderColor: '#93c5fd'
        },
        'price-quote': { 
            backgroundColor: '#d1fae5', // ירוק בהיר
            color: '#065f46', // ירוק כהה
            borderColor: '#86efac'
        },
        'send-message': { 
            backgroundColor: '#fee2e2', // אדום בהיר
            color: '#991b1b', // אדום כהה
            borderColor: '#fca5a5'
        },
        'deal-closure': { 
            backgroundColor: '#f3f4f6', // אפור בהיר
            color: '#374151', // אפור כהה
            borderColor: '#d1d5db'
        },
        'new-lead': { 
            backgroundColor: '#f3f4f6', // אפור בהיר
            color: '#374151', // אפור כהה
            borderColor: '#d1d5db'
        },
        default: { 
            backgroundColor: '#f3f4f6', // אפור בהיר
            color: '#374151', // אפור כהה
            borderColor: '#d1d5db'
        }
    };
    
    return categoryStyles[category] || categoryStyles.default;
}

// פונקציה לקבלת שם מתורגם לקטגוריה
function getCategoryDisplayName(category) {
    const categoryNames = {
        'schedule-meeting': 'קביעת פגישה',
        'meeting': 'פגישה',
        'documents': 'שליחת הודעה / תזכורת',
        'phone-call': 'שיחת טלפון',
        'price-quote': 'הכנת הצעת מחיר',
        'send-message': 'שליחת / בקשת חומרים',
        'deal-closure': 'סגירת עסקה',
        'new-lead': 'ליד חדש',
        default: 'כללי'
    };
    
    return categoryNames[category] || categoryNames.default;
}

export default function TasksPage() {
    const [allTasks, setAllTasks] = useState([]);
    const [clients, setClients] = useState({});
    const [leads, setLeads] = useState({});
    const [processes, setProcesses] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedAction, setSelectedAction] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [sortConfig, setSortConfig] = useState({ field: 'created_date', direction: 'desc' });

    // New states for rejection modal
    const [rejectingTask, setRejectingTask] = useState(null);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('דלג'); // Default reason 'דלג'
    const [rejectionNotes, setRejectionNotes] = useState('');

    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [allTasksData, clientData, leadData, processesData] = await Promise.all([
                ProcessAction.list('-created_date'),
                Client.list(),
                Lead.list(),
                Process.list()
            ]);

            // סינון משימות עם לידים ולקוחות שקיימים
            const validTasks = [];
            for (const task of allTasksData) {
                let isValid = true;
                
                // בדיקה שהלקוח קיים (אם יש client_id)
                if (task.client_id) {
                    const clientExists = clientData.some(c => c.id === task.client_id);
                    if (!clientExists) {
                        console.warn(`Task ${task.id} references non-existent client ${task.client_id}`);
                        isValid = false;
                    }
                }
                
                // בדיקה שהליד קיים (אם יש lead_id)
                if (task.lead_id) {
                    const leadExists = leadData.some(l => l.id === task.lead_id);
                    if (!leadExists) {
                        console.warn(`Task ${task.id} references non-existent lead ${task.lead_id}`);
                        isValid = false;
                    }
                }
                
                if (isValid) {
                    validTasks.push(task);
                }
            }
            
            setAllTasks(validTasks);

            const clientsMap = clientData.reduce((acc, client) => {
                acc[client.id] = client;
                return acc;
            }, {});
            setClients(clientsMap);

            const leadsMap = leadData.reduce((acc, lead) => {
                acc[lead.id] = lead;
                return acc;
            }, {});
            setLeads(leadsMap);

            const processesMap = processesData.reduce((acc, process) => {
                acc[process.name] = process;
                return acc;
            }, {});
            setProcesses(processesMap);

        } catch (error) {
            console.error("Error loading tasks data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApprove = async (task) => {
        try {
          console.log('Approving task from Tasks page:', task.id);
          
          // Find the related entity (client or lead)
          let entity = null;
          if (task.client_id) {
            entity = clients[task.client_id];
          } else if (task.lead_id) {
            entity = leads[task.lead_id];
          }
          
          if (!entity) {
            throw new Error('לא נמצאה ישות קשורה למשימה');
          }
          
          await ProcessAutomationService.approveActionAndAdvanceStage(task, entity);
          
          toast({
            title: "משימה אושרה!",
            description: "המשימה אושרה והישות קודמה לשלב הבא.",
          });
          
          // Refresh data
          await loadData();
          
        } catch (error) {
          console.error("Failed to approve task:", error);
          toast({
            variant: "destructive",
            title: "שגיאה באישור המשימה",
            description: error.message || "אירעה שגיאה באישור המשימה.",
          });
        }
      };
    
      const handleReject = async () => {
        if (!rejectingTask) return;
    
        try {
          console.log('Rejecting task from Tasks page:', rejectingTask.id, 'reason:', rejectionReason);
          
          // Find the related entity (client or lead)
          let entity = null;
          if (rejectingTask.client_id) {
            entity = clients[rejectingTask.client_id];
          } else if (rejectingTask.lead_id) {
            entity = leads[rejectingTask.lead_id];
          }
          
          if (!entity) {
            throw new Error('לא נמצאה ישות קשורה למשימה');
          }
          
          await ProcessAutomationService.handleActionResponse(rejectingTask, entity, rejectionReason, rejectionNotes);
          
          toast({
            title: "משימה נדחתה",
            description: `המשימה ${rejectionReason === 'דלג' ? 'דולגה' : 'נדחתה כלא רלוונטית'}.`,
          });
          
          setRejectingTask(null);
          setRejectionReason('דלג'); // Reset to default for next time
          setRejectionNotes('');
          setShowRejectionModal(false); // Close the modal
          
          // Refresh data
          await loadData();
          
        } catch (error) {
          console.error("Failed to reject task:", error);
          toast({
            variant: "destructive",
            title: "שגיאה בדחיית המשימה",
            description: error.message || "אירעה שגיאה בדחיית המשימה.",
          });
        }
      };

    const taskCounts = useMemo(() => {
        const pending = allTasks.filter(task => task.status === 'ממתין לאישור').length;
        const approved = allTasks.filter(task => task.status === 'אושר').length;
        const rejected = allTasks.filter(task => task.status === 'נדחה' || task.status === 'דלג').length;

        return { pending, approved, rejected };
    }, [allTasks]);

    const filteredAndSortedTasks = useMemo(() => {
        let filtered;
        switch (activeTab) {
            case 'pending':
                filtered = allTasks.filter(task => task.status === 'ממתין לאישור');
                break;
            case 'approved':
                filtered = allTasks.filter(task => task.status === 'אושר');
                break;
            case 'rejected':
                filtered = allTasks.filter(task => task.status === 'נדחה' || task.status === 'דלג');
                break;
            default:
                filtered = allTasks;
        }

        // Sort the filtered tasks
        return [...filtered].sort((a, b) => {
            if (sortConfig.field === 'client_name') {
                const aEntity = a.client_id ? clients[a.client_id] : leads[a.lead_id];
                const bEntity = b.client_id ? clients[b.client_id] : leads[b.lead_id];
                const aName = aEntity ? (aEntity.first_name ? `${aEntity.first_name} ${aEntity.last_name}` : aEntity.full_name) : '';
                const bName = bEntity ? (bEntity.first_name ? `${bEntity.first_name} ${bEntity.last_name}` : bEntity.full_name) : '';
                if (sortConfig.direction === 'asc') return aName.localeCompare(bName, 'he');
                return bName.localeCompare(aName, 'he');
            }
            
            const aValue = a[sortConfig.field];
            const bValue = b[sortConfig.field];

            if (sortConfig.field === 'created_date' || sortConfig.field === 'updated_date') {
                const aDate = aValue ? new Date(aValue) : null;
                const bDate = bValue ? new Date(bValue) : null;

                if (!aDate && !bDate) return 0;
                if (!aDate) return sortConfig.direction === 'asc' ? 1 : -1;
                if (!bDate) return sortConfig.direction === 'asc' ? -1 : 1;

                return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
            }

            if (!aValue) return 1;
            if (!bValue) return -1;

            if (sortConfig.direction === 'asc') {
                return aValue.toString().localeCompare(bValue.toString(), 'he');
            }
            return bValue.toString().localeCompare(aValue.toString(), 'he');
        });
    }, [allTasks, activeTab, sortConfig, clients, leads]);

    const handleTaskClick = (action) => {
        setSelectedAction(action);
        setModalOpen(true);
    };

    const handleSort = (field) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderTaskRow = (action, index) => {
        const entity = action.client_id ? clients[action.client_id] : leads[action.lead_id];
        const urgency = getUrgencyLevel(action.created_date);
        const isPending = action.status === 'ממתין לאישור';

        // אם הישות לא נמצאת, לא נציג את השורה
        if (!entity) {
            console.warn(`Task ${action.id} references missing entity. Skipping render.`);
            return null;
        }

        const entityName = entity.first_name ? `${entity.first_name} ${entity.last_name}` : entity.full_name;
        const isClient = !!entity.first_name;
        const stageColor = getStageColor(action.stage_name, entity, processes);

        return (
            <div
                key={action.id}
                className={`grid grid-cols-12 gap-4 items-center px-4 py-3 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 ${isPending ? 'cursor-pointer' : ''} ${
                    urgency === 'overdue' && isPending ? 'border-r-4 border-red-500' :
                    urgency === 'urgent' && isPending ? 'border-r-4 border-orange-500' : ''
                }`}
                onClick={isPending ? () => handleTaskClick(action) : undefined}
            >
                {/* שם הלקוח */}
                <div className="col-span-2 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                            {getInitials(entityName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-gray-900">
                            {entityName}
                        </div>
                        {isClient ? (
                            <Link
                                to={createPageUrl('ClientRoom', `?id=${entity.id}`)}
                                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-3 w-3" />
                                חדר דיגיטלי
                            </Link>
                        ) : (
                            <Badge variant="secondary" className="gap-1">
                                <User className="h-3 w-3" />
                                ליד
                            </Badge>
                        )}
                    </div>
                </div>

                {/* שלב בתהליך */}
                <div className="col-span-2">
                    <div 
                        className="font-medium text-sm"
                        style={{ color: stageColor }}
                    >
                        {action.stage_name || 'לא צוין'}
                    </div>
                    {action.stage_category && (
                        <div 
                            className="text-xs px-3 py-1 rounded-lg font-medium mt-2 inline-block border"
                            style={{
                                backgroundColor: getCategoryStyles(action.stage_category).backgroundColor,
                                color: getCategoryStyles(action.stage_category).color,
                                borderColor: getCategoryStyles(action.stage_category).borderColor
                            }}
                        >
                            {getCategoryDisplayName(action.stage_category)}
                        </div>
                    )}
                </div>

                {/* תיאור המשימה */}
                <div className="col-span-3 flex items-center gap-2">
                    {getActionTypeIcon(action.action_type)}
                    <div>
                        <div className="font-medium text-gray-900 text-sm">{action.title}</div>
                        {action.user_response && (
                            <div className="text-xs text-gray-600 mt-1">
                                תגובה: {action.user_response}
                            </div>
                        )}
                        {action.update_text && (
                            <div className="text-xs text-gray-600 mt-1">
                                עדכון: {action.update_text}
                            </div>
                        )}
                    </div>
                </div>

                {/* תאריך יצירה */}
                <div className="col-span-2 text-center">
                    <div className="text-sm text-gray-700">
                        {format(new Date(action.created_date), "d/M/yyyy", { locale: he })}
                    </div>
                    <div className="text-xs text-gray-500">
                        {format(new Date(action.created_date), "HH:mm", { locale: he })}
                    </div>
                </div>

                {/* תאריך אישור/דחייה */}
                <div className="col-span-1 text-center">
                    {action.status !== 'ממתין לאישור' && action.updated_date ? (
                        <div>
                            <div className="text-sm text-gray-700">
                                {format(new Date(action.updated_date), "d/M/yyyy", { locale: he })}
                            </div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(action.updated_date), "HH:mm", { locale: he })}
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs">—</span>
                    )}
                </div>

                {/* פעולות */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                    {isPending && (
                        <>
                            <Button
                                size="sm"
                                className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(action);
                                }}
                            >
                                <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectingTask(action);
                                    setShowRejectionModal(true);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                    <Badge className={
                        action.status === 'ממתין לאישור' ? 'bg-yellow-100 text-yellow-800' :
                        action.status === 'אושר' ? 'bg-green-100 text-green-800' :
                        action.status === 'דלג' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }>
                        {action.status === 'דלג' ? 'דולג' : action.status}
                    </Badge>
                    {urgency === 'overdue' && isPending && (
                        <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3" />
                        </Badge>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">משימות</h1>
                <p className="text-gray-600 mt-1">ניהול כל המשימות ופעולות האישור במערכת</p>
                <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={loadData}>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        רענן
                    </Button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="mb-6 flex justify-start">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="rejected">דחויות ({taskCounts.rejected})</TabsTrigger>
                        <TabsTrigger value="approved">בוצעו ({taskCounts.approved})</TabsTrigger>
                        <TabsTrigger value="pending">ממתינות לביצוע ({taskCounts.pending})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Tasks List */}
            {filteredAndSortedTasks.length === 0 ? (
                renderEmptyState(activeTab)
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b">
                        <div className="col-span-2">
                             <Button
                                variant="ghost"
                                className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm"
                                onClick={() => handleSort('client_name')}
                            >
                                שם לקוח/ליד
                                {sortConfig.field === 'client_name' && (
                                    sortConfig.direction === 'asc' ?
                                    <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                    <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                                )}
                            </Button>
                        </div>
                        <div className="col-span-2">
                            <Button
                                variant="ghost"
                                className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm"
                                onClick={() => handleSort('stage_name')}
                            >
                                שלב בתהליך
                                {sortConfig.field === 'stage_name' && (
                                    sortConfig.direction === 'asc' ?
                                    <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                    <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                                )}
                            </Button>
                        </div>
                        <div className="col-span-3">
                            <Button
                                variant="ghost"
                                className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm"
                                onClick={() => handleSort('title')}
                            >
                                תיאור המשימה
                                {sortConfig.field === 'title' && (
                                    sortConfig.direction === 'asc' ?
                                    <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                    <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                                )}
                            </Button>
                        </div>
                        <div className="col-span-2 text-center">
                            <Button
                                variant="ghost"
                                className="justify-center w-full p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm"
                                onClick={() => handleSort('created_date')}
                            >
                                תאריך יצירה
                                {sortConfig.field === 'created_date' && (
                                    sortConfig.direction === 'asc' ?
                                    <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                    <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                                )}
                            </Button>
                        </div>
                        <div className="col-span-1 text-center">
                            <Button
                                variant="ghost"
                                className="justify-center w-full p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm"
                                onClick={() => handleSort('updated_date')}
                            >
                                תאריך אישור
                                {sortConfig.field === 'updated_date' && (
                                    sortConfig.direction === 'asc' ?
                                    <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                    <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                                )}
                            </Button>
                        </div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-600">פעולות</div>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-gray-200">
                        {filteredAndSortedTasks.map((action, index) => renderTaskRow(action, index))}
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {modalOpen && selectedAction && (
                <ProcessActionModal
                    key={selectedAction.id}
                    action={selectedAction}
                    entity={selectedAction.client_id ? clients[selectedAction.client_id] : leads[selectedAction.lead_id]}
                    processes={processes} // Pass processes to modal
                    onClose={() => {
                        setSelectedAction(null);
                        setModalOpen(false);
                    }}
                    onUpdate={() => {
                        loadData();
                        setModalOpen(false);
                    }}
                />
            )}

            {/* Rejection Dialog */}
            {showRejectionModal && rejectingTask && (
                <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>דחיית משימה</DialogTitle>
                            <DialogDescription>
                                בחר סיבה וספק הערות לדחיית המשימה.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <RadioGroup defaultValue={rejectionReason} onValueChange={setRejectionReason} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="דלג" id="r1" />
                                    <Label htmlFor="r1">דלג (Skip)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="לא רלוונטי" id="r2" />
                                    <Label htmlFor="r2">לא רלוונטי (Not relevant)</Label>
                                </div>
                            </RadioGroup>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">הערות</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="הזן הערות נוספות לדחייה..."
                                    value={rejectionNotes}
                                    onChange={(e) => setRejectionNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectionModal(false)}>ביטול</Button>
                            <Button onClick={handleReject}>אשר דחייה</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );

    // Helper function for empty state
    function renderEmptyState(status) {
        const messages = {
            pending: {
                icon: "🎉",
                title: "כל הכבוד!",
                message: "אין כרגע משימות שממתינות לביצוע.\nהמערכת עובדת בשבילך ברקע."
            },
            approved: {
                icon: "✅",
                title: "אין משימות שבוצעו",
                message: "כאשר תאשר משימות, הן יופיעו כאן."
            },
            rejected: {
                icon: "❌",
                title: "אין משימות דחויות",
                message: "כאשר תדחה משימות, הן יופיעו כאן."
            }
        };

        const config = messages[status] || messages.pending;

        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">{config.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h2>
                <p className="text-lg text-gray-600 text-center max-w-md whitespace-pre-line">
                    {config.message}
                </p>
            </div>
        );
    }
}
