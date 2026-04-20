import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

export const EChartsWrapper = ({ 
  option, 
  height = 400, 
  theme = 'light', 
  loading = false,
  onChartReady,
  onChartClick,
  className = '',
  style = {},
  renderer = 'svg'
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  const onChartReadyHandler = (echartsInstance) => {
    setChartInstance(echartsInstance);
    if (onChartReady) onChartReady(echartsInstance);
    
    // Add custom event handlers
    echartsInstance.on('click', (params) => {
      if (onChartClick) {
        onChartClick(params);
      }
    });

    // Add hover effect
    echartsInstance.on('mouseover', (params) => {
      echartsInstance.getZr().setCursorStyle('pointer');
    });

    echartsInstance.on('mouseout', (params) => {
      echartsInstance.getZr().setCursorStyle('default');
    });
  };

  useEffect(() => {
    if (chartInstance && option) {
      chartInstance.setOption(option, true);
    }
  }, [option, chartInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance) {
        chartInstance.dispose();
      }
    };
  }, [chartInstance]);

  return (
    <div className={`echarts-container ${className}`} style={style}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        onChartReady={onChartReadyHandler}
        theme={theme}
        opts={{ renderer }}
        showLoading={loading}
        loadingOption={{
          text: 'Loading data...',
          color: '#3699ff',
          textColor: '#000',
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0,
          fontSize: 12,
          showSpinner: true,
          spinnerRadius: 10,
          lineWidth: 5
        }}
      />
    </div>
  );
};

export default EChartsWrapper;
