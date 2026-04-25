// Utility functions for formatting data in the dashboard

export const formatCurrency = (amount, currency = 'KES') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency} 0`;
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  } else {
    return num.toFixed(decimals);
  }
};

export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  return value.toFixed(decimals) + '%';
};

export const formatTrend = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { value: '0%', isPositive: false, displayValue: '0%' };
  }
  
  const isPositive = value >= 0;
  const displayValue = (isPositive ? '+' : '') + value.toFixed(decimals) + '%';
  
  return {
    value: value.toFixed(decimals) + '%',
    isPositive,
    displayValue,
    arrow: isPositive ? '↑' : '↓'
  };
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
};

export const calculateGrowthRate = (current, previous) => {
  if (previous === 0 || typeof previous !== 'number') {
    return 0;
  }
  
  return ((current - previous) / previous) * 100;
};

export const calculateMovingAverage = (data, period = 3) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - period + 1);
    const subset = data.slice(start, i + 1);
    const average = subset.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) / subset.length;
    result.push(average);
  }
  
  return result;
};

export const groupByPeriod = (data, dateField, valueField, period = 'monthly') => {
  if (!Array.isArray(data)) {
    return {};
  }
  
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    if (isNaN(date.getTime())) return;
    
    let key;
    switch (period) {
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
      case 'quarterly':
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        values: [],
        total: 0,
        count: 0
      };
    }
    
    const value = parseFloat(item[valueField]) || 0;
    grouped[key].values.push(value);
    grouped[key].total += value;
    grouped[key].count += 1;
  });
  
  // Calculate averages and convert to array
  return Object.values(grouped).map(group => ({
    ...group,
    average: group.count > 0 ? group.total / group.count : 0
  })).sort((a, b) => a.period.localeCompare(b.period));
};

export const getPercentile = (data, percentile) => {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }
  
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

export const getStandardDeviation = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  
  return Math.sqrt(avgSquaredDiff);
};

export const rankItems = (items, valueField, descending = true) => {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items
    .map((item, index) => ({
      ...item,
      rank: 0,
      value: typeof item[valueField] === 'number' ? item[valueField] : 0
    }))
    .sort((a, b) => descending ? b.value - a.value : a.value - b.value)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      percentile: ((items.length - index) / items.length) * 100
    }));
};

export const colorForValue = (value, thresholds = { good: 80, warning: 60 }) => {
  if (typeof value !== 'number') {
    return '#6c757d'; // gray
  }
  
  if (value >= thresholds.good) {
    return '#10b981'; // green
  } else if (value >= thresholds.warning) {
    return '#f6c23e'; // yellow
  } else {
    return '#e74c3c'; // red
  }
};

export const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const pluralize = (count, singular, plural = null) => {
  if (typeof count !== 'number') {
    return plural || singular + 's';
  }
  
  if (count === 1) {
    return singular;
  }
  
  return plural || singular + 's';
};
