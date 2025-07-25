import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export default function TimeFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] text-right">
          <SelectValue placeholder="בחר טווח זמן" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">היום</SelectItem>
          <SelectItem value="week">7 הימים האחרונים</SelectItem>
          <SelectItem value="month">30 הימים האחרונים</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}