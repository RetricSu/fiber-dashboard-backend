"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../hooks/useDashboard";
import {
  fetchKpiData,
  fetchTimeSeriesData,
  fetchGeoNodeData,
  fetchIspRankingData,
} from "../api/client";
import KpiCard from "./KpiCard";
import TimeSeriesChart from "./charts/TimeSeriesChart";
import WorldMapChart from "./charts/WorldMapChart";
import IspRankingChart from "./charts/IspRankingChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Zap,
  Network,
  GitBranch,
  BarChart3,
  TrendingUp,
  Globe,
  Server,
} from "lucide-react";

export default function DashboardContent() {
  // 查询数据
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: queryKeys.kpis,
    queryFn: fetchKpiData,
    refetchInterval: 30000, // 30秒轮询
  });

  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery({
    queryKey: queryKeys.timeSeries,
    queryFn: fetchTimeSeriesData,
    refetchInterval: 60000, // 1分钟轮询
  });

  const { data: geoNodeData, isLoading: geoNodeLoading } = useQuery({
    queryKey: queryKeys.geoNodes,
    queryFn: fetchGeoNodeData,
    refetchInterval: 300000, // 5分钟轮询
  });

  const { data: ispRankingData, isLoading: ispRankingLoading } = useQuery({
    queryKey: queryKeys.ispRankings,
    queryFn: fetchIspRankingData,
    refetchInterval: 300000, // 5分钟轮询
  });

  if (kpiLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Capacity"
          value={`${kpiData?.totalCapacity.toFixed(1) || "0.0"} CKB`}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<Zap className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Nodes"
          value={kpiData?.totalNodes.toLocaleString() || "0"}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<Network className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Channels"
          value={kpiData?.totalChannels.toLocaleString() || "0"}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<GitBranch className="h-4 w-4" />}
        />
        <KpiCard
          title="Avg Channel Capacity"
          value={`${kpiData?.averageChannelCapacity.toFixed(2) || "0.00"} CKB`}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="Network Growth"
          value={`${kpiData?.networkGrowth.toFixed(1) || "0.0"}%`}
          change={kpiData?.networkGrowth}
          changeLabel="monthly"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Network Capacity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <TimeSeriesChart data={timeSeriesData || []} height="320px" />
            )}
          </CardContent>
        </Card>

        {/* ISP Ranking Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Top ISPs by Node Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ispRankingLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <IspRankingChart data={ispRankingData || []} height="320px" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* World Map Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Lightning Network Global Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geoNodeLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <WorldMapChart data={geoNodeData || []} height="500px" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>

      <Skeleton className="h-96" />
    </div>
  );
}
