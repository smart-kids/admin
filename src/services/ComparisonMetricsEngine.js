/**
 * Comparison Metrics Engine
 * Handles advanced metrics calculations for finance and results comparisons
 */

class ComparisonMetricsEngine {
  constructor() {
    this.gradeThresholds = {
      A: { min: 80, max: 100, points: 4 },
      B: { min: 70, max: 79, points: 3 },
      C: { min: 60, max: 69, points: 2 },
      D: { min: 50, max: 59, points: 1 },
      E: { min: 40, max: 49, points: 0.5 },
      F: { min: 0, max: 39, points: 0 }
    };
  }

  /**
   * Calculate comprehensive finance metrics
   */
  calculateFinanceMetrics(data, timeRange = 'monthly') {
    const payments = this.filterValidPayments(data);
    const charges = this.extractCharges(data);
    
    return {
      // Revenue Metrics
      totalRevenue: this.calculateTotalRevenue(payments),
      averageRevenue: this.calculateAverageRevenue(payments),
      revenueGrowth: this.calculateRevenueGrowth(payments, timeRange),
      
      // Collection Metrics
      collectionRate: this.calculateCollectionRate(payments, charges),
      outstandingBalance: this.calculateOutstandingBalance(payments, charges),
      agingAnalysis: this.calculateAgingAnalysis(payments, charges),
      
      // Payment Method Analysis
      paymentMethods: this.analyzePaymentMethods(payments),
      methodDistribution: this.calculateMethodDistribution(payments),
      
      // Performance Metrics
      efficiency: this.calculateCollectionEfficiency(payments),
      velocity: this.calculatePaymentVelocity(payments),
      predictability: this.calculateRevenuePredictability(payments),
      
      // Comparative Metrics
      classRanking: this.calculateClassRanking(payments),
      streamComparison: this.calculateStreamComparison(payments),
      termPerformance: this.calculateTermPerformance(payments)
    };
  }

  /**
   * Calculate comprehensive results metrics
   */
  calculateResultsMetrics(data, timeRange = 'monthly') {
    const assessments = this.filterValidAssessments(data);
    
    return {
      // Performance Metrics
      averageScore: this.calculateAverageScore(assessments),
      scoreDistribution: this.calculateScoreDistribution(assessments),
      gradeDistribution: this.calculateGradeDistribution(assessments),
      
      // Subject Analysis
      subjectPerformance: this.analyzeSubjectPerformance(assessments),
      subjectMastery: this.calculateSubjectMastery(assessments),
      crossSubjectAnalysis: this.analyzeCrossSubjectPerformance(assessments),
      
      // Student Analysis
      studentRanking: this.calculateStudentRanking(assessments),
      performanceTrends: this.calculatePerformanceTrends(assessments),
      improvementRate: this.calculateImprovementRate(assessments),
      
      // Quality Metrics
      consistency: this.calculateScoreConsistency(assessments),
      excellence: this.calculateExcellenceMetrics(assessments),
      completionRate: this.calculateCompletionRate(assessments),
      
      // Comparative Metrics
      classComparison: this.calculateClassComparison(assessments),
      streamAnalysis: this.calculateStreamAnalysis(assessments),
      termProgression: this.calculateTermProgression(assessments)
    };
  }

  /**
   * Finance Metrics Implementation
   */
  filterValidPayments(data) {
    return data.filter(item => 
      item && 
      (item.status === 'COMPLETED' || item.status === 'PENDING') &&
      parseFloat(item.amount) > 0
    );
  }

  extractCharges(data) {
    return data.filter(item => 
      item && 
      (item.type === 'charge' || item.category === 'fee') &&
      parseFloat(item.amount) > 0
    );
  }

  calculateTotalRevenue(payments) {
    return payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  }

  calculateAverageRevenue(payments) {
    return payments.length > 0 ? this.calculateTotalRevenue(payments) / payments.length : 0;
  }

  calculateRevenueGrowth(payments, timeRange) {
    const timeGroups = this.groupByTime(payments, timeRange);
    const periods = Object.keys(timeGroups).sort();
    
    if (periods.length < 2) return 0;
    
    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    const firstRevenue = this.calculateTotalRevenue(timeGroups[firstPeriod]);
    const lastRevenue = this.calculateTotalRevenue(timeGroups[lastPeriod]);
    
    return firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : 0;
  }

  calculateCollectionRate(payments, charges) {
    const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const totalPaid = this.calculateTotalRevenue(payments);
    
    return totalCharges > 0 ? (totalPaid / totalCharges) * 100 : 0;
  }

  calculateOutstandingBalance(payments, charges) {
    const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const totalPaid = this.calculateTotalRevenue(payments);
    
    return Math.max(0, totalCharges - totalPaid);
  }

  calculateAgingAnalysis(payments, charges) {
    const outstanding = this.calculateOutstandingBalance(payments, charges);
    const now = new Date();
    
    return {
      current: this.calculateAgingByPeriod(charges, payments, now, 30),
      days30: this.calculateAgingByPeriod(charges, payments, now, 60),
      days60: this.calculateAgingByPeriod(charges, payments, now, 90),
      days90: this.calculateAgingByPeriod(charges, payments, now, Infinity),
      total: outstanding
    };
  }

  calculateAgingByPeriod(charges, payments, now, maxDays) {
    const cutoffDate = new Date(now.getTime() - (maxDays * 24 * 60 * 60 * 1000));
    
    const relevantCharges = charges.filter(charge => 
      new Date(charge.dueDate || charge.createdAt) < cutoffDate
    );
    
    const relevantPayments = payments.filter(payment => 
      new Date(payment.date || payment.createdAt) < cutoffDate
    );
    
    const totalCharges = relevantCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const totalPaid = relevantPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    return Math.max(0, totalCharges - totalPaid);
  }

  analyzePaymentMethods(payments) {
    const methods = {};
    
    payments.forEach(payment => {
      const method = payment.paymentMethod || payment.type || 'unknown';
      if (!methods[method]) {
        methods[method] = {
          count: 0,
          total: 0,
          average: 0
        };
      }
      methods[method].count++;
      methods[method].total += parseFloat(payment.amount || 0);
    });
    
    // Calculate averages
    Object.keys(methods).forEach(method => {
      methods[method].average = methods[method].count > 0 ? 
        methods[method].total / methods[method].count : 0;
    });
    
    return methods;
  }

  calculateMethodDistribution(payments) {
    const methods = this.analyzePaymentMethods(payments);
    const total = payments.length;
    
    const distribution = {};
    Object.keys(methods).forEach(method => {
      distribution[method] = {
        count: methods[method].count,
        percentage: total > 0 ? (methods[method].count / total) * 100 : 0,
        amount: methods[method].total,
        amountPercentage: this.calculateTotalRevenue(payments) > 0 ? 
          (methods[method].total / this.calculateTotalRevenue(payments)) * 100 : 0
      };
    });
    
    return distribution;
  }

  calculateCollectionEfficiency(payments) {
    const successfulPayments = payments.filter(p => p.status === 'COMPLETED');
    const totalAttempts = payments.length;
    
    return totalAttempts > 0 ? (successfulPayments.length / totalAttempts) * 100 : 0;
  }

  calculatePaymentVelocity(payments) {
    if (payments.length < 2) return 0;
    
    const sortedPayments = payments.sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    );
    
    const firstDate = new Date(sortedPayments[0].date || sortedPayments[0].createdAt);
    const lastDate = new Date(sortedPayments[sortedPayments.length - 1].date || sortedPayments[sortedPayments.length - 1].createdAt);
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    return daysDiff > 0 ? payments.length / daysDiff : 0;
  }

  calculateRevenuePredictability(payments) {
    // Calculate coefficient of variation for revenue predictability
    const monthlyRevenue = this.groupByTime(payments, 'monthly');
    const revenues = Object.values(monthlyRevenue).map(month => this.calculateTotalRevenue(month));
    
    if (revenues.length < 2) return 100; // Not enough data
    
    const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? (stdDev / mean) * 100 : 100; // Lower is more predictable
  }

  /**
   * Results Metrics Implementation
   */
  filterValidAssessments(data) {
    return data.filter(item => 
      item && 
      item.score != null && 
      !isNaN(parseFloat(item.score)) &&
      parseFloat(item.score) >= 0
    );
  }

  calculateAverageScore(assessments) {
    const scores = assessments.map(a => parseFloat(a.score));
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  calculateScoreDistribution(assessments) {
    const scores = assessments.map(a => parseFloat(a.score));
    const sorted = scores.sort((a, b) => a - b);
    
    return {
      min: sorted.length > 0 ? sorted[0] : 0,
      max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      median: sorted.length > 0 ? this.calculateMedian(sorted) : 0,
      mean: this.calculateAverageScore(assessments),
      standardDeviation: this.calculateStandardDeviation(scores),
      quartiles: this.calculateQuartiles(sorted)
    };
  }

  calculateMedian(sortedArray) {
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 === 0 ? 
      (sortedArray[mid - 1] + sortedArray[mid]) / 2 : 
      sortedArray[mid];
  }

  calculateStandardDeviation(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  calculateQuartiles(sortedArray) {
    if (sortedArray.length === 0) return { q1: 0, q2: 0, q3: 0 };
    
    const q1Index = Math.floor(sortedArray.length * 0.25);
    const q2Index = Math.floor(sortedArray.length * 0.5);
    const q3Index = Math.floor(sortedArray.length * 0.75);
    
    return {
      q1: sortedArray[q1Index],
      q2: sortedArray[q2Index],
      q3: sortedArray[q3Index]
    };
  }

  calculateGradeDistribution(assessments) {
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    const totalPoints = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    assessments.forEach(assessment => {
      const score = parseFloat(assessment.score);
      const grade = this.getGrade(score);
      distribution[grade]++;
      totalPoints[grade] += this.gradeThresholds[grade].points;
    });
    
    // Calculate percentages
    const total = assessments.length;
    const percentages = {};
    Object.keys(distribution).forEach(grade => {
      percentages[grade] = total > 0 ? (distribution[grade] / total) * 100 : 0;
    });
    
    return {
      counts: distribution,
      percentages,
      totalPoints,
      averagePoints: total > 0 ? 
        Object.values(totalPoints).reduce((sum, points) => sum + points, 0) / total : 0
    };
  }

  getGrade(score) {
    for (const [grade, threshold] of Object.entries(this.gradeThresholds)) {
      if (score >= threshold.min && score <= threshold.max) {
        return grade;
      }
    }
    return 'F';
  }

  analyzeSubjectPerformance(assessments) {
    const subjects = {};
    
    assessments.forEach(assessment => {
      const subject = assessment.subject?.name || assessment.subject || 'unknown';
      if (!subjects[subject]) {
        subjects[subject] = {
          scores: [],
          count: 0,
          total: 0
        };
      }
      subjects[subject].scores.push(parseFloat(assessment.score));
      subjects[subject].count++;
      subjects[subject].total += parseFloat(assessment.score);
    });
    
    // Calculate statistics for each subject
    Object.keys(subjects).forEach(subject => {
      const scores = subjects[subject].scores;
      subjects[subject].average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      subjects[subject].max = Math.max(...scores);
      subjects[subject].min = Math.min(...scores);
      subjects[subject].standardDeviation = this.calculateStandardDeviation(scores);
      subjects[subject].gradeDistribution = this.calculateGradeDistribution(
        assessments.filter(a => (a.subject?.name || a.subject) === subject)
      );
    });
    
    return subjects;
  }

  calculateSubjectMastery(assessments) {
    const subjectPerformance = this.analyzeSubjectPerformance(assessments);
    const mastery = {};
    
    Object.keys(subjectPerformance).forEach(subject => {
      const avg = subjectPerformance[subject].average;
      mastery[subject] = {
        level: avg >= 80 ? 'Excellent' : avg >= 70 ? 'Good' : avg >= 60 ? 'Average' : 'Needs Improvement',
        score: avg,
        grade: this.getGrade(avg),
        consistency: avg > 0 ? (1 - (subjectPerformance[subject].standardDeviation / avg)) * 100 : 0
      };
    });
    
    return mastery;
  }

  calculateStudentRanking(assessments) {
    const studentScores = {};
    
    assessments.forEach(assessment => {
      const studentId = assessment.student?.id || assessment.student;
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          scores: [],
          totalPoints: 0,
          count: 0
        };
      }
      
      const score = parseFloat(assessment.score);
      studentScores[studentId].scores.push(score);
      studentScores[studentId].totalPoints += this.gradeThresholds[this.getGrade(score)].points;
      studentScores[studentId].count++;
    });
    
    // Calculate rankings
    const rankings = Object.entries(studentScores).map(([studentId, data]) => ({
      studentId,
      averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      totalPoints: data.totalPoints,
      assessmentCount: data.count,
      rank: 0 // Will be calculated below
    }));
    
    // Sort and assign ranks
    rankings.sort((a, b) => b.totalPoints - a.totalPoints);
    rankings.forEach((student, index) => {
      student.rank = index + 1;
    });
    
    return rankings;
  }

  calculatePerformanceTrends(assessments) {
    const timeGroups = this.groupByTime(assessments, 'monthly');
    const trends = [];
    
    const sortedPeriods = Object.keys(timeGroups).sort();
    for (let i = 1; i < sortedPeriods.length; i++) {
      const currentPeriod = sortedPeriods[i];
      const previousPeriod = sortedPeriods[i - 1];
      
      const currentAvg = this.calculateAverageScore(timeGroups[currentPeriod]);
      const previousAvg = this.calculateAverageScore(timeGroups[previousPeriod]);
      
      trends.push({
        period: currentPeriod,
        average: currentAvg,
        change: currentAvg - previousAvg,
        changePercentage: previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0
      });
    }
    
    return trends;
  }

  calculateImprovementRate(assessments) {
    const trends = this.calculatePerformanceTrends(assessments);
    if (trends.length === 0) return 0;
    
    const improvements = trends.filter(trend => trend.change > 0).length;
    return (improvements / trends.length) * 100;
  }

  /**
   * Utility methods
   */
  groupByTime(data, timeRange) {
    const groups = {};
    
    data.forEach(item => {
      const date = new Date(item.date || item.createdAt || item.time);
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
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    return groups;
  }

  // Placeholder methods for comparative metrics
  calculateClassRanking(payments) { return []; }
  calculateStreamComparison(payments) { return {}; }
  calculateTermPerformance(payments) { return {}; }
  analyzeCrossSubjectPerformance(assessments) { return {}; }
  calculateClassComparison(assessments) { return {}; }
  calculateStreamAnalysis(assessments) { return {}; }
  calculateTermProgression(assessments) { return {}; }
  calculateScoreConsistency(assessments) { return 0; }
  calculateExcellenceMetrics(assessments) { return {}; }
  calculateCompletionRate(assessments) { return 0; }
}

export default ComparisonMetricsEngine;
