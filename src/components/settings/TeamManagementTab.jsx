
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Edit,
  Eye,
  Crown,
  Settings as SettingsIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";

export default function TeamManagementTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.user_role === 'Admin' && user.organization_id) {
        const members = await User.filter({ 
          organization_id: user.organization_id 
        }, '-created_date');
        setTeamMembers(members.slice(0, 5)); // Show only first 5
      }
    } catch (error) {
      console.error('Error loading team data:', error);
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Crown className="h-4 w-4" />;
      case 'Editor': return <Edit className="h-4 w-4" />;
      case 'Viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentUser?.user_role !== 'Admin') {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">ניהול צוות</h3>
          <p className="text-gray-600 mb-4">תכונה זו זמינה רק למנהלים</p>
          <p className="text-sm text-gray-500">
            פנה למנהל הארגון שלך כדי לקבל הרשאות מנהל או לנהל את חברי הצוות.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ניהול צוות
          </CardTitle>
          <Link to={createPageUrl('TeamManagement')}>
            <Button>
              <SettingsIcon className="h-4 w-4 ml-2" />
              ניהול מלא
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
              <div className="text-sm text-gray-600">חברי צוות</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {teamMembers.filter(m => m.user_role === 'Admin').length}
              </div>
              <div className="text-sm text-gray-600">מנהלים</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.status === 'פעיל').length}
              </div>
              <div className="text-sm text-gray-600">פעילים</div>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium text-gray-700">חברי צוות אחרונים:</div>
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                        {member.full_name ? 
                          member.full_name.substring(0, 2).toUpperCase() : 
                          member.email.substring(0, 2).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{member.full_name || member.email}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <Badge className={getRoleColor(member.user_role)} variant="outline">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.user_role)}
                      {getRoleText(member.user_role)}
                    </div>
                  </Badge>
                </div>
              ))}
              
              {teamMembers.length >= 5 && (
                <div className="text-right pt-2">
                  <Link to={createPageUrl('TeamManagement')}>
                    <Button variant="link" size="sm">
                      צפה בכל חברי הצוות ({teamMembers.length}+)
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
