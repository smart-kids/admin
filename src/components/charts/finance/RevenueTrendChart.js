import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Revenue Trend Analysis Chart
 * Shows revenue trends across classes over time
 */
export const RevenueTrendChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  onChartClick,
  timeRange = 'monthly',
  showComparison = false
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for ECharts
    const timePeriods = [...new Set(data.flatMap(item => item.periods || []))].sort();
    const series = data.map((classData, index) => ({
      name: classData.className || `Class ${index + 1}`,
      type: 'line',
      stack: showComparison ? null : 'revenue',
      areaStyle: showComparison ? null : { opacity: 0.3 },
      smooth: true,
      emphasis: { focus: 'series' },
      data: timePeriods.map(period => {
        const periodData = classData.periods?.find(p => p.period === period);
        return periodData ? parseFloat(periodData.revenue || 0) : 0;
      }),
      itemStyle: {
        color: classData.color || getDefaultColor(index)
      }
    }));

    return {
      title: {
        text: 'Revenue Trends Across Classes',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: { color: '#333' },
        formatter: function(params) {
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          params.forEach(param => {
            result += `
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                <span>${param.seriesName}:</span>
                <span style="font-weight: bold; margin-left: 10px;">KES ${param.value.toLocaleString()}</span>
              </div>
            `;
          });
          
          // Add total
          const total = params.reduce((sum, param) => sum + param.value, 0);
          result += `
            <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; font-weight: bold;">
              Total: KES ${total.toLocaleString()}
            </div>
          `;
          
          return result;
        }
      },
      legend: { 
        bottom: 10,
        data: series.map(s => s.name),
        type: 'scroll'
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '15%', 
        top: '15%',
        containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        data: timePeriods,
        axisLabel: { 
          rotate: timePeriods.length > 6 ? 45 : 0,
          fontSize: 11
        }
      },
      yAxis: { 
        type: 'value',
        axisLabel: { 
          formatter: 'KES {value}',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series,
      dataZoom: timePeriods.length > 12 ? [
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: 0
        }
      ] : [],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { type: ['line', 'bar'], title: { line: 'Line', bar: 'Bar' } }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getDefaultColor = (index) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316'];
    return colors[index % colors.length];
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      onChartClick={onChartClick}
      className="revenue-trend-chart"
    />
  );
};

/**
 * Revenue Comparison Chart
 * Side-by-side comparison of revenue across classes
 */
export const RevenueComparisonChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  timeRange = 'current'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    const classNames = data.map(item => item.className || `Class ${item.classId}`);
    const revenues = data.map(item => parseFloat(item.totalRevenue || 0));
    const targets = data.map(item => parseFloat(item.targetRevenue || 0));

    return {
      title: {
        text: 'Revenue Comparison by Class',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const classData = data[params[0].dataIndex];
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>
            <div>
              <span style="display: inline-block; width: 10px; height: 10px; background: ${params[0].color}; border-radius: 50%; margin-right: 8px;"></span>
              Actual Revenue: KES ${params[0].value.toLocaleString()}
            </div>
            ${classData?.targetRevenue ? `
              <div>
                <span style="display: inline-block; width: 10px; height: 10px; background: ${params[1]?.color}; border-radius: 50%; margin-right: 8px;"></span>
                Target Revenue: KES ${classData.targetRevenue.toLocaleString()}
              </div>
              <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; font-weight: bold;">
                Achievement: ${((params[0].value / classData.targetRevenue) * 100).toFixed(1)}%
              </div>
            ` : ''}
          `;
        }
      },
      legend: { 
        bottom: 10,
        data: ['Actual Revenue', 'Target Revenue'].filter((_, i) => i === 0 || data.some(d => d.targetRevenue))
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '15%', 
        top: '15%',
        containLabel: true 
      },
      xAxis: { 
        type: 'category',
        data: classNames,
        axisLabel: { 
          fontSize: 11,
          interval: 0,
          rotate: classNames.length > 6 ? 45 : 0
        }
      },
      yAxis: { 
        type: 'value',
        axisLabel: { 
          formatter: 'KES {value}',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: 'Actual Revenue',
          type: 'bar',
          data: revenues,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#3699ff' },
                { offset: 1, color: '#3699ff80' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(54, 153, 255, 0.3)'
            }
          }
        },
        ...(data.some(d => d.targetRevenue) ? [{
          name: 'Target Revenue',
          type: 'line',
          data: targets,
          itemStyle: { color: '#e74c3c' },
          lineStyle: { 
            type: 'dashed',
            width: 2
          },
          symbol: 'circle',
          symbolSize: 6
        }] : [])
      ],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true }
        },
        right: 10,
        top: 10
      }
    };
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="revenue-comparison-chart"
    />
  );
};

export default { RevenueTrendChart, RevenueComparisonChart };
