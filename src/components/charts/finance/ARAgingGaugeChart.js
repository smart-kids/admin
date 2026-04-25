import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Accounts Receivable Aging Gauge Chart
 * Shows the aging of outstanding fees with gauge visualization
 */
export const ARAgingGaugeChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  agingBuckets = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days']
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Aging Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process aging data
    const agingData = processAgingData(data, agingBuckets);
    const totalAR = agingData.reduce((sum, item) => sum + item.value, 0);

    return {
      title: {
        text: 'Accounts Receivable Aging Analysis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function(params) {
          const percentage = totalAR > 0 ? ((params.value / totalAR) * 100).toFixed(1) : 0;
          const riskLevel = getRiskLevel(params.name);
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
            <div>Amount: KES ${params.value.toLocaleString()}</div>
            <div>Percentage: ${percentage}%</div>
            <div>Risk Level: ${riskLevel}</div>
            <div>Accounts: ${params.data?.accounts || 0}</div>
          `;
        }
      },
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: totalAR,
          splitNumber: 5,
          radius: '80%',
          center: ['50%', '60%'],
          axisLine: {
            lineStyle: {
              width: 30,
              color: agingData.map((item, index) => [
                item.value / totalAR,
                getAgingColor(item.name)
              ])
            }
          },
          pointer: {
            icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
            length: '75%',
            width: 16,
            offsetCenter: [0, '5%']
          },
          axisTick: {
            distance: -45,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          splitLine: {
            distance: -52,
            length: 14,
            lineStyle: {
              width: 3,
              color: '#999'
            }
          },
          axisLabel: {
            distance: -20,
            color: '#999',
            fontSize: 12
          },
          anchor: {
            show: false
          },
          title: {
            show: true,
            offsetCenter: [0, '-30%'],
            fontSize: 16,
            color: '#333',
            fontWeight: 'bold'
          },
          detail: {
            valueAnimation: true,
            width: '60%',
            lineHeight: 40,
            height: 40,
            borderRadius: 8,
            offsetCenter: [0, '-15%'],
            fontSize: 24,
            fontWeight: 'bold',
            formatter: function(value) {
              return `KES ${value.toLocaleString()}`;
            },
            color: 'inherit'
          },
          data: [{
            value: totalAR,
            name: 'Total Outstanding'
          }]
        }
      ],
      graphic: [
        // Add aging bucket labels
        ...agingData.map((item, index) => ({
          type: 'text',
          left: `${20 + (index * 15)}%`,
          top: '85%',
          style: {
            text: `${item.name}\nKES ${(item.value / 1000).toFixed(0)}k`,
            fontSize: 10,
            fill: getAgingColor(item.name),
            fontWeight: 'bold',
            align: 'center'
          }
        }))
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

  const processAgingData = (data, buckets) => {
    const agingMap = {};
    
    // Initialize buckets
    buckets.forEach(bucket => {
      agingMap[bucket] = { value: 0, accounts: 0 };
    });

    // Process data
    data.forEach(item => {
      const daysOverdue = calculateDaysOverdue(item.dueDate, item.paidDate);
      const bucket = getAgingBucket(daysOverdue, buckets);
      
      if (agingMap[bucket]) {
        agingMap[bucket].value += parseFloat(item.amount || 0);
        agingMap[bucket].accounts++;
      }
    });

    return buckets.map(bucket => ({
      name: bucket,
      value: agingMap[bucket].value,
      accounts: agingMap[bucket].accounts
    }));
  };

  const calculateDaysOverdue = (dueDate, paidDate) => {
    const due = new Date(dueDate);
    const paid = paidDate ? new Date(paidDate) : new Date();
    return Math.max(0, Math.floor((paid - due) / (1000 * 60 * 60 * 24)));
  };

  const getAgingBucket = (days, buckets) => {
    if (days <= 0) return buckets[0]; // Current
    if (days <= 30) return buckets[1]; // 1-30 Days
    if (days <= 60) return buckets[2]; // 31-60 Days
    if (days <= 90) return buckets[3]; // 61-90 Days
    return buckets[4]; // 90+ Days
  };

  const getAgingColor = (bucket) => {
    const colorMap = {
      'Current': '#10b981',
      '1-30 Days': '#3699ff',
      '31-60 Days': '#f6c23e',
      '61-90 Days': '#f97316',
      '90+ Days': '#e74c3c'
    };
    return colorMap[bucket] || '#6b7280';
  };

  const getRiskLevel = (bucket) => {
    const riskMap = {
      'Current': 'Low',
      '1-30 Days': 'Low',
      '31-60 Days': 'Medium',
      '61-90 Days': 'High',
      '90+ Days': 'Critical'
    };
    return riskMap[bucket] || 'Unknown';
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="ar-aging-gauge-chart"
    />
  );
};

export default ARAgingGaugeChart;
