"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  iconBg?: string;
  iconColor?: string;
}

export default function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className = "",
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: KpiCardProps) {
  const getValueParts = () => {
    if (typeof value === "string") {
      const match = value.trim().match(/^([\d,\.]+)\s*(.*)$/);
      if (match) {
        return { numberText: match[1], unitText: match[2] || "" };
      }
      return { numberText: value, unitText: "" };
    }
    return { numberText: String(value), unitText: "" };
  };

  const getChangeIcon = () => {
    if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = () => {
    if (!change) return "text-muted-foreground";
    return change > 0 ? "text-green-500" : "text-red-500";
  };

  const { numberText, unitText } = getValueParts();

  return (
    <Card
      className={`bg-white rounded shadow-sm border border-dashed border-gray-300/90 transition-transform hover:scale-105 hover:shadow-md px-3 py-2 ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
        <CardTitle className="text-sm text-gray-500 tracking-wide">
          {title}
        </CardTitle>
        {icon && (
          <div
            className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-200`}
          >
            <div className={iconColor}>{icon}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-semibold text-gray-900">
            {numberText}
          </span>
          {unitText && <span className="text-gray-500"> {unitText}</span>}
        </div>
        {change !== undefined && (
          <div className={`mt-1 flex items-center text-sm ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="ml-2 text-gray-500">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
