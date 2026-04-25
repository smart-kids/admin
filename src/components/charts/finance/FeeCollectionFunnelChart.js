import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Fee Collection Funnel Chart
 * Shows the drop-off rates in fee collection process
 */
export const FeeCollectionFunnelChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  showComparison = false
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Collection Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for funnel
    const funnelData = [
      { name: 'Total Billed', value: data.totalBilled || 0 },
      { name: 'Partial Payments', value: data.partialPayments || 0 },
      { name: 'Full Payments', value: data.fullPayments || 0 },
      { name: 'Overdue', value: data.overdue || 0 },
      { name: 'Written Off', value: data.writtenOff || 0 }
    ].filter(item => item.value > 0);

    return {
      title: {
        text: 'Fee Collection Funnel Analysis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const percentage = data.totalBilled > 0 ? 
            ((params.value / data.totalBilled) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
            <div>Amount: KES ${params.value.toLocaleString()}</div>
            <div>Percentage: ${percentage}%</div>
            <div>Conversion: ${getConversionRate(params.name, data)}%</div>
          `;
        }
      },
      legend: {
        bottom: 10,
        data: funnelData.map(item => item.name)
      },
      series: [
        {
          name: 'Fee Collection',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              const percentage = data.totalBilled > 0 ? 
                ((params.value / data.totalBilled) * 100).toFixed(1) : 0;
              return `${params.name}\n${percentage}%`;
            },
            fontSize: 12,
            color: '#fff'
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
            color: function(params) {
              const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6'];
              return colors[params.dataIndex % colors.length];
            }
          },
          emphasis: {
            label: {
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          data: funnelData
        }
      ],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { 
            type: ['funnel', 'pyramid'], 
            title: { funnel: 'Funnel', pyramid: 'Pyramid' } 
          }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getConversionRate = (stage, data) => {
    const stages = ['Total Billed', 'Partial Payments', 'Full Payments', 'Overdue', 'Written Off'];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex <= 0) return 100;
    
    const previousStage = stages[currentIndex - 1];
    const previousValue = data[previousStage.toLowerCase().replace(' ', '')] || 0;
    const currentValue = data[stage.toLowerCase().replace(' ', '')] || 0;
    
    return previousValue > 0 ? ((currentValue / previousValue) * 100).toFixed(1) : 0;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="fee-collection-funnel-chart"
    />
  );
};

export default FeeCollectionFunnelChart;
