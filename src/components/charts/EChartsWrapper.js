import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import TooltipHTMLContent from 'echarts/lib/component/tooltip/TooltipHTMLContent';
import LegendModel from 'echarts/lib/component/legend/LegendModel';

// Safe-patch ECharts LegendModel to prevent "Cannot read properties of undefined (reading 'name')" crash.
try {
  if (LegendModel && LegendModel.prototype) {
    const originalUpdateData = LegendModel.prototype._updateData;
    LegendModel.prototype._updateData = function (ecModel) {
      if (this.option && Array.isArray(this.option.data)) {
        this.option.data = this.option.data.filter(item => item !== null && item !== undefined);
      }
      return originalUpdateData.call(this, ecModel);
    };
  }
} catch (error) {
  console.warn('Failed to apply ECharts LegendModel safe-patches:', error);
}

// Safe-patch ECharts TooltipHTMLContent prototype methods to prevent "Cannot set properties of null (setting 'innerHTML')" crash.
try {
  if (TooltipHTMLContent && TooltipHTMLContent.prototype) {
    const originalSetContent = TooltipHTMLContent.prototype.setContent;
    TooltipHTMLContent.prototype.setContent = function (content, markers, tooltipModel, borderColor, arrowPosition) {
      if (!this.el) return;
      try {
        return originalSetContent.call(this, content, markers, tooltipModel, borderColor, arrowPosition);
      } catch (e) {
        console.warn('ECharts safe-patch setContent error:', e);
      }
    };

    const originalShow = TooltipHTMLContent.prototype.show;
    TooltipHTMLContent.prototype.show = function (tooltipModel, nearPointColor) {
      if (!this.el) return;
      try {
        return originalShow.call(this, tooltipModel, nearPointColor);
      } catch (e) {
        console.warn('ECharts safe-patch show error:', e);
      }
    };

    const originalHide = TooltipHTMLContent.prototype.hide;
    TooltipHTMLContent.prototype.hide = function () {
      if (!this.el) return;
      try {
        return originalHide.call(this);
      } catch (e) {
        console.warn('ECharts safe-patch hide error:', e);
      }
    };

    const originalUpdate = TooltipHTMLContent.prototype.update;
    TooltipHTMLContent.prototype.update = function (tooltipModel) {
      if (!this.el) return;
      try {
        return originalUpdate.call(this, tooltipModel);
      } catch (e) {
        console.warn('ECharts safe-patch update error:', e);
      }
    };
  }
} catch (error) {
  console.warn('Failed to apply ECharts tooltip safe-patches:', error);
}

// Safe-patch ECharts instance prototype to prevent "Cannot read properties of null (reading 'baseOption')" crash.
try {
  const dummyDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  const dummyChart = dummyDiv && echarts && typeof echarts.init === 'function' ? echarts.init(dummyDiv) : null;
  if (dummyChart) {
    const EChartsProto = Object.getPrototypeOf(dummyChart);
    if (EChartsProto && EChartsProto.setOption) {
      const originalSetOption = EChartsProto.setOption;
      EChartsProto.setOption = function (option, notMerge, lazyUpdate) {
        if (this.isDisposed()) return;
        const safeOption = option || {};
        try {
          return originalSetOption.call(this, safeOption, notMerge, lazyUpdate);
        } catch (e) {
          console.warn('ECharts safe-patch setOption error:', e);
        }
      };
    }
    dummyChart.dispose();
  }
} catch (error) {
  console.warn('Failed to apply ECharts instance safe-patches:', error);
}

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
    
    // Add custom event handlers with error handling
    echartsInstance.on('click', (params) => {
      try {
        if (onChartClick) {
          onChartClick(params);
        }
      } catch (error) {
        console.warn('Chart click handler error:', error);
      }
    });

    // Add hover effect with error handling
    echartsInstance.on('mouseover', (params) => {
      try {
        if (echartsInstance.getZr()) {
          echartsInstance.getZr().setCursorStyle('pointer');
        }
      } catch (error) {
        console.warn('Chart mouseover handler error:', error);
      }
    });

    echartsInstance.on('mouseout', (params) => {
      try {
        if (echartsInstance.getZr()) {
          echartsInstance.getZr().setCursorStyle('default');
        }
      } catch (error) {
        console.warn('Chart mouseout handler error:', error);
      }
    });

    // Add tooltip error handling
    try {
      const tooltipModel = echartsInstance.getModel().getComponent('tooltip');
      if (tooltipModel) {
        echartsInstance.on('showTip', (params) => {
          // Prevent tooltip errors by ensuring valid DOM elements
          if (!params || !params.from || !params.to) return;
        });
      }
    } catch (error) {
      console.warn('Tooltip setup error:', error);
    }
  };

  useEffect(() => {
    if (chartInstance && !chartInstance.isDisposed() && option) {
      try {
        chartInstance.setOption(option, true);
      } catch (error) {
        console.warn('ECharts setOption error ignored on unmount/dispose:', error);
      }
    }
  }, [option, chartInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance && !chartInstance.isDisposed()) {
        try {
          // Hide tooltip to prevent innerHTML errors on unmount
          chartInstance.dispatchAction({ type: 'hideTip' });
        } catch (e) {
          console.warn('Error hiding tooltip on unmount:', e);
        }
        try {
          chartInstance.dispose();
        } catch (e) {
          console.warn('Error disposing chart on unmount:', e);
        }
      }
    };
  }, [chartInstance]);

  return (
    <div className={`echarts-container ${className}`} style={style}>
      <ReactECharts
        ref={chartRef}
        option={option || {}}
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
