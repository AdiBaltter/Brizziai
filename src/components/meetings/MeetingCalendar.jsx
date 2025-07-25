
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Monitor, Phone, Building, Clock, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, startOfDay, addHours, isBefore, isAfter, startOfMonth, endOfMonth, eachWeekOfInterval, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
    'מתוכננת': 'bg-blue-100 text-blue-700 border-blue-200',
    'התקיימה': 'bg-green-100 text-green-700 border-green-200',
    'בוטלה': 'bg-gray-100 text-gray-700 border-gray-200',
    'לא הגיע': 'bg-red-100 text-red-700 border-red-200',
};

const typeIcons = {
    'פגישת אונליין': <Monitor className="h-3 w-3" />,
    'פגישה פיזית': <Building className="h-3 w-3" />,
    'שיחת טלפון': <Phone className="h-3 w-3" />,
};

export default function MeetingCalendar({ 
    meetings, 
    clients, 
    currentDate, 
    viewMode, 
    onMeetingClick, 
    onTimeSlotClick,
    onMeetingMove 
}) {
    const [draggedMeeting, setDraggedMeeting] = useState(null);

    const getWeekDays = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    };

    const getMonthWeeks = () => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachWeekOfInterval(
            { start, end },
            { weekStartsOn: 0 }
        );
    };

    const getTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(hour);
        }
        return slots;
    };

    const getMeetingsForDay = (day) => {
        return meetings.filter(meeting => 
            isSameDay(new Date(meeting.meeting_date), day)
        );
    };

    const getMeetingPosition = (meeting) => {
        const meetingDate = new Date(meeting.meeting_date);
        const hour = meetingDate.getHours();
        const minutes = meetingDate.getMinutes();
        const topPosition = ((hour - 8) * 60 + minutes) * (60 / 60); // 60px per hour
        return topPosition;
    };

    const handleDragStart = (e, meeting) => {
        setDraggedMeeting(meeting);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, day, hour) => {
        e.preventDefault();
        if (draggedMeeting) {
            const newDateTime = new Date(day);
            newDateTime.setHours(hour, 0, 0, 0);
            onMeetingMove(draggedMeeting.id, newDateTime.toISOString());
            setDraggedMeeting(null);
        }
    };

    const handleTimeSlotClick = (day, hour) => {
        const dateTime = new Date(day);
        dateTime.setHours(hour, 0, 0, 0);
        onTimeSlotClick(dateTime.toISOString());
    };

    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return '?';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const needsSummary = (meeting) => {
        return meeting.status === 'התקיימה' && !meeting.summary;
    };

    // Month view
    if (viewMode === 'month') {
        const weeks = getMonthWeeks();
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        return (
            <div className="h-full overflow-auto">
                {/* Header with day names */}
                <div className="grid grid-cols-7 border-b bg-gray-50">
                    {dayNames.map(dayName => (
                        <div key={dayName} className="p-3 text-center font-medium text-gray-600 border-l">
                            {dayName}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-rows-6 h-full">
                    {weeks.map((weekStart, weekIndex) => {
                        const weekDays = eachDayOfInterval({
                            start: weekStart,
                            end: addDays(weekStart, 6)
                        });

                        return (
                            <div key={weekIndex} className="grid grid-cols-7 border-b">
                                {weekDays.map(day => {
                                    const dayMeetings = getMeetingsForDay(day);
                                    const isCurrentMonth = isSameMonth(day, currentDate);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`min-h-[120px] p-2 border-l relative cursor-pointer hover:bg-gray-50 ${
                                                !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
                                            }`}
                                            onClick={() => handleTimeSlotClick(day, 9)}
                                        >
                                            {/* Date number */}
                                            <div className={`text-sm font-medium mb-1 ${
                                                isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                                            }`}>
                                                {format(day, 'd')}
                                            </div>

                                            {/* Meetings */}
                                            <div className="space-y-1">
                                                {dayMeetings.slice(0, 3).map(meeting => {
                                                    const client = clients[meeting.client_id];
                                                    if (!client) return null;

                                                    return (
                                                        <div
                                                            key={meeting.id}
                                                            className={`text-xs p-1 rounded cursor-pointer truncate ${statusColors[meeting.status] || statusColors['מתוכננת']}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMeetingClick(meeting);
                                                            }}
                                                            title={`${format(new Date(meeting.meeting_date), 'HH:mm')} - ${client.first_name} ${client.last_name}`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {typeIcons[meeting.type]}
                                                                <span className="truncate">
                                                                    {format(new Date(meeting.meeting_date), 'HH:mm')} {client.first_name}
                                                                </span>
                                                                {needsSummary(meeting) && (
                                                                    <AlertCircle className="h-2 w-2 text-red-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {dayMeetings.length > 3 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{dayMeetings.length - 3} נוספות
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (viewMode === 'week') {
        const weekDays = getWeekDays();
        const timeSlots = getTimeSlots();

        return (
            <div className="h-full overflow-auto">
                <div className="grid grid-cols-8 min-h-full">
                    {/* Time column */}
                    <div className="bg-gray-50 border-l">
                        <div className="h-12 border-b bg-gray-100"></div>
                        {timeSlots.map(hour => (
                            <div key={hour} className="h-16 border-b flex items-start justify-center pt-1">
                                <span className="text-xs text-gray-500">{hour}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="border-l relative">
                            {/* Day header */}
                            <div className="h-12 border-b bg-gray-50 flex flex-col items-center justify-center">
                                <div className="text-xs text-gray-500">
                                    {format(day, 'EEE', { locale: he })}
                                </div>
                                <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                                    {format(day, 'd')}
                                </div>
                            </div>

                            {/* Time slots */}
                            <div className="relative">
                                {timeSlots.map(hour => (
                                    <div
                                        key={hour}
                                        className="h-16 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, hour)}
                                        onClick={() => handleTimeSlotClick(day, hour)}
                                    />
                                ))}

                                {/* Meetings overlay */}
                                {getMeetingsForDay(day).map(meeting => {
                                    const client = clients[meeting.client_id];
                                    if (!client) return null;

                                    const topPosition = getMeetingPosition(meeting);
                                    const duration = meeting.duration || 60;
                                    const height = (duration / 60) * 64; // 64px per hour

                                    return (
                                        <div
                                            key={meeting.id}
                                            className={`absolute left-1 right-1 rounded p-1 cursor-pointer border shadow-sm transition-all hover:shadow-md ${statusColors[meeting.status] || statusColors['מתוכננת']}`}
                                            style={{
                                                top: `${topPosition + 48}px`, // +48 for header
                                                height: `${Math.max(height, 32)}px`,
                                                zIndex: 10
                                            }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, meeting)}
                                            onClick={() => onMeetingClick(meeting)}
                                        >
                                            <div className="flex items-center gap-1 mb-1">
                                                {typeIcons[meeting.type]}
                                                <Avatar className="h-4 w-4">
                                                    <AvatarFallback className="text-xs bg-white">
                                                        {getInitials(client.first_name, client.last_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {needsSummary(meeting) && (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                            </div>
                                            <div className="text-xs font-medium truncate">
                                                {client.first_name} {client.last_name}
                                            </div>
                                            <div className="text-xs truncate opacity-90">
                                                {meeting.title}
                                            </div>
                                            <div className="text-xs opacity-75">
                                                {format(new Date(meeting.meeting_date), 'HH:mm')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Day view - עם עמודת שעות צרה יותר
    if (viewMode === 'day') {
        const timeSlots = getTimeSlots();
        const dayMeetings = getMeetingsForDay(currentDate);

        return (
            <div className="h-full overflow-auto">
                <div className="grid grid-cols-[60px_1fr] min-h-full">
                    {/* Time column - צרה יותר */}
                    <div className="bg-gray-50 border-l">
                        <div className="h-12 border-b bg-gray-100 flex items-center justify-center">
                            <span className="font-medium text-xs">שעה</span>
                        </div>
                        {timeSlots.map(hour => (
                            <div key={hour} className="h-20 border-b flex items-center justify-center">
                                <span className="text-xs text-gray-600">{hour}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Day column - רחבה יותר */}
                    <div className="border-l relative">
                        <div className="h-12 border-b bg-gray-50 flex items-center justify-center">
                            <span className="font-medium">{format(currentDate, 'EEEE, d MMMM', { locale: he })}</span>
                        </div>

                        <div className="relative">
                            {timeSlots.map(hour => (
                                <div
                                    key={hour}
                                    className="h-20 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, currentDate, hour)}
                                    onClick={() => handleTimeSlotClick(currentDate, hour)}
                                />
                            ))}

                            {/* Meetings overlay */}
                            {dayMeetings.map(meeting => {
                                const client = clients[meeting.client_id];
                                if (!client) return null;

                                const topPosition = getMeetingPosition(meeting) * (80/60) ; // 80px per hour
                                const duration = meeting.duration || 60;
                                const height = (duration / 60) * 80; // 80px per hour in day view

                                return (
                                    <div
                                        key={meeting.id}
                                        className={`absolute left-2 right-2 rounded p-3 cursor-pointer border shadow-sm transition-all hover:shadow-md ${statusColors[meeting.status] || statusColors['מתוכננת']}`}
                                        style={{
                                            top: `${topPosition + 48}px`,
                                            height: `${Math.max(height, 50)}px`,
                                            zIndex: 10
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, meeting)}
                                        onClick={() => onMeetingClick(meeting)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {typeIcons[meeting.type] || <Clock className="h-4 w-4" />}
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(client.first_name, client.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-sm">
                                                {client.first_name} {client.last_name}
                                            </span>
                                            {needsSummary(meeting) && (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <div className="text-sm mb-1">{meeting.title}</div>
                                        <div className="text-xs opacity-75 flex items-center gap-2">
                                            <span>{format(new Date(meeting.meeting_date), 'HH:mm')}</span>
                                            <span>•</span>
                                            <span>{meeting.duration || 60} דקות</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
