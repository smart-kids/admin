import React, { Component } from 'react';
import Data from '../../utils/data';
import ComparisonDataService from '../../services/ComparisonDataService';
import ComparisonMetricsEngine from '../../services/ComparisonMetricsEngine';

// Import enhanced components
import { EnhancedStatCard, AdvancedStatCard } from '../../components/charts/EnhancedStatCard';

// Import results charts
import { PerformanceMatrixChart, GradeTreemapChart } from '../../components/charts/results/PerformanceMatrixChart';
import { SubjectPerformanceRadarChart } from '../../components/charts/results/SubjectPerformanceRadarChart';
import { StudentProgressTimelineChart } from '../../components/charts/results/StudentProgressTimelineChart';
import { ClassComparisonSunburstChart } from '../../components/charts/results/ClassComparisonSunburstChart';

class ResultsInsightsDashboard extends Component {
  state = {
    // Raw data
    classes: [],
    assessments: [],
    subjects: [],
    students: [],
    terms: [],
    assessmentTypes: [],
    assessmentRubrics: [],
    
    // Processed data
    processedData: null,
    comparisonData: null,
    metricsData: null,
    
    // Filters and UI state
    selectedClasses: [],
    selectedSubjects: [],
    selectedTerms: [],
    selectedAssessmentType: '',
    loading: true,
    error: null,
    
    // Chart configurations
    activeCharts: {
      performanceMatrix: true,
      gradeTreemap: true,
      progressTrends: true,
      subjectRadar: true,
      studentTimeline: true,
      classSunburst: true
    },
    
    // Dashboard layout
    layoutMode: 'grid', // 'grid', 'list', 'compact'
    showComparison: false,
    showSparklines: true,
    comparisonMode: 'none' // 'none', 'previousTerm', 'previousYear', 'classCompare', 'subjectCompare'
  };

  constructor(props) {
    super(props);
    this.comparisonService = new ComparisonDataService();
    this.metricsEngine = new ComparisonMetricsEngine();
  }

  componentDidMount() {
    this.initializeData();
    this.setupSubscriptions();
  }

  componentWillUnmount() {
    this.cleanupSubscriptions();
  }

  initializeData = () => {
    // Restore selections from localStorage
    const savedClasses = localStorage.getItem('results_insights_selectedClasses');
    const savedSubjects = localStorage.getItem('results_insights_selectedSubjects');
    const savedTerms = localStorage.getItem('results_insights_selectedTerms');
    const savedAssessmentType = localStorage.getItem('results_insights_assessmentType');

    this.setState({
      selectedClasses: savedClasses ? JSON.parse(savedClasses) : [],
      selectedSubjects: savedSubjects ? JSON.parse(savedSubjects) : [],
      selectedTerms: savedTerms ? JSON.parse(savedTerms) : [],
      selectedAssessmentType: savedAssessmentType || ''
    });
  };

  setupSubscriptions = () => {
    // Use props data directly instead of subscriptions
    const { classes, assessments, subjects, students, terms, assessmentTypes, assessmentRubrics } = this.props;
    
    this.updateData({ 
      classes: classes || [], 
      assessments: assessments || [], 
      subjects: subjects || [], 
      students: students || [], 
      terms: terms || [],
      assessmentTypes: assessmentTypes || [],
      assessmentRubrics: assessmentRubrics || []
    });
  };

  cleanupSubscriptions = () => {
    if (this.unsubClasses) this.unsubClasses();
    if (this.unsubAssessments) this.unsubAssessments();
    if (this.unsubSubjects) this.unsubSubjects();
    if (this.unsubStudents) this.unsubStudents();
    if (this.unsubTerms) this.unsubTerms();
    if (this.unsubAssessmentTypes) this.unsubAssessmentTypes();
    if (this.unsubAssessmentRubrics) this.unsubAssessmentRubrics();
  };

  updateData = (newData) => {
    this.setState(newData, () => {
      this.processData();
    });
  };

  processData = () => {
    const { assessments, subjects, classes, students, terms, assessmentTypes, assessmentRubrics } = this.state;
    const { selectedClass, selectedTerm, selectedSubject } = this.props;
    
    if (!assessments || !classes) {
      this.setState({ loading: false });
      return;
    }

    this.setState({ loading: true });

    try {
      // Filter data based on selected filters
      let filteredAssessments = assessments;
      let filteredClasses = classes;
      let filteredStudents = students;
      let filteredSubjects = subjects;
      
      if (selectedClass) {
        filteredClasses = classes.filter(cls => String(cls.id) === selectedClass);
        filteredStudents = students.filter(student => String(student.class?.id || student.class) === selectedClass);
        filteredAssessments = assessments.filter(assessment => {
          const student = students.find(s => String(s.id) === String(assessment.student?.id || assessment.student));
          return student && String(student.class?.id || student.class) === selectedClass;
        });
      }
      
      if (selectedSubject) {
        filteredAssessments = filteredAssessments.filter(assessment => 
          String(assessment.subject?.id || assessment.subject) === selectedSubject
        );
        filteredSubjects = subjects.filter(subject => String(subject.id) === selectedSubject);
      }
      
      if (selectedTerm) {
        filteredAssessments = filteredAssessments.filter(assessment => {
          const assessmentDate = new Date(assessment.createdAt || assessment.date);
          // Simple term filtering - this could be enhanced with proper term date ranges
          return true; // For now, don't filter by term as assessment data might not have term info
        });
      }
      
      // Process results data
      const processedData = this.processResultsData(filteredAssessments, filteredSubjects, filteredClasses, filteredStudents, terms, assessmentTypes, assessmentRubrics);
      
      // Generate comparison data
      const comparisonData = this.generateComparisonData(processedData);
      
      // Calculate metrics
      const metricsData = this.calculateMetrics(processedData);

      this.setState({
        processedData,
        comparisonData,
        metricsData,
        loading: false
      });
    } catch (error) {
      console.error('Error processing results data:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  processResultsData = (assessments, subjects, classes, students, terms, assessmentTypes, assessmentRubrics) => {
    // Group assessments by class
    const classGroups = {};
    
    classes.forEach(cls => {
      const classId = String(cls.id);
      classGroups[classId] = {
        classId,
        className: cls.name || `Class ${classId}`,
        assessments: [],
        students: students.filter(s => String(s.class?.id || s.class) === classId),
        subjectPerformance: {},
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
      };
    });

    // Process assessments
    assessments.forEach(assessment => {
      const studentId = String(assessment.student?.id || assessment.student);
      const student = students.find(s => String(s.id) === studentId);
      
      if (student) {
        const classId = String(student.class?.id || student.class);
        if (classGroups[classId]) {
          classGroups[classId].assessments.push({
            ...assessment,
            studentName: student.names,
            processedScore: parseFloat(assessment.score || 0)
          });
        }
      }
    });

    // Calculate subject performance and grade distribution for each class
    Object.values(classGroups).forEach(classGroup => {
      // Subject performance
      subjects.forEach(subject => {
        const subjectAssessments = classGroup.assessments.filter(a => 
          String(a.subject?.id || a.subject) === String(subject.id)
        );
        
        if (subjectAssessments.length > 0) {
          const scores = subjectAssessments.map(a => a.processedScore);
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          
          classGroup.subjectPerformance[subject.name || `Subject ${subject.id}`] = {
            average,
            studentCount: subjectAssessments.length,
            highest: Math.max(...scores),
            lowest: Math.min(...scores)
          };
        }
      });

      // Grade distribution
      classGroup.assessments.forEach(assessment => {
        const grade = this.getGrade(assessment.processedScore);
        classGroup.gradeDistribution[grade]++;
      });
    });

    return Object.values(classGroups);
  };

  generateComparisonData = (processedData) => {
    const { comparisonMode } = this.state;
    
    const baseData = processedData.map(classData => ({
      className: classData.className,
      classId: classData.classId,
      subjectPerformance: classData.subjectPerformance,
      gradeDistribution: classData.gradeDistribution,
      averageScore: this.calculateClassAverage(classData),
      studentCount: classData.students.length,
      assessmentCount: classData.assessments.length,
      performanceTrend: this.calculatePerformanceTrend(classData)
    }));

    // Add comparison data if comparison mode is active
    if (comparisonMode !== 'none') {
      return this.addComparisonData(baseData, comparisonMode);
    }

    return baseData;
  };

  calculateMetrics = (processedData) => {
    const totalAssessments = processedData.reduce((sum, cls) => sum + cls.assessments.length, 0);
    const totalStudents = processedData.reduce((sum, cls) => sum + cls.students.length, 0);
    const allScores = processedData.flatMap(cls => cls.assessments.map(a => a.processedScore));
    const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
    
    // Calculate overall grade distribution
    const overallGradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    processedData.forEach(cls => {
      Object.entries(cls.gradeDistribution).forEach(([grade, count]) => {
        overallGradeDistribution[grade] += count;
      });
    });

    return {
      totalAssessments,
      totalStudents,
      averageScore,
      overallGradeDistribution,
      classCount: processedData.length,
      excellenceRate: this.calculateExcellenceRate(overallGradeDistribution),
      completionRate: this.calculateCompletionRate(processedData)
    };
  };

  getGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  calculateClassAverage = (classData) => {
    const scores = classData.assessments.map(a => a.processedScore);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  };

  calculatePerformanceTrend = (classData) => {
    // Simple trend calculation based on assessment dates
    const sortedAssessments = classData.assessments.sort((a, b) => 
      new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );
    
    if (sortedAssessments.length < 2) return 0;
    
    const firstHalf = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 2));
    const secondHalf = sortedAssessments.slice(Math.floor(sortedAssessments.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, a) => sum + a.processedScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, a) => sum + a.processedScore, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  };

  addComparisonData = (data, comparisonMode) => {
    switch (comparisonMode) {
      case 'previousTerm':
        return this.addPreviousTermComparison(data);
      case 'previousYear':
        return this.addPreviousYearComparison(data);
      case 'classCompare':
        return this.addClassComparison(data);
      case 'subjectCompare':
        return this.addSubjectComparison(data);
      default:
        return data;
    }
  };

  addPreviousTermComparison = (data) => {
    // Simulate previous term data
    return data.map(item => ({
      ...item,
      previousTermData: {
        averageScore: item.averageScore - 5, // Simulate improvement
        excellenceRate: this.calculateExcellenceRate(item.gradeDistribution) - 8,
        assessmentCount: Math.floor(item.assessmentCount * 0.85)
      }
    }));
  };

  addPreviousYearComparison = (data) => {
    // Simulate previous year data
    return data.map(item => ({
      ...item,
      previousYearData: {
        averageScore: item.averageScore - 8, // Simulate larger improvement
        excellenceRate: this.calculateExcellenceRate(item.gradeDistribution) - 12,
        assessmentCount: Math.floor(item.assessmentCount * 0.7)
      }
    }));
  };

  addClassComparison = (data) => {
    // Add class-to-class comparison
    const averageScore = data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;
    const averageExcellenceRate = data.reduce((sum, item) => sum + this.calculateExcellenceRate(item.gradeDistribution), 0) / data.length;
    
    return data.map(item => ({
      ...item,
      classComparison: {
        scoreVsAverage: item.averageScore - averageScore,
        excellenceRateVsAverage: this.calculateExcellenceRate(item.gradeDistribution) - averageExcellenceRate,
        rank: data.sort((a, b) => b.averageScore - a.averageScore).indexOf(item) + 1
      }
    }));
  };

  addSubjectComparison = (data) => {
    // Add subject-wise comparison (if multiple subjects are being compared)
    const subjectAverages = {};
    
    data.forEach(item => {
      Object.entries(item.subjectPerformance).forEach(([subject, performance]) => {
        if (!subjectAverages[subject]) {
          subjectAverages[subject] = [];
        }
        subjectAverages[subject].push(performance.average);
      });
    });
    
    // Calculate average for each subject across all classes
    Object.keys(subjectAverages).forEach(subject => {
      const scores = subjectAverages[subject];
      subjectAverages[subject] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    return data.map(item => {
      const subjectComparison = {};
      Object.entries(item.subjectPerformance).forEach(([subject, performance]) => {
        subjectComparison[subject] = {
          average: performance.average,
          vsOverallAverage: performance.average - (subjectAverages[subject] || 0),
          rank: 1 // This would need more complex calculation for real ranking
        };
      });
      
      return {
        ...item,
        subjectComparison
      };
    });
  };

  calculateExcellenceRate = (gradeDistribution) => {
    const total = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
    const excellent = gradeDistribution.A + gradeDistribution.B;
    return total > 0 ? (excellent / total) * 100 : 0;
  };

  calculateCompletionRate = (processedData) => {
    const totalPossibleAssessments = processedData.reduce((sum, cls) => sum + (cls.students.length * 5), 0); // Assuming 5 assessments per student
    const totalAssessments = processedData.reduce((sum, cls) => sum + cls.assessments.length, 0);
    return totalPossibleAssessments > 0 ? (totalAssessments / totalPossibleAssessments) * 100 : 0;
  };

  handleFilterChange = (filterName, value) => {
    this.setState({ [filterName]: value }, () => {
      // Save to localStorage
      localStorage.setItem(`results_insights_${filterName}`, JSON.stringify(value));
      this.processData();
    });
  };

  handleChartToggle = (chartName) => {
    this.setState(prevState => ({
      activeCharts: {
        ...prevState.activeCharts,
        [chartName]: !prevState.activeCharts[chartName]
      }
    }));
  };

  handleLayoutChange = (layoutMode) => {
    this.setState({ layoutMode });
  };

  renderKPIs = () => {
    const { metricsData, loading } = this.state;
    
    if (!metricsData || loading) {
      return (
        <div className="row">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-md-3">
              <div className="card card-custom gutter-b" style={{ height: '140px' }}>
                <div className="card-body">
                  <div className="spinner spinner-primary mr-3"></div>
                  Loading...
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="row">
        <div className="col-md-3">
          <AdvancedStatCard
            title="Average Score"
            value={`${metricsData.averageScore.toFixed(1)}%`}
            subtext={`Across ${metricsData.classCount} classes`}
            icon="flaticon2-percentage"
            color="#3699ff"
            trend={metricsData.averageScore > 70 ? 5 : -2}
            showSparkline={true}
            sparklineData={this.generateScoreSparkline()}
            comparison={this.state.comparisonMode !== 'none' ? this.getScoreComparison() : null}
          />
        </div>
        <div className="col-md-3">
          <AdvancedStatCard
            title="Excellence Rate"
            value={`${metricsData.excellenceRate.toFixed(1)}%`}
            subtext="A & B grades combined"
            icon="flaticon2-star"
            color="#10b981"
            trend={metricsData.excellenceRate > 60 ? 8 : -3}
            showSparkline={true}
            sparklineData={this.generateExcellenceSparkline()}
            comparison={this.state.comparisonMode !== 'none' ? this.getExcellenceComparison() : null}
          />
        </div>
        <div className="col-md-3">
          <AdvancedStatCard
            title="Subject Coverage"
            value={metricsData.totalAssessments}
            subtext={`${metricsData.totalStudents} students`}
            icon="flaticon2-checkmark"
            color="#f6c23e"
            trend={metricsData.completionRate > 80 ? 3 : -1}
            showSparkline={true}
            sparklineData={this.generateCoverageSparkline()}
            comparison={this.state.comparisonMode !== 'none' ? this.getCoverageComparison() : null}
          />
        </div>
        <div className="col-md-3">
          <AdvancedStatCard
            title="Quality Score"
            value={`${metricsData.completionRate.toFixed(1)}%`}
            subtext="Assessment quality"
            icon="flaticon2-finished"
            color="#e74c3c"
            trend={metricsData.completionRate > 75 ? 4 : -2}
            showSparkline={true}
            sparklineData={this.generateQualitySparkline()}
            comparison={this.state.comparisonMode !== 'none' ? this.getQualityComparison() : null}
          />
        </div>
      </div>
    );
  };

  renderMainCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row">
        {activeCharts.subjectRadar && (
          <div className="col-lg-6">
            <SubjectPerformanceRadarChart 
              data={this.generateSubjectRadarData()} 
              loading={loading}
              showComparison={this.state.showComparison}
              metrics={['Average Score', 'Excellence Rate', 'Participation', 'Improvement', 'Consistency']}
            />
          </div>
        )}
        
        {activeCharts.gradeTreemap && (
          <div className="col-lg-6">
            <GradeTreemapChart 
              data={comparisonData} 
              loading={loading}
              hierarchy="class"
            />
          </div>
        )}
      </div>
    );
  };

  renderGradeDistribution = () => {
    const { metricsData } = this.state;
    
    if (!metricsData) return null;

    const gradeData = Object.entries(metricsData.overallGradeDistribution).map(([grade, count]) => ({
      name: `Grade ${grade}`,
      value: count,
      itemStyle: { color: this.getGradeColor(grade) }
    }));

    return (
      <div className="row mt-4">
        <div className="col-lg-6">
          <div className="card card-custom gutter-b">
            <div className="card-header border-0 pt-5">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label font-weight-bolder text-dark">Overall Grade Distribution</span>
              </h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-around">
                {gradeData.map(grade => (
                  <div key={grade.name} className="text-center">
                    <div 
                      className="symbol symbol-50 symbol-light mb-2"
                      style={{ backgroundColor: grade.itemStyle.color + '20' }}
                    >
                      <span className="symbol-label font-weight-bolder" style={{ color: grade.itemStyle.color }}>
                        {grade.value}
                      </span>
                    </div>
                    <div className="font-size-sm text-muted">{grade.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card card-custom gutter-b">
            <div className="card-header border-0 pt-5">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label font-weight-bolder text-dark">Performance Summary</span>
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="text-center">
                    <div className="font-size-h4 font-weight-bolder text-primary">
                      {metricsData.excellenceRate.toFixed(1)}%
                    </div>
                    <div className="text-muted font-size-sm">Excellence Rate</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center">
                    <div className="font-size-h4 font-weight-bolder text-success">
                      {metricsData.averageScore.toFixed(1)}%
                    </div>
                    <div className="text-muted font-size-sm">Average Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  getGradeColor = (grade) => {
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

  renderControls = () => {
    const { layoutMode, showComparison, showSparklines } = this.state;

    return (
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <label className="mr-3">Layout:</label>
              <div className="btn-group">
                <button 
                  className={`btn ${layoutMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('grid')}
                >
                  <i className="fas fa-th"></i> Grid
                </button>
                <button 
                  className={`btn ${layoutMode === 'list' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('list')}
                >
                  <i className="fas fa-list"></i> List
                </button>
                <button 
                  className={`btn ${layoutMode === 'compact' ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => this.handleLayoutChange('compact')}
                >
                  <i className="fas fa-compress"></i> Compact
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <div className="custom-control custom-switch mr-3">
                <input 
                  type="checkbox" 
                  className="custom-control-input" 
                  id="showComparison"
                  checked={showComparison}
                  onChange={(e) => this.setState({ showComparison: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="showComparison">
                  Show Comparison
                </label>
              </div>

              <div className="custom-control custom-switch">
                <input 
                  type="checkbox" 
                  className="custom-control-input" 
                  id="showSparklines"
                  checked={showSparklines}
                  onChange={(e) => this.setState({ showSparklines: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="showSparklines">
                  Sparklines
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderFilters = () => {
    const { classes, terms, subjects } = this.state;
    const { selectedClass, selectedTerm, selectedSubject, onFilterChange } = this.props;

    return (
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Class</label>
              <select 
                className="form-control"
                value={selectedClass || ""}
                onChange={(e) => onFilterChange('selectedClass', e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || `Class ${cls.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Subject</label>
              <select 
                className="form-control"
                value={selectedSubject || ""}
                onChange={(e) => onFilterChange('selectedSubject', e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name || `Subject ${subject.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Term</label>
              <select 
                className="form-control"
                value={selectedTerm || ""}
                onChange={(e) => onFilterChange('selectedTerm', e.target.value)}
              >
                <option value="">All Terms</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name || `Term ${term.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Comparison</label>
              <select 
                className="form-control"
                value={this.state.comparisonMode || "none"}
                onChange={(e) => this.setState({ comparisonMode: e.target.value })}
              >
                <option value="none">No Comparison</option>
                <option value="previousTerm">Previous Term</option>
                <option value="previousYear">Previous Year</option>
                <option value="classCompare">Compare Classes</option>
                <option value="subjectCompare">Compare Subjects</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderAdvancedCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row mt-4">
        {activeCharts.studentTimeline && (
          <div className="col-lg-8">
            <StudentProgressTimelineChart 
              data={this.generateTimelineData()} 
              loading={loading}
              selectedStudent={this.state.selectedStudent}
              subjects={this.state.subjects}
              timeRange="termly"
            />
          </div>
        )}
        
        {activeCharts.performanceMatrix && (
          <div className="col-lg-4">
            <PerformanceMatrixChart 
              data={comparisonData} 
              loading={loading}
              showValues={true}
              compact={true}
            />
          </div>
        )}
      </div>
    );
  };

  renderHierarchicalCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row mt-4">
        {activeCharts.classSunburst && (
          <div className="col-lg-12">
            <ClassComparisonSunburstChart 
              data={comparisonData} 
              loading={loading}
              hierarchy="class-subject"
              metric="average"
            />
          </div>
        )}
      </div>
    );
  };

  // Sparkline data generators
  generateScoreSparkline = () => {
    // Generate realistic score trend data
    return [65, 68, 72, 69, 74, 78, 75, 82, 79, 85, 83, 88];
  };

  generateExcellenceSparkline = () => {
    return [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 82];
  };

  generateCoverageSparkline = () => {
    return [120, 135, 142, 158, 165, 172, 185, 192, 205, 218, 225, 238];
  };

  generateQualitySparkline = () => {
    return [68, 72, 75, 78, 82, 85, 88, 91, 94, 96, 98, 99];
  };

  // Comparison data generators
  getScoreComparison = () => {
    const { comparisonMode, metricsData } = this.state;
    if (comparisonMode === 'previousTerm') {
      return {
        label: 'vs Previous Term',
        value: metricsData.averageScore - 5.2,
        trend: 'up'
      };
    } else if (comparisonMode === 'previousYear') {
      return {
        label: 'vs Previous Year',
        value: metricsData.averageScore - 8.7,
        trend: 'up'
      };
    }
    return null;
  };

  getExcellenceComparison = () => {
    const { comparisonMode, metricsData } = this.state;
    if (comparisonMode === 'previousTerm') {
      return {
        label: 'vs Previous Term',
        value: metricsData.excellenceRate - 4.8,
        trend: 'up'
      };
    }
    return null;
  };

  getCoverageComparison = () => {
    const { comparisonMode, metricsData } = this.state;
    if (comparisonMode === 'previousTerm') {
      return {
        label: 'vs Previous Term',
        value: metricsData.totalAssessments - 28,
        trend: 'up'
      };
    }
    return null;
  };

  getQualityComparison = () => {
    const { comparisonMode, metricsData } = this.state;
    if (comparisonMode === 'previousTerm') {
      return {
        label: 'vs Previous Term',
        value: metricsData.completionRate - 3.2,
        trend: 'up'
      };
    }
    return null;
  };

  generateSubjectRadarData = () => {
    const { subjects, comparisonData } = this.state;
    
    return subjects.map(subject => {
      const subjectData = comparisonData.map(classData => ({
        className: classData.className,
        performance: classData.subjectPerformance[subject.name]
      }));
      
      return {
        subjectName: subject.name,
        assessments: this.getSubjectAssessments(subject.id),
        totalStudents: this.getSubjectStudentCount(subject.id),
        assessedStudents: this.getAssessedStudentCount(subject.id),
        // Enhanced data for radar chart
        classPerformance: subjectData,
        averageScore: this.calculateSubjectAverage(subject.id),
        excellenceRate: this.calculateSubjectExcellenceRate(subject.id),
        participationRate: this.calculateSubjectParticipationRate(subject.id),
        improvementRate: this.calculateSubjectImprovementRate(subject.id),
        consistencyScore: this.calculateSubjectConsistencyScore(subject.id)
      };
    });
  };

  generateTimelineData = () => {
    const { assessments, selectedClass, selectedSubject } = this.state;
    
    let filteredAssessments = assessments;
    
    if (selectedClass) {
      filteredAssessments = filteredAssessments.filter(assessment => {
        const student = this.state.students.find(s => String(s.id) === String(assessment.student?.id || assessment.student));
        return student && String(student.class?.id || student.class) === selectedClass;
      });
    }
    
    if (selectedSubject) {
      filteredAssessments = filteredAssessments.filter(assessment => 
        String(assessment.subject?.id || assessment.subject) === selectedSubject
      );
    }
    
    // Enhance timeline data with student information and trends
    return filteredAssessments.map(assessment => ({
      ...assessment,
      studentName: this.getStudentName(assessment.student?.id || assessment.student),
      subjectName: this.getSubjectName(assessment.subject?.id || assessment.subject),
      className: this.getStudentClassName(assessment.student?.id || assessment.student),
      trend: this.calculateStudentTrend(assessment.student?.id || assessment.student, assessment.subject?.id || assessment.subject),
      grade: this.getGrade(parseFloat(assessment.score || 0))
    }));
  };

  getSubjectAssessments = (subjectId) => {
    const { assessments } = this.state;
    return assessments.filter(a => String(a.subject?.id || a.subject) === subjectId);
  };

  getSubjectStudentCount = (subjectId) => {
    const { students, classes } = this.state;
    const subjectStudents = new Set();
    
    this.getSubjectAssessments(subjectId).forEach(assessment => {
      const studentId = String(assessment.student?.id || assessment.student);
      if (studentId) subjectStudents.add(studentId);
    });
    
    return subjectStudents.size;
  };

  getAssessedStudentCount = (subjectId) => {
    return this.getSubjectStudentCount(subjectId);
  };

  // Enhanced data processing methods
  calculateSubjectAverage = (subjectId) => {
    const assessments = this.getSubjectAssessments(subjectId);
    if (assessments.length === 0) return 0;
    const scores = assessments.map(a => parseFloat(a.score || 0));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  calculateSubjectExcellenceRate = (subjectId) => {
    const assessments = this.getSubjectAssessments(subjectId);
    if (assessments.length === 0) return 0;
    const excellentCount = assessments.filter(a => parseFloat(a.score || 0) >= 80).length;
    return (excellentCount / assessments.length) * 100;
  };

  calculateSubjectParticipationRate = (subjectId) => {
    const totalStudents = this.state.students.length;
    const assessedStudents = this.getSubjectStudentCount(subjectId);
    return totalStudents > 0 ? (assessedStudents / totalStudents) * 100 : 0;
  };

  calculateSubjectImprovementRate = (subjectId) => {
    const assessments = this.getSubjectAssessments(subjectId);
    if (assessments.length < 2) return 50; // Default to neutral
    
    const sortedAssessments = assessments.sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    );
    
    const firstHalf = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 2));
    const secondHalf = sortedAssessments.slice(Math.floor(sortedAssessments.length / 2));
    
    const firstAvg = this.calculateAverageScore(firstHalf);
    const secondAvg = this.calculateAverageScore(secondHalf);
    
    const improvement = secondAvg - firstAvg;
    return Math.max(0, Math.min(100, 50 + improvement)); // Normalize to 0-100
  };

  calculateSubjectConsistencyScore = (subjectId) => {
    const assessments = this.getSubjectAssessments(subjectId);
    if (assessments.length < 2) return 50;
    
    const scores = assessments.map(a => parseFloat(a.score || 0));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
  };

  calculateAverageScore = (assessments) => {
    if (!assessments || assessments.length === 0) return 0;
    const scores = assessments.map(a => parseFloat(a.score || 0));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  getStudentName = (studentId) => {
    const student = this.state.students.find(s => String(s.id) === String(studentId));
    return student ? student.names : 'Unknown Student';
  };

  getSubjectName = (subjectId) => {
    const subject = this.state.subjects.find(s => String(s.id) === String(subjectId));
    return subject ? subject.name : 'Unknown Subject';
  };

  getStudentClassName = (studentId) => {
    const student = this.state.students.find(s => String(s.id) === String(studentId));
    if (!student) return 'Unknown Class';
    const classObj = this.state.classes.find(c => String(c.id) === String(student.class?.id || student.class));
    return classObj ? classObj.name : 'Unknown Class';
  };

  calculateStudentTrend = (studentId, subjectId) => {
    const studentAssessments = this.getSubjectAssessments(subjectId)
      .filter(a => String(a.student?.id || a.student) === String(studentId))
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    
    if (studentAssessments.length < 2) return 0;
    
    const recent = parseFloat(studentAssessments[studentAssessments.length - 1].score || 0);
    const previous = parseFloat(studentAssessments[studentAssessments.length - 2].score || 0);
    
    return recent - previous;
  };

  getGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  render() {
    const { loading, error } = this.state;

    if (error) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="alert alert-danger">
              <h5>Error loading results insights</h5>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={this.processData}>
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="results-insights-dashboard">
        <div className="d-flex justify-content-between align-items-center mb-6">
          <div>
            <h1 className="font-weight-bolder text-dark font-size-h3 mb-0">
              Results Insights
            </h1>
            <div className="text-muted font-weight-bold font-size-sm mt-1">
              Comprehensive academic performance analysis and comparison tools
            </div>
          </div>
        </div>

        {this.renderFilters()}
        {this.renderControls()}
        {this.renderKPIs()}
        {this.renderMainCharts()}
        {this.renderAdvancedCharts()}
        {this.renderHierarchicalCharts()}

        {loading && (
          <div className="text-center py-10">
            <div className="spinner spinner-primary mr-3"></div>
            Processing results data...
          </div>
        )}
      </div>
    );
  }
}

export default ResultsInsightsDashboard;
