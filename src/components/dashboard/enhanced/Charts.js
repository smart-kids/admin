import React, { Component } from 'react';
import { formatCurrency, formatNumber, groupByPeriod } from '../../../utils/formatters';

// Modern Chart Component with gradient fills and animations
export class ModernChart extends Component {
  state = {
    chartData: null,
    loading: true
  };

  componentDidMount() {
    this.processChartData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data || prevProps.projections !== this.props.projections) {
      this.processChartData();
    }
  }

  processChartData = () => {
    const { data, projections } = this.props;
    
    if (!data) {
      this.setState({ loading: false, chartData: null });
      return;
    }

    // Group payments by month
    const monthlyData = groupByPeriod(data, 'time', 'amount', 'monthly');
    
    // Add projection data
    const projectionData = projections ? this.generateProjectionData(monthlyData, projections) : [];

    this.setState({
      chartData: {
        historical: monthlyData,
        projections: projectionData
      },
      loading: false
    });
  };

  generateProjectionData = (historicalData, projections) => {
    // Generate projection data for next 6 months based on business model
    const projectionsData = [];
    
    for (let i = 1; i <= 6; i++) {
      const projectedRevenue = projections?.businessMonthlyRevenue || 0;
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      projectionsData.push({
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        total: projectedRevenue,
        count: Math.floor(projectedRevenue / 1000), // Estimated transactions based on 1K per student
        average: projectedRevenue / Math.max(1, Math.floor(projectedRevenue / 1000)),
        isProjection: true
      });
    }
    
    return projectionsData;
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
      <div className="modern-chart">
        <div className="card card-custom" style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="card-header border-0 bg-gray-50">
            <div className="card-title">
              <h3 className="card-label font-weight-bolder text-dark">{title}</h3>
            </div>
            <div className="card-toolbar">
              <div className="dropdown dropdown-inline">
                <button type="button" className="btn btn-sm btn-light" data-toggle="dropdown">
                  <i className="la la-download mr-1"></i> Export
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {/* Chart Visualization */}
            <div className="mb-8">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="font-weight-bold text-dark">Revenue Trends & Projections</h5>
                <div className="d-flex align-items-center">
                  <div className="d-flex align-items-center mr-4">
                    <div className="symbol symbol-20 mr-2" style={{ backgroundColor: '#3699ff' }}></div>
                    <span className="text-muted">Historical</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-20 mr-2" style={{ backgroundColor: '#10b981' }}></div>
                    <span className="text-muted">Projected</span>
                  </div>
                </div>
              </div>
              
              {/* Simple Bar Chart Representation */}
              <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
                <div className="d-flex align-items-end justify-content-between" style={{ height: '100%', padding: '20px 0' }}>
                  {[...chartData.historical, ...chartData.projections].slice(-12).map((item, index) => (
                    <div key={index} className="flex-grow-1 mx-1" style={{ maxWidth: '60px' }}>
                      <div 
                        className={`chart-bar ${item.isProjection ? 'projection' : 'historical'}`}
                        style={{
                          height: `${(item.total / Math.max(...[...chartData.historical, ...chartData.projections].map(d => d.total))) * 250}px`,
                          backgroundColor: item.isProjection ? '#10b981' : '#3699ff',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          opacity: item.isProjection ? 0.7 : 1,
                          transition: 'all 0.3s ease'
                        }}
                        title={`${item.period}: ${formatCurrency(item.total)}`}
                      ></div>
                      <div className="text-center mt-2" style={{ fontSize: '0.75rem', color: '#666' }}>
                        {item.period.split('-')[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="row">
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h5 className="font-weight-bolder text-primary mb-2">
                    {formatCurrency(chartData.historical.reduce((sum, item) => sum + item.total, 0))}
                  </h5>
                  <p className="text-muted mb-0">Total Historical Revenue</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h5 className="font-weight-bolder text-success mb-2">
                    {formatCurrency(chartData.projections.reduce((sum, item) => sum + item.total, 0))}
                  </h5>
                  <p className="text-muted mb-0">Projected Revenue (6 months)</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h5 className="font-weight-bolder text-info mb-2">
                    {chartData.projections.length > 0 ? formatCurrency(chartData.projections[0].total) : formatCurrency(chartData.historical.length > 0 ? chartData.historical[chartData.historical.length - 1].total : 0)}
                  </h5>
                  <p className="text-muted mb-0">Current Monthly Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Revenue Growth Chart Component
export class RevenueGrowthChart extends Component {
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
      <div className="revenue-growth-chart">
        <div className="card card-custom" style={{ 
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
          <div className="card-body">
            <div className="row mb-8">
              <div className="col-md-6">
                <div className="text-center p-4 bg-light rounded">
                  <h4 className="font-weight-bolder text-primary mb-2">
                    {chartData.averageGrowthRate.toFixed(1)}%
                  </h4>
                  <p className="text-muted mb-0">Average Monthly Growth</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-center p-4 bg-light rounded">
                  <h4 className="font-weight-bolder text-success mb-2">
                    {chartData.totalGrowth.toFixed(1)}%
                  </h4>
                  <p className="text-muted mb-0">Total Growth</p>
                </div>
              </div>
            </div>
            
            {/* Growth Rate Visualization */}
            <div className="mb-4">
              <h5 className="font-weight-bold text-dark mb-4">Monthly Growth Rates</h5>
              <div className="space-y-2">
                {chartData.monthlyData.slice(-6).map((period, index) => (
                  <div key={index} className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="font-weight-bold">{period.period}</span>
                        <span className={`font-weight-bold ${period.growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                          {period.growthRate >= 0 ? '+' : ''}{period.growthRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress progress-sm">
                        <div
                          className={`progress-bar ${period.growthRate >= 0 ? 'bg-success' : 'bg-danger'}`}
                          role="progressbar"
                          style={{ width: `${Math.abs(period.growthRate)}%` }}
                          aria-valuenow={Math.abs(period.growthRate)}
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
        </div>
      </div>
    );
  }
}

// Entity Distribution Chart Component
export class EntityChart extends Component {
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

    // Focus on core business entities that make sense for distribution analysis
    const entities = [
      { name: 'Active Schools', count: data.totalSchools || 0, color: '#3699ff', icon: 'la la-school' },
      { name: 'Enrolled Students', count: data.totalStudentsInSchools || data.totalStudents || 0, color: '#10b981', icon: 'la la-graduation-cap' },
      { name: 'Teaching Staff', count: data.totalTeachers || 0, color: '#f6c23e', icon: 'la la-user' },
      { name: 'Active Classes', count: data.totalClasses || 0, color: '#e74c3c', icon: 'la fa-chalkboard' }
    ];

    // Calculate meaningful percentages based on relative importance, not raw counts
    const weightedEntities = entities.map(entity => {
      let weight = entity.count;
      
      // Apply business logic weights for more meaningful distribution
      if (entity.name === 'Enrolled Students') {
        // Students are the primary revenue drivers - weight by 1K KES per term
        weight = entity.count * 1000; // Revenue weight
      } else if (entity.name === 'Active Schools') {
        // Schools are the business units - weight by average revenue per school
        const avgStudentsPerSchool = entities.find(e => e.name === 'Enrolled Students')?.count / (entity.count || 1) || 0;
        weight = entity.count * (avgStudentsPerSchool * 1000); // School revenue weight
      } else if (entity.name === 'Teaching Staff') {
        // Teachers are operational - weight by coverage ratio
        weight = entity.count * 50; // Operational weight
      } else if (entity.name === 'Active Classes') {
        // Classes are delivery units - weight by student capacity
        weight = entity.count * 25; // Delivery weight
      }
      
      return { ...entity, weight };
    });

    const totalWeight = weightedEntities.reduce((sum, entity) => sum + entity.weight, 0);

    this.setState({
      chartData: { entities: weightedEntities, total: totalWeight, showWeighted: true },
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
      <div className="entity-chart">
        <div className="card card-custom" style={{ 
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
          <div className="card-body">
            <div className="text-center mb-6">
              <h3 className="font-weight-bolder text-primary mb-2">
                {formatNumber(chartData.entities.find(e => e.name === 'Enrolled Students')?.count || 0)}
              </h3>
              <p className="text-muted mb-0">Total Enrolled Students</p>
            </div>
            
            {/* Donut Chart Representation */}
            <div className="mb-6">
              <div className="d-flex justify-content-center">
                <div className="position-relative" style={{ width: '200px', height: '200px' }}>
                  <svg viewBox="0 0 42 42" className="donut-chart">
                    {chartData.entities.map((entity, index) => {
                      const percentage = chartData.total > 0 ? (entity.weight / chartData.total) * 100 : 0;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const rotation = index > 0 ? chartData.entities.slice(0, index).reduce((sum, e) => sum + (chartData.total > 0 ? (e.weight / chartData.total) * 100 : 0), 0) : 0;
                      
                      return (
                        <circle
                          key={index}
                          cx="21"
                          cy="21"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke={entity.color}
                          strokeWidth="3"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset="25"
                          transform={`rotate(${rotation * 3.6} 21 21)`}
                          style={{ transition: 'all 0.3s ease' }}
                        />
                      );
                    })}
                    </svg>
                  </div>
                </div>
              </div>
            
            {/* Entity List */}
            <div className="space-y-3">
              {chartData.entities.map((entity, index) => {
                const percentage = chartData.total > 0 ? (entity.weight / chartData.total) * 100 : 0;
                const getLabel = () => {
                  if (entity.name === 'Enrolled Students') return `${entity.count} students`;
                  if (entity.name === 'Active Schools') return `${entity.count} schools`;
                  if (entity.name === 'Teaching Staff') return `${entity.count} teachers`;
                  if (entity.name === 'Active Classes') return `${entity.count} classes`;
                  return `${entity.count} units`;
                };
                return (
                  <div key={index} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <div 
                        className="symbol symbol-30 mr-3"
                        style={{ backgroundColor: `${entity.color}20`, color: entity.color }}
                      >
                        <i className={`${entity.icon}`}></i>
                      </div>
                      <div>
                        <div className="font-weight-bold">{entity.name}</div>
                        <div className="text-muted small">{percentage.toFixed(1)}% business impact</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-weight-bolder" style={{ color: entity.color }}>
                        {getLabel()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
