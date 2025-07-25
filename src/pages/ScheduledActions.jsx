import React, { useState, useEffect } from 'react';
import { ScheduledAction } from '@/api/entities';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Mail, MessageSquare, Phone, FileText, Users, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

export default function ScheduledActionsPage() {
  const [scheduledActions, setScheduledActions] = useState([]);
  const [clients, setClients] = useState({});
  const [leads, setLeads] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Check for super admin context
      let organizationId = user.organization_id;
      const contextData = sessionStorage.getItem('superAdminContext');
      if (contextData) {
        const context = JSON.parse(contextData);
        if (context.viewingAsOrg) {
          organizationId = context.viewingAsOrg;
        }
      }

      if (!organizationId) {
        setLoading(false);
        return;
      }

      const [actionsData, clientsData, leadsData] = await Promise.all([
        ScheduledAction.filter({ organization_id: organizationId }, '-scheduled_time'),
        Client.filter({ organization_id: organizationId }),
        Lead.filter({ organization_id: organizationId })
      ]);

      setScheduledActions(actionsData);
      
      // Create lookup maps
      const clientsMap = {};
      clientsData.forEach(client => {
        clientsMap[client.id] = client;
      });
      setClients(clientsMap);

      const leadsMap = {};
      leadsData.forEach(lead => {
        leadsMap[lead.id] = lead;
      });
      setLeads(leadsMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הנתונים'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = async (actionId) => {
    try {
      await ScheduledAction.update(actionId, {
        status: 'cancelled',
        completion_time: new Date().toISOString()
      });
      toast({
        title: 'הפעולה בוטלה',
        description: 'הפעולה המתוזמנת בוטלה בהצלחה'
      });
      loadData();
    } catch (error) {
      console.error('Error cancelling action:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'לא ניתן לבטל את הפעולה'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Pause className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'completed': return 'הושלם';
      case 'failed': return 'נכשל';
      case 'cancelled': return 'בוטל';
      default: return 'לא ידוע';
    }
  };

  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'send_whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'send_email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'send_sms': return <Phone className="h-4 w-4 text-orange-500" />;
      case 'create_task': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'create_meeting': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'advance_stage': return <Play className="h-4 w-4 text-cyan-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeText = (type) => {
    switch (type) {
      case 'send_whatsapp': return 'שליחת וואטסאפ';
      case 'send_email': return 'שליחת אימייל';
      case 'send_sms': return 'שליחת SMS';
      case 'create_task': return 'יצירת משימה';
      case 'create_meeting': return 'יצירת פגישה';
      case 'advance_stage': return 'התקדמות בשלב';
      case 'send_reminder': return 'שליחת תזכורת';
      default: return type;
    }
  };

  const getClientName = (action) => {
    if (action.client_id && clients[action.client_id]) {
      const client = clients[action.client_id];
      return `${client.first_name} ${client.last_name}`;
    }
    if (action.lead_id && leads[action.lead_id]) {
      return leads[action.lead_id].full_name;
    }
    return 'לא ידוע';
  };

  const filteredActions = scheduledActions.filter(action => {
    const statusMatch = filterStatus === 'all' || action.status === filterStatus;
    const typeMatch = filterType === 'all' || action.action_type === filterType;
    const searchMatch = searchTerm === '' || 
      getClientName(action).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getActionTypeText(action.action_type).toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  const pendingActions = filteredActions.filter(a => a.status === 'pending');
  const completedActions = filteredActions.filter(a => a.status === 'completed');
  const failedActions = filteredActions.filter(a => a.status === 'failed');

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">פעולות מתוזמנות</h1>
        <p className="text-gray-600 mt-1">ניהול ומעקב אחר פעולות אוטומטיות מתוזמנות</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">{pendingActions.length}</p>
                <p className="text-gray-600">ממתינות</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">{completedActions.length}</p>
                <p className="text-gray-600">הושלמו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">{failedActions.length}</p>
                <p className="text-gray-600">נכשלו</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">{scheduledActions.length}</p>
                <p className="text-gray-600">סה״כ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="חיפוש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="failed">נכשל</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="סוג פעולה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="send_whatsapp">וואטסאפ</SelectItem>
            <SelectItem value="send_email">אימייל</SelectItem>
            <SelectItem value="send_sms">SMS</SelectItem>
            <SelectItem value="create_task">משימה</SelectItem>
            <SelectItem value="create_meeting">פגישה</SelectItem>
            <SelectItem value="advance_stage">התקדמות</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">הכל ({filteredActions.length})</TabsTrigger>
          <TabsTrigger value="pending">ממתינות ({pendingActions.length})</TabsTrigger>
          <TabsTrigger value="completed">הושלמו ({completedActions.length})</TabsTrigger>
          <TabsTrigger value="failed">נכשלו ({failedActions.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ActionsList actions={filteredActions} clients={clients} leads={leads} onCancel={handleCancelAction} />
        </TabsContent>
        <TabsContent value="pending">
          <ActionsList actions={pendingActions} clients={clients} leads={leads} onCancel={handleCancelAction} />
        </TabsContent>
        <TabsContent value="completed">
          <ActionsList actions={completedActions} clients={clients} leads={leads} onCancel={handleCancelAction} />
        </TabsContent>
        <TabsContent value="failed">
          <ActionsList actions={failedActions} clients={clients} leads={leads} onCancel={handleCancelAction} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActionsList({ actions, clients, leads, onCancel }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Pause className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'completed': return 'הושלם';
      case 'failed': return 'נכשל';
      case 'cancelled': return 'בוטל';
      default: return 'לא ידוע';
    }
  };

  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'send_whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'send_email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'send_sms': return <Phone className="h-4 w-4 text-orange-500" />;
      case 'create_task': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'create_meeting': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'advance_stage': return <Play className="h-4 w-4 text-cyan-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeText = (type) => {
    switch (type) {
      case 'send_whatsapp': return 'שליחת וואטסאפ';
      case 'send_email': return 'שליחת אימייל';
      case 'send_sms': return 'שליחת SMS';
      case 'create_task': return 'יצירת משימה';
      case 'create_meeting': return 'יצירת פגישה';
      case 'advance_stage': return 'התקדמות בשלב';
      case 'send_reminder': return 'שליחת תזכורת';
      default: return type;
    }
  };

  const getClientName = (action) => {
    if (action.client_id && clients[action.client_id]) {
      const client = clients[action.client_id];
      return `${client.first_name} ${client.last_name}`;
    }
    if (action.lead_id && leads[action.lead_id]) {
      return leads[action.lead_id].full_name;
    }
    return 'לא ידוע';
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>אין פעולות מתוזמנות להצגה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <Card key={action.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getActionTypeIcon(action.action_type)}
                  <span className="font-medium">{getActionTypeText(action.action_type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{getClientName(action)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(action.scheduled_time), "d MMM yyyy, HH:mm", { locale: he })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(action.status)}
                  <span className="text-sm">{getStatusText(action.status)}</span>
                </div>
                {action.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCancel(action.id)}
                  >
                    בטל
                  </Button>
                )}
              </div>
            </div>
            {action.error_details && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {action.error_details}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}