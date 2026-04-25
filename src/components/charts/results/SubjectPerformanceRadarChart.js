import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Subject Performance Radar Chart
 * Multi-dimensional comparison of subject performance across classes
 */
export const SubjectPerformanceRadarChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  metrics = ['Average Score', 'Excellence Rate', 'Participation', 'Improvement', 'Consistency'],
  showComparison = false
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Subject Performance Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for radar chart
    const radarData = processRadarData(data, metrics);
    
    return {
      title: {
        text: 'Subject Performance Analysis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          try {
            if (!params || !params.data || !params.name) {
              return '<div>No data available</div>';
            }
            
            const subjectData = params.data;
            if (!subjectData.value || !Array.isArray(subjectData.value)) {
              return `<div style="font-weight: bold;">${params.name}</div><div>Invalid data format</div>`;
            }
            
            const metricsHtml = subjectData.value.map((value, index) => {
              if (index >= metrics.length) return '';
              return `
                <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                  <span>${metrics[index]}:</span>
                  <span style="font-weight: bold; margin-left: 10px;">${(value || 0).toFixed(1)}%</span>
                </div>
              `;
            }).join('');
            
            const overallScore = calculateOverallScore(subjectData.value);
            
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              ${metricsHtml}
              <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; font-weight: bold;">
                Overall Score: ${overallScore.toFixed(1)}%
              </div>
            `;
          } catch (error) {
            console.warn('Tooltip formatter error:', error);
            return '<div>Error displaying data</div>';
          }
        }
      },
      legend: {
        bottom: 10,
        data: radarData.map(item => item.name),
        type: 'scroll'
      },
      radar: {
        indicator: metrics.map(metric => ({
          name: metric,
          max: 100,
          min: 0,
          axisLabel: { fontSize: 11 }
        })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          fontSize: 12,
          color: '#333'
        },
        splitLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(54, 153, 255, 0.1)', 'rgba(54, 153, 255, 0.05)']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      series: [
        {
          name: 'Subject Performance',
          type: 'radar',
          data: radarData.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: getSubjectColor(item.name, index)
            },
            areaStyle: {
              opacity: 0.3
            },
            lineStyle: {
              width: 2
            }
          })),
          emphasis: {
            lineStyle: {
              width: 4,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            areaStyle: {
              opacity: 0.5
            }
          }
        }
      ],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { 
            type: ['radar', 'line'], 
            title: { radar: 'Radar', line: 'Line' } 
          }
        },
        right: 10,
        top: 10
      }
    };
  };

  const processRadarData = (data, metrics) => {
    return data.map(subjectData => {
      const values = metrics.map(metric => {
        switch(metric) {
          case 'Average Score':
            return calculateAverageScore(subjectData.assessments);
          case 'Excellence Rate':
            return calculateExcellenceRate(subjectData.assessments);
          case 'Participation':
            return calculateParticipationRate(subjectData);
          case 'Improvement':
            return calculateImprovementRate(subjectData.assessments);
          case 'Consistency':
            return calculateConsistencyScore(subjectData.assessments);
          default:
            return 0;
        }
      });
      
      return {
        name: subjectData.subjectName || `Subject ${subjectData.id}`,
        value: values
      };
    });
  };

  const calculateAverageScore = (assessments) => {
    if (!assessments || assessments.length === 0) return 0;
    const scores = assessments.map(a => parseFloat(a.score || 0));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const calculateExcellenceRate = (assessments) => {
    if (!assessments || assessments.length === 0) return 0;
    const excellentCount = assessments.filter(a => parseFloat(a.score || 0) >= 80).length;
    return (excellentCount / assessments.length) * 100;
  };

  const calculateParticipationRate = (subjectData) => {
    const totalStudents = subjectData.totalStudents || 0;
    const assessedStudents = subjectData.assessedStudents || 0;
    return totalStudents > 0 ? (assessedStudents / totalStudents) * 100 : 0;
  };

  const calculateImprovementRate = (assessments) => {
    if (!assessments || assessments.length < 2) return 50; // Default to neutral
    
    const sortedAssessments = assessments.sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    );
    
    const firstHalf = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 2));
    const secondHalf = sortedAssessments.slice(Math.floor(sortedAssessments.length / 2));
    
    const firstAvg = calculateAverageScore(firstHalf);
    const secondAvg = calculateAverageScore(secondHalf);
    
    const improvement = secondAvg - firstAvg;
    return Math.max(0, Math.min(100, 50 + improvement)); // Normalize to 0-100
  };

  const calculateConsistencyScore = (assessments) => {
    if (!assessments || assessments.length < 2) return 50;
    
    const scores = assessments.map(a => parseFloat(a.score || 0));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
  };

  const calculateOverallScore = (values) => {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const getSubjectColor = (subjectName, index) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="subject-performance-radar-chart"
    />
  );
};

export default SubjectPerformanceRadarChart;
