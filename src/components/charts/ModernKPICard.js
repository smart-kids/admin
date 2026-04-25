import React from 'react';
import { EChartsWrapper } from './EChartsWrapper';

/**
 * Modern KPI Card with enhanced visual design
 * Features gradient backgrounds, improved typography, and better visual hierarchy
 */
export const ModernKPICard = ({ 
  title, 
  value, 
  subtext, 
  icon, 
  color = '#3699ff', 
  trend,
  loading = false,
  className = '',
  height = 180,
  showSparkline = false,
  sparklineData = [],
  comparison = null,
  progress = null,
  badge = null
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

  const getProgressOption = () => {
    if (!progress) return null;

    return {
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 2,
        radius: '90%',
        center: ['50%', '75%'],
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[progress.value / 100, color], [1, '#e5e7eb']]
          }
        },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        pointer: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value: progress.value }]
      }]
    };
  };

  const getBackgroundColor = () => {
    const colors = {
      '#3699ff': '#f0f9ff',
      '#10b981': '#f0fdf4',
      '#f6c23e': '#fffbeb',
      '#e74c3c': '#fef2f2',
      '#8b5cf6': '#faf5ff',
      '#f97316': '#fff7ed'
    };
    return colors[color] || colors['#3699ff'];
  };

  const getIconColor = () => {
    const colors = {
      '#3699ff': 'primary',
      '#10b981': 'success', 
      '#f6c23e': 'warning',
      '#e74c3c': 'danger',
      '#8b5cf6': 'info',
      '#f97316': 'warning'
    };
    return colors[color] || 'primary';
  };

  return (
    <div 
      className={`modern-kpi-card ${className}`}
      style={{
        height: `${height}px`,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Main Content */}
      <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          {/* Icon */}
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: getBackgroundColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${color}20`
            }}
          >
            <i className={`${getIconColor()} ${icon}`} style={{ fontSize: '18px' }}></i>
          </div>

          {/* Badge or Trend */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {badge && (
              <div 
                style={{
                  background: badge.color || '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}
              >
                {badge.text}
              </div>
            )}
            {trend !== undefined && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  color: trend > 0 ? '#10b981' : '#e74c3c',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'}`} style={{ fontSize: '8px' }}></i>
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ 
          color: '#6b7280', 
          fontSize: '12px', 
          fontWeight: '500',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }}>
          {title}
        </div>

        {/* Value */}
        <div style={{ 
          color: '#111827', 
          fontSize: '24px', 
          fontWeight: '600',
          marginBottom: '6px',
          lineHeight: '1'
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Subtext */}
        {subtext && (
          <div style={{ 
            color: '#9ca3af', 
            fontSize: '11px', 
            fontWeight: '400',
            marginBottom: '8px',
            lineHeight: '1.3'
          }}>
            {subtext}
          </div>
        )}

        {/* Comparison */}
        {comparison && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '4px 8px',
            background: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
              {comparison.label}
            </span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '600',
              color: comparison.trend === 'up' ? '#10b981' : '#e74c3c'
            }}>
              {comparison.value}
              {typeof comparison.value === 'number' && '%'}
              {comparison.trend && (
                <i className={`fas fa-arrow-${comparison.trend} ml-1`} style={{ fontSize: '8px' }}></i>
              )}
            </span>
          </div>
        )}

        {/* Sparkline or Progress */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          {showSparkline && (
            <EChartsWrapper 
              option={getSparklineOption()} 
              height={40} 
              loading={loading}
            />
          )}
          {progress && (
            <EChartsWrapper 
              option={getProgressOption()} 
              height={60} 
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px'
        }}>
          <div className="spinner spinner-primary"></div>
        </div>
      )}

      <style jsx>{`
        .modern-kpi-card:hover {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ModernKPICard;
