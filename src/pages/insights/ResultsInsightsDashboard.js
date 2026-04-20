import React, { Component } from 'react';
import Data from '../../utils/data';
import ComparisonDataService from '../../services/ComparisonDataService';
import ComparisonMetricsEngine from '../../services/ComparisonMetricsEngine';

// Import enhanced components
import { EnhancedStatCard, AdvancedStatCard } from '../../components/charts/EnhancedStatCard';

// Import results charts
import { PerformanceMatrixChart, GradeTreemapChart } from '../../components/charts/results/PerformanceMatrixChart';

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
      subjectRadar: true
    },
    
    // Dashboard layout
    layoutMode: 'grid', // 'grid', 'list', 'compact'
    showComparison: false,
    showSparklines: true
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
    this.unsubClasses = Data.classes.subscribe(({ classes }) => {
      this.updateData({ classes });
    });

    this.unsubAssessments = Data.assessments?.subscribe(({ assessments }) => {
      this.updateData({ assessments });
    });

    this.unsubSubjects = Data.subjects?.subscribe(({ subjects }) => {
      this.updateData({ subjects });
    });

    this.unsubStudents = Data.students?.subscribe(({ students }) => {
      this.updateData({ students });
    });

    this.unsubTerms = Data.terms?.subscribe(({ terms }) => {
      this.updateData({ terms });
    });

    this.unsubAssessmentTypes = Data.assessmentTypes?.subscribe(({ assessmentTypes }) => {
      this.updateData({ assessmentTypes });
    });

    this.unsubAssessmentRubrics = Data.assessmentRubrics?.subscribe(({ assessmentRubrics }) => {
      this.updateData({ assessmentRubrics });
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
    
    if (!assessments.length || !classes.length) {
      this.setState({ loading: false });
      return;
    }

    this.setState({ loading: true });

    try {
      // Process results data
      const processedData = this.processResultsData(assessments, subjects, classes, students, terms, assessmentTypes, assessmentRubrics);
      
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
    return processedData.map(classData => ({
      className: classData.className,
      classId: classData.classId,
      subjectPerformance: classData.subjectPerformance,
      gradeDistribution: classData.gradeDistribution,
      averageScore: this.calculateClassAverage(classData),
      studentCount: classData.students.length,
      assessmentCount: classData.assessments.length,
      performanceTrend: this.calculatePerformanceTrend(classData)
    }));
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
          <EnhancedStatCard
            title="Average Score"
            value={`${metricsData.averageScore.toFixed(1)}%`}
            subtext={`Across ${metricsData.classCount} classes`}
            icon="flaticon2-percentage"
            color="#3699ff"
            trend={metricsData.averageScore > 70 ? 5 : -2}
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Excellence Rate"
            value={`${metricsData.excellenceRate.toFixed(1)}%`}
            subtext="A & B grades combined"
            icon="flaticon2-star"
            color="#10b981"
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Total Assessments"
            value={metricsData.totalAssessments}
            subtext={`${metricsData.totalStudents} students`}
            icon="flaticon2-checkmark"
            color="#f6c23e"
          />
        </div>
        <div className="col-md-3">
          <EnhancedStatCard
            title="Completion Rate"
            value={`${metricsData.completionRate.toFixed(1)}%`}
            subtext="Assessment coverage"
            icon="flaticon2-finished"
            color="#e74c3c"
          />
        </div>
      </div>
    );
  };

  renderMainCharts = () => {
    const { comparisonData, activeCharts, loading } = this.state;

    return (
      <div className="row">
        {activeCharts.performanceMatrix && (
          <div className="col-lg-8">
            <PerformanceMatrixChart 
              data={comparisonData} 
              loading={loading}
              showValues={true}
            />
          </div>
        )}
        
        {activeCharts.gradeTreemap && (
          <div className="col-lg-4">
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

        {this.renderControls()}

        {this.renderKPIs()}

        {this.renderMainCharts()}

        {this.renderGradeDistribution()}

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
