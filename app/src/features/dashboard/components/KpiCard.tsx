"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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

  return (
    <Card className={`p-6 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
        <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center space-x-2">
            {getChangeIcon()}
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${getChangeColor()} bg-white/50 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform`}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </Badge>
            {changeLabel && (
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
