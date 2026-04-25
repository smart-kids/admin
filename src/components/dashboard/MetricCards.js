import React from 'react';
import { formatCurrency, formatNumber, formatTrend, colorForValue } from '../../utils/formatters';

export const MetricCard = ({ title, value, subtitle, trend, icon, color, size = 'medium' }) => {
  const trendData = typeof trend === 'number' ? formatTrend(trend) : null;
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-5'
  };

  return (
    <div className={`card card-custom ${sizeClasses[size]}`} style={{ minHeight: size === 'small' ? '100px' : '140px' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="symbol symbol-40 symbol-light-primary">
            <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
              <i className={`${icon} text-primary`}></i>
            </span>
          </div>
          {trendData && (
            <span className={`badge badge-${trendData.isPositive ? 'success' : 'danger'} badge-pill`}>
              {trendData.displayValue}
            </span>
          )}
        </div>
        <div className="flex-grow-1">
          <h3 className="font-weight-bolder mb-2" style={{ color, fontSize: size === 'small' ? '1.2rem' : '1.5rem' }}>
            {value}
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: size === 'small' ? '0.75rem' : '0.85rem' }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, subtitle, icon, color, showSparkline = false, sparklineData = [] }) => {
  return (
    <div className="card card-custom p-4" style={{ minHeight: '140px' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="symbol symbol-40 symbol-light-primary">
            <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
              <i className={`${icon} text-primary`}></i>
            </span>
          </div>
          {showSparkline && sparklineData.length > 0 && (
            <MiniSparkline data={sparklineData} color={color} />
          )}
        </div>
        <div className="flex-grow-1">
          <h3 className="font-weight-bolder mb-2" style={{ color, fontSize: '1.5rem' }}>
            {value}
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrendCard = ({ title, currentValue, previousValue, icon, color, format = 'number' }) => {
  const trend = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const trendData = formatTrend(trend);
  
  const formatValue = (value) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percentage':
        return value.toFixed(1) + '%';
      default:
        return value.toString();
    }
  };

  return (
    <div className="card card-custom p-4" style={{ minHeight: '140px' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="symbol symbol-40 symbol-light-primary">
            <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
              <i className={`${icon} text-primary`}></i>
            </span>
          </div>
          <span className={`badge badge-${trendData.isPositive ? 'success' : 'danger'} badge-pill`}>
            <i className={`la la-arrow-${trendData.isPositive ? 'up' : 'down'} mr-1`}></i>
            {trendData.displayValue}
          </span>
        </div>
        <div className="flex-grow-1">
          <h3 className="font-weight-bolder mb-2" style={{ color, fontSize: '1.5rem' }}>
            {formatValue(currentValue)}
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {title}
          </p>
          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
            Previous: {formatValue(previousValue)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const EntityOverviewCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className="card card-custom p-4" style={{ minHeight: '140px' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="symbol symbol-40 symbol-light-primary">
            <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
              <i className={`${icon} text-primary`}></i>
            </span>
          </div>
        </div>
        <div className="flex-grow-1">
          <h3 className="font-weight-bolder mb-2" style={{ color, fontSize: '1.5rem' }}>
            {formatNumber(value)}
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniSparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  
  const width = 60;
  const height = 20;
  const padding = 2;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="ml-2">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};

export const ProgressCard = ({ title, value, max, color, showPercentage = true }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const progressColor = colorForValue(percentage);
  
  return (
    <div className="card card-custom p-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="font-weight-bold text-muted mb-0">{title}</h6>
          {showPercentage && (
            <span className="font-weight-bold" style={{ color: progressColor }}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${percentage}%`, backgroundColor: progressColor }}
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <span className="text-muted small">{formatNumber(value)}</span>
          <span className="text-muted small">{formatNumber(max)}</span>
        </div>
      </div>
    </div>
  );
};

export const ComparisonCard = ({ title, current, previous, icon, color, format = 'number' }) => {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  const trendData = formatTrend(changePercent);
  
  const formatValue = (value) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percentage':
        return value.toFixed(1) + '%';
      default:
        return value.toString();
    }
  };

  return (
    <div className="card card-custom p-4">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="symbol symbol-40 symbol-light-primary">
            <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
              <i className={`${icon} text-primary`}></i>
            </span>
          </div>
          <span className={`badge badge-${trendData.isPositive ? 'success' : 'danger'} badge-pill`}>
            {trendData.displayValue}
          </span>
        </div>
        <h5 className="font-weight-bolder mb-2" style={{ color }}>
          {formatValue(current)}
        </h5>
        <p className="text-muted mb-2">{title}</p>
        <div className="d-flex justify-content-between">
          <span className="text-muted small">Current: {formatValue(current)}</span>
          <span className="text-muted small">Previous: {formatValue(previous)}</span>
        </div>
      </div>
    </div>
  );
};
