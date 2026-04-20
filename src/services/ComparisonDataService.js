/**
 * Data Aggregation Service for Class and Stream Comparisons
 * Handles multi-dimensional data aggregation and comparative metrics
 */

class ComparisonDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Multi-dimensional data aggregation by classes, streams, and time
   */
  aggregateByClassesAndStreams(data, dimension, timeRange = 'monthly') {
    const cacheKey = JSON.stringify({ data: data.length, dimension, timeRange });
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const aggregated = data.reduce((acc, item) => {
      const classId = item.class?.id || item.class_id || 'unknown';
      const streamId = item.stream?.id || item.stream_id || 'default';
      const timeKey = this.getTimeKey(item.date || item.createdAt || item.time, timeRange);
      
      if (!acc[classId]) acc[classId] = {};
      if (!acc[classId][streamId]) acc[classId][streamId] = {};
      if (!acc[classId][streamId][timeKey]) acc[classId][streamId][timeKey] = [];
      
      acc[classId][streamId][timeKey].push(item);
      return acc;
    }, {});

    // Cache the result
    this.cache.set(cacheKey, {
      data: aggregated,
      timestamp: Date.now()
    });

    return aggregated;
  }

  /**
   * Calculate comparative metrics for aggregated data
   */
  calculateComparativeMetrics(aggregatedData, metricType = 'finance') {
    return Object.entries(aggregatedData).map(([classId, streams]) => ({
      classId,
      className: this.getClassName(classId),
      streams: Object.entries(streams).map(([streamId, timeData]) => ({
        streamId,
        streamName: this.getStreamName(streamId),
        metrics: this.calculateMetrics(timeData, metricType),
        comparisons: this.calculateComparisons(timeData, metricType),
        trends: this.calculateTrends(timeData, metricType)
      }))
    }));
  }

  /**
   * Calculate specific metrics based on data type
   */
  calculateMetrics(timeData, metricType) {
    const allData = Object.values(timeData).flat();
    
    if (metricType === 'finance') {
      return this.calculateFinanceMetrics(allData);
    } else if (metricType === 'results') {
      return this.calculateResultsMetrics(allData);
    }
    
    return this.calculateGenericMetrics(allData);
  }

  /**
   * Finance-specific metrics calculation
   */
  calculateFinanceMetrics(data) {
    const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const validPayments = data.filter(item => 
      item.status === 'COMPLETED' || item.status === 'PENDING'
    );
    const totalPaid = validPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    return {
      totalRevenue,
      totalPaid,
      outstandingBalance: totalRevenue - totalPaid,
      collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
      transactionCount: data.length,
      averageTransaction: data.length > 0 ? totalRevenue / data.length : 0,
      paymentMethods: this.groupByPaymentMethod(data),
      growthRate: this.calculateGrowthRate(data)
    };
  }

  /**
   * Results-specific metrics calculation
   */
  calculateResultsMetrics(data) {
    const validScores = data.filter(item => item.score != null && !isNaN(parseFloat(item.score)));
    const scores = validScores.map(item => parseFloat(item.score));
    
    return {
      averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      gradeDistribution: this.calculateGradeDistribution(validScores),
      subjectMastery: this.calculateSubjectMastery(data),
      completionRate: (validScores.length / data.length) * 100,
      performanceTrend: this.calculatePerformanceTrend(data)
    };
  }

  /**
   * Generic metrics calculation
   */
  calculateGenericMetrics(data) {
    return {
      totalCount: data.length,
      averageValue: data.length > 0 ? data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0) / data.length : 0,
      maxValue: Math.max(...data.map(item => parseFloat(item.value) || 0)),
      minValue: Math.min(...data.map(item => parseFloat(item.value) || 0))
    };
  }

  /**
   * Calculate comparisons between streams/classes
   */
  calculateComparisons(timeData, metricType) {
    const streams = Object.keys(timeData);
    const comparisons = {};
    
    streams.forEach(stream => {
      comparisons[stream] = {};
      streams.forEach(otherStream => {
        if (stream !== otherStream) {
          comparisons[stream][otherStream] = this.compareStreams(
            timeData[stream], 
            timeData[otherStream], 
            metricType
          );
        }
      });
    });
    
    return comparisons;
  }

  /**
   * Calculate trends over time
   */
  calculateTrends(timeData, metricType) {
    const timeKeys = Object.keys(timeData).sort();
    const trends = [];
    
    for (let i = 1; i < timeKeys.length; i++) {
      const current = this.calculateMetrics({ [timeKeys[i]]: timeData[timeKeys[i]] }, metricType);
      const previous = this.calculateMetrics({ [timeKeys[i-1]]: timeData[timeKeys[i-1]] }, metricType);
      
      trends.push({
        period: timeKeys[i],
        change: this.calculateChange(current, previous),
        growthRate: this.calculateGrowthRateChange(current, previous)
      });
    }
    
    return trends;
  }

  /**
   * Helper methods
   */
  getTimeKey(date, range) {
    const d = new Date(date);
    switch(range) {
      case 'daily': 
        return d.toISOString().split('T')[0];
      case 'weekly': 
        return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      case 'monthly': 
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'termly': 
        return `${d.getFullYear()}-T${Math.ceil(d.getMonth() / 4)}`;
      case 'yearly':
        return d.getFullYear().toString();
      default: 
        return d.toISOString().split('T')[0];
    }
  }

  getClassName(classId) {
    // This would typically fetch from your data store
    return `Class ${classId}`;
  }

  getStreamName(streamId) {
    return streamId === 'default' ? 'Main Stream' : `Stream ${streamId}`;
  }

  groupByPaymentMethod(data) {
    return data.reduce((acc, item) => {
      const method = item.paymentMethod || item.type || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
  }

  calculateGradeDistribution(scores) {
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    scores.forEach(item => {
      const score = parseFloat(item.score);
      if (score >= 80) distribution.A++;
      else if (score >= 70) distribution.B++;
      else if (score >= 60) distribution.C++;
      else if (score >= 50) distribution.D++;
      else if (score >= 40) distribution.E++;
      else distribution.F++;
    });
    
    return distribution;
  }

  calculateSubjectMastery(data) {
    const subjects = {};
    
    data.forEach(item => {
      const subject = item.subject?.name || item.subject || 'unknown';
      if (!subjects[subject]) subjects[subject] = [];
      subjects[subject].push(parseFloat(item.score) || 0);
    });
    
    Object.keys(subjects).forEach(subject => {
      const scores = subjects[subject];
      subjects[subject] = {
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count: scores.length,
        mastery: scores.reduce((sum, score) => sum + score, 0) / scores.length >= 70 ? 'High' : 'Medium'
      };
    });
    
    return subjects;
  }

  calculatePerformanceTrend(data) {
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const trend = sortedData.map((item, index) => ({
      index,
      score: parseFloat(item.score) || 0,
      date: item.date
    }));
    
    return trend;
  }

  compareStreams(stream1Data, stream2Data, metricType) {
    const metrics1 = this.calculateMetrics(stream1Data, metricType);
    const metrics2 = this.calculateMetrics(stream2Data, metricType);
    
    return {
      performanceDifference: this.calculatePerformanceDiff(metrics1, metrics2),
      efficiencyRatio: this.calculateEfficiencyRatio(metrics1, metrics2),
      ranking: this.calculateRanking(metrics1, metrics2)
    };
  }

  calculateChange(current, previous) {
    const changes = {};
    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
        changes[key] = current[key] - previous[key];
      }
    });
    return changes;
  }

  calculateGrowthRateChange(current, previous) {
    const growthRates = {};
    Object.keys(current).forEach(key => {
      if (typeof current[key] === 'number' && typeof previous[key] === 'number' && previous[key] !== 0) {
        growthRates[key] = ((current[key] - previous[key]) / previous[key]) * 100;
      }
    });
    return growthRates;
  }

  calculatePerformanceDiff(metrics1, metrics2) {
    // Implement performance difference calculation
    return {};
  }

  calculateEfficiencyRatio(metrics1, metrics2) {
    // Implement efficiency ratio calculation
    return {};
  }

  calculateRanking(metrics1, metrics2) {
    // Implement ranking calculation
    return {};
  }

  calculateGrowthRate(data) {
    if (data.length < 2) return 0;
    
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstValue = parseFloat(sortedData[0].amount) || 0;
    const lastValue = parseFloat(sortedData[sortedData.length - 1].amount) || 0;
    
    return firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  }

  calculateCompletionRate(data) {
    const completed = data.filter(item => item.status === 'completed' || item.status === 'COMPLETED');
    return data.length > 0 ? (completed.length / data.length) * 100 : 0;
  }

  /**
   * Clear cache method
   */
  clearCache() {
    this.cache.clear();
  }
}

export default ComparisonDataService;
