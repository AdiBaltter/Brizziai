import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, FileText, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";
import ProcessActionModal from '../process-automation/ProcessActionModal';

export default function NotificationBell({ tasks = [], approvalTasks = [], meetings = [], clients = [], leads = [], onUpdate = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const newNotifications = [];
    
    // New tasks
    if (tasks && Array.isArray(tasks)) {
      tasks.filter(t => t.created_date && new Date(t.created_date) > dayAgo)
        .forEach(task => {
          newNotifications.push({
            id: `task-${task.id}`,
            type: 'task',
            title: 'משימה חדשה',
            content: task.title || 'משימה ללא כותרת',
            time: task.created_date,
            icon: FileText,
            data: task
          });
        });
    }
    
    // New approval tasks
    if (approvalTasks && Array.isArray(approvalTasks)) {
      approvalTasks.filter(t => t.created_date && new Date(t.created_date) > dayAgo)
        .forEach(task => {
          newNotifications.push({
            id: `approval-${task.id}`,
            type: 'approval',
            title: 'משימה לאישור',
            content: task.title || 'משימה ללא כותרת',
            time: task.created_date,
            icon: CheckCircle,
            data: task
          });
        });
    }
    
    // Overdue tasks
    if (tasks && Array.isArray(tasks)) {
      tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "הושלמה")
        .forEach(task => {
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            title: 'משימה באיחור',
            content: task.title || 'משימה ללא כותרת',
            time: task.due_date,
            icon: FileText,
            data: task
          });
        });
    }
    
    // Sort by time
    newNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    setNotifications(newNotifications);
  }, [tasks, approvalTasks, meetings]);

  const clientsMap = useMemo(() => clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {}), [clients]);

  const leadsMap = useMemo(() => leads.reduce((acc, lead) => {
    acc[lead.id] = lead;
    return acc;
  }, {}), [leads]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    const { type, data } = notification;

    if (type === 'approval') {
      setSelectedAction(data);
    } else if (type === 'task' || type === 'overdue') {
      if (data.client_id) {
        navigate(createPageUrl(`ClientRoom?id=${data.client_id}&tab=tasks`));
      } else if (data.lead_id) {
        navigate(createPageUrl(`ClientRoom?lead_id=${data.lead_id}&tab=tasks`));
      }
    }
    // Future: handle meeting notifications
  };

  const handleCloseModal = () => {
    setSelectedAction(null);
  };
  
  const removeNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center">
              {notifications.length > 9 ? '9+' : notifications.length}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <Card className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto shadow-lg z-50 bg-white border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">התראות</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  אין התראות חדשות
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon;
                    return (
                      <div 
                        key={notification.id} 
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <IconComponent className={`h-4 w-4 mt-1 ${
                          notification.type === 'overdue' ? 'text-red-500' :
                          notification.type === 'approval' ? 'text-orange-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 truncate">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time ? format(new Date(notification.time), "d MMM, HH:mm", { locale: he }) : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={(e) => removeNotification(e, notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {selectedAction && (
        <ProcessActionModal
          key={selectedAction.id}
          action={selectedAction}
          entity={selectedAction.client_id ? clientsMap[selectedAction.client_id] : leadsMap[selectedAction.lead_id]}
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
