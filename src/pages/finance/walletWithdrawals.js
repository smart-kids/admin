import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Select, Input, message, Tag } from 'antd';
import DataPromise from '../../utils/data';

const { Option } = Select;
const { TextArea } = Input;

const WALLET_REQUESTS_QUERY = `
  query GetAllWithdrawalRequests {
    wallet {
      allWithdrawalRequests {
        id
        amount
        status
        adminRemarks
        createdAt
        teacher {
          id
          name
        }
        wallet {
          id
          balance
          totalEarned
        }
      }
    }
  }
`;

const PROCESS_WITHDRAWAL_MUTATION = `
  mutation ProcessWithdrawal($requestId: String!, $status: String!, $remarks: String) {
    wallet {
      processWithdrawal(requestId: $requestId, status: $status, remarks: $remarks) {
        id
        status
      }
    }
  }
`;

export default function WalletWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [processStatus, setProcessStatus] = useState('PAID');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const ds = await DataPromise;
      const res = await ds.query(WALLET_REQUESTS_QUERY);
      if (res && res.wallet && res.wallet.allWithdrawalRequests) {
        setRequests(res.wallet.allWithdrawalRequests);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const ds = await DataPromise;
      await ds.query(PROCESS_WITHDRAWAL_MUTATION, {
        requestId: selectedRequest.id,
        status: processStatus,
        remarks: remarks
      });
      message.success("Request processed successfully.");
      setModalVisible(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to process request.");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      title: 'Teacher',
      key: 'teacher',
      render: (text, record) => record.teacher ? record.teacher.name : 'Unknown'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'PENDING' ? 'orange' : status === 'PAID' ? 'green' : 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(Number(date)).toLocaleString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        record.status === 'PENDING' ? (
          <Button type="primary" size="small" onClick={() => {
            setSelectedRequest(record);
            setProcessStatus('PAID');
            setRemarks('');
            setModalVisible(true);
          }}>
            Process
          </Button>
        ) : null
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Teacher Wallet Withdrawals">
        <Table 
          columns={columns} 
          dataSource={requests} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Process Withdrawal"
        visible={modalVisible}
        onCancel={() => !processing && setModalVisible(false)}
        onOk={handleProcess}
        confirmLoading={processing}
      >
        {selectedRequest && (
          <div>
            <p><strong>Teacher:</strong> {selectedRequest.teacher?.name}</p>
            <p><strong>Amount:</strong> ${selectedRequest.amount.toFixed(2)}</p>
            <div style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}><strong>Action:</strong></p>
              <Select value={processStatus} onChange={setProcessStatus} style={{ width: '100%' }}>
                <Option value="PAID">Approve & Mark as Paid</Option>
                <Option value="REJECTED">Reject & Refund</Option>
              </Select>
            </div>
            <div>
              <p style={{ marginBottom: 8 }}><strong>Admin Remarks (Optional):</strong></p>
              <TextArea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
