import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Fee Structure Comparison Heatmap
 * Shows fee structure comparison across classes and fee types
 */
export const FeeHeatmapChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  showValues = true,
  colorScheme = 'blue'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Fee Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for heatmap
    const classNames = [...new Set(data.map(item => item.className || `Class ${item.classId}`))];
    const feeTypes = [...new Set(data.flatMap(item => 
      Object.keys(item.feeStructure || {})
    ))];

    // Create heatmap data matrix
    const heatmapData = [];
    classNames.forEach((className, classIndex) => {
      feeTypes.forEach((feeType, typeIndex) => {
        const classData = data.find(item => 
          (item.className || `Class ${item.classId}`) === className
        );
        const amount = classData?.feeStructure?.[feeType] || 0;
        heatmapData.push([typeIndex, classIndex, amount]);
      });
    });

    const maxValue = Math.max(...heatmapData.map(d => d[2]));
    const colorRange = getColorRange(colorScheme);

    return {
      title: {
        text: 'Fee Structure Comparison',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        position: 'top',
        formatter: function(params) {
          const [typeIndex, classIndex, amount] = params.value;
          const className = classNames[classIndex];
          const feeType = feeTypes[typeIndex];
          const percentage = maxValue > 0 ? (amount / maxValue * 100).toFixed(1) : 0;
          
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${className} - ${feeType}</div>
            <div>Amount: KES ${amount.toLocaleString()}</div>
            <div>Relative: ${percentage}% of max</div>
            <div>Rank: ${getFeeRank(feeType, amount, data)} of ${classNames.length}</div>
          `;
        }
      },
      grid: { 
        height: '70%', 
        top: '15%',
        left: classNames.length > 5 ? '15%' : '10%',
        right: '5%'
      },
      xAxis: { 
        type: 'category', 
        data: feeTypes,
        axisLabel: { 
          fontSize: 11,
          interval: 0,
          rotate: feeTypes.length > 4 ? 45 : 0
        },
        position: 'top'
      },
      yAxis: { 
        type: 'category', 
        data: classNames,
        axisLabel: { 
          fontSize: 11
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: colorRange
        },
        text: ['High', 'Low'],
        textStyle: {
          fontSize: 11
        }
      },
      series: [{
        type: 'heatmap',
        data: heatmapData,
        label: { 
          show: showValues,
          formatter: function(params) {
            const amount = params.value[2];
            return amount > 0 ? `KES${amount/1000}k` : '';
          },
          fontSize: 10,
          color: '#fff',
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: { 
            shadowBlur: 10, 
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 2,
            borderColor: '#333'
          },
          label: {
            show: true,
            formatter: function(params) {
              const amount = params.value[2];
              return `KES ${amount.toLocaleString()}`;
            },
            fontSize: 12,
            color: '#000'
          }
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#fff'
        }
      }],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { 
            type: ['heatmap', 'treemap'], 
            title: { heatmap: 'Heatmap', treemap: 'Treemap' } 
          }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getColorRange = (scheme) => {
    const schemes = {
      blue: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
      green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
      warm: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
      purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed']
    };
    return schemes[scheme] || schemes.blue;
  };

  const getFeeRank = (feeType, amount, data) => {
    const amounts = data.map(item => item.feeStructure?.[feeType] || 0).sort((a, b) => b - a);
    return amounts.indexOf(amount) + 1;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="fee-heatmap-chart"
    />
  );
};

/**
 * Fee Analysis Treemap
 * Hierarchical view of fee distribution
 */
export const FeeTreemapChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  hierarchy = 'class' // 'class' or 'type'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Fee Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    let treemapData;

    if (hierarchy === 'class') {
      // Class-based hierarchy
      treemapData = data.map(classData => {
        const className = classData.className || `Class ${classData.classId}`;
        const children = Object.entries(classData.feeStructure || {}).map(([feeType, amount]) => ({
          name: feeType,
          value: amount,
          itemStyle: { color: getFeeTypeColor(feeType) }
        }));

        return {
          name: className,
          value: Object.values(classData.feeStructure || {}).reduce((sum, amount) => sum + amount, 0),
          children: children.filter(child => child.value > 0),
          itemStyle: { color: getClassColor(classData.classId) }
        };
      });
    } else {
      // Fee type-based hierarchy
      const feeTypes = {};
      data.forEach(classData => {
        const className = classData.className || `Class ${classData.classId}`;
        Object.entries(classData.feeStructure || {}).forEach(([feeType, amount]) => {
          if (!feeTypes[feeType]) {
            feeTypes[feeType] = { name: feeType, children: [], value: 0 };
          }
          feeTypes[feeType].children.push({
            name: className,
            value: amount,
            itemStyle: { color: getClassColor(classData.classId) }
          });
          feeTypes[feeType].value += amount;
        });
      });
      treemapData = Object.values(feeTypes);
    }

    return {
      title: {
        text: `Fee Distribution by ${hierarchy === 'class' ? 'Class' : 'Fee Type'}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function(params) {
          if (params.children) {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>Total: KES ${params.value.toLocaleString()}</div>
              <div>Components: ${params.children?.length || 0}</div>
            `;
          } else {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>Amount: KES ${params.value.toLocaleString()}</div>
              <div>Percentage: ${getPercentage(params.value, data)}%</div>
            `;
          }
        }
      },
      series: [{
        type: 'treemap',
        data: treemapData,
        roam: true,
        nodeClick: 'zoomToNode',
        zoomToNodeRatio: 0.99,
        level: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5
            },
            upperLabel: {
              show: true,
              height: 30,
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold'
            }
          },
          {
            itemStyle: {
              borderWidth: 1,
              gapWidth: 2,
              borderColor: '#fff'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              show: true,
              fontSize: 11,
              color: '#fff',
              fontWeight: 'bold'
            },
            upperLabel: {
              show: true,
              height: 20,
              color: '#fff',
              fontSize: 10
            }
          }
        ]
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

  const getFeeTypeColor = (feeType) => {
    const colorMap = {
      'Tuition': '#3699ff',
      'Transport': '#10b981',
      'Meals': '#f6c23e',
      'Activities': '#e74c3c',
      'Uniform': '#8b5cf6',
      'Books': '#f97316',
      'Development': '#06b6d4',
      'Maintenance': '#84cc16'
    };
    return colorMap[feeType] || '#6b7280';
  };

  const getClassColor = (classId) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316'];
    return colors[parseInt(classId || 0) % colors.length];
  };

  const getPercentage = (value, data) => {
    const total = data.reduce((sum, classData) => 
      sum + Object.values(classData.feeStructure || {}).reduce((subSum, amount) => subSum + amount, 0), 0
    );
    return total > 0 ? (value / total * 100).toFixed(1) : 0;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="fee-treemap-chart"
    />
  );
};

export default { FeeHeatmapChart, FeeTreemapChart };
