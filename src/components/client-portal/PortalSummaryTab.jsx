import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, Calendar, FileText, CheckSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Task } from '@/api/entities';

// A simplified timeline for the summary
const ProcessTimeline = ({ process, currentStage }) => {
    if (!process || !process.stages) return null;
    const visibleStages = process.stages.filter(s => s.visibility === 'external');

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="relative flex items-center justify-between min-w-max gap-4">
                {/* The connecting line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200" style={{transform: 'translateY(-50%)'}}>
                    <div className="h-full bg-blue-500" style={{width: `${((currentStage - 1) / (visibleStages.length -1)) * 100}%`}}></div>
                </div>

                {visibleStages.map((stage, index) => {
                    const stageNumber = index + 1;
                    const isCompleted = stageNumber < currentStage;
                    const isCurrent = stageNumber === currentStage;
                    
                    return (
                        <div key={index} className="z-10 flex flex-col items-center gap-2">
                             <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                                 isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 
                                 isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                 'bg-white border-gray-300'
                             }`}>
                                 {isCompleted ? <Check className="h-5 w-5" /> : stageNumber}
                             </div>
                             <p className={`text-xs text-center font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>{stage.name}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ClientTasks = ({ tasks, onUpdate }) => {
    const openTasks = tasks.filter(t => t.status !== 'הושלמה');
    
    const handleComplete = async (task) => {
        await Task.update(task.id, { status: 'הושלמה' });
        onUpdate();
    }

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-orange-500" />משימות לביצוע</CardTitle></CardHeader>
            <CardContent>
                {openTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {openTasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-sm text-gray-500">{task.description}</p>
                                </div>
                                <Button size="sm" onClick={() => handleComplete(task)}>סיימתי</Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>אין לך משימות פתוחות. כל הכבוד!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const UpcomingMeetings = ({ meetings }) => {
    const upcoming = meetings
        .filter(m => new Date(m.meeting_date) >= new Date())
        .sort((a,b) => new Date(a.meeting_date) - new Date(b.meeting_date))
        .slice(0, 3);
    
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-green-500" />פגישות קרובות</CardTitle></CardHeader>
            <CardContent>
                 {upcoming.length > 0 ? (
                    <ul className="space-y-3">
                        {upcoming.map(meeting => (
                            <li key={meeting.id} className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-medium">{meeting.title}</p>
                                    <p className="text-sm text-gray-500">{format(new Date(meeting.meeting_date), "eeee, d MMMM 'בשעה' HH:mm", { locale: he })}</p>
                                </div>
                                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline">הצטרף</Button>
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        <Check className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>אין פגישות מתוכננות כרגע.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function PortalSummaryTab({ client, process, tasks, meetings, onUpdate }) {
    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800">הודעה אישית מהצוות</h3>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{client.welcome_message}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>היכן אנחנו בתהליך?</CardTitle></CardHeader>
                <CardContent>
                   <ProcessTimeline process={process} currentStage={client.current_stage || 1} />
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <UpcomingMeetings meetings={meetings} />
                <ClientTasks tasks={tasks} onUpdate={onUpdate} />
            </div>
        </div>
    )
}