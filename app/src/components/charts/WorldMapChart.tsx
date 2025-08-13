'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { GeoNode } from '@/libs/types';

interface WorldMapChartProps {
  data: GeoNode[];
  height?: string;
  className?: string;
}

export default function WorldMapChart({ data, height = '500px', className = '' }: WorldMapChartProps) {
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

    // 转换数据格式
    const mapData = data.map(item => ({
      name: item.country,
      value: item.nodeCount,
      capacity: item.totalCapacity,
    }));

    const option: echarts.EChartsOption = {
      title: {
        text: 'Lightning Network Nodes by Country',
        left: 'center',
        textStyle: {
          color: 'var(--foreground)',
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        textStyle: {
          color: 'var(--foreground)',
        },
        formatter: (params: any) => {
          if (params.data) {
            return `${params.name}<br/>Nodes: ${params.data.value}<br/>Capacity: ${params.data.capacity.toFixed(2)} BTC`;
          }
          return params.name;
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(item => item.nodeCount)),
        left: 'left',
        top: 'bottom',
        text: ['High', 'Low'],
        calculable: true,
        inRange: {
          color: ['#e0f2fe', '#0ea5e9', '#0369a1'],
        },
        textStyle: {
          color: 'var(--foreground)',
        },
      },
      series: [
        {
          name: 'Lightning Nodes',
          type: 'map',
          map: 'world',
          roam: true,
          emphasis: {
            label: {
              show: true,
            },
          },
          data: mapData,
          itemStyle: {
            borderColor: 'var(--border)',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              areaColor: '#0ea5e9',
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowBlur: 20,
              borderWidth: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
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
