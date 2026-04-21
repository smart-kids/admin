import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Select, Tag, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import { TrophyOutlined, BookOutlined, UserOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import Data from '../../utils/data';

const AcademicMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [metrics, setMetrics] = useState({
    overallAverage: 0,
    gradeDistribution: {},
    subjectPerformance: [],
    studentRankings: [],
    classAverages: [],
    completionRates: {},
    improvementTrends: [],
    excellenceRate: 0,
    totalStudents: 0,
    totalAssessments: 0
  });

  useEffect(() => {
    const unsubAssessments = Data.assessments.subscribe(({ assessments }) => {
      if (assessments) {
        calculateAcademicMetrics(assessments);
        setLoading(false);
      }
    });
    
    const unsubStudents = Data.students.subscribe(({ students }) => {
      if (students) {
        calculateAcademicMetrics(null, students);
      }
    });

    const unsubGrades = Data.grades.subscribe(({ grades }) => {
      if (grades) {
        // Auto-select first grade if none selected
        if (!selectedGrade && grades.length > 0) {
          setSelectedGrade(grades[0].id);
        }
      }
    });

    const unsubSubjects = Data.subjects.subscribe(({ subjects }) => {
      if (subjects) {
        // Auto-select first subject if none selected
        if (!selectedSubject && subjects.length > 0) {
          setSelectedSubject(subjects[0].id);
        }
      }
    });

    const unsubTerms = Data.terms.subscribe(({ terms }) => {
      if (terms) {
        // Auto-select current term if none selected
        if (!selectedTerm && terms.length > 0) {
          const currentTerm = terms.find(t => {
            const now = new Date();
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            return now >= start && now <= end;
          }) || terms[0];
          setSelectedTerm(currentTerm.id);
        }
      }
    });

    return () => {
      if (unsubAssessments) {
        unsubAssessments.unsubscribe();
      }
      if (unsubStudents) {
        unsubStudents.unsubscribe();
      }
      if (unsubGrades) {
        unsubGrades.unsubscribe();
      }
      if (unsubSubjects) {
        unsubSubjects.unsubscribe();
      }
      if (unsubTerms) {
        unsubTerms.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Recalculate metrics when filters change
    const assessments = Data.assessments.list() || [];
    const students = Data.students.list() || [];
    calculateAcademicMetrics(assessments, students);
  }, [selectedGrade, selectedSubject, selectedTerm]);

  const calculateAcademicMetrics = (assessments, students) => {
    const allAssessments = assessments || Data.assessments.list() || [];
    const allStudents = students || Data.students.list() || [];

    // Filter assessments based on selected criteria
    const filteredAssessments = allAssessments.filter(assessment => {
      const student = allStudents.find(s => s.id === assessment.student?.id);
      if (!student) return false;

      // Filter by grade
      if (selectedGrade && student.class?.grade?.id !== selectedGrade) return false;
      
      // Filter by subject
      if (selectedSubject && assessment.subject?.id !== selectedSubject) return false;
      
      // Filter by term
      if (selectedTerm && assessment.term?.id !== selectedTerm) return false;
      
      return true;
    });

    // Filter students based on selected criteria
    const filteredStudents = allStudents.filter(student => {
      // Filter by grade
      if (selectedGrade && student.class?.grade?.id !== selectedGrade) return false;
      return true;
    });

    // Calculate overall average
    const totalScore = filteredAssessments.reduce((sum, a) => sum + parseFloat(a.score || 0), 0);
    const totalOutOf = filteredAssessments.reduce((sum, a) => sum + parseFloat(a.outOf || 100), 0);
    const overallAverage = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : 0;

    // Calculate grade distribution
    const gradeDistribution = calculateGradeDistribution(filteredAssessments);

    // Calculate subject performance
    const subjectPerformance = calculateSubjectPerformance(filteredAssessments);

    // Calculate student rankings
    const studentRankings = calculateStudentRankings(filteredAssessments, filteredStudents);

    // Calculate class averages
    const classAverages = calculateClassAverages(filteredAssessments, filteredStudents);

    // Calculate completion rates
    const completionRates = calculateCompletionRates(filteredAssessments, filteredStudents);

    // Calculate improvement trends
    const improvementTrends = calculateImprovementTrends(filteredAssessments);

    // Calculate excellence rate (80%+)
    const excellenceCount = filteredAssessments.filter(a => {
      const percentage = parseFloat(a.outOf || 100) > 0 ? (parseFloat(a.score || 0) / parseFloat(a.outOf || 100)) * 100 : 0;
      return percentage >= 80;
    }).length;
    const excellenceRate = filteredAssessments.length > 0 ? (excellenceCount / filteredAssessments.length) * 100 : 0;

    setMetrics({
      overallAverage,
      gradeDistribution,
      subjectPerformance,
      studentRankings,
      classAverages,
      completionRates,
      improvementTrends,
      excellenceRate,
      totalStudents: filteredStudents.length,
      totalAssessments: filteredAssessments.length
    });
  };

  const calculateGradeDistribution = (assessments) => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    assessments.forEach(assessment => {
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      let grade = 'F';
      if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else if (percentage >= 40) grade = 'E';
      
      distribution[grade]++;
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: assessments.length > 0 ? (count / assessments.length) * 100 : 0
    }));
  };

  const calculateSubjectPerformance = (assessments) => {
    const subjectMap = {};
    
    assessments.forEach(assessment => {
      const subjectId = assessment.subject?.id;
      const subjectName = assessment.subject?.name || 'Unknown';
      
      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          id: subjectId,
          name: subjectName,
          scores: [],
          totalScore: 0,
          count: 0
        };
      }
      
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      subjectMap[subjectId].scores.push(percentage);
      subjectMap[subjectId].totalScore += percentage;
      subjectMap[subjectId].count++;
    });

    return Object.values(subjectMap).map(subject => ({
      ...subject,
      average: subject.count > 0 ? subject.totalScore / subject.count : 0,
      mastery: subject.average >= 80 ? 'Excellent' : 
               subject.average >= 70 ? 'Good' : 
               subject.average >= 60 ? 'Average' : 'Needs Improvement'
    }));
  };

  const calculateStudentRankings = (assessments, students) => {
    const studentMap = {};
    
    assessments.forEach(assessment => {
      const studentId = assessment.student?.id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: students.find(s => s.id === studentId)?.names || 'Unknown',
          scores: [],
          totalScore: 0,
          count: 0
        };
      }
      
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      studentMap[studentId].scores.push(percentage);
      studentMap[studentId].totalScore += percentage;
      studentMap[studentId].count++;
    });

    return Object.values(studentMap)
      .map(student => ({
        ...student,
        average: student.count > 0 ? student.totalScore / student.count : 0
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 20);
  };

  const calculateClassAverages = (assessments, students) => {
    const classMap = {};
    
    assessments.forEach(assessment => {
      const student = students.find(s => s.id === assessment.student?.id);
      const classId = student?.class?.id;
      const className = student?.class?.name || 'Unknown';
      
      if (!classMap[classId]) {
        classMap[classId] = {
          id: classId,
          name: className,
          scores: [],
          totalScore: 0,
          count: 0
        };
      }
      
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      classMap[classId].scores.push(percentage);
      classMap[classId].totalScore += percentage;
      classMap[classId].count++;
    });

    return Object.values(classMap).map(cls => ({
      ...cls,
      average: cls.count > 0 ? cls.totalScore / cls.count : 0,
      studentCount: students.filter(s => s.class?.id === cls.id).length
    }));
  };

  const calculateCompletionRates = (assessments, students) => {
    const completionMap = {};
    
    students.forEach(student => {
      const classId = student.class?.id;
      const className = student.class?.name || 'Unknown';
      
      if (!completionMap[classId]) {
        completionMap[classId] = {
          id: classId,
          name: className,
          totalStudents: 0,
          assessedStudents: new Set()
        };
      }
      
      completionMap[classId].totalStudents++;
    });

    assessments.forEach(assessment => {
      const classId = students.find(s => s.id === assessment.student?.id)?.class?.id;
      if (classId && completionMap[classId]) {
        completionMap[classId].assessedStudents.add(assessment.student?.id);
      }
    });

    return Object.values(completionMap).map(cls => ({
      ...cls,
      completionRate: cls.totalStudents > 0 ? 
        (cls.assessedStudents.size / cls.totalStudents) * 100 : 0
    }));
  };

  const calculateImprovementTrends = (assessments) => {
    const monthlyData = {};
    
    assessments.forEach(assessment => {
      const date = new Date(assessment.createdAt || assessment.time);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, scores: [], count: 0 };
      }
      
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      monthlyData[monthKey].scores.push(percentage);
      monthlyData[monthKey].count++;
    });

    return Object.values(monthlyData)
      .map(month => ({
        ...month,
        average: month.count > 0 ? month.scores.reduce((sum, score) => sum + score, 0) / month.count : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const gradeDistributionData = useMemo(() => 
    metrics.gradeDistribution.map(item => ({
      grade: item.grade,
      count: item.count,
      percentage: item.percentage.toFixed(1)
    })), [metrics.gradeDistribution]);

  const studentRankingColumns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Average Score',
      dataIndex: 'average',
      key: 'average',
      render: (value) => `${value?.toFixed(1) || '0.0'}%`,
      sorter: (a, b) => a.average - b.average,
    },
    {
      title: 'Assessments',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    }
  ];

  const classPerformanceColumns = [
    {
      title: 'Class Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Average Score',
      dataIndex: 'average',
      key: 'average',
      render: (value) => `${value?.toFixed(1) || '0.0'}%`,
      sorter: (a, b) => a.average - b.average,
    },
    {
      title: 'Students',
      dataIndex: 'studentCount',
      key: 'studentCount',
      sorter: (a, b) => a.studentCount - b.studentCount,
    },
    {
      title: 'Completion Rate',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (value) => `${value?.toFixed(1) || '0.0'}%`,
      sorter: (a, b) => a.completionRate - b.completionRate,
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div>Loading academic metrics...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Filters */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <h2>Academic Performance Metrics</h2>
        <Row gutter={16}>
          <Col>
            <Select
              placeholder="Select Grade"
              style={{ width: 150 }}
              value={selectedGrade}
              onChange={setSelectedGrade}
            >
              <Select.Option value={null}>All Grades</Select.Option>
              {Data.grades.list()?.map(grade => (
                <Select.Option key={grade.id} value={grade.id}>
                  {grade.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Select Subject"
              style={{ width: 150 }}
              value={selectedSubject}
              onChange={setSelectedSubject}
            >
              <Select.Option value={null}>All Subjects</Select.Option>
              {Data.subjects.list()?.map(subject => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Select Term"
              style={{ width: 150 }}
              value={selectedTerm}
              onChange={setSelectedTerm}
            >
              <Select.Option value={null}>All Terms</Select.Option>
              {Data.terms.list()?.map(term => (
                <Select.Option key={term.id} value={term.id}>
                  {term.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Overall Average"
              value={metrics.overallAverage}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.overallAverage >= 70 ? '#3f8600' : 
                       metrics.overallAverage >= 60 ? '#faad14' : '#f5222d' 
              }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Excellence Rate"
              value={metrics.excellenceRate}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.excellenceRate >= 30 ? '#3f8600' : 
                       metrics.excellenceRate >= 20 ? '#faad14' : '#f5222d' 
              }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={metrics.totalStudents}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Assessments"
              value={metrics.totalAssessments}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Grade Distribution" style={{ height: '400px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: gradeDistributionData.map(item => item.grade)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  type: 'bar',
                  data: gradeDistributionData.map(item => item.count),
                  label: {
                    show: true,
                    position: 'inside',
                    color: '#fff'
                  }
                }]
              }}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Subject Performance" style={{ height: '400px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: metrics.subjectPerformance.map(item => item.name)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  type: 'bar',
                  data: metrics.subjectPerformance.map(item => item.average),
                  color: '#1890ff',
                  label: {
                    show: true,
                    position: 'inside',
                    color: '#fff'
                  }
                }]
              }}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Improvement Trends */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Performance Trends" style={{ height: '300px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: metrics.improvementTrends.map(item => item.month)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  data: metrics.improvementTrends.map(item => item.average),
                  type: 'line',
                  smooth: true,
                  color: '#52c41a',
                  symbolSize: 8,
                  symbol: 'diamond'
                }]
              }}
              style={{ height: '200px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Top Student Performers" style={{ height: '400px' }}>
            <Table
              columns={studentRankingColumns}
              dataSource={metrics.studentRankings}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Class Performance" style={{ height: '400px' }}>
            <Table
              columns={classPerformanceColumns}
              dataSource={metrics.classAverages}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AcademicMetrics;
