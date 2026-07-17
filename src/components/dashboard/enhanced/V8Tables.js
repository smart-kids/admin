import React, { Component } from 'react';
import { formatCurrency, formatNumber, formatRelativeTime, rankItems, maskEmail, maskPhone } from '../../../utils/formatters';

// V8 DataTable - Modern table design with advanced features
export class V8DataTable extends Component {
  state = {
    expandedRows: new Set(),
    selectedRows: new Set(),
    sortBy: 'studentsCount',
    sortOrder: 'desc',
    currentPage: 1,
    itemsPerPage: 1000,
    showDeleted: false
  };

  componentDidMount() {
    const { sortBy, sortOrder } = this.props;
    if (sortBy) this.setState({ sortBy, sortOrder });
  }

  toggleShowDeleted = () => {
    this.setState(prevState => ({ showDeleted: !prevState.showDeleted }));
  };

  handleSort = (column) => {
    const { sortBy, sortOrder } = this.state;
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    this.setState({ sortBy: column, sortOrder: newOrder });
    this.props.onSort(column, newOrder);
  };

  handleRowExpand = (schoolId) => {
    const { expandedRows } = this.state;
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(schoolId)) {
      newExpanded.delete(schoolId);
    } else {
      newExpanded.add(schoolId);
    }
    this.setState({ expandedRows: newExpanded });
  };

  handleRowSelect = (schoolId) => {
    const { selectedRows } = this.state;
    const newSelected = new Set(selectedRows);
    if (newSelected.has(schoolId)) {
      newSelected.delete(schoolId);
    } else {
      newSelected.add(schoolId);
    }
    this.setState({ selectedRows: newSelected });
  };

  handleSelectAll = () => {
    const { data } = this.props;
    const { selectedRows } = this.state;
    
    if (selectedRows.size === data.length) {
      this.setState({ selectedRows: new Set() });
    } else {
      this.setState({ selectedRows: new Set(data.map(item => item.id)) });
    }
  };

  processData = () => {
    const { data, payments, searchTerm } = this.props;
    const { sortBy, sortOrder, showDeleted } = this.state;

    if (!data || !payments) return [];

    // Filter by deleted status first
    let filteredData = data;
    if (!showDeleted) {
      filteredData = data.filter(school => !school.isDeleted);
    }

    // Process data with metrics
    const processedData = filteredData.map(school => {
      const schoolPayments = payments.filter(p => 
        p.schoolId === school.id || (p.school && p.school.id === school.id)
      );
      
      const totalRevenue = schoolPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const transactionCount = schoolPayments.length;
      const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
      
      return {
        ...school,
        totalRevenue,
        transactionCount,
        averageTransaction,
        studentsCount: school.studentsCount || (school.students ? school.students.length : 0),
        teacherCount: school.teachers ? school.teachers.length : 0,
        classCount: school.classes ? school.classes.length : 0,
        revenuePerStudent: (school.studentsCount || (school.students ? school.students.length : 0)) > 0 
          ? totalRevenue / (school.studentsCount || (school.students ? school.students.length : 0)) 
          : 0
      };
    });

    // Filter by search term
    let resultData = processedData;
    if (searchTerm) {
      resultData = processedData.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data
    return resultData.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle numerical sorting
      if (typeof aValue === 'string') {
        const parsedA = parseFloat(aValue.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(parsedA)) aValue = parsedA;
      }
      if (typeof bValue === 'string') {
        const parsedB = parseFloat(bValue.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(parsedB)) bValue = parsedB;
      }

      const aVal = parseFloat(aValue) || 0;
      const bVal = parseFloat(bValue) || 0;
      
      if (sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
  };

  renderSortIcon = (column) => {
    const { sortBy, sortOrder } = this.state;
    if (sortBy !== column) return <i className="la la-arrows-v ml-2 text-muted"></i>;
    
    return sortOrder === 'asc' 
      ? <i className="la la-arrow-up ml-2 text-primary"></i>
      : <i className="la la-arrow-down ml-2 text-primary"></i>;
  };

  render() {
    const { loading } = this.props;
    const { expandedRows, selectedRows, currentPage, itemsPerPage, showDeleted, sortBy, sortOrder } = this.state;

    if (loading) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading table data...
            </div>
          </div>
        </div>
      );
    }

    const processedData = this.processData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = processedData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    return (
      <div className="v8-data-table">
        <div className="card card-custom" style={{ borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
          {/* Table Header */}
          <div className="card-header border-0 bg-light">
            <div className="card-title">
              <h3 className="card-label font-weight-bolder text-dark">Schools Performance</h3>
            </div>
            <div className="card-toolbar">
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control form-control-sm mr-3"
                  placeholder="Search schools..."
                  value={this.props.searchTerm}
                  onChange={(e) => this.props.onSearch(e.target.value)}
                  style={{ width: '250px' }}
                />
                <div className="btn-group">
                  <button className="btn btn-sm btn-light-primary" onClick={this.handleSelectAll}>
                    <i className="la la-check-square mr-1"></i>
                    Select All
                  </button>
                </div>
                <div className="btn-group">
                  <button 
                    className={`btn btn-sm ${showDeleted ? 'btn-primary' : 'btn-light-primary'}`} 
                    onClick={this.toggleShowDeleted}
                  >
                    <i className={`la ${showDeleted ? 'la-eye' : 'la-eye-slash'} mr-1`}></i>
                    {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-head-custom table-vertical-center">
                <thead>
                  <tr className="bg-light">
                    <th className="pl-6">
                      <label className="checkbox checkbox-single">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === processedData.length && processedData.length > 0}
                          onChange={this.handleSelectAll}
                        />
                        <span></span>
                      </label>
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('name')}
                      style={{ minWidth: '200px' }}
                    >
                      School Name {this.renderSortIcon('name')}
                    </th>
                    
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('schoolType')}
                      style={{ minWidth: '120px' }}
                    >
                      Type {this.renderSortIcon('schoolType')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('schoolLevel')}
                      style={{ minWidth: '120px' }}
                    >
                      Level {this.renderSortIcon('schoolLevel')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('schoolSize')}
                      style={{ minWidth: '100px' }}
                    >
                      Size {this.renderSortIcon('schoolSize')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('studentsCount')}
                      style={{ minWidth: '120px' }}
                    >
                      Students {this.renderSortIcon('studentsCount')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('numberOfStudents')}
                      style={{ minWidth: '120px' }}
                    >
                      Reg. Count {this.renderSortIcon('numberOfStudents')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('phone')}
                      style={{ minWidth: '120px' }}
                    >
                      Phone {this.renderSortIcon('phone')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('email')}
                      style={{ minWidth: '180px' }}
                    >
                      Email {this.renderSortIcon('email')}
                    </th>
                    <th 
                      className="font-weight-bold text-muted cursor-pointer"
                      onClick={() => this.handleSort('ratePerStudent')}
                      style={{ minWidth: '120px' }}
                    >
                      SaaS Amount {this.renderSortIcon('ratePerStudent')}
                    </th>
                    <th className="font-weight-bold text-muted" style={{ minWidth: '100px' }}>
                      Status
                    </th>
                    <th className="text-right pr-6" style={{ minWidth: '120px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((school, index) => {
                    const isExpanded = expandedRows.has(school.id);
                    const isSelected = selectedRows.has(school.id);
                    const isDeleted = school.isDeleted === true;
                    const isActive = !isDeleted && school.isActive !== false;
                    
                    return (
                      <React.Fragment key={school.id}>
                        <tr 
                          className={`${isExpanded ? 'bg-light-primary' : ''} ${isSelected ? 'bg-light-success' : ''}`}
                          style={isDeleted ? { opacity: 0.6, backgroundColor: '#f3f6f9' } : {}}
                        >
                          <td className="pl-6">
                            <label className="checkbox checkbox-single">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => this.handleRowSelect(school.id)}
                              />
                              <span></span>
                            </label>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {school.logo && (
                                <img
                                  src={school.logo}
                                  alt={school.name}
                                  className="symbol symbol-40 mr-3"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', filter: isDeleted ? 'grayscale(100%)' : 'none' }}
                                />
                              )}
                              <div>
                                <div className={`font-weight-bold ${isDeleted ? 'text-muted' : 'text-dark'}`}>{school.name}</div>
                                <div className="text-muted small">{school.address || 'No address'}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <span className="font-weight-bold text-dark-75">{school.schoolType || '-'}</span>
                          </td>
                          <td>
                            <span className="font-weight-bold text-dark-75">{school.schoolLevel || '-'}</span>
                          </td>
                          <td>
                            <span className="font-weight-bold text-dark-75">{school.schoolSize || '-'}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="font-weight-bolder text-primary">{formatNumber(school.studentsCount)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="font-weight-bold text-dark-75">{formatNumber(school.numberOfStudents) || '-'}</span>
                          </td>
                          <td>
                            <div className="font-weight-bold text-dark-75" style={{ fontSize: '0.85rem' }}>{maskPhone(school.phone)}</div>
                          </td>
                          <td>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                              <a href={`mailto:${school.email}`} className="text-muted text-hover-primary" title={school.email}>{maskEmail(school.email)}</a>
                            </div>
                          </td>
                          <td>
                            <span className="font-weight-bolder text-info">
                              {school.ratePerStudent ? formatCurrency(school.ratePerStudent) : '-'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${isDeleted ? 'secondary' : (isActive ? 'success' : 'danger')} badge-pill`}>
                              {isDeleted ? 'Deleted' : (isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="text-right pr-6">
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-light-primary"
                                onClick={() => this.handleRowExpand(school.id)}
                                title="Details"
                              >
                                <i className={`la la-${isExpanded ? 'compress' : 'expand'}`}></i>
                              </button>
                              
                              {isDeleted ? (
                                <button 
                                  className="btn btn-sm btn-light-success"
                                  onClick={() => this.props.onRestore && this.props.onRestore(school)}
                                  title="Restore School"
                                >
                                  <i className="la la-undo"></i>
                                </button>
                              ) : (
                                <>
                                  <button 
                                    className="btn btn-sm btn-light-info"
                                    onClick={() => this.props.onEdit && this.props.onEdit(school)}
                                    title="Edit School"
                                  >
                                    <i className="la la-edit"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-light-danger"
                                    onClick={() => this.props.onDelete && this.props.onDelete(school)}
                                    title="Delete School"
                                  >
                                    <i className="la la-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="bg-light-primary">
                            <td colSpan="8" className="p-6">
                              <div className="row">
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <h5 className="font-weight-bolder text-primary">{formatNumber(school.studentCount)}</h5>
                                    <p className="text-muted">Total Students</p>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <h5 className="font-weight-bolder text-info">{formatNumber(school.teacherCount)}</h5>
                                    <p className="text-muted">Total Teachers</p>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <h5 className="font-weight-bolder text-warning">{formatNumber(school.classCount)}</h5>
                                    <p className="text-muted">Total Classes</p>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="text-center">
                                    <h5 className="font-weight-bolder text-success">{formatCurrency(school.averageTransaction)}</h5>
                                    <p className="text-muted">Avg Transaction</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="card-footer border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of {processedData.length} schools
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-light-primary"
                  onClick={() => this.setState({ currentPage: Math.max(1, currentPage - 1) })}
                  disabled={currentPage === 1}
                >
                  <i className="la la-arrow-left"></i>
                </button>
                <span className="btn btn-sm btn-light">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-light-primary"
                  onClick={() => this.setState({ currentPage: Math.min(totalPages, currentPage + 1) })}
                  disabled={currentPage === totalPages}
                >
                  <i className="la la-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Revenue Table Component
export class RevenueTable extends Component {
  render() {
    const { title, data, loading } = this.props;

    if (loading) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading revenue data...
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="revenue-table">
        <div className="card card-custom" style={{ borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
          <div className="card-header border-0 bg-gradient-primary">
            <div className="card-title">
              <h3 className="card-label font-weight-bolder text-white">{title}</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded">
                <span className="font-weight-bold">Current Revenue</span>
                <span className="font-weight-bolder text-primary">{formatCurrency(data.current)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded">
                <span className="font-weight-bold">Potential Revenue</span>
                <span className="font-weight-bolder text-success">{formatCurrency(data.potential)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded">
                <span className="font-weight-bold">Revenue Gap</span>
                <span className="font-weight-bolder text-danger">{formatCurrency(data.gap)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded">
                <span className="font-weight-bold">Utilization Rate</span>
                <span className="font-weight-bolder text-info">{data.utilization.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Performance Table Component
export class PerformanceTable extends Component {
  render() {
    const { title, data, loading } = this.props;

    if (loading) {
      return (
        <div className="card card-custom">
          <div className="card-body">
            <div className="text-center py-10">
              <div className="spinner spinner-primary mr-3"></div>
              Loading performance data...
            </div>
          </div>
        </div>
      );
    }

    const metrics = [
      { label: 'Total Students', value: formatNumber(data.students), color: '#3699ff' },
      { label: 'Total Teachers', value: formatNumber(data.teachers), color: '#10b981' },
      { label: 'Total Classes', value: formatNumber(data.classes), color: '#f6c23e' },
      { label: 'Student Engagement', value: `${data.engagement.toFixed(1)}%`, color: '#e74c3c' },
      { label: 'Completion Rate', value: `${data.completion.toFixed(1)}%`, color: '#8b5cf6' },
      { label: 'Collection Rate', value: `${data.collection.toFixed(1)}%`, color: '#ec4899' }
    ];

    return (
      <div className="performance-table">
        <div className="card card-custom" style={{ borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
          <div className="card-header border-0 bg-gradient-success">
            <div className="card-title">
              <h3 className="card-label font-weight-bolder text-white">{title}</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-vertical-center">
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="symbol symbol-20 mr-3"
                            style={{ backgroundColor: metric.color }}
                          ></div>
                          <span className="font-weight-bold">{metric.label}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="font-weight-bolder" style={{ color: metric.color }}>
                          {metric.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
