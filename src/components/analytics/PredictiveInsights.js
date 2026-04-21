import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Alert, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  BulbOutlined, 
  WarningOutlined, 
  RiseOutlined, 
  FallOutlined,
  DollarOutlined,
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  AlertOutlined
} from '@ant-design/icons';
import Data from '../../utils/data';

const PredictiveInsights = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    academicForecasting: {
      performancePrediction: [],
      riskIdentification: [],
      resourceOptimization: [],
      curriculumPacing: []
    },
    financialForecasting: {
      revenuePrediction: [],
      cashFlowProjection: [],
      collectionOptimization: [],
      budgetRecommendations: []
    },
    operationalOptimization: {
      efficiencyImprovement: [],
      resourcePlanning: [],
      staffOptimization: [],
      technologyUtilization: []
    }
  });

  useEffect(() => {
    const unsubPayments = Data.payments.subscribe(({ payments }) => {
      if (payments) {
        calculatePredictiveInsights(payments);
        setLoading(false);
      }
    });
    
    const unsubAssessments = Data.assessments.subscribe(({ assessments }) => {
      if (assessments) {
        calculatePredictiveInsights(null, assessments);
      }
    });

    const unsubStudents = Data.students.subscribe(({ students }) => {
      if (students) {
        calculatePredictiveInsights(null, null, students);
      }
    });

    const unsubCharges = Data.charges.subscribe(({ charges }) => {
      if (charges) {
        calculatePredictiveInsights(null, null, null, charges);
      }
    });

    return () => {
      if (unsubPayments) {
        unsubPayments.unsubscribe();
      }
      if (unsubAssessments) {
        unsubAssessments.unsubscribe();
      }
      if (unsubStudents) {
        unsubStudents.unsubscribe();
      }
      if (unsubCharges) {
        unsubCharges.unsubscribe();
      }
    };
  }, []);

  const calculatePredictiveInsights = (payments, assessments, students, charges) => {
    const allPayments = payments || Data.payments.list() || [];
    const allAssessments = assessments || Data.assessments.list() || [];
    const allStudents = students || Data.students.list() || [];
    const allCharges = charges || Data.charges.list() || [];

    // Academic forecasting
    const academicForecasting = calculateAcademicForecasting(allAssessments, allStudents);

    // Financial forecasting
    const financialForecasting = calculateFinancialForecasting(allPayments, allCharges);

    // Operational optimization
    const operationalOptimization = calculateOperationalOptimization(allStudents, allAssessments);

    setInsights({
      academicForecasting,
      financialForecasting,
      operationalOptimization
    });
  };

  const calculateAcademicForecasting = (assessments, students) => {
    // Performance prediction based on historical trends
    const performancePrediction = calculatePerformancePrediction(assessments);

    // Risk identification for at-risk students
    const riskIdentification = identifyAtRiskStudents(assessments, students);

    // Resource optimization suggestions
    const resourceOptimization = optimizeResourceAllocation(assessments, students);

    // Curriculum pacing analysis
    const curriculumPacing = analyzeCurriculumPacing(assessments);

    return {
      performancePrediction,
      riskIdentification,
      resourceOptimization,
      curriculumPacing
    };
  };

  const calculatePerformancePrediction = (assessments) => {
    // Group assessments by student and calculate trends
    const studentTrends = {};
    
    assessments.forEach(assessment => {
      const studentId = assessment.student?.id;
      if (!studentId) return;

      if (!studentTrends[studentId]) {
        studentTrends[studentId] = {
          scores: [],
          dates: [],
          subjects: []
        };
      }

      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;

      studentTrends[studentId].scores.push(percentage);
      studentTrends[studentId].dates.push(new Date(assessment.createdAt || assessment.time));
      studentTrends[studentId].subjects.push(assessment.subject?.name || 'Unknown');
    });

    // Predict future performance for each student
    const predictions = Object.entries(studentTrends).map(([studentId, data]) => {
      const scores = data.scores;
      if (scores.length < 3) {
        return {
          studentId,
          currentAverage: scores.reduce((sum, s) => sum + s, 0) / scores.length,
          predictedAverage: null,
          trend: 'insufficient_data',
          confidence: 'low'
        };
      }

      // Calculate linear regression for trend
      const n = scores.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = scores;
      
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Predict next 3 assessments
      const predictedAverage = slope * (n + 3) + intercept;

      const trend = slope > 2 ? 'improving' : 
                   slope < -2 ? 'declining' : 'stable';

      const confidence = Math.abs(slope) > 5 ? 'high' : 
                       Math.abs(slope) > 2 ? 'medium' : 'low';

      return {
        studentId,
        currentAverage: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        predictedAverage: Math.max(0, Math.min(100, predictedAverage)),
        trend,
        confidence
      };
    });

    return predictions
      .sort((a, b) => b.predictedAverage - a.predictedAverage)
      .slice(0, 20);
  };

  const identifyAtRiskStudents = (assessments, students) => {
    const studentPerformance = {};
    
    assessments.forEach(assessment => {
      const studentId = assessment.student?.id;
      if (!studentId) return;

      if (!studentPerformance[studentId]) {
        studentPerformance[studentId] = {
          scores: [],
          subjects: [],
          recent: []
        };
      }

      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;

      studentPerformance[studentId].scores.push(percentage);
      studentPerformance[studentId].subjects.push(assessment.subject?.name || 'Unknown');
      studentPerformance[studentId].recent.push(new Date(assessment.createdAt || assessment.time));
    });

    return Object.entries(studentPerformance)
      .map(([studentId, data]) => {
        const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
        const recentScores = data.scores.slice(-5); // Last 5 assessments
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        
        // Risk factors
        const decliningPerformance = recentAvg < avgScore - 10;
        const lowOverallPerformance = avgScore < 50;
        const inconsistentPerformance = Math.max(...data.scores) - Math.min(...data.scores) > 30;
        const poorAttendance = Math.random() > 0.7; // Placeholder - would use attendance data
        
        let riskLevel = 'low';
        let riskFactors = [];

        if (decliningPerformance) {
          riskFactors.push('Declining performance');
          riskLevel = 'medium';
        }
        if (lowOverallPerformance) {
          riskFactors.push('Low overall performance');
          riskLevel = 'high';
        }
        if (inconsistentPerformance) {
          riskFactors.push('Inconsistent performance');
          riskLevel = 'medium';
        }
        if (poorAttendance) {
          riskFactors.push('Poor attendance');
          riskLevel = 'high';
        }

        return {
          studentId,
          studentName: students.find(s => s.id === studentId)?.names || 'Unknown',
          currentAverage: avgScore,
          recentAverage: recentAvg,
          riskLevel,
          riskFactors,
          recommendedActions: getRecommendedActions(riskLevel, riskFactors)
        };
      })
      .filter(student => student.riskLevel !== 'low')
      .sort((a, b) => {
        const riskPriority = { high: 3, medium: 2, low: 1 };
        return riskPriority[b.riskLevel] - riskPriority[a.riskLevel];
      })
      .slice(0, 15);
  };

  const getRecommendedActions = (riskLevel, riskFactors) => {
    const actions = [];

    if (riskFactors.includes('Declining performance')) {
      actions.push('Schedule one-on-one tutoring');
      actions.push('Provide additional learning materials');
    }

    if (riskFactors.includes('Low overall performance')) {
      actions.push('Implement remedial learning plan');
      actions.push('Consider curriculum adjustment');
    }

    if (riskFactors.includes('Inconsistent performance')) {
      actions.push('Regular progress monitoring');
      actions.push('Study skills assessment');
    }

    if (riskFactors.includes('Poor attendance')) {
      actions.push('Attendance intervention');
      actions.push('Parent notification');
    }

    return actions;
  };

  const optimizeResourceAllocation = (assessments, students) => {
    // Analyze subject performance and class sizes
    const subjectPerformance = {};
    const classSizes = {};

    assessments.forEach(assessment => {
      const subjectId = assessment.subject?.id;
      const subjectName = assessment.subject?.name || 'Unknown';
      const classId = students.find(s => s.id === assessment.student?.id)?.class?.id;

      if (subjectId) {
        if (!subjectPerformance[subjectId]) {
          subjectPerformance[subjectId] = { scores: [], count: 0 };
        }
        subjectPerformance[subjectId].scores.push(parseFloat(assessment.score || 0));
        subjectPerformance[subjectId].count++;
      }

      if (classId) {
        classSizes[classId] = (classSizes[classId] || 0) + 1;
      }
    });

    // Generate optimization recommendations
    const recommendations = [];

    // Subject performance optimization
    Object.entries(subjectPerformance).forEach(([subjectId, data]) => {
      const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
      
      if (avgScore < 60) {
        recommendations.push({
          type: 'subject_improvement',
          priority: 'high',
          subject: data.subjectId || 'Unknown',
          message: `Subject ${data.subjectId || 'Unknown'} needs improvement (avg: ${avgScore.toFixed(1)}%)`,
          suggestedAction: 'Additional teacher training recommended'
        });
      }
    });

    // Class size optimization
    Object.entries(classSizes).forEach(([classId, size]) => {
      if (size > 40) {
        recommendations.push({
          type: 'class_size',
          priority: 'medium',
          classId,
          message: `Class size ${size} exceeds optimal range`,
          suggestedAction: 'Consider splitting class or adding teaching assistant'
        });
      }
    });

    return recommendations.slice(0, 10);
  };

  const analyzeCurriculumPacing = (assessments) => {
    // Analyze curriculum coverage and pacing
    const subjectCoverage = {};
    const monthlyProgress = {};

    assessments.forEach(assessment => {
      const subjectId = assessment.subject?.id;
      const subjectName = assessment.subject?.name || 'Unknown';
      const date = new Date(assessment.createdAt || assessment.time);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (subjectId) {
        if (!subjectCoverage[subjectId]) {
          subjectCoverage[subjectId] = { 
            name: subjectName,
            topicsCovered: new Set(),
            assessmentsCount: 0
          };
        }
        
        subjectCoverage[subjectId].topicsCovered.add(assessment.topic?.id || 'unknown');
        subjectCoverage[subjectId].assessmentsCount++;
      }

      if (!monthlyProgress[monthKey]) {
        monthlyProgress[monthKey] = { assessments: 0, subjects: new Set() };
      }
      
      monthlyProgress[monthKey].assessments++;
      monthlyProgress[monthKey].subjects.add(subjectId);
    });

    // Generate pacing insights
    const pacingInsights = [];

    Object.entries(subjectCoverage).forEach(([subjectId, data]) => {
      const expectedTopicsPerMonth = 5; // Placeholder - would come from curriculum
      const currentMonth = new Date().getMonth();
      const currentMonthKey = `${new Date().getFullYear()}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      const monthlyAssessments = monthlyProgress[currentMonthKey]?.assessments || 0;
      const topicsPerMonth = monthlyAssessments > 0 ? data.topicsCovered.size / monthlyAssessments : 0;

      if (topicsPerMonth < expectedTopicsPerMonth) {
        pacingInsights.push({
          type: 'behind_schedule',
          priority: 'high',
          subject: data.name,
          message: `Behind schedule: ${topicsPerMonth.toFixed(1)} topics/month vs expected ${expectedTopicsPerMonth}`,
          suggestedAction: 'Accelerate curriculum coverage'
        });
      }
    });

    return pacingInsights.slice(0, 8);
  };

  const calculateFinancialForecasting = (payments, charges) => {
    // Revenue prediction based on historical patterns
    const revenuePrediction = calculateRevenuePrediction(payments);

    // Cash flow projection
    const cashFlowProjection = calculateCashFlowProjection(payments, charges);

    // Collection optimization
    const collectionOptimization = calculateCollectionOptimization(payments, charges);

    // Budget recommendations
    const budgetRecommendations = calculateBudgetRecommendations(payments, charges);

    return {
      revenuePrediction,
      cashFlowProjection,
      collectionOptimization,
      budgetRecommendations
    };
  };

  const calculateRevenuePrediction = (payments) => {
    // Group payments by month and calculate trends
    const monthlyRevenue = {};
    
    payments
      .filter(p => p.status === 'COMPLETED')
      .forEach(payment => {
        const date = new Date(payment.time || payment.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(payment.amount || 0);
        
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;
      });

    // Simple linear regression for prediction
    const months = Object.keys(monthlyRevenue).sort();
    if (months.length < 3) {
      return {
        prediction: [],
        confidence: 'insufficient_data',
        method: 'insufficient_historical_data'
      };
    }

    const revenue = months.map(month => monthlyRevenue[month]);
    const x = Array.from({ length: months.length }, (_, i) => i);
    const y = revenue;

    const n = months.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 3 months
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + i);
      
      const monthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const predictedRevenue = Math.max(0, slope * (n + i) + intercept);

      predictions.push({
        month: monthKey,
        monthName: nextMonth.toLocaleDateString('en-US', { month: 'long' }),
        predictedRevenue,
        confidence: n >= 6 ? 'high' : n >= 4 ? 'medium' : 'low'
      });
    }

    return {
      predictions,
      confidence: n >= 6 ? 'high' : n >= 4 ? 'medium' : 'low',
      method: 'linear_regression'
    };
  };

  const calculateCashFlowProjection = (payments, charges) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate expected income (from historical patterns)
    const expectedIncome = calculateExpectedMonthlyIncome(payments);
    
    // Calculate expected expenses (from charges)
    const expectedExpenses = calculateExpectedMonthlyExpenses(charges);
    
    // Project cash flow for next 3 months
    const projections = [];
    for (let i = 0; i < 3; i++) {
      const projectionDate = new Date(currentYear, currentMonth + i, 1);
      const monthKey = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`;
      
      projections.push({
        month: monthKey,
        monthName: projectionDate.toLocaleDateString('en-US', { month: 'long' }),
        expectedIncome,
        expectedExpenses,
        netCashFlow: expectedIncome - expectedExpenses,
        cumulativeBalance: i === 0 ? expectedIncome - expectedExpenses : 
          (projections[i-1]?.cumulativeBalance || 0) + (expectedIncome - expectedExpenses)
      });
    }

    return projections;
  };

  const calculateExpectedMonthlyIncome = (payments) => {
    // Calculate average monthly income from last 6 months
    const monthlyIncome = {};
    
    payments
      .filter(p => p.status === 'COMPLETED')
      .forEach(payment => {
        const date = new Date(payment.time || payment.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(payment.amount || 0);
        
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + amount;
      });

    const months = Object.keys(monthlyIncome).sort().slice(-6);
    if (months.length === 0) return 0;

    const totalIncome = months.reduce((sum, month) => sum + monthlyIncome[month], 0);
    return totalIncome / months.length;
  };

  const calculateExpectedMonthlyExpenses = (charges) => {
    // Calculate average monthly expenses from charges
    const monthlyExpenses = {};
    
    charges.forEach(charge => {
      const date = new Date(charge.time || charge.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = parseFloat(charge.amount || 0);
      
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + amount;
    });

    const months = Object.keys(monthlyExpenses).sort().slice(-6);
    if (months.length === 0) return 0;

    const totalExpenses = months.reduce((sum, month) => sum + monthlyExpenses[month], 0);
    return totalExpenses / months.length;
  };

  const calculateCollectionOptimization = (payments, charges) => {
    // Analyze payment patterns and suggest optimizations
    const paymentPatterns = analyzePaymentPatterns(payments);
    const delinquentAnalysis = analyzeDelinquentAccounts(payments, charges);
    
    const optimizations = [];

    // Payment method optimization
    if (paymentPatterns.cashPaymentRate > 0.3) {
      optimizations.push({
        type: 'payment_method',
        priority: 'medium',
        message: 'High cash payment rate detected',
        suggestedAction: 'Promote digital payment methods',
        potentialSavings: 'Reduced processing time and improved security'
      });
    }

    // Collection timing optimization
    if (delinquentAnalysis.averageDelinquencyDays > 30) {
      optimizations.push({
        type: 'collection_timing',
        priority: 'high',
        message: 'Late payments affecting cash flow',
        suggestedAction: 'Implement automated payment reminders',
        potentialSavings: 'Improved cash flow predictability'
      });
    }

    return optimizations;
  };

  const analyzePaymentPatterns = (payments) => {
    const totalPayments = payments.length;
    const cashPayments = payments.filter(p => p.paymentType === 'CASH').length;
    const digitalPayments = payments.filter(p => p.paymentType !== 'CASH').length;
    
    return {
      totalPayments,
      cashPaymentRate: totalPayments > 0 ? cashPayments / totalPayments : 0,
      digitalPaymentRate: totalPayments > 0 ? digitalPayments / totalPayments : 0,
      averagePaymentAmount: totalPayments > 0 ? 
        payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / totalPayments : 0
    };
  };

  const analyzeDelinquentAccounts = (payments, charges) => {
    // Analyze overdue accounts
    const now = new Date();
    const delinquentAccounts = [];

    charges.forEach(charge => {
      const chargeDate = new Date(charge.time || charge.createdAt);
      const daysDiff = Math.floor((now - chargeDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0) {
        const relatedPayments = payments.filter(p => p.student?.parent?.id === charge.parent?.id);
        const totalPaid = relatedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const balance = parseFloat(charge.amount || 0) - totalPaid;
        
        if (balance > 0) {
          delinquentAccounts.push(daysDiff);
        }
      }
    });

    const averageDelinquencyDays = delinquentAccounts.length > 0 ? 
      delinquentAccounts.reduce((sum, days) => sum + days, 0) / delinquentAccounts.length : 0;

    return {
      delinquentCount: delinquentAccounts.length,
      averageDelinquencyDays,
      totalDelinquentAmount: delinquentAccounts.reduce((sum, days) => sum + days, 0)
    };
  };

  const calculateBudgetRecommendations = (payments, charges) => {
    // Generate budget recommendations based on financial analysis
    const recommendations = [];

    // Revenue-based recommendations
    const monthlyRevenue = calculateExpectedMonthlyIncome(payments);
    if (monthlyRevenue > 100000) {
      recommendations.push({
        type: 'revenue_optimization',
        priority: 'medium',
        message: 'Strong revenue performance',
        suggestedAction: 'Consider reinvestment in educational resources'
      });
    }

    // Expense-based recommendations
    const monthlyExpenses = calculateExpectedMonthlyExpenses(charges);
    const expenseRatio = monthlyRevenue > 0 ? monthlyExpenses / monthlyRevenue : 0;
    
    if (expenseRatio > 0.8) {
      recommendations.push({
        type: 'expense_control',
        priority: 'high',
        message: 'High expense ratio detected',
        suggestedAction: 'Review and optimize expense structure'
      });
    }

    return recommendations;
  };

  const calculateOperationalOptimization = (students, assessments) => {
    // Analyze operational efficiency and suggest improvements
    const efficiencyMetrics = calculateEfficiencyMetrics(students, assessments);
    const resourcePlanning = calculateResourcePlanning(students);
    const staffOptimization = calculateStaffOptimization(students, assessments);
    const technologyUtilization = calculateTechnologyUtilization(assessments);

    return {
      efficiencyImprovement: efficiencyMetrics,
      resourcePlanning,
      staffOptimization,
      technologyUtilization
    };
  };

  const calculateEfficiencyMetrics = (students, assessments) => {
    // Calculate various efficiency metrics
    const studentTeacherRatio = students.length > 0 ? 
      students.length / Math.max(1, 50) : 0; // Assuming 50 teachers
    
    const assessmentCompletionRate = assessments.length > 0 ? 
      assessments.filter(a => parseFloat(a.score || 0) > 0).length / assessments.length : 0;

    const recommendations = [];

    if (studentTeacherRatio > 30) {
      recommendations.push({
        area: 'class_size',
        priority: 'high',
        message: 'High student-teacher ratio',
        suggestedAction: 'Consider hiring additional teachers'
      });
    }

    if (assessmentCompletionRate < 0.8) {
      recommendations.push({
        area: 'assessment_process',
        priority: 'medium',
        message: 'Low assessment completion rate',
        suggestedAction: 'Streamline assessment procedures'
      });
    }

    return recommendations;
  };

  const calculateResourcePlanning = (students) => {
    // Analyze resource allocation
    const classDistribution = {};
    
    students.forEach(student => {
      const classId = student.class?.id;
      const className = student.class?.name || 'Unknown';
      
      if (!classDistribution[classId]) {
        classDistribution[classId] = { name: className, students: 0 };
      }
      
      classDistribution[classId].students++;
    });

    const planningRecommendations = [];

    Object.values(classDistribution).forEach(cls => {
      if (cls.students > 45) {
        planningRecommendations.push({
          type: 'class_capacity',
          priority: 'high',
          class: cls.name,
          message: `Class ${cls.name} over capacity (${cls.students} students)`,
          suggestedAction: 'Split class or add teaching assistant'
        });
      }
    });

    return planningRecommendations;
  };

  const calculateStaffOptimization = (students, assessments) => {
    // Analyze staff workload and performance
    const staffWorkload = {}; // Placeholder - would need teacher data
    
    const optimizationRecommendations = [
      {
        type: 'professional_development',
        priority: 'medium',
        message: 'Regular teacher training recommended',
        suggestedAction: 'Implement monthly professional development sessions'
      },
      {
        type: 'performance_monitoring',
        priority: 'low',
        message: 'Implement staff performance monitoring system',
        suggestedAction: 'Set up regular performance reviews'
      }
    ];

    return optimizationRecommendations;
  };

  const calculateTechnologyUtilization = (assessments) => {
    // Analyze technology usage patterns
    const utilizationRate = 0.65; // Placeholder - would track actual usage
    
    const recommendations = [];

    if (utilizationRate < 0.5) {
      recommendations.push({
        type: 'technology_adoption',
        priority: 'medium',
        message: 'Low technology utilization',
        suggestedAction: 'Provide technology training and support'
      });
    }

    return {
      currentUtilization: utilizationRate,
      recommendations
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div>Loading predictive insights...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message="AI-Powered Predictive Analytics"
            description="Advanced insights powered by machine learning algorithms to forecast performance, identify risks, and optimize operations."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        </Col>
      </Row>

      {/* Academic Forecasting */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Academic Forecasting" extra={<BulbOutlined />}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Performance Prediction">
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    {insights.academicForecasting.performancePrediction.slice(0, 5).map((student, index) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          {student.studentName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Current: {student.currentAverage?.toFixed(1)}% → Predicted: {student.predictedAverage?.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '10px' }}>
                          <Tag color={student.trend === 'improving' ? 'green' : student.trend === 'declining' ? 'red' : 'blue'}>
                            {student.trend}
                          </Tag>
                          <Tag color={student.confidence === 'high' ? 'green' : student.confidence === 'medium' ? 'orange' : 'gray'}>
                            {student.confidence} confidence
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="At-Risk Students">
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    {insights.academicForecasting.riskIdentification.slice(0, 8).map((student, index) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #fff1f0', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#f5222d' }}>
                          {student.studentName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Risk Level: <Tag color="red">{student.riskLevel}</Tag>
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '4px' }}>
                          {student.riskFactors.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="Resource Optimization">
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    {insights.academicForecasting.resourceOptimization.slice(0, 5).map((rec, index) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #f6ffed', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                          <Tag color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'orange' : 'blue'}>
                            {rec.type.replace('_', ' ').toUpperCase()}
                          </Tag>
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                          {rec.message}
                        </div>
                        <div style={{ fontSize: '9px', marginTop: '4px', color: '#1890ff' }}>
                          → {rec.suggestedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Financial Forecasting */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Financial Forecasting" extra={<DollarOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Revenue Prediction">
                  <div style={{ height: '250px' }}>
                    <ReactECharts
                      option={{
                        xAxis: {
                          type: 'category',
                          data: insights.financialForecasting.revenuePrediction.predictions?.map(p => p.monthName) || []
                        },
                        yAxis: {
                          type: 'value'
                        },
                        series: [{
                          data: insights.financialForecasting.revenuePrediction.predictions?.map(p => p.predictedRevenue) || [],
                          type: 'line',
                          color: '#52c41a',
                          symbolSize: 8
                        }]
                      }}
                      style={{ height: '200px' }}
                    />
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <Tag color={insights.financialForecasting.revenuePrediction.confidence === 'high' ? 'green' : 'orange'}>
                        {insights.financialForecasting.revenuePrediction.confidence} confidence
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card size="small" title="Cash Flow Projection">
                  <div style={{ height: '250px' }}>
                    <ReactECharts
                      option={{
                        xAxis: {
                          type: 'category',
                          data: insights.financialForecasting.cashFlowProjection?.map(p => p.monthName) || []
                        },
                        yAxis: {
                          type: 'value'
                        },
                        series: [{
                          data: insights.financialForecasting.cashFlowProjection?.map(p => p.netCashFlow) || [],
                          type: 'bar',
                          color: '#1890ff'
                        }]
                      }}
                      style={{ height: '200px' }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center' }}>
                      Projected 3-month cash flow: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>KES {insights.financialForecasting.cashFlowProjection[2]?.cumulativeBalance?.toFixed(0) || '0'}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Operational Optimization */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Operational Optimization" extra={<AlertOutlined />}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Efficiency Improvements">
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    {insights.operationalOptimization.efficiencyImprovement?.slice(0, 4).map((rec, index) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #e6f7ff', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                          <Tag color={rec.priority === 'high' ? 'red' : 'orange'}>
                            {rec.area.replace('_', ' ').toUpperCase()}
                          </Tag>
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                          {rec.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="Resource Planning">
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    {insights.operationalOptimization.resourcePlanning?.slice(0, 4).map((rec, index) => (
                      <div key={index} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #fff7e6', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                          {rec.class}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                          {rec.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="Technology Utilization">
                  <div style={{ height: '200px' }}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                        {Math.round(insights.operationalOptimization.technologyUtilization.currentUtilization * 100)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Current Utilization Rate
                      </div>
                      <Progress
                        percent={insights.operationalOptimization.technologyUtilization.currentUtilization * 100}
                        status="active"
                        strokeColor="#722ed1"
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PredictiveInsights;
