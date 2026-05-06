import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Stream Performance Radar Chart
 * Compares performance across multiple streams using radar visualization
 */
export const StreamRadarChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  metrics = ['Revenue', 'Collection Rate', 'Student Count', 'Growth Rate', 'Efficiency'],
  showComparison = true
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

    // Process stream/class data
    const streamNames = data.map(stream => stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`);
    
    // Calculate maximum values for normalization
    const maxValues = {};
    metrics.forEach(metric => {
      maxValues[metric] = Math.max(...data.map(stream => 
        getMetricValue(stream, metric) || 0
      ), 1); // Ensure minimum of 1 to avoid division by zero
    });

    // Prepare series data
    const series = data.map((stream, index) => ({
      name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
      type: 'radar',
      data: [{
        value: metrics.map(metric => 
          normalizeValue(getMetricValue(stream, metric), maxValues[metric])
        ),
        name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
        itemStyle: {
          color: getStreamColor(index)
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: getStreamColor(index) + '40' },
              { offset: 1, color: getStreamColor(index) + '10' }
            ]
          }
        }
      }]
    }));

    // Prepare radar indicators
    const radarIndicators = metrics.map(metric => ({
      name: getMetricLabel(metric),
      max: 100, // Normalized to 100
      min: 0,
      axisLabel: {
        fontSize: 11,
        color: '#666'
      }
    }));

    return {
      title: {
        text: 'Performance Comparison',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const streamIndex = params.seriesIndex;
          const stream = data[streamIndex];
          const metricIndex = params.dataIndex;
          const metric = metrics[metricIndex];
          const actualValue = getMetricValue(stream, metric);
          const normalizedValue = params.value;
          
          // Validate normalizedValue before calling toFixed
          const normalizedPercentage = (typeof normalizedValue === 'number' && !isNaN(normalizedValue)) 
            ? normalizedValue.toFixed(1) 
            : '0.0';
          
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name} - ${getMetricLabel(metric)}</div>
            <div>Actual Value: ${formatMetricValue(metric, actualValue)}</div>
            <div>Normalized: ${normalizedPercentage}%</div>
            <div>Rank: ${getMetricRank(metric, actualValue, data)} of ${data.length}</div>
          `;
        }
      },
      legend: { 
        bottom: 10,
        data: streamNames,
        type: 'scroll'
      },
      radar: {
        indicator: radarIndicators,
        shape: 'polygon',
        splitNumber: 5,
        axisName: { 
          color: '#333',
          fontSize: 12
        },
        splitLine: { 
          lineStyle: { 
            color: '#ddd',
            type: 'dashed'
          } 
        },
        splitArea: { 
          show: true,
          areaStyle: {
            color: ['#f8f9fa', '#fff']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      series,
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          restore: { title: 'Reset' }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getMetricValue = (stream, metric) => {
    const valueMap = {
      'Revenue': stream.totalRevenue || stream.revenue || 0,
      'Collection Rate': stream.collectionRate || 0,
      'Student Count': stream.studentCount || stream.students || 0,
      'Growth Rate': stream.growthRate || 0,
      'Efficiency': stream.efficiency || 0,
      'Average Payment': stream.averagePayment || 0,
      'Outstanding Balance': stream.outstandingBalance || 0,
      'Payment Velocity': stream.paymentVelocity || 0
    };
    return parseFloat(valueMap[metric] || 0);
  };

  const getMetricLabel = (metric) => {
    const labelMap = {
      'Revenue': 'Revenue (KES)',
      'Collection Rate': 'Collection Rate (%)',
      'Student Count': 'Students',
      'Growth Rate': 'Growth Rate (%)',
      'Efficiency': 'Efficiency (%)',
      'Average Payment': 'Avg Payment (KES)',
      'Outstanding Balance': 'Outstanding (KES)',
      'Payment Velocity': 'Payment Velocity'
    };
    return labelMap[metric] || metric;
  };

  const formatMetricValue = (metric, value) => {
    if (metric.includes('Rate') || metric === 'Efficiency' || metric === 'Growth Rate') {
      return `${value.toFixed(1)}%`;
    } else if (metric.includes('Revenue') || metric.includes('Payment') || metric.includes('Balance')) {
      return `KES ${value.toLocaleString()}`;
    } else {
      return value.toLocaleString();
    }
  };

  const normalizeValue = (value, maxValue) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const getMetricRank = (metric, value, data) => {
    const values = data.map(stream => getMetricValue(stream, metric)).sort((a, b) => b - a);
    return values.indexOf(value) + 1;
  };

  const getStreamColor = (index) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="stream-radar-chart"
    />
  );
};

/**
 * Advanced Stream Comparison Chart
 * Multiple visualization types for stream analysis
 */
export const StreamComparisonChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  comparisonType = 'radar', // 'radar', 'parallel', 'scatter'
  metrics = ['Revenue', 'Collection Rate', 'Student Count', 'Growth Rate']
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

    switch (comparisonType) {
      case 'parallel':
        return getParallelChartOption();
      case 'scatter':
        return getScatterChartOption();
      default:
        return getRadarChartOption();
    }
  };

  const getRadarChartOption = () => {
    // Similar to StreamRadarChart but with enhanced features
    const streamNames = data.map(stream => stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`);
    
    const maxValues = {};
    metrics.forEach(metric => {
      maxValues[metric] = Math.max(...data.map(stream => 
        getMetricValue(stream, metric) || 0
      ), 1);
    });

    const series = data.map((stream, index) => ({
      name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
      type: 'radar',
      data: [{
        value: metrics.map(metric => 
          normalizeValue(getMetricValue(stream, metric), maxValues[metric])
        ),
        name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
        itemStyle: { color: getStreamColor(index) }
      }]
    }));

    return {
      title: {
        text: 'Advanced Performance Analysis',
        left: 'center'
      },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10, data: streamNames },
      radar: {
        indicator: metrics.map(metric => ({
          name: getMetricLabel(metric),
          max: 100
        }))
      },
      series
    };
  };

  const getParallelChartOption = () => {
    const parallelAxis = metrics.map((metric, index) => ({
      dim: index,
      name: getMetricLabel(metric),
      type: 'value',
      min: 0,
      max: Math.max(...data.map(stream => getMetricValue(stream, metric) || 0))
    }));

    const parallelData = data.map((stream, index) => ({
      name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
      value: metrics.map(metric => getMetricValue(stream, metric) || 0),
      lineStyle: {
        color: getStreamColor(index),
        width: 2
      }
    }));

    return {
      title: {
        text: 'Stream Performance Parallel Coordinates',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
            ${metrics.map((metric, i) => `
              <div>${getMetricLabel(metric)}: ${formatMetricValue(metric, params.value[i])}</div>
            `).join('')}
          `;
        }
      },
      legend: { bottom: 10, data: data.map(stream => stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`) },
      parallelAxis,
      parallel: {
        left: '5%',
        right: '8%',
        bottom: '10%',
        top: '15%',
        parallelAxisDefault: {
          type: 'value',
          nameLocation: 'end',
          nameGap: 20,
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            lineStyle: {
              color: '#ddd'
            }
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            color: '#999'
          }
        }
      },
      series: [{
        type: 'parallel',
        data: parallelData
      }]
    };
  };

  const getScatterChartOption = () => {
    if (metrics.length < 2) {
      return {
        title: {
          text: 'Scatter chart requires at least 2 metrics',
          left: 'center',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    const scatterData = data.map((stream, index) => ({
      name: stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`,
      value: [
        getMetricValue(stream, metrics[0]),
        getMetricValue(stream, metrics[1])
      ],
      itemStyle: {
        color: getStreamColor(index)
      },
      symbolSize: Math.max(10, Math.min(50, stream.studentCount || 20))
    }));

    return {
      title: {
        text: `${getMetricLabel(metrics[0])} vs ${getMetricLabel(metrics[1])}`,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
            <div>${getMetricLabel(metrics[0])}: ${formatMetricValue(metrics[0], params.value[0])}</div>
            <div>${getMetricLabel(metrics[1])}: ${formatMetricValue(metrics[1], params.value[1])}</div>
            <div>Student Count: ${data.find(s => (s.streamName || s.className || `Stream ${s.streamId || s.classId}`) === params.name)?.studentCount || 'N/A'}</div>
          `;
        }
      },
      legend: { bottom: 10, data: data.map(stream => stream.streamName || stream.className || `Stream ${stream.streamId || stream.classId}`) },
      xAxis: {
        type: 'value',
        name: getMetricLabel(metrics[0]),
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { formatter: (value) => formatMetricValue(metrics[0], value) }
      },
      yAxis: {
        type: 'value',
        name: getMetricLabel(metrics[1]),
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: { formatter: (value) => formatMetricValue(metrics[1], value) }
      },
      series: [{
        type: 'scatter',
        data: scatterData,
        emphasis: {
          focus: 'series',
          label: {
            show: true,
            position: 'top',
            formatter: '{b}'
          }
        }
      }]
    };
  };

  // Helper functions (reuse from StreamRadarChart)
  const getMetricValue = (stream, metric) => {
    const valueMap = {
      'Revenue': stream.totalRevenue || stream.revenue || 0,
      'Collection Rate': stream.collectionRate || 0,
      'Student Count': stream.studentCount || stream.students || 0,
      'Growth Rate': stream.growthRate || 0,
      'Efficiency': stream.efficiency || 0,
      'Average Payment': stream.averagePayment || 0,
      'Outstanding Balance': stream.outstandingBalance || 0,
      'Payment Velocity': stream.paymentVelocity || 0
    };
    return parseFloat(valueMap[metric] || 0);
  };

  const getMetricLabel = (metric) => {
    const labelMap = {
      'Revenue': 'Revenue (KES)',
      'Collection Rate': 'Collection Rate (%)',
      'Student Count': 'Students',
      'Growth Rate': 'Growth Rate (%)',
      'Efficiency': 'Efficiency (%)',
      'Average Payment': 'Avg Payment (KES)',
      'Outstanding Balance': 'Outstanding (KES)',
      'Payment Velocity': 'Payment Velocity'
    };
    return labelMap[metric] || metric;
  };

  const formatMetricValue = (metric, value) => {
    if (metric.includes('Rate') || metric === 'Efficiency' || metric === 'Growth Rate') {
      return `${value.toFixed(1)}%`;
    } else if (metric.includes('Revenue') || metric.includes('Payment') || metric.includes('Balance')) {
      return `KES ${value.toLocaleString()}`;
    } else {
      return value.toLocaleString();
    }
  };

  const normalizeValue = (value, maxValue) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const getStreamColor = (index) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="stream-comparison-chart"
    />
  );
};

export default { StreamRadarChart, StreamComparisonChart };
