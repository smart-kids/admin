import React from 'react';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

// School Revenue Breakdown Table
export const SchoolRevenueBreakdown = ({ schoolRevenueBreakdown, loading }) => {
  if (loading) {
    return (
      <div className="card card-custom">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="spinner spinner-primary mr-3"></div>
            <div className="text-muted mt-2">Loading school revenue breakdown...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!schoolRevenueBreakdown || schoolRevenueBreakdown.length === 0) {
    return (
      <div className="card card-custom">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="text-muted">No school revenue data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="school-revenue-breakdown">
      <div className="card card-custom" style={{ 
        backgroundColor: '#ffffff', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="card-header border-0 bg-gray-50">
          <div className="card-title">
            <h3 className="card-label font-weight-bolder text-dark">School Revenue Breakdown</h3>
          </div>
          <div className="card-toolbar">
            <div className="text-muted small">
              <i className="la la-info-circle mr-1"></i>
              Based on 1K per term per student model
            </div>
          </div>
        </div>
        <div className="card-body pt-4">
          <div className="table-responsive">
            <table className="table table-vertical-center">
              <thead>
                <tr className="bg-light">
                  <th className="font-weight-bold text-muted" style={{ fontSize: '0.875rem' }}>School</th>
                  <th className="font-weight-bold text-muted text-center" style={{ fontSize: '0.875rem' }}>Students (Agreed / System)</th>
                  <th className="font-weight-bold text-muted text-center" style={{ fontSize: '0.875rem' }}>SaaS Amount</th>
                  <th className="font-weight-bold text-muted text-right" style={{ fontSize: '0.875rem' }}>Term Revenue</th>
                  <th className="font-weight-bold text-muted text-right" style={{ fontSize: '0.875rem' }}>Monthly Revenue</th>
                  <th className="font-weight-bold text-muted text-right" style={{ fontSize: '0.875rem' }}>Annual Revenue</th>
                </tr>
              </thead>
              <tbody>
                {schoolRevenueBreakdown.map((school, index) => (
                  <tr key={school.schoolId} className={index < 3 ? 'border-bottom-2 border-primary' : ''}>
                    <td>
                      <div className="d-flex align-items-center">
                        {index < 3 && (
                          <span className="symbol symbol-30 mr-3" style={{ backgroundColor: '#3699ff20', color: '#3699ff' }}>
                            <span className="font-weight-bold">{index + 1}</span>
                          </span>
                        )}
                        <div>
                          <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>
                            {school.schoolName}
                          </div>
                          {index < 3 && (
                            <div className="text-muted small">Top Performer</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="font-weight-bold" style={{ fontSize: '1rem' }}>
                        {formatNumber(school.agreedStudentCount || school.studentCount)}
                      </span>
                      {school.agreedStudentCount !== school.systemStudentCount && (
                        <div className="text-muted small">Sys: {formatNumber(school.systemStudentCount)}</div>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="font-weight-bold text-dark" style={{ fontSize: '0.9rem' }}>
                        {formatCurrency(school.agreedRate)}
                      </span>
                      <div className="text-muted small">per student</div>
                    </td>
                    <td className="text-right">
                      <span className="font-weight-bolder text-success" style={{ fontSize: '1rem' }}>
                        {formatCurrency(school.termRevenue)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-weight-bolder text-info" style={{ fontSize: '0.875rem' }}>
                        {formatCurrency(school.monthlyRevenue)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-weight-bolder text-primary" style={{ fontSize: '1.1rem' }}>
                        {formatCurrency(school.annualRevenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary Statistics */}
          <div className="row mt-6 pt-4 border-top">
            <div className="col-md-3">
              <div className="text-center p-3 bg-light rounded">
                <h5 className="font-weight-bolder text-primary mb-1">
                  {formatNumber(schoolRevenueBreakdown.length)}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Total Schools</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-3 bg-light rounded">
                <h5 className="font-weight-bolder text-success mb-1">
                  {formatCurrency(schoolRevenueBreakdown.reduce((sum, s) => sum + s.termRevenue, 0))}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Total Term Revenue</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-3 bg-light rounded">
                <h5 className="font-weight-bolder text-info mb-1">
                  {formatCurrency(schoolRevenueBreakdown.reduce((sum, s) => sum + s.monthlyRevenue, 0))}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Total Monthly Revenue</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-3 bg-light rounded">
                <h5 className="font-weight-bolder text-primary mb-1">
                  {formatCurrency(schoolRevenueBreakdown.reduce((sum, s) => sum + s.annualRevenue, 0))}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Total Annual Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Business Summary Card
export const BusinessSummaryCard = ({ revenueProjections, loading }) => {
  if (loading) {
    return (
      <div className="card card-custom">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="spinner spinner-primary mr-3"></div>
            <div className="text-muted mt-2">Loading business summary...</div>
          </div>
        </div>
      </div>
    );
  }

  const { businessModel, totalStudents, businessAnnualRevenue, businessMonthlyRevenue } = revenueProjections || {};

  return (
    <div className="business-summary">
      <div className="card card-custom" style={{ 
        backgroundColor: '#ffffff', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="card-header border-0 bg-gray-50">
          <div className="card-title">
            <h3 className="card-label font-weight-bolder text-dark">Business Summary</h3>
          </div>
        </div>
        <div className="card-body pt-4">
          <div className="text-center mb-6">
            <div className="d-flex justify-content-center align-items-center mb-4">
              <div className="symbol symbol-80 mr-4" style={{ backgroundColor: '#3699ff15', color: '#3699ff' }}>
                <i className="la la-chart-line" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <div className="text-left">
                <h2 className="font-weight-bolder text-primary mb-1" style={{ fontSize: '2rem' }}>
                  {formatCurrency(businessAnnualRevenue)}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>Total Annual Business Revenue</p>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                <div className="symbol symbol-40 mr-3" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                  <i className="la la-users" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div>
                  <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>Total Students</div>
                  <div className="font-weight-bolder text-success" style={{ fontSize: '1.1rem' }}>
                    {formatNumber(totalStudents)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                <div className="symbol symbol-40 mr-3" style={{ backgroundColor: '#f6c23e15', color: '#f6c23e' }}>
                  <i className="la la-calendar" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div>
                  <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>Months Per Term</div>
                  <div className="font-weight-bolder text-warning" style={{ fontSize: '1.1rem' }}>
                    {businessModel?.monthsPerTerm}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                <div className="symbol symbol-40 mr-3" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
                  <i className="la la-money" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div>
                  <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>Per Term Fee</div>
                  <div className="font-weight-bolder text-info" style={{ fontSize: '1.1rem' }}>
                    {formatCurrency(businessModel?.termFee)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                <div className="symbol symbol-40 mr-3" style={{ backgroundColor: '#e74c3c15', color: '#e74c3c' }}>
                  <i className="la fa-chart-bar" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div>
                  <div className="font-weight-bold text-dark" style={{ fontSize: '0.875rem' }}>Monthly Revenue</div>
                  <div className="font-weight-bolder text-danger" style={{ fontSize: '1.1rem' }}>
                    {formatCurrency(businessMonthlyRevenue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
