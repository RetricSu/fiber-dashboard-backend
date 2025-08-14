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
}

export default function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className = "",
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
    <Card className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold group-hover:text-primary transition-colors">
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 pt-1">
            {getChangeIcon()}
            <Badge
              variant="secondary"
              className={`text-xs ${getChangeColor()} group-hover:scale-105 transition-transform`}
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
