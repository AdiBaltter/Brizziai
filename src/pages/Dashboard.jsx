
import React, { useState, useEffect } from "react";
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Task } from '@/api/entities';
import { Meeting } from '@/api/entities';
import { Document } from '@/api/entities';
import { ProcessAction } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Plus,
  ArrowLeft,
  Phone,
  Mail
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { he } from "date-fns/locale";

import StatsCard from "@/components/dashboard/StatsCard";
import TaskList from "@/components/dashboard/TaskList";
import UpcomingMeetingsList from "@/components/dashboard/UpcomingMeetingsList";
import NotificationBell from "@/components/dashboard/NotificationBell";
import TimeFilter from "@/components/dashboard/TimeFilter";
import NewLeadDialog from "@/components/dashboard/NewLeadDialog";
import MeetingDetailsModal from '../components/meetings/MeetingDetailsModal';

import { useAccount } from '@/components/shared/AccountContext';
import { useSecureEntityList, SecureEntityOperations } from '@/components/shared/useSecureEntityOperations';

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("week");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);

  // הוספת state למודל פרטי פגישה
  const [selectedMeetingForDetails, setSelectedMeetingForDetails] = useState(null);
  const [isMeetingDetailsOpen, setIsMeetingDetailsOpen] = useState(false);

  // שימוש בקונטקסט החשבון
  const { accountId, currentUser, superAdminContext, loading: accountLoading } = useAccount();

  // שימוש בהוקים מאובטחים לטעינת נתונים
  const {
    data: clients,
    loading: clientsLoading,
    reload: reloadClients
  } = useSecureEntityList(Client, "-created_date", 50);

  const {
    data: leads,
    loading: leadsLoading,
    reload: reloadLeads
  } = useSecureEntityList(Lead, "-created_date", 200);

  const {
    data: tasks,
    loading: tasksLoading,
    reload: reloadTasks
  } = useSecureEntityList(Task, "-created_date", 50);

  const {
    data: meetings,
    loading: meetingsLoading,
    reload: reloadMeetings
  } = useSecureEntityList(Meeting, "-meeting_date", 50);

  const {
    data: approvalTasks,
    loading: approvalTasksLoading,
    reload: reloadApprovalTasks
  } = useSecureEntityList(ProcessAction, "-created_date");

  // This hook already fetches all ProcessActions, no need for a separate function
  // The useEffect block that was loading approval tasks is no longer needed as useSecureEntityList handles it.

  const loading = accountLoading || clientsLoading || leadsLoading || tasksLoading || meetingsLoading || approvalTasksLoading;

  const getGreeting = () => {
    if (!currentUser) {
      return "דשבורד";
    }

    // Show account context for super admin
    if (superAdminContext && superAdminContext.orgName) {
      return `דשבורד - ${superAdminContext.orgName}`;
    }

    const hour = new Date().getHours();
    const name = currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'משתמש';

    if (hour >= 5 && hour < 12) {
      return `בוקר טוב, ${name}! ☀️`;
    }
    if (hour >= 12 && hour < 18) {
      return `צהריים טובים, ${name}! 👋`;
    }
    return `ערב טוב, ${name}! 🌙`;
  };

  // Filter data based on time period
  const getFilteredData = () => {
    const now = new Date();
    let cutoffDate;

    switch(timeFilter) {
      case "day":
        cutoffDate = subDays(now, 1);
        break;
      case "week":
        cutoffDate = subWeeks(now, 1);
        break;
      case "month":
        cutoffDate = subMonths(now, 1);
        break;
      default:
        cutoffDate = subWeeks(now, 1);
    }

    return {
      clients: clients.filter(c => isAfter(new Date(c.created_date), cutoffDate)),
      leads: leads.filter(l => isAfter(new Date(l.created_date), cutoffDate)),
      tasks: tasks.filter(t => isAfter(new Date(t.created_date), cutoffDate) || t.status !== "הושלם"),
      meetings: meetings.filter(m => isAfter(new Date(m.created_date), cutoffDate)),
      approvalTasks: approvalTasks.filter(a => a.status === 'ממתין לאישור')
    };
  };

  const filteredData = getFilteredData();

  // Enhanced metrics calculations
  const getEnhancedMetrics = () => {
    const newLeadsCount = leads.filter(l => l.status === 'חדש').length;
    const newLeadsInPeriod = filteredData.leads.filter(l => l.status === 'חדש').length;

    const leadsInTreatment = leads.filter(l => l.is_active !== false).length;

    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.meeting_date);
      return meetingDate > new Date() && meeting.status === "מתוכננת";
    }).length;

    // Use the filtered pendingApprovalTasks count (same as menu badge and tasks page)
    const pendingApprovalTasksCount = approvalTasks.filter(t => t.status === "ממתין לאישור").length;

    return {
      newLeadsCount,
      newLeadsInPeriod,
      leadsInTreatment,
      upcomingMeetings,
      openTasks: pendingApprovalTasksCount, // This will show the same number as the menu badge
      pendingApprovalTasks: pendingApprovalTasksCount
    };
  };

  const metrics = getEnhancedMetrics();

  const getUpcomingMeetings = () => {
    const now = new Date();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.meeting_date);
      return meetingDate > now && meeting.status === "מתוכננת";
    }).slice(0, 10); // הגדלתי מ-5 ל-10 כדי לתמוך בכפתור "הצג יותר"
  };

  const upcomingMeetingsData = getUpcomingMeetings();

  const clientsMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {});

  const leadsMap = leads.reduce((acc, lead) => {
    acc[lead.id] = lead;
    return acc;
  }, {});

  const handleMeetingClick = (meeting) => {
    setSelectedMeetingForDetails(meeting);
    setIsMeetingDetailsOpen(true);
  };

  const handleRefreshData = () => {
    reloadClients();
    reloadLeads();
    reloadTasks();
    reloadMeetings();
    reloadApprovalTasks();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell
            tasks={tasks}
            approvalTasks={approvalTasks.filter(a => a.status === 'ממתין לאישור')} // Pass filtered approval tasks
            meetings={meetings}
            clients={clients}
            leads={leads}
            onUpdate={handleRefreshData}
          />
          <Button
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            onClick={() => setIsNewLeadDialogOpen(true)}
          >
            <Plus className="h-4 w-4 ml-2" />
            הוספת ליד
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="לידים חדשים"
          value={metrics.newLeadsCount}
          icon={Users}
          color="blue"
          trend={metrics.newLeadsInPeriod}
          trendLabel={`${timeFilter === 'day' ? 'נכנסו היום' : timeFilter === 'week' ? 'נכנסו השבוע' : timeFilter === 'month' ? 'נכנסו החודש' : 'בתקופה שנבחרה'}`}
        />
        <StatsCard
          title="לידים פעילים"
          value={metrics.leadsInTreatment}
          icon={Users}
          color="orange"
          trend={leads.filter(l => ['יצר קשר', 'בתהליך סגירה'].includes(l.status)).length}
          trendLabel="בתקשורת"
        />
        <StatsCard
          title="פגישות מתוכננות"
          value={metrics.upcomingMeetings}
          icon={Calendar}
          color="green"
          trend={meetings.filter(m => m.status === "מתוכננת").length}
          trendLabel="סה״כ מתוכננות"
        />
        <StatsCard
          title="משימות פתוחות"
          value={metrics.openTasks}
          icon={CheckSquare}
          color="purple"
          trendLabel={`${metrics.pendingApprovalTasks} ממתינות לאישור`}
          trend={metrics.pendingApprovalTasks}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Column - Tasks and Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <TaskList
            tasks={tasks}
            approvalTasks={approvalTasks.filter(a => a.status === 'ממתין לאישור')}
            clients={clientsMap}
            leads={leadsMap}
            loading={loading}
            onUpdate={handleRefreshData}
          />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingMeetingsList
            meetings={upcomingMeetingsData}
            loading={loading}
            clients={clientsMap}
            leads={leadsMap}
            onMeetingClick={handleMeetingClick}
          />
        </div>
      </div>

      <NewLeadDialog
        open={isNewLeadDialogOpen}
        onOpenChange={setIsNewLeadDialogOpen}
        onSuccess={handleRefreshData}
        accountId={accountId}
      />

      <MeetingDetailsModal
        open={isMeetingDetailsOpen}
        onOpenChange={setIsMeetingDetailsOpen}
        meeting={selectedMeetingForDetails}
        client={selectedMeetingForDetails ? clientsMap[selectedMeetingForDetails.client_id] : null}
        lead={selectedMeetingForDetails ? leadsMap[selectedMeetingForDetails.lead_id] : null}
        onEdit={() => {}} // פונקציה ריקה כי אנחנו בדשבורד
        onRefresh={handleRefreshData}
      />
    </div>
  );
}
