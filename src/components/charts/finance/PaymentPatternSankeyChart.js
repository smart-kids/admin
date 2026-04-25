import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Payment Pattern Sankey Chart
 * Shows flow of payments between different categories and methods
 */
export const PaymentPatternSankeyChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  timeRange = 'monthly'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Payment Pattern Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for Sankey diagram
    const { nodes, links } = processSankeyData(data);

    return {
      title: {
        text: 'Payment Flow Patterns',
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
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>Total Flow: KES ${params.value.toLocaleString()}</div>
              <div>Connections: ${params.data.connections || 0}</div>
            `;
          } else if (params.dataType === 'edge') {
            const percentage = params.data.sourceValue > 0 ? 
              ((params.value / params.data.sourceValue) * 100).toFixed(1) : 0;
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.data.sourceName} → ${params.data.targetName}</div>
              <div>Amount: KES ${params.value.toLocaleString()}</div>
              <div>Percentage: ${percentage}%</div>
              <div>Method: ${params.data.method || 'Unknown'}</div>
            `;
          }
        }
      },
      series: [
        {
          type: 'sankey',
          data: nodes,
          links: links,
          top: '20%',
          right: '5%',
          bottom: '10%',
          left: '5%',
          nodeWidth: 20,
          nodeGap: 8,
          layoutIterations: 32,
          label: {
            fontSize: 12,
            color: '#333'
          },
          lineStyle: {
            curveness: 0.5,
            color: 'source',
            opacity: 0.5
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#aaa'
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              opacity: 0.8
            }
          }
        }
      ],
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

  const processSankeyData = (rawData) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    let nodeId = 0;

    // Add source nodes (payment methods)
    const paymentMethods = ['M-Pesa', 'Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'];
    paymentMethods.forEach(method => {
      const node = {
        id: nodeId,
        name: method,
        value: 0,
        connections: 0
      };
      nodes.push(node);
      nodeMap.set(method, nodeId++);
    });

    // Add target nodes (fee categories)
    const feeCategories = ['Tuition', 'Transport', 'Meals', 'Activities', 'Uniform', 'Other'];
    feeCategories.forEach(category => {
      const node = {
        id: nodeId,
        name: category,
        value: 0,
        connections: 0
      };
      nodes.push(node);
      nodeMap.set(category, nodeId++);
    });

    // Process payment data to create links
    rawData.forEach(payment => {
      const method = payment.paymentMethod || payment.type || 'Unknown';
      const category = payment.feeCategory || 'Other';
      const amount = parseFloat(payment.amount || 0);

      if (nodeMap.has(method) && nodeMap.has(category) && amount > 0) {
        const sourceId = nodeMap.get(method);
        const targetId = nodeMap.get(category);

        // Update node values
        nodes[sourceId].value += amount;
        nodes[targetId].value += amount;
        nodes[sourceId].connections++;
        nodes[targetId].connections++;

        // Add link
        links.push({
          source: sourceId,
          target: targetId,
          value: amount,
          sourceName: method,
          targetName: category,
          method: method,
          sourceValue: nodes[sourceId].value
        });
      }
    });

    return { nodes, links };
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="payment-pattern-sankey-chart"
    />
  );
};

export default PaymentPatternSankeyChart;
