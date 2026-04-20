import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Cash Flow Sankey Diagram
 * Shows cash flow analysis from sources to destinations
 */
export const CashFlowChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  showLabels = true,
  nodeWidth = 20,
  nodeGap = 8
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Cash Flow Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process cash flow data
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Build nodes and links from data
    data.forEach(flow => {
      const source = flow.source || flow.from;
      const target = flow.target || flow.to;
      const value = parseFloat(flow.amount || flow.value || 0);

      if (value <= 0) return;

      // Add source node if not exists
      if (!nodeMap.has(source)) {
        nodeMap.set(source, nodes.length);
        nodes.push({
          name: source,
          itemStyle: { color: getNodeColor(source, 'source') }
        });
      }

      // Add target node if not exists
      if (!nodeMap.has(target)) {
        nodeMap.set(target, nodes.length);
        nodes.push({
          name: target,
          itemStyle: { color: getNodeColor(target, 'target') }
        });
      }

      // Add link
      links.push({
        source: nodeMap.get(source),
        target: nodeMap.get(target),
        value: value,
        lineStyle: {
          color: getLinkColor(source, target),
          opacity: 0.6
        }
      });
    });

    return {
      title: {
        text: 'Cash Flow Analysis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          if (params.dataType === 'node') {
            const node = nodes[params.dataIndex];
            const totalIn = links
              .filter(link => link.target === params.dataIndex)
              .reduce((sum, link) => sum + link.value, 0);
            const totalOut = links
              .filter(link => link.source === params.dataIndex)
              .reduce((sum, link) => sum + link.value, 0);
            
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${node.name}</div>
              <div>Inflow: KES ${totalIn.toLocaleString()}</div>
              <div>Outflow: KES ${totalOut.toLocaleString()}</div>
              <div>Net: KES ${(totalIn - totalOut).toLocaleString()}</div>
            `;
          } else if (params.dataType === 'edge') {
            const link = links[params.dataIndex];
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">Cash Flow</div>
              <div>From: ${nodes[link.source].name}</div>
              <div>To: ${nodes[link.target].name}</div>
              <div>Amount: KES ${link.value.toLocaleString()}</div>
            `;
          }
        }
      },
      series: [{
        type: 'sankey',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            opacity: 0.9
          }
        },
        draggable: true,
        nodeWidth: nodeWidth,
        nodeGap: nodeGap,
        layoutIterations: 32,
        label: {
          show: showLabels,
          fontSize: 11,
          color: '#333'
        },
        left: '10%',
        right: '20%',
        nodeAlign: 'justify',
        orient: 'horizontal'
      }],
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

  const getNodeColor = (nodeName, type) => {
    const colorMap = {
      'source': {
        'Parents': '#3699ff',
        'M-Pesa': '#10b981',
        'Bank': '#f6c23e',
        'Cash': '#e74c3c',
        'Cheque': '#8b5cf6',
        'Mobile Money': '#f97316'
      },
      'target': {
        'School Account': '#06b6d4',
        'Operations': '#84cc16',
        'Development': '#a855f7',
        'Salaries': '#f59e0b',
        'Maintenance': '#ef4444',
        'Supplies': '#3b82f6'
      }
    };
    return colorMap[type]?.[nodeName] || (type === 'source' ? '#3699ff' : '#06b6d4');
  };

  const getLinkColor = (source, target) => {
    // Create gradient colors based on source and target
    const sourceColor = getNodeColor(source, 'source');
    const targetColor = getNodeColor(target, 'target');
    return sourceColor; // Use source color for consistency
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="cash-flow-chart"
    />
  );
};

/**
 * Cash Flow Timeline Chart
 * Shows cash flow over time with inflows and outflows
 */
export const CashFlowTimelineChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  timeRange = 'monthly'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Cash Flow Timeline Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process timeline data
    const timePeriods = [...new Set(data.flatMap(item => 
      item.periods?.map(p => p.period) || []
    ))].sort();

    const inflowData = timePeriods.map(period => {
      let total = 0;
      data.forEach(item => {
        const periodData = item.periods?.find(p => p.period === period);
        if (periodData && periodData.inflows) {
          total += periodData.inflows.reduce((sum, flow) => sum + (flow.amount || 0), 0);
        }
      });
      return total;
    });

    const outflowData = timePeriods.map(period => {
      let total = 0;
      data.forEach(item => {
        const periodData = item.periods?.find(p => p.period === period);
        if (periodData && periodData.outflows) {
          total += periodData.outflows.reduce((sum, flow) => sum + (flow.amount || 0), 0);
        }
      });
      return total;
    });

    const netFlowData = inflowData.map((inflow, index) => inflow - outflowData[index]);

    return {
      title: {
        text: 'Cash Flow Timeline Analysis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
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
          return result;
        }
      },
      legend: { 
        bottom: 10,
        data: ['Inflows', 'Outflows', 'Net Flow']
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
      series: [
        {
          name: 'Inflows',
          type: 'bar',
          stack: 'flow',
          data: inflowData,
          itemStyle: {
            color: '#10b981'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(16, 185, 129, 0.3)'
            }
          }
        },
        {
          name: 'Outflows',
          type: 'bar',
          stack: 'flow',
          data: outflowData.map(value => -value), // Negative for stacked bar
          itemStyle: {
            color: '#e74c3c'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(231, 76, 60, 0.3)'
            }
          }
        },
        {
          name: 'Net Flow',
          type: 'line',
          data: netFlowData,
          smooth: true,
          itemStyle: {
            color: '#3699ff'
          },
          lineStyle: {
            width: 3,
            type: 'dashed'
          },
          emphasis: {
            focus: 'series'
          },
          markPoint: {
            data: [
              { type: 'max', name: 'Highest Net' },
              { type: 'min', name: 'Lowest Net' }
            ]
          }
        }
      ],
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
          magicType: { type: ['bar', 'line'], title: { bar: 'Bar', line: 'Line' } }
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
      className="cash-flow-timeline-chart"
    />
  );
};

/**
 * Cash Flow Summary Chart
 * Combined view of cash flow metrics
 */
export const CashFlowSummaryChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  metrics = ['totalInflow', 'totalOutflow', 'netFlow', 'averageFlow']
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Cash Flow Summary Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Calculate summary metrics
    const totalInflow = data.reduce((sum, item) => sum + (item.totalInflow || 0), 0);
    const totalOutflow = data.reduce((sum, item) => sum + (item.totalOutflow || 0), 0);
    const netFlow = totalInflow - totalOutflow;
    const averageFlow = data.length > 0 ? netFlow / data.length : 0;

    const summaryData = [
      { name: 'Total Inflow', value: totalInflow, color: '#10b981' },
      { name: 'Total Outflow', value: totalOutflow, color: '#e74c3c' },
      { name: 'Net Flow', value: netFlow, color: netFlow >= 0 ? '#3699ff' : '#f59e0b' },
      { name: 'Average Flow', value: Math.abs(averageFlow), color: '#8b5cf6' }
    ];

    return {
      title: {
        text: 'Cash Flow Summary',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const item = summaryData[params.dataIndex];
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${item.name}</div>
            <div>Amount: KES ${item.value.toLocaleString()}</div>
            ${item.name === 'Net Flow' ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div style="color: ${item.value >= 0 ? '#10b981' : '#e74c3c'}; font-weight: bold;">
                  ${item.value >= 0 ? 'Positive' : 'Negative'} Cash Flow
                </div>
              </div>
            ` : ''}
          `;
        }
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
        data: summaryData.map(item => item.name),
        axisLabel: { 
          fontSize: 11,
          interval: 0
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
      series: [{
        type: 'bar',
        data: summaryData.map(item => ({
          value: item.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: item.color },
                { offset: 1, color: item.color + '80' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: function(params) {
              return `KES${(params.value / 1000).toFixed(1)}k`;
            },
            fontSize: 10,
            color: '#666'
          }
        }))
      }],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { type: ['bar', 'line'], title: { bar: 'Bar', line: 'Line' } }
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
      className="cash-flow-summary-chart"
    />
  );
};

export default { CashFlowChart, CashFlowTimelineChart, CashFlowSummaryChart };
