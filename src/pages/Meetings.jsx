
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Meeting } from '@/api/entities';
import { Client } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import MeetingCalendar from '../components/meetings/MeetingCalendar';
import UpcomingMeetingsList from '../components/meetings/UpcomingMeetingsList';
import EditMeetingDialog from '../components/meetings/EditMeetingDialog';
import MeetingDetailsModal from '../components/meetings/MeetingDetailsModal';
import NewMeetingDialog from '../components/shared/NewMeetingDialog'; // Changed from EditMeetingDialog
import { format, addWeeks, subWeeks, addDays, isSameDay, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState([]);
    const [clients, setClients] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('week'); // week, month, day
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // פילטר רק חיפוש
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [meetingsData, clientsData] = await Promise.all([
                Meeting.list('-meeting_date'),
                Client.list(),
            ]);
            setMeetings(meetingsData);
            const clientsMap = clientsData.reduce((acc, client) => {
                acc[client.id] = client;
                return acc;
            }, {});
            setClients(clientsMap);
        } catch (error) {
            console.error("Error loading meetings data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Get upcoming meetings (next 7 days)
    const upcomingMeetings = useMemo(() => {
        const now = new Date();
        const nextWeek = addDays(now, 7);
        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.meeting_date);
            return meetingDate >= now && meetingDate <= nextWeek && meeting.status === 'מתוכננת';
        }).sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
    }, [meetings]);

    // Filter meetings based on search only
    const filteredMeetings = useMemo(() => {
        if (!searchQuery) return meetings;
        
        return meetings.filter(meeting => {
            const client = clients[meeting.client_id];
            if (!client) return false;

            const searchLower = searchQuery.toLowerCase();
            const clientName = `${client.first_name} ${client.last_name}`.toLowerCase();
            const clientEmail = (client.email || '').toLowerCase();
            const meetingTitle = meeting.title.toLowerCase();

            return clientName.includes(searchLower) || 
                   clientEmail.includes(searchLower) || 
                   meetingTitle.includes(searchLower);
        });
    }, [meetings, clients, searchQuery]);

    const handleDateNavigation = (direction) => {
        if (viewMode === 'week') {
            setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        } else if (viewMode === 'month') {
            setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(addDays(currentDate, direction === 'next' ? 1 : -1));
        }
    };

    const handleMeetingClick = (meeting) => {
        setSelectedMeeting(meeting);
        setIsDetailsOpen(true);
    };

    const handleNewMeeting = (dateTime = null) => {
        setSelectedDateTime(dateTime);
        setIsNewOpen(true);
    };

    const handleEditMeeting = (meeting) => {
        setSelectedMeeting(meeting);
        setIsEditOpen(true);
    };

    const getDateRangeText = () => {
        if (viewMode === 'week') {
            const start = addDays(currentDate, -currentDate.getDay());
            const end = addDays(start, 6);
            return `${format(start, 'd MMM', { locale: he })} - ${format(end, 'd MMM yyyy', { locale: he })}`;
        } else if (viewMode === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: he });
        } else {
            return format(currentDate, 'EEEE, d MMMM yyyy', { locale: he });
        }
    };

    return (
        <div className="p-6 h-screen flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">הפגישות שלי</h1>
                    <p className="text-gray-600 mt-1">נהל את כל הפגישות שלך במקום אחד</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <Tabs value={viewMode} onValueChange={setViewMode}>
                        <TabsList className="bg-gray-100">
                            <TabsTrigger value="day">יום</TabsTrigger>
                            <TabsTrigger value="week">שבוע</TabsTrigger>
                            <TabsTrigger value="month">חודש</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={() => handleNewMeeting()}>
                        <Plus className="h-4 w-4 ml-2" />
                        קבע פגישה חדשה
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                {/* Date Navigation */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => handleDateNavigation('prev')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold text-lg min-w-[200px] text-center">
                        {getDateRangeText()}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDateNavigation('next')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                        היום
                    </Button>
                </div>

                {/* Search only */}
                <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="חיפוש לקוח, נושא..."
                        className="pr-10 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left Sidebar - Upcoming Meetings */}
                <div className="w-80 flex-shrink-0">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                פגישות קרובות ({upcomingMeetings.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <UpcomingMeetingsList
                                meetings={upcomingMeetings}
                                clients={clients}
                                onMeetingClick={handleMeetingClick}
                                onEditMeeting={handleEditMeeting}
                                onRefresh={loadData}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Main Area - Calendar */}
                <div className="flex-1">
                    <Card className="h-full">
                        <CardContent className="p-0 h-full">
                            <MeetingCalendar
                                meetings={filteredMeetings}
                                clients={clients}
                                currentDate={currentDate}
                                viewMode={viewMode}
                                onMeetingClick={handleMeetingClick}
                                onTimeSlotClick={handleNewMeeting}
                                onMeetingMove={async (meetingId, newDateTime) => {
                                    try {
                                        await Meeting.update(meetingId, { meeting_date: newDateTime });
                                        loadData();
                                    } catch (error) {
                                        console.error("Failed to move meeting:", error);
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            <NewMeetingDialog
                open={isNewOpen}
                onOpenChange={setIsNewOpen}
                dateTime={selectedDateTime}
                onSuccess={() => {
                    loadData();
                    setIsNewOpen(false);
                }}
            />
            
            <EditMeetingDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                meeting={selectedMeeting}
                onSuccess={() => {
                    loadData();
                    setIsEditOpen(false);
                }}
            />

            <MeetingDetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                meeting={selectedMeeting}
                client={selectedMeeting ? clients[selectedMeeting.client_id] : null}
                onEdit={handleEditMeeting}
                onRefresh={loadData}
            />
        </div>
    );
}
