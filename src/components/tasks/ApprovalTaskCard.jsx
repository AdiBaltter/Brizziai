
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApprovalTask } from '@/api/entities/ApprovalTask';
import { SendEmail } from '@/api/integrations';
import { Check, Edit, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ApprovalTaskCard({ task, client, onUpdate, onApprove }) {

    const handleApprove = async () => {
        if (window.confirm("האם לאשר ולבצע את הפעולה?")) {
            try {
                // Only attempt email sending for email type tasks
                if (task.type === 'email' && task.action_details?.to) {
                    try {
                        await SendEmail({
                            to: task.action_details.to,
                            subject: task.action_details.subject || 'הודעה מהמערכת',
                            body: task.content,
                        });
                    } catch (emailError) {
                        console.warn("Email failed but continuing:", emailError);
                        // Show warning but continue
                        if (!window.confirm("שליחת המייל נכשלה (ייתכן שהכתובת אינה במערכת). האם להמשיך עם אישור המשימה?")) {
                            return; // Stop the approval process if user cancels
                        }
                    }
                }
                
                // Update task status
                if (task.id) {
                    await ApprovalTask.update(task.id, { status: 'אושר ונשלח' });
                    await onApprove(task); // Create a task in main board
                    onUpdate();
                } else {
                    throw new Error("Task ID is missing");
                }
            } catch (error) {
                console.error("Error in approval:", error);
                alert("שגיאה באישור המשימה: " + error.message);
            }
        }
    };

    const handleReject = async () => {
         if (window.confirm("האם לדחות את המשימה?")) {
            try {
                if (task.id) {
                    await ApprovalTask.update(task.id, { status: 'נדחה' });
                    onUpdate();
                } else {
                    throw new Error("Task ID is missing");
                }
            } catch (error) {
                console.error("Error in rejection:", error);
                alert("שגיאה בדחיית המשימה: " + error.message);
            }
         }
    };
    
    // Placeholder for edit functionality
    const handleEdit = () => {
        alert("פונקציונליות עריכה תתווסף בקרוב.");
    };

    return (
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
                <h4 className="font-semibold">{task.title}</h4>
                <p className="text-sm text-gray-600">עבור: {client ? `${client.first_name} ${client.last_name}` : 'לא משויך'}</p>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">{task.content}</div>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.created_date), 'd MMM, HH:mm', { locale: he })}
                    </div>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={handleApprove}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-100" onClick={handleEdit}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-100" onClick={handleReject}><X className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
