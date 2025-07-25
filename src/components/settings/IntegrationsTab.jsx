
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Puzzle } from 'lucide-react';

const initialIntegrations = [
  { name: 'WhatsApp', connected: true, icon: '💬' },
  { name: 'Gmail', connected: true, icon: '📧' },
  { name: 'Google Calendar', connected: false, icon: '📅' },
  { name: 'Zoom', connected: false, icon: '📹' },
];

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const toggleIntegration = (name) => {
    setIntegrations(
      integrations.map(int =>
        int.name === name ? { ...int, connected: !int.connected } : int
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="h-5 w-5" />
          אינטגרציות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-6">חבר את הכלים שאתה כבר משתמש בהם כדי לייעל את העבודה.</p>
        <div className="space-y-4">
          {integrations.map(integration => (
            <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{integration.icon}</span>
                <span className="font-medium">{integration.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${integration.connected ? 'text-green-600' : 'text-gray-500'}`}>
                  {integration.connected ? 'מחובר' : 'לא מחובר'}
                </span>
                <Switch
                  checked={integration.connected}
                  onCheckedChange={() => toggleIntegration(integration.name)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
