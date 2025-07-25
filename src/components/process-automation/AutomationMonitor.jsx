import React, { useState, useEffect } from 'react';
import { AutomationLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from '@/components/shared/AccountContext';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';

export default function AutomationMonitor() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, failed, success
    const { accountId } = useAccount();
    const { toast } = useToast();

    useEffect(() => {
        if (accountId) {
            loadLogs();
        }
    }, [accountId, filter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const secureOps = new SecureEntityOperations(AutomationLog);
            let filterConditions = {};
            
            if (filter === 'failed') {
                filterConditions.status = 'failed';
            } else if (filter === 'success') {
                filterConditions.status = 'success';
            }

            const logsData = await secureOps.secureFilter(filterConditions, '-created_date', 50);
            setLogs(logsData);
        } catch (error) {
            console.error("Error loading automation logs:", error);
            toast({
                variant: "destructive",
                title: "שגיאה",
                description: "לא ניתן היה לטעון את יומן האוטומציה"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default:
                return <Eye className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const failedLogsCount = logs.filter(log => log.status === 'failed').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">מעקב אוטומציה</h2>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        size="sm"
                    >
                        הכל
                    </Button>
                    <Button
                        variant={filter === 'failed' ? 'default' : 'outline'}
                        onClick={() => setFilter('failed')}
                        size="sm"
                        className="text-red-600"
                    >
                        כשלונות ({logs.filter(l => l.status === 'failed').length})
                    </Button>
                    <Button
                        variant={filter === 'success' ? 'default' : 'outline'}
                        onClick={() => setFilter('success')}
                        size="sm"
                        className="text-green-600"
                    >
                        הצלחות
                    </Button>
                    <Button onClick={loadLogs} size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {failedLogsCount > 0 && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                        יש {failedLogsCount} כשלי אוטומציה שדורשים תשומת לב
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>יומן פעילות אוטומציה</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>אין רישומי אוטומציה להצגה</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-4 rounded-lg border ${
                                        log.status === 'failed' ? 'border-red-200 bg-red-50' :
                                        log.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                                        'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(log.status)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900">
                                                        {log.entity_type === 'lead' ? 'ליד' : 'לקוח'} #{log.entity_id}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.process_name}
                                                    </Badge>
                                                    <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                                                        {log.status === 'success' ? 'הצליח' : 
                                                         log.status === 'failed' ? 'נכשל' : 'אזהרה'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-1">
                                                    פעולה: {log.action_type} בשלב "{log.stage_name}"
                                                </p>
                                                {log.error_message && (
                                                    <p className="text-sm text-red-600 bg-red-100 p-2 rounded mt-2">
                                                        {log.error_message}
                                                    </p>
                                                )}
                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        <pre className="bg-gray-100 p-2 rounded overflow-auto">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 text-left">
                                            {format(new Date(log.created_date), "d/M/yy HH:mm", { locale: he })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}