import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Badge, Alert, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  DollarOutlined, 
  UserOutlined, 
  BookOutlined, 
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined,
  BellOutlined 
} from '@ant-design/icons';
import Data from '../../utils/data';

const RealTimeAnalytics = () => {
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 0,
    liveTransactions: 0,
    systemPerformance: { cpu: 0, memory: 0, responseTime: 0 },
    alerts: [],
    engagementMetrics: {
      lessonActivity: 0,
      assessmentSubmissions: 0,
      communicationEvents: 0
    },
    financialActivity: {
      paymentTransactions: 0,
      collectionUpdates: 0,
      revenueAccumulation: 0
    }
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  useEffect(() => {
    // Initialize WebSocket connection for real-time data
    initializeWebSocket();
    
    // Set up periodic performance monitoring
    const performanceInterval = setInterval(() => {
      updateSystemPerformance();
    }, 5000); // Every 5 seconds

    // Set up alert monitoring
    const alertInterval = setInterval(() => {
      checkForAlerts();
    }, 10000); // Every 10 seconds

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(performanceInterval);
      clearInterval(alertInterval);
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      // WebSocket URL would come from environment variables
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/realtime';
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Real-time WebSocket connected');
        setConnectionStatus('connected');
        
        // Request initial data
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          channels: ['financial', 'academic', 'engagement', 'system']
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealTimeData(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Real-time WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          initializeWebSocket();
        }, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const handleRealTimeData = (data) => {
    switch (data.channel) {
      case 'financial':
        handleFinancialUpdate(data.payload);
        break;
      case 'academic':
        handleAcademicUpdate(data.payload);
        break;
      case 'engagement':
        handleEngagementUpdate(data.payload);
        break;
      case 'system':
        handleSystemUpdate(data.payload);
        break;
      default:
        console.log('Unknown channel:', data.channel);
    }
  };

  const handleFinancialUpdate = (payload) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      financialActivity: {
        paymentTransactions: prev.financialActivity.paymentTransactions + (payload.newPayments || 0),
        collectionUpdates: prev.financialActivity.collectionUpdates + (payload.collectionUpdates || 0),
        revenueAccumulation: prev.financialActivity.revenueAccumulation + (payload.newRevenue || 0)
      }
    }));

    // Add alert for significant financial activity
    if (payload.newRevenue && payload.newRevenue > 10000) {
      addAlert({
        type: 'success',
        title: 'Large Payment Received',
        message: `Payment of KES ${payload.newRevenue.toLocaleString()} received`,
        timestamp: new Date()
      });
    }
  };

  const handleAcademicUpdate = (payload) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      engagementMetrics: {
        ...prev.engagementMetrics,
        assessmentSubmissions: prev.engagementMetrics.assessmentSubmissions + (payload.newAssessments || 0)
      }
    }));

    // Add alert for assessment activity
    if (payload.newAssessments && payload.newAssessments > 5) {
      addAlert({
        type: 'info',
        title: 'High Assessment Activity',
        message: `${payload.newAssessments} new assessments submitted`,
        timestamp: new Date()
      });
    }
  };

  const handleEngagementUpdate = (payload) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      engagementMetrics: {
        ...prev.engagementMetrics,
        lessonActivity: prev.engagementMetrics.lessonActivity + (payload.lessonStarts || 0),
        communicationEvents: prev.engagementMetrics.communicationEvents + (payload.communications || 0)
      }
    }));

    // Add alert for low engagement
    if (payload.activeUsers && payload.activeUsers < 10) {
      addAlert({
        type: 'warning',
        title: 'Low User Activity',
        message: 'User engagement below optimal levels',
        timestamp: new Date()
      });
    }
  };

  const handleSystemUpdate = (payload) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      systemPerformance: {
        cpu: payload.cpu || prev.systemPerformance.cpu,
        memory: payload.memory || prev.systemPerformance.memory,
        responseTime: payload.responseTime || prev.systemPerformance.responseTime
      },
      activeUsers: payload.activeUsers || prev.activeUsers
    }));

    // Add alert for performance issues
    if (payload.responseTime && payload.responseTime > 2000) {
      addAlert({
        type: 'error',
        title: 'Performance Degradation',
        message: `Response time: ${payload.responseTime}ms`,
        timestamp: new Date()
      });
    }
  };

  const updateSystemPerformance = () => {
    // Simulate system performance metrics
    const cpuUsage = 30 + Math.random() * 40; // 30-70%
    const memoryUsage = 40 + Math.random() * 30; // 40-70%
    const responseTime = 100 + Math.random() * 500; // 100-600ms

    setRealTimeMetrics(prev => ({
      ...prev,
      systemPerformance: {
        cpu: cpuUsage,
        memory: memoryUsage,
        responseTime
      }
    }));
  };

  const checkForAlerts = () => {
    // Check for various alert conditions
    const { systemPerformance, financialActivity, engagementMetrics } = realTimeMetrics;

    // Performance alerts
    if (systemPerformance.cpu > 80) {
      addAlert({
        type: 'warning',
        title: 'High CPU Usage',
        message: `CPU usage at ${systemPerformance.cpu.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    if (systemPerformance.memory > 85) {
      addAlert({
        type: 'warning',
        title: 'High Memory Usage',
        message: `Memory usage at ${systemPerformance.memory.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Financial alerts
    if (financialActivity.paymentTransactions > 100) {
      addAlert({
        type: 'info',
        title: 'High Transaction Volume',
        message: `${financialActivity.paymentTransactions} transactions in last hour`,
        timestamp: new Date()
      });
    }

    // Engagement alerts
    if (engagementMetrics.lessonActivity < 5) {
      addAlert({
        type: 'warning',
        title: 'Low Lesson Activity',
        message: 'Only 5 lessons started in last hour',
        timestamp: new Date()
      });
    }
  };

  const addAlert = (alert) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts].slice(0, 10) // Keep only last 10 alerts
    }));
  };

  const dismissAlert = (alertIndex) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, index) => index !== alertIndex)
    }));
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return '#f5222d';
      case 'warning': return '#faad14';
      case 'success': return '#52c41a';
      case 'info': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const getPerformanceColor = (value, type) => {
    const thresholds = {
      cpu: { good: 50, warning: 70 },
      memory: { good: 60, warning: 80 },
      responseTime: { good: 500, warning: 1500 }
    };

    const threshold = thresholds[type];
    if (value <= threshold.good) return '#52c41a';
    if (value <= threshold.warning) return '#faad14';
    return '#f5222d';
  };

  if (connectionStatus === 'error') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Alert
          message="Real-time connection failed. Some features may be limited."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Connection Status */}
      <Row style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Badge 
                  status={connectionStatus === 'connected' ? 'success' : 'error'}
                  text={connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                />
                <span style={{ marginLeft: '12px' }}>
                  Real-time analytics {connectionStatus === 'connected' ? 'active' : 'unavailable'}
                </span>
              </div>
            }
            type={connectionStatus === 'connected' ? 'success' : 'warning'}
            showIcon={false}
          />
        </Col>
      </Row>

      {/* Real-time KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={realTimeMetrics.activeUsers}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Live Transactions"
              value={realTimeMetrics.financialActivity.paymentTransactions}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Lesson Activity"
              value={realTimeMetrics.engagementMetrics.lessonActivity}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Assessment Submissions"
              value={realTimeMetrics.engagementMetrics.assessmentSubmissions}
              precision={0}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* System Performance */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="System Performance">
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <ReactECharts
                    option={{
                      series: [{
                        type: 'gauge',
                        startAngle: 180,
                        endAngle: 0,
                        min: 0,
                        max: 100,
                        splitNumber: 12,
                        itemStyle: {
                          color: getPerformanceColor(realTimeMetrics.systemPerformance.cpu, 'cpu'),
                          shadowColor: 'rgba(0,0,0,0.45)',
                          shadowBlur: 10,
                          shadowOffsetX: 2,
                          shadowOffsetY: 2
                        },
                        progress: {
                          show: true,
                          roundCap: true,
                          width: 18
                        },
                        pointer: {
                          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74726,735.566014 2083.81557,732.634326 2083.81557,729.017698 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
                          length: '75%',
                          width: 16,
                          offsetCenter: [0, '5%']
                        },
                        axisLine: {
                          roundCap: true,
                          lineStyle: {
                            width: 18
                          }
                        },
                        axisTick: {
                          splitNumber: 2,
                          lineStyle: {
                            width: 2,
                            color: '#999'
                          }
                        },
                        splitLine: {
                          length: 12,
                          lineStyle: {
                            width: 3,
                            color: '#999'
                          }
                        },
                        axisLabel: {
                          distance: 30,
                          color: '#999',
                          fontSize: 14
                        },
                        title: {
                          show: false
                        },
                        detail: {
                          backgroundColor: '#fff',
                          borderColor: '#999',
                          borderWidth: 2,
                          width: '60%',
                          lineHeight: 40,
                          height: 40,
                          borderRadius: 8,
                          offsetCenter: [0, '35%'],
                          valueAnimation: true,
                          formatter: function (value) {
                            return '{value|' + value.toFixed(0) + '}{unit|%}';
                          },
                          rich: {
                            value: {
                              fontSize: 20,
                              fontWeight: 'bolder',
                              color: '#333'
                            },
                            unit: {
                              fontSize: 12,
                              color: '#999',
                              padding: [0, 0, -20, 10]
                            }
                          }
                        },
                        data: [{
                          value: realTimeMetrics.systemPerformance.cpu
                        }]
                      }]
                    }}
                    style={{ height: '200px' }}
                  />
                  <div style={{ marginTop: '8px' }}>CPU Usage</div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <ReactECharts
                    option={{
                      series: [{
                        type: 'gauge',
                        startAngle: 180,
                        endAngle: 0,
                        min: 0,
                        max: 100,
                        splitNumber: 12,
                        itemStyle: {
                          color: getPerformanceColor(realTimeMetrics.systemPerformance.memory, 'memory'),
                          shadowColor: 'rgba(0,0,0,0.45)',
                          shadowBlur: 10,
                          shadowOffsetX: 2,
                          shadowOffsetY: 2
                        },
                        progress: {
                          show: true,
                          roundCap: true,
                          width: 18
                        },
                        pointer: {
                          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74726,735.566014 2083.81557,732.634326 2083.81557,729.017698 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
                          length: '75%',
                          width: 16,
                          offsetCenter: [0, '5%']
                        },
                        axisLine: {
                          roundCap: true,
                          lineStyle: {
                            width: 18
                          }
                        },
                        axisTick: {
                          splitNumber: 2,
                          lineStyle: {
                            width: 2,
                            color: '#999'
                          }
                        },
                        splitLine: {
                          length: 12,
                          lineStyle: {
                            width: 3,
                            color: '#999'
                          }
                        },
                        axisLabel: {
                          distance: 30,
                          color: '#999',
                          fontSize: 14
                        },
                        title: {
                          show: false
                        },
                        detail: {
                          backgroundColor: '#fff',
                          borderColor: '#999',
                          borderWidth: 2,
                          width: '60%',
                          lineHeight: 40,
                          height: 40,
                          borderRadius: 8,
                          offsetCenter: [0, '35%'],
                          valueAnimation: true,
                          formatter: function (value) {
                            return '{value|' + value.toFixed(0) + '}{unit|%}';
                          },
                          rich: {
                            value: {
                              fontSize: 20,
                              fontWeight: 'bolder',
                              color: '#333'
                            },
                            unit: {
                              fontSize: 12,
                              color: '#999',
                              padding: [0, 0, -20, 10]
                            }
                          }
                        },
                        data: [{
                          value: realTimeMetrics.systemPerformance.memory
                        }]
                      }]
                    }}
                    style={{ height: '200px' }}
                  />
                  <div style={{ marginTop: '8px' }}>Memory Usage</div>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <ReactECharts
                    option={{
                      series: [{
                        type: 'gauge',
                        startAngle: 180,
                        endAngle: 0,
                        min: 0,
                        max: 100,
                        splitNumber: 12,
                        itemStyle: {
                          color: getPerformanceColor(realTimeMetrics.systemPerformance.responseTime, 'responseTime'),
                          shadowColor: 'rgba(0,0,0,0.45)',
                          shadowBlur: 10,
                          shadowOffsetX: 2,
                          shadowOffsetY: 2
                        },
                        progress: {
                          show: true,
                          roundCap: true,
                          width: 18
                        },
                        pointer: {
                          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74726,735.566014 2083.81557,732.634326 2083.81557,729.017698 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
                          length: '75%',
                          width: 16,
                          offsetCenter: [0, '5%']
                        },
                        axisLine: {
                          roundCap: true,
                          lineStyle: {
                            width: 18
                          }
                        },
                        axisTick: {
                          splitNumber: 2,
                          lineStyle: {
                            width: 2,
                            color: '#999'
                          }
                        },
                        splitLine: {
                          length: 12,
                          lineStyle: {
                            width: 3,
                            color: '#999'
                          }
                        },
                        axisLabel: {
                          distance: 30,
                          color: '#999',
                          fontSize: 14
                        },
                        title: {
                          show: false
                        },
                        detail: {
                          backgroundColor: '#fff',
                          borderColor: '#999',
                          borderWidth: 2,
                          width: '60%',
                          lineHeight: 40,
                          height: 40,
                          borderRadius: 8,
                          offsetCenter: [0, '35%'],
                          valueAnimation: true,
                          formatter: function (value) {
                            return '{value|' + value.toFixed(0) + '}{unit|%}';
                          },
                          rich: {
                            value: {
                              fontSize: 20,
                              fontWeight: 'bolder',
                              color: '#333'
                            },
                            unit: {
                              fontSize: 12,
                              color: '#999',
                              padding: [0, 0, -20, 10]
                            }
                          }
                        },
                        data: [{
                          value: Math.min((realTimeMetrics.systemPerformance.responseTime / 3000) * 100, 100)
                        }]
                      }]
                    }}
                    style={{ height: '200px' }}
                  />
                  <div style={{ marginTop: '8px' }}>Response Time</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Real-time Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Financial Activity Stream" style={{ height: '300px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: generateFinancialStreamData().map(item => item.time)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  data: generateFinancialStreamData().map(item => item.value),
                  type: 'line',
                  color: '#52c41a',
                  symbolSize: 6,
                  animation: false
                }]
              }}
              style={{ height: '250px' }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="User Engagement Stream" style={{ height: '300px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: generateEngagementStreamData().map(item => item.time)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  data: generateEngagementStreamData().map(item => item.value),
                  type: 'line',
                  color: '#722ed1',
                  symbolSize: 6,
                  animation: false
                }]
              }}
              style={{ height: '250px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts Panel */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Real-time Alerts</span>
                <Badge count={realTimeMetrics.alerts.length} showZero />
              </div>
            }
            style={{ height: '400px' }}
          >
            <div style={{ height: '320px', overflowY: 'auto' }}>
              {realTimeMetrics.alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <BellOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                  <div>No active alerts</div>
                </div>
              ) : (
                realTimeMetrics.alerts.map((alert, index) => (
                  <Alert
                    key={index}
                    message={
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {alert.message}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    }
                    type={alert.type}
                    showIcon
                    closable
                    onClose={() => dismissAlert(index)}
                    style={{ marginBottom: '8px' }}
                  />
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Helper functions to generate realistic streaming data
  const generateFinancialStreamData = () => {
    const now = new Date();
    return Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now.getTime() - (19 - i) * 60000);
      return {
        time: time.toLocaleTimeString(),
        value: Math.random() * 5000 + 1000
      };
    });
  };

  const generateEngagementStreamData = () => {
    const now = new Date();
    return Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now.getTime() - (19 - i) * 60000);
      return {
        time: time.toLocaleTimeString(),
        value: Math.floor(Math.random() * 50) + 10
      };
    });
  };
};

export default RealTimeAnalytics;
