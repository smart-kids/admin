import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Select, Avatar, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import { UserOutlined, BookOutlined, TrophyOutlined, RiseOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import Data from '../../utils/data';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [metrics, setMetrics] = useState({
    myClasses: [],
    classOverview: {
      totalStudents: 0,
      averagePerformance: 0,
      attendanceRate: 0,
      assignmentCompletion: 0,
      studentEngagement: 0
    },
    streamComparison: [],
    subjectPerformance: {
      primarySubject: '',
      subjectAverage: 0,
      masteryLevel: 'Average',
      improvementTrend: 0
    },
    studentProgress: {
      totalStudents: 0,
      atRiskStudents: 0,
      topPerformers: 0,
      averageImprovement: 0
    }
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = localStorage.getItem('userRole');
    const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher';
    
    if (!isTeacher) {
      setLoading(false);
      return;
    }

    const unsubAssessments = Data.assessments.subscribe(({ assessments }) => {
      if (assessments) {
        calculateTeacherMetrics(assessments);
        setLoading(false);
      }
    });
    
    const unsubStudents = Data.students.subscribe(({ students }) => {
      if (students) {
        calculateTeacherMetrics(null, students);
      }
    });

    const unsubClasses = Data.classes.subscribe(({ classes }) => {
      if (classes) {
        const teacherClasses = classes.filter(cls => {
          const teacherId = cls.teacher?.id || cls.teacher;
          return teacherId === userData?.id;
        });
        
        setMetrics(prev => ({ ...prev, myClasses: teacherClasses }));
        
        // Auto-select first class if none selected
        if (!selectedClass && teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0].id);
        }
      }
    });

    const unsubSubjects = Data.subjects.subscribe(({ subjects }) => {
      if (subjects) {
        const teacherSubjects = subjects.filter(subj => {
          const teacherId = subj.teacher?.id || subj.teacher;
          return teacherId === userData?.id;
        });
        
        // Auto-select first subject if none selected
        if (!selectedSubject && teacherSubjects.length > 0) {
          setSelectedSubject(teacherSubjects[0].id);
        }
      }
    });

    return () => {
      if (unsubAssessments) unsubAssessments.unsubscribe();
      if (unsubStudents) unsubStudents.unsubscribe();
      if (unsubClasses) unsubClasses.unsubscribe();
      if (unsubSubjects) unsubSubjects.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Recalculate metrics when filters change
    const assessments = Data.assessments.list() || [];
    const students = Data.students.list() || [];
    calculateTeacherMetrics(assessments, students);
  }, [selectedClass, selectedSubject]);

  const calculateTeacherMetrics = (assessments, students) => {
    const allAssessments = assessments || Data.assessments.list() || [];
    const allStudents = students || Data.students.list() || [];
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    // Get teacher's classes
    const teacherClasses = Data.classes.list()?.filter(cls => {
      const teacherId = cls.teacher?.id || cls.teacher;
      return teacherId === userData?.id;
    }) || [];

    // Get teacher's subjects
    const teacherSubjects = Data.subjects.list()?.filter(subj => {
      const teacherId = subj.teacher?.id || subj.teacher;
      return teacherId === userData?.id;
    }) || [];

    // Filter assessments for teacher's classes and subjects
    const filteredAssessments = allAssessments.filter(assessment => {
      const student = allStudents.find(s => s.id === assessment.student?.id);
      if (!student) return false;

      // Filter by class
      if (selectedClass && student.class?.id !== selectedClass) return false;
      
      // Filter by subject
      if (selectedSubject && assessment.subject?.id !== selectedSubject) return false;
      
      return true;
    });

    // Filter students for selected class
    const filteredStudents = allStudents.filter(student => {
      if (selectedClass && student.class?.id !== selectedClass) return false;
      return true;
    });

    // Calculate class overview
    const classOverview = calculateClassOverview(filteredStudents, filteredAssessments);

    // Calculate stream comparison
    const streamComparison = calculateStreamComparison(teacherClasses, allAssessments);

    // Calculate subject performance
    const subjectPerformance = calculateSubjectPerformance(filteredAssessments, teacherSubjects);

    // Calculate student progress
    const studentProgress = calculateStudentProgress(filteredStudents, filteredAssessments);

    setMetrics({
      myClasses: teacherClasses,
      classOverview,
      streamComparison,
      subjectPerformance,
      studentProgress
    });
  };

  const calculateClassOverview = (students, assessments) => {
    if (students.length === 0) {
      return {
        totalStudents: 0,
        averagePerformance: 0,
        attendanceRate: 0,
        assignmentCompletion: 0,
        studentEngagement: 0
      };
    }

    const totalScore = assessments.reduce((sum, a) => sum + parseFloat(a.score || 0), 0);
    const totalOutOf = assessments.reduce((sum, a) => sum + parseFloat(a.outOf || 100), 0);
    const averagePerformance = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : 0;

    // Simulate attendance rate (would come from attendance data)
    const attendanceRate = 85 + Math.random() * 10; // Placeholder

    // Simulate assignment completion rate
    const assignmentCompletion = assessments.length > 0 ? 
      (assessments.filter(a => parseFloat(a.score || 0) > 0).length / assessments.length) * 100 : 0;

    // Simulate student engagement
    const studentEngagement = averagePerformance >= 70 ? 75 + Math.random() * 20 : 40 + Math.random() * 30;

    return {
      totalStudents: students.length,
      averagePerformance,
      attendanceRate,
      assignmentCompletion,
      studentEngagement
    };
  };

  const calculateStreamComparison = (classes, assessments) => {
    return classes.map(cls => {
      const classStudents = Data.students.list()?.filter(s => s.class?.id === cls.id) || [];
      const classAssessments = assessments.filter(a => {
        const student = Data.students.list()?.find(s => s.id === a.student?.id);
        return student?.class?.id === cls.id;
      }) || [];

      const totalScore = classAssessments.reduce((sum, a) => sum + parseFloat(a.score || 0), 0);
      const totalOutOf = classAssessments.reduce((sum, a) => sum + parseFloat(a.outOf || 100), 0);
      const averageScore = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : 0;

      return {
        classId: cls.id,
        className: cls.name,
        stream: cls.stream || 'A',
        averageScore,
        studentCount: classStudents.length,
        performance: averageScore >= 80 ? 'Excellent' : 
                   averageScore >= 70 ? 'Good' : 
                   averageScore >= 60 ? 'Average' : 'Needs Improvement'
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  };

  const calculateSubjectPerformance = (assessments, subjects) => {
    if (subjects.length === 0) {
      return {
        primarySubject: '',
        subjectAverage: 0,
        masteryLevel: 'Average',
        improvementTrend: 0
      };
    }

    const subjectScores = {};
    assessments.forEach(assessment => {
      const subjectId = assessment.subject?.id;
      const subjectName = assessment.subject?.name || 'Unknown';
      
      if (!subjectScores[subjectId]) {
        subjectScores[subjectId] = {
          id: subjectId,
          name: subjectName,
          scores: [],
          totalScore: 0,
          count: 0
        };
      }
      
      const percentage = parseFloat(assessment.outOf || 100) > 0 ? 
        (parseFloat(assessment.score || 0) / parseFloat(assessment.outOf || 100)) * 100 : 0;
      
      subjectScores[subjectId].scores.push(percentage);
      subjectScores[subjectId].totalScore += percentage;
      subjectScores[subjectId].count++;
    });

    // Find primary subject (most assessments)
    const primarySubject = Object.values(subjectScores)
      .sort((a, b) => b.count - a.count)[0];

    const subjectAverage = primarySubject ? 
      (primarySubject.totalScore / primarySubject.count) : 0;

    const masteryLevel = subjectAverage >= 80 ? 'Excellent' : 
                      subjectAverage >= 70 ? 'Good' : 
                      subjectAverage >= 60 ? 'Average' : 'Needs Improvement';

    // Calculate improvement trend (compare with previous period)
    const improvementTrend = 5.2; // Placeholder - would calculate from historical data

    return {
      primarySubject: primarySubject?.name || '',
      subjectAverage,
      masteryLevel,
      improvementTrend
    };
  };

  const calculateStudentProgress = (students, assessments) => {
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

    const studentProgress = Object.values(studentMap);
    const totalStudents = studentProgress.length;
    
    // Calculate at-risk students (below 50% average)
    const atRiskStudents = studentProgress.filter(student => {
      const average = student.count > 0 ? student.totalScore / student.count : 0;
      return average < 50;
    }).length;

    // Calculate top performers (above 80% average)
    const topPerformers = studentProgress.filter(student => {
      const average = student.count > 0 ? student.totalScore / student.count : 0;
      return average >= 80;
    }).length;

    // Calculate average improvement
    const averageImprovement = 3.7; // Placeholder - would calculate from trends

    return {
      totalStudents,
      atRiskStudents,
      topPerformers,
      averageImprovement
    };
  };

  
  const streamComparisonColumns = [
    {
      title: 'Class',
      dataIndex: 'className',
      key: 'className',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Stream {record.stream}</div>
        </div>
      ),
      sorter: (a, b) => a.className.localeCompare(b.className),
    },
    {
      title: 'Students',
      dataIndex: 'studentCount',
      key: 'studentCount',
      sorter: (a, b) => a.studentCount - b.studentCount,
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (value) => `${value?.toFixed(1)}%`,
      sorter: (a, b) => a.averageScore - b.averageScore,
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (value) => (
        <Tag color={
          value === 'Excellent' ? 'green' :
          value === 'Good' ? 'blue' :
          value === 'Average' ? 'orange' : 'red'
        }>
          {value}
        </Tag>
      ),
      sorter: (a, b) => a.averageScore - b.averageScore,
    }
  ];

  const studentProgressColumns = [
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
          {text}
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Assessments',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Average Score',
      dataIndex: 'average',
      key: 'average',
      render: (_, record) => {
        const average = record.count > 0 ? record.totalScore / record.count : 0;
        return `${average?.toFixed(1)}%`;
      },
      sorter: (a, b) => (a.totalScore / a.count) - (b.totalScore / b.count),
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div>Loading teacher dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Filters */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <h2>Teacher Dashboard</h2>
        <Row gutter={16}>
          <Col>
            <Select
              placeholder="Select Class"
              style={{ width: 200 }}
              value={selectedClass}
              onChange={setSelectedClass}
            >
              <Select.Option value={null}>All Classes</Select.Option>
              {metrics.myClasses.map(cls => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Select Subject"
              style={{ width: 200 }}
              value={selectedSubject}
              onChange={setSelectedSubject}
            >
              <Select.Option value={null}>All Subjects</Select.Option>
              {Data.subjects.list()?.filter(subj => {
                const teacherId = subj.teacher?.id || subj.teacher;
                return teacherId === JSON.parse(localStorage.getItem('user') || '{}')?.id;
              }).map(subject => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Row>

      {/* Class Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={metrics.classOverview.totalStudents}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Class Average"
              value={metrics.classOverview.averagePerformance}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.classOverview.averagePerformance >= 70 ? '#3f8600' : 
                       metrics.classOverview.averagePerformance >= 60 ? '#faad14' : '#f5222d' 
              }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Attendance Rate"
              value={metrics.classOverview.attendanceRate}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.classOverview.attendanceRate >= 90 ? '#3f8600' : 
                       metrics.classOverview.attendanceRate >= 80 ? '#faad14' : '#f5222d' 
              }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Assignment Completion"
              value={metrics.classOverview.assignmentCompletion}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.classOverview.assignmentCompletion >= 80 ? '#3f8600' : 
                       metrics.classOverview.assignmentCompletion >= 60 ? '#faad14' : '#f5222d' 
              }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Subject Performance */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Subject Performance" style={{ height: '200px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Primary Subject"
                  value={metrics.subjectPerformance.primarySubject}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Subject Average"
                  value={metrics.subjectPerformance.subjectAverage}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: metrics.subjectPerformance.subjectAverage >= 70 ? '#3f8600' : '#f5222d' 
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Mastery Level"
                  value={metrics.subjectPerformance.masteryLevel}
                  valueStyle={{ 
                    color: metrics.subjectPerformance.masteryLevel === 'Excellent' ? '#3f8600' : 
                           metrics.subjectPerformance.masteryLevel === 'Good' ? '#faad14' : '#f5222d' 
                  }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={metrics.subjectPerformance.improvementTrend}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={() => `Improvement: +${metrics.subjectPerformance.improvementTrend.toFixed(1)}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Student Progress Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Students"
              value={metrics.studentProgress.totalStudents}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card>
            <Statistic
              title="At Risk Students"
              value={metrics.studentProgress.atRiskStudents}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card>
            <Statistic
              title="Top Performers"
              value={metrics.studentProgress.topPerformers}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Stream Comparison" style={{ height: '400px' }}>
            <Table
              columns={streamComparisonColumns}
              dataSource={metrics.streamComparison}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Student Progress" style={{ height: '400px' }}>
            <Table
              columns={studentProgressColumns}
              dataSource={metrics.studentProgress.studentProgress || []}
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

export default TeacherDashboard;
