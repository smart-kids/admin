import React from 'react';
import { formatCurrency, formatNumber, formatTrend, colorForValue } from '../../../utils/formatters';

// Professional Metric Card with larger icons and text
export const ModernMetricCard = ({ title, value, subtitle, trend, icon, color, size = 'medium', isCurrency = true }) => {
  const trendData = typeof trend === 'number' ? formatTrend(trend) : null;

  const cardColors = {
    primary: '#3699ff',
    success: '#10b981',
    info: '#8b5cf6',
    warning: '#f6c23e',
    danger: '#e74c3c',
    white: '#ffffff'
  };

  return (
    <div className="modern-metric-card h-100" style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      padding: '1.5rem',
      margin: '0.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="d-flex flex-column flex-grow-1">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="symbol symbol-80" style={{ backgroundColor: `${cardColors[color]}15` }}>
            <span className="symbol-label" style={{ color: cardColors[color] }}>
              <i className={`${icon}`} style={{ fontSize: '3rem' }}></i>
            </span>
          </div>
          {trendData && (
            <div className={`badge badge-pill px-3 py-2`} style={{
              backgroundColor: trendData.isPositive ? '#10b98120' : '#e74c3c20',
              color: trendData.isPositive ? '#10b981' : '#e74c3c',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              <i className={`la la-arrow-${trendData.isPositive ? 'up' : 'down'} mr-1`}></i>
              {trendData.displayValue}
            </div>
          )}
        </div>
        <div className="flex-grow-1 d-flex flex-column justify-content-center">
          <h1 className="font-weight-bolder mb-3" style={{ 
            color: '#1f2937', 
            fontSize: '2.5rem',
            lineHeight: '1.1',
            minHeight: '3rem'
          }}>
            {typeof value === 'number' ? (isCurrency ? formatCurrency(value) : formatNumber(value)) : value}
          </h1>
          <p className="mb-2" style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </p>
          {subtitle && (
            <p className="mb-0" style={{ 
              color: '#9ca3af', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .modern-metric-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: '#d1d5db';
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

// Business Revenue Card showing 1K per term model
export const BusinessRevenueCard = ({ revenueProjections, loading }) => {
  if (loading) {
    return (
      <div className="card card-custom card-stretch">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="spinner spinner-primary mr-3"></div>
            <div className="text-muted mt-2">Loading business revenue...</div>
          </div>
        </div>
      </div>
    );
  }

  const { businessModel, businessAnnualRevenue, businessMonthlyRevenue, totalTermRevenue, totalStudents } = revenueProjections || {};

  return (
    <div className="card card-custom card-stretch" style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="card-header border-0 bg-gray-50">
        <div className="card-title">
          <h3 className="card-label font-weight-bolder text-dark">Business Revenue Model</h3>
        </div>
      </div>
      <div className="card-body pt-4">
        {/* Business Model Overview */}
        <div className="row mb-6">
          <div className="col-6">
            <div className="text-center p-3">
              <h4 className="font-weight-bolder text-primary mb-1">{formatCurrency(businessAnnualRevenue)}</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Annual Revenue</p>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center p-3">
              <h4 className="font-weight-bolder text-success mb-1">{formatCurrency(businessMonthlyRevenue)}</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Monthly Revenue</p>
            </div>
          </div>
        </div>

        {/* Business Model Details */}
        <div className="mb-6">
          <h5 className="font-weight-bold text-dark mb-3" style={{ fontSize: '1rem' }}>Revenue Breakdown</h5>
          <div className="space-y-3">
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
              <div>
                <div className="font-weight-bold text-dark">Per Student (Annual)</div>
                <div className="text-muted small">{businessModel?.termsPerYear} terms × {formatCurrency(businessModel?.termFee)} per term</div>
              </div>
              <div className="font-weight-bolder text-primary">{formatCurrency(businessModel?.annualFeePerStudent)}</div>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
              <div>
                <div className="font-weight-bold text-dark">Per Student (Monthly)</div>
                <div className="text-muted small">{formatCurrency(businessModel?.termFee)} ÷ {businessModel?.monthsPerTerm} months per term</div>
              </div>
              <div className="font-weight-bolder text-info">{formatCurrency(businessModel?.monthlyFeePerStudent)}</div>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
              <div>
                <div className="font-weight-bold text-dark">Total Students</div>
                <div className="text-muted small">All enrolled students</div>
              </div>
              <div className="font-weight-bolder text-info">{formatNumber(totalStudents)}</div>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
              <div>
                <div className="font-weight-bold text-dark">Term Revenue</div>
                <div className="text-muted small">Current term total</div>
              </div>
              <div className="font-weight-bolder text-success">{formatCurrency(totalTermRevenue)}</div>
            </div>
          </div>
        </div>

        {/* Top Performing Schools */}
        <div>
          <h5 className="font-weight-bold text-dark mb-3" style={{ fontSize: '1rem' }}>Top Schools by Revenue</h5>
          <div className="space-y-2">
            {revenueProjections?.topPerformingSchools?.slice(0, 3).map((school, index) => (
              <div key={school.schoolId} className="d-flex justify-content-between align-items-center p-2 border-bottom border-gray-100">
                <div className="d-flex align-items-center">
                  <span className="symbol symbol-30 mr-2" style={{ backgroundColor: '#3699ff20', color: '#3699ff' }}>
                    <span className="font-weight-bold">{index + 1}</span>
                  </span>
                  <div>
                    <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>{school.schoolName}</div>
                    <div className="text-muted small">{school.studentCount} students</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-weight-bolder text-primary" style={{ fontSize: '0.875rem' }}>{formatCurrency(school.annualRevenue)}</div>
                  <div className="text-muted small">annual</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Card with clean progress indicators
export const PerformanceCard = ({ title, metrics, loading }) => {
  if (loading) {
    return (
      <div className="card card-custom card-stretch">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="spinner spinner-primary mr-3"></div>
            <div className="text-muted mt-2">Loading performance metrics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-custom card-stretch" style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="card-header border-0 bg-gray-50">
        <div className="card-title">
          <h3 className="card-label font-weight-bolder text-dark">{title}</h3>
        </div>
      </div>
      <div className="card-body pt-4">
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>{metric.label}</span>
                  <span className="font-weight-bolder" style={{ color: metric.color, fontSize: '0.875rem' }}>
                    {metric.value}
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ 
                      width: `${parseFloat(metric.value)}%`, 
                      backgroundColor: metric.color,
                      borderRadius: '3px',
                      transition: 'width 0.8s ease-in-out'
                    }}
                    aria-valuenow={parseFloat(metric.value)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mini Stat Card for compact displays
export const MiniStatCard = ({ title, value, icon, color, trend }) => {
  const trendData = typeof trend === 'number' ? formatTrend(trend) : null;
  
  return (
    <div className="mini-stat-card p-3" style={{
      background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      borderRadius: '12px',
      border: `1px solid ${color}30`,
      transition: 'all 0.3s ease'
    }}>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="font-weight-bold text-dark mb-1">{title}</div>
          <div className="font-weight-bolder" style={{ color, fontSize: '1.25rem' }}>
            {value}
          </div>
        </div>
        <div className="symbol symbol-30 symbol-light">
          <span className="symbol-label" style={{ backgroundColor: `${color}20`, color }}>
            <i className={`${icon}`}></i>
          </span>
        </div>
      </div>
      {trendData && (
        <div className="mt-2">
          <span className={`badge badge-pill`} style={{
            backgroundColor: `${color}20`,
            color,
            fontSize: '0.75rem'
          }}>
            <i className={`la la-arrow-${trendData.isPositive ? 'up' : 'down'} mr-1`}></i>
            {trendData.displayValue}
          </span>
        </div>
      )}
      
      <style jsx>{`
        .mini-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};
