import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';

/**
 * Class Comparison Sunburst Chart
 * Hierarchical visualization of class performance by subjects and grade levels
 */
export const ClassComparisonSunburstChart = ({ 
  data = [], 
  height = 400, 
  loading = false,
  hierarchy = 'class-subject', // 'class-subject' or 'subject-class'
  metric = 'average' // 'average', 'excellence', 'improvement'
}) => {
  const getChartOption = () => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No Comparison Data Available',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      };
    }

    const sunburstData = processSunburstData(data, hierarchy, metric);
    
    return {
      title: {
        text: 'Performance Comparison Sunburst',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function(params) {
          const node = params.data;
          if (node.children) {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${node.name}</div>
              <div>Type: ${node.level === 0 ? 'Root' : node.level === 1 ? 'Category' : 'Detail'}</div>
              <div>Total Students: ${node.totalStudents || 0}</div>
              <div>Sub-categories: ${node.children?.length || 0}</div>
              ${node.average ? `<div>Average: ${node.average.toFixed(1)}%</div>` : ''}
            `;
          } else {
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${node.name}</div>
              <div>Students: ${node.studentCount || 0}</div>
              <div>Average: ${node.average?.toFixed(1) || 0}%</div>
              <div>Excellence Rate: ${node.excellenceRate?.toFixed(1) || 0}%</div>
              <div>Grade Distribution: ${Object.entries(node.gradeDistribution || {}).map(([grade, count]) => `${grade}: ${count}`).join(', ')}</div>
            `;
          }
        }
      },
      series: [
        {
          type: 'sunburst',
          data: [sunburstData],
          radius: [0, '90%'],
          label: {
            rotate: 'radial',
            fontSize: 11,
            color: '#fff',
            fontWeight: 'bold'
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff'
          },
          levels: [
            {}, // Level 0 - Root
            {
              itemStyle: {
                color: function(params) {
                  return getLevelColor(params.data.name, 1);
                }
              },
              label: {
                fontSize: 14
              }
            }, // Level 1 - Categories
            {
              itemStyle: {
                color: function(params) {
                  return getLevelColor(params.data.name, 2);
                }
              },
              label: {
                fontSize: 12
              }
            }, // Level 2 - Details
            {
              itemStyle: {
                color: function(params) {
                  return getPerformanceColor(params.data.average || 0);
                }
              },
              label: {
                fontSize: 10
              }
            } // Level 3 - Performance details
          ],
          emphasis: {
            focus: 'ancestor',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ],
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

  const processSunburstData = (data, hierarchy, metric) => {
    const root = {
      name: 'All Classes',
      value: 0,
      children: [],
      totalStudents: 0,
      average: 0
    };

    if (hierarchy === 'class-subject') {
      // Class -> Subject -> Grade Level
      const classGroups = {};
      
      data.forEach(item => {
        const className = item.className || `Class ${item.classId}`;
        if (!classGroups[className]) {
          classGroups[className] = {
            name: className,
            value: 0,
            children: [],
            totalStudents: 0,
            average: 0
          };
        }
        
        const classGroup = classGroups[className];
        classGroup.totalStudents += item.studentCount || 0;
        
        // Group by subjects within each class
        Object.entries(item.subjectPerformance || {}).forEach(([subject, performance]) => {
          const subjectKey = `${className}-${subject}`;
          if (!classGroup.children.find(child => child.name === subject)) {
            classGroup.children.push({
              name: subject,
              value: 0,
              children: [],
              studentCount: performance.studentCount || 0,
              average: performance.average || 0,
              excellenceRate: calculateExcellenceRate(performance.average || 0)
            });
          }
          
          const subjectChild = classGroup.children.find(child => child.name === subject);
          subjectChild.value += performance.average || 0;
          
          // Add grade levels as children
          const gradeLevels = ['A', 'B', 'C', 'D', 'E', 'F'];
          gradeLevels.forEach(grade => {
            const count = estimateGradeCount(performance.average || 0, grade, performance.studentCount || 0);
            if (count > 0) {
              subjectChild.children.push({
                name: `Grade ${grade}`,
                value: count,
                studentCount: count,
                average: getGradeAverage(grade),
                gradeDistribution: { [grade]: count }
              });
            }
          });
        });
        
        classGroup.value += classGroup.totalStudents;
        classGroup.average = calculateClassAverage(item.subjectPerformance || {});
      });
      
      root.children = Object.values(classGroups);
    } else {
      // Subject -> Class -> Grade Level
      const subjectGroups = {};
      
      data.forEach(item => {
        Object.entries(item.subjectPerformance || {}).forEach(([subject, performance]) => {
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = {
              name: subject,
              value: 0,
              children: [],
              totalStudents: 0,
              average: 0
            };
          }
          
          const subjectGroup = subjectGroups[subject];
          const className = item.className || `Class ${item.classId}`;
          
          if (!subjectGroup.children.find(child => child.name === className)) {
            subjectGroup.children.push({
              name: className,
              value: 0,
              children: [],
              studentCount: performance.studentCount || 0,
              average: performance.average || 0,
              excellenceRate: calculateExcellenceRate(performance.average || 0)
            });
          }
          
          const classChild = subjectGroup.children.find(child => child.name === className);
          classChild.value += performance.studentCount || 0;
          subjectGroup.totalStudents += performance.studentCount || 0;
          
          // Add grade levels
          const gradeLevels = ['A', 'B', 'C', 'D', 'E', 'F'];
          gradeLevels.forEach(grade => {
            const count = estimateGradeCount(performance.average || 0, grade, performance.studentCount || 0);
            if (count > 0) {
              classChild.children.push({
                name: `Grade ${grade}`,
                value: count,
                studentCount: count,
                average: getGradeAverage(grade),
                gradeDistribution: { [grade]: count }
              });
            }
          });
        });
      });
      
      root.children = Object.values(subjectGroups);
    }

    // Calculate root totals
    root.totalStudents = root.children.reduce((sum, child) => sum + (child.totalStudents || 0), 0);
    root.value = root.totalStudents;
    root.average = root.children.length > 0 ? 
      root.children.reduce((sum, child) => sum + (child.average || 0), 0) / root.children.length : 0;

    return root;
  };

  const calculateClassAverage = (subjectPerformance) => {
    const subjects = Object.values(subjectPerformance);
    return subjects.length > 0 ? 
      subjects.reduce((sum, perf) => sum + (perf.average || 0), 0) / subjects.length : 0;
  };

  const calculateExcellenceRate = (average) => {
    return average >= 80 ? 85 : average >= 70 ? 60 : average >= 60 ? 35 : 15;
  };

  const estimateGradeCount = (average, grade, totalStudents) => {
    const gradeRanges = {
      'A': { min: 80, max: 100 },
      'B': { min: 70, max: 79 },
      'C': { min: 60, max: 69 },
      'D': { min: 50, max: 59 },
      'E': { min: 40, max: 49 },
      'F': { min: 0, max: 39 }
    };
    
    const range = gradeRanges[grade];
    if (!range) return 0;
    
    // Simple distribution based on average
    if (average >= range.min && average <= range.max) {
      return Math.floor(totalStudents * 0.3); // 30% in the matching grade
    } else if (average > range.max) {
      return Math.floor(totalStudents * 0.1); // 10% in lower grades if average is high
    } else {
      return Math.floor(totalStudents * 0.05); // 5% in higher grades if average is low
    }
  };

  const getGradeAverage = (grade) => {
    const gradeAverages = {
      'A': 90,
      'B': 75,
      'C': 65,
      'D': 55,
      'E': 45,
      'F': 20
    };
    return gradeAverages[grade] || 50;
  };

  const getLevelColor = (name, level) => {
    if (level === 1) {
      // Categories (Classes or Subjects)
      const colors = ['#3699ff', '#10b981', '#f6c23e', '#e74c3c', '#8b5cf6', '#f97316'];
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    } else if (level === 2) {
      // Details (Subjects or Classes)
      const colors = ['#3699ff80', '#10b98180', '#f6c23e80', '#e74c3c80', '#8b5cf680', '#f9731680'];
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
    return '#6b7280';
  };

  const getPerformanceColor = (average) => {
    if (average >= 80) return '#10b981';
    if (average >= 70) return '#3699ff';
    if (average >= 60) return '#f6c23e';
    if (average >= 50) return '#f97316';
    if (average >= 40) return '#e74c3c';
    return '#6b7280';
  };

  return (
    <EChartsWrapper 
      option={getChartOption()} 
      height={height}
      loading={loading}
      className="class-comparison-sunburst-chart"
    />
  );
};

export default ClassComparisonSunburstChart;
