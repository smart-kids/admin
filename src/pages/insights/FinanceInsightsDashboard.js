import React, { Component } from 'react';
import Data from '../../utils/data';
import ComparisonDataService from '../../services/ComparisonDataService';
import ComparisonMetricsEngine from '../../services/ComparisonMetricsEngine';

// Import enhanced components
import { EnhancedStatCard, AdvancedStatCard } from '../../components/charts/EnhancedStatCard';

// Import finance charts
import { RevenueTrendChart, RevenueComparisonChart } from '../../components/charts/finance/RevenueTrendChart';
import { PaymentMethodChart, PaymentMethodTrendChart } from '../../components/charts/finance/PaymentMethodChart';
import { FeeHeatmapChart, FeeTreemapChart } from '../../components/charts/finance/FeeHeatmapChart';
import { StreamRadarChart, StreamComparisonChart } from '../../components/charts/finance/StreamRadarChart';
import { CashFlowChart, CashFlowTimelineChart, CashFlowSummaryChart } from '../../components/charts/finance/CashFlowChart';

class FinanceInsightsDashboard extends Component {
  state = {
    // Raw data
    classes: [],
    payments: [],
    charges: [],
    feeStructures: [],
    parents: [],
    students: [],
    terms: [],
    
    // Processed data
    processedData: null,
    comparisonData: null,
    metricsData: null,
    
    // Filters and UI state
    selectedClasses: [],
    selectedStreams: [],
    selectedTimeRange: 'monthly',
    selectedTerm: '',
    loading: true,
    error: null,
    
    // Chart configurations
    activeCharts: {
      revenueTrend: true,
      paymentMethods: true,
      feeHeatmap: true,
      streamRadar: true,
      cashFlow: true
    },
    
    // Dashboard layout
    layoutMode: 'grid', // 'grid', 'list', 'compact'
    showComparison: false,
    showSparklines: true,
    comparisonMode: 'none' // 'none', 'previousTerm', 'previousYear', 'classCompare'
  };

  constructor(props) {
    super(props);
    this.comparisonService = new ComparisonDataService();
    this.metricsEngine = new ComparisonMetricsEngine();
  }

  componentDidMount() {
    this.initializeData();
    this.setupSubscriptions();
  }

  componentWillUnmount() {
    this.cleanupSubscriptions();
  }

  initializeData = () => {
    // Restore selections from localStorage
    const savedClasses = localStorage.getItem('finance_insights_selectedClasses');
    const savedStreams = localStorage.getItem('finance_insights_selectedStreams');
    const savedTimeRange = localStorage.getItem('finance_insights_timeRange');
    const savedTerm = localStorage.getItem('finance_insights_selectedTerm');

    this.setState({
      selectedClasses: savedClasses ? JSON.parse(savedClasses) : [],
      selectedStreams: savedStreams ? JSON.parse(savedStreams) : [],
      selectedTimeRange: savedTimeRange || 'monthly',
      selectedTerm: savedTerm || ''
    });
  };

  setupSubscriptions = () => {
    // Use props data directly instead of subscriptions
    const { classes, payments, charges, feeStructures, parents, students, terms } = this.props;
    
    this.updateData({ 
      classes: classes || [], 
      payments: payments || [], 
      charges: charges || [], 
      feeStructures: feeStructures || [], 
      parents: parents || [], 
      students: students || [], 
      terms: terms || [] 
    });
  };

  cleanupSubscriptions = () => {
    if (this.unsubClasses) this.unsubClasses();
    if (this.unsubPayments) this.unsubPayments();
    if (this.unsubCharges) this.unsubCharges();
    if (this.unsubFeeStructures) this.unsubFeeStructures();
    if (this.unsubParents) this.unsubParents();
    if (this.unsubStudents) this.unsubStudents();
    if (this.unsubTerms) this.unsubTerms();
  };

  updateData = (newData) => {
    this.setState(newData, () => {
      this.processData();
    });
  };

  processData = () => {
    const { payments, charges, feeStructures, classes, students, parents, terms } = this.state;
    const { selectedClass, selectedTerm } = this.props;
    
    if (!payments || !classes) {
      this.setState({ loading: false });
      return;
    }

    this.setState({ loading: true });

    try {
      // Filter data based on selected filters
      let filteredPayments = payments;
      let filteredCharges = charges;
      let filteredFeeStructures = feeStructures;
      let filteredClasses = classes;
      let filteredStudents = students;
      
      if (selectedClass) {
        filteredClasses = classes.filter(cls => String(cls.id) === selectedClass);
        filteredStudents = students.filter(student => String(student.class?.id || student.class) === selectedClass);
        filteredPayments = payments.filter(payment => {
          const student = students.find(s => String(s.id) === String(payment.student?.id || payment.student));
          return student && String(student.class?.id || student.class) === selectedClass;
        });
        filteredCharges = charges.filter(charge => String(charge.class?.id || charge.class) === selectedClass);
        filteredFeeStructures = feeStructures.filter(fs => String(fs.class?.id || fs.class) === selectedClass);
      }
      
      if (selectedTerm) {
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.time || payment.createdAt || payment.date);
          // Simple term filtering - this could be enhanced with proper term date ranges
          return true; // For now, don't filter by term as payment data might not have term info
        });
      }
      
      // Process financial data
      const processedData = this.processFinancialData(filteredPayments, filteredCharges, filteredFeeStructures, filteredClasses, filteredStudents, parents);
      
      // Generate comparison data
      const comparisonData = this.generateComparisonData(processedData);
      
      // Calculate metrics
      const metricsData = this.calculateMetrics(processedData);

      this.setState({
        processedData,
        comparisonData,
        metricsData,
        loading: false
      });
    } catch (error) {
      console.error('Error processing data:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  processFinancialData = (payments, charges, feeStructures, classes, students, parents) => {
    // Group payments by class and stream
    const classGroups = {};
    
    classes.forEach(cls => {
      const classId = String(cls.id);
      classGroups[classId] = {
        classId,
        className: cls.name || `Class ${classId}`,
        payments: [],
        charges: [],
        feeStructure: {},
        students: students.filter(s => String(s.class?.id || s.class) === classId),
        streams: {}
      };
    });

    // Process payments
    payments.forEach(payment => {
      const studentId = String(payment.student?.id || payment.student);
      const student = students.find(s => String(s.id) === studentId);
      
      if (student) {
        const classId = String(student.class?.id || student.class);
        if (classGroups[classId]) {
          classGroups[classId].payments.push({
            ...payment,
            studentName: student.names,
            processedAmount: parseFloat(payment.amount || 0)
          });
        }
      }
    });

    // Process charges and fee structures
    charges.forEach(charge => {
      const classId = String(charge.class?.id || charge.class);
      if (classGroups[classId]) {
        classGroups[classId].charges.push(charge);
      }
    });

    feeStructures.forEach(fs => {
      const classId = String(fs.class?.id || fs.class);
      if (classGroups[classId] && fs.isActive) {
        const feeType = fs.feeType || 'Other';
        classGroups[classId].feeStructure[feeType] = (classGroups[classId].feeStructure[feeType] || 0) + parseFloat(fs.amount || 0);
      }
    });

    return Object.values(classGroups);
  };

  generateComparisonData = (processedData) => {
    const { selectedTimeRange, comparisonMode } = this.state;
    
    // Generate time-series data for trends
    const timeSeriesData = processedData.map(classData => ({
      className: classData.className,
      classId: classData.classId,
      periods: this.generateTimeSeriesData(classData.payments, selectedTimeRange),
      paymentMethods: this.analyzePaymentMethods(classData.payments),
      totalRevenue: classData.payments.reduce((sum, p) => sum + p.processedAmount, 0),
      studentCount: classData.students.length,
      collectionRate: this.calculateCollectionRate(classData),
      growthRate: this.calculateGrowthRate(classData)
    }));

    // Add comparison data if comparison mode is active
    if (comparisonMode !== 'none') {
      return this.addComparisonData(timeSeriesData, comparisonMode);
    }

    return timeSeriesData;
  };

  generateTimeSeriesData = (payments, timeRange) => {
    const timeGroups = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.time || payment.createdAt || payment.date);
      let key;
      
      switch(timeRange) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'termly':
          const term = Math.ceil((date.getMonth() + 1) / 4);
          key = `${date.getFullYear()}-T${term}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!timeGroups[key]) {
        timeGroups[key] = {
          period: key,
          revenue: 0,
          methods: {},
          transactions: 0
        };
      }
      
      timeGroups[key].revenue += payment.processedAmount;
      timeGroups[key].transactions++;
      
      const method = payment.paymentMethod || payment.type || 'unknown';
      timeGroups[key].methods[method] = (timeGroups[key].methods[method] || 0) + payment.processedAmount;
    });
    
    return Object.values(timeGroups).sort((a, b) => a.period.localeCompare(b.period));
  };

  analyzePaymentMethods = (payments) => {
    const methods = {};
    
    payments.forEach(payment => {
      const method = payment.paymentMethod || payment.type || 'unknown';
      if (!methods[method]) {
        methods[method] = { count: 0, amount: 0 };
      }
      methods[method].count++;
      methods[method].amount += payment.processedAmount;
    });
    
    return Object.entries(methods).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount
    }));
  };

  calculateCollectionRate = (classData) => {
    const totalCharges = classData.charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const totalCollected = classData.payments.reduce((sum, payment) => sum + payment.processedAmount, 0);
    
    return totalCharges > 0 ? (totalCollected / totalCharges) * 100 : 0;
  };

  calculateGrowthRate = (classData) => {
    if (classData.payments.length < 2) return 0;
    
    const sortedPayments = classData.payments.sort((a, b) => 
      new Date(a.time || a.createdAt) - new Date(b.time || b.createdAt)
    );
    
    const firstPayment = sortedPayments[0];
    const lastPayment = sortedPayments[sortedPayments.length - 1];
    
    // Simple growth calculation based on first and last payments
    const firstValue = firstPayment.processedAmount;
    const lastValue = lastPayment.processedAmount;
    
    return firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  };

  calculateMetrics = (processedData) => {
    const totalRevenue = processedData.reduce((sum, cls) => sum + cls.payments.reduce((subSum, p) => subSum + p.processedAmount, 0), 0);
    const totalStudents = processedData.reduce((sum, cls) => sum + cls.students.length, 0);
    const averageRevenue = processedData.length > 0 ? totalRevenue / processedData.length : 0;
    const totalTransactions = processedData.reduce((sum, cls) => sum + cls.payments.length, 0);
    
    return {
      totalRevenue,
      averageRevenue,
      totalStudents,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      classCount: processedData.length,
      collectionRate: this.calculateOverallCollectionRate(processedData)
    };
  };

  addComparisonData = (data, comparisonMode) => {
    switch (comparisonMode) {
      case 'previousTerm':
        return this.addPreviousTermComparison(data);
      case 'previousYear':
        return this.addPreviousYearComparison(data);
      case 'classCompare':
        return this.addClassComparison(data);
      default:
        return data;
    }
  };

  addPreviousTermComparison = (data) => {
    // Simulate previous term data (in real implementation, this would come from database)
    return data.map(item => ({
      ...item,
      previousTermData: {
        totalRevenue: item.totalRevenue * 0.85, // Simulate 15% growth
        collectionRate: item.collectionRate - 5,
        studentCount: Math.floor(item.studentCount * 0.9)
      }
    }));
  };

  addPreviousYearComparison = (data) => {
    // Simulate previous year data
    return data.map(item => ({
      ...item,
      previousYearData: {
        totalRevenue: item.totalRevenue * 0.7, // Simulate 30% growth
        collectionRate: item.collectionRate - 10,
        studentCount: Math.floor(item.studentCount * 0.8)
      }
    }));
  };

  addClassComparison = (data) => {
    // Add class-to-class comparison
    const averageRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0) / data.length;
    const averageCollectionRate = data.reduce((sum, item) => sum + item.collectionRate, 0) / data.length;
    
    return data.map(item => ({
      ...item,
      classComparison: {
        revenueVsAverage: ((item.totalRevenue - averageRevenue) / averageRevenue) * 100,
        collectionRateVsAverage: item.collectionRate - averageCollectionRate,
        rank: data.sort((a, b) => b.totalRevenue - a.totalRevenue).indexOf(item) + 1
      }
    }));
  };

  calculateOverallCollectionRate = (processedData) => {
    const totalCharges = processedData.reduce((sum, cls) => 
      sum + cls.charges.reduce((subSum, charge) => subSum + parseFloat(charge.amount || 0), 0), 0
    );
    const totalCollected = processedData.reduce((sum, cls) => 
      sum + cls.payments.reduce((subSum, payment) => subSum + payment.processedAmount, 0), 0
    );
    
    return totalCharges > 0 ? (totalCollected / totalCharges) * 100 : 0;
  };

  handleFilterChange = (filterName, value) => {
    this.setState({ [filterName]: value }, () => {
      // Save to localStorage
      localStorage.setItem(`finance_insights_${filterName}`, JSON.stringify(value));
      this.processData();
    });
  };

  handleChartToggle = (chartName) => {
    this.setState(prevState => ({
      activeCharts: {
        ...prevState.activeCharts,
        [chartName]: !prevState.activeCharts[chartName]
      }
    }));
  };

  handleLayoutChange = (layoutMode) => {
    this.setState({ layoutMode });
  };

  renderKPIs = () => {
    const { metricsData, loading } = this.state;
    
    if (!metricsData || loading) {
      return (
        <div className="row">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-md-3">
              <div className="card card-custom gutter-b" style={{ height: '140px' }}>
                <div className="card-body">
                  <div className="spinner spinner-primary mr-3"></div>
                  Loading...
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="row">
        <div className="col-md-3">
          <EnhancedStatCard
            title="Total Revenue"
            value={metricsData.totalRevenue}
            subtext={`Across ${metricsData.classCount} classes`}
            icon="flaticon2-graph-1"
            color="#3699ff"
            showSparkline={this.state.showSparklines}
            sparklineData={this.generateSparklineData('revenue')}
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Collection Rate"
            value={`${metricsData.collectionRate.toFixed(1)}%`}
            subtext="Overall efficiency"
            icon="flaticon2-percentage"
            color="#10b981"
            trend={metricsData.collectionRate > 80 ? 5 : -2}
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Total Students"
            value={metricsData.totalStudents}
            subtext="Active enrollments"
            icon="flaticon2-group"
            color="#f6c23e"
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Avg Transaction"
            value={`KES ${metricsData.averageTransaction.toFixed(0)}`}
            subtext={`${metricsData.totalTransactions} total`}
            icon="flaticon2-money"
            color="#e74c3c"
          />
        </div>
      </div>
    );
  };

  generateSparklineData = (type) => {
    // Generate sample sparkline data - in real implementation, this would come from processed data
    return [100, 120, 115, 130, 125, 140, 135, 150, 145, 160];
  };

  renderMainCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row">
        {activeCharts.revenueTrend && (
          <div className="col-lg-8">
            <RevenueTrendChart 
              data={comparisonData} 
              loading={loading}
              showComparison={this.state.showComparison}
            />
          </div>
        )}
        
        {activeCharts.paymentMethods && (
          <div className="col-lg-4">
            <PaymentMethodChart 
              data={comparisonData} 
              loading={loading}
              chartType="pie"
            />
          </div>
        )}
      </div>
    );
  };

  renderSecondaryCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row mt-4">
        {activeCharts.feeHeatmap && (
          <div className="col-lg-6">
            <FeeHeatmapChart 
              data={comparisonData} 
              loading={loading}
              showValues={true}
            />
          </div>
        )}
        
        {activeCharts.streamRadar && (
          <div className="col-lg-6">
            <StreamRadarChart 
              data={comparisonData} 
              loading={loading}
              showComparison={this.state.showComparison}
            />
          </div>
        )}
      </div>
    );
  };

  renderTertiaryCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row mt-4">
        {activeCharts.cashFlow && (
          <div className="col-lg-12">
            <CashFlowChart 
              data={comparisonData} 
              loading={loading}
              showLabels={true}
            />
          </div>
        )}
      </div>
    );
  };

  renderControls = () => {
    const { layoutMode, showComparison, showSparklines } = this.state;

    return (
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <label className="mr-3">Layout:</label>
              <div className="btn-group">
                <button 
                  className={`btn ${layoutMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('grid')}
                >
                  <i className="fas fa-th"></i> Grid
                </button>
                <button 
                  className={`btn ${layoutMode === 'list' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('list')}
                >
                  <i className="fas fa-list"></i> List
                </button>
                <button 
                  className={`btn ${layoutMode === 'compact' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('compact')}
                >
                  <i className="fas fa-compress"></i> Compact
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <div className="custom-control custom-switch mr-3">
                <input 
                  type="checkbox" 
                  className="custom-control-input" 
                  id="showComparison"
                  checked={showComparison}
                  onChange={(e) => this.setState({ showComparison: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="showComparison">
                  Show Comparison
                </label>
              </div>

              <div className="custom-control custom-switch">
                <input 
                  type="checkbox" 
                  className="custom-control-input" 
                  id="showSparklines"
                  checked={showSparklines}
                  onChange={(e) => this.setState({ showSparklines: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="showSparklines">
                  Sparklines
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderFilters = () => {
    const { classes, terms } = this.state;
    const { selectedClass, selectedTerm, onFilterChange } = this.props;

    return (
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Class</label>
              <select 
                className="form-control"
                value={selectedClass || ""}
                onChange={(e) => onFilterChange('selectedClass', e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || `Class ${cls.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Term</label>
              <select 
                className="form-control"
                value={selectedTerm || ""}
                onChange={(e) => onFilterChange('selectedTerm', e.target.value)}
              >
                <option value="">All Terms</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name || `Term ${term.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Comparison</label>
              <select 
                className="form-control"
                value={this.state.comparisonMode || "none"}
                onChange={(e) => this.setState({ comparisonMode: e.target.value })}
              >
                <option value="none">No Comparison</option>
                <option value="previousTerm">Previous Term</option>
                <option value="previousYear">Previous Year</option>
                <option value="classCompare">Compare Classes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { loading, error } = this.state;

    if (error) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="alert alert-danger">
              <h5>Error loading finance insights</h5>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={this.processData}>
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="finance-insights-dashboard">
        <div className="d-flex justify-content-between align-items-center mb-6">
          <div>
            <h1 className="font-weight-bolder text-dark font-size-h3 mb-0">
              Finance Insights
            </h1>
            <div className="text-muted font-weight-bold font-size-sm mt-1">
              Comprehensive financial analysis and comparison tools
            </div>
          </div>
        </div>

        {this.renderFilters()}

        {this.renderControls()}

        {this.renderKPIs()}

        {this.renderMainCharts()}

        {this.renderSecondaryCharts()}

        {this.renderTertiaryCharts()}

        {loading && (
          <div className="text-center py-10">
            <div className="spinner spinner-primary mr-3"></div>
            Processing financial data...
          </div>
        )}
      </div>
    );
  }
}

export default FinanceInsightsDashboard;
