import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Subject Performance Matrix Chart
 * Shows performance heatmap across subjects and classes
 */
export const PerformanceMatrixChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  showValues = true,
  colorScheme = 'performance'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Performance Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    // Process data for heatmap
    const classNames = [...new Set(data.map(item => item.className || `Class ${item.classId}`))];
    const subjectNames = [...new Set(data.flatMap(item => 
      Object.keys(item.subjectPerformance || {})
    ))];

    // Create heatmap data matrix
    const heatmapData = [];
    classNames.forEach((className, classIndex) => {
      subjectNames.forEach((subjectName, subjectIndex) => {
        const classData = data.find(item => 
          (item.className || `Class ${item.classId}`) === className
        );
        const performance = classData?.subjectPerformance?.[subjectName];
        const score = performance?.average || 0;
        
        heatmapData.push([subjectIndex, classIndex, score]);
      });
    });

    const maxValue = Math.max(...heatmapData.map(d => d[2]));
    const colorRange = getColorRange(colorScheme);

    return {
      title: {
        text: 'Subject Performance by Class',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        position: 'top',
        formatter: function(params) {
          const [subjectIndex, classIndex, score] = params.value;
          const className = classNames[classIndex];
          const subjectName = subjectNames[subjectIndex];
          const classData = data.find(item => 
            (item.className || `Class ${item.classId}`) === className
          );
          const performance = classData?.subjectPerformance?.[subjectName];
          
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${className} - ${subjectName}</div>
            <div>Average Score: ${score.toFixed(1)}%</div>
            <div>Grade: ${getGrade(score)}</div>
            <div>Students: ${performance?.studentCount || 0}</div>
            <div>Rank: ${getSubjectRank(subjectName, score, data)} of ${classNames.length}</div>
          `;
        }
      },
      grid: { 
        height: '70%', 
        top: '15%',
        left: classNames.length > 5 ? '15%' : '10%',
        right: '5%'
      },
      xAxis: { 
        type: 'category', 
        data: subjectNames,
        axisLabel: { 
          fontSize: 11,
          interval: 0,
          rotate: subjectNames.length > 4 ? 45 : 0
        },
        position: 'top'
      },
      yAxis: { 
        type: 'category', 
        data: classNames,
        axisLabel: { 
          fontSize: 11
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: colorRange
        },
        text: ['Excellent', 'Poor'],
        textStyle: {
          fontSize: 11
        }
      },
      series: [{
        type: 'heatmap',
        data: heatmapData,
        label: { 
          show: showValues,
          formatter: function(params) {
            const score = params.value[2];
            return score > 0 ? `${score.toFixed(0)}%` : '';
          },
          fontSize: 10,
          color: '#fff',
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: { 
            shadowBlur: 10, 
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 2,
            borderColor: '#333'
          },
          label: {
            show: true,
            formatter: function(params) {
              const score = params.value[2];
              return `${score.toFixed(1)}%`;
            },
            fontSize: 12,
            color: '#000'
          }
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#fff'
        }
      }],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          magicType: { 
            type: ['heatmap', 'treemap'], 
            title: { heatmap: 'Heatmap', treemap: 'Treemap' } 
          }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getColorRange = (scheme) => {
    const schemes = {
      performance: ['#e74c3c', '#f6c23e', '#3699ff', '#10b981'],
      rainbow: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
      blue: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
      green: ['#fef2f2', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e']
    };
    return schemes[scheme] || schemes.performance;
  };

  const getGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  const getSubjectRank = (subjectName, score, data) => {
    const scores = data.map(item => item.subjectPerformance?.[subjectName]?.average || 0).sort((a, b) => b - a);
    return scores.indexOf(score) + 1;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="performance-matrix-chart"
    />
  );
};

/**
 * Grade Distribution Treemap Chart
 * Shows hierarchical distribution of grades across classes
 */
export const GradeTreemapChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  hierarchy = 'class' // 'class' or 'grade'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Grade Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    let treemapData;

    if (hierarchy === 'class') {
      // Class-based hierarchy
      treemapData = data.map(classData => {
        const className = classData.className || `Class ${classData.classId}`;
        const gradeDistribution = classData.gradeDistribution || {};
        
        const children = Object.entries(gradeDistribution).map(([grade, count]) => ({
          name: `Grade ${grade}`,
          value: count,
          itemStyle: { color: getGradeColor(grade) }
        }));

        return {
          name: className,
          value: Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0),
          children: children.filter(child => child.value > 0),
          itemStyle: { color: getClassColor(classData.classId) }
        };
      });
    } else {
      // Grade-based hierarchy
      const grades = {};
      data.forEach(classData => {
        const className = classData.className || `Class ${classData.classId}`;
        const gradeDistribution = classData.gradeDistribution || {};
        
        Object.entries(gradeDistribution).forEach(([grade, count]) => {
          if (!grades[grade]) {
            grades[grade] = { name: `Grade ${grade}`, children: [], value: 0 };
          }
          grades[grade].children.push({
            name: className,
            value: count,
            itemStyle: { color: getClassColor(classData.classId) }
          });
          grades[grade].value += count;
        });
      });
      treemapData = Object.values(grades);
    }

    return {
      title: {
        text: `Grade Distribution by ${hierarchy === 'class' ? 'Class' : 'Grade Level'}`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function(params) {
          if (params.children) {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>Total Students: ${params.value}</div>
              <div>Categories: ${params.children?.length || 0}</div>
            `;
          } else {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>Students: ${params.value}</div>
              <div>Percentage: ${getGradePercentage(params.name, params.value, data)}%</div>
            `;
          }
        }
      },
      series: [{
        type: 'treemap',
        data: treemapData,
        roam: true,
        nodeClick: 'zoomToNode',
        zoomToNodeRatio: 0.99,
        level: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5
            },
            upperLabel: {
              show: true,
              height: 30,
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold'
            }
          },
          {
            itemStyle: {
              borderWidth: 1,
              gapWidth: 2,
              borderColor: '#fff'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              show: true,
              fontSize: 11,
              color: '#fff',
              fontWeight: 'bold'
            },
            upperLabel: {
              show: true,
              height: 20,
              color: '#fff',
              fontSize: 10
            }
          }
        ]
      }],
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image' },
          dataView: { title: 'Data View', readOnly: true },
          restore: { title: 'Reset' }
        },
        right: 10,
        top: 10
      }
    };
  };

  const getGradeColor = (grade) => {
    const colorMap = {
      'A': '#10b981',
      'B': '#3699ff',
      'C': '#f6c23e',
      'D': '#f97316',
      'E': '#e74c3c',
      'F': '#6b7280'
    };
    return colorMap[grade] || '#6b7280';
  };

  const getClassColor = (classId) => {
    const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316'];
    return colors[parseInt(classId || 0) % colors.length];
  };

  const getGradePercentage = (gradeName, value, data) => {
    const grade = gradeName.replace('Grade ', '');
    const total = data.reduce((sum, classData) => 
      sum + Object.values(classData.gradeDistribution || {}).reduce((subSum, count) => subSum + count, 0), 0
    );
    return total > 0 ? (value / total * 100).toFixed(1) : 0;
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="grade-treemap-chart"
    />
  );
};

export default { PerformanceMatrixChart, GradeTreemapChart };
