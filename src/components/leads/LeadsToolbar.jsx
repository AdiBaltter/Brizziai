import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

// מיפוי קטגוריות לתוויות בעברית
const categoryLabels = {
    'new-lead': 'ליד חדש',
    'schedule-meeting': 'קביעת פגישה',
    'meeting': 'פגישה',
    'send-message': 'שליחת הודעה',
    'documents': 'מסמכים',
    'price-quote': 'הצעת מחיר',
    'phone-call': 'שיחת טלפון',
    'deal-closure': 'סגירת עסקה'
};

export default function LeadsToolbar({ filters, onFilterChange, sortConfig, onSortChange, stages = [], processes = [] }) {
    // יצירת רשימה של קטגוריות ייחודיות מכל התהליכים
    const getUniqueCategories = () => {
        const categoriesSet = new Set();
        
        Object.values(processes).forEach(process => {
            if (process.stages && Array.isArray(process.stages)) {
                process.stages.forEach(stage => {
                    if (stage.category) {
                        categoriesSet.add(stage.category);
                    }
                });
            }
        });
        
        return Array.from(categoriesSet);
    };

    const uniqueCategories = getUniqueCategories();

    return (
        <div className="flex flex-col md:flex-row gap-2 justify-between items-center" dir="rtl">
            <div className="flex-1 flex justify-start items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="חיפוש ליד לפי שם, טלפון, אימייל..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="pr-10 text-right"
                    />
                </div>
                <Select value={filters.category || 'all'} onValueChange={(value) => onFilterChange('category', value)}>
                    <SelectTrigger className="w-[180px] bg-white text-right">
                        <SelectValue placeholder="סינון לפי קטגורית שלב..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הקטגוריות</SelectItem>
                        {uniqueCategories.map(category => (
                            <SelectItem key={category} value={category}>
                                {categoryLabels[category] || category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}