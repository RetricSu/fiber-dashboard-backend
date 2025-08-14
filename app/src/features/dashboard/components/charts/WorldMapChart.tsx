"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { GeoNode } from "../../api/types";
import worldGeoJson from "../../api/maps/world.json";

interface WorldMapChartProps {
  data: GeoNode[];
  height?: string;
  className?: string;
}

export default function WorldMapChart({
  data,
  height = "500px",
  className = "",
}: WorldMapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);

    // 设置响应式
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  // 独立加载世界地图 GeoJSON（使用打包内置 JSON）
  useEffect(() => {
    try {
      if (worldGeoJson) {
        echarts.registerMap("world", worldGeoJson as never);
        setMapLoaded(true);
        console.log(
          "World map registered from local JSON, features:",
          (worldGeoJson as { features?: unknown[] }).features?.length
        );
      } else {
        setMapError("World GeoJSON not found");
      }
    } catch (error) {
      console.error("Failed to register local world GeoJSON:", error);
      setMapError(error instanceof Error ? error.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !data.length || !mapLoaded) return;

    // 转换数据格式
    const mapData = data.map(item => ({
      name: item.country,
      value: item.nodeCount,
      capacity: item.totalCapacity,
    }));

    console.log("mapData", mapData);
    console.log("data", data);

    const option: echarts.EChartsOption = {
      title: {
        text: "Fiber Network Nodes by Country",
        left: "center",
        textStyle: {
          color: "var(--foreground)",
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
        textStyle: {
          color: "var(--foreground)",
        },
        formatter: (params: unknown) => {
          const param = params as {
            name: string;
            data?: { value: number; capacity: number };
          };
          if (param.data) {
            const capacity = param.data.capacity || 0;
            const nodeCount = param.data.value || 0;
            return `${param.name}<br/>Nodes: ${nodeCount}<br/>Capacity: ${capacity.toFixed(2)} CKB`;
          }
          return param.name;
        },
      },
      visualMap: {
        min: 0,
        max:
          data.length > 0 ? Math.max(...data.map(item => item.nodeCount)) : 1,
        left: "left",
        top: "bottom",
        text: ["High", "Low"],
        calculable: true,
        inRange: {
          color: ["#e0f2fe", "#0ea5e9", "#0369a1"],
        },
        textStyle: {
          color: "var(--foreground)",
        },
      },
      series: [
        {
          name: "Fiber Nodes",
          type: "map",
          map: "world",
          roam: true,
          data: mapData,
          itemStyle: {
            borderColor: "var(--border)",
            borderWidth: 1,
          },
          emphasis: {
            label: {
              show: true,
            },
            itemStyle: {
              areaColor: "#0ea5e9",
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowBlur: 20,
              borderWidth: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };

    chartInstance.current.setOption(option);
  }, [data, mapLoaded]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={chartRef} style={{ height }} className={className} />
      {!mapLoaded && !mapError && (
        <div
          className={`${className} absolute inset-0 flex items-center justify-center pointer-events-none`}
        >
          <div className="text-muted-foreground">Loading world map...</div>
        </div>
      )}
      {mapError && (
        <div
          className={`${className} absolute inset-0 flex items-center justify-center pointer-events-none`}
        >
          <div className="text-center">
            <div className="text-destructive mb-2">
              Failed to load world map
            </div>
            <div className="text-sm text-muted-foreground">{mapError}</div>
          </div>
        </div>
      )}
    </div>
  );
}
