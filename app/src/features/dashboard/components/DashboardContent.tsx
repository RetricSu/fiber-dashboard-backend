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
  Activity,
  ArrowUpRight,
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
    <div className="space-y-12 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Total Capacity"
          value={`${kpiData?.totalCapacity.toFixed(1) || "0.0"} CKB`}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<Zap className="h-5 w-5" />}
          className="animate-slide-up bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Total Nodes"
          value={kpiData?.totalNodes.toLocaleString() || "0"}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<Network className="h-5 w-5" />}
          className="animate-slide-up [animation-delay:0.1s] bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
          iconBg="bg-green-500/10"
          iconColor="text-green-600"
        />
        <KpiCard
          title="Total Channels"
          value={kpiData?.totalChannels.toLocaleString() || "0"}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<GitBranch className="h-5 w-5" />}
          className="animate-slide-up [animation-delay:0.2s] bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50"
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
        />
        <KpiCard
          title="Avg Channel Capacity"
          value={`${kpiData?.averageChannelCapacity.toFixed(2) || "0.00"} CKB`}
          change={kpiData?.networkGrowth}
          changeLabel="vs last month"
          icon={<BarChart3 className="h-5 w-5" />}
          className="animate-slide-up [animation-delay:0.3s] bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600"
        />
        <KpiCard
          title="Network Growth"
          value={`${kpiData?.networkGrowth.toFixed(1) || "0.0"}%`}
          change={kpiData?.networkGrowth}
          changeLabel="monthly"
          icon={<TrendingUp className="h-5 w-5" />}
          className="animate-slide-up [animation-delay:0.4s] bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50"
          iconBg="bg-red-500/10"
          iconColor="text-red-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time Series Chart */}
        <Card className="group hover:shadow-zed-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-zed bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Network Capacity Over Time
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {timeSeriesLoading ? (
              <Skeleton className="h-80 rounded-lg" />
            ) : (
              <TimeSeriesChart data={timeSeriesData || []} height="320px" />
            )}
          </CardContent>
        </Card>

        {/* ISP Ranking Chart */}
        <Card className="group hover:shadow-zed-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-zed bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                Top ISPs by Node Count
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {ispRankingLoading ? (
              <Skeleton className="h-80 rounded-lg" />
            ) : (
              <IspRankingChart data={ispRankingData || []} height="320px" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* World Map Chart */}
      <Card className="group hover:shadow-zed-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-zed bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              Lightning Network Global Distribution
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {geoNodeLoading ? (
            <Skeleton className="h-96 rounded-lg" />
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
    <div className="space-y-12">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
