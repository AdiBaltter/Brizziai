
import React, { useState, useEffect } from 'react';
import { Process } from '@/api/entities';
import { User } from '@/api/entities';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Calendar, 
  MessageCircle, 
  FileText, 
  FileSignature,
  Users2,
  Plus,
  Settings,
  Save,
  ArrowLeft,
  Trash2,
  Phone, 
  CheckCircle, 
  ChevronDown 
} from 'lucide-react';
import StageEditSidebar from './StageEditSidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAccount } from '@/components/shared/AccountContext';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';

const categoryLabels = {
  'new-lead': 'ליד חדש',
  'schedule-meeting': 'קביעת פגישה',
  'meeting': 'פגישה',
  'send-message': 'שליחת הודעה',
  'documents': 'מסמכים',
  'price-quote': 'הצעת מחיר',
  'phone-call': 'שיחת טלפון',
  'deal-closure': 'סגירת עסקה',
  'communication': 'תקשורת'
};

// Updated stage templates with enhanced configurations
const STAGE_TEMPLATES = [
  {
    id: 'new-lead',
    name: 'ליד חדש',
    icon: UserPlus,
    color: 'bg-green-100 text-green-700 border-green-200',
    backgroundColor: '#dcfce7',
    iconColor: '#15803d',
    description: 'קליטת ליד חדש ופתיחת חדר דיגיטלי',
    category: 'new-lead',
    hideTimingConfig: true, // אין צורך בתזמון - מיידי
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'internal',
      category: 'new-lead'
    }
  },
  {
    id: 'schedule-meeting',
    name: 'קביעת פגישה',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    backgroundColor: '#dbeafe',
    iconColor: '#1d4ed8',
    description: 'שלב בו מתבצעת קביעת פגישה',
    category: 'schedule-meeting',
    hideTimingConfig: true, // טריגר מיידי אחרי השלב הקודם
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'external',
      category: 'schedule-meeting'
    }
  },
  {
    id: 'meeting',
    name: 'פגישה',
    icon: Users2,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    backgroundColor: '#f3e8ff',
    iconColor: '#7c3aed',
    description: 'שלב הפגישה עצמה',
    category: 'meeting',
    hideTimingConfig: true, // טריגר מיידי אחרי השלב הקודם
    allowSubStages: true, // מאפשר תת-שלבים של שליחת הודעה/תזכורת
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'external',
      category: 'meeting',
      meeting_duration: 60
    }
  },
  {
    id: 'send-message',
    name: 'שליחת הודעה / תזכורת',
    icon: MessageCircle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    backgroundColor: '#fef3c7',
    iconColor: '#a16207',
    description: 'שליחת תקשורת יזומה או מתוזמנת ללקוח',
    category: 'send-message',
    advancedTiming: true, // מציג אפשרויות תזמון מתקדמות
    defaultConfig: {
      timing_preset: 'custom',
      timing_type: 'immediate', // מיידי/אחרי קודם/לפני הבא
      visibility: 'external',
      category: 'send-message',
      message_config: {
        delivery_method: 'manual', // אוטומטי/ידני
        platform: 'whatsapp', // whatsapp/email
        message_type: 'regular',
        whatsapp_content: '',
        email_content: '',
        email_subject: '', // עבור מייל
        timing_type: 'immediate',
        scheduled_delay_value: 1,
        scheduled_delay_unit: 'days'
      }
    }
  },
  {
    id: 'documents',
    name: 'שליחה / בקשת חומרים',
    icon: FileText,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    backgroundColor: '#fed7aa',
    iconColor: '#c2410c',
    description: 'שיתוף או קבלת מסמכים בין העסק ללקוח',
    category: 'documents',
    hideTimingConfig: true, // משימה מיידית אחרי השלב הקודם
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'external',
      category: 'documents',
      documents_config: {
        action_type: 'request',
        execution_method: 'manual',
        request_config: { create_followup_task: false }
      }
    }
  },
  {
    id: 'price-quote',
    name: 'הכנת הצעת מחיר',
    icon: FileSignature,
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    backgroundColor: '#ccfbf1',
    iconColor: '#0f766e',
    description: 'הכנה ושליחה של הצעת מחיר ללקוח',
    category: 'price-quote',
    hideTimingConfig: true, // משימה מיידית ליוזר
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'external',
      category: 'price-quote',
      quote_config: {
        send_type: 'manual'
      }
    }
  },
  {
    id: 'phone-call',
    name: 'שיחת טלפון',
    icon: Phone,
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    backgroundColor: '#e0f2fe',
    iconColor: '#0284c7',
    description: 'יצירת משימה לביצוע שיחת טלפון',
    category: 'communication',
    hideTimingConfig: true, // משימה מיידית ליוזר
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'internal',
      category: 'phone-call',
      phone_call_config: {
        script: 'היי {{שם}}, מדבר {{שם_משתמש}} מ{{שם_חברה}}.\n\nאני מתקשר בנוגע ל...\n\nנקודות לשיחה:\n1. ...\n2. ...'
      }
    }
  },
  {
    id: 'deal-closure',
    name: 'סגירת עסקה',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    backgroundColor: '#d1fae5',
    iconColor: '#059669',
    description: 'סיום התהליך וסגירת העסקה עם הלקוח',
    category: 'deal-closure',
    hideTimingConfig: true, // מיידי
    defaultConfig: {
      timing_preset: 'immediately',
      visibility: 'internal',
      category: 'deal-closure'
    }
  }
];

function StageTemplate({ template, index }) {
  const IconComponent = template.icon;
  
  return (
    <Draggable draggableId={`template-${template.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 rounded-lg border-2 border-dashed cursor-move transition-all ${
            snapshot.isDragging 
              ? 'shadow-lg scale-105 bg-white border-blue-400 z-50' 
              : 'hover:shadow-md border-gray-300 hover:border-gray-400'
          }`}
          style={{ 
            backgroundColor: template.backgroundColor,
            ...provided.draggableProps.style
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${template.color}`} style={{ backgroundColor: template.backgroundColor }}>
              <IconComponent className="h-5 w-5" style={{ color: template.iconColor }} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{template.name}</p>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function ProcessStage({ stage, index, onSelect, isSelected, processStages }) {
  const template = STAGE_TEMPLATES.find(t => t.id === stage.templateId);
  const IconComponent = template?.icon || Settings;
  const isFixedStage = index === 0 || index === processStages.length - 1;
  
  const getTimingLabel = (stage) => {
    // עבור שלבים עם hideTimingConfig - תמיד מיידי
    if (template?.hideTimingConfig) {
      return 'מיידי';
    }
    
    // עבור שליחת הודעה/תזכורת - מציג פרטים מתקדמים
    if (stage.category === 'send-message') {
      const messageConfig = stage.message_config || {};
      if (messageConfig.delivery_method === 'manual') {
        return 'ידני';
      }
      
      switch (stage.timing_type || 'immediate') {
        case 'immediate': return 'מיידי';
        case 'after_previous': return `${messageConfig.scheduled_delay_value || 1} ${messageConfig.scheduled_delay_unit === 'hours' ? 'שעות' : 'ימים'} אחרי הקודם`;
        case 'before_next': return `${messageConfig.scheduled_delay_value || 1} ${messageConfig.scheduled_delay_unit === 'hours' ? 'שעות' : 'ימים'} לפני הבא`;
        default: return 'מיידי';
      }
    }
    
    // מקרים רגילים
    switch (stage.timing_preset) {
      case 'immediately': return 'מיידי';
      case '12_hours': return '12 שעות';
      case '1_day': return 'יום אחד';
      case '3_days': return '3 ימים';
      case 'custom': return `${stage.timing_custom_value || 1} ${stage.timing_custom_unit === 'hours' ? 'שעות' : 'ימים'}`;
      default: return 'מיידי';
    }
  };
  
  return (
    <Draggable draggableId={stage.id} index={index} isDragDisabled={isFixedStage}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
          style={provided.draggableProps.style}
        >
          <Card 
            className={`transition-all ${
              isSelected 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            } ${snapshot.isDragging ? 'shadow-lg transform rotate-2' : ''} ${
              isFixedStage ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'cursor-pointer'
            }`}
            onClick={() => !isFixedStage && onSelect(stage.id)}
            style={{ 
              backgroundColor: stage.backgroundColor || template?.backgroundColor || '#f9fafb',
              borderColor: stage.iconColor || template?.iconColor || '#6b7280',
              borderWidth: '2px'
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  className={`p-2 rounded-lg ${stage.color || template?.color || 'bg-gray-100'}`}
                  style={{ backgroundColor: stage.backgroundColor || template?.backgroundColor }}
                >
                  <IconComponent 
                    className="h-5 w-5" 
                    style={{ color: stage.iconColor || template?.iconColor || '#6b7280' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{stage.name}</h3>
                  {stage.description && (
                    <p className="text-sm text-gray-500 truncate">{stage.description}</p>
                  )}
                  
                  {/* הצגת קטגוריה + תזמון */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{
                        backgroundColor: `${stage.iconColor || template?.iconColor || '#6b7280'}20`,
                        color: stage.iconColor || template?.iconColor || '#6b7280',
                        borderColor: stage.iconColor || template?.iconColor || '#6b7280'
                      }}
                    >
                      {categoryLabels[stage.category] || stage.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getTimingLabel(stage)}
                    </Badge>
                    {stage.visibility === 'external' && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">גלוי ללקוח</Badge>
                    )}
                    {stage.message_config?.platform && (
                      <Badge variant="outline" className="text-xs">
                        {stage.message_config.platform === 'whatsapp' ? 'WhatsApp' : 'Email'}
                      </Badge>
                    )}
                  </div>
                  
                  {/* תת-שלבים (אם קיימים) */}
                  {stage.subStages && stage.subStages.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-gray-200">
                      {stage.subStages.map((subStage, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-1 text-xs text-gray-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>{subStage.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!isFixedStage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(stage.id);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Connection line */}
          {index < processStages.length - 1 && (
            <div className="flex justify-center my-2">
              <div className="h-6 w-px bg-gray-300 relative">
                <ChevronDown className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 text-gray-400 rounded-full border" />
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function ProcessCanvasBuilder({ process, onBack }) {
  const [processName, setProcessName] = useState(process?.name || 'תהליך מכירה חדש');
  const [processStages, setProcessStages] = useState(() => {
    if (process?.stages && process.stages.length > 0) {
      return process.stages;
    } else {
      // New process - always starts with 'new-lead' and ends with 'deal-closure'
      const newLeadTemplate = STAGE_TEMPLATES.find(t => t.id === 'new-lead');
      const dealClosureTemplate = STAGE_TEMPLATES.find(t => t.id === 'deal-closure');
      
      if (!newLeadTemplate || !dealClosureTemplate) {
        console.error("Required STAGE_TEMPLATES (new-lead or deal-closure) not found.");
        return []; 
      }

      return [
        {
          id: `stage-new-lead-${Date.now()}`,
          name: newLeadTemplate.name,
          description: newLeadTemplate.description,
          templateId: newLeadTemplate.id,
          color: newLeadTemplate.color,
          backgroundColor: newLeadTemplate.backgroundColor,
          iconColor: newLeadTemplate.iconColor,
          ...newLeadTemplate.defaultConfig
        },
        {
          id: `stage-deal-closure-${Date.now() + 1}`,
          name: dealClosureTemplate.name,
          description: dealClosureTemplate.description,
          templateId: dealClosureTemplate.id,
          color: dealClosureTemplate.color,
          backgroundColor: dealClosureTemplate.backgroundColor,
          iconColor: dealClosureTemplate.iconColor,
          ...dealClosureTemplate.defaultConfig
        }
      ];
    }
  });
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActive, setIsActive] = useState(process?.is_active ?? true);
  const [isDraft, setIsDraft] = useState(!process || !process.id); // טיוטא אם זה תהליך חדש או לא נשמר
  
  // Using account context
  const { accountId, loading: accountLoading } = useAccount();

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;

    console.log('Drag ended:', { source, destination, draggableId });

    // Prevent dragging structural stages (first and last)
    if (source.droppableId === 'canvas') {
      const sourceIndex = source.index;
      const isSourceFirst = sourceIndex === 0;
      const isSourceLast = sourceIndex === processStages.length - 1;
      
      if (isSourceFirst || isSourceLast) {
        console.log('Cannot drag structural stages');
        return;
      }
    }

    // Prevent dropping on first or last position
    if (destination.droppableId === 'canvas') {
      const destIndex = destination.index;
      const isDestinationFirst = destIndex === 0;
      const isDestinationLast = destIndex === processStages.length - 1;
      
      if (isDestinationFirst || isDestinationLast) {
        console.log('Cannot drop on structural positions');
        return;
      }
    }

    // Dragging from templates to canvas
    if (source.droppableId === 'templates' && destination.droppableId === 'canvas') {
      const templateId = draggableId.replace('template-', '');
      const template = STAGE_TEMPLATES.find(t => t.id === templateId);
      
      // Prevent adding new-lead or deal-closure templates again
      if (template && !['new-lead', 'deal-closure'].includes(template.id)) {
        const newStage = {
          id: `stage-${Date.now()}`,
          name: template.name,
          description: template.description,
          templateId: template.id,
          // שמירת צבעים ואייקונים מהתבנית
          color: template.color,
          backgroundColor: template.backgroundColor,
          iconColor: template.iconColor,
          ...template.defaultConfig
        };
        
        // Insert before the last stage (deal closure), but not at position 0
        const insertIndex = Math.max(1, Math.min(destination.index, processStages.length - 1));
        const newStages = [...processStages];
        newStages.splice(insertIndex, 0, newStage);
        setProcessStages(newStages);
        setSelectedStageId(newStage.id);
        setIsDraft(true);
        console.log('Added new stage:', newStage);
      }
      return;
    }

    // Reordering within canvas
    if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      const sourceIndex = source.index;
      const destIndex = destination.index;
      
      // Prevent moving first or last stages
      if (sourceIndex === 0 || sourceIndex === processStages.length - 1) return;
      if (destIndex === 0 || destIndex === processStages.length - 1) return;
      
      const items = Array.from(processStages);
      const [reorderedItem] = items.splice(sourceIndex, 1);
      items.splice(destIndex, 0, reorderedItem);
      setProcessStages(items);
      setIsDraft(true);
      console.log('Reordered stages');
      return;
    }
  };

  const handleStageUpdate = (stageId, field, value) => {
    setProcessStages(prev =>
      prev.map(stage =>
        stage.id === stageId ? { ...stage, [field]: value } : stage
      )
    );
    setIsDraft(true); // סימון כטיוטא
  };

  const handleStageDelete = (stageId) => {
    const stageIndex = processStages.findIndex(s => s.id === stageId);
    
    // Prevent deletion of the first or last stage
    if (stageIndex === 0 || stageIndex === processStages.length - 1) {
      alert("לא ניתן למחוק את השלב הראשון או האחרון בתהליך");
      return;
    }

    setProcessStages(prev => prev.filter(stage => stage.id !== stageId));
    if (selectedStageId === stageId) {
      setSelectedStageId(null);
    }
    setIsDraft(true); // סימון כטיוטא
  };

  const handleSave = async () => {
    if (!accountId) {
      console.error("Cannot save process: Account ID is missing.");
      return;
    }
    
    setIsSaving(true);
    try {
      const secureOps = new SecureEntityOperations(Process);
      
      // וודא שכל שלב שומר את הצבעים והאייקונים שלו
      const processDataWithColors = processStages.map(stage => {
        const template = STAGE_TEMPLATES.find(t => t.id === stage.templateId);
        return {
          ...stage,
          // שמירת צבעים ואייקונים מהתבנית אם לא קיימים כבר על השלב עצמו
          color: stage.color || template?.color,
          backgroundColor: stage.backgroundColor || template?.backgroundColor,
          iconColor: stage.iconColor || template?.iconColor
        };
      });
      
      const processData = {
        name: processName,
        stages: processDataWithColors,
        is_active: isActive,
        account_id: accountId
      };
      
      if (process?.id) {
        await secureOps.secureUpdate(process.id, processData);
      } else {
        await secureOps.secureCreate(processData);
      }
      
      setIsDraft(false); // לא עוד טיוטא
      alert('התהליך נשמר בהצלחה!');
      onBack();
    } catch (error) {
      console.error('Error saving process:', error);
      alert('שגיאה בשמירת התהליך: ' + (error.message || 'נסה שוב.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProcess = async () => {
    if (!process?.id) return;
    
    setIsDeleting(true);
    try {
      const secureOps = new SecureEntityOperations(Process);
      await secureOps.secureDelete(process.id);
      onBack();
    } catch (error) {
      console.error('Error deleting process:', error);
      alert('שגיאה במחיקת התהליך: ' + (error.message || 'נסה שוב.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDraft = () => {
    const confirmed = window.confirm("האם אתה בטוח שברצונך למחוק את הטיוטא?");
    if (confirmed) {
      onBack();
    }
  };

  const selectedStage = processStages.find(s => s.id === selectedStageId);
  const availableTemplates = STAGE_TEMPLATES.filter(t => !['new-lead', 'deal-closure'].includes(t.id));

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex bg-gray-50">
        {/* Templates Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold">בנה את תהליך המכירה שלך</h2>
              <p className="text-sm text-gray-500">גרור שלבים לבניית התהליך</p>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">איך זה עובד?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• גרור שלבים מכאן אל האזור המרכזי</li>
              <li>• "ליד חדש" תמיד יהיה השלב הראשון</li>
              <li>• "סגירת עסקה" תמיד יהיה השלב האחרון</li>
              <li>• לחץ על כל שלב לעריכה מפורטת</li>
            </ul>
          </div>
          
          <Droppable droppableId="templates" isDropDisabled={false}>
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                className={`space-y-3 ${snapshot.isDraggingOver ? 'opacity-50' : ''}`}
              >
                {availableTemplates.map((template, index) => (
                  <StageTemplate key={template.id} template={template} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col p-4 bg-gray-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
              <Button onClick={onBack} variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                חזרה לרשימה
              </Button>
              <Input
                value={processName}
                onChange={(e) => {
                  setProcessName(e.target.value);
                  setIsDraft(true);
                }}
                className="text-2xl font-bold border-0 shadow-none p-0 h-auto flex-1 min-w-0"
              />
              {isDraft && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">טיוטא</Badge>}
            </div>
            <div className="flex items-center gap-4">
              {process?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק תהליך
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את התהליך "{processName}" לצמיתות. 
                        לא ניתן לבטל פעולה זו.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteProcess}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'מוחק...' : 'מחק תהליך'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {isDraft && (
                <Button variant="outline" size="sm" onClick={handleDeleteDraft} className="border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק טיוטא
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Switch
                  id="process-active"
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setIsActive(checked);
                    setIsDraft(true);
                  }}
                  className="data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="process-active" className="text-sm font-medium">
                  תהליך {isActive ? 'פעיל' : 'לא פעיל'}
                </Label>
              </div>
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 ml-2" />
                {isSaving ? 'שומר...' : 'שמור תהליך'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Canvas Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <Droppable droppableId="canvas">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-96 p-6 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {processStages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎯</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            בנה את תהליך המכירה שלך
                          </h3>
                          <p className="text-gray-500">
                            גרור שלבים מהצד השמאלי כדי להתחיל לבנות את התהליך שלך
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {processStages.map((stage, index) => (
                            <ProcessStage
                              key={stage.id}
                              stage={stage}
                              index={index}
                              onSelect={setSelectedStageId}
                              isSelected={selectedStageId === stage.id}
                              processStages={processStages}
                            />
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Sidebar */}
        {selectedStage && (
          <StageEditSidebar
            stage={selectedStage}
            template={STAGE_TEMPLATES.find(t => t.id === selectedStage.templateId)}
            onUpdate={handleStageUpdate}
            onDelete={handleStageDelete}
            onClose={() => setSelectedStageId(null)}
          />
        )}
      </div>
    </DragDropContext>
  );
}
