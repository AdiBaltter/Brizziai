import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Clock, CheckCircle, XCircle, ArrowLeft, ExternalLink, Rocket, Undo2, X } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ProcessAction } from '@/api/entities';
import { ProcessAutomationService } from './ProcessAutomationService';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";
import { Process } from '@/api/entities';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

export default function ProcessActionModal({ action, entity, processes, onClose, onUpdate }) {
  const [selectedResponse, setSelectedResponse] = useState('');
  const [secondaryResponse, setSecondaryResponse] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUndoTimer, setShowUndoTimer] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(10);
  const [pendingAction, setPendingAction] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();

  // Early return if action or entity is missing
  if (!action || !entity) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>שגיאה</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-red-600 mb-4">לא ניתן לטעון את פרטי המשימה</p>
            <Button onClick={onClose}>סגור</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const executePendingAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    setIsUpdating(true);
    setShowUndoTimer(false);

    try {
      const finalResponse = pendingAction.response;
      const { actionId, updateText, clientId, leadId, organizationId } = pendingAction;

      const entityObject = entity;
      const processObject = (entityObject && entityObject.process_type && processes)
        ? processes[entityObject.process_type]
        : null;

      if (!entityObject) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "לא ניתן למצוא את פרטי הליד או הלקוח."
        });
        throw new Error("Missing entity details.");
      }

      // Specific logic for 'הפגישה נדחתה למועד אחר'
      if (finalResponse === 'הפגישה נדחתה למועד אחר') {
        await ProcessAction.update(actionId, {
          status: 'נדחה',
          user_response: finalResponse,
          update_text: updateText,
          is_undone: false,
        });
        toast({ title: "הפגישה נדחתה", description: "המשימה עודכנה. אנא קבע פגישה חדשה באופן ידני." });
        onUpdate();
        onClose();
        return;
      }

      // Update the action with the determined status
      await ProcessAction.update(actionId, {
        status: getStatusFromResponse(finalResponse),
        user_response: finalResponse,
        update_text: updateText
      });

      // Handle subsequent logic (lead conversion, task creation, stage advancement)
      const result = await handleNextStepLogic(pendingAction);

      toast({
        title: "הפעולה הושלמה בהצלחה",
        description: `הפעולה עבור ${entityObject.first_name || entityObject.full_name || 'הליד/לקוח'} עודכנה.`,
      });

      onUpdate();

      if (result?.convertedToClient) {
        window.location.href = createPageUrl('Clients');
      } else {
        onClose();
      }

    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעת ביצוע הפעולה."
      });
    } finally {
      setIsProcessing(false);
      setIsUpdating(false);
      setPendingAction(null);
    }
  };

  useEffect(() => {
    let interval;
    if (showUndoTimer && undoCountdown > 0) {
      interval = setInterval(() => {
        setUndoCountdown(prev => prev - 1);
      }, 1000);
    } else if (showUndoTimer && undoCountdown === 0) {
      executePendingAction();
    }
    return () => clearInterval(interval);
  }, [showUndoTimer, undoCountdown]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const entityType = entity?.first_name ? 'client' : 'lead';
  const entityName = entityType === 'client'
    ? `${entity.first_name || ''} ${entity.last_name || ''}`.trim()
    : entity?.full_name || 'לא זמין';

  const clientRoomUrl = entityType === 'client'
    ? createPageUrl('ClientRoom', `?id=${entity.id}`)
    : createPageUrl('ClientRoom', `?lead_id=${entity.id}`);

  const getResponseOptions = () => {
    const actionType = action?.action_type;
    const stageCategory = action?.stage_category;

    switch (actionType) {
      case 'stage_approval':
        if (stageCategory === 'schedule-meeting') {
          return [
            { value: 'נקבע', label: 'נקבע', color: 'bg-green-100 text-green-800' },
            { value: 'ליד לא רלוונטי', label: 'ליד לא רלוונטי', color: 'bg-red-100 text-red-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
          ];
        }
        return [
          { value: 'אושר', label: 'אושר', color: 'bg-green-100 text-green-800' },
          { value: 'נדחה', label: 'נדחה', color: 'bg-red-100 text-red-800' },
          { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'meeting_followup':
        return [
          { value: 'בוצע', label: 'בוצע', color: 'bg-green-100 text-green-800' },
          { value: 'לא בוצע', label: 'לא בוצע', color: 'bg-red-100 text-red-800' },
          { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'documents_send_approval':
        return [
            { value: 'מסמכים נשלחו', label: 'כן, מסמכים נשלחו', color: 'bg-green-100 text-green-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'documents_request_approval':
        return [
            { value: 'בקשת חומרים נשלחה', label: 'כן, נשלחה בקשה', color: 'bg-green-100 text-green-800' },
            { value: 'בקשת חומרים לא נשלחה', label: 'לא, לא נשלחה', color: 'bg-red-100 text-red-800' }
        ];

      case 'documents_verify_receipt':
        return [
            { value: 'חומרים התקבלו', label: 'כן, החומרים התקבלו', color: 'bg-green-100 text-green-800' },
            { value: 'חומרים לא התקבלו', label: 'לא, עדיין לא התקבלו', color: 'bg-red-100 text-red-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'quote_preparation_approval':
        return [
            { value: 'הצעה נשלחה', label: 'כן, נשלחה הצעה', color: 'bg-green-100 text-green-800' },
            { value: 'הצעה לא נשלחה', label: 'לא, לא נשלחה', color: 'bg-red-100 text-red-800' },
            { value: 'הצעה לא רלוונטית', label: 'הצעה לא רלוונטית', color: 'bg-gray-100 text-gray-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'quote_acceptance_approval':
        return [
            { value: 'הצעה התקבלה', label: 'כן, ההצעה התקבלה', color: 'bg-green-100 text-green-800' },
            { value: 'הצעה לא התקבלה', label: 'לא, ההצעה לא התקבלה', color: 'bg-red-100 text-red-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'phone_call_completion':
        return [
            { value: 'שיחה בוצעה', label: 'כן, בוצעה', color: 'bg-green-100 text-green-800' },
            { value: 'שיחה לא בוצעה', label: 'לא בוצעה', color: 'bg-red-100 text-red-800' },
            { value: 'ליד לא רלוונטי', label: 'ליד לא רלוונטי', color: 'bg-red-100 text-red-800' },
            { value: 'דלג', label: 'דלג', color: 'bg-yellow-100 text-yellow-800' }
        ];

      case 'deal_closure_approval':
        return [
            { value: 'הליד הפך ללקוח', label: 'הליד הפך ללקוח', color: 'bg-green-100 text-green-800' },
            { value: 'ליד לא רלוונטי', label: 'ליד לא רלוונטי', color: 'bg-red-100 text-red-800' }
        ];

      default:
        return [
          { value: 'אושר', label: 'אושר', color: 'bg-green-100 text-green-800' },
          { value: 'נדחה', label: 'נדחה', color: 'bg-red-100 text-red-800' }
        ];
    }
  };

  const getSecondaryOptions = () => {
    const actionType = action?.action_type;
    
    if (actionType === 'meeting_followup' && selectedResponse === 'לא בוצע') {
      return [
        { value: 'ליד לא רלוונטי', label: 'ליד לא רלוונטי', color: 'bg-red-100 text-red-800' },
        { value: 'הפגישה נדחתה למועד אחר', label: 'הפגישה נדחתה למועד אחר', color: 'bg-yellow-100 text-yellow-800' }
      ];
    }

    if (actionType === 'meeting_followup' && selectedResponse === 'בוצע') {
      return [
        { value: 'כן המשך לשלב הבא', label: 'כן המשך לשלב הבא', color: 'bg-green-100 text-green-800' },
        { value: 'ליד לא רלוונטי', label: 'ליד לא רלוונטי', color: 'bg-red-100 text-red-800' }
      ];
    }

    return [];
  };

  const handleResponseSubmit = async () => {
    if (!selectedResponse || !action?.id) return;

    const finalResponse = secondaryResponse || selectedResponse;

    const isCriticalClosure = ['ליד לא רלוונטי', 'הצעה לא רלוונטית', 'הליד הפך ללקוח'].includes(finalResponse);

    if (isCriticalClosure) {
      const confirmMessage = `האם אתה בטוח שברצונך לבצע פעולה זו? פעולה זו עשויה להוביל לסגירת הליד/הצעה.`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    const actionData = {
      response: finalResponse,
      updateText,
      actionId: action.id,
      clientId: action.client_id,
      leadId: action.lead_id,
      organizationId: action.account_id,
      stage: action.stage_category
    };

    setPendingAction(actionData);
    setShowUndoTimer(true);
    setUndoCountdown(10);
  };

  const handleNextStepLogic = async (actionData) => {
    const { response, clientId, leadId, organizationId } = actionData;

    if (response === 'ליד לא רלוונטי' || response === 'הצעה לא רלוונטית') {
      await ProcessAutomationService.markLeadAsIrrelevant(clientId, leadId, organizationId);
      return { convertedToClient: false };
    }

    if (response === 'הליד הפך ללקוח') {
      if (leadId) {
        const lead = await Lead.get(leadId);
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

        await ProcessAutomationService.createDigitalRoom(newClient.id);
        await Lead.delete(lead.id);

        return { convertedToClient: true };
      }
      return { convertedToClient: false };
    }

    const shouldAdvance = ![
        'ליד לא רלוונטי',
        'הצעה לא רלוונטית',
        'הליד הפך ללקוח',
        'הפגישה נדחתה למועד אחר'
    ].includes(response);

    if (response === 'בקשת חומרים נשלחה') {
        const processesData = await Process.filter({ account_id: organizationId });
        let stageConfig = null;
        for (const p of processesData) {
            const foundStage = p.stages.find(s => s.id === action.process_stage_id);
            if (foundStage) {
                stageConfig = foundStage;
                break;
            }
        }
        if (stageConfig && stageConfig.documents_config?.request_config?.create_followup_task) {
            await ProcessAutomationService.createDocumentReceiptVerificationTask(clientId, leadId, stageConfig, organizationId);
        }
    }

    if (response === 'הצעה נשלחה') {
        const processesData = await Process.filter({ account_id: organizationId });
        let stageConfig = null;
        for (const p of processesData) {
            const foundStage = p.stages.find(s => s.id === action.process_stage_id);
            if (foundStage) {
                stageConfig = foundStage;
                break;
            }
        }
        if (stageConfig) {
            await ProcessAutomationService.createQuoteAcceptanceTask(clientId, leadId, stageConfig, organizationId);
        }
    }

    if (shouldAdvance) {
        const process = processes && entity ? processes[entity.process_type] : null;
        await ProcessAutomationService.advanceClientToNextStage(clientId, leadId, organizationId, entity, process);
    }
    return { convertedToClient: false };
  };

  const getStatusFromResponse = (response) => {
    if (response === 'הפגישה נדחתה למועד אחר') return 'נדחה';
    if (response.includes('לא רלוונטי') || response === 'הליד הפך ללקוח') return 'הושלם';
    if (response === 'דלג') return 'נדחה';
    if (response.includes('לא')) return 'נדחה';
    return 'אושר';
  };

  const cancelUndo = () => {
    setShowUndoTimer(false);
    setPendingAction(null);
    setUndoCountdown(10);
    setSelectedResponse('');
    setSecondaryResponse('');
  };

  const responseOptions = getResponseOptions();
  const secondaryOptions = getSecondaryOptions();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(entityName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">
                {action?.title || 'משימה'}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {entityName} • {action?.stage_name || 'שלב לא ידוע'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {getInitials(entityName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-blue-900">{entityName}</div>
                    <div className="text-sm text-blue-700">
                      {entityType === 'client' ? 'לקוח' : 'ליד'} • {entity?.email || 'אין מייל'}
                    </div>
                  </div>
                </div>
                <Link to={clientRoomUrl}>
                  <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    כניסה לפרטי {entityType === 'client' ? 'לקוח' : 'ליד'}
                  </Button>
                </Link>
              </div>
              {action?.created_date && (
                <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
                  <span>נוצר בתאריך: {format(new Date(action.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                  {action.updated_date && action.updated_date !== action.created_date && (
                    <span>עודכן: {format(new Date(action.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {showUndoTimer && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-800">הפעולה תתבצע בעוד {undoCountdown} שניות</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={cancelUndo}>
                      <Undo2 className="h-4 w-4 ml-2" />
                      חזור
                    </Button>
                    <Button variant="default" size="sm" onClick={executePendingAction}>
                      <Rocket className="h-4 w-4 ml-2" />
                      בצע עכשיו
                    </Button>
                </div>
              </div>
            </div>
          )}

          {!showUndoTimer && !isProcessing && !isUpdating && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-medium">בחר תגובה:</Label>
                <div className="grid grid-cols-1 gap-2">
                  {responseOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedResponse === option.value ? "default" : "outline"}
                      className={`justify-center h-12 ${selectedResponse === option.value ? 'ring-2 ring-blue-500' : option.color}`}
                      onClick={() => {
                        setSelectedResponse(option.value);
                        setSecondaryResponse('');
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {secondaryOptions.length > 0 && selectedResponse && (
                <div className="space-y-3">
                  <Separator />
                  <Label className="text-base font-medium">
                    {selectedResponse === 'בוצע' ? 'האם להמשיך לשלב הבא?' : 'בחר פעולה נוספת:'}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {secondaryOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={secondaryResponse === option.value ? "default" : "outline"}
                        className={`justify-center h-12 ${secondaryResponse === option.value ? 'ring-2 ring-blue-500' : option.color}`}
                        onClick={() => setSecondaryResponse(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="update-text">עדכון נוסף (רשות)</Label>
                <Textarea
                  id="update-text"
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="הוסף עדכון או הערות..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  ביטול
                </Button>
                <Button
                  onClick={handleResponseSubmit}
                  disabled={!selectedResponse}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  שלח תגובה
                </Button>
              </div>
            </>
          )}

          {(isProcessing || isUpdating) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">מעבד את הפעולה...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
