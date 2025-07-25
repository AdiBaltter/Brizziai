import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building, Plus } from "lucide-react";

const statusColors = {
  "ליד חדש": "bg-blue-100 text-blue-700",
  "בתהליך": "bg-yellow-100 text-yellow-700",
  "הצעה נשלחה": "bg-purple-100 text-purple-700",
  "ממתין לתשובה": "bg-orange-100 text-orange-700",
  "לקוח": "bg-green-100 text-green-700",
  "סגור": "bg-gray-100 text-gray-700"
};

export default function ClientRoomHeader({ client }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-medium">
            {client.first_name[0]}{client.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {client.first_name} {client.last_name}
            </h1>
            <Badge className={statusColors[client.status]}>{client.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
            </div>
            {client.company && (
              <div className="flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span>{client.company}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline">
            <Phone className="h-4 w-4 ml-2" /> התקשר
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" /> הוסף משימה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}