
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import ProcessActionModal from "../process-automation/ProcessActionModal";
import { createPageUrl } from "@/utils";

const getUrgencyIndicator = (date) => {
    const now = new Date();
    const createdDate = new Date(date);
    const hours_diff = (now.getTime() - createdDate.getTime()) / (1000 * 3600);

    if (hours_diff > 72) return "bg-red-500"; // More than 3 days
    if (hours_diff > 24) return "bg-orange-500"; // More than 1 day
    return "bg-green-500"; // Less than 1 day
};

// פונקציית עזר לקביעת צבע הדחיפות
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'normal': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-400';
  }
};

export default function TaskList({ tasks = [], approvalTasks = [], clients = {}, leads = {}, loading, onUpdate, isFullPage = false }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pendingApprovalTasks = approvalTasks.filter(task => task.status === "ממתין לאישור");
  
  const sortedApprovalTasks = [...pendingApprovalTasks].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const itemsToShow = isFullPage ? Infinity : 5;

  const handleTaskClick = (action, isApprovalTask) => { // Modified to accept isApprovalTask
    setSelectedAction(action);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setSelectedAction(null);
    setModalOpen(false);
  };

  const renderApprovalTask = (task) => {
    const entity = leads[task.lead_id] || clients[task.client_id];
    const entityName = entity?.full_name || entity?.first_name || 'לא ידוע';

    return (
      <div 
        key={task.id} 
        className="flex items-start gap-4 p-4 border-t border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => handleTaskClick(task, true)} // Pass true for approval task
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        <div className="flex-shrink-0 pt-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" title="ממתין לאישור"></div>
        </div>
        <div className="flex-grow min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{task.title}</p>
          <p className="text-gray-500 text-xs">
            עבור: {entityName}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button variant="outline" size="sm">פרטים</Button>
        </div>
      </div>
    );
  };

  const renderRegularTask = (task) => {
    const entity = leads[task.lead_id] || clients[task.client_id];
    const entityName = entity?.full_name || entity?.first_name || 'לא ידוע';

    return (
      <div 
        key={task.id} 
        className="flex items-start gap-4 p-4 border-t border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => handleTaskClick(task, false)} // Pass false for regular task
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        <div className="flex-shrink-0 pt-1">
          <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`} title={`דחיפות: ${task.priority}`}></div>
        </div>
        <div className="flex-grow min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{task.title}</p>
          <p className="text-gray-500 text-xs">
            {entityName ? `עבור: ${entityName}` : 'משימה כללית'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button variant="outline" size="sm">פרטים</Button>
        </div>
      </div>
    );
  };


  const renderTaskList = (tasksList) => {
    const displayTasks = showAll || isFullPage ? tasksList : tasksList.slice(0, itemsToShow);
    
    if (tasksList.length === 0) {
      return (
         <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>אין משימות הממתינות לאישור</p>
        </div>
      );
    }

    return (
      <div className="space-y-0"> {/* Removed vertical spacing to allow border-t to create spacing */}
        {/* Header row - note: this header's columns might not align perfectly with new item layout */}
        <div className="grid grid-cols-4 gap-4 px-3 py-2 bg-gray-50 rounded-lg border-b text-sm font-medium text-gray-600 text-right">
          <div>שם הלקוח</div>
          <div>שלב בתהליך</div>
          <div>תיאור המשימה</div>
          <div>תאריך יצירה</div>
        </div>
        
        {/* Task rows - now using renderApprovalTask */}
        {displayTasks.map((task) => renderApprovalTask(task))} 
        
        {/* Show more button */}
        {!isFullPage && tasksList.length > itemsToShow && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAll(!showAll)} 
              className="flex items-center gap-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  הצג פחות
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  הצג עוד ({tasksList.length - itemsToShow})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  const totalApprovalTasks = pendingApprovalTasks.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
           <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            משימות ממתינות לביצוע
             {totalApprovalTasks > 0 && (
               <Badge className="h-5 w-5 justify-center p-0 bg-red-500 text-white rounded-full flex items-center">
                {totalApprovalTasks}
              </Badge>
            )}
          </CardTitle>
           {!isFullPage && (
            <Link to={createPageUrl("Tasks")}>
                <Button variant="ghost" size="sm">צפה בהכל</Button>
            </Link>
           )}
        </CardHeader>
        <CardContent className="pt-4">
            {renderTaskList(sortedApprovalTasks)}
        </CardContent>
      </Card>

      {selectedAction && (
        <ProcessActionModal
          key={selectedAction.id}
          action={selectedAction}
          entity={selectedAction.client_id ? clients[selectedAction.client_id] : leads[selectedAction.lead_id]}
          onClose={handleCloseModal} 
          onUpdate={() => {
            onUpdate();
            handleCloseModal();
          }}
        />
      )}
    </>
  );
}
