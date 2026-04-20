import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Payment Method Distribution Chart
 * Shows payment methods by class with pie and bar visualizations
 */
export const PaymentMethodChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  chartType = 'pie', // 'pie' or 'bar'
  showComparison = false
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Payment Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Aggregate payment methods across all classes or by class
    const paymentMethods = {};
    let totalAmount = 0;

    if (showComparison && data.length > 0) {
      // Multi-class comparison
      data.forEach(classData => {
        const className = classData.className || `Class ${classData.classId}`;
        if (!paymentMethods[className]) {
          paymentMethods[className] = {};
        }
        
        (classData.paymentMethods || []).forEach(method => {
          paymentMethods[className][method.method] = (paymentMethods[className][method.method] || 0) + method.amount;
          totalAmount += method.amount;
        });
      });
    } else {
      // Single aggregated view
      data.forEach(classData => {
        (classData.paymentMethods || []).forEach(method => {
          paymentMethods[method.method] = (paymentMethods[method.method] || 0) + method.amount;
          totalAmount += method.amount;
        });
      });
    }

    if (chartType === 'pie') {
      return getPieChartOption(paymentMethods, totalAmount);
    } else {
      return getBarChartOption(paymentMethods, totalAmount);
    }
  };

  const getPieChartOption = (paymentMethods, totalAmount) => {
    const pieData = Object.entries(paymentMethods).map(([method, amount]) => ({
      name: method,
      value: amount,
      itemStyle: {
        color: getMethodColor(method)
      }
    }));

    return {
      title: {
        text: 'Payment Methods Distribution',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        trigger: 'item',
        formatter: function(params) {
          const percentage = totalAmount > 0 ? (params.value / totalAmount * 100).toFixed(1) : 0;
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
            <div>Amount: KES ${params.value.toLocaleString()}</div>
            <div>Percentage: ${percentage}%</div>
            <div>Transactions: ${getTransactionCount(params.name)}</div>
          `;
        }
      },
      legend: { 
        orient: 'vertical', 
        left: 'left',
        top: 'middle',
        formatter: function(name) {
          const method = paymentMethods[name];
          const percentage = totalAmount > 0 ? (method / totalAmount * 100).toFixed(1) : 0;
          return `${name} (${percentage}%)`;
        }
      },
      series: [
        {
          name: 'Payment Methods',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { 
            show: false 
          },
          emphasis: {
            label: { 
              show: true, 
              fontSize: '16', 
              fontWeight: 'bold',
              formatter: '{b}: {d}%'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: pieData
        }
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

  const getBarChartOption = (paymentMethods, totalAmount) => {
    const methods = Object.keys(paymentMethods);
    const amounts = methods.map(method => paymentMethods[method]);
    const percentages = amounts.map(amount => totalAmount > 0 ? (amount / totalAmount * 100) : 0);

    return {
      title: {
        text: 'Payment Methods Analysis',
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
          const param = params[0];
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${param.axisValue}</div>
            <div>Amount: KES ${param.value.toLocaleString()}</div>
            <div>Percentage: ${percentages[param.dataIndex]}%</div>
            <div>Transactions: ${getTransactionCount(param.axisValue)}</div>
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
        data: methods,
        axisLabel: { 
          fontSize: 11,
          interval: 0,
          rotate: methods.length > 4 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Amount (KES)',
          position: 'left',
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
        {
          type: 'value',
          name: 'Percentage (%)',
          position: 'right',
          axisLabel: { 
            formatter: '{value}%',
            fontSize: 11
          },
          max: 100
        }
      ],
      series: [
        {
          name: 'Amount',
          type: 'bar',
          data: amounts.map((amount, index) => ({
            value: amount,
            itemStyle: {
              color: getMethodColor(methods[index])
            }
          })),
          itemStyle: {
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
              return `${percentages[params.dataIndex]}%`;
            },
            fontSize: 10,
            color: '#666'
          }
        }
      ],
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

  const getMethodColor = (method) => {
    const colorMap = {
      'M-Pesa': '#3699ff',
      'Bank Transfer': '#10b981',
      'Cash': '#f6c23e',
      'Cheque': '#e74c3c',
      'Mobile Money': '#8b5cf6',
      'Credit Card': '#f97316',
      'unknown': '#6b7280'
    };
    return colorMap[method] || '#6b7280';
  };

  const getTransactionCount = (method) => {
    // This would typically come from the data
    return Math.floor(Math.random() * 100) + 10;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="payment-method-chart"
    />
  );
};

/**
 * Payment Method Trend Chart
 * Shows payment method usage over time
 */
export const PaymentMethodTrendChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  timeRange = 'monthly'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Payment Trend Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Extract all time periods and payment methods
    const timePeriods = [...new Set(data.flatMap(item => item.periods?.map(p => p.period) || []))].sort();
    const allMethods = [...new Set(data.flatMap(item => 
      item.periods?.flatMap(p => Object.keys(p.methods || {})) || []
    ))];

    const series = allMethods.map(method => ({
      name: method,
      type: 'line',
      smooth: true,
      emphasis: { focus: 'series' },
      data: timePeriods.map(period => {
        let total = 0;
        data.forEach(classData => {
          const periodData = classData.periods?.find(p => p.period === period);
          if (periodData && periodData.methods && periodData.methods[method]) {
            total += periodData.methods[method].amount || 0;
          }
        });
        return total;
      }),
      itemStyle: {
        color: getMethodColor(method)
      }
    }));

    return {
      title: {
        text: 'Payment Method Trends Over Time',
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
            if (param.value > 0) {
              result += `
                <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                  <span>${param.seriesName}:</span>
                  <span style="font-weight: bold; margin-left: 10px;">KES ${param.value.toLocaleString()}</span>
                </div>
              `;
            }
          });
          
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
        data: allMethods,
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

  const getMethodColor = (method) => {
    const colorMap = {
      'M-Pesa': '#3699ff',
      'Bank Transfer': '#10b981',
      'Cash': '#f6c23e',
      'Cheque': '#e74c3c',
      'Mobile Money': '#8b5cf6',
      'Credit Card': '#f97316',
      'unknown': '#6b7280'
    };
    return colorMap[method] || '#6b7280';
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="payment-method-trend-chart"
    />
  );
};

export default { PaymentMethodChart, PaymentMethodTrendChart };
