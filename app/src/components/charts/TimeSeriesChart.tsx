'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { TimeSeries } from '@/libs/types';

interface TimeSeriesChartProps {
  data: TimeSeries[];
  height?: string;
  className?: string;
}

export default function TimeSeriesChart({ data, height = '400px', className = '' }: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);

    // 设置响应式
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !data.length) return;

    const option: echarts.EChartsOption = {
      title: {
        text: 'Network Capacity Over Time',
        left: 'center',
        textStyle: {
          color: 'var(--foreground)',
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        textStyle: {
          color: 'var(--foreground)',
        },
        formatter: (params: unknown) => {
          const paramArray = Array.isArray(params) ? params : [params];
          const firstParam = paramArray[0] as { value: [string | number, number]; seriesName: string };
          if (firstParam && Array.isArray(firstParam.value)) {
            const date = new Date(firstParam.value[0]).toLocaleDateString();
            const value = Number(firstParam.value[1]).toFixed(2);
            return `${date}<br/>${firstParam.seriesName}: ${value} BTC`;
          }
          return '';
        },
      },
      legend: {
        data: data.map(series => series.label),
        top: 30,
        textStyle: {
          color: 'var(--foreground)',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: 'var(--border)',
          },
        },
        axisLabel: {
          color: 'var(--muted-foreground)',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: 'var(--border)',
          },
        },
        axisLabel: {
          color: 'var(--muted-foreground)',
          formatter: '{value} BTC',
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border)',
            opacity: 0.3,
          },
        },
      },
      series: data.map((series, index) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `hsl(${200 + index * 30}, 70%, 60%)` },
            { offset: 1, color: `hsl(${200 + index * 30}, 70%, 20%)` },
          ]),
        },
        lineStyle: {
          color: `hsl(${200 + index * 30}, 70%, 50%)`,
          width: 2,
        },
        data: series.data.map(item => [item.timestamp, item.value]),
      })),
    };

    chartInstance.current.setOption(option);
  }, [data]);

  return (
    <div 
      ref={chartRef} 
      style={{ height }} 
      className={className}
    />
  );
}
