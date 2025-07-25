
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Client } from '@/api/entities';
import { Process } from '@/api/entities';
import { Task } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Edit,
  Trash2,
  Crown,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from '@/components/shared/AccountContext'; // Assuming this context provides accountId

export default function TeamManagement() { // Renamed from TeamManagementPage
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Data for permissions
  const [clients, setClients] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // New state for invite form fields
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Viewer');
  const [newMemberFirstName, setNewMemberFirstName] = useState('');
  const [newMemberLastName, setNewMemberLastName] = useState('');
  const [newMemberPosition, setNewMemberPosition] = useState(''); // New field for company position

  const { toast } = useToast();
  const { accountId } = useAccount(); // Get accountId from context

  useEffect(() => {
    // Ensure accountId is available before loading data
    if (accountId) {
      loadTeamMembers(); // Renamed from loadData
    }
  }, [accountId]); // Add accountId to dependency array

  const loadTeamMembers = async () => { // Renamed from loadData
    setLoading(true);
    try {
      // Fetch current user first to check role and get company details for invite email
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.user_role !== 'Admin') {
        toast({
          variant: "destructive",
          title: "אין הרשאה",
          description: "רק אדמינים יכולים לגשת לעמוד זה.",
        });
        return;
      }
      
      // Load team members from the same account
      const members = await User.filter({ 
        account_id: accountId // Changed from organization_id
      }, '-created_date');
      setTeamMembers(members);
      
      // Load data for permissions
      const [clientsData, processesData, tasksData] = await Promise.all([
        Client.filter({ account_id: accountId }), // Changed from organization_id
        Process.filter({ account_id: accountId }), // Changed from organization_id
        Task.filter({ account_id: accountId }) // Changed from organization_id
      ]);
      
      setClients(clientsData);
      setProcesses(processesData);
      setTasks(tasksData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ 
        variant: 'destructive', 
        title: 'שגיאה', 
        description: 'טעינת נתוני הצוות נכשלה' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Editor': return 'bg-blue-100 text-blue-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'Admin': return 'מנהל';
      case 'Editor': return 'עורך';
      case 'Viewer': return 'צופה';
      default: return 'לא ידוע';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'פעיל': return 'bg-green-100 text-green-800';
      case 'מושהה': return 'bg-yellow-100 text-yellow-800';
      case 'ממתין להפעלה': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'פעיל': return <CheckCircle className="h-4 w-4" />;
      case 'מושהה': return <Ban className="h-4 w-4" />;
      case 'ממתין להפעלה': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await User.update(userId, updates);
      toast({ 
        title: 'הצלחה', 
        description: 'פרטי המשתמש עודכנו בהצלחה' 
      });
      loadTeamMembers(); // Renamed from loadData
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ 
        variant: 'destructive', 
        title: 'שגיאה', 
        description: 'עדכון המשתמש נכשל' 
      });
    }
  };

  const handleSuspendUser = async (userId, suspend = true) => {
    if (userId === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "לא ניתן",
        description: "אין באפשרותך להשעות את עצמך.",
      });
      return;
    }

    const newStatus = suspend ? 'מושהה' : 'פעיל';
    const confirmMessage = suspend ? 
      'האם אתה בטוח שברצונך להשעות את המשתמש?' : 
      'האם אתה בטוח שברצונך להפעיל את המשתמש?';
    
    if (confirm(confirmMessage)) {
      await handleUpdateUser(userId, { status: newStatus });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "לא ניתן",
        description: "אין באפשרותך למחוק את עצמך.",
      });
      return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.')) {
      try {
        await User.delete(userId);
        toast({ 
          title: 'הצלחה', 
          description: 'המשתמש הוסר בהצלחה' 
        });
        loadTeamMembers(); // Renamed from loadData
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({ 
          variant: 'destructive', 
          title: 'שגיאה', 
          description: 'מחיקת המשתמש נכשלה' 
        });
      }
    }
  };

  // --- Invite User Form Logic (integrated) ---
  const resetInviteForm = () => {
    setNewMemberEmail('');
    setNewMemberRole('Viewer');
    setNewMemberFirstName('');
    setNewMemberLastName('');
    setNewMemberPosition('');
  };

  const handleInvite = async () => {
    if (!newMemberEmail || !newMemberRole || !newMemberFirstName || !newMemberLastName) {
      toast({
        variant: "destructive",
        title: "שדות חובה חסרים",
        description: "אנא מלא את כל פרטי המשתמש הנדרשים.",
      });
      return;
    }
    setLoading(true);
    try {
      // User.invite replaces User.create and handles invitation token & email sending internally
      await User.invite({
        email: newMemberEmail,
        role: newMemberRole, // This is user_role in the backend
        full_name: `${newMemberFirstName} ${newMemberLastName}`,
        first_name: newMemberFirstName,
        last_name: newMemberLastName,
        company_position: newMemberPosition, // Pass new field
        account_id: accountId, // Use accountId from context
        invited_by_email: currentUser?.email, // Pass current user's email for tracking
        invited_by_name: currentUser?.full_name, // Pass current user's name for tracking
        account_name: currentUser?.company_name // Assuming company_name from currentUser maps to account name
      });

      toast({
        title: "הזמנה נשלחה!",
        description: `הזמנה נשלחה לכתובת ${newMemberEmail}.`
      });
      setIsInviteDialogOpen(false);
      resetInviteForm();
      loadTeamMembers();
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בשליחת הזמנה",
        description: (error instanceof Error) ? error.message : "לא ניתן היה לשלוח את ההזמנה.",
      });
    } finally {
      setLoading(false);
    }
  };
  // --- End Invite User Form Logic ---

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Ensure currentUser is available before checking roles
  if (!currentUser || currentUser.user_role !== 'Admin') {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">אין הרשאה</h2>
            <p className="text-gray-600">רק מנהלים יכולים לגשת לעמוד ניהול הצוות.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול צוות</h1>
          <p className="text-gray-600 mt-1">נהל את חברי הצוות והרשאותיהם</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 ml-2" />
              הוסף חבר צוות
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>הזמנת משתמש חדש</DialogTitle>
            </DialogHeader>
            {/* Invite User Form (integrated directly) */}
            <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="space-y-4">
              <div>
                <Label htmlFor="newMemberFirstName">שם פרטי</Label>
                <Input
                  id="newMemberFirstName"
                  value={newMemberFirstName}
                  onChange={(e) => setNewMemberFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newMemberLastName">שם משפחה</Label>
                <Input
                  id="newMemberLastName"
                  value={newMemberLastName}
                  onChange={(e) => setNewMemberLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newMemberEmail">כתובת אימייל</Label>
                <Input
                  id="newMemberEmail"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newMemberPosition">תפקיד בחברה</Label>
                <Input
                  id="newMemberPosition"
                  value={newMemberPosition}
                  onChange={(e) => setNewMemberPosition(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newMemberRole">תפקיד במערכת</Label>
                <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Viewer">צופה</SelectItem>
                    <SelectItem value="Editor">עורך</SelectItem>
                    <SelectItem value="Admin">מנהל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  <Mail className="h-4 w-4 ml-2" />
                  {loading ? 'שולח הזמנה...' : 'שלח הזמנה'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-gray-600">סה״כ חברי צוות</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.user_role === 'Admin').length}
                </p>
                <p className="text-gray-600">מנהלים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Edit className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.user_role === 'Editor').length}
                </p>
                <p className="text-gray-600">עורכים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'פעיל').length}
                </p>
                <p className="text-gray-600">פעילים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>חברי הצוות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">שם</TableHead>
                  <TableHead className="w-[200px]">מייל</TableHead>
                  <TableHead className="w-[120px]">תפקיד במערכת</TableHead>
                  <TableHead className="w-[120px]">תפקיד בחברה</TableHead>
                  <TableHead className="w-[100px]">סטטוס</TableHead>
                  <TableHead className="text-center w-[150px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {member.full_name ? 
                            member.full_name.substring(0, 2).toUpperCase() : 
                            member.email.substring(0, 2).toUpperCase()
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{member.full_name || 'לא צוין'}</div>
                        <div className="text-sm text-gray-500">{member.company_name || 'לא צוין'}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div>{member.email}</div>
                        {member.last_login && (
                          <div className="text-xs text-gray-500">
                            כניסה אחרונה: {new Date(member.last_login).toLocaleDateString('he-IL')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getRoleColor(member.user_role)}>
                        {getRoleText(member.user_role)}
                      </Badge>
                    </TableCell>

                    <TableCell>{member.company_position || 'לא צוין'}</TableCell> {/* Display new field */}
                    
                    <TableCell>
                      <Badge className={getStatusColor(member.status)} variant="outline">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(member.status)}
                          {member.status}
                        </div>
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(member);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        {member.id !== currentUser?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={member.status === 'פעיל' ? 'text-yellow-600' : 'text-green-600'}
                              onClick={() => handleSuspendUser(member.id, member.status === 'פעיל')}
                            >
                              {member.status === 'פעיל' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteUser(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <EditUserForm 
              user={editingUser}
              clients={clients}
              processes={processes}
              tasks={tasks}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
                loadTeamMembers(); // Renamed from loadData
              }}
              onUpdate={handleUpdateUser}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Removed InviteUserForm as its logic is integrated into TeamManagement component

function EditUserForm({ user, clients, processes, tasks, onSuccess, onUpdate }) {
  // Initialize permissions with default structure if not present on user,
  // ensuring 'specific_clients', 'specific_processes', 'specific_tasks' are arrays
  const initialPermissions = user.permissions || {};
  const defaultPermissions = {
    clients: { view_all: true, specific_clients: [] },
    processes: { view_all: true, specific_processes: [] },
    tasks: { view_all: true, specific_tasks: [] }
  };

  const [formData, setFormData] = useState({
    user_role: user.user_role || 'Viewer',
    status: user.status || 'פעיל',
    company_position: user.company_position || '', // Add company_position field
    permissions: {
      ...defaultPermissions,
      clients: {
        ...defaultPermissions.clients,
        ...(initialPermissions.clients || {}),
        specific_clients: initialPermissions.clients?.specific_clients || []
      },
      processes: {
        ...defaultPermissions.processes,
        ...(initialPermissions.processes || {}),
        specific_processes: initialPermissions.processes?.specific_processes || []
      },
      tasks: {
        ...defaultPermissions.tasks,
        ...(initialPermissions.tasks || {}),
        specific_tasks: initialPermissions.tasks?.specific_tasks || []
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(user.id, formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">פרטים בסיסיים</TabsTrigger>
          <TabsTrigger value="permissions">הרשאות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="user_role">תפקיד במערכת</Label>
            <Select value={formData.user_role} onValueChange={(value) => setFormData({ ...formData, user_role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Viewer">צופה</SelectItem>
                <SelectItem value="Editor">עורך</SelectItem>
                <SelectItem value="Admin">מנהל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="company_position">תפקיד בחברה</Label>
            <Input
              id="company_position"
              value={formData.company_position}
              onChange={(e) => setFormData({ ...formData, company_position: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="status">סטטוס</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="פעיל">פעיל</SelectItem>
                <SelectItem value="מושהה">מושהה</SelectItem>
                <SelectItem value="ממתין להפעלה">ממתין להפעלה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-6">
          {/* Clients Permissions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">הרשאות לקוחות</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="clients-all"
                checked={formData.permissions.clients.view_all}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: {
                    ...formData.permissions,
                    clients: { ...formData.permissions.clients, view_all: checked, specific_clients: checked ? [] : formData.permissions.clients.specific_clients } // Clear specific if "view all"
                  }
                })}
              />
              <Label htmlFor="clients-all">גישה לכל הלקוחות</Label>
            </div>
            
            {!formData.permissions.clients.view_all && (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                <Label className="text-sm">בחר לקוחות ספציפיים:</Label>
                {clients.map(client => (
                  <div key={client.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={formData.permissions.clients.specific_clients.includes(client.id)}
                      onCheckedChange={(checked) => {
                        const updatedClients = checked
                          ? [...formData.permissions.clients.specific_clients, client.id]
                          : formData.permissions.clients.specific_clients.filter(id => id !== client.id);
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            clients: { ...formData.permissions.clients, specific_clients: updatedClients }
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`client-${client.id}`} className="text-sm">
                      {client.first_name} {client.last_name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Processes Permissions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">הרשאות תהליכים</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="processes-all"
                checked={formData.permissions.processes.view_all}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: {
                    ...formData.permissions,
                    processes: { ...formData.permissions.processes, view_all: checked, specific_processes: checked ? [] : formData.permissions.processes.specific_processes } // Clear specific if "view all"
                  }
                })}
              />
              <Label htmlFor="processes-all">גישה לכל התהליכים</Label>
            </div>
            
            {!formData.permissions.processes.view_all && (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                <Label className="text-sm">בחר תהליכים ספציפיים:</Label>
                {processes.map(process => (
                  <div key={process.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`process-${process.id}`}
                      checked={formData.permissions.processes.specific_processes.includes(process.id)}
                      onCheckedChange={(checked) => {
                        const updatedProcesses = checked
                          ? [...formData.permissions.processes.specific_processes, process.id]
                          : formData.permissions.processes.specific_processes.filter(id => id !== process.id);
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            processes: { ...formData.permissions.processes, specific_processes: updatedProcesses }
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`process-${process.id}`} className="text-sm">
                      {process.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Tasks Permissions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">הרשאות משימות</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="tasks-all"
                checked={formData.permissions.tasks.view_all}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: {
                    ...formData.permissions,
                    tasks: { ...formData.permissions.tasks, view_all: checked, specific_tasks: checked ? [] : formData.permissions.tasks.specific_tasks } // Clear specific if "view all"
                  }
                })}
              />
              <Label htmlFor="tasks-all">גישה לכל המשימות</Label>
            </div>
            {/* If specific tasks permissions are needed, uncomment and adapt the block below */}
            {!formData.permissions.tasks.view_all && (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                <Label className="text-sm">בחר משימות ספציפיות:</Label>
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={formData.permissions.tasks.specific_tasks.includes(task.id)}
                      onCheckedChange={(checked) => {
                        const updatedTasks = checked
                          ? [...formData.permissions.tasks.specific_tasks, task.id]
                          : formData.permissions.tasks.specific_tasks.filter(id => id !== task.id);
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            tasks: { ...formData.permissions.tasks, specific_tasks: updatedTasks }
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`task-${task.id}`} className="text-sm">
                      {task.title}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          שמור שינויים
        </Button>
      </div>
    </form>
  );
}
