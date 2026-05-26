import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Student Progress Timeline Chart
 * Shows individual student progress over time with subject breakdown
 */
export const StudentProgressTimelineChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  selectedStudent = null,
  subjects = [],
  timeRange = 'termly'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Progress Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for timeline
    const { timelineData, categories, series } = processTimelineData(data, subjects, timeRange);
    
    return {
      title: {
        text: selectedStudent ? `Progress Timeline: ${selectedStudent.name}` : 'Student Progress Timeline',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          try {
            if (!params || !Array.isArray(params) || params.length === 0) {
              return '<div>No data available</div>';
            }
            
            let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue || 'Unknown Period'}</div>`;
            
            params.forEach(param => {
              if (param && param.value !== null && param.value !== undefined && param.seriesName) {
                result += `
                  <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color || '#3699ff'}; border-radius: 50%; margin-right: 8px;"></span>
                    <span>${param.seriesName}:</span>
                    <span style="font-weight: bold; margin-left: 10px;">${(param.value || 0).toFixed(1)}%</span>
                  </div>
                `;
              }
            });
            
            // Add average if multiple subjects
            if (params.length > 1) {
              const validValues = params.filter(p => p && p.value !== null && p.value !== undefined);
              if (validValues.length > 0) {
                const average = validValues.reduce((sum, p) => sum + p.value, 0) / validValues.length;
                result += `
                  <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; font-weight: bold;">
                    Average: ${average.toFixed(1)}%
                  </div>
                `;
              }
            }
            
            return result;
          } catch (error) {
            console.warn('Timeline tooltip formatter error:', error);
            return '<div>Error displaying data</div>';
          }
        }
      },
      legend: {
        data: subjects.map(s => s.name || `Subject ${s.id || 'Unknown'}`),
        bottom: 10,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLabel: {
          fontSize: 11,
          rotate: categories.length > 6 ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: series.map((s, index) => ({
        name: s.name,
        type: 'line',
        stack: null,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series'
        },
        data: s.data,
        itemStyle: {
          color: getSubjectColor(s.name, index)
        },
        areaStyle: {
          opacity: 0.3
        },
        markPoint: {
          data: s.data.map((value, dataIndex) => ({
            value: value,
            coord: [categories[dataIndex], value],
            symbol: value >= 80 ? 'path://M512 85.333333c-235.52 0-426.666667 191.146667-426.666667 426.666667s191.146667 426.666667 426.666667 426.666667 426.666667-191.146667 426.666667-426.666667-191.146667-426.666667-426.666667-426.666667z m0 85.333334c188.586667 0 341.333333 152.746667 341.333333 341.333333s-152.746667 341.333333-341.333333 341.333333-341.333333-152.746667-341.333333-341.333333 152.746667-341.333333 341.333333-341.333333z' : null,
            symbolSize: value >= 80 ? 15 : 0,
            itemStyle: {
              color: '#10b981'
            }
          })).filter(point => point.symbol !== null)
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#e74c3c',
            type: 'dashed'
          },
          data: [
            {
              yAxis: 80,
              label: {
                formatter: 'Excellence Threshold',
                position: 'end'
              }
            }
          ]
        }
      })),
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { 
            type: ['line', 'bar', 'area'], 
            title: { line: 'Line', bar: 'Bar', area: 'Area' } 
          },
          brush: { title: { brush: 'Brush', clear: 'Clear' } }
        },
        right: 10,
        top: 10
      },
      brush: {
        xAxisIndex: 0,
        toolbox: ['lineX', 'clear'],
        throttle: 50
      }
    };
  };

  const processTimelineData = (data, subjects, timeRange) => {
    const timeGroups = {};
    const categories = [];
    
    // Group assessments by time periods
    data.forEach(assessment => {
      const date = new Date(assessment.date || assessment.createdAt);
      let key;
      
      switch(timeRange) {
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'weekly':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'termly':
          const term = Math.ceil((date.getMonth() + 1) / 4);
          key = `${date.getFullYear()}-T${term}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!timeGroups[key]) {
        timeGroups[key] = {};
      }
      
      const subjectName = assessment.subject?.name || assessment.subject || 'Unknown';
      if (!timeGroups[key][subjectName]) {
        timeGroups[key][subjectName] = [];
      }
      
      timeGroups[key][subjectName].push(parseFloat(assessment.score || 0));
    });
    
    // Create categories and series data
    const sortedKeys = Object.keys(timeGroups).sort();
    const series = subjects.map(subject => {
      const subjectName = subject.name || `Subject ${subject.id || 'Unknown'}`;
      return {
        name: subjectName,
        data: sortedKeys.map(key => {
          const scores = timeGroups[key][subjectName] || [];
          return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
        })
      };
    });
    
    return {
      timelineData: timeGroups,
      categories: sortedKeys,
      series
    };
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
      className="student-progress-timeline-chart"
    />
  );
};

export default StudentProgressTimelineChart;
