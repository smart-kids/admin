import React, { Component } from 'react';
import Data from '../../utils/data';
import ComparisonDataService from '../../services/ComparisonDataService';
import ComparisonMetricsEngine from '../../services/ComparisonMetricsEngine';
import { aggregateByClass } from '../../utils/financialEngine';

// Import enhanced components
import { EnhancedStatCard, AdvancedStatCard } from '../../components/charts/EnhancedStatCard';

// Import finance charts
import { RevenueTrendChart, RevenueComparisonChart } from '../../components/charts/finance/RevenueTrendChart';
import { PaymentMethodChart, PaymentMethodTrendChart } from '../../components/charts/finance/PaymentMethodChart';
import { FeeHeatmapChart, FeeTreemapChart } from '../../components/charts/finance/FeeHeatmapChart';
import { StreamRadarChart, StreamComparisonChart } from '../../components/charts/finance/StreamRadarChart';
import { CashFlowChart, CashFlowTimelineChart, CashFlowSummaryChart } from '../../components/charts/finance/CashFlowChart';
import { FeeCollectionFunnelChart } from '../../components/charts/finance/FeeCollectionFunnelChart';
import { PaymentPatternSankeyChart } from '../../components/charts/finance/PaymentPatternSankeyChart';
import { ARAgingGaugeChart } from '../../components/charts/finance/ARAgingGaugeChart';

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
      cashFlow: true,
      collectionFunnel: true,
      paymentPattern: true,
      arAging: true
    },
    
    // Dashboard layout
    layoutMode: 'grid', // 'grid', 'list', 'compact'
    showComparison: false,
    showSparklines: true,
    comparisonMode: 'none', // 'none', 'previousTerm', 'previousYear', 'classCompare'
    isMobile: window.innerWidth < 991
  };

  constructor(props) {
    super(props);
    this.comparisonService = new ComparisonDataService();
    this.metricsEngine = new ComparisonMetricsEngine();
  }

  componentDidMount() {
    this.initializeData();
    this.setupSubscriptions();
    window.addEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({ isMobile: window.innerWidth < 991 });
  };

  componentWillUnmount() {
    this.cleanupSubscriptions();
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedClass !== this.props.selectedClass || 
        prevProps.selectedTerm !== this.props.selectedTerm ||
        prevProps.classes !== this.props.classes ||
        prevProps.payments !== this.props.payments ||
        prevProps.charges !== this.props.charges ||
        prevProps.feeStructures !== this.props.feeStructures ||
        prevProps.parents !== this.props.parents ||
        prevProps.students !== this.props.students ||
        prevProps.terms !== this.props.terms ||
        prevProps.processedParents !== this.props.processedParents) {
      
      this.updateData({ 
        classes: this.props.classes || [], 
        payments: this.props.payments || [], 
        charges: this.props.charges || [], 
        feeStructures: this.props.feeStructures || [], 
        parents: this.props.parents || [], 
        students: this.props.students || [], 
        terms: this.props.terms || [],
        selectedClass: this.props.selectedClass || '',
        selectedTerm: this.props.selectedTerm || ''
      });
    }
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
    const { selectedClass, selectedTerm, processedParents } = this.props;
    
    // If unified data is provided from parent, use it for perfect consistency
    if (processedParents && processedParents.length > 0) {
      this.setState({ loading: true });
      try {
        const processedData = this.processDataFromUnifiedSource(processedParents);
        const comparisonData = this.generateComparisonData(processedData);
        const metricsData = this.calculateMetrics(processedData);
        
        if (this.props.metrics) {
          metricsData.totalRevenue = this.props.metrics.totalPaid;
          metricsData.totalExpected = this.props.metrics.totalExpected;
          metricsData.collectionRate = this.props.metrics.collectionRate;
          metricsData.outstandingBalance = this.props.metrics.totalBalance;
          metricsData.totalStudents = this.props.metrics.studentCount;
        }

        this.setState({
          processedData,
          comparisonData,
          metricsData,
          loading: false
        });
        return;
      } catch (error) {
        console.error('Error processing unified data:', error);
        // Fallback to local processing if unified fails
      }
    }

    if (!payments || !classes || !students) {
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
      
      // Apply class filter
      if (selectedClass) {
        filteredClasses = classes.filter(cls => String(cls.id) === selectedClass);
        filteredStudents = students.filter(student => String(student.class?.id || student.class) === selectedClass);
        filteredPayments = payments.filter(payment => {
          const student = students.find(s => String(s.id) === String(payment.student?.id || payment.student));
          return student && String(student.class?.id || student.class) === selectedClass;
        });
        filteredCharges = charges.filter(charge => {
          const student = students.find(s => String(s.id) === String(charge.student?.id || charge.student));
          return student && String(student.class?.id || student.class) === selectedClass;
        });
        filteredFeeStructures = feeStructures.filter(fs => String(fs.class?.id || fs.class) === selectedClass);
      }
      
      // Apply term filter - filter payments by assigned term
      if (selectedTerm) {
        filteredPayments = filteredPayments.filter(payment => {
          // Use pre-processed assignedTermId if available, otherwise try to match by term
          if (payment.assignedTermId) {
            return String(payment.assignedTermId) === selectedTerm;
          }
          // Fallback: try to match by metadata termId
          if (payment.metadata?.termId) {
            return String(payment.metadata.termId) === selectedTerm;
          }
          // If no term info, include only if no term filter is applied
          return false;
        });
        
        // Filter charges by term
        filteredCharges = filteredCharges.filter(charge => {
          const chargeTermId = String(charge.term?.id || charge.term || "");
          return chargeTermId === selectedTerm;
        });
        
        // Filter fee structures by term
        filteredFeeStructures = filteredFeeStructures.filter(fs => {
          const fsTermId = String(fs.term?.id || fs.term || "");
          return !selectedTerm || fsTermId === selectedTerm || fsTermId === "";
        });
      }
      
      // Process financial data
      const processedData = this.processFinancialData(filteredPayments, filteredCharges, filteredFeeStructures, filteredClasses, filteredStudents, parents);
      
      // Generate comparison data
      const comparisonData = this.generateComparisonData(processedData);
      
      // Calculate metrics
      const metricsData = this.calculateMetrics(processedData);
      
      // Override with global metrics from props if available (Unified Source of Truth)
      if (this.props.metrics) {
        metricsData.totalRevenue = this.props.metrics.totalPaid;
        metricsData.totalExpected = this.props.metrics.totalExpected;
        metricsData.collectionRate = this.props.metrics.collectionRate;
        metricsData.outstandingBalance = this.props.metrics.totalBalance;
        metricsData.totalStudents = this.props.metrics.studentCount;
      }

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

  processDataFromUnifiedSource = (dataFromProps) => {
    const { classes } = this.state;
    const processedParents = dataFromProps || this.props.processedParents || [];
    
    if (!processedParents || processedParents.length === 0) return [];
    
    // Use the shared engine to aggregate parent-level data into class-level metrics
    const classGroups = aggregateByClass(processedParents, classes);
    
    const feeStructures = this.props.feeStructures || this.state.feeStructures || [];
    const selectedTerm = this.props.selectedTerm;
    const selectedClass = this.props.selectedClass;

    // Map back to the structure expected by the dashboard and filter by selected class if isolation is requested
    return classGroups
      .filter(group => !selectedClass || String(group.classId) === String(selectedClass))
      .map(group => {
      // Calculate fee structure breakdown for this class/term
      const feeStructureBreakdown = {};
      feeStructures.forEach(fs => {
        const fsClassId = String(fs.class?.id || fs.class);
        if (fsClassId === String(group.classId) && fs.isActive) {
          const fsTermId = String(fs.term?.id || fs.term);
          if (!selectedTerm || fsTermId === String(selectedTerm)) {
            const feeType = fs.feeType || fs.name || 'Tuition';
            feeStructureBreakdown[feeType] = (feeStructureBreakdown[feeType] || 0) + parseFloat(fs.amount || 0);
          }
        }
      });

      return {
        ...group,
        totalCollected: group.totalPaid,
        totalExpected: group.totalExpected,
        totalCharges: group.totalCharges,
        expectedFees: group.totalExpected - group.totalCharges,
        payments: group.history || [],
        charges: group.charges || [],
        students: group.students || [],
        feeStructure: feeStructureBreakdown
      };
    });
  };

  processFinancialData = (payments, charges, feeStructures, classes, students, parents) => {
    const selectedTerm = this.props.selectedTerm || this.state.selectedTerm || '';
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
            processedAmount: parseFloat(payment.amount || payment.ammount || 0)
          });
        }
      }
    });

    // Process charges and link to students
    charges.forEach(charge => {
      const studentId = String(charge.student?.id || charge.student);
      const student = students.find(s => String(s.id) === studentId);
      
      if (student) {
        const classId = String(student.class?.id || student.class);
        if (classGroups[classId]) {
          classGroups[classId].charges.push({
            ...charge,
            studentName: student ? student.names : 'Unknown Student'
          });
        }
      }
    });

    // Process fee structures
    feeStructures.forEach(fs => {
      const classId = String(fs.class?.id || fs.class);
      // Ensure we only sum fee structures for the selected term and active ones
      const fsTermId = String(fs.term?.id || fs.term);
      const isCorrectTerm = !selectedTerm || fsTermId === String(selectedTerm);
      
      if (classGroups[classId] && fs.isActive && isCorrectTerm) {
        const feeType = fs.feeType || 'Other';
        classGroups[classId].feeStructure[feeType] = (classGroups[classId].feeStructure[feeType] || 0) + parseFloat(fs.amount || 0);
      }
    });

    // Calculate expected amounts using fee structures
    Object.values(classGroups).forEach(classGroup => {
      classGroup.expectedFees = classGroup.students.length * Object.values(classGroup.feeStructure).reduce((sum, amount) => sum + amount, 0);
      classGroup.totalCharges = classGroup.charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
      classGroup.totalExpected = classGroup.expectedFees + classGroup.totalCharges;
      classGroup.totalCollected = classGroup.payments.reduce((sum, payment) => sum + payment.processedAmount, 0);
      classGroup.collectionRate = classGroup.totalExpected > 0 ? (classGroup.totalCollected / classGroup.totalExpected) * 100 : 0;
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
      growthRate: this.calculateGrowthRate(classData),
      efficiency: this.calculateEfficiency(classData)
    }));

    // Add comparison data if comparison mode is active
    if (comparisonMode !== 'none') {
      const augmentedData = this.addComparisonData(timeSeriesData, comparisonMode);
      
      // If isolation mode is active (single class selected) and we have comparison data,
      // project the comparison as a sibling item so charts can render two distinct lines/bars.
      if (this.props.selectedClass && augmentedData.length === 1) {
        const item = augmentedData[0];
        const comp = item.comparison || item.previousTermData || item.previousYearData;
        
        if (comp) {
          return [
            { 
              ...item, 
              className: `${item.className} (Current)`,
              isCurrent: true 
            },
            { 
              ...item, 
              className: `${item.className} (${comp.name || 'Previous Period'})`,
              totalRevenue: comp.totalRevenue,
              collectionRate: comp.collectionRate,
              efficiency: comp.efficiency,
              periods: comp.periods || [],
              isComparison: true,
              color: '#B5B5C3' // Muted grey for comparison
            }
          ];
        }
      }
      return augmentedData;
    }

    return timeSeriesData;
  };

  safeParseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    
    // Try standard parsing
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // Try DD/MM/YYYY
    const parts = String(dateStr).split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const d2 = new Date(year, month, day);
      if (!isNaN(d2.getTime())) return d2;
    }
    
    return new Date();
  };

  generateTimeSeriesData = (payments, timeRange) => {
    const timeGroups = {};
    
    payments.forEach(payment => {
      const date = this.safeParseDate(payment.time || payment.createdAt || payment.date);
      let key;
      
      switch(timeRange) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
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
      
      timeGroups[key].revenue += payment.processedAmount || 0;
      timeGroups[key].transactions++;
      
      const method = payment.paymentMethod || payment.type || 'unknown';
      timeGroups[key].methods[method] = (timeGroups[key].methods[method] || 0) + (payment.processedAmount || 0);
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
    if (!classData) return 0;
    const charges = classData.charges || [];
    const payments = classData.payments || [];
    
    const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const totalCollected = payments.reduce((sum, payment) => sum + (payment.processedAmount || 0), 0);
    
    return totalCharges > 0 ? (totalCollected / totalCharges) * 100 : 0;
  };

  calculateGrowthRate = (classData) => {
    const payments = classData?.payments || [];
    if (payments.length < 2) return 0;
    
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(a.time || a.createdAt) - new Date(b.time || b.createdAt)
    );
    
    const firstPayment = sortedPayments[0];
    const lastPayment = sortedPayments[sortedPayments.length - 1];
    
    // Simple growth calculation based on first and last payments
    const firstValue = firstPayment.processedAmount;
    const lastValue = lastPayment.processedAmount;
    
    return firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  };

  calculateEfficiency = (classData) => {
    // Efficiency is calculated as: (Collection Rate * Payment Velocity) / Student Count
    // Higher collection rate and faster payments with fewer students = higher efficiency
    
    const collectionRate = this.calculateCollectionRate(classData);
    const totalCollected = classData.payments.reduce((sum, p) => sum + p.processedAmount, 0);
    const studentCount = classData.students.length;
    
    if (studentCount === 0 || totalCollected === 0) return 0;
    
    // Calculate payment velocity (average days to pay)
    const paymentVelocities = classData.payments.map(payment => {
      const paymentDate = new Date(payment.time || payment.createdAt);
      const chargeDate = new Date(payment.chargeDate || payment.createdAt);
      const daysToPay = Math.max(0, (paymentDate - chargeDate) / (1000 * 60 * 60 * 24));
      return daysToPay;
    });
    
    const averageDaysToPay = paymentVelocities.length > 0 
      ? paymentVelocities.reduce((sum, days) => sum + days, 0) / paymentVelocities.length 
      : 30; // Default to 30 days if no payment data
    
    // Normalize payment velocity (faster payments = higher score)
    const paymentVelocityScore = Math.max(0, 100 - averageDaysToPay);
    
    // Calculate efficiency: weighted combination of collection rate and payment velocity
    const efficiency = (collectionRate * 0.7) + (paymentVelocityScore * 0.3);
    
    return Math.min(100, Math.max(0, efficiency)); // Clamp between 0-100
  };

  calculateMetrics = (processedData) => {
    const totalRevenue = processedData.reduce((sum, cls) => sum + cls.totalCollected, 0);
    const totalExpected = processedData.reduce((sum, cls) => sum + cls.totalExpected, 0);
    const totalStudents = processedData.reduce((sum, cls) => sum + cls.students.length, 0);
    const averageRevenue = processedData.length > 0 ? totalRevenue / processedData.length : 0;
    const totalTransactions = processedData.reduce((sum, cls) => sum + cls.payments.length, 0);
    const overallCollectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpected,
      averageRevenue,
      totalStudents,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      classCount: processedData.length,
      collectionRate: overallCollectionRate,
      outstandingBalance: totalExpected - totalRevenue
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
    const { payments, charges, feeStructures, classes, students, terms, selectedTerm } = this.state;
    
    if (!selectedTerm || !terms || terms.length === 0) return data;
    
    // Sort terms by startDate to ensure index-based comparison works
    const sortedTerms = [...terms].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Find previous term
    const currentTermIndex = sortedTerms.findIndex(t => t.id === selectedTerm);
    if (currentTermIndex <= 0) return data; // No previous term available
    
    const previousTerm = sortedTerms[currentTermIndex - 1];
    
    return data.map(item => {
      // Calculate previous term metrics for this class
      const classPayments = payments.filter(p => {
        const student = students.find(s => String(s.id) === String(p.student?.id || p.student));
        return student && String(student.class?.id || student.class) === item.classId && 
               String(p.assignedTermId) === String(previousTerm.id);
      });
      
      const previousRevenue = classPayments.reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
      
      // Calculate previous term expected amount
      const classStudents = students.filter(s => String(s.class?.id || s.class) === item.classId);
      const previousExpected = classStudents.reduce((sum, student) => {
        const fees = feeStructures.filter(fs =>
          String(fs.class?.id || fs.class) === item.classId &&
          String(fs.term?.id || fs.term) === String(previousTerm.id) &&
          fs.isActive === true
        );
        const studentFees = fees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
        return sum + studentFees;
      }, 0);
      
      const previousCollectionRate = previousExpected > 0 ? (previousRevenue / previousExpected) * 100 : 0;
      
      // Calculate previous term efficiency
      const previousClassData = {
        payments: classPayments,
        students: classStudents,
        charges: charges.filter(c => {
          const student = students.find(s => String(s.id) === String(c.student?.id || c.student));
          return student && String(student.class?.id || student.class) === item.classId;
        })
      };
      const previousEfficiency = this.calculateEfficiency(previousClassData);
      
      return {
        ...item,
        comparison: {
          name: previousTerm.name,
          totalRevenue: previousRevenue,
          collectionRate: previousCollectionRate,
          efficiency: previousEfficiency,
          periods: this.generateTimeSeriesData(classPayments, this.state.selectedTimeRange)
        }
      };
    });
  };

  addPreviousYearComparison = (data) => {
    const { payments, charges, feeStructures, classes, students, terms, selectedTerm } = this.state;
    
    if (!selectedTerm || !terms || terms.length === 0) return data;
    
    // Find current term and same term from previous year
    const currentTerm = terms.find(t => t.id === selectedTerm);
    if (!currentTerm) return data;
    
    // Try to find same term from previous year by matching name and checking the year in the startDate
    const currentTermDate = new Date(currentTerm.startDate);
    const previousYearTerm = terms.find(t => {
      const tDate = new Date(t.startDate);
      const isPreviousYear = tDate.getFullYear() === currentTermDate.getFullYear() - 1;
      const isSameTermName = t.name && currentTerm.name && 
                            t.name.toLowerCase().includes(currentTerm.name.toLowerCase().replace(/[0-9]/g, '').trim());
      return isPreviousYear && isSameTermName && t.id !== selectedTerm;
    });
    
    if (!previousYearTerm) return data;
    
    return data.map(item => {
      // Calculate previous year metrics for this class
      const classPayments = payments.filter(p => {
        const student = students.find(s => String(s.id) === String(p.student?.id || p.student));
        return student && String(student.class?.id || student.class) === item.classId && 
               String(p.assignedTermId) === String(previousYearTerm.id);
      });
      
      const previousYearRevenue = classPayments.reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
      
      // Calculate previous year expected amount
      const classStudents = students.filter(s => String(s.class?.id || s.class) === item.classId);
      const previousYearExpected = classStudents.reduce((sum, student) => {
        const fees = feeStructures.filter(fs =>
          String(fs.class?.id || fs.class) === item.classId &&
          String(fs.term?.id || fs.term) === String(previousYearTerm.id) &&
          fs.isActive === true
        );
        const studentFees = fees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
        return sum + studentFees;
      }, 0);
      
      const previousYearCollectionRate = previousYearExpected > 0 ? (previousYearRevenue / previousYearExpected) * 100 : 0;
      
      // Calculate previous year efficiency
      const previousYearClassData = {
        payments: classPayments,
        students: classStudents,
        charges: charges.filter(c => {
          const student = students.find(s => String(s.id) === String(c.student?.id || c.student));
          return student && String(student.class?.id || student.class) === item.classId;
        })
      };
      const previousYearEfficiency = this.calculateEfficiency(previousYearClassData);
      
      return {
        ...item,
        comparison: {
          name: previousYearTerm.name,
          totalRevenue: previousYearRevenue,
          collectionRate: previousYearCollectionRate,
          efficiency: previousYearEfficiency,
          periods: this.generateTimeSeriesData(classPayments, this.state.selectedTimeRange)
        }
      };
    });
  };

  addClassComparison = (data) => {
    // Add class-to-class comparison
    const averageRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0) / data.length;
    const averageCollectionRate = data.reduce((sum, item) => sum + item.collectionRate, 0) / data.length;
    const averageEfficiency = data.reduce((sum, item) => sum + (item.efficiency || 0), 0) / data.length;
    
    return data.map(item => ({
      ...item,
      classComparison: {
        revenueVsAverage: ((item.totalRevenue - averageRevenue) / averageRevenue) * 100,
        collectionRateVsAverage: item.collectionRate - averageCollectionRate,
        efficiencyVsAverage: (item.efficiency || 0) - averageEfficiency,
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
      <div className="row mx-n1" style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div className="col-6 col-md-3 mb-4 px-1" style={this.state.isMobile ? { flex: '0 0 50%', maxWidth: '50%' } : {}}>
          <EnhancedStatCard
            title="Total Revenue"
            value={metricsData.totalRevenue}
            subtext={this.state.isMobile ? "" : `Across ${metricsData.classCount} classes`}
            icon="flaticon2-graph-1"
            color="#3699ff"
            showSparkline={this.state.showSparklines}
            sparklineData={this.generateSparklineData('revenue')}
            isMobile={this.state.isMobile}
          />
        </div>
        <div className="col-6 col-md-3 mb-4 px-1" style={this.state.isMobile ? { flex: '0 0 50%', maxWidth: '50%' } : {}}>
          <EnhancedStatCard
            title="Collection Rate"
            value={`${metricsData.collectionRate.toFixed(1)}%`}
            subtext={this.state.isMobile ? "" : "Overall efficiency"}
            icon="flaticon2-percentage"
            color="#10b981"
            trend={metricsData.collectionRate > 80 ? 5 : -2}
            isMobile={this.state.isMobile}
          />
        </div>
        <div className="col-6 col-md-3 mb-4 px-1" style={this.state.isMobile ? { flex: '0 0 50%', maxWidth: '50%' } : {}}>
          <EnhancedStatCard
            title="Total Students"
            value={metricsData.totalStudents}
            subtext={this.state.isMobile ? "" : "Active enrollments"}
            icon="flaticon2-group"
            color="#f6c23e"
            isMobile={this.state.isMobile}
          />
        </div>
        <div className="col-6 col-md-3 mb-4 px-1" style={this.state.isMobile ? { flex: '0 0 50%', maxWidth: '50%' } : {}}>
          <EnhancedStatCard
            title="Avg Transaction"
            value={`KES ${metricsData.averageTransaction.toFixed(0)}`}
            subtext={this.state.isMobile ? "" : `${metricsData.totalTransactions} total`}
            icon="flaticon2-money"
            color="#e74c3c"
            isMobile={this.state.isMobile}
          />
        </div>
      </div>
    );
  };

  generateSparklineData = (type) => {
    const { comparisonData } = this.state;
    if (!comparisonData || comparisonData.length === 0) return [];
    
    if (type === 'revenue') {
      // Generate revenue sparkline from actual payment data
      const revenueData = [];
      comparisonData.forEach(classData => {
        if (classData.periods) {
          classData.periods.forEach(period => {
            revenueData.push(period.revenue || 0);
          });
        }
      });
      return revenueData.slice(-10); // Last 10 periods
    }
    
    return [];
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
        {activeCharts.collectionFunnel && (
          <div className="col-lg-4">
            <FeeCollectionFunnelChart 
              data={this.generateCollectionFunnelData()} 
              loading={loading}
              showComparison={this.state.showComparison}
            />
          </div>
        )}
        
        {activeCharts.paymentPattern && (
          <div className="col-lg-4">
            <PaymentPatternSankeyChart 
              data={this.generatePaymentPatternData()} 
              loading={loading}
              timeRange={this.state.selectedTimeRange}
            />
          </div>
        )}
        
        {activeCharts.arAging && (
          <div className="col-lg-4">
            <ARAgingGaugeChart 
              data={this.generateARAgingData()} 
              loading={loading}
            />
          </div>
        )}
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
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Class</label>
              <select 
                className="form-control form-control-solid"
                value={selectedClass || ""}
                onChange={(e) => onFilterChange('selectedClass', e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="">ALL Classes</option>
                {(Array.isArray(classes) ? classes : []).map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || `Class ${cls.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Term</label>
              <select 
                className="form-control form-control-solid"
                value={selectedTerm || ""}
                onChange={(e) => onFilterChange('selectedTerm', e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="">ALL Terms</option>
                {(Array.isArray(terms) ? terms : []).map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name || `Term ${term.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Comparison</label>
              <select 
                className="form-control form-control-solid"
                value={this.state.comparisonMode || "none"}
                onChange={(e) => this.setState({ comparisonMode: e.target.value }, this.processData)}
                style={{ borderRadius: '8px' }}
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

  generateCollectionFunnelData = () => {
    const { payments, charges, selectedClass, selectedTerm, students, feeStructures } = this.state;
    
    // Filter data based on current selections
    let filteredCharges = charges || [];
    let filteredPayments = payments || [];
    
    if (selectedClass) {
      filteredCharges = charges.filter(charge => {
        const student = students.find(s => String(s.id) === String(charge.student?.id || charge.student));
        return student && String(student.class?.id || student.class) === selectedClass;
      });
      
      filteredPayments = payments.filter(payment => {
        const student = students.find(s => String(s.id) === String(payment.student?.id || payment.student));
        return student && String(student.class?.id || student.class) === selectedClass;
      });
    }
    
    if (selectedTerm) {
      filteredCharges = filteredCharges.filter(charge => {
        const chargeTermId = String(charge.term?.id || charge.term || "");
        return chargeTermId === selectedTerm;
      });
      
      filteredPayments = filteredPayments.filter(payment => {
        if (payment.assignedTermId) {
          return String(payment.assignedTermId) === selectedTerm;
        }
        if (payment.metadata?.termId) {
          return String(payment.metadata.termId) === selectedTerm;
        }
        return false;
      });
    }
    
    // Calculate real metrics from filtered data
    const totalBilled = filteredCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const partialPayments = filteredPayments.filter(p => p.status === 'PARTIAL').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const fullPayments = filteredPayments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    // Calculate overdue from actual unpaid charges
    const overdue = filteredCharges.filter(c => {
      const dueDate = new Date(c.dueDate);
      const isPaid = filteredPayments.some(p => p.chargeId === c.id && p.status === 'COMPLETED');
      return dueDate < new Date() && !isPaid;
    }).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    const writtenOff = filteredCharges.filter(c => c.status === 'WRITTEN_OFF').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    return {
      totalBilled,
      partialPayments,
      fullPayments,
      overdue,
      writtenOff
    };
  };

  generatePaymentPatternData = () => {
    const { payments, selectedClass, selectedTerm, students } = this.state;
    
    // Filter payments based on current selections
    let filteredPayments = payments || [];
    
    if (selectedClass) {
      filteredPayments = payments.filter(payment => {
        const student = students.find(s => String(s.id) === String(payment.student?.id || payment.student));
        return student && String(student.class?.id || student.class) === selectedClass;
      });
    }
    
    if (selectedTerm) {
      filteredPayments = filteredPayments.filter(payment => {
        if (payment.assignedTermId) {
          return String(payment.assignedTermId) === selectedTerm;
        }
        if (payment.metadata?.termId) {
          return String(payment.metadata.termId) === selectedTerm;
        }
        return false;
      });
    }
    
    // Only include completed payments for pattern analysis
    return filteredPayments
      .filter(p => p.status === 'COMPLETED' || !p.status) // Include if status is undefined (assume completed)
      .map(payment => ({
        paymentMethod: payment.paymentMethod || payment.type || 'M-Pesa',
        feeCategory: payment.feeCategory || 'School Fees',
        amount: parseFloat(payment.amount || payment.ammount || 0),
        date: payment.date || payment.time || payment.createdAt
      }));
  };

  generateARAgingData = () => {
    const { processedParents, selectedTerm, terms } = this.props;
    
    if (processedParents && processedParents.length > 0) {
      const agingData = [];
      const now = new Date();
      const termsArray = Array.isArray(terms) ? terms : [];
      const currentTerm = termsArray.find(t => String(t.id) === String(selectedTerm));
      const termStartDate = currentTerm?.startDate ? this.safeParseDate(currentTerm.startDate) : now;

      processedParents.forEach(parent => {
        parent.students.forEach(student => {
          if (student.finances?.balance > 0) {
            // Last payment date or term start
            const lastPayment = student.finances.history && student.finances.history.length > 0 
              ? this.safeParseDate(student.finances.history[0].time || student.finances.history[0].createdAt)
              : null;
            
            // Aging logic: if no payments, assume debt started at term start
            const baseDate = lastPayment || termStartDate;

            agingData.push({
              amount: student.finances.balance,
              dueDate: baseDate,
              status: 'UNPAID',
              studentId: student.id
            });
          }
        });
      });
      return agingData;
    }

    const { charges, payments, selectedClass, students } = this.state;
    // Fallback to local charges if no unified source
    // Fallback logic
    const filteredCharges = charges || [];
    return filteredCharges.map(charge => {
      const payment = payments.find(p => p.chargeId === charge.id && p.status === 'COMPLETED');
      return {
        amount: parseFloat(charge.amount || 0),
        dueDate: charge.dueDate,
        paidDate: payment ? (payment.date || payment.time || payment.createdAt) : null,
        status: charge.status,
        daysOverdue: charge.dueDate ? Math.floor((new Date() - new Date(charge.dueDate)) / (1000 * 60 * 60 * 24)) : 0
      };
    });
  };

  isPaid = (chargeId) => {
    const { payments } = this.state;
    return payments.some(p => p.chargeId === chargeId && p.status === 'COMPLETED');
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
        {/* Active Filters Indicator */}
        <div className="card card-custom mb-4 border-left-3 border-left-primary">
          <div className="card-body py-3">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-30px bg-light-primary mr-3">
                <span className="symbol-label text-primary font-weight-bolder">
                  <i className="fas fa-filter"></i>
                </span>
              </div>
              <div className="d-flex flex-column">
                <div className="font-weight-bolder text-dark">Active Filters</div>
                <div className="text-muted font-size-sm">
                  {console.log('FinanceInsights Debug:', { 
                    selectedClass: this.props.selectedClass, 
                    selectedTerm: this.props.selectedTerm,
                    classes: this.props.classes,
                    terms: this.props.terms
                  })}
                  {this.props.selectedClass && (
                    <span className="mr-3">
                      <strong>Class:</strong> {this.props.classes?.find(c => c.id === this.props.selectedClass)?.name || 'Selected Class'}
                    </span>
                  )}
                  {this.props.selectedTerm && (
                    <span>
                      <strong>Term:</strong> {this.props.terms?.find(t => t.id === this.props.selectedTerm)?.name || 'Selected Term'}
                    </span>
                  )}
                  {!this.props.selectedClass && !this.props.selectedTerm && (
                    <span className="text-muted">Showing all data</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.renderFilters()}
        {this.renderKPIs()}
        {this.renderMainCharts()}
        {this.renderSecondaryCharts()}
        {this.renderTertiaryCharts()}
        
        {this.state.activeCharts.cashFlow && (
          <div className="row mt-4">
            <div className="col-lg-12">
              <CashFlowChart 
                data={this.state.comparisonData} 
                loading={loading}
                showLabels={true}
              />
            </div>
          </div>
        )}

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
