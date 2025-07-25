

import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  Plus,
  Bell,
  Search,
  Menu,
  X,
  Briefcase,
  User as UserIcon,
  LogOut,
  ChevronUp,
  ChevronDown,
  Target,
  Building,
  Eye,
  Gift, // Added icon
  CreditCard, // Added icon
  ShieldAlert, // Added icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User } from "@/api/entities";
import { ProcessAction } from "@/api/entities";
import { Client } from '@/api/entities'; // Added
import { Lead } from '@/api/entities'; // Added
import { Task } from "@/api/entities"; // Added Task import
import { Account } from '@/api/entities';
import { AccountUser } from '@/api/entities'; // Ensure AccountUser is imported
import NewTaskDialog from "../components/shared/NewTaskDialog";
import NewMeetingDialog from "../components/shared/NewMeetingDialog";
import NewLeadDialog from "../components/leads/NewLeadDialog";
import { QuickActionContext } from "../components/shared/QuickActionContext";
import { differenceInDays, isAfter, format } from "date-fns"; // Added date-fns imports
import IdeaButton from "../components/shared/IdeaButton"; // Added IdeaButton import
import { AccountProvider } from "../components/shared/AccountContext";
import { SecureEntityOperations } from "../components/shared/secureEntityOperations";

const navigationItems = [
  {
    title: "דשבורד",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "משימות",
    url: createPageUrl("Tasks"),
    icon: FileText,
    hasNotifications: true, // Flag to show notifications
  },
  {
    title: "פגישות",
    url: createPageUrl("Meetings"),
    icon: Calendar,
  },
  {
    title: "לידים",
    url: createPageUrl("Leads"),
    icon: Target,
  },
  {
    title: "לקוחות",
    url: createPageUrl("Clients"),
    icon: Users,
  },
  {
    title: "תהליכים",
    url: createPageUrl("Processes"),
    icon: Briefcase,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [superAdminContext, setSuperAdminContext] = useState(null);

  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState(() => {});

  const fetchCurrentUser = async () => {
    try {
      let user = await User.me();
      let needsUpdate = false;
      const userDataToUpdate = {};

      // Onboarding Flow: Check if user needs an account or trial initialization
      if (!user.account_id) {
        console.log("Layout: User has no account_id, creating a new account...");
        
        const newAccount = await Account.create({
          name: `העסק של ${user.full_name || 'משתמש חדש'}`,
          active: true,
        });

        await AccountUser.create({
          account_id: newAccount.id,
          user_id: user.id,
          role_in_account: 'owner',
          active: true
        });

        userDataToUpdate.account_id = newAccount.id;
        needsUpdate = true;
      }

      // Initialize trial period for new or existing users without trial data
      if (!user.trial_end_date && !user.subscription_status) {
        const newTrialEndDate = new Date();
        newTrialEndDate.setDate(newTrialEndDate.getDate() + 14); // 14 days trial

        userDataToUpdate.trial_end_date = format(newTrialEndDate, 'yyyy-MM-dd');
        userDataToUpdate.subscription_status = 'trial';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.updateMyUserData(userDataToUpdate);
        user = await User.me();
      }

      setCurrentUser(user);
      setAccountId(user.account_id);

      // Check for super admin context
      const contextData = sessionStorage.getItem('superAdminContext');
      if (contextData) {
        setSuperAdminContext(JSON.parse(contextData));
      }

      if (user.role === 'admin') {
        setIsSuperAdmin(true);
      }

      // Check subscription status
      const today = new Date();
      if (user.subscription_status === 'trial') {
        const trialEndDate = new Date(user.trial_end_date);
        if (isAfter(today, trialEndDate)) {
          setIsTrialActive(false);
          setIsSubscriptionExpired(true);
        } else {
          setIsTrialActive(true);
          setTrialDaysLeft(differenceInDays(trialEndDate, today));
        }
      } else if (user.subscription_status === 'expired') {
        setIsSubscriptionExpired(true);
      } else if (user.subscription_status === 'active') {
        setIsTrialActive(false);
        setIsSubscriptionExpired(false);
      }
    } catch (e) {
      console.error("Failed to fetch current user", e);
      if (currentPageName !== 'Landing' && !window.location.pathname.includes('/landing')) {
        navigate(createPageUrl('Landing'));
      }
    }
  };

  const fetchPendingTasks = async () => {
    if (!currentUser) return;
    try {
        const secureOpsProcessAction = new SecureEntityOperations(ProcessAction);
        const secureOpsClient = new SecureEntityOperations(Client);
        const secureOpsLead = new SecureEntityOperations(Lead);

        // Fetch all necessary data in parallel
        const [pendingTasks, allClients, allLeads] = await Promise.all([
            secureOpsProcessAction.secureFilter({ status: 'ממתין לאישור' }),
            secureOpsClient.secureList(),
            secureOpsLead.secureList()
        ]);
        
        const clientIds = new Set(allClients.map(c => c.id));
        const leadIds = new Set(allLeads.map(l => l.id));

        // Filter tasks to ensure the related entity exists
        const validPendingTasks = pendingTasks.filter(task => {
            if (task.client_id) {
                return clientIds.has(task.client_id);
            }
            if (task.lead_id) {
                return leadIds.has(task.lead_id);
            }
            // If a task has neither, it's considered invalid for this count
            return false;
        });

        setPendingTasksCount(validPendingTasks.length);
    } catch (e) {
      console.error("Failed to fetch and filter pending tasks:", e.message || e);
      setPendingTasksCount(0);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isPublicRoomView = currentPageName === 'ClientRoom' && searchParams.get('public_view') === 'true';

    if (!isPublicRoomView) {
      fetchCurrentUser();
    }
  }, [location.search, currentPageName]); // Run only on navigation changes.

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isPublicRoomView = currentPageName === 'ClientRoom' && searchParams.get('public_view') === 'true';
    
    // Fetch tasks only after the user is successfully loaded.
    if (!isPublicRoomView && currentUser) {
      fetchPendingTasks();

      // Refresh pending tasks count every 30 seconds
      const interval = setInterval(fetchPendingTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, currentPageName]); // Depend on currentUser to run after user is fetched.
  
  const openNewTask = (onSuccess = () => {}) => {
    setOnSuccessCallback(() => onSuccess);
    setIsNewTaskOpen(true);
  };

  const openNewMeeting = (onSuccess = () => {}) => {
    setOnSuccessCallback(() => onSuccess);
    setIsNewMeetingOpen(true);
  };

  const openNewLead = (onSuccess = () => {}) => {
    setOnSuccessCallback(() => onSuccess);
    setIsNewLeadDialogOpen(true);
  };

  const quickActions = { openNewTask, openNewMeeting, openNewLead };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const exitSuperAdminView = () => {
    sessionStorage.removeItem('superAdminContext');
    setSuperAdminContext(null);
    window.location.href = createPageUrl('Organizations'); // Redirect back to organizations page
  };

  // Filter nav items based on user role (simplified)
  const navItemsToDisplay = navigationItems.filter(item => {
    if (!currentUser) return false;
    // Assuming currentUser.user_role distinguishes 'Admin' for team management
    // The adminOnly property is no longer used for navigation items here,
    // as "ניהול צוות" (Team Management) is removed from navigation.
    return true;
  });

  // Check if current page is public facing and should not have the layout
  const searchParams = new URLSearchParams(location.search);
  const isPublicRoomView = currentPageName === 'ClientRoom' && searchParams.get('public_view') === 'true';
  const isClientPortal = currentPageName === 'ClientPortal';
  const isLandingPage = currentPageName === 'Landing';

  // Don't render layout for client portal, landing page, or public room view
  if (isClientPortal || isLandingPage || isPublicRoomView) {
    return children;
  }

  // Trial Expired Blocker
  if (isSubscriptionExpired) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center bg-white p-12 rounded-xl shadow-2xl max-w-lg">
          <ShieldAlert className="h-16 w-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">הניסיון החינמי הסתיים</h1>
          <p className="text-lg text-gray-600 mb-8">
            כדי להמשיך להשתמש בכל התכונות הנהדרות של המערכת, יש לעבור לתוכנית בתשלום.
          </p>
          <div className="flex justify-center items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl('Settings'))} // Assuming settings page handles subscription
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <CreditCard className="ml-2 h-5 w-5" />
              שדרג עכשיו
            </Button>
            <Button size="lg" variant="outline" onClick={handleLogout}>
              <LogOut className="ml-2 h-5 w-5" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccountProvider>
      <QuickActionContext.Provider value={quickActions}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
          {/* Super Admin Context Banner */}
          {superAdminContext && (
            <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                <span>אתה צופה כארגון: {superAdminContext.orgName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-orange-600 mr-4"
                  onClick={exitSuperAdminView}
                >
                  חזור לתצוגת מנהל מערכת
                </Button>
              </div>
            </div>
          )}

          {/* Trial Banner */}
          {isTrialActive && (
            <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-4 w-4" />
                <span>
                  נשארו לך {trialDaysLeft} ימים לתקופת הניסיון החינמית שלך!
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-yellow-900 hover:text-black h-auto p-0 underline"
                  onClick={() => navigate(createPageUrl('Settings'))}
                >
                  שדרג עכשיו
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Header */}
          <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
               style={{ top: (superAdminContext ? 40 : 0) + (isTrialActive ? 36 : 0) }}>
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/041688fe9_20250714_1322_BrizziAILogo_simple_compose_01k0477xbzepbsshhyv582hxa9.png" alt="Brizzi AI Logo" className="h-8" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">3</Badge>
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.profile_picture_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(currentUser?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
                <div className="px-4 py-2 space-y-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 mb-3">
                        <Plus className="h-4 w-4 ml-2" />
                        פעולה חדשה
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onSelect={() => { openNewLead(); setMobileMenuOpen(false); }} className="flex items-center gap-2 cursor-pointer">
                        <Target className="h-4 w-4" />
                        ליד חדש
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setMobileMenuOpen(false)}>
                        <Link to={createPageUrl("NewClient")} className="flex items-center gap-2 w-full">
                          <Users className="h-4 w-4" />
                          לקוח חדש
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { openNewMeeting(); setMobileMenuOpen(false); }} className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        פגישה חדשה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {navItemsToDisplay.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        location.pathname === item.url
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#ffffff] flex">
            {/* Desktop Sidebar */}
            <div
              className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white/80 lg:backdrop-blur-sm lg:border-l lg:border-gray-200"
              style={{ top: (superAdminContext ? 40 : 0) + (isTrialActive ? 36 : 0) }}
            >
              <div className="flex flex-col flex-1 min-h-0">
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/041688fe9_20250714_1322_BrizziAILogo_simple_compose_01k0477xbzepbsshhyv582hxa9.png" alt="Brizzi AI Logo" className="h-10" />
                </div>

                {/* Quick Actions Button - החליף את החיפוש */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                        <Plus className="h-4 w-4 ml-2" />
                        פעולה חדשה
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onSelect={() => openNewLead()} className="flex items-center gap-2 cursor-pointer">
                        <Target className="h-4 w-4" />
                        ליד חדש
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to={createPageUrl("NewClient")} className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          לקוח חדש
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openNewMeeting()} className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        פגישה חדשה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                  {navItemsToDisplay.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        location.pathname === item.url
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                      {item.hasNotifications && pendingTasksCount > 0 && (
                        <Badge className="h-5 w-5 justify-center p-0 bg-red-500 text-white rounded-full flex items-center text-xs font-bold">
                          {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </nav>

                {/* Idea Button */}
                <div className="px-4 py-2">
                  <IdeaButton />
                </div>

                {/* User Profile */}
                <div className="px-4 py-4 border-t border-gray-100">
                  <Link to={createPageUrl("Settings")} className="block p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                          <AvatarImage src={currentUser?.profile_picture_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                              {getInitials(currentUser?.full_name)}
                          </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                              {currentUser?.full_name || 'משתמש'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                              {currentUser?.email || 'אימייל'}
                          </p>
                          </div>
                      </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div
              className="flex-1 lg:mr-64"
              style={{ marginTop: (superAdminContext ? 40 : 0) + (isTrialActive ? 36 : 0) }}
            >
              <main className="min-h-screen">
                {children}
              </main>
            </div>
          </div>
          <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} onSuccess={onSuccessCallback} />
          <NewMeetingDialog open={isNewMeetingOpen} onOpenChange={setIsNewMeetingOpen} onSuccess={onSuccessCallback} />
          <NewLeadDialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen} onSuccess={onSuccessCallback} />
        </div>
      </QuickActionContext.Provider>
    </AccountProvider>
  );
}

