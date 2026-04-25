import React, { Component } from 'react';
import Data from '../../utils/data';
import { formatCurrency, formatNumber, calculateGrowthRate } from '../../utils/formatters';

// Modern UI Components
import { StatCard, MetricCard, TrendCard, EntityOverviewCard } from '../../components/dashboard/MetricCards';
import { RevenueChart, GrowthChart, EntityDistributionChart } from '../../components/dashboard/Charts';
import { TopPerformersTable, RecentActivityTable } from '../../components/dashboard/Tables';

class SchoolsDashboard extends Component {
  state = {
    // Raw data
    schools: [],
    students: [],
    teachers: [],
    classes: [],
    payments: [],
    charges: [],
    lessonAttempts: [],
    attemptEvents: [],
    smsEvents: [],
    institutionalDeposits: [],
    
    // Processed metrics
    saasMetrics: null,
    entityMetrics: null,
    financialMetrics: null,
    engagementMetrics: null,
    
    // UI state
    loading: true,
    error: null,
    selectedTimeRange: 'monthly',
    selectedSchool: null,
    refreshing: false,
    
    // Dashboard configuration
    activeWidgets: {
      overview: true,
      financials: true,
      entities: true,
      engagement: true,
      topPerformers: true,
      recentActivity: true
    }
  };

  componentDidMount() {
    this.initializeDashboard();
    this.setupDataSubscriptions();
  }

  componentWillUnmount() {
    this.cleanupSubscriptions();
  }

  initializeDashboard = () => {
    const savedTimeRange = localStorage.getItem('schools_dashboard_timeRange');
    const savedSchool = localStorage.getItem('schools_dashboard_selectedSchool');
    
    this.setState({
      selectedTimeRange: savedTimeRange || 'monthly',
      selectedSchool: savedSchool ? JSON.parse(savedSchool) : null
    });
  };

  setupDataSubscriptions = () => {
    // Subscribe to all relevant data sources
    const subscriptions = [
      Data.schools.subscribe(({ schools }) => this.updateData({ schools })),
      Data.students.subscribe(({ students }) => this.updateData({ students })),
      Data.teachers.subscribe(({ teachers }) => this.updateData({ teachers })),
      Data.classes.subscribe(({ classes }) => this.updateData({ classes })),
      Data.payments.subscribe(({ payments }) => this.updateData({ payments })),
      Data.charges.subscribe(({ charges }) => this.updateData({ charges })),
      Data.lessonAttempts.subscribe(({ lessonAttempts }) => this.updateData({ lessonAttempts })),
      Data.attemptEvents.subscribe(({ attemptEvents }) => this.updateData({ attemptEvents })),
      Data.smsEvents.subscribe(({ smsEvents }) => this.updateData({ smsEvents })),
      Data.institutionalDeposits.subscribe(({ institutionalDeposits }) => this.updateData({ institutionalDeposits }))
    ];

    this.subscriptions = subscriptions;
  };

  cleanupSubscriptions = () => {
    if (this.subscriptions) {
      this.subscriptions.forEach(unsub => unsub && unsub());
    }
  };

  updateData = (newData) => {
    this.setState(newData, () => {
      this.calculateAllMetrics();
    });
  };

  calculateAllMetrics = () => {
    this.setState({ loading: true });
    
    try {
      const {
        schools, students, teachers, classes, payments, charges,
        lessonAttempts, attemptEvents, smsEvents, institutionalDeposits,
        selectedTimeRange, selectedSchool
      } = this.state;

      // Filter data based on selections
      const filteredData = this.filterData({
        schools, students, teachers, classes, payments, charges,
        lessonAttempts, attemptEvents, smsEvents, institutionalDeposits
      }, selectedSchool, selectedTimeRange);

      // Calculate all metrics
      const saasMetrics = this.calculateSaaSMetrics(filteredData);
      const entityMetrics = this.calculateEntityMetrics(filteredData);
      const financialMetrics = this.calculateFinancialMetrics(filteredData);
      const engagementMetrics = this.calculateEngagementMetrics(filteredData);

      this.setState({
        saasMetrics,
        entityMetrics,
        financialMetrics,
        engagementMetrics,
        loading: false
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  filterData = (data, selectedSchool, timeRange) => {
    if (!selectedSchool) return data;

    const schoolId = selectedSchool.id;
    const filtered = {};

    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        filtered[key] = data[key].filter(item => {
          if (item.schoolId === schoolId) return true;
          if (item.school && item.school.id === schoolId) return true;
          return false;
        });
      } else {
        filtered[key] = data[key];
      }
    });

    return filtered;
  };

  calculateSaaSMetrics = (data) => {
    const { schools, payments, charges, institutionalDeposits } = data;
    
    // Calculate ARR (Annual Recurring Revenue)
    const monthlyRevenue = this.calculateMonthlyRevenue(payments);
    const arr = monthlyRevenue * 12;
    
    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = monthlyRevenue;
    
    // Calculate DRR (Daily Recurring Revenue)
    const drr = monthlyRevenue / 30;
    
    // Calculate Churn Rate (simplified)
    const activeSchools = schools.filter(s => s.isActive !== false).length;
    const totalSchools = schools.length;
    const churnRate = totalSchools > 0 ? ((totalSchools - activeSchools) / totalSchools) * 100 : 0;
    
    // Calculate Average Revenue Per School (ARPS)
    const arps = activeSchools > 0 ? arr / activeSchools : 0;
    
    // Calculate Customer Lifetime Value (CLV) - simplified
    const clv = arps * 36; // Assuming 3 years average lifetime
    
    // Calculate Growth Rates
    const revenueGrowth = this.calculateRevenueGrowth(payments);
    const schoolGrowth = this.calculateSchoolGrowth(schools);
    
    return {
      arr,
      mrr,
      drr,
      churnRate,
      arps,
      clv,
      revenueGrowth,
      schoolGrowth,
      activeSchools,
      totalSchools
    };
  };

  calculateMonthlyRevenue = (payments) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return payments
      .filter(p => {
        const date = new Date(p.time || p.createdAt || p.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  };

  calculateRevenueGrowth = (payments) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentRevenue = payments
      .filter(p => {
        const date = new Date(p.time || p.createdAt || p.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    const previousRevenue = payments
      .filter(p => {
        const date = new Date(p.time || p.createdAt || p.date);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    return previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  };

  calculateSchoolGrowth = (schools) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthSchools = schools.filter(s => {
      const date = new Date(s.createdAt || s.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    const previousMonthSchools = schools.filter(s => {
      const date = new Date(s.createdAt || s.created_at);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;
    
    return previousMonthSchools > 0 ? ((currentMonthSchools - previousMonthSchools) / previousMonthSchools) * 100 : 0;
  };

  calculateEntityMetrics = (data) => {
    const { schools, students, teachers, classes, lessonAttempts, attemptEvents } = data;
    
    return {
      totalSchools: schools.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalLessonAttempts: lessonAttempts.length,
      totalAttemptEvents: attemptEvents.length,
      averageStudentsPerSchool: schools.length > 0 ? students.length / schools.length : 0,
      averageTeachersPerSchool: schools.length > 0 ? teachers.length / schools.length : 0,
      averageClassesPerSchool: schools.length > 0 ? classes.length / schools.length : 0,
      averageStudentsPerClass: classes.length > 0 ? students.length / classes.length : 0
    };
  };

  calculateFinancialMetrics = (data) => {
    const { payments, charges, institutionalDeposits, schools } = data;
    
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalCharges = charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const totalDeposits = institutionalDeposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    
    const collectionRate = totalCharges > 0 ? (totalRevenue / totalCharges) * 100 : 0;
    const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;
    
    // Calculate outstanding balance
    const outstandingBalance = totalCharges - totalRevenue;
    
    return {
      totalRevenue,
      totalCharges,
      totalDeposits,
      collectionRate,
      averageTransaction,
      outstandingBalance,
      totalTransactions: payments.length
    };
  };

  calculateEngagementMetrics = (data) => {
    const { lessonAttempts, attemptEvents, smsEvents, students } = data;
    
    const activeStudents = new Set(lessonAttempts.map(la => la.studentId)).size;
    const studentEngagementRate = students.length > 0 ? (activeStudents / students.length) * 100 : 0;
    
    const averageAttemptsPerStudent = activeStudents > 0 ? lessonAttempts.length / activeStudents : 0;
    const completionRate = this.calculateCompletionRate(lessonAttempts);
    
    const totalSmsSent = smsEvents.length;
    const averageSmsPerStudent = students.length > 0 ? totalSmsSent / students.length : 0;
    
    return {
      activeStudents,
      studentEngagementRate,
      averageAttemptsPerStudent,
      completionRate,
      totalSmsSent,
      averageSmsPerStudent
    };
  };

  calculateCompletionRate = (lessonAttempts) => {
    if (lessonAttempts.length === 0) return 0;
    
    const completedAttempts = lessonAttempts.filter(la => la.status === 'completed' || la.completed === true).length;
    return (completedAttempts / lessonAttempts.length) * 100;
  };

  handleTimeRangeChange = (timeRange) => {
    this.setState({ selectedTimeRange: timeRange }, () => {
      localStorage.setItem('schools_dashboard_timeRange', timeRange);
      this.calculateAllMetrics();
    });
  };

  handleSchoolChange = (school) => {
    this.setState({ selectedSchool: school }, () => {
      localStorage.setItem('schools_dashboard_selectedSchool', JSON.stringify(school));
      this.calculateAllMetrics();
    });
  };

  handleRefresh = () => {
    this.setState({ refreshing: true });
    Data.init();
    setTimeout(() => {
      this.setState({ refreshing: false });
    }, 2000);
  };

  toggleWidget = (widgetName) => {
    this.setState(prevState => ({
      activeWidgets: {
        ...prevState.activeWidgets,
        [widgetName]: !prevState.activeWidgets[widgetName]
      }
    }));
  };

  renderOverviewSection = () => {
    const { saasMetrics, loading } = this.state;
    
    if (!saasMetrics || loading) return this.renderLoadingCards(4);

    return (
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <MetricCard
            title="Annual Recurring Revenue"
            value={formatCurrency(saasMetrics.arr)}
            subtitle="ARR"
            trend={saasMetrics.revenueGrowth}
            icon="flaticon2-graph-1"
            color="#3699ff"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(saasMetrics.mrr)}
            subtitle="MRR"
            icon="flaticon2-calendar"
            color="#10b981"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <MetricCard
            title="Active Schools"
            value={saasMetrics.activeSchools}
            subtitle={`of ${saasMetrics.totalSchools} total`}
            trend={saasMetrics.schoolGrowth}
            icon="flaticon2-building"
            color="#f6c23e"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <MetricCard
            title="Churn Rate"
            value={`${saasMetrics.churnRate.toFixed(1)}%`}
            subtitle="Monthly churn"
            trend={-saasMetrics.churnRate}
            icon="flaticon2-percentage"
            color={saasMetrics.churnRate > 10 ? "#e74c3c" : "#10b981"}
          />
        </div>
      </div>
    );
  };

  renderFinancialSection = () => {
    const { financialMetrics, saasMetrics, loading } = this.state;
    
    if (!financialMetrics || loading) return this.renderLoadingCards(3);

    return (
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(financialMetrics.totalRevenue)}
            subtitle="All time"
            icon="flaticon2-money"
            color="#3699ff"
          />
        </div>
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="Collection Rate"
            value={`${financialMetrics.collectionRate.toFixed(1)}%`}
            subtitle="Efficiency"
            icon="flaticon2-check-mark"
            color="#10b981"
          />
        </div>
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="Average Revenue/School"
            value={formatCurrency(saasMetrics.arps)}
            subtitle="Per school annually"
            icon="flaticon2-line-chart"
            color="#f6c23e"
          />
        </div>
      </div>
    );
  };

  renderEntitySection = () => {
    const { entityMetrics, loading } = this.state;
    
    if (!entityMetrics || loading) return this.renderLoadingCards(4);

    return (
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6">
          <EntityOverviewCard
            title="Students"
            value={entityMetrics.totalStudents}
            subtitle={`${entityMetrics.averageStudentsPerSchool.toFixed(1)} per school`}
            icon="flaticon2-group"
            color="#3699ff"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <EntityOverviewCard
            title="Teachers"
            value={entityMetrics.totalTeachers}
            subtitle={`${entityMetrics.averageTeachersPerSchool.toFixed(1)} per school`}
            icon="flaticon2-user"
            color="#10b981"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <EntityOverviewCard
            title="Classes"
            value={entityMetrics.totalClasses}
            subtitle={`${entityMetrics.averageClassesPerSchool.toFixed(1)} per school`}
            icon="flaticon2-class"
            color="#f6c23e"
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <EntityOverviewCard
            title="Lesson Attempts"
            value={entityMetrics.totalLessonAttempts}
            subtitle="Total engagement"
            icon="flaticon2-graduation-cap"
            color="#e74c3c"
          />
        </div>
      </div>
    );
  };

  renderEngagementSection = () => {
    const { engagementMetrics, loading } = this.state;
    
    if (!engagementMetrics || loading) return this.renderLoadingCards(3);

    return (
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="Student Engagement"
            value={`${engagementMetrics.studentEngagementRate.toFixed(1)}%`}
            subtitle={`${engagementMetrics.activeStudents} active students`}
            icon="flaticon2-heart-rate-monitor"
            color="#3699ff"
          />
        </div>
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="Completion Rate"
            value={`${engagementMetrics.completionRate.toFixed(1)}%`}
            subtitle="Lesson completion"
            icon="flaticon2-check-mark"
            color="#10b981"
          />
        </div>
        <div className="col-lg-4 col-md-6">
          <MetricCard
            title="SMS Sent"
            value={engagementMetrics.totalSmsSent}
            subtitle={`${engagementMetrics.averageSmsPerStudent.toFixed(1)} per student`}
            icon="flaticon2-sms"
            color="#f6c23e"
          />
        </div>
      </div>
    );
  };

  renderChartsSection = () => {
    const { schools, payments, saasMetrics, entityMetrics, loading } = this.state;

    return (
      <div className="row mb-4">
        <div className="col-lg-8">
          <RevenueChart
            data={payments}
            schools={schools}
            loading={loading}
            title="Revenue Trends"
          />
        </div>
        <div className="col-lg-4">
          <EntityDistributionChart
            data={entityMetrics}
            loading={loading}
            title="Entity Distribution"
          />
        </div>
      </div>
    );
  };

  renderTablesSection = () => {
    const { schools, payments, loading } = this.state;

    return (
      <div className="row mb-4">
        <div className="col-lg-6">
          <TopPerformersTable
            schools={schools}
            payments={payments}
            loading={loading}
            title="Top Performing Schools"
          />
        </div>
        <div className="col-lg-6">
          <RecentActivityTable
            schools={schools}
            payments={payments}
            loading={loading}
            title="Recent Activity"
          />
        </div>
      </div>
    );
  };

  renderFilters = () => {
    const { schools, selectedTimeRange, selectedSchool, refreshing } = this.state;

    return (
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label className="form-label">Time Range</label>
              <select
                className="form-control"
                value={selectedTimeRange}
                onChange={(e) => this.handleTimeRangeChange(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">School</label>
              <select
                className="form-control"
                value={selectedSchool ? selectedSchool.id : ""}
                onChange={(e) => {
                  const school = schools.find(s => s.id === e.target.value);
                  this.handleSchoolChange(school || null);
                }}
              >
                <option value="">All Schools</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-right">
              <button
                className="btn btn-primary mr-2"
                onClick={this.handleRefresh}
                disabled={refreshing}
              >
                <i className={`la la-refresh ${refreshing ? 'la-spin' : ''}`}></i>
                Refresh
              </button>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  <i className="la la-print"></i> Print
                </button>
                <button className="btn btn-secondary" onClick={() => this.exportData()}>
                  <i className="la la-download"></i> Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderLoadingCards = (count) => {
    return (
      <div className="row mb-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="col-lg-3 col-md-6">
            <div className="card card-custom" style={{ height: '140px' }}>
              <div className="card-body">
                <div className="spinner spinner-primary mr-3"></div>
                Loading...
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  exportData = () => {
    const { saasMetrics, entityMetrics, financialMetrics, engagementMetrics } = this.state;
    
    const data = {
      saasMetrics,
      entityMetrics,
      financialMetrics,
      engagementMetrics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schools-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    const { loading, error, activeWidgets } = this.state;

    if (error) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="alert alert-danger">
              <h5>Error loading dashboard</h5>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={this.calculateAllMetrics}>
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="schools-dashboard">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="font-weight-bold">SaaS Schools Dashboard</h2>
          <div className="btn-group">
            {Object.keys(activeWidgets).map(widget => (
              <button
                key={widget}
                className={`btn ${activeWidgets[widget] ? 'btn-primary' : 'btn-light'}`}
                onClick={() => this.toggleWidget(widget)}
              >
                {widget.charAt(0).toUpperCase() + widget.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {this.renderFilters()}
        
        {activeWidgets.overview && this.renderOverviewSection()}
        {activeWidgets.financials && this.renderFinancialSection()}
        {activeWidgets.entities && this.renderEntitySection()}
        {activeWidgets.engagement && this.renderEngagementSection()}
        {activeWidgets.charts && this.renderChartsSection()}
        {activeWidgets.topPerformers && this.renderTablesSection()}

        {loading && (
          <div className="text-center py-10">
            <div className="spinner spinner-primary mr-3"></div>
            Processing dashboard data...
          </div>
        )}
      </div>
    );
  }
}

export default SchoolsDashboard;
