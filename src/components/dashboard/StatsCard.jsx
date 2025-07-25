import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colorVariants = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-600"
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    text: "text-green-600"
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    text: "text-orange-600"
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    text: "text-red-600"
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    text: "text-purple-600"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, trend, trendLabel }) {
  const colors = colorVariants[color] || colorVariants.blue;

  return (
    <Card className={`${colors.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-700">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full ${colors.icon} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {trendLabel && (
          <p className="text-xs text-gray-600">
            {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}