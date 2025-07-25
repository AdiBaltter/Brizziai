
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, Calendar, User, ChevronDown, ChevronUp, Edit, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ProcessActionModal from '../../process-automation/ProcessActionModal';
import { ProcessAutomationService } from '../../process-automation/ProcessAutomationService';
import { Task } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function TasksTab({ tasks, entity, entityType, onUpdate }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [rejectingTask, setRejectingTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('דלג');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const { toast } = useToast();
  
  // פילטור המשימות לפי סטטוס
  const activeTasks = tasks.filter(task => 
    task.status === 'open' || 
    task.status === 'in_progress' || 
    task.status === 'ממתין לאישור'
  );
  
  const completedTasksList = tasks.filter(task => 
    task.status === 'done' || 
    task.status === 'אושר' || 
    task.status === 'הושלם'
  ).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  const displayedCompletedTasks = showAllHistory ? completedTasksList : completedTasksList.slice(0, 5);

  const getTaskTypeColor = (task) => {
    if (task.task_type === 'process_action') {
      if (task.status === 'ממתין לאישור') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (task.status === 'אושר') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    
    switch (task.status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'done': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleApprove = async (task) => {
    try {
        console.log('Approving task:', task.id, 'for entity:', entity.id);
        await ProcessAutomationService.approveActionAndAdvanceStage(task, entity);
        toast({ 
          title: 'הצלחה', 
          description: 'המשימה אושרה והלקוח קודם לשלב הבא.' 
        });
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error("Failed to approve task:", error);
        toast({ 
          variant: 'destructive', 
          title: 'שגיאה', 
          description: 'אישור המשימה נכשל: ' + (error.message || 'שגיאה לא ידועה')
        });
    }
  };

  const openRejectModal = (task) => {
    setRejectingTask(task);
    setRejectionReason('דלג');
    setRejectionNotes('');
  };

  const handleReject = async () => {
    if (!rejectingTask) return;

    try {
        console.log('Rejecting task:', rejectingTask.id, 'reason:', rejectionReason);
        await ProcessAutomationService.handleActionResponse(rejectingTask, entity, rejectionReason, rejectionNotes);
        toast({ 
          title: 'הצלחה', 
          description: 'המשימה נדחתה ועודכנה.' 
        });
        setRejectingTask(null);
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error("Failed to reject task:", error);
        toast({ 
          variant: 'destructive', 
          title: 'שגיאה', 
          description: 'דחיית המשימה נכשלה: ' + (error.message || 'שגיאה לא ידועה')
        });
    }
  };

  const getTaskStatusText = (task) => {
    if (task.task_type === 'process_action') {
      switch (task.status) {
        case 'ממתין לאישור': return 'ממתין לאישור';
        case 'אושר': return 'אושרה';
        case 'הושלם': return 'הושלמה';
        default: return task.status;
      }
    }
    
    switch (task.status) {
      case 'open': return 'פתוח';
      case 'in_progress': return 'בטיפול';
      case 'done': return 'הושלם';
      default: return task.status;
    }
  };

  const handleTaskClick = (task) => {
    if (task.task_type === 'process_action' && task.status === 'ממתין לאישור') {
      setSelectedAction(task);
    }
  };

  const handleCompleteTask = async (e, task) => {
    e.stopPropagation();

    // Prevent process_action tasks from being completed this way
    if (task.task_type === 'process_action') {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן להשלים משימות תהליך ישירות מכאן. אנא טפל בהן דרך חלון הטיפול.",
      });
      return;
    }

    try {
      await Task.update(task.id, { status: 'done' });
      toast({
        title: "משימה הושלמה!",
        description: `המשימה "${task.title}" עודכנה בהצלחה.`,
      });
      if (onUpdate) onUpdate(); // Trigger a refresh of the tasks
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "עדכון המשימה נכשל.",
      });
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskStatus(task.status);
    setTaskNotes(task.notes || '');
  };

  const handleSaveTaskStatus = async () => {
    if (!editingTask) return;
    
    setIsSaving(true);
    try {
      await Task.update(editingTask.id, { 
        status: taskStatus,
        notes: taskNotes
      });
      toast({
        title: "משימה עודכנה!",
        description: `המשימה "${editingTask.title}" עודכנה בהצלחה.`,
      });
      setEditingTask(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "עדכון המשימה נכשל.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const TaskCard = ({ task, showDate = false }) => {
    const isProcessAction = task.task_type === 'process_action';
    const isPendingApproval = isProcessAction && task.status === 'ממתין לאישור';
    const isCompleted = ['done', 'אושר', 'הושלם'].includes(task.status);

    return (
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          isPendingApproval ? 'cursor-pointer hover:bg-orange-50' : ''
        }`}
        onClick={isPendingApproval ? () => handleTaskClick(task) : undefined}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Badge className={getTaskTypeColor(task)} variant="outline">
                {getTaskStatusText(task)}
              </Badge>
              {task.task_type === 'process_action' && (
                <Badge variant="secondary" className="text-xs">משימת תהליך</Badge>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              {task.details && (
                <p className="text-sm text-gray-600 mt-1">{task.details}</p>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            {showDate && task.updated_date && (
              <div className="flex items-center gap-1 justify-end">
                <span>{format(new Date(task.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                <Calendar className="h-3 w-3" />
              </div>
            )}
            
            {task.due_date && (
              <div className="flex items-center gap-1 justify-end">
                <span>יעד: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he })}</span>
                <Clock className="h-3 w-3" />
              </div>
            )}
            
            {task.created_date && (
              <div className="flex items-center gap-1 justify-end">
                <span>נוצר: {format(new Date(task.created_date), 'dd/MM/yyyy', { locale: he })}</span>
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
          
          {!isCompleted && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center gap-2">
              {isPendingApproval ? (
                <>
                  <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleApprove(task);}}>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); openRejectModal(task);}}>
                    <XCircle className="h-5 w-5 text-red-500" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                    <Edit className="h-4 w-4 ml-2" />
                    עדכן סטטוס
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => handleCompleteTask(e, task)}>
                    <CheckSquare className="h-4 w-4 ml-2" />
                    סמן כהושלם
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* משימות פעילות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            משימות פעילות ({activeTasks.length})
            <CheckSquare className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTasks.length > 0 ? (
            <div className="space-y-4">
              {activeTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין משימות פעילות</p>
          )}
        </CardContent>
      </Card>

      {/* היסטוריית משימות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            היסטוריית משימות ({completedTasksList.length})
            <Clock className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedTasksList.length > 0 ? (
            <div className="space-y-4">
              {displayedCompletedTasks.map(task => (
                <TaskCard key={task.id} task={task} showDate={true} />
              ))}
              
              {completedTasksList.length > 5 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="gap-2"
                  >
                    {showAllHistory ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        הצג פחות
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        הצג עוד ({completedTasksList.length - 5} משימות)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין היסטוריית משימות</p>
          )}
        </CardContent>
      </Card>

      {/* Task Edit Modal */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>עדכון משימה: {editingTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-status">סטטוס משימה</Label>
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">פתוח</SelectItem>
                  <SelectItem value="in_progress">בטיפול</SelectItem>
                  <SelectItem value="done">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="task-notes">הערות</Label>
              <Textarea
                id="task-notes"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="הוסף הערות למשימה..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                ביטול
              </Button>
              <Button onClick={handleSaveTaskStatus} disabled={isSaving}>
                {isSaving ? 'שומר...' : 'שמור'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reject Task Modal */}
      <AlertDialog open={!!rejectingTask} onOpenChange={() => setRejectingTask(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>דחיית משימה: {rejectingTask?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              בחר את סיבת הדחייה והוסף הערות במידת הצורך.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup value={rejectionReason} onValueChange={setRejectionReason}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="דלג" id="r-skip" />
                <Label htmlFor="r-skip">דלג על שלב זה</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="ליד לא רלוונטי" id="r-irrelevant" />
                <Label htmlFor="r-irrelevant">ליד/לקוח לא רלוונטי</Label>
              </div>
            </RadioGroup>
            <Textarea 
              placeholder="הוסף הערה (אופציונלי)" 
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>אשר דחייה</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* מודל לטיפול במשימות תהליך */}
      {selectedAction && (
        <ProcessActionModal
          action={selectedAction}
          entity={entity}
          onClose={() => setSelectedAction(null)}
          onUpdate={() => {
            setSelectedAction(null);
            if (onUpdate) onUpdate(); // Call parent onUpdate to refresh tasks
          }}
        />
      )}
    </div>
  );
}
