import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

export default function ClientsToolbar({ filters, onFilterChange, sortConfig, onSortChange }) {
    return (
        <div className="flex flex-col md:flex-row gap-2 justify-between items-center" dir="rtl">
            <div className="flex-1 flex justify-start items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="חיפוש לקוח לפי שם, טלפון, אימייל..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="pr-10 text-right"
                    />
                </div>
                <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
                    <SelectTrigger className="w-[180px] bg-white text-right">
                        <SelectValue placeholder="סנן לפי סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הסטטוסים</SelectItem>
                        <SelectItem value="ליד חדש">ליד חדש</SelectItem>
                        <SelectItem value="בתהליך">בתהליך</SelectItem>
                        <SelectItem value="הצעה נשלחה">הצעה נשלחה</SelectItem>
                        <SelectItem value="ממתין לתשובה">ממתין לתשובה</SelectItem>
                        <SelectItem value="לקוח">לקוח</SelectItem>
                        <SelectItem value="סגור">סגור</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.process} onValueChange={(value) => onFilterChange('process', value)}>
                    <SelectTrigger className="w-[180px] bg-white text-right">
                        <SelectValue placeholder="סנן לפי תהליך" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל התהליכים</SelectItem>
                        <SelectItem value="תהליך מכירה כללי">תהליך מכירה כללי</SelectItem>
                        <SelectItem value="תהליך שירות לקוחות">תהליך שירות לקוחות</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}