import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Task } from '@/api/entities';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const priorityColors = {
  "נמוכה": "bg-gray-100 text-gray-700",
  "בינונית": "bg-blue-100 text-blue-700",
  "גבוהה": "bg-orange-100 text-orange-700",
  "דחופה": "bg-red-100 text-red-700"
};

const sourceDisplay = {
    'ידני': '👤',
    'תהליך': '🔄',
    'פגישה': '📅',
    'אישור': '✅'
};

export default function TaskCard({ task, client, onUpdate }) {
    
    const handleStatusChange = async (newStatus) => {
        await Task.update(task.id, { status: newStatus });
        onUpdate();
    };

    const handleDelete = async () => {
        if(window.confirm(`האם למחוק את המשימה "${task.title}"?`)){
            await Task.delete(task.id);
            onUpdate();
        }
    };
    
    return (
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold pr-2">{task.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange('הושלמה')}><CheckCircle className="h-4 w-4 ml-2 text-green-500" /> סמן כהושלם</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("עריכה בקרוב")}><Edit className="h-4 w-4 ml-2 text-blue-500" /> ערוך</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600"><Trash2 className="h-4 w-4 ml-2" /> מחק</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                {task.description && <p className="text-xs text-gray-600 mb-3">{task.description}</p>}
                
                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className={priorityColors[task.priority]}>{task.priority}</Badge>
                    {task.due_date && 
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.due_date), "d MMM", { locale: he })}
                        </Badge>
                    }
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                    <div>
                         {client && (
                            <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-xs bg-blue-50">{client.first_name[0]}{client.last_name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{client.first_name} {client.last_name}</span>
                            </div>
                         )}
                    </div>
                    <span title={`מקור: ${task.source}`}>{sourceDisplay[task.source] || '❓'}</span>
                </div>
            </CardContent>
        </Card>
    );
}