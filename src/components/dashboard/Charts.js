import React, { Component } from 'react';
import { formatCurrency, formatNumber, groupByPeriod, calculateGrowthRate } from '../../utils/formatters';

// Revenue Chart Component
export class RevenueChart extends Component {
  state = {
    chartData: null,
    loading: true
  };

  componentDidMount() {
    this.processChartData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data || prevProps.schools !== this.props.schools) {
      this.processChartData();
    }
  }

  processChartData = () => {
    const { data, schools } = this.props;
    
    if (!data || !schools) {
      this.setState({ loading: false, chartData: null });
      return;
    }

    // Group payments by month
    const monthlyData = groupByPeriod(data, 'time', 'amount', 'monthly');
    
    // Calculate revenue per school
    const schoolRevenue = {};
    schools.forEach(school => {
      const schoolPayments = data.filter(p => 
        p.schoolId === school.id || (p.school && p.school.id === school.id)
      );
      schoolRevenue[school.id] = schoolPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    });

    // Get top 5 schools by revenue
    const topSchools = Object.entries(schoolRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([schoolId, revenue]) => {
        const school = schools.find(s => s.id === schoolId);
        return {
          name: school ? school.name : `School ${schoolId}`,
          revenue
        };
      });

    this.setState({
      chartData: {
        monthlyData,
        topSchools
      },
      loading: false
    });
  };

  render() {
    const { title, loading: propsLoading } = this.props;
    const { chartData, loading: stateLoading } = this.state;

    if (propsLoading || stateLoading || !chartData) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading chart data...
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card card-custom">
        <div className="card-header border-0">
          <h3 className="card-title font-weight-bolder text-dark">{title}</h3>
          <div className="card-toolbar">
            <div className="dropdown dropdown-inline">
              <button
                type="button"
                className="btn btn-light btn-sm btn-icon"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="ki ki-bold-more-hor"></i>
              </button>
              <div className="dropdown-menu dropdown-menu-sm dropdown-menu-right">
                <a className="dropdown-item" href="#" onClick={() => this.exportChart('revenue-chart')}>
                  <i className="la la-download"></i> Export
                </a>
                <a className="dropdown-item" href="#" onClick={() => this.refreshChart()}>
                  <i className="la la-refresh"></i> Refresh
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Monthly Revenue Trend */}
          <div className="mb-8">
            <h5 className="font-weight-bold text-muted mb-4">Monthly Revenue Trend</h5>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Transactions</th>
                    <th>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.monthlyData.slice(-6).map((period, index) => (
                    <tr key={index}>
                      <td>{period.period}</td>
                      <td className="font-weight-bold">{formatCurrency(period.total)}</td>
                      <td>{period.count}</td>
                      <td>{formatCurrency(period.average)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Schools */}
          <div>
            <h5 className="font-weight-bold text-muted mb-4">Top Performing Schools</h5>
            <div className="space-y-2">
              {chartData.topSchools.map((school, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div className="d-flex align-items-center">
                    <span className="symbol symbol-30 symbol-light-primary mr-3">
                      <span className="symbol-label">
                        <span className="font-weight-bold">{index + 1}</span>
                      </span>
                    </span>
                    <span className="font-weight-bold">{school.name}</span>
                  </div>
                  <span className="font-weight-bolder text-primary">
                    {formatCurrency(school.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  exportChart = (chartId) => {
    // Export functionality
    const { chartData } = this.state;
    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `revenue-chart-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  refreshChart = () => {
    this.setState({ loading: true });
    this.processChartData();
  };
}

// Growth Chart Component
export class GrowthChart extends Component {
  state = {
    chartData: null,
    loading: true
  };

  componentDidMount() {
    this.processChartData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.processChartData();
    }
  }

  processChartData = () => {
    const { data } = this.props;
    
    if (!data) {
      this.setState({ loading: false, chartData: null });
      return;
    }

    // Calculate growth metrics
    const growthData = this.calculateGrowthMetrics(data);

    this.setState({
      chartData: growthData,
      loading: false
    });
  };

  calculateGrowthMetrics = (data) => {
    // Group by month and calculate growth
    const monthlyData = groupByPeriod(data, 'createdAt', 'amount', 'monthly');
    
    const growthRates = monthlyData.map((period, index) => {
      if (index === 0) return { ...period, growthRate: 0 };
      const previousTotal = monthlyData[index - 1].total;
      const growthRate = previousTotal > 0 ? ((period.total - previousTotal) / previousTotal) * 100 : 0;
      return { ...period, growthRate };
    });

    return {
      monthlyData: growthRates,
      averageGrowthRate: this.calculateAverageGrowthRate(growthRates),
      totalGrowth: this.calculateTotalGrowth(growthRates)
    };
  };

  calculateAverageGrowthRate = (data) => {
    const validGrowthRates = data.filter(d => d.growthRate !== 0).map(d => d.growthRate);
    if (validGrowthRates.length === 0) return 0;
    return validGrowthRates.reduce((sum, rate) => sum + rate, 0) / validGrowthRates.length;
  };

  calculateTotalGrowth = (data) => {
    if (data.length < 2) return 0;
    const first = data[0].total;
    const last = data[data.length - 1].total;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  };

  render() {
    const { title, loading: propsLoading } = this.props;
    const { chartData, loading: stateLoading } = this.state;

    if (propsLoading || stateLoading || !chartData) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading growth data...
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card card-custom">
        <div className="card-header border-0">
          <h3 className="card-title font-weight-bolder text-dark">{title}</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="text-center">
                <h2 className="font-weight-bolder text-primary">
                  {chartData.averageGrowthRate.toFixed(1)}%
                </h2>
                <p className="text-muted">Average Monthly Growth</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="text-center">
                <h2 className="font-weight-bolder text-success">
                  {chartData.totalGrowth.toFixed(1)}%
                </h2>
                <p className="text-muted">Total Growth</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h5 className="font-weight-bold text-muted mb-4">Monthly Growth Rates</h5>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Growth Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.monthlyData.slice(-6).map((period, index) => (
                    <tr key={index}>
                      <td>{period.period}</td>
                      <td>{formatCurrency(period.total)}</td>
                      <td>
                        <span className={`badge badge-${period.growthRate >= 0 ? 'success' : 'danger'}`}>
                          {period.growthRate >= 0 ? '+' : ''}{period.growthRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Entity Distribution Chart Component
export class EntityDistributionChart extends Component {
  state = {
    chartData: null,
    loading: true
  };

  componentDidMount() {
    this.processChartData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.processChartData();
    }
  }

  processChartData = () => {
    const { data } = this.props;
    
    if (!data) {
      this.setState({ loading: false, chartData: null });
      return;
    }

    const entities = [
      { name: 'Schools', count: data.totalSchools || 0, color: '#3699ff' },
      { name: 'Students', count: data.totalStudents || 0, color: '#10b981' },
      { name: 'Teachers', count: data.totalTeachers || 0, color: '#f6c23e' },
      { name: 'Classes', count: data.totalClasses || 0, color: '#e74c3c' },
      { name: 'Lesson Attempts', count: data.totalLessonAttempts || 0, color: '#8b5cf6' },
      { name: 'Attempt Events', count: data.totalAttemptEvents || 0, color: '#ec4899' }
    ];

    const total = entities.reduce((sum, entity) => sum + entity.count, 0);

    this.setState({
      chartData: { entities, total },
      loading: false
    });
  };

  render() {
    const { title, loading: propsLoading } = this.props;
    const { chartData, loading: stateLoading } = this.state;

    if (propsLoading || stateLoading || !chartData) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading distribution data...
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card card-custom">
        <div className="card-header border-0">
          <h3 className="card-title font-weight-bolder text-dark">{title}</h3>
        </div>
        <div className="card-body">
          <div className="text-center mb-6">
            <h2 className="font-weight-bolder text-primary">
              {formatNumber(chartData.total)}
            </h2>
            <p className="text-muted">Total Entities</p>
          </div>
          
          <div className="space-y-3">
            {chartData.entities.map((entity, index) => {
              const percentage = chartData.total > 0 ? (entity.count / chartData.total) * 100 : 0;
              return (
                <div key={index} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div 
                      className="symbol symbol-20 mr-3"
                      style={{ backgroundColor: entity.color }}
                    ></div>
                    <span className="font-weight-bold">{entity.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-weight-bold">{formatNumber(entity.count)}</div>
                    <div className="text-muted small">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
