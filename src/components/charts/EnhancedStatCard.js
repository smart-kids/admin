import React from 'react';
import { EChartsWrapper } from './EChartsWrapper';

/**
 * Enhanced Stat Card with ECharts integration
 * Migrated from the original DashboardWidgets StatCard
 */
export const EnhancedStatCard = ({ 
  title, 
  value, 
  subtext, 
  icon, 
  color = '#3699ff', 
  trend,
  loading = false,
  className = '',
  height = 140,
  showSparkline = false,
  sparklineData = [],
  onClick
}) => {
  const getSparklineOption = () => {
    if (!showSparkline || !sparklineData || sparklineData.length === 0) return null;

    const isPositive = trend > 0;
    const sparklineColor = isPositive ? '#10b981' : '#e74c3c';

    return {
      grid: { top: 0, left: 0, right: 0, bottom: 0 },
      xAxis: { show: false, type: 'category', data: sparklineData.map((_, i) => i) },
      yAxis: { show: false, type: 'value' },
      series: [{
        type: 'line',
        data: sparklineData,
        smooth: true,
        symbol: 'none',
        lineStyle: { 
          color: sparklineColor, 
          width: 2 
        },
        areaStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: sparklineColor + '40' },
              { offset: 1, color: sparklineColor + '10' }
            ]
          }
        }
      }]
    };
  };

  const getIconColor = () => {
    const colorMap = {
      '#3699ff': 'primary',
      '#10b981': 'success',
      '#f6c23e': 'warning',
      '#e74c3c': 'danger'
    };
    return colorMap[color] || 'primary';
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trend > 0 ? 'success' : 'danger';
  };

  return (
    <div 
      className={`card card-custom gutter-b shadow-hover enhanced-stat-card ${className}`}
      style={{ 
        height: `${height}px`, 
        borderRadius: '15px', 
        border: 'none', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)', 
        transition: 'transform 0.2s',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <div className="card-body d-flex p-8 h-100">
        {/* Left Section - Icon and Trend */}
        <div className="d-flex flex-column justify-content-between mr-6">
          <span className={`symbol symbol-45 symbol-light-${getIconColor()}`}>
            <span className="symbol-label">
              <i className={`text-${getIconColor()} ${icon}`} style={{ fontSize: '1.2rem' }}></i>
            </span>
          </span>
          
          {trend && (
            <span className={`label label-light-${getTrendColor()} label-inline font-weight-bold`}>
              <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'} mr-1`}></i>
              {Math.abs(trend)}%
            </span>
          )}
        </div>

        {/* Middle Section - Main Content */}
        <div className="d-flex flex-column flex-grow-1">
          <span className="text-dark-75 font-weight-bolder font-size-h3">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          <span className="text-muted font-weight-bold font-size-sm">{title}</span>
          {subtext && (
            <span className="text-muted font-size-xs mt-1">{subtext}</span>
          )}
        </div>

        {/* Right Section - Sparkline */}
        {showSparkline && sparklineData && sparklineData.length > 0 && (
          <div className="d-flex align-items-center" style={{ width: '80px', height: '40px' }}>
            <EChartsWrapper 
              option={getSparklineOption()} 
              height={40} 
              style={{ width: '80px' }}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Hover effect styles */}
      <style jsx>{`
        .enhanced-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.08);
        }
        .enhanced-stat-card:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

/**
 * Advanced Stat Card with multiple metrics and comparison features
 */
export const AdvancedStatCard = ({ 
  title,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  trend,
  icon,
  color = '#3699ff',
  comparisonData = [],
  loading = false,
  height = 180,
  showComparison = false
}) => {
  const getComparisonOption = () => {
    if (!showComparison || !comparisonData || comparisonData.length === 0) return null;

    return {
      grid: { top: 10, left: 0, right: 0, bottom: 0 },
      xAxis: { 
        show: false, 
        type: 'category', 
        data: comparisonData.map((_, i) => i) 
      },
      yAxis: { show: false, type: 'value' },
      series: [{
        type: 'bar',
        data: comparisonData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color },
              { offset: 1, color: color + '80' }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        }
      }]
    };
  };

  const getIconColor = () => {
    const colorMap = {
      '#3699ff': 'primary',
      '#10b981': 'success',
      '#f6c23e': 'warning',
      '#e74c3c': 'danger'
    };
    return colorMap[color] || 'primary';
  };

  return (
    <div 
      className="card card-custom gutter-b shadow-hover advanced-stat-card"
      style={{ 
        height: `${height}px`, 
        borderRadius: '15px', 
        border: 'none', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
      }}
    >
      <div className="card-body d-flex flex-column p-8 h-100">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <span className={`symbol symbol-40 symbol-light-${getIconColor()}`}>
            <span className="symbol-label">
              <i className={`text-${getIconColor()} ${icon}`} style={{ fontSize: '1rem' }}></i>
            </span>
          </span>
          
          {trend && (
            <span className={`label label-light-${trend > 0 ? 'success' : 'danger'} label-inline font-weight-bold`}>
              <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'} mr-1`}></i>
              {Math.abs(trend)}%
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-muted font-weight-bold font-size-sm mb-2">{title}</div>

        {/* Primary Value */}
        <div className="text-dark-75 font-weight-bolder font-size-h2 mb-3">
          {typeof primaryValue === 'number' ? primaryValue.toLocaleString() : primaryValue}
          <span className="text-muted font-size-sm ml-2">{primaryLabel}</span>
        </div>

        {/* Secondary Value */}
        {secondaryValue !== undefined && (
          <div className="d-flex align-items-center mb-3">
            <span className="text-muted font-weight-bold font-size-sm mr-2">
              {secondaryLabel}:
            </span>
            <span className="text-dark-50 font-weight-bolder font-size-sm">
              {typeof secondaryValue === 'number' ? secondaryValue.toLocaleString() : secondaryValue}
            </span>
          </div>
        )}

        {/* Comparison Chart */}
        {showComparison && comparisonData && comparisonData.length > 0 && (
          <div className="flex-grow-1 d-flex align-items-end">
            <EChartsWrapper 
              option={getComparisonOption()} 
              height={60} 
              loading={loading}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .advanced-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
};

export default { EnhancedStatCard, AdvancedStatCard };
