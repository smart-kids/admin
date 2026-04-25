import React, { Component } from 'react';
import Data from '../../utils/data';
import { formatCurrency, formatNumber, calculateGrowthRate, groupByPeriod } from '../../utils/formatters';

// Enhanced UI Components
import { ModernMetricCard, BusinessRevenueCard, PerformanceCard } from '../../components/dashboard/enhanced/MetricCards';
import { V8DataTable, RevenueTable, PerformanceTable } from '../../components/dashboard/enhanced/V8Tables';
import { ModernChart, RevenueGrowthChart, EntityChart } from '../../components/dashboard/enhanced/Charts';
import { QuickActions, FilterPanel } from '../../components/dashboard/enhanced/Controls';
import { SchoolRevenueBreakdown, BusinessSummaryCard } from '../../components/dashboard/enhanced/SchoolRevenueBreakdown';

class EnhancedSchoolsDashboard extends Component {
  state = {
    // Raw data
    schools: [],
    students: [],
    teachers: [],
    classes: [],
    payments: [],
    charges: [],
    feeStructures: [],
    lessonAttempts: [],
    attemptEvents: [],
    smsEvents: [],
    institutionalDeposits: [],
    books: [],
    
    // Processed metrics
    saasMetrics: null,
    entityMetrics: null,
    financialMetrics: null,
    engagementMetrics: null,
    revenueProjections: null,
    
    // UI state
    loading: true,
    error: null,
    selectedTimeRange: 'monthly',
    selectedSchool: null,
    refreshing: false,
    viewMode: 'dashboard', // 'dashboard', 'table', 'analytics'
    
    // Advanced filters
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
      end: new Date()
    },
    searchTerm: '',
    sortBy: 'revenue',
    sortOrder: 'desc'
  };

  componentDidMount() {
    this.initializeDashboard();
    this.setupDataSubscriptions();
  }

  componentWillUnmount() {
    this.cleanupSubscriptions();
  }

  initializeDashboard = () => {
    const savedTimeRange = localStorage.getItem('enhanced_schools_dashboard_timeRange');
    const savedSchool = localStorage.getItem('enhanced_schools_dashboard_selectedSchool');
    
    this.setState({
      selectedTimeRange: savedTimeRange || 'monthly',
      selectedSchool: savedSchool ? JSON.parse(savedSchool) : null
    });
  };

  setupDataSubscriptions = () => {
    const subscriptions = [
      Data.schools.subscribe(({ schools }) => this.updateData({ schools })),
      Data.students.subscribe(({ students }) => this.updateData({ students })),
      Data.teachers.subscribe(({ teachers }) => this.updateData({ teachers })),
      Data.classes.subscribe(({ classes }) => this.updateData({ classes })),
      Data.payments.subscribe(({ payments }) => this.updateData({ payments })),
      Data.charges.subscribe(({ charges }) => this.updateData({ charges })),
      Data.feeStructures.subscribe(({ feeStructures }) => this.updateData({ feeStructures })),
      Data.lessonAttempts.subscribe(({ lessonAttempts }) => this.updateData({ lessonAttempts })),
      Data.attemptEvents.subscribe(({ attemptEvents }) => this.updateData({ attemptEvents })),
      Data.smsEvents.subscribe(({ smsEvents }) => this.updateData({ smsEvents })),
      Data.institutionalDeposits.subscribe(({ institutionalDeposits }) => this.updateData({ institutionalDeposits })),
      Data.books.subscribe(({ books }) => this.updateData({ books }))
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
        schools, students, teachers, classes, payments, charges, feeStructures,
        lessonAttempts, attemptEvents, smsEvents, institutionalDeposits, books,
        selectedTimeRange, selectedSchool
      } = this.state;

      // Filter data based on selections
      const filteredData = this.filterData({
        schools, students, teachers, classes, payments, charges, feeStructures,
        lessonAttempts, attemptEvents, smsEvents, institutionalDeposits, books
      }, selectedSchool, selectedTimeRange);

      // Calculate all metrics
      const saasMetrics = this.calculateSaaSMetrics(filteredData, selectedTimeRange);
      const entityMetrics = this.calculateEntityMetrics(filteredData);
      const financialMetrics = this.calculateFinancialMetrics(filteredData, selectedTimeRange);
      const engagementMetrics = this.calculateEngagementMetrics(filteredData);
      const revenueProjections = this.calculateRevenueProjections(filteredData, selectedTimeRange);

      this.setState({
        saasMetrics,
        entityMetrics,
        financialMetrics,
        engagementMetrics,
        revenueProjections,
        loading: false
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  filterData = (data, selectedSchool, timeRange) => {
    const filtered = {};

    // Get date range for filtering
    const dateRange = this.getDateRangeForTimeRange(timeRange);

    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        filtered[key] = data[key].filter(item => {
          // School filtering
          if (selectedSchool) {
            const schoolId = selectedSchool.id;
            if (item.schoolId !== schoolId && 
                (!item.school || item.school.id !== schoolId) &&
                item.id !== schoolId) { // For schools array itself
              return false;
            }
          }

          // Time range filtering for payment/charge related data
          if (['payments', 'charges', 'lessonAttempts', 'attemptEvents', 'smsEvents'].includes(key)) {
            const itemDate = new Date(item.time || item.createdAt || item.date);
            if (itemDate < dateRange.start || itemDate > dateRange.end) {
              return false;
            }
          }

          return true;
        });
      } else {
        filtered[key] = data[key];
      }
    });

    // If a specific school is selected, also filter the schools array
    if (selectedSchool && Array.isArray(data.schools)) {
      filtered.schools = data.schools.filter(school => school.id === selectedSchool.id);
    }

    return filtered;
  };

  getDateRangeForTimeRange = (timeRange) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (timeRange) {
      case 'daily':
        start.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1); // Default to monthly
    }

    return { start, end };
  };

  calculateSaaSMetrics = (data, timeRange = 'monthly') => {
    const { schools, payments, charges, institutionalDeposits } = data;
    
    // Calculate ARR (Annual Recurring Revenue)
    const monthlyRevenue = this.calculateMonthlyRevenue(payments, timeRange);
    const arr = monthlyRevenue * 12;
    
    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = monthlyRevenue;
    
    // Calculate DRR (Daily Recurring Revenue)
    const drr = monthlyRevenue / 30;
    
    // Calculate Churn Rate
    const activeSchools = schools.filter(s => s.isActive !== false).length;
    const totalSchools = schools.length;
    const churnRate = totalSchools > 0 ? ((totalSchools - activeSchools) / totalSchools) * 100 : 0;
    
    // Calculate Average Revenue Per School (ARPS)
    const arps = activeSchools > 0 ? arr / activeSchools : 0;
    
    // Calculate Customer Lifetime Value (CLV)
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

  calculateMonthlyRevenue = (payments, timeRange = 'monthly') => {
    if (!payments || payments.length === 0) return 0;
    
    // For business model projections, use the current time range to calculate
    const dateRange = this.getDateRangeForTimeRange(timeRange);
    const daysInRange = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    
    // If we have actual payments in the time range, use them
    const filteredPayments = payments.filter(p => {
      const date = new Date(p.time || p.createdAt || p.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    if (filteredPayments.length > 0) {
      return filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    }
    
    // Otherwise, return 0 (let business model handle projections)
    return 0;
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
    const { schools, students, teachers, classes, lessonAttempts, attemptEvents, books } = data;
    
    // Calculate total students from nested school structure (more accurate for all schools)
    const totalStudentsInSchools = schools.reduce((sum, school) => {
      const schoolStudents = (school.students && Array.isArray(school.students)) ? school.students.length : 
                              (school.studentCount || 0);
      return sum + schoolStudents;
    }, 0);
    
    // Calculate total teachers from nested school structure
    const totalTeachersInSchools = schools.reduce((sum, school) => {
      const schoolTeachers = (school.teachers && Array.isArray(school.teachers)) ? school.teachers.length : 
                              (school.teacherCount || 0);
      return sum + schoolTeachers;
    }, 0);
    
    // Calculate total classes from nested school structure
    const totalClassesInSchools = schools.reduce((sum, school) => {
      const schoolClasses = (school.classes && Array.isArray(school.classes)) ? school.classes.length : 
                            (school.classCount || 0);
      return sum + schoolClasses;
    }, 0);
    
    // Use the nested counts as primary, fallback to flat arrays if nested counts are 0
    const totalStudents = totalStudentsInSchools > 0 ? totalStudentsInSchools : students.length;
    const totalTeachers = totalTeachersInSchools > 0 ? totalTeachersInSchools : teachers.length;
    const totalClasses = totalClassesInSchools > 0 ? totalClassesInSchools : classes.length;
    
    return {
      totalSchools: schools.length,
      totalStudents, // Use accurate nested count
      totalStudentsInSchools, // Keep for reference
      totalTeachers, // Use accurate nested count
      totalClasses, // Use accurate nested count
      totalLessonAttempts: lessonAttempts.length,
      totalAttemptEvents: attemptEvents.length,
      totalBooks: books ? books.length : 0,
      averageStudentsPerSchool: schools.length > 0 ? totalStudents / schools.length : 0,
      averageTeachersPerSchool: schools.length > 0 ? totalTeachers / schools.length : 0,
      averageClassesPerSchool: schools.length > 0 ? totalClasses / schools.length : 0,
      averageStudentsPerClass: totalClasses > 0 ? totalStudents / totalClasses : 0,
      // Detailed breakdown for debugging
      studentsPerSchool: schools.map(school => ({
        schoolId: school.id,
        schoolName: school.name,
        studentCount: (school.students && Array.isArray(school.students)) ? school.students.length : 
                      (school.studentCount || 0)
      })),
      teachersPerSchool: schools.map(school => ({
        schoolId: school.id,
        schoolName: school.name,
        teacherCount: (school.teachers && Array.isArray(school.teachers)) ? school.teachers.length : 
                      (school.teacherCount || 0)
      })),
      classesPerSchool: schools.map(school => ({
        schoolId: school.id,
        schoolName: school.name,
        classCount: (school.classes && Array.isArray(school.classes)) ? school.classes.length : 
                     (school.classCount || 0)
      }))
    };
  };

  calculateFinancialMetrics = (data, timeRange = 'monthly') => {
    const { payments, charges, institutionalDeposits, schools } = data;
    
    // Filter payments and charges by time range
    const dateRange = this.getDateRangeForTimeRange(timeRange);
    
    const filteredPayments = payments.filter(p => {
      const date = new Date(p.time || p.createdAt || p.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    const filteredCharges = charges.filter(c => {
      const date = new Date(c.time || c.createdAt || c.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalCharges = filteredCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const totalDeposits = institutionalDeposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    
    const collectionRate = totalCharges > 0 ? (totalRevenue / totalCharges) * 100 : 0;
    const averageTransaction = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
    
    return {
      totalRevenue,
      totalCharges,
      totalDeposits,
      collectionRate,
      averageTransaction,
      outstandingBalance: totalCharges - totalRevenue,
      totalTransactions: filteredPayments.length
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

  calculateRevenueProjections = (data, timeRange = 'monthly') => {
    const { schools, students, feeStructures, payments } = data;
    
    // Business Model: Students pay 1,000 KES per term (3 terms per year, 1 term = 3 months)
    const TERM_FEE = 1000; // 1K per term
    const TERMS_PER_YEAR = 3;
    const MONTHS_PER_TERM = 3;
    const ANNUAL_FEE_PER_STUDENT = TERM_FEE * TERMS_PER_YEAR;
    const MONTHLY_FEE_PER_STUDENT = TERM_FEE / MONTHS_PER_TERM; // Monthly equivalent during term
    
    // Calculate total students from nested school structure (more accurate)
    const totalStudentsFromSchools = schools.reduce((sum, school) => {
      const schoolStudents = (school.students && Array.isArray(school.students)) ? school.students.length : 
                              (school.studentCount || 0);
      return sum + schoolStudents;
    }, 0);
    
    // Use the more accurate nested count, fallback to flat student count if needed
    const totalStudents = totalStudentsFromSchools > 0 ? totalStudentsFromSchools : students.length;
    
    // Calculate business revenue projections
    const businessAnnualRevenue = totalStudents * ANNUAL_FEE_PER_STUDENT;
    const businessMonthlyRevenue = totalStudents * MONTHLY_FEE_PER_STUDENT;
    
    // Calculate revenue breakdown per school
    const schoolRevenueBreakdown = schools.map(school => {
      // Use the same approach as navbar - students are nested under schools in the tree structure
      const schoolStudents = (school.students && Array.isArray(school.students)) ? school.students.length : 
                              (school.studentCount || 0);
      
      return {
        schoolId: school.id,
        schoolName: school.name,
        studentCount: schoolStudents,
        annualRevenue: schoolStudents * ANNUAL_FEE_PER_STUDENT,
        monthlyRevenue: schoolStudents * MONTHLY_FEE_PER_STUDENT, // Monthly during term
        termRevenue: schoolStudents * TERM_FEE,
        revenuePerStudent: ANNUAL_FEE_PER_STUDENT
      };
    }).sort((a, b) => b.annualRevenue - a.annualRevenue);
    
    // Group fee structures by type and calculate average fees (for comparison)
    const feeAnalysis = {};
    feeStructures.forEach(fs => {
      if (fs.isActive) {
        const feeType = fs.feeType || 'OTHER';
        if (!feeAnalysis[feeType]) {
          feeAnalysis[feeType] = { total: 0, count: 0, average: 0 };
        }
        feeAnalysis[feeType].total += parseFloat(fs.amount || 0);
        feeAnalysis[feeType].count += 1;
      }
    });
    
    // Calculate averages
    Object.keys(feeAnalysis).forEach(feeType => {
      const analysis = feeAnalysis[feeType];
      analysis.average = analysis.count > 0 ? analysis.total / analysis.count : 0;
    });
    
    // Calculate average term fee per student from actual fee structures
    const averageTermFee = Object.values(feeAnalysis).reduce((sum, analysis) => sum + analysis.average, 0);
    
    // Calculate current vs potential using time range filtered payments
    const currentMonthlyRevenue = this.calculateMonthlyRevenue(payments, timeRange);
    const revenueGap = businessMonthlyRevenue - currentMonthlyRevenue;
    const utilizationRate = businessMonthlyRevenue > 0 ? (currentMonthlyRevenue / businessMonthlyRevenue) * 100 : 0;
    
    // Business metrics
    const totalAnnualRevenue = businessAnnualRevenue;
    const totalMonthlyRevenue = businessMonthlyRevenue;
    const totalTermRevenue = totalStudents * TERM_FEE;
    
    return {
      // Business Model (1K per term, 3 months per term)
      businessModel: {
        termFee: TERM_FEE,
        termsPerYear: TERMS_PER_YEAR,
        monthsPerTerm: MONTHS_PER_TERM,
        annualFeePerStudent: ANNUAL_FEE_PER_STUDENT,
        monthlyFeePerStudent: MONTHLY_FEE_PER_STUDENT // Monthly equivalent during term
      },
      // Revenue Projections
      totalStudents,
      businessAnnualRevenue,
      businessMonthlyRevenue, // Monthly during term
      totalTermRevenue,
      currentMonthlyRevenue,
      revenueGap,
      utilizationRate,
      // School Breakdown
      schoolRevenueBreakdown,
      // Fee Analysis (for comparison)
      feeAnalysis,
      averageTermFee,
      // Summary Stats
      topPerformingSchools: schoolRevenueBreakdown.slice(0, 5),
      averageRevenuePerSchool: schools.length > 0 ? businessAnnualRevenue / schools.length : 0,
      averageStudentsPerSchool: schools.length > 0 ? totalStudents / schools.length : 0
    };
  };

  handleViewModeChange = (mode) => {
    this.setState({ viewMode: mode });
  };

  handleTimeRangeChange = (timeRange) => {
    this.setState({ selectedTimeRange: timeRange }, () => {
      localStorage.setItem('enhanced_schools_dashboard_timeRange', timeRange);
      this.calculateAllMetrics();
    });
  };

  handleSchoolChange = (school) => {
    this.setState({ selectedSchool: school }, () => {
      localStorage.setItem('enhanced_schools_dashboard_selectedSchool', JSON.stringify(school));
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

  handleSearch = (searchTerm) => {
    this.setState({ searchTerm });
  };

  handleSort = (sortBy, sortOrder) => {
    this.setState({ sortBy, sortOrder });
  };

  exportData = () => {
    const { saasMetrics, entityMetrics, financialMetrics, engagementMetrics, revenueProjections } = this.state;
    
    const data = {
      saasMetrics,
      entityMetrics,
      financialMetrics,
      engagementMetrics,
      revenueProjections,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-schools-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  renderDashboardView = () => {
    const { saasMetrics, entityMetrics, financialMetrics, engagementMetrics, revenueProjections, loading } = this.state;

    return (
      <div className="enhanced-dashboard">
        {/* Business Overview Section */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Total Business Revenue"
              value={revenueProjections?.businessAnnualRevenue || 0}
              subtitle="Annually @ 1K/term per student"
              icon="la la-money"
              color="primary"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Monthly Business Revenue"
              value={revenueProjections?.businessMonthlyRevenue || 0}
              subtitle="3 terms per year"
              icon="la la-line-chart"
              color="success"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Total Students"
              value={revenueProjections?.totalStudents || 0}
              subtitle="Paying 1K per term"
              icon="la la-graduation-cap"
              color="info"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Revenue Per School"
              value={revenueProjections?.averageRevenuePerSchool || 0}
              subtitle="Annual average"
              icon="la la-building"
              color="warning"
            />
          </div>
        </div>

        {/* Business Revenue Analysis */}
        <div className="row mb-4">
          <div className="col-lg-8">
            <BusinessRevenueCard
              revenueProjections={revenueProjections}
              loading={loading}
            />
          </div>
          <div className="col-lg-4">
            <BusinessSummaryCard
              revenueProjections={revenueProjections}
              loading={loading}
            />
          </div>
        </div>

        {/* School Revenue Breakdown */}
        <div className="row mb-4">
          <div className="col-12">
            <SchoolRevenueBreakdown
              schoolRevenueBreakdown={revenueProjections?.schoolRevenueBreakdown || []}
              loading={loading}
            />
          </div>
        </div>

        {/* SaaS Business Metrics */}
        <div className="row mb-4">
          <div className="col-lg-4">
            <PerformanceCard
              title="SaaS Business Metrics"
              metrics={[
                { label: 'Monthly Recurring Revenue', value: `KES ${(saasMetrics?.mrr || 0).toLocaleString()}`, color: '#10b981' },
                { label: 'Annual Recurring Revenue', value: `KES ${(saasMetrics?.arr || 0).toLocaleString()}`, color: '#3699ff' },
                { label: 'Average Revenue Per School', value: `KES ${(saasMetrics?.arps || 0).toLocaleString()}`, color: '#f6c23e' },
                { label: 'Revenue Growth Rate', value: `${(saasMetrics?.revenueGrowth || 0).toFixed(1)}%`, color: '#8b5cf6' }
              ]}
              loading={loading}
            />
          </div>
          <div className="col-lg-4">
            <PerformanceCard
              title="Operational Metrics"
              metrics={[
                { label: 'Student Enrollment', value: `${entityMetrics?.totalStudentsInSchools || 0}`, color: '#3699ff' },
                { label: 'Average Students/School', value: `${(entityMetrics?.averageStudentsPerSchool || 0).toFixed(1)}`, color: '#10b981' },
                { label: 'Active Schools', value: `${saasMetrics?.activeSchools || 0}`, color: '#f6c23e' },
                { label: 'Teacher Coverage', value: `${entityMetrics?.totalTeachers || 0} teachers`, color: '#8b5cf6' }
              ]}
              loading={loading}
            />
          </div>
          <div className="col-lg-4">
            <PerformanceCard
              title="Financial Health"
              metrics={[
                { label: 'Collection Efficiency', value: `${(financialMetrics?.collectionRate || 0).toFixed(1)}%`, color: '#10b981' },
                { label: 'Monthly Utilization', value: `${(revenueProjections?.utilizationRate || 0).toFixed(1)}%`, color: '#3699ff' },
                { label: 'Average Transaction', value: `KES ${(financialMetrics?.averageTransaction || 0).toFixed(0)}`, color: '#f6c23e' },
                { label: 'Outstanding Balance', value: `KES ${(financialMetrics?.outstandingBalance || 0).toLocaleString()}`, color: '#e74c3c' }
              ]}
              loading={loading}
            />
          </div>
        </div>

        {/* Entity Overview */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Total Students"
              value={entityMetrics?.totalStudents || 0}
              subtitle={`${entityMetrics?.averageStudentsPerSchool?.toFixed(1) || 0} per school`}
              icon="la la-users"
              color="primary"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Total Teachers"
              value={entityMetrics?.totalTeachers || 0}
              subtitle={`${entityMetrics?.averageTeachersPerSchool?.toFixed(1) || 0} per school`}
              icon="la la-user"
              color="success"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Total Classes"
              value={entityMetrics?.totalClasses || 0}
              subtitle={`${entityMetrics?.averageClassesPerSchool?.toFixed(1) || 0} per school`}
              icon="la la-school"
              color="warning"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <ModernMetricCard
              title="Library Books"
              value={entityMetrics?.totalBooks || 0}
              subtitle="Educational resources"
              icon="la la-book"
              color="danger"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="row mb-4">
          <div className="col-lg-8">
            <ModernChart
              title="Revenue Trends & Projections"
              data={this.state.payments}
              projections={revenueProjections}
              loading={loading}
            />
          </div>
          <div className="col-lg-4">
            <EntityChart
              title="Entity Distribution"
              data={entityMetrics}
              loading={loading}
            />
          </div>
        </div>
      </div>
    );
  };

  renderTableView = () => {
    const { schools, payments, loading, searchTerm, sortBy, sortOrder } = this.state;

    return (
      <div className="enhanced-table-view">
        <div className="row mb-6">
          <div className="col-12">
            <V8DataTable
              data={schools}
              payments={payments}
              loading={loading}
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSearch={this.handleSearch}
              onSort={this.handleSort}
            />
          </div>
        </div>
      </div>
    );
  };

  renderAnalyticsView = () => {
    const { saasMetrics, entityMetrics, financialMetrics, engagementMetrics, revenueProjections, loading } = this.state;

    return (
      <div className="enhanced-analytics-view">
        <div className="row mb-6">
          <div className="col-lg-6">
            <RevenueTable
              title="Revenue Analysis"
              data={{
                current: financialMetrics?.totalRevenue || 0,
                potential: revenueProjections?.potentialAnnualRevenue || 0,
                gap: revenueProjections?.revenueGap || 0,
                utilization: revenueProjections?.utilizationRate || 0
              }}
              loading={loading}
            />
          </div>
          <div className="col-lg-6">
            <PerformanceTable
              title="Performance Metrics"
              data={{
                students: entityMetrics?.totalStudents || 0,
                teachers: entityMetrics?.totalTeachers || 0,
                classes: entityMetrics?.totalClasses || 0,
                engagement: engagementMetrics?.studentEngagementRate || 0,
                completion: engagementMetrics?.completionRate || 0,
                collection: financialMetrics?.collectionRate || 0
              }}
              loading={loading}
            />
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { loading, error, viewMode, schools, selectedTimeRange, selectedSchool, refreshing } = this.state;

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
      <div className="enhanced-schools-dashboard">
        <div style={{ flex: 1 }}>
          {/* Unified Filter Panel with all controls in single row */}
          <FilterPanel
            schools={schools}
            selectedTimeRange={selectedTimeRange}
            selectedSchool={selectedSchool}
            onTimeRangeChange={this.handleTimeRangeChange}
            onSchoolChange={this.handleSchoolChange}
            onViewModeChange={this.handleViewModeChange}
            viewMode={viewMode}
            onRefresh={this.handleRefresh}
            onExport={this.exportData}
            refreshing={refreshing}
          />

          {/* Content based on view mode */}
          {loading && (
            <div className="text-center py-20">
              <div className="spinner spinner-primary mr-3"></div>
              <h3 className="mt-5">Loading enhanced dashboard data...</h3>
            </div>
          )}

          {!loading && (
            <>
              {viewMode === 'dashboard' && this.renderDashboardView()}
              {viewMode === 'table' && this.renderTableView()}
              {viewMode === 'analytics' && this.renderAnalyticsView()}
            </>
          )}
        </div>
      </div>
    );
  }
}

export default EnhancedSchoolsDashboard;
