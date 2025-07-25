
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessAutomationService } from '../process-automation/ProcessAutomationService';
import ProcessActionModal from '../process-automation/ProcessActionModal';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ProcessActionsTab({ client, onUpdate }) {
  const [openActions, setOpenActions] = useState([]);
  const [allActions, setAllActions] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, [client.id]);

  const loadActions = async () => {
    setLoading(true);
    try {
      // Pass both client ID and lead ID (if exists) to fetch all related actions
      const [open, all] = await Promise.all([
        ProcessAutomationService.getOpenActionsForClient(client.id, client.lead_id),
        ProcessAutomationService.getAllActionsForClient(client.id, client.lead_id)
      ]);
      setOpenActions(open);
      setAllActions(all);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowModal(true);
  };

  const handleActionComplete = () => {
    loadActions();
    onUpdate();
  };

  const renderActionCard = (action, isPending = false) => (
    <Card key={action.id} className={`cursor-pointer transition-all ${isPending ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
      <CardContent className="p-4" onClick={() => isPending && handleActionClick(action)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{action.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{action.stage_category}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={
                action.status === 'ממתין לאישור' ? 'bg-orange-100 text-orange-800' :
                action.status === 'אושר' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }>
                {action.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {format(new Date(action.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
            </div>
            {action.user_response && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>תגובה:</strong> {action.user_response}
              </p>
            )}
            {action.update_text && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>עדכון:</strong> {action.update_text}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 mr-3">
            {isPending ? (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="p-6 text-center">טוען משימות...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            משימות פתוחות ({openActions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            היסטוריית משימות ({allActions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {openActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>אין משימות פתוחות</p>
              </CardContent>
            </Card>
          ) : (
            openActions.map(action => renderActionCard(action, true))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {allActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>אין היסטוריית משימות</p>
              </CardContent>
            </Card>
          ) : (
            allActions.map(action => renderActionCard(action, false))
          )}
        </TabsContent>
      </Tabs>

      {selectedAction && (
        <ProcessActionModal
          open={showModal}
          action={selectedAction}
          entity={client}
          onClose={() => setShowModal(false)}
          onUpdate={handleActionComplete}
        />
      )}
    </div>
  );
}
