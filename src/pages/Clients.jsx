
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Client } from "@/api/entities";
import { ProcessAction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ClientsToolbar from '../components/clients/ClientsToolbar';
import ClientCard from '../components/clients/ClientCard';
import NewClientDialog from '../components/clients/NewClientDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecureEntityOperations, useSecureEntityList } from '@/components/shared/useSecureEntityOperations';

export default function ClientsPage() {
    const [filters, setFilters] = useState({ search: '', status: 'all', process: 'all' });
    const [activeTab, setActiveTab] = useState('active');
    const [sortConfig, setSortConfig] = useState({ field: 'created_date', direction: 'desc' });
    const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
    const [pendingTasks, setPendingTasks] = useState({});

    // שימוש בהוק מאובטח לטעון לקוחות
    const {
        data: clients,
        loading,
        reload: loadClients
    } = useSecureEntityList(Client, '-created_date');

    // שימוש בפעולות מאובטחות לטעינת משימות ממתינות
    const { secureOps: processActionOps } = useSecureEntityOperations(ProcessAction);
    // שימוש בפעולות מאובטחות עבור ישויות לקוח (לעדכון ומחיקה)
    const { secureOps: clientOps } = useSecureEntityOperations(Client);

    useEffect(() => {
        // Only load pending tasks if clients data is available and processActionOps is ready
        if (clients.length > 0 && processActionOps) {
            loadPendingTasks();
        }
    }, [clients, processActionOps]);

    const loadPendingTasks = async () => {
        if (!processActionOps) return; // Ensure secureOps is available before proceeding

        const tasksData = {};
        await Promise.all(clients.map(async (client) => {
            try {
                const tasks = await processActionOps.secureFilter({
                    client_id: client.id,
                    status: 'ממתין לאישור'
                });
                tasksData[client.id] = tasks.length;
            } catch (error) {
                console.warn(`Error loading pending tasks for client ${client.id}:`, error);
                tasksData[client.id] = 0; // Default to 0 on error
            }
        }));
        setPendingTasks(tasksData);
    };

    // Calculate counts for tab display
    const activeClientsCount = useMemo(() => clients.filter(c => c.is_active !== false).length, [clients]);
    const inactiveClientsCount = useMemo(() => clients.filter(c => c.is_active === false).length, [clients]);

    // Filter and sort clients
    const filteredAndSortedClients = useMemo(() => {
        let tempClients = [...clients];

        // 1. Filter by active tab (active vs. inactive)
        if (activeTab === 'active') {
            tempClients = tempClients.filter(client => client.is_active !== false);
        } else { // 'inactive'
            tempClients = tempClients.filter(client => client.is_active === false);
        }

        // 2. Apply toolbar filters (search, status, process)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            tempClients = tempClients.filter(client =>
                `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm) ||
                (client.phone && client.phone.includes(searchTerm)) ||
                (client.email && client.email.toLowerCase().includes(searchTerm))
            );
        }
        if (filters.status !== 'all') {
            tempClients = tempClients.filter(client => client.status === filters.status);
        }
        if (filters.process !== 'all') {
            tempClients = tempClients.filter(client => client.process_type === filters.process);
        }

        // 3. Apply sorting
        tempClients.sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';

            // Handle dates
            if (sortConfig.field === 'created_date' || sortConfig.field === 'last_status_change') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            // Handle strings
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            // Handle boolean
            if (typeof aValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

        return tempClients;
    }, [clients, filters, sortConfig, activeTab]);

    const handleRefresh = () => {
        loadClients();
    }

    const handleDeleteClient = async (clientId) => {
        if(confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) {
            try {
                if (!clientOps) {
                    console.error("Client operations not initialized.");
                    alert("שגיאה: פעולות לקוח אינן זמינות.");
                    return;
                }
                await clientOps.secureDelete(clientId);
                loadClients();
            } catch (error) {
                console.error("Failed to delete client:", error);
                alert("שגיאה במחיקת הלקוח.");
            }
        }
    };

    const handleToggleImportant = async (client) => {
        try {
            if (!clientOps) {
                console.error("Client operations not initialized.");
                alert("שגיאה: פעולות לקוח אינן זמינות.");
                return;
            }
            await clientOps.secureUpdate(client.id, { is_important: !client.is_important });
            loadClients();
        } catch (error) {
            console.error("Failed to toggle important status:", error);
            alert("שגיאה בעדכון חשיבות הלקוח.");
        }
    };

    const handleToggleActive = async (client) => {
        try {
            if (!clientOps) {
                console.error("Client operations not initialized.");
                alert("שגיאה: פעולות לקוח אינן זמינות.");
                return;
            }
            await clientOps.secureUpdate(client.id, { is_active: !client.is_active });
            loadClients();
        } catch (error) {
            console.error("Failed to toggle active status:", error);
            alert("שגיאה בעדכון סטטוס הפעילות של הלקוח.");
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות</h1>
                    <p className="text-gray-600 mt-1">רכז, עקוב ונהל את כל הלקוחות שלך.</p>
                </div>
                <Button onClick={() => setIsNewClientDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    צור לקוח חדש
                </Button>
            </div>

            <div className="mb-6 flex justify-start">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="inactive">לקוחות לא פעילים ({inactiveClientsCount})</TabsTrigger>
                        <TabsTrigger value="active">לקוחות פעילים ({activeClientsCount})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <ClientsToolbar
                filters={filters}
                onFilterChange={(key, value) => setFilters(prev => ({...prev, [key]: value}))}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
            />

            <div className="flex-1 overflow-y-auto mt-4 pr-2">
                <div className="bg-white rounded-lg border shadow-sm">
                    {/* כותרות עמודות */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b font-medium text-gray-600">
                        <div className="text-center text-sm font-medium text-gray-600 col-span-1">#</div>
                        <Button
                            variant="ghost"
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-3"
                            onClick={() => setSortConfig(prev => ({
                                field: 'first_name',
                                direction: prev.field === 'first_name' && prev.direction === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            שם מלא
                            {sortConfig.field === 'first_name' && (
                                sortConfig.direction === 'asc' ?
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-2"
                            onClick={() => setSortConfig(prev => ({
                                field: 'process_type',
                                direction: prev.field === 'process_type' && prev.direction === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            תהליך
                            {sortConfig.field === 'process_type' && (
                                sortConfig.direction === 'asc' ?
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-1"
                            onClick={() => setSortConfig(prev => ({
                                field: 'status',
                                direction: prev.field === 'status' && prev.direction === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            סטטוס
                            {sortConfig.field === 'status' && (
                                sortConfig.direction === 'asc' ?
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-2"
                            onClick={() => setSortConfig(prev => ({
                                field: 'last_status_change',
                                direction: prev.field === 'last_status_change' && prev.direction === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            תאריך שינוי אחרון
                            {sortConfig.field === 'last_status_change' && (
                                sortConfig.direction === 'asc' ?
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <div className="text-center text-sm font-medium text-gray-600 col-span-1">משימות ממתינות</div>
                        <Button
                            variant="ghost"
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-1"
                            onClick={() => setSortConfig(prev => ({
                                field: 'referral_source',
                                direction: prev.field === 'referral_source' && prev.direction === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            מקור
                            {sortConfig.field === 'referral_source' && (
                                sortConfig.direction === 'asc' ?
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> :
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <div className="text-center text-sm font-medium text-gray-600 col-span-1">פעולות</div>
                    </div>

                    {loading ? (
                        <div className="p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`p-4 border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <div className="animate-pulse flex items-center space-x-4">
                                        <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredAndSortedClients.length > 0 ? (
                        filteredAndSortedClients.map((client, index) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                index={index}
                                onDelete={() => handleDeleteClient(client.id)}
                                onRefresh={handleRefresh}
                                pendingTasksCount={pendingTasks[client.id] || 0}
                                onToggleImportant={() => handleToggleImportant(client)}
                                onToggleActive={() => handleToggleActive(client)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p className="font-semibold text-lg">לא נמצאו לקוחות</p>
                            <p>נסה לשנות את הסינון או להוסיף לקוח חדש.</p>
                        </div>
                    )}
                </div>
            </div>

            <NewClientDialog
                open={isNewClientDialogOpen}
                onOpenChange={setIsNewClientDialogOpen}
                onSuccess={loadClients}
            />
        </div>
    );
}
