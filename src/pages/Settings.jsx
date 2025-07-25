
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, CreditCard, Puzzle, Monitor, LifeBuoy, Users } from 'lucide-react';

import ProfileTab from '../components/settings/ProfileTab';
import SecurityTab from '../components/settings/SecurityTab';
import SubscriptionTab from '../components/settings/SubscriptionTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import DisplayTab from '../components/settings/DisplayTab';
import HelpTab from '../components/settings/HelpTab';
import TeamManagementTab from '../components/settings/TeamManagementTab';

// Assuming 'User' for User.me() is an API client or service.
const mockUserApi = {
  me: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ id: '123', name: 'John Doe', user_role: 'Admin' }); 
      }, 500);
    });
  },
};

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await mockUserApi.me(); 
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const tabs = [
    { id: 'profile', label: 'פרטי פרופיל', icon: User, component: ProfileTab },
    { id: 'security', label: 'אבטחה', icon: Lock, component: SecurityTab },
    { id: 'subscription', label: 'מנוי וחיוב', icon: CreditCard, component: SubscriptionTab },
    { id: 'integrations', label: 'אינטגרציות', icon: Puzzle, component: IntegrationsTab },
    { id: 'display', label: 'העדפות תצוגה', icon: Monitor, component: DisplayTab },
    { id: 'help', label: 'עזרה ובקשות', icon: LifeBuoy, component: HelpTab },
    ...(currentUser?.user_role === 'Admin' ? [{ id: 'team', label: 'ניהול צוות', icon: Users, component: TeamManagementTab }] : [])
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-600 mt-1">נהל את הגדרות החשבון, העדפות והחיוב שלך.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8 items-start">
        <TabsList className="flex flex-row md:flex-col h-auto md:h-full bg-transparent p-0 w-full md:w-48 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="w-full justify-start gap-2">
                <IconComponent className="h-4 w-4" /> {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="flex-1 w-full">
          {tabs.map((tab) => {
            const TabComponent = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <TabComponent />
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
