"use client";

import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/features/dashboard/hooks/useDashboard";
import DashboardContent from "@/features/dashboard/components/DashboardContent";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { Zap, TrendingUp, Globe, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Real-time Lightning Network Analytics
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6 leading-tight">
              The Lightning Network
              <br />
              <span className="text-foreground">Dashboard</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Monitor the Lightning Network infrastructure with real-time
              insights into network capacity, node distribution, and ISP
              performance across the globe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-medium rounded-lg shadow-zed-lg hover:shadow-zed-xl transition-all duration-200"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                View Live Data
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-border hover:border-primary/50 px-8 py-3 text-lg font-medium rounded-lg transition-all duration-200"
              >
                <Globe className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm shadow-zed border border-white/20">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Real-time Monitoring
              </h3>
              <p className="text-muted-foreground">
                Live updates every 30 seconds with comprehensive network metrics
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm shadow-zed border border-white/20">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Global Distribution
              </h3>
              <p className="text-muted-foreground">
                Visualize node and channel distribution across the world
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm shadow-zed border border-white/20">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Advanced Analytics
              </h3>
              <p className="text-muted-foreground">
                Deep insights into ISP performance and network growth trends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Network Overview
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics and real-time data visualization for the
              Lightning Network infrastructure
            </p>
          </div>

          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </section>
    </QueryClientProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
