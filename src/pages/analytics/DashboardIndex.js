import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Badge } from 'antd';
import { 
  DashboardOutlined, 
  DollarOutlined, 
  BookOutlined, 
  UserOutlined, 
  BarChartOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';
import FinancialMetrics from '../../components/analytics/FinancialMetrics';
import AcademicMetrics from '../../components/analytics/AcademicMetrics';
import RealTimeAnalytics from '../../components/analytics/RealTimeAnalytics';
import PredictiveInsights from '../../components/analytics/PredictiveInsights';
import TeacherDashboard from '../../components/analytics/TeacherDashboard';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('admin');

  React.useEffect(() => {
    // Determine user role from localStorage - check both userRole and userType
    const role = localStorage.getItem('userRole') || 'admin';
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = userData.userType || userData.role || role;
    setUserRole(userType);
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard userRole={userRole} />;
      case 'financial':
        return <FinancialMetrics />;
      case 'academic':
        return <AcademicMetrics />;
      case 'realtime':
        return <RealTimeAnalytics />;
      case 'predictive':
        return <PredictiveInsights />;
      case 'teacher':
        return userRole === 'teacher' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'sAdmin' ? <TeacherDashboard /> : <AccessDenied />;
      default:
        return <div>Tab not found</div>;
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined />
          Overview
        </span>
      ),
    },
    {
      key: 'financial',
      label: (
        <span>
          <DollarOutlined />
          Financial Metrics
        </span>
      ),
    },
    {
      key: 'academic',
      label: (
        <span>
          <BookOutlined />
          Academic Performance
        </span>
      ),
    },
        {
      key: 'realtime',
      label: (
        <span>
          <ThunderboltOutlined />
          Real-time Analytics
        </span>
      ),
    },
    {
      key: 'predictive',
      label: (
        <span>
          <RadarChartOutlined />
          Predictive Insights
        </span>
      ),
    },
    ...(userRole === 'teacher' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'sAdmin' ? [{
      key: 'teacher',
      label: (
        <span>
          <UserOutlined />
          Teacher Dashboard
        </span>
      ),
    }] : [])
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  Comprehensive Analytics Dashboard
                </h1>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  Real-time insights and predictive analytics for school management
                </div>
              </Col>
              <Col>
                <Badge count={5} style={{ backgroundColor: '#52c41a' }}>
                  <div style={{ padding: '8px 16px', background: '#f0f5ff', borderRadius: '20px' }}>
                    <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '12px' }}>
                      NEW FEATURES
                    </div>
                  </div>
                </Badge>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        tabBarStyle={{
          marginBottom: '24px',
          borderBottom: '2px solid #f0f0f0',
        }}
      />

      <div style={{ marginTop: '24px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

// Overview Dashboard Component
const OverviewDashboard = ({ userRole }) => {
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalStudents: 1247,
    totalRevenue: 2450000,
    collectionRate: 87,
    averagePerformance: 74.2,
    activeUsers: 156,
    systemHealth: 'good',
    recentAlerts: 3
  });

  const getMetricColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return '#52c41a';
    if (value >= thresholds.good) return '#1890ff';
    if (value >= thresholds.average) return '#faad14';
    return '#f5222d';
  };

  const adminMetrics = [
    {
      title: 'Total Students',
      value: overviewMetrics.totalStudents,
      icon: <UserOutlined />,
      color: '#1890ff',
      trend: '+5.2%',
    },
    {
      title: 'Monthly Revenue',
      value: overviewMetrics.totalRevenue,
      icon: <DollarOutlined />,
      color: '#52c41a',
      prefix: 'KES ',
      trend: '+12%',
    },
    {
      title: 'Collection Rate',
      value: overviewMetrics.collectionRate,
      icon: <BarChartOutlined />,
      color: getMetricColor(overviewMetrics.collectionRate, { excellent: 90, good: 80, average: 70 }),
      suffix: '%',
      trend: '+3%',
    },
    {
      title: 'Average Performance',
      value: overviewMetrics.averagePerformance,
      icon: <BookOutlined />,
      color: getMetricColor(overviewMetrics.averagePerformance, { excellent: 80, good: 70, average: 60 }),
      suffix: '%',
      trend: '+2.1%',
    },
  ];

  const teacherMetrics = [
    {
      title: 'My Classes',
      value: 4,
      icon: <UserOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Class Average',
      value: 76.8,
      icon: <BookOutlined />,
      color: '#52c41a',
      suffix: '%',
      trend: '+5.2%',
    },
    {
      title: 'Active Students',
      value: 38,
      icon: <UserOutlined />,
      color: '#faad14',
    },
    {
      title: 'Completion Rate',
      value: 84,
      icon: <LineChartOutlined />,
      color: getMetricColor(84, { excellent: 90, good: 80, average: 70 }),
      suffix: '%',
      trend: '+8%',
    },
  ];

  const metrics = userRole === 'admin' ? adminMetrics : teacherMetrics;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {metrics.map((metric, index) => (
          <Col span={6} key={index}>
            <Card>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', color: metric.color, marginBottom: '8px' }}>
                  {metric.icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  {metric.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: metric.color, marginTop: '8px' }}>
                  {metric.prefix || ''}{metric.value.toLocaleString()}{metric.suffix || ''}
                </div>
                {metric.trend && (
                  <div style={{ fontSize: '12px', color: metric.trend.startsWith('+') ? '#52c41a' : '#f5222d', marginTop: '4px' }}>
                    {metric.trend}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="System Health" extra={<Badge status={overviewMetrics.systemHealth === 'good' ? 'success' : 'warning'} text={overviewMetrics.systemHealth.toUpperCase()} />}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: overviewMetrics.systemHealth === 'good' ? '#52c41a' : '#faad14' }}>
                {overviewMetrics.systemHealth === 'good' ? '✓' : '!'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {overviewMetrics.systemHealth === 'good' ? 'All Systems Operational' : 'Some Issues Detected'}
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Recent Alerts" extra={<Badge count={overviewMetrics.recentAlerts} />}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f5222d', marginRight: '8px' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>High CPU Usage</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>2 minutes ago</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#faad14', marginRight: '8px' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Low Collection Rate</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>15 minutes ago</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1890ff', marginRight: '8px' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>New Student Registration</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>1 hour ago</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Access Denied Component
const AccessDenied = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh',
      flexDirection: 'column'
    }}>
      <div style={{ fontSize: '48px', color: '#f5222d', marginBottom: '16px' }}>
        <UserOutlined />
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Access Denied
      </div>
      <div style={{ fontSize: '16px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
        You don't have permission to access the Teacher Dashboard.
      </div>
      <div style={{ fontSize: '14px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
        Please contact your administrator if you believe this is an error.
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
