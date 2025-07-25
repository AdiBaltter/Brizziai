import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function MeetingsToolbar({ filters, onFilterChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="חיפוש לפי לקוח, נושא או מייל..."
          className="pr-10"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
        />
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
        />
        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="סינון לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="ממתינה לאישור">ממתינות לאישור</SelectItem>
            <SelectItem value="מתוכננת">עתידיות</SelectItem>
            <SelectItem value="התקיימה">עבר</SelectItem>
            <SelectItem value="בוטלה">בוטלו</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="סינון לפי סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="פגישה פיזית">פגישות פיזיות</SelectItem>
            <SelectItem value="פגישת אונליין">פגישות אונליין</SelectItem>
            <SelectItem value="שיחת טלפון">שיחות טלפון</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}