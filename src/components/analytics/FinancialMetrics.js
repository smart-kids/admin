import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Select, DatePicker, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, CreditCardOutlined, WarningOutlined } from '@ant-design/icons';
import Data from '../../utils/data';

const { RangePicker } = DatePicker;

const FinancialMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    collectionRate: 0,
    outstandingBalance: 0,
    revenueGrowth: 0,
    paymentMethods: {},
    agingAnalysis: { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 },
    monthlyTrends: [],
    topPayers: [],
    delinquentAccounts: []
  });

  useEffect(() => {
    const unsubPayments = Data.payments.subscribe(({ payments }) => {
      if (payments) {
        calculateFinancialMetrics(payments);
        setLoading(false);
      }
    });
    
    const unsubCharges = Data.charges.subscribe(({ charges }) => {
      if (charges) {
        calculateFinancialMetrics(null, charges);
      }
    });

    return () => {
      if (unsubPayments) {
        unsubPayments.unsubscribe();
      }
      if (unsubCharges) {
        unsubCharges.unsubscribe();
      }
    };
  }, [dateRange]);

  const calculateFinancialMetrics = (payments, charges) => {
    const allPayments = payments || Data.payments.list() || [];
    const allCharges = charges || Data.charges.list() || [];

    // Filter by date range if selected
    const filteredPayments = dateRange ? 
      allPayments.filter(p => {
        const paymentDate = new Date(p.time || p.createdAt);
        return paymentDate >= dateRange[0] && paymentDate <= dateRange[1];
      }) : allPayments;

    const filteredCharges = dateRange ?
      allCharges.filter(c => {
        const chargeDate = new Date(c.time || c.createdAt);
        return chargeDate >= dateRange[0] && chargeDate <= dateRange[1];
      }) : allCharges;

    // Calculate basic metrics
    const totalRevenue = filteredPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const totalCharges = filteredCharges
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    const outstandingBalance = totalCharges - totalRevenue;
    const collectionRate = totalCharges > 0 ? (totalRevenue / totalCharges) * 100 : 0;

    // Payment method distribution
    const paymentMethods = filteredPayments.reduce((acc, p) => {
      const method = p.paymentType || 'Unknown';
      acc[method] = (acc[method] || 0) + parseFloat(p.amount || 0);
      return acc;
    }, {});

    // Aging analysis
    const agingAnalysis = calculateAging(filteredPayments, filteredCharges);

    // Monthly trends
    const monthlyTrends = calculateMonthlyTrends(filteredPayments);

    // Top payers and delinquent accounts
    const topPayers = calculateTopPayers(filteredPayments);
    const delinquentAccounts = calculateDelinquentAccounts(filteredCharges, filteredPayments);

    setMetrics({
      totalRevenue,
      collectionRate,
      outstandingBalance,
      revenueGrowth: calculateRevenueGrowth(filteredPayments),
      paymentMethods,
      agingAnalysis,
      monthlyTrends,
      topPayers,
      delinquentAccounts
    });
  };

  const calculateAging = (payments, charges) => {
    const now = new Date();
    const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
    
    charges.forEach(charge => {
      const chargeDate = new Date(charge.time || charge.createdAt);
      const daysDiff = Math.floor((now - chargeDate) / (1000 * 60 * 60 * 24));
      
      const amount = parseFloat(charge.amount || 0);
      if (daysDiff <= 30) aging.current += amount;
      else if (daysDiff <= 60) aging.overdue30 += amount;
      else if (daysDiff <= 90) aging.overdue60 += amount;
      else aging.overdue90 += amount;
    });

    return aging;
  };

  const calculateMonthlyTrends = (payments) => {
    const monthlyData = {};
    
    payments
      .filter(p => p.status === 'COMPLETED')
      .forEach(p => {
        const date = new Date(p.time || p.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, revenue: 0, count: 0 };
        }
        
        monthlyData[monthKey].revenue += parseFloat(p.amount || 0);
        monthlyData[monthKey].count += 1;
      });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateRevenueGrowth = (payments) => {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    
    const currentRevenue = payments
      .filter(p => {
        const date = new Date(p.time || p.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear && p.status === 'COMPLETED';
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    const lastRevenue = payments
      .filter(p => {
        const date = new Date(p.time || p.createdAt);
        return date.getMonth() === lastMonth && date.getFullYear() === currentYear && p.status === 'COMPLETED';
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  };

  const calculateTopPayers = (payments) => {
    const parentPayments = {};
    
    payments
      .filter(p => p.status === 'COMPLETED')
      .forEach(p => {
        const parentId = p.student?.parent?.id || 'Unknown';
        if (!parentPayments[parentId]) {
          parentPayments[parentId] = { 
            parentId, 
            parentName: p.student?.parent?.name || 'Unknown Parent',
            totalPaid: 0, 
            paymentCount: 0 
          };
        }
        parentPayments[parentId].totalPaid += parseFloat(p.amount || 0);
        parentPayments[parentId].paymentCount += 1;
      });

    return Object.values(parentPayments)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);
  };

  const calculateDelinquentAccounts = (charges, payments) => {
    const parentBalances = {};
    
    // Calculate total charges per parent
    charges.forEach(charge => {
      const parentId = charge.parent?.id || 'Unknown';
      if (!parentBalances[parentId]) {
        parentBalances[parentId] = { 
          parentId, 
          parentName: charge.parent?.name || 'Unknown Parent',
          totalCharged: 0, 
          totalPaid: 0 
        };
      }
      parentBalances[parentId].totalCharged += parseFloat(charge.amount || 0);
    });

    // Calculate total paid per parent
    payments
      .filter(p => p.status === 'COMPLETED')
      .forEach(p => {
        const parentId = p.student?.parent?.id || 'Unknown';
        if (parentBalances[parentId]) {
          parentBalances[parentId].totalPaid += parseFloat(p.amount || 0);
        }
      });

    // Calculate balances and return delinquent accounts
    return Object.values(parentBalances)
      .map(parent => ({
        ...parent,
        balance: parent.totalCharged - parent.totalPaid,
        delinquencyRate: parent.totalCharged > 0 ? ((parent.totalCharged - parent.totalPaid) / parent.totalCharged) * 100 : 0
      }))
      .filter(parent => parent.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
  };

  const paymentMethodData = useMemo(() => 
    Object.entries(metrics.paymentMethods).map(([method, amount]) => ({
      type: method,
      value: amount
    })), [metrics.paymentMethods]);

  const agingData = useMemo(() => [
    { name: 'Current', value: metrics.agingAnalysis.current, color: '#52c41a' },
    { name: '30 Days Overdue', value: metrics.agingAnalysis.overdue30, color: '#faad14' },
    { name: '60 Days Overdue', value: metrics.agingAnalysis.overdue60, color: '#fa8c16' },
    { name: '90+ Days Overdue', value: metrics.agingAnalysis.overdue90, color: '#f5222d' }
  ], [metrics.agingAnalysis]);

  const columns = [
    {
      title: 'Parent Name',
      dataIndex: 'parentName',
      key: 'parentName',
      sorter: (a, b) => a.parentName.localeCompare(b.parentName),
    },
    {
      title: 'Total Paid',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (value) => `KES ${value?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => a.totalPaid - b.totalPaid,
    },
    {
      title: 'Payment Count',
      dataIndex: 'paymentCount',
      key: 'paymentCount',
      sorter: (a, b) => a.paymentCount - b.paymentCount,
    }
  ];

  const delinquentColumns = [
    {
      title: 'Parent Name',
      dataIndex: 'parentName',
      key: 'parentName',
      sorter: (a, b) => a.parentName.localeCompare(b.parentName),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (value) => (
        <Tag color={value > 10000 ? 'red' : value > 5000 ? 'orange' : 'yellow'}>
          KES {value?.toFixed(2) || '0.00'}
        </Tag>
      ),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: 'Delinquency Rate',
      dataIndex: 'delinquencyRate',
      key: 'delinquencyRate',
      render: (value) => `${value?.toFixed(1) || '0.0'}%`,
      sorter: (a, b) => a.delinquencyRate - b.delinquencyRate,
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Date Filter */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <h2>Financial Metrics Dashboard</h2>
        <RangePicker 
              onChange={setDateRange}
              placeholder={['Start Date', 'End Date']}
              style={{ width: 300 }}
            />
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={metrics.totalRevenue}
              precision={2}
              prefix="KES "
              valueStyle={{ color: '#3f8600' }}
              suffix={
                metrics.revenueGrowth > 0 ? 
                  <ArrowUpOutlined style={{ color: '#52c41a' }} /> : 
                  metrics.revenueGrowth < 0 ?
                    <ArrowDownOutlined style={{ color: '#f5222d' }} /> : null
              }
            />
            <div style={{ fontSize: '14px', color: '#52c41a', marginTop: '8px' }}>
              {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% vs last month
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Collection Rate"
              value={metrics.collectionRate}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: metrics.collectionRate >= 80 ? '#3f8600' : 
                       metrics.collectionRate >= 60 ? '#faad14' : '#f5222d' 
              }}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Outstanding Balance"
              value={metrics.outstandingBalance}
              precision={2}
              prefix="KES "
              valueStyle={{ color: metrics.outstandingBalance > 0 ? '#f5222d' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={metrics.paymentMethods ? Object.values(metrics.paymentMethods).reduce((sum, val) => sum + val, 0) : 0}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Revenue Trend" style={{ height: '400px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: metrics.monthlyTrends.map(item => item.month)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  data: metrics.monthlyTrends.map(item => item.revenue),
                  type: 'line',
                  smooth: true,
                  color: '#3f8600',
                  symbolSize: 8,
                  symbol: 'diamond'
                }]
              }}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Payment Methods" style={{ height: '400px' }}>
            <ReactECharts
              option={{
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  data: paymentMethodData.map(item => ({
                    name: item.type,
                    value: item.value
                  })),
                  label: {
                    show: true,
                    formatter: '{b}: {d}%'
                  }
                }]
              }}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Aging Analysis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Aging Analysis" style={{ height: '300px' }}>
            <ReactECharts
              option={{
                xAxis: {
                  type: 'category',
                  data: agingData.map(item => item.name)
                },
                yAxis: {
                  type: 'value'
                },
                series: [{
                  type: 'bar',
                  data: agingData.map(item => ({
                    value: item.value,
                    itemStyle: {
                      color: item.color
                    }
                  })),
                  label: {
                    show: true,
                    position: 'inside',
                    color: '#fff'
                  }
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
          <Card title="Top Payers" style={{ height: '400px' }}>
            <Table
              columns={columns}
              dataSource={metrics.topPayers}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Delinquent Accounts" style={{ height: '400px' }}>
            <Table
              columns={delinquentColumns}
              dataSource={metrics.delinquentAccounts}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinancialMetrics;
