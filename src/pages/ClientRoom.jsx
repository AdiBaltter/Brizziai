
import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Task } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Document } from '@/api/entities';
import { Process } from '@/api/entities';
import { User } from '@/api/entities';
import { Account } from '@/api/entities';
import { ProcessAction } from '@/api/entities'; // Added import for ProcessAction
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Added import for Label
import { Switch } from "@/components/ui/switch"; // Added import for Switch
import { ArrowRight, MessageSquare, File, Calendar, ListChecks, Share2, Lock, CheckSquare, AlertTriangle, User as UserIcon, Phone, Building, FileText, Clock, ArrowLeft, Users, Target, MapPin, Briefcase, UserCheck, Pencil, Save, Eye, EyeOff, Unlock, ShieldCheck, Tag, Mail, Home } from "lucide-react"; // Added Home
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

import ShareDialog from "../components/client-room/ShareDialog";
import ProcessActionsTab from "../components/client-room/ProcessActionsTab";
import TasksTab from '../components/client-room/tabs/TasksTab';
import DocumentsTab from '../components/client-room/tabs/DocumentsTab';
import MeetingDetailsModal from '../components/meetings/MeetingDetailsModal';

export default function ClientRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  
  // States for welcome message editing
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isEditingWelcomeMessage, setIsEditingWelcomeMessage] = useState(false);
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  const [visibilityConfig, setVisibilityConfig] = useState({
    show_welcome: true,
    show_details: true,
    show_progress: true,
    show_upcoming_meetings: true,
    show_past_meetings: true,
    show_documents: true,
  });

  // Added new state variables
  const [currentUser, setCurrentUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false); // New state for public view

  // States for meeting details modal
  const [selectedMeetingForDetails, setSelectedMeetingForDetails] = useState(null);
  const [isMeetingDetailsOpen, setIsMeetingDetailsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get("id");
    const leadId = params.get("lead_id");
    const publicViewParam = params.get("public_view");
    const isPublic = publicViewParam === 'true';
    setIsPublicView(isPublic);

    if (isPublic) {
      setCurrentTab("client-environment");
    }

    if (clientId) {
      setEntityType('client');
      loadClientData(clientId, isPublic);
    } else if (leadId) {
      setEntityType('lead');
      loadLeadData(leadId, isPublic);
    } else {
      setError("לא סופק מזהה");
      setLoading(false);
    }
  }, [location.search]);

  const loadClientData = async (clientId, isPublic = false) => {
    setLoading(true);
    setError(null);
    try {
      let user = null;
      if (!isPublic) {
        user = await User.me();
        setCurrentUser(user);
      }

      const clientData = await Client.get(clientId);

      // Verify account access (only if not public view)
      if (!isPublic && user && user.role !== 'admin' && user.account_id && user.account_id !== clientData.account_id) {
        toast({
          variant: "destructive",
          title: "אין הרשאה",
          description: "אין לך הרשאה לצפות בלקוח זה.",
        });
        navigate(createPageUrl('Clients'));
        return;
      }

      setEntity(clientData);
      setWelcomeMessage(clientData.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊");
      
      const defaultConfig = {
        show_welcome: true,
        show_details: true,
        show_progress: true,
        show_upcoming_meetings: true,
        show_past_meetings: true,
        show_documents: true,
      };
      setVisibilityConfig({ ...defaultConfig, ...(clientData.room_visibility_config || {}) });

      // Load account data for branding
      if (clientData.account_id) {
        try {
          const accData = await Account.get(clientData.account_id);
          setAccount(accData);
        } catch (orgError) {
          console.warn("Account data not found, using defaults:", orgError);
        }
      }

      // Load related data - include both regular tasks and process actions
      const [taskData, processActionData, meetingData, documentData, processListData] = await Promise.all([
        Task.filter({ client_id: clientId, account_id: clientData.account_id }, "-created_date").catch(() => []),
        ProcessAction.filter({ client_id: clientId, account_id: clientData.account_id }, "-created_date").catch(() => []),
        Meeting.filter({ client_id: clientId, account_id: clientData.account_id }, "-created_date").catch(() => []),
        Document.filter({ client_id: clientId, account_id: clientData.account_id }, "-created_date").catch(() => []),
        clientData.process_type ? Process.filter({ name: clientData.process_type, account_id: clientData.account_id }).catch(() => []) : Promise.resolve([])
      ]);

      // Combine regular tasks with process actions
      const combinedTasks = [
        ...taskData,
        ...processActionData.map(action => ({
          id: action.id,
          title: action.title,
          details: action.stage_name || 'משימת תהליך',
          status: action.status === 'ממתין לאישור' ? 'open' : 
                  action.status === 'אושר' ? 'done' : 'open',
          priority: 'normal',
          created_date: action.created_date,
          updated_date: action.updated_date,
          task_type: 'process_action'
        }))
      ];

      setTasks(combinedTasks);
      setMeetings(meetingData);
      setDocuments(documentData);
      if (processListData && processListData.length > 0) {
        setProcess(processListData[0]);
      }

    } catch (error) {
      console.error("Error loading client room data:", error);

      const isNotFound = error?.error_type === 'ObjectNotFoundError' || 
                         error?.response?.status === 404 || 
                         error?.response?.status === 500;

      if (isNotFound) {
        toast({
          variant: "destructive",
          title: "לקוח לא נמצא",
          description: "הלקוח שחיפשת לא קיים או שנמחק. המ מערכת תחזיר אותך לרשימת הלקוחות.",
        });
        navigate(createPageUrl('Clients'));
        return;
      } else {
        setError("שגיאה בטעינת נתוני הלקוח. אנא רענן את הדף או נסה שוב מאוחר יותר.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const loadLeadData = async (leadId, isPublic = false) => {
    setLoading(true);
    setError(null);
    try {
      let user = null;
      if (!isPublic) {
        user = await User.me();
        setCurrentUser(user);
      }

      const leadData = await Lead.get(leadId); // Moved this line up to ensure leadData is defined for the check

      if (!isPublic && user && user.role !== 'admin' && user.account_id && user.account_id !== leadData.account_id) {
        toast({
          variant: "destructive",
          title: "אין הרשאה",
          description: "אין לך הרשאה לצפות בחדר דיגיטלי זה.",
        });
        navigate(createPageUrl('Leads'));
        return;
      }

      setEntity(leadData);
      setWelcomeMessage(leadData.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊");

      const defaultConfig = {
        show_welcome: true,
        show_details: true,
        show_progress: true,
        show_upcoming_meetings: true,
        show_past_meetings: true,
        show_documents: true,
      };
      setVisibilityConfig({ ...defaultConfig, ...(leadData.room_visibility_config || {}) });

      if (leadData.account_id) {
        try {
          const accData = await Account.get(leadData.account_id);
          setAccount(accData);
        } catch (orgError) {
          console.warn("Account data not found, using defaults:", orgError);
        }
      }

      // Load related data - include both regular tasks and process actions
      const [taskData, processActionData, meetingData, documentData, processListData] = await Promise.all([
        Task.filter({ lead_id: leadId, account_id: leadData.account_id }, "-created_date").catch(() => []),
        ProcessAction.filter({ lead_id: leadId, account_id: leadData.account_id }, "-created_date").catch(() => []),
        Meeting.filter({ lead_id: leadId, account_id: leadData.account_id }, "-created_date").catch(() => []),
        Document.filter({ lead_id: leadId, account_id: leadData.account_id }, "-created_date").catch(() => []),
        leadData.process_type ? Process.filter({ name: leadData.process_type, account_id: leadData.account_id }).catch(() => []) : Promise.resolve([])
      ]);

      // Combine regular tasks with process actions
      const combinedTasks = [
        ...taskData,
        ...processActionData.map(action => ({
          id: action.id,
          title: action.title,
          details: action.stage_name || 'משימת תהליך',
          status: action.status === 'ממתין לאישור' ? 'open' : 
                  action.status === 'אושר' ? 'done' : 'open',
          priority: 'normal',
          created_date: action.created_date,
          updated_date: action.updated_date,
          task_type: 'process_action'
        }))
      ];

      setTasks(combinedTasks);
      setMeetings(meetingData);
      setDocuments(documentData);
      if (processListData && processListData.length > 0) {
        setProcess(processListData[0]);
      }
    } catch (error) {
      console.error("Error loading lead room data:", error);
      const isNotFound = error?.error_type === 'ObjectNotFoundError' || 
                         error?.response?.status === 404 || 
                         error?.response?.status === 500;

      if (isNotFound) {
        toast({
          variant: "destructive",
          title: "ליד לא נמצא",
          description: "הליד שחיפשת לא קיים או שנמחק. המערכת תחזיר אותך לרשימת הלידים.",
        });
        navigate(createPageUrl('Leads'));
      } else {
        setError("שגיאה בטעינת נתוני הליד. אנא רענן את הדף או נסה שוב מאוחר יותר.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (key, value) => {
    const newConfig = { ...visibilityConfig, [key]: value };
    setVisibilityConfig(newConfig);

    if (!entity) return;

    try {
        const EntityClass = entityType === 'client' ? Client : Lead;
        await EntityClass.update(entity.id, { room_visibility_config: newConfig });
        toast({
            title: "הגדרות נראות עודכנו",
            description: "השינויים יבואו לידי ביטוי בפורטל הלקוח.",
        });
        setEntity(prev => ({...prev, room_visibility_config: newConfig}));
    } catch (e) {
        console.error("Failed to update visibility config", e);
        toast({
            variant: "destructive",
            title: "שגיאה",
            description: "עדכון הגדרות הנראות נכשל.",
        });
        // Revert to previous state on error
        setVisibilityConfig(entity.room_visibility_config || {
          show_welcome: true,
          show_details: true,
          show_progress: true,
          show_upcoming_meetings: true,
          show_past_meetings: true,
          show_documents: true,
        });
    }
  };

  const handleSaveWelcomeMessage = async () => {
    if (!entity) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן לשמור - נתוני הישות לא נטענו.",
      });
      return;
    }

    setIsSavingWelcome(true);
    try {
      const EntityClass = entityType === 'client' ? Client : Lead;
      await EntityClass.update(entity.id, { welcome_message: welcomeMessage });
      await refreshData(); 
      toast({
        title: "הודעת ברוכים הבאים נשמרה",
        description: "השינויים הוצגו בהצלחה בחדר הדיגיטלי.",
      });
    } catch(e) {
      console.error("Failed to save welcome message", e);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת הודעה",
        description: "אירעה שגיאה בעת שמירת הודעת ברוכים הבאים. אנא נסה שוב.",
      });
    } finally {
      setIsEditingWelcomeMessage(false);
      setIsSavingWelcome(false);
    }
  };

  const refreshData = async () => {
    if (entity?.id) {
      try {
        if (entityType === 'client') {
            await loadClientData(entity.id, isPublicView);
        } else {
            await loadLeadData(entity.id, isPublicView);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "לא ניתן היה לרענן את הנתונים.",
        });
      }
    }
  };

  const handleBackToList = () => {
    if (entityType === 'client') {
        navigate(createPageUrl('Clients'));
    } else {
        navigate(createPageUrl('Leads'));
    }
  };

  const handleMeetingClick = (meeting) => {
    setSelectedMeetingForDetails(meeting);
    setIsMeetingDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">שגיאה בטעינת הישות</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleBackToList} className="flex items-center gap-2">
                חזרה לרשימה
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setError(null);
                  const params = new URLSearchParams(location.search);
                  if (entityType === 'client') {
                    const clientId = params.get("id");
                    if (clientId) loadClientData(clientId, isPublicView);
                  } else {
                    const leadId = params.get("lead_id");
                    if (leadId) loadLeadData(leadId, isPublicView);
                  }
                }}
              >
                נסה שוב
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="text-center py-20" dir="rtl">
        <h2 className="text-2xl font-bold mb-4">לא נבחרה ישות</h2>
        <p className="text-gray-600 mb-6">חזור לעמוד הלקוחות או הלידים ובחר פריט כדי לצפות בחדר הדיגיטלי שלו.</p>
        <Button onClick={handleBackToList}>
          חזרה לרשימה
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // חישוב נתונים עבור הטאבים
  const openTasks = tasks.filter(task => task.status === 'open' || task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'done');
  const completedMeetings = meetings.filter(m => m.status === 'התקיימה').length;
  const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) > new Date() && m.status === 'מתוכננת');
  
  const allSortedInteractions = [
    ...tasks.map(t => ({ type: 'task', data: t, date: t.created_date })),
    ...meetings.map(m => ({ type: 'meeting', data: m, date: m.created_date })),
    ...documents.map(d => ({ type: 'document', data: d, date: d.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const recentInteractions = allSortedInteractions.slice(0, 3);

  const getEntityName = () => {
      if (!entity) return '';
      return entityType === 'client' ? `${entity.first_name} ${entity.last_name}` : entity.full_name;
  };
  
  const getEntityInitials = () => {
      if (!entity) return '';
      if (entityType === 'client') {
          return `${entity.first_name?.[0] || ''}${entity.last_name?.[0] || ''}`;
      }
      const nameParts = entity.full_name?.split(' ') || [];
      if (nameParts.length > 1) {
          return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
      }
      return entity.full_name?.[0] || '';
  };

  const ClientDetailsSection = () => {
    const DetailItem = ({ icon, label, children }) => (
      <div className="text-right">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 justify-start">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <div className="font-semibold text-gray-800 text-base pr-0">
          {children || <span className="text-gray-400">—</span>}
        </div>
      </div>
    );
    
    return (
        <Card dir="rtl" className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800 justify-start">
              <UserIcon className="h-6 w-6 text-blue-600" />
              פרטי {entityType === 'client' ? 'לקוח' : 'ליד'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <DetailItem icon={<ShieldCheck className="h-5 w-5 text-green-500" />} label="סטטוס">
                {entityType === 'client' ? (
                  <Badge variant="default" className={entity.is_active ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'}>
                    {entity.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={
                    entity.status === 'חדש' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    entity.status === 'בטיפול' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    entity.status === 'הומר ללקוח' ? 'bg-green-100 text-green-800 border-green-800' :
                    entity.status === 'אבוד' ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-gray-100 text-gray-800 border-gray-300'
                  }>
                    {entity.status}
                  </Badge>
                )}
              </DetailItem>
              <DetailItem icon={<ListChecks className="h-5 w-5 text-blue-500" />} label="תהליך">
                <div className="space-y-1">
                  <div className="text-gray-900 font-medium">
                    {entity.process_type || 'לא הוגדר תהליך'}
                  </div>
                  {process && (
                    <div className="text-sm text-gray-600">
                      <div>שלב נוכחי: <strong>{process.stages.find(s => s.id === (entity.current_stage || 1))?.name || `שלב ${entity.current_stage || 1}`}</strong></div>
                      {entity.last_stage_change && (
                        <div>התחיל: {format(new Date(entity.last_stage_change), "d MMMM yyyy", { locale: he })}</div>
                      )}
                    </div>
                  )}
                </div>
              </DetailItem>
            </div>
    
            <div className="border-t border-gray-100 my-2"></div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <DetailItem icon={<Briefcase className="h-5 w-5 text-gray-400" />} label="תחום עיסוק">
                 {entity.business_field}
               </DetailItem>
               <DetailItem icon={<Target className="h-5 w-5 text-gray-400" />} label="מקור הליד">
                 {entity.referral_source || entity.source}
               </DetailItem>
               <DetailItem icon={<Calendar className="h-5 w-5 text-gray-400" />} label="תאריך פתיחה">
                 {entity.created_date ? format(new Date(entity.created_date), "d MMMM yyyy", { locale: he }) : null}
               </DetailItem>
            </div>
    
            <div className="border-t border-gray-100 my-2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<MapPin className="h-5 w-5 text-gray-400" />} label="עיר">
                {entity.city}
              </DetailItem>
              <DetailItem icon={<Building className="h-5 w-5 text-gray-400" />} label="כתובת">
                {entity.address}
              </DetailItem>
              <DetailItem icon={<Tag className="h-5 w-5 text-gray-400" />} label="שירות שמתעניין בו">
                {entity.service_interest}
              </DetailItem>
            </div>
          </CardContent>
        </Card>
      );
  };

  const GeneralDetailsTab = () => (
    <div className="space-y-6">
      {/* סטטיסטיקות עליונות */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 justify-end">
              <div>
                <div className="text-2xl font-bold text-blue-600">{openTasks.length}</div>
                <div className="text-sm text-blue-600">משימות פתוחות</div>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 justify-end">
              <div>
                <div className="text-2xl font-bold text-green-600">{meetings.length}</div>
                <div className="text-sm text-green-600">סך הפגישות</div>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* פרטי לקוח */}
      <ClientDetailsSection />

      {/* שלבי התהליך */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 justify-end">
            שלבי התהליך
            <ListChecks className="h-5 w-5" />
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentTab("process")}
          >
            צפייה מלאה
          </Button>
        </CardHeader>
        <CardContent>
          {process ? (
            <div className="space-y-4">
              {process.stages.slice(0, 3).map((stage, index) => {
                const isCurrentStage = (entity.current_stage || 1) === index + 1;
                const isCompleted = (entity.current_stage || 1) > index + 1;
                
                return (
                  <div key={stage.id} className="flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <div className={`font-medium ${isCurrentStage ? 'text-blue-600' : 'text-gray-900'}`}>
                        {stage.name} {isCurrentStage && '(שלב נוכחי)'}
                      </div>
                      {stage.description && (
                        <div className="text-sm text-gray-600">{stage.description}</div>
                      )}
                    </div>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isCurrentStage ? 'bg-blue-500 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                );
              })}
               {process.stages.length > 3 && (
                <div className="text-right mt-4">
                  <Button variant="link" size="sm" onClick={() => setCurrentTab('process')}>
                    ועוד {process.stages.length - 3} שלבים...
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">לא הוגדר תהליך עבור ישות זו</p>
          )}
        </CardContent>
      </Card>
      
      {/* אינטראקציות אחרונות */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-start gap-4">
          <CardTitle className="flex items-center gap-2 justify-end"> {/* Retained justify-end for internal title alignment */}
            אינטראקציות אחרונות
            <MessageSquare className="h-5 w-5" />
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentTab("interactions")}
          >
            צפייה מלאה
          </Button>
        </CardHeader>
        <CardContent>
          {recentInteractions.length > 0 ? (
            <div className="space-y-3">
              {recentInteractions.map((interaction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg justify-end">
                  <div className="flex-1 text-right">
                    <div className="font-medium">
                      {interaction.type === 'task' && `משימה: ${interaction.data.title}`}
                      {interaction.type === 'meeting' && `פגישה: ${interaction.data.title}`}
                      {interaction.type === 'document' && `מסמך: ${interaction.data.name}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(interaction.date), "d MMMM yyyy, HH:mm", { locale: he })}
                    </div>
                  </div>
                  <div className="mt-1">
                    {interaction.type === 'task' && <FileText className="h-4 w-4 text-orange-500" />}
                    {interaction.type === 'meeting' && <Calendar className="h-4 w-4 text-green-500" />}
                    {interaction.type === 'document' && <File className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
              ))}
               {allSortedInteractions.length > 3 && (
                <div className="text-right mt-4">
                  <Button variant="link" size="sm" onClick={() => setCurrentTab('interactions')}>
                    ועוד {allSortedInteractions.length - 3} אינטראקציות...
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">אין אינטראקציות להצגה</p>
          )}
        </CardContent>
      </Card>

      {/* פגישות מתוכננות */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 justify-end">
            פגישות מתוכננות ({upcomingMeetings.length})
            <Clock className="h-5 w-5" />
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentTab("meetings")}
          >
            צפייה מלאה
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline">{meeting.type}</Badge>
                  <div className="text-right">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                    </div>
                    {meeting.location && <div className="text-sm text-gray-500">📍 {meeting.location}</div>}
                  </div>
                </div>
              ))}
              {upcomingMeetings.length > 3 && (
                <div className="text-right mt-4">
                  <Button variant="link" size="sm" onClick={() => setCurrentTab('meetings')}>
                    ועוד {upcomingMeetings.length - 3} פגישות...
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">אין פגישות מתוכננות</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ProcessStagesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-end">
          שלבי התהליך
          <ListChecks className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {process ? (
          <div className="space-y-4">
            {process.stages.map((stage, index) => {
              const isCurrentStage = (entity.current_stage || 1) === index + 1;
              const isCompleted = (entity.current_stage || 1) > index + 1;
              
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="flex-1 text-right">
                    <div className={`font-medium ${isCurrentStage ? 'text-blue-600' : 'text-gray-900'}`}>
                      {stage.name} {isCurrentStage && '(שלב נוכחי)'}
                    </div>
                    {stage.description && (
                      <div className="text-sm text-gray-600">{stage.description}</div>
                      )}
                  </div>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isCurrentStage ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {/* Arrow for separation, if not the last stage */}
                  {index < process.stages.length - 1 && (
                    <div className="flex-shrink-0">
                      <ArrowLeft className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">לא הוגדר תהליך עבור ישות זו</p>
        )}
      </CardContent>
    </Card>
  );

  const InteractionsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-end">
          אינטראקציות אחרונות
          <MessageSquare className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allSortedInteractions.length > 0 ? (
          <div className="space-y-3">
            {allSortedInteractions.map((interaction, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg justify-end">
                <div className="flex-1 text-right">
                  <div className="font-medium">
                    {interaction.type === 'task' && `משימה: ${interaction.data.title}`}
                    {interaction.type === 'meeting' && `פגישה: ${interaction.data.title}`}
                    {interaction.type === 'document' && `מסמך: ${interaction.data.name}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(interaction.date), "d MMMM yyyy, HH:mm", { locale: he })}
                  </div>
                </div>
                <div className="mt-1">
                  {interaction.type === 'task' && <FileText className="h-4 w-4 text-orange-500" />}
                  {interaction.type === 'meeting' && <Calendar className="h-4 w-4 text-green-500" />}
                  {interaction.type === 'document' && <File className="h-4 w-4 text-blue-500" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">אין אינטראקציות להצגה</p>
        )}
      </CardContent>
    </Card>
  );

  const MeetingsTab = () => {
    const pastMeetings = meetings.filter(m => new Date(m.meeting_date) < new Date() || m.status !== 'מתוכננת');
    
    return (
      <div className="space-y-6">
        {/* פגישות עתידיות */}
        <Card>
          <CardHeader>
            <CardTitle>פגישות עתידיות</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleMeetingClick(meeting)}
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{meeting.type}</Badge>
                      <div className="text-right">
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                        </div>
                        {meeting.location && <div className="text-sm text-gray-500">📍 {meeting.location}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין פגישות עתידיות</p>
            )}
          </CardContent>
        </Card>

        {/* פגישות שבוצעו */}
        <Card>
          <CardHeader>
            <CardTitle>פגישות שבוצעו</CardTitle>
          </CardHeader>
          <CardContent>
            {pastMeetings.length > 0 ? (
              <div className="space-y-3">
                {pastMeetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className="p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleMeetingClick(meeting)}
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary">{meeting.status}</Badge>
                      <div className="text-right">
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy", { locale: he })}
                        </div>
                        {meeting.summary && (
                          <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                            <strong>סיכום:</strong> {meeting.summary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין פגישות עבר</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const ClientEnvironmentTab = () => (
    <div className="space-y-6">
      {/* הודעת ברוכים הבאים */}
      {(!isPublicView || visibilityConfig.show_welcome) && (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            {!isPublicView ? (
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Label htmlFor="vis-welcome" className="text-sm text-gray-600">גלוי ללקוח</Label>
                    <Switch
                        id="vis-welcome"
                        checked={visibilityConfig.show_welcome}
                        onCheckedChange={(checked) => handleVisibilityChange('show_welcome', checked)}
                    />
                </div>
                {!isEditingWelcomeMessage ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingWelcomeMessage(true)}>
                    ערוך
                    <Pencil className="h-4 w-4 mr-2" />
                  </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveWelcomeMessage} disabled={isSavingWelcome}>
                            {isSavingWelcome ? 'שומר...' : 'שמור'}
                            <Save className="h-4 w-4 mr-2" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                            setIsEditingWelcomeMessage(false);
                            setWelcomeMessage(entity.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊");
                        }}>
                            ביטול
                        </Button>
                    </div>
                )}
              </div>
            ) : null}
            <CardTitle className="flex items-center gap-2">
              הודעת ברוכים הבאים
              <UserCheck className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-white rounded-lg border">
             {isEditingWelcomeMessage && !isPublicView ? (
              <Textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={5}
                className="w-full text-right"
                placeholder="כתוב הודעת ברוכים הבאים..."
              />
            ) : (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-right">
                {entity.welcome_message || "שלום! ברוכים הבאים לחדר הדיגיטלי שלכם. כאן תוכלו למצוא את כל המידע, המסמכים והעדכונים הרלוונטיים לפרויקט שלנו. אנחנו כאן לכל שאלה! 😊"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* פרטי הישות (כפי שהלקוח רואה) */}
      {(!isPublicView || visibilityConfig.show_details) && (
      <Card>
        <CardHeader>
         <div className="flex justify-end items-center gap-4">
            {!isPublicView && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vis-details" className="text-sm text-gray-600">גלוי ללקוח</Label>
                <Switch
                  id="vis-details"
                  checked={visibilityConfig.show_details}
                  onCheckedChange={(checked) => handleVisibilityChange('show_details', checked)}
                />
              </div>
            )}
            <CardTitle className="flex items-center gap-2">
              פרטי הישות (תצוגת לקוח)
              <UserIcon className="h-5 w-5" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-right">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">שם מלא</label>
              <p className="text-gray-900">
                {entityType === 'client' ? `${entity.first_name} ${entity.last_name}` : entity.full_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">אימייל</label>
              <p className="text-gray-900">{entity.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">טלפון</label>
              <p className="text-gray-900">{entity.phone}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">חברה</label>
              <p className="text-gray-900">{entity.company || 'לא צוין'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">סוג התהליך</label>
              <p className="text-gray-900">{entity.process_type || 'לא צוין'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">סטטוס</label>
              <Badge variant="outline">{entityType === 'client' ? (entity.is_active ? 'פעיל' : 'לא פעיל') : entity.status || 'לא צוין'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* שלבי התהליך (תצוגת לקוח) */}
       {(!isPublicView || visibilityConfig.show_progress) && (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 justify-end">
              התקדמות הפרויקט
              <ListChecks className="h-5 w-5" />
            </CardTitle>
             {!isPublicView && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vis-progress" className="text-sm text-gray-600">גלוי ללקוח</Label>
                <Switch
                  id="vis-progress"
                  checked={visibilityConfig.show_progress}
                  onCheckedChange={(checked) => handleVisibilityChange('show_progress', checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {process ? (
            <div className="space-y-4">
              {process.stages.map((stage, index) => {
                const isCurrentStage = (entity.current_stage || 1) === index + 1;
                const isCompleted = (entity.current_stage || 1) > index + 1;
                const isVisible = stage.visibility === 'external';
                
                if (!isVisible) return null;
                
                return (
                  <div key={stage.id} className="flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <div className={`font-medium ${isCurrentStage ? 'text-blue-600' : 'text-gray-900'}`}>
                        {stage.client_display_name || stage.name} {isCurrentStage && '(שלב נוכחי)'}
                      </div>
                      {stage.description && (
                        <div className="text-sm text-gray-600">{stage.description}</div>
                      )}
                    </div>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isCurrentStage ? 'bg-blue-500 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {/* Arrow for separation, if not the last visible stage */}
                    {index < process.stages.length - 1 && process.stages.slice(index + 1).some(s => s.visibility === 'external') && (
                      <div className="flex-shrink-0">
                        <ArrowLeft className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">לא הוגדר תהליך עבור ישות זו</p>
          )}
        </CardContent>
      </Card>
       )}

      {/* פגישות קרובות (תצוגת לקוח) */}
      {(!isPublicView || visibilityConfig.show_upcoming_meetings) && (
      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 justify-end">
              הפגישות הקרובות שלכם
              <Calendar className="h-5 w-5" />
            </CardTitle>
            {!isPublicView && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vis-upcoming-meetings" className="text-sm text-gray-600">גלוי ללקוח</Label>
                <Switch
                  id="vis-upcoming-meetings"
                  checked={visibilityConfig.show_upcoming_meetings}
                  onCheckedChange={(checked) => handleVisibilityChange('show_upcoming_meetings', checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline">{meeting.type}</Badge>
                  <div className="text-right">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                    </div>
                    {meeting.location && (
                      <div className="text-sm text-blue-600 mt-1">
                        📍 {meeting.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">אין פגישות מתוכננות</p>
          )}
        </CardContent>
      </Card>
      )}

      {/* פגישות שהתקיימו (תצוגת לקוח) */}
      {(!isPublicView || visibilityConfig.show_past_meetings) && (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 justify-end">
              פגישות שהתקיימו
              <CheckSquare className="h-5 w-5" />
            </CardTitle>
            {!isPublicView && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vis-past-meetings" className="text-sm text-gray-600">גלוי ללקוח</Label>
                <Switch
                  id="vis-past-meetings"
                  checked={visibilityConfig.show_past_meetings}
                  onCheckedChange={(checked) => handleVisibilityChange('show_past_meetings', checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {meetings.filter(m => m.status === 'התקיימה').length > 0 ? (
            <div className="space-y-3">
              {meetings.filter(m => m.status === 'התקיימה').slice(0, 3).map(meeting => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge variant="secondary">הושלמה</Badge>
                  <div className="text-right">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(meeting.meeting_date), "eeee, d MMMM yyyy", { locale: he })}
                    </div>
                    {meeting.summary && (
                      <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                        <strong>סיכום:</strong> {meeting.summary}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">אין פגישות שהתקיימו</p>
          )}
        </CardContent>
      </Card>
      )}

      {/* מסמכים חיצוניים (תצוגת לקוח) */}
      {(!isPublicView || visibilityConfig.show_documents) && (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 justify-end">
              המסמכים שלכם
              <File className="h-5 w-5" />
            </CardTitle>
            {!isPublicView && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vis-documents" className="text-sm text-gray-600">גלוי ללקוח</Label>
                <Switch
                  id="vis-documents"
                  checked={visibilityConfig.show_documents}
                  onCheckedChange={(checked) => handleVisibilityChange('show_documents', checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.filter(doc => doc.visibility === 'חיצוני').length > 0 ? (
            <div className="space-y-3">
              {documents.filter(doc => doc.visibility === 'חיצוני').map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {doc.requires_signature && !doc.is_signed && (
                      <Badge variant="destructive" className="text-xs">נדרשת חתימה</Badge>
                    )}
                    {doc.is_signed && (
                      <Badge variant="default" className="text-xs bg-green-600">נחתם</Badge>
                    )}
                    <Badge variant="outline">{doc.category}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(doc.created_date), "d MMM yyyy", { locale: he })}
                      </div>
                    </div>
                    <File className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">אין מסמכים להצגה</p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* כותרת עליונה עם מידע על הישות */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            {account?.logo_url ? (
              <img src={account.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-contain bg-white p-1 shadow-sm" />
            ) : (
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                  {getEntityInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {`חדר דיגיטלי - ${getEntityName() || 'טוען...'}`}
              </h1>
              <p className="text-gray-600 mt-1">
                {account?.name || 'העסק שלך'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            {isPublicView && (
              <Button variant="outline" onClick={() => window.location.href = createPageUrl('Landing')}>
                <Home className="ml-2 h-4 w-4" />
                חזרה לאתר
              </Button>
            )}
            {!isPublicView && entity && (
              <Button
                onClick={() => setShowShareDialog(true)}
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Share2 className="ml-2 h-4 w-4" />
                שתף חדר דיגיטלי
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isPublicView ? (
        <ClientEnvironmentTab />
      ) : (
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="bg-transparent p-0 border-b w-full justify-end">
            <TabsTrigger value="client-environment" className="gap-2">
              <UserCheck className="h-4 w-4" />
              סביבת {entityType === 'client' ? 'לקוח' : 'ליד'}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <File className="h-4 w-4" />
              מסמכים
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2">
              <Calendar className="h-4 w-4" />
              פגישות
            </TabsTrigger>
            <TabsTrigger value="interactions" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              אינטראקציות
            </TabsTrigger>
            <TabsTrigger value="process" className="gap-2">
              <ListChecks className="h-4 w-4" />
              שלבי התהליך
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              משימות
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <UserIcon className="h-4 w-4" />
              פרטים כלליים
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general">
              <GeneralDetailsTab />
            </TabsContent>
            <TabsContent value="tasks">
              <TasksTab tasks={tasks} entity={entity} entityType={entityType} onUpdate={refreshData} />
            </TabsContent>
            <TabsContent value="process">
              <ProcessStagesTab />
            </TabsContent>
            <TabsContent value="interactions">
              <InteractionsTab />
            </TabsContent>
            <TabsContent value="meetings">
              <MeetingsTab />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab documents={documents} entity={entity} entityType={entityType} onUpdate={refreshData} />
            </TabsContent>
            <TabsContent value="client-environment">
              <ClientEnvironmentTab />
            </TabsContent>
          </div>
        </Tabs>
      )}

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        client={entityType === 'client' ? entity : null}
        lead={entityType === 'lead' ? entity : null}
        onUpdate={refreshData}
      />

      <MeetingDetailsModal
        open={isMeetingDetailsOpen}
        onOpenChange={setIsMeetingDetailsOpen}
        meeting={selectedMeetingForDetails}
        client={entityType === 'client' ? entity : null} // Pass the main entity if it's a client
        lead={entityType === 'lead' ? entity : null}     // Pass the main entity if it's a lead
        onEdit={() => {}} // Empty function since we're in read-only mode here
        onRefresh={refreshData}
      />
    </div>
  );
}
