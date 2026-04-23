import React, { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Table from "./components/table";
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "./edit";
import DeleteModal from "./delete";
import Data from "../../utils/data";
import { mutate } from "../../utils/requests";
import SmsBalanceModal from "../finance/components/SmsBalanceModal";
import Handlebars from 'handlebars';

// Standardized API wrapper to avoid CORS issues and handle errors consistently
const apiRequest = async (mutation, variables) => {
  try {
    const response = await mutate(mutation, variables);
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message || 'API request failed');
    }
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Standardized school data access with proper error handling
const getSchoolData = () => {
  try {
    const schools = Data.schools.list();
    if (!schools || schools.length === 0) {
      throw new Error('No school data available');
    }
    return schools[0];
  } catch (error) {
    console.error('Error accessing school data:', error);
    return null;
  }
};

const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();

// Helper function to mask phone numbers
const maskPhone = (phone) => {
  if (!phone) return '';
  const p = phone.toString().replace(/\D/g, '');
  if (p.length < 7) return p;
  return `${p.slice(0, 4)}***${p.slice(-3)}`;
};

class ClassesManagement extends Component {
  _isMounted = false;
  depositPollingInterval = null;
  state = {
    classes: [],
    teachers:[],
    filteredClasses:[],
    loading: true,
    currentPage: 1,
    itemsPerPage: 20,
    expandedClasses: {},
    showSmsModal: false,
    selectedStudent: null,
    smsMessage: '',
    messageTemplate: '',
    isSendingSms: false,
    school: null,
    showDepositModal: false,
    smsCost: 2, // SMS cost from communications module: 2.0 KES
    depositPhone: '',
    depositAmount: '',
    depositStatus: 'IDLE',
    depositMessage: '',
    depositTransactionId: null
  };
  componentDidMount() {
    this._isMounted = true;
    this.loadData();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.depositPollingInterval) {
      clearInterval(this.depositPollingInterval);
      this.depositPollingInterval = null;
    }
  }

  loadData = async () => {
    try {
      // Set initial loading state
      this.setState({ loading: true });
      
      // Use standardized data access patterns
      const classes = [...(Data.classes.list() || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      const teachers = Data.teachers.list();
      const school = getSchoolData();
      
      // Only set loading to false if we have data
      const hasData = classes && classes.length > 0;
      this.setState({ 
        classes, 
        filteredClasses: classes, 
        teachers,
        school,
        loading: !hasData 
      });

      Data.classes.subscribe(({ classes }) => {
        const sortedClasses = [...(classes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        const hasSubscribedData = sortedClasses && sortedClasses.length > 0;
        this.setState({ 
          classes: sortedClasses, 
          filteredClasses: sortedClasses, 
          loading: !hasSubscribedData 
        });
      });

      Data.teachers.subscribe(({ teachers }) => {
        this.setState({ teachers });
      });

      Data.schools.subscribe(({ schools }) => {
        if (schools && schools.length > 0) {
          this.setState({ school: schools[0] });
        }
      });
    } catch (error) {
      console.error("Failed to load classes:", error);
      this.setState({ loading: false });
    }
  };

  onSearch = e => {
    const { classes } = this.state
    const filteredClasses = classes.filter(Iclass => Iclass.name.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredClasses })
  }

  toggleClass = (classId) => {
    this.setState(prevState => ({
      expandedClasses: {
        ...prevState.expandedClasses,
        [classId]: !prevState.expandedClasses[classId]
      }
    }));
  };

  handleQuickSms = (student) => {
    // Create a group object compatible with SmsBalanceModal
    const smsGroup = {
      parent: student.parent,
      students: [student],
      totalBalance: 0, // Not used for quick SMS
      totalExpected: 0,
      totalPaid: 0,
      charges: []
    };

    this.setState({
      selectedStudent: student,
      smsGroup,
      showSmsModal: true,
      messageTemplate: `Dear {{recipient.name}}, this is a message regarding {{student.names}}.`
    });
  }

  closeSmsModal = () => {
    this.setState({
      showSmsModal: false,
      selectedStudent: null,
      smsGroup: null,
      isSendingSms: false
    });
  }

  handleSendSms = async (messageTemplate) => {
    const { selectedStudent, school, smsCost } = this.state;
    
    if (!selectedStudent?.parent?.phone) {
      if (window.toastr) {
        window.toastr.error('No parent phone number available');
      }
      return;
    }

    // Process message template with Handlebars variables
    let processedMessage = messageTemplate;
    try {
      const template = Handlebars.compile(messageTemplate);
      const context = {
        recipient: selectedStudent.parent,
        parent: selectedStudent.parent,
        student: selectedStudent,
        school: { name: school?.name || 'School' }
      };
      processedMessage = template(context);
    } catch (error) {
      console.error('Template processing error:', error);
      processedMessage = messageTemplate; // Fallback to raw template
    }

    // Calculate SMS cost
    const CHARS_PER_SEGMENT = 160;
    const segments = Math.ceil(processedMessage.length / CHARS_PER_SEGMENT);
    const totalCost = segments * smsCost;
    const currentBalance = school?.financial?.balance || 0;
    
    // Check balance
    if (currentBalance < totalCost) {
      if (window.toastr) {
        window.toastr.warning(`Insufficient SMS balance. Need KES ${totalCost.toFixed(2)}, have KES ${currentBalance.toFixed(2)}`);
      }
      this.handleInsufficientBalance();
      return;
    }

    this.setState({ isSendingSms: true });
    
    try {
      const smsData = {
        phone: selectedStudent.parent.phone,
        message: processedMessage,
        // Additional SMS data structure from communications module
        recipientCount: 1,
        segments: segments
      };
      
      await apiRequest(
        `mutation SendSMS($sms: Isms!) {
          sms {
            send(sms: $sms) {
              success
              message
              sentCount
              failedCount
              successfulSends {
                parentId
                phone
              }
              failedSends {
                parentId
                phone
                error
              }
            }
          }
        }`,
        { sms: smsData }
      );
      
      if (window.toastr) {
        window.toastr.success(`SMS sent to ${selectedStudent.parent.name} at ${selectedStudent.parent.phone} (Cost: KES ${totalCost.toFixed(2)})`);
      }
      
      this.closeSmsModal();
      
      // Refresh school data to update balance
      const updatedSchool = Data.schools.list()[0];
      this.setState({ school: updatedSchool });
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
      if (window.toastr) {
        window.toastr.error('Failed to send SMS');
      }
    } finally {
      this.setState({ isSendingSms: false });
    }
  }

  handleInsufficientBalance = () => {
    // Open deposit modal when SMS balance is insufficient
    this.setState({
      showDepositModal: true,
      showSmsModal: false // Close SMS modal but keep state for chaining
    });
  }

  closeDepositModal = () => {
    // Clear polling
    if (this.depositPollingInterval) {
      clearInterval(this.depositPollingInterval);
      this.depositPollingInterval = null;
    }
    
    this.setState({
      showDepositModal: false,
      depositStatus: 'IDLE',
      depositMessage: '',
      depositTransactionId: null,
      // Reopen SMS modal after deposit if user was in middle of sending
      showSmsModal: !!this.state.selectedStudent
    });
  }

  handleDepositSuccess = () => {
    // Refresh school data after successful deposit
    const school = Data.schools.list()[0];
    this.setState({ 
      school,
      showDepositModal: false,
      depositStatus: 'IDLE',
      depositMessage: '',
      depositTransactionId: null,
      // Reopen SMS modal after deposit
      showSmsModal: !!this.state.selectedStudent
    });
    
    if (window.toastr) {
      window.toastr.success('Deposit successful! You can now send SMS.');
    }
  }

  initiateMpesaPayment = async () => {
    const { depositPhone, depositAmount } = this.state;
    
    if (!depositPhone || !depositAmount) {
      if (window.toastr) {
        window.toastr.error('Please enter phone number and select amount');
      }
      return;
    }

    this.setState({ depositStatus: 'INITIATING', depositMessage: '' });

    try {
      // Use standardized API wrapper
      const result = await apiRequest(
        `mutation ($data: mpesaStartTxInput!) { 
          payments { 
            init(payment: $data){ 
              id, 
              CheckoutRequestID, 
              MerchantRequestID 
            } 
          } 
        }`,
        {
          data: {
            payment: {
              schoolId: this.state.school?.id,
              amount: String(depositAmount),
              ammount: String(depositAmount), // Also provide misspelled one
              phone: depositPhone,
              metadata: { type: 'bulksms' }
            }
          }
        }
      );

      if (!this._isMounted) return;

      const { id, CheckoutRequestID, MerchantRequestID } = result.payments?.init || {};
      
      this.setState({
        depositTransactionId: id,
        depositStatus: 'AWAITING_USER_ACTION',
        depositMessage: `Request sent to ${depositPhone}. Enter PIN now.`
      });

      // Start polling for payment status
      this.startDepositPolling(MerchantRequestID, CheckoutRequestID);

    } catch (error) {
      console.error('Payment initiation error:', error);
      this.setState({ 
        depositStatus: 'ERROR', 
        depositMessage: error.message || 'Failed to initiate payment' 
      });
    }
  }

  startDepositPolling = (MerchantRequestID, CheckoutRequestID) => {
    // Clear any existing polling
    if (this.depositPollingInterval) {
      clearInterval(this.depositPollingInterval);
    }

    // Poll every 5 seconds
    this.depositPollingInterval = setInterval(() => {
      this.checkDepositStatus(MerchantRequestID, CheckoutRequestID);
    }, 5000);
  }

  checkDepositStatus = async (MerchantRequestID, CheckoutRequestID) => {
    // Only show "Verifying" if we aren't already in a failure/success state
    if (this.state.depositStatus !== 'AWAITING_USER_ACTION' && this.state.depositStatus !== 'ERROR') {
      this.setState({ depositStatus: 'VERIFYING' });
    }

    try {
      const result = await apiRequest(
        `mutation ($data: mpesaStartTxVerificationInput!) { 
          payments { 
            confirm(payment: $data) { 
              success
              message
              id
              amount
              phone
              status
              mpesaReceiptNumber
              resultDesc
              ref
              time 
            } 
          } 
        }`,
        {
          MerchantRequestID: MerchantRequestID,
          CheckoutRequestID: CheckoutRequestID
        }
      );
      
      if (!this._isMounted) return;
      if (!result?.payments?.confirm) return; // Still pending

      const { status, message, amount, ref } = result.payments.confirm;

      if (status === 'COMPLETED') {
        // Clear polling
        if (this.depositPollingInterval) {
          clearInterval(this.depositPollingInterval);
          this.depositPollingInterval = null;
        }

        // Update school balance
        const school = Data.schools.list()[0];
        
        this.setState({ 
          depositStatus: 'SUCCESS', 
          depositMessage: (
            <div>
              <strong>Payment Received!</strong>
              <div style={{fontSize: '0.9em', marginTop: '4px'}}>
                Ref: <b>{ref}</b><br/>
                Amount: KES {amount}
              </div>
            </div>
          )
        });

        if (window.toastr) {
          window.toastr.success(`Payment successful! Added ${amount} SMS credits.`);
        }

        // Auto-close and return to SMS modal
        setTimeout(() => {
          this.handleDepositSuccess();
        }, 3000);

      } else if (status.includes('FAILED') || status.includes('FLAGGED')) {
        // Clear polling on failure
        if (this.depositPollingInterval) {
          clearInterval(this.depositPollingInterval);
          this.depositPollingInterval = null;
        }

        const errorView = (
          <div>
            <strong>Transaction Failed</strong>
            <div style={{fontSize: '0.95em', marginTop: '5px', marginBottom: '5px'}}>
              {message}
            </div>
            <div style={{fontSize: '0.85em', opacity: 0.8, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '5px'}}>
              KES {amount} • {this.state.depositPhone}
            </div>
          </div>
        );

        this.setState({ 
          depositStatus: 'ERROR', 
          depositMessage: errorView 
        });

      }
    } catch (e) {
      console.error("Deposit Poll Error", e);
    }
  }

  onDragEnd = async (result) => {
    if (!result.destination) return;

    const { classes, filteredClasses } = this.state;
    const reorderedClasses = Array.from(filteredClasses);
    const [removed] = reorderedClasses.splice(result.source.index, 1);
    reorderedClasses.splice(result.destination.index, 0, removed);

    // Assign new order values based on index
    const updatedClasses = reorderedClasses.map((cls, index) => ({
        ...cls,
        order: index
    }));

    const previousClasses = filteredClasses;
    this.setState({ filteredClasses: updatedClasses });

    try {
        const orders = updatedClasses.map(c => ({ id: c.id, order: c.order }));
        await Data.classes.updateOrder(orders);
        if (window.toastr) window.toastr.success("Class order updated");
        
        // Update the full classes array as well
        const newFullClasses = Array.from(classes);
        const draggedClassIndex = newFullClasses.findIndex(c => c.id === removed.id);
        if (draggedClassIndex !== -1) {
            newFullClasses.splice(draggedClassIndex, 1);
            newFullClasses.splice(result.destination.index, 0, removed);
            
            // Update order values in the full array
            const orderedFullClasses = newFullClasses.map((cls, index) => ({
                ...cls,
                order: index
            }));
            
            this.setState({ 
                classes: orderedFullClasses,
                filteredClasses: orderedFullClasses.filter(cls => 
                    cls.name.toLowerCase().match(this.state.searchTerm?.toLowerCase() || '')
                )
            });
        }
    } catch (e) {
        console.error(e);
        this.setState({ filteredClasses: previousClasses });
        if (window.toastr) window.toastr.error("Failed to update order");
    }
  }

  render() {
    const { 
      classes, 
      teachers, 
      filteredClasses, 
      loading, 
      currentPage, 
      itemsPerPage,
      expandedClasses,
      showSmsModal,
      selectedStudent,
      smsGroup,
      messageTemplate,
      isSendingSms,
      school,
      showDepositModal,
      loadingStudents
    } = this.state;
    
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedClasses = filteredClasses.slice(startIndex, startIndex + itemsPerPage);

    // Format currency function
    const formatCurrency = (amount) => {
      if (!amount || amount === 0) return 'KSH 0';
      return `KSH ${Number(amount).toLocaleString('en-US')}`;
    };
    
    return (
      <div className="container-fluid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Classes</h3>
            <div className="card-tools ml-auto">
              <button 
                className="btn btn-outline-primary btn-xs mr-2"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={() => uploadModalInstance.show()}
              >
                <i className="fas fa-upload"></i> Upload
              </button>
              <button 
                className="btn btn-outline-primary btn-xs"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={() => addModalInstance.show()}
              >
                <i className="fas fa-plus"></i> Add Class
              </button>
            </div>
          </div>
          
          <div className="card-body">
            {/* Search */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search classes..."
                    onChange={this.onSearch}
                    id="generalSearch"
                  />
                </div>
              </div>
            </div>
            
            {/* Classes Table */}
            {loading ? (
              <div className="py-4">
                {/* Skeleton Loader for Classes */}
                <div className="skeleton-loader">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="skeleton-item mb-3">
                      <div className="skeleton-row">
                        <div className="skeleton-cell skeleton-checkbox"></div>
                        <div className="skeleton-cell skeleton-handle"></div>
                        <div className="skeleton-cell skeleton-text skeleton-text-lg"></div>
                        <div className="skeleton-cell skeleton-number"></div>
                        <div className="skeleton-cell skeleton-text skeleton-text-md"></div>
                        <div className="skeleton-cell skeleton-actions">
                          <div className="skeleton-button skeleton-button-sm"></div>
                          <div className="skeleton-button skeleton-button-sm"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <DragDropContext onDragEnd={this.onDragEnd}>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th style={{ width: '50px' }}></th>
                        <th>Class Name</th>
                        <th>Number of Students</th>
                        <th>Teacher</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <Droppable droppableId="classes-list">
                      {(provided) => (
                        <tbody {...provided.droppableProps} ref={provided.innerRef}>
                          {paginatedClasses.map((cls, index) => {
                            const isExpanded = !!expandedClasses[cls.id];
                            const teacher = teachers.find(t => t.id === cls.teacher || (cls.teacher && typeof cls.teacher === 'object' && t.id === cls.teacher.id));
                            
                            return (
                              <React.Fragment key={cls.id}>
                                <Draggable draggableId={cls.id} index={index}>
                                  {(provided, snapshot) => (
                                    <tr 
                                      ref={provided.innerRef} 
                                      {...provided.draggableProps}
                                      className={isExpanded ? 'bg-light-primary' : ''}
                                      style={{
                                        ...provided.draggableProps.style,
                                        backgroundColor: snapshot.isDragging ? '#f4f6fa' : (isExpanded ? '#f1faff' : 'transparent')
                                      }}
                                    >
                                      <td {...provided.dragHandleProps} className="text-center" style={{ verticalAlign: 'middle' }}>
                                        <i className="fas fa-grip-vertical text-muted" style={{ cursor: 'grab' }}></i>
                                      </td>
                                      <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                        <button 
                                          className="btn btn-icon btn-light-primary btn-sm"
                                          onClick={() => this.toggleClass(cls.id)}
                                          title={isExpanded ? "Collapse" : "Expand"}
                                        >
                                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                                        </button>
                                      </td>
                                      <td>
                                        <div className="d-flex flex-column">
                                          <span className="text-dark-75 font-weight-bolder">{cls.name}</span>
                                          {cls.grade && (
                                            <span className="text-muted font-size-xs">Grade: {cls.grade}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <span className="badge badge-info">
                                          {cls.students ? cls.students.length : 0} students
                                        </span>
                                      </td>
                                      <td>
                                        {teacher ? (
                                          <span className="badge badge-success">
                                            {teacher.name}
                                          </span>
                                        ) : (
                                          <span className="badge badge-secondary">
                                            No teacher assigned
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <button 
                                          className="btn btn-sm btn-info mr-1"
                                          onClick={() => {
                                            this.setState({ edit: cls }, () => {
                                              editModalInstance.show();
                                            });
                                          }}
                                        >
                                          <i className="fas fa-edit"></i>
                                        </button>
                                        <button 
                                          className="btn btn-sm btn-danger"
                                          onClick={() => {
                                            this.setState({ remove: cls }, () => {
                                              deleteModalInstance.show();
                                            });
                                          }}
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                </Draggable>
                                
                                {/* Expanded Student Details Row */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="6" className="p-0">
                                      <div className="p-4 bg-light-primary border-top">
                                        <h6 className="text-dark-75 font-weight-bolder mb-3">
                                          <i className="fas fa-users mr-2"></i>
                                          Students in {cls.name} ({cls.students ? cls.students.length : 0})
                                        </h6>
                                        {!cls.students || cls.students.length === 0 ? (
                                          <div className="text-center py-4 text-muted">
                                            <i className="fas fa-user-slash fa-3x mb-3"></i>
                                            <div>No students enrolled in this class</div>
                                          </div>
                                        ) : cls.students && cls.students.length > 0 ? (
                                          <div className="table-responsive">
                                            <table className="table table-sm table-borderless">
                                              <thead>
                                                <tr className="text-muted font-size-xs font-weight-bolder text-uppercase">
                                                  <th>#</th>
                                                  <th>Student Name</th>
                                                  <th>Registration</th>
                                                  <th>Parent</th>
                                                  <th>Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {cls.students.map((student, idx) => (
                                                  <tr key={student.id}>
                                                    <td className="font-weight-bolder">{idx + 1}</td>
                                                    <td>
                                                      <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-35 symbol-light-primary mr-3">
                                                          <span className="symbol-label font-size-h6 font-weight-bold">
                                                            {student.names?.[0] || 'S'}
                                                          </span>
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                          <span className="text-dark-75 font-weight-bolder font-size-sm">
                                                            {student.names}
                                                          </span>
                                                          <span className="text-muted font-size-xs">
                                                            {student.gender}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="text-muted">{student.registration || 'N/A'}</td>
                                                    <td>
                                                      {student.parent ? (
                                                        <div className="d-flex flex-column">
                                                          <span className="text-dark-75 font-size-sm">
                                                            {student.parent.name}
                                                          </span>
                                                          {student.parent2 && (
                                                            <span className="text-muted font-size-xs">
                                                              2nd: {student.parent2.name}
                                                            </span>
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <span className="text-muted">No parent info</span>
                                                      )}
                                                    </td>
                                                    <td>
                                                      <button 
                                                        className="btn btn-xs btn-light-info"
                                                        title="Send SMS"
                                                        onClick={() => this.handleQuickSms(student)}
                                                      >
                                                        <i className="fas fa-sms"></i>
                                                      </button>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div className="text-center py-4 text-muted">
                                            <i className="fas fa-user-slash fa-3x mb-3"></i>
                                            <div>No students enrolled in this class</div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {provided.placeholder}
                        </tbody>
                      )}
                    </Droppable>
                  </table>
                </DragDropContext>
                
                {filteredClasses.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    No classes found. Add your first class to get started.
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => this.setState({ currentPage: currentPage - 1 })}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => this.setState({ currentPage: i + 1 })}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => this.setState({ currentPage: currentPage + 1 })}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
        
        {/* Modals */}
        <AddModal teachers={teachers} classes={classes} save={Iclass => Data.classes.create(Iclass)} />
        <UploadModal save={classes=> classes.forEach(Iclass => Data.classes.create(Iclass))} />
        <DeleteModal
          remove={this.state.remove}
          save={Iclass => Data.classes.delete(Iclass)}
        />
        <EditModal
          teachers={teachers}
          edit={this.state.edit}
          save={Iclass => Data.classes.update(Iclass)}
        />
        
        {/* Compose Message Modal with Variables */}
        {showSmsModal && selectedStudent && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Compose Message to Parent</h5>
                  <button type="button" className="close" onClick={this.closeSmsModal} disabled={isSendingSms}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* Student Info */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="font-weight-bold">Student</label>
                        <input className="form-control" type="text" value={selectedStudent?.names} disabled />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="font-weight-bold">Parent</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          value={`${selectedStudent?.parent?.name || 'N/A'} (${maskPhone(selectedStudent?.parent?.phone) || 'No phone'})`} 
                          disabled 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variables */}
                  <div className="form-group mb-3">
                    <label className="font-weight-bold">Available Variables:</label>
                    <div className="d-flex flex-wrap">
                      <span 
                        className="badge badge-light-info mr-2 mb-2" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const newTemplate = (messageTemplate || '') + '{{recipient.name}}';
                          this.setState({ messageTemplate: newTemplate });
                        }}
                      >
                        {'{{recipient.name}}'} - Parent Name
                      </span>
                      <span 
                        className="badge badge-light-primary mr-2 mb-2" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const newTemplate = (messageTemplate || '') + '{{student.names}}';
                          this.setState({ messageTemplate: newTemplate });
                        }}
                      >
                        {'{{student.names}}'} - Student Name
                      </span>
                      <span 
                        className="badge badge-light-success mr-2 mb-2" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const newTemplate = (messageTemplate || '') + '{{school.name}}';
                          this.setState({ messageTemplate: newTemplate });
                        }}
                      >
                        {'{{school.name}}'} - School Name
                      </span>
                    </div>
                    <small className="form-text text-muted">Click variables to insert them into your message</small>
                  </div>

                  {/* Message Template */}
                  <div className="form-group mb-3">
                    <label className="font-weight-bold">Message Content</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      value={messageTemplate}
                      onChange={e => this.setState({ messageTemplate: e.target.value })}
                      placeholder="Type your message here... e.g. Dear {{recipient.name}}, this is about {{student.names}}"
                    />
                  </div>

                  {/* Cost Calculation */}
                  <div className="alert alert-light-info">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>SMS Balance:</strong> {school?.financial?.balanceFormated || `${school?.financial?.balance || 0} SMS`}
                      </div>
                      <div>
                        <strong>Message Length:</strong> {messageTemplate.length} chars
                        {messageTemplate.length > 160 && (
                          <span className="text-warning ml-2">
                            ({Math.ceil(messageTemplate.length / 160)} segments)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Estimated Cost:</strong> KES {(Math.ceil(messageTemplate.length / 160) * 2).toFixed(2)}
                      <small className="text-muted ml-2">(2 KES per segment)</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeSmsModal} disabled={isSendingSms}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => this.handleSendSms(messageTemplate)}
                    disabled={isSendingSms || !selectedStudent?.parent?.phone || !messageTemplate.trim()}
                  >
                    {isSendingSms ? (
                      <span className="spinner-border spinner-border-sm mr-2"></span>
                    ) : (
                      <i className="fa fa-paper-plane mr-2"></i>
                    )}
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* M-Pesa Deposit Modal - Proper checkout workflow */}
        {showDepositModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add SMS Credits</h5>
                  <button type="button" className="close" onClick={this.closeDepositModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle mr-2"></i>
                    Your SMS balance is insufficient. Please add credits to continue sending messages.
                  </div>
                  <div className="text-center mb-4">
                    <h6>Current Balance</h6>
                    <h3 className="text-primary">
                      {school?.financial?.balanceFormated || `${school?.financial?.balance || 0} SMS`}
                    </h3>
                  </div>
                  <div className="form-group">
                    <label className="font-weight-bold">Phone Number</label>
                    <input 
                      className="form-control" 
                      type="text" 
                      placeholder="Enter M-Pesa number"
                      value={this.state.depositPhone || ''}
                      onChange={e => this.setState({ depositPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="font-weight-bold">Amount (KES)</label>
                    <select 
                      className="form-control" 
                      value={this.state.depositAmount || ''}
                      onChange={e => this.setState({ depositAmount: e.target.value })}
                    >
                      <option value="">Select amount</option>
                      <option value="100">100 SMS - KES 100</option>
                      <option value="200">200 SMS - KES 200</option>
                      <option value="500">500 SMS - KES 500</option>
                      <option value="1000">1000 SMS - KES 1,000</option>
                    </select>
                  </div>
                  
                  {/* Payment Status Display */}
                  {this.state.depositStatus && this.state.depositStatus !== 'IDLE' && (
                    <div className="mt-4">
                      <div className={`alert alert-${this.state.depositStatus === 'SUCCESS' ? 'success' : this.state.depositStatus === 'ERROR' ? 'danger' : 'info'}`}>
                        <div className="d-flex align-items-center">
                          {this.state.depositStatus === 'INITIATING' && <span className="spinner-border spinner-border-sm mr-2"></span>}
                          {this.state.depositStatus === 'VERIFYING' && <span className="spinner-border spinner-border-sm mr-2"></span>}
                          {this.state.depositStatus === 'SUCCESS' && <i className="fas fa-check-circle mr-2"></i>}
                          {this.state.depositStatus === 'ERROR' && <i className="fas fa-exclamation-circle mr-2"></i>}
                          {this.state.depositStatus === 'AWAITING_USER_ACTION' && <i className="fas fa-mobile-alt mr-2"></i>}
                          <span>{this.state.depositMessage}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeDepositModal} disabled={this.state.depositStatus && this.state.depositStatus !== 'IDLE'}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={this.initiateMpesaPayment}
                    disabled={!this.state.depositPhone || !this.state.depositAmount || this.state.depositStatus !== 'IDLE'}
                  >
                    {this.state.depositStatus === 'INITIATING' || this.state.depositStatus === 'VERIFYING' ? (
                      <span className="spinner-border spinner-border-sm mr-2"></span>
                    ) : (
                      <i className="fas fa-mobile-alt mr-2"></i>
                    )}
                    {this.state.depositStatus === 'AWAITING_USER_ACTION' ? 'Enter PIN' : 'Pay with M-Pesa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ClassesManagement;
