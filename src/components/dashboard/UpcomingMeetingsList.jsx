import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function UpcomingMeetingsList({ meetings, loading, clients = {}, leads = {}, onMeetingClick }) {
  const [showAll, setShowAll] = useState(false);
  const itemsToShow = 5;
  const displayedMeetings = showAll ? meetings : meetings.slice(0, itemsToShow);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
           <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          פגישות קרובות ({meetings.length})
          <Calendar className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {displayedMeetings.length > 0 ? (
          <div className="space-y-0">
            {displayedMeetings.map((meeting) => {
              const client = clients[meeting.client_id];
              const lead = leads[meeting.lead_id];
              const entityName = client 
                ? `${client.first_name} ${client.last_name}` 
                : lead?.full_name || 'לא ידוע';

              return (
                <div
                  key={meeting.id}
                  className="flex items-start gap-4 p-4 border-t border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onMeetingClick(meeting)}
                >
                  <div className="flex-shrink-0 pt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500" title="פגישה מתוכננת"></div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{meeting.title}</p>
                    <p className="text-gray-500 text-xs">
                      עם: {entityName} - {format(new Date(meeting.meeting_date), "d/M HH:mm", { locale: he })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm">פרטים</Button>
                  </div>
                </div>
              );
            })}
            
            {!showAll && meetings.length > itemsToShow && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(true)} 
                  className="flex items-center gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  הצג עוד ({meetings.length - itemsToShow})
                </Button>
              </div>
            )}
             {showAll && meetings.length > itemsToShow && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(false)} 
                  className="flex items-center gap-2"
                >
                  <ChevronUp className="h-4 w-4" />
                   הצג פחות
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">אין פגישות מתוכננות</p>
            <p className="text-sm">פגישות עתידיות יופיעו כאן</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}