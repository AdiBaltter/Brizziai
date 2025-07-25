
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead } from '@/api/entities';
import { ProcessAction } from '@/api/entities';
import { Process } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import LeadsToolbar from '../components/leads/LeadsToolbar';
import LeadCard from '../components/leads/LeadCard';
import NewLeadDialog from '../components/leads/NewLeadDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureEntityOperations } from '../components/shared/secureEntityOperations';

export default function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [processes, setProcesses] = useState([]); // State for the raw processes list
    const [processesMap, setProcessesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', category: 'all', source: 'all' }); // שינוי מ-status ל-category
    const [activeTab, setActiveTab] = useState('active');
    const [sortConfig, setSortConfig] = useState({ field: 'created_date', direction: 'desc' });
    const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
    const [pendingTasks, setPendingTasks] = useState({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsData, processesData] = await Promise.all([
                Lead.list('-created_date'),
                Process.filter({ is_active: true })
            ]);
            
            setLeads(leadsData);
            setProcesses(processesData); // Set the raw processes list

            // Create a map of process names to process objects
            const procMap = processesData.reduce((acc, p) => {
                acc[p.name] = p;
                return acc;
            }, {});
            setProcessesMap(procMap);
            
            // Load all pending tasks in a single call and group by lead_id
            try {
                const allPendingTasks = await ProcessAction.filter({ 
                    status: 'ממתין לאישור' 
                });
                
                const tasksCountByLead = {};
                allPendingTasks.forEach(task => {
                    if (task.lead_id) {
                        tasksCountByLead[task.lead_id] = (tasksCountByLead[task.lead_id] || 0) + 1;
                    }
                });
                
                setPendingTasks(tasksCountByLead);
            } catch (error) {
                console.error("Error loading pending tasks:", error);
                setPendingTasks({});
            }
        } catch (error) {
            console.error("Error loading page data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // New useEffect to handle opening lead detail panel from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const leadIdToOpen = params.get('lead_id');
        if (leadIdToOpen && leads.some(l => l.id === leadIdToOpen)) {
            // Logic to auto-expand a lead card can be added here if needed in the future
        }
    }, [leads]);

    const allStages = useMemo(() => {
        const stagesSet = new Set();
        // Add default statuses first
        const defaultStatuses = ["חדש", "יצר קשר", "לא ענה", "בתהליך סגירה", "לא רלוונטי"];
        defaultStatuses.forEach(s => stagesSet.add(s));
        
        // Add stages from all active processes
        processes.forEach(process => {
            if (process.stages && Array.isArray(process.stages)) {
                process.stages.forEach(stage => {
                    stagesSet.add(stage.client_display_name || stage.name);
                });
            }
        });
        return Array.from(stagesSet);
    }, [processes]);

    const activeLeadsCount = useMemo(() => leads.filter(l => l.is_active !== false).length, [leads]);
    const inactiveLeadsCount = useMemo(() => leads.filter(l => l.is_active === false).length, [leads]);

    const filteredAndSortedLeads = useMemo(() => {
        let tempLeads = [...leads];
        
        if (activeTab === 'active') {
            tempLeads = tempLeads.filter(lead => lead.is_active !== false);
        } else {
            tempLeads = tempLeads.filter(lead => lead.is_active === false);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            tempLeads = tempLeads.filter(lead =>
                lead.full_name.toLowerCase().includes(searchTerm) ||
                (lead.phone && lead.phone.includes(searchTerm)) ||
                (lead.email && lead.email.toLowerCase().includes(searchTerm))
            );
        }
        
        // סינון לפי קטגורית שלב במקום שלב ספציפי
        if (filters.category !== 'all') {
            tempLeads = tempLeads.filter(lead => {
                const process = processesMap[lead.process_type];
                if (process && process.stages && lead.current_stage) {
                    const stageIndex = lead.current_stage - 1;
                    if (stageIndex >= 0 && stageIndex < process.stages.length) {
                        const stage = process.stages[stageIndex];
                        return stage.category === filters.category;
                    }
                }
                return false;
            });
        }
        
        if (filters.source !== 'all') {
            tempLeads = tempLeads.filter(lead => lead.source === filters.source);
        }

        tempLeads.sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';

            if (sortConfig.field === 'created_date' || sortConfig.field === 'last_stage_change') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
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

        return tempLeads;
    }, [leads, filters, sortConfig, activeTab, processesMap]);

    const handleRefresh = () => {
      loadData();
    }

    const handleDeleteLead = async (leadId) => {
        if(confirm('האם אתה בטוח שברצונך למחוק את הליד?')) {
            try {
                const secureOps = new SecureEntityOperations(Lead);
                await secureOps.secureDelete(leadId);
                
                loadData();
                alert("הליד נמחק בהצלחה.");

            } catch (error) {
                console.error("Failed to delete lead:", error);
                alert(`שגיאה במחיקת הליד: ${error.message}`);
            }
        }
    };

    const handleToggleImportant = async (lead) => {
        try {
            await Lead.update(lead.id, { is_important: !lead.is_important });
            loadData();
        } catch (error) {
            console.error("Failed to toggle important status:", error);
            alert("שגיאה בעדכון חשיבות הליד.");
        }
    };

    const handleToggleActive = async (lead) => {
        try {
            await Lead.update(lead.id, { is_active: !lead.is_active });
            loadData();
        } catch (error) {
            console.error("Failed to toggle active status:", error);
            alert("שגיאה בעדכון סטטוס הפעילות של הליד.");
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">ניהול לידים</h1>
                    <p className="text-gray-600 mt-1">רכז, עקוב ונהל את כל הפניות החדשות שלך.</p>
                </div>
                <Button onClick={() => setIsNewLeadDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    צור ליד חדש
                </Button>
            </div>

            <div className="mb-6 flex justify-start">
                <Tabs defaultValue="active" onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="inactive">לידים לא רלוונטיים ({inactiveLeadsCount})</TabsTrigger>
                        <TabsTrigger value="active">לידים פעילים ({activeLeadsCount})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <LeadsToolbar 
                filters={filters} 
                onFilterChange={(key, value) => setFilters(prev => ({...prev, [key]: value}))}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                stages={allStages}
                processes={processesMap} // העברת מידע התהליכים לטולבר
            />

            <div className="flex-1 overflow-y-auto mt-4 pr-2">
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b font-medium text-gray-600">
                        <div className="text-sm font-medium text-gray-600 col-span-1">#</div>
                        <Button 
                            variant="ghost" 
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-2"
                            onClick={() => setSortConfig(prev => ({ 
                                field: 'full_name', 
                                direction: prev.field === 'full_name' && prev.direction === 'asc' ? 'desc' : 'asc' 
                            }))}
                        >
                            שם מלא
                            {sortConfig.field === 'full_name' && (
                                sortConfig.direction === 'asc' ? 
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> : 
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-3"
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
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-2"
                            onClick={() => setSortConfig(prev => ({ 
                                field: 'status', // This sort field remains 'status' as it sorts by the stage name/status
                                direction: prev.field === 'status' && prev.direction === 'asc' ? 'desc' : 'asc' 
                            }))}
                        >
                            שלב נוכחי
                            {sortConfig.field === 'status' && (
                                sortConfig.direction === 'asc' ? 
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> : 
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <div className="text-center text-sm font-medium text-gray-600 col-span-1">משימות פתוחות</div>
                        <Button 
                            variant="ghost" 
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-1"
                            onClick={() => setSortConfig(prev => ({ 
                                field: 'source', 
                                direction: prev.field === 'source' && prev.direction === 'asc' ? 'desc' : 'asc' 
                            }))}
                        >
                            מקור
                            {sortConfig.field === 'source' && (
                                sortConfig.direction === 'asc' ? 
                                <ArrowUp className="h-4 w-4 text-blue-600 mr-1" /> : 
                                <ArrowDown className="h-4 w-4 text-blue-600 mr-1" />
                            )}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="justify-start p-0 h-auto font-medium text-gray-600 hover:text-gray-900 text-sm col-span-1"
                            onClick={() => setSortConfig(prev => ({ 
                                field: 'created_date', 
                                direction: prev.field === 'created_date' && prev.direction === 'asc' ? 'desc' : 'asc' 
                            }))}
                        >
                            תאריך פתיחה
                            {sortConfig.field === 'created_date' && (
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
                    ) : filteredAndSortedLeads.length > 0 ? (
                        filteredAndSortedLeads.map((lead, index) => (
                            <LeadCard 
                                key={lead.id} 
                                lead={lead} 
                                index={index}
                                onDelete={() => handleDeleteLead(lead.id)}
                                onRefresh={handleRefresh}
                                pendingTasksCount={pendingTasks[lead.id] || 0}
                                onToggleImportant={() => handleToggleImportant(lead)}
                                onToggleActive={() => handleToggleActive(lead)}
                                processesMap={processesMap}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p className="font-semibold text-lg">לא נמצאו לידים</p>
                            <p>נסה לשנות את הסינון או להוסיף ליד חדש.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <NewLeadDialog
                open={isNewLeadDialogOpen}
                onOpenChange={setIsNewLeadDialogOpen}
                onSuccess={loadData}
                processes={processes}
            />
        </div>
    );
}
