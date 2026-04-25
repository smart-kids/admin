import React, { Component } from 'react';
import { formatCurrency, formatNumber, formatRelativeTime, rankItems } from '../../utils/formatters';

// Top Performers Table Component
export class TopPerformersTable extends Component {
  state = {
    topSchools: [],
    loading: true
  };

  componentDidMount() {
    this.processTopPerformers();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.schools !== this.props.schools || prevProps.payments !== this.props.payments) {
      this.processTopPerformers();
    }
  }

  processTopPerformers = () => {
    const { schools, payments } = this.props;
    
    if (!schools || !payments) {
      this.setState({ loading: false, topSchools: [] });
      return;
    }

    // Calculate revenue per school
    const schoolMetrics = schools.map(school => {
      const schoolPayments = payments.filter(p => 
        p.schoolId === school.id || (p.school && p.school.id === school.id)
      );
      
      const totalRevenue = schoolPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const transactionCount = schoolPayments.length;
      const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
      
      // Count students, teachers, classes for this school
      const studentCount = school.students ? school.students.length : 0;
      const teacherCount = school.teachers ? school.teachers.length : 0;
      const classCount = school.classes ? school.classes.length : 0;
      
      return {
        ...school,
        totalRevenue,
        transactionCount,
        averageTransaction,
        studentCount,
        teacherCount,
        classCount,
        revenuePerStudent: studentCount > 0 ? totalRevenue / studentCount : 0
      };
    });

    // Rank schools by revenue
    const rankedSchools = rankItems(schoolMetrics, 'totalRevenue', true).slice(0, 5);

    this.setState({
      topSchools: rankedSchools,
      loading: false
    });
  };

  render() {
    const { title, loading: propsLoading } = this.props;
    const { topSchools, loading: stateLoading } = this.state;

    if (propsLoading || stateLoading) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading top performers...
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
                <a className="dropdown-item" href="#" onClick={() => this.exportData('top-performers')}>
                  <i className="la la-download"></i> Export
                </a>
                <a className="dropdown-item" href="#" onClick={() => this.refreshData()}>
                  <i className="la la-refresh"></i> Refresh
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-head-custom table-vertical-center">
              <thead>
                <tr>
                  <th>#</th>
                  <th>School</th>
                  <th>Revenue</th>
                  <th>Students</th>
                  <th>Transactions</th>
                  <th>Revenue/Student</th>
                </tr>
              </thead>
              <tbody>
                {topSchools.map((school, index) => (
                  <tr key={school.id}>
                    <td>
                      <span className="symbol symbol-30 symbol-light-primary">
                        <span className="symbol-label">
                          <span className="font-weight-bold">{school.rank}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {school.logo && (
                          <img
                            src={school.logo}
                            alt={school.name}
                            className="symbol symbol-40 mr-3"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                        <div>
                          <div className="font-weight-bold">{school.name}</div>
                          <div className="text-muted small">{school.address || 'No address'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-weight-bolder text-primary">
                        {formatCurrency(school.totalRevenue)}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="font-weight-bold">{formatNumber(school.studentCount)}</span>
                        {school.studentCount > 0 && (
                          <span className="ml-2 badge badge-success badge-pill">
                            {school.revenuePerStudent > 0 ? formatCurrency(school.revenuePerStudent) : 'N/A'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-weight-bold">{school.transactionCount}</span>
                    </td>
                    <td>
                      <span className="font-weight-bold text-info">
                        {school.revenuePerStudent > 0 ? formatCurrency(school.revenuePerStudent) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {topSchools.length === 0 && (
            <div className="text-center py-10">
              <div className="text-muted">No data available</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  exportData = (type) => {
    const { topSchools } = this.state;
    const dataStr = JSON.stringify(topSchools, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${type}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  refreshData = () => {
    this.setState({ loading: true });
    this.processTopPerformers();
  };
}

// Recent Activity Table Component
export class RecentActivityTable extends Component {
  state = {
    recentActivity: [],
    loading: true
  };

  componentDidMount() {
    this.processRecentActivity();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.schools !== this.props.schools || prevProps.payments !== this.props.payments) {
      this.processRecentActivity();
    }
  }

  processRecentActivity = () => {
    const { schools, payments } = this.props;
    
    if (!schools || !payments) {
      this.setState({ loading: false, recentActivity: [] });
      return;
    }

    // Process recent payments
    const recentPayments = payments
      .map(payment => {
        const school = schools.find(s => 
          s.id === payment.schoolId || (payment.school && payment.school.id === s.id)
        );
        return {
          ...payment,
          schoolName: school ? school.name : 'Unknown School',
          type: 'payment',
          amount: parseFloat(payment.amount || 0),
          date: new Date(payment.time || payment.createdAt || payment.date)
        };
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    // Process recent school registrations
    const recentSchools = schools
      .filter(school => school.createdAt || school.created_at)
      .map(school => ({
        ...school,
        type: 'registration',
        amount: 0,
        date: new Date(school.createdAt || school.created_at)
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    // Combine and sort all activities
    const allActivities = [...recentPayments, ...recentSchools]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    this.setState({
      recentActivity: allActivities,
      loading: false
    });
  };

  getActivityIcon = (type) => {
    switch (type) {
      case 'payment':
        return 'la la-money';
      case 'registration':
        return 'la la-school';
      default:
        return 'la la-info-circle';
    }
  };

  getActivityColor = (type) => {
    switch (type) {
      case 'payment':
        return 'success';
      case 'registration':
        return 'primary';
      default:
        return 'info';
    }
  };

  render() {
    const { title, loading: propsLoading } = this.props;
    const { recentActivity, loading: stateLoading } = this.state;

    if (propsLoading || stateLoading) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading recent activity...
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
                <a className="dropdown-item" href="#" onClick={() => this.exportData('recent-activity')}>
                  <i className="la la-download"></i> Export
                </a>
                <a className="dropdown-item" href="#" onClick={() => this.refreshData()}>
                  <i className="la la-refresh"></i> Refresh
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="timeline timeline-5 mt-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="timeline-item align-items-start">
                <div className="timeline-label text-muted font-size-sm">
                  {formatRelativeTime(activity.date)}
                </div>
                
                <div className="timeline-badge">
                  <i className={`${this.getActivityIcon(activity.type)} ${this.getActivityColor(activity.type)} icon-md`}></i>
                </div>
                
                <div className="timeline-content d-flex justify-content-between">
                  <div>
                    {activity.type === 'payment' ? (
                      <>
                        <div className="font-weight-bold">Payment Received</div>
                        <div className="text-muted">
                          {activity.schoolName} - {formatCurrency(activity.amount)}
                        </div>
                        {activity.studentName && (
                          <div className="text-muted small">
                            Student: {activity.studentName}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-weight-bold">New School Registration</div>
                        <div className="text-muted">{activity.name}</div>
                        {activity.address && (
                          <div className="text-muted small">{activity.address}</div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {activity.type === 'payment' && (
                    <div className="text-right">
                      <span className="badge badge-success badge-pill">
                        {formatCurrency(activity.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {recentActivity.length === 0 && (
            <div className="text-center py-10">
              <div className="text-muted">No recent activity</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  exportData = (type) => {
    const { recentActivity } = this.state;
    const dataStr = JSON.stringify(recentActivity, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${type}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  refreshData = () => {
    this.setState({ loading: true });
    this.processRecentActivity();
  };
}

// Entity Summary Table Component
export class EntitySummaryTable extends Component {
  render() {
    const { title, data, loading } = this.props;

    if (loading) {
      return (
        <div className="card card-custom">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading entity summary...
            </div>
          </div>
        </div>
      );
    }

    const entities = [
      { name: 'Schools', count: data.totalSchools || 0, icon: 'la la-school', color: '#3699ff' },
      { name: 'Students', count: data.totalStudents || 0, icon: 'la la-graduation-cap', color: '#10b981' },
      { name: 'Teachers', count: data.totalTeachers || 0, icon: 'la la-user', color: '#f6c23e' },
      { name: 'Classes', count: data.totalClasses || 0, icon: 'la fa-chalkboard', color: '#e74c3c' },
      { name: 'Lesson Attempts', count: data.totalLessonAttempts || 0, icon: 'la fa-book', color: '#8b5cf6' },
      { name: 'Attempt Events', count: data.totalAttemptEvents || 0, icon: 'la fa-chart-line', color: '#ec4899' }
    ];

    return (
      <div className="card card-custom">
        <div className="card-header border-0">
          <h3 className="card-title font-weight-bolder text-dark">{title}</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-head-custom table-vertical-center">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Total Count</th>
                  <th>Average per School</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity, index) => {
                  const averagePerSchool = data.totalSchools > 0 ? entity.count / data.totalSchools : 0;
                  return (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="symbol symbol-30 mr-3" style={{ backgroundColor: entity.color + '20' }}>
                            <span className="symbol-label">
                              <i className={`${entity.icon}`} style={{ color: entity.color }}></i>
                            </span>
                          </span>
                          <span className="font-weight-bold">{entity.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-weight-bolder">{formatNumber(entity.count)}</span>
                      </td>
                      <td>
                        <span className="font-weight-bold">{formatNumber(averagePerSchool)}</span>
                      </td>
                      <td>
                        <span className="badge badge-success badge-pill">
                          <i className="la la-arrow-up mr-1"></i>
                          12.5%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
