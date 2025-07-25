import React from 'react';
import MeetingRow from './MeetingRow';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function MeetingsTable({ meetings, clients, onUpdate, onEdit, onDelete, onSummary }) {
    if (meetings.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">לא נמצאו פגישות</p>
                <p className="text-sm mt-1">נסו לשנות את הסינון או להוסיף פגישה חדשה</p>
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3 font-medium">תאריך</th>
                                <th className="p-3 font-medium">לקוח</th>
                                <th className="p-3 font-medium">נושא</th>
                                <th className="p-3 font-medium">סטטוס</th>
                                <th className="p-3 font-medium">סוג</th>
                                <th className="p-3 font-medium text-left">פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(meeting => (
                                <MeetingRow
                                    key={meeting.id}
                                    meeting={meeting}
                                    client={clients[meeting.client_id]}
                                    onUpdate={onUpdate}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onSummary={onSummary}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}