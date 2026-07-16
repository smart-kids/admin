import React from "react";
import ReactDOM from "react-dom";
import ErrorMessage from "./components/error-toast"; // Adjust path as needed
import Data from "../../utils/data";

const IErrorMessage = new ErrorMessage();
const $ = window.$; 

// Generate a unique ID so we don't conflict if multiple modals exist
// Moved to instance property

const StatusDisplay = ({ status, message }) => {
  const statusConfig = {
    IDLE: {
      icon: 'fas fa-info-circle',
      color: '#0c5460',
      bgColor: '#d1ecf1',
      borderColor: '#bee5eb',
      title: 'Ready',
    },
    INITIATING: {
      icon: 'spinner',
      color: '#004085',
      bgColor: '#cce5ff',
      borderColor: '#b8daff',
      title: 'Connecting...',
    },
    AWAITING_USER_ACTION: {
      icon: 'fas fa-mobile-alt',
      color: '#856404', // Yellow/Gold for attention
      bgColor: '#fff3cd',
      borderColor: '#ffeeba',
      title: 'Check your Phone',
    },
    VERIFYING: {
      icon: 'spinner',
      color: '#0c5460',
      bgColor: '#d1ecf1',
      borderColor: '#bee5eb',
      title: 'Verifying...',
    },
    SUCCESS: {
      icon: 'fas fa-check-circle',
      color: '#155724',
      bgColor: '#d4edda',
      borderColor: '#c3e6cb',
      title: 'Success',
    },
    ERROR: {
      icon: 'fas fa-exclamation-circle',
      color: '#721c24',
      bgColor: '#f8d7da',
      borderColor: '#f5c6cb',
      title: 'Payment Failed',
    },
  };

  const current = statusConfig[status] || statusConfig.IDLE;
  
  // Allow message to be a string or a React component/element
  const content = message || current.defaultMessage;

  return (
    <div style={{
      display: 'flex', 
      alignItems: 'flex-start',
      justifyContent: 'flex-start', 
      gap: '15px',
      padding: '16px', 
      marginTop: '25px', 
      borderRadius: '12px',
      border: `1px solid ${current.borderColor}`, 
      color: current.color, 
      backgroundColor: current.bgColor,
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      textAlign: 'left'
    }}>
      <div style={{ marginTop: '2px' }}>
        {(status === 'INITIATING' || status === 'VERIFYING') ? (
          <span className="spinner-border spinner-border-sm" style={{ width: '1.4rem', height: '1.4rem', borderWidth: '0.2em' }} />
        ) : (
          <i className={current.icon} style={{ fontSize: '1.6rem' }} />
        )}
      </div>
      <div className="flex-grow-1">
        {typeof content === 'object' ? content : (
            <>
                <strong style={{display: 'block', marginBottom: '6px', fontSize: '1.05rem'}}>{current.title}</strong>
                <span style={{ fontSize: '0.95rem', lineHeight: '1.4', display: 'block' }}>{content}</span>
            </>
        )}
      </div>
    </div>
  );
};

class MpesaPaymentModal extends React.Component {
  constructor(props) {
    super(props);
    this.modalId = `mpesa-modal-${Math.random().toString(36).substring(2, 9)}`;
    this.state = {
      status: 'IDLE', 
      message: '',
      transactionId: null, 
      form: { phone: '', amount: '' },
    };
  }

  _isMounted = false;
  pollingInterval = null;

  componentDidMount() {
    this._isMounted = true;
    // Pre-fill phone if available in school data
    const school = Data.schools.getSelected();
    if (school?.phone) {
      this.setState(prev => ({ form: { ...prev.form, phone: school.phone } }));
    }
    
    // Support pre-filling from props (e.g. QuickTopUp)
    if (this.props.forcedSchoolId) {
        // We might fetching public school details to get the phone?
        // Or we just rely on user input.
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.stopPolling();
  }

  // --- Public Methods called via Ref ---
  show = (prefillData = {}) => {
    this.resetState();
    if (prefillData.amount) this.setState(prev => ({ form: { ...prev.form, amount: prefillData.amount }}));
    if (prefillData.phone) this.setState(prev => ({ form: { ...prev.form, phone: prefillData.phone }}));
    
    // React Portals now handle appending to body natively, so we just show the modal
    const modalElem = $(`#${this.modalId}`);
    
    modalElem.modal({ show: true, backdrop: 'static', keyboard: false });
    
    // Fix z-index of the generated Bootstrap backdrop so it sits exactly behind this modal
    // and above any other active modals (which are usually at 1050)
    setTimeout(() => {
        $(`#${this.modalId}`).css('z-index', 1055); // Use 1055 to definitively override Bootstrap's 1050
        const backdrops = $('.modal-backdrop');
        if (backdrops.length > 0) {
            $(backdrops[backdrops.length - 1]).css({
                'z-index': 1054,
                'opacity': 0.7,
                'background-color': '#000',
                'position': 'fixed'
            });
        }
    }, 150);
  };

  hide = () => {
    this.stopPolling();
    $(`#${this.modalId}`).modal('hide');
    // Safety net: occasionally Bootstrap leaves backdrop behind if toggled rapidly
    setTimeout(() => {
        if ($('.modal.show').length === 0) {
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open');
        }
    }, 400);
  };
  // ------------------------------------

  resetState = () => {
    this.stopPolling();
    if (this._isMounted) {
      this.setState({ status: 'IDLE', message: '', transactionId: null });
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prev => ({ form: { ...prev.form, [name]: value } }));
  };

  initiatePayment = async () => {
    const { phone, amount } = this.state.form;
    if (!phone || !amount) return IErrorMessage.show({ message: 'Invalid details.' });

    this.setState({ status: 'INITIATING', message: '' });

    try {
      // 1. Initiate STK Push
      // If forcedSchoolId is provided, we use a public/unauth-friendly method or pass the arg
      const { forcedSchoolId } = this.props;
      let result;
      
      if (forcedSchoolId) {
          result = await Data.schools.charge(phone, amount, { type: 'bulksms' }, forcedSchoolId);
      } else {
          result = await Data.schools.charge(phone, amount, { type: 'bulksms' });
      }
      
      if (!this._isMounted) return;
      if (result.errors || !result?.payments?.init) {
        throw new Error(result.errors?.[0]?.message || 'Failed to init payment.');
      }

      const { id, CheckoutRequestID, MerchantRequestID } = result.payments.init;
      
      this.setState({
        transactionId: id,
        status: 'AWAITING_USER_ACTION',
        message: `Request sent to ${phone}. Enter PIN now.`
      });

      // 2. Start Polling
      this.startPolling(MerchantRequestID, CheckoutRequestID);

    } catch (error) {
      console.error(error);
      if (this._isMounted) this.setState({ status: 'ERROR', message: error.message });
    }
  };

  startPolling = (MerchantRequestID, CheckoutRequestID) => {
    this.stopPolling();
    // Poll every 5 seconds
    this.pollingInterval = setInterval(() => {
      this.checkStatus(MerchantRequestID, CheckoutRequestID);
    }, 5000);
  };

  stopPolling = () => {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  };

  checkStatus = async (MerchantRequestID, CheckoutRequestID) => {
    // Only show "Verifying" if we aren't already in a failure/success state
    if (this.state.status !== 'AWAITING_USER_ACTION' && this.state.status !== 'ERROR') {
        this.setState({ status: 'VERIFYING' });
    }

    try {
      const { forcedSchoolId } = this.props;
      const result = await Data.schools.verifyTx({ 
          MerchantRequestID, 
          CheckoutRequestID,
          schoolId: forcedSchoolId 
      });
      
      if (!this._isMounted) return;
      if (!result?.payments?.confirm) return; // Still pending

      const { status, message, amount, phone, ref } = result.payments.confirm;

      if (status === 'COMPLETED') {
        this.stopPolling();
        this.setState({ 
            status: 'SUCCESS', 
            message: (
                <div>
                    <strong>Payment Received!</strong>
                    <div style={{fontSize: '0.9em', marginTop: '4px'}}>
                        Ref: <b>{ref}</b><br/>
                        Amount: KES {amount}
                    </div>
                </div>
            )
        });
        
        if (this.props.onPaymentSuccess) this.props.onPaymentSuccess();
        setTimeout(() => { this.hide(); }, 4000);

      } else if (status.includes('FAILED') || status.includes('FLAGGED')) {
        this.stopPolling();
        
        // Construct a nice error view using the data from the API
        const errorView = (
            <div>
                <strong>Transaction Failed</strong>
                <div style={{fontSize: '0.95em', marginTop: '5px', marginBottom: '5px'}}>
                    {message}
                </div>
                <div style={{fontSize: '0.85em', opacity: 0.8, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '5px'}}>
                    KES {amount} • {phone}
                </div>
            </div>
        );

        this.setState({ 
            status: 'ERROR', 
            message: errorView 
        });
      }
    } catch (e) {
      console.error("Poll Error", e);
    }
  };

  render() {
    const { status, form } = this.state;
    const isBusy = ['INITIATING', 'AWAITING_USER_ACTION', 'VERIFYING', 'SUCCESS'].includes(status);

    return ReactDOM.createPortal(
      <div className="modal fade" id={this.modalId} tabIndex={-1} role="dialog" aria-hidden="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered" role="document" style={{ zIndex: 1056, maxWidth: '450px' }}>
          <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            
            <div className="modal-header px-6 py-5 border-bottom-0" style={{ backgroundColor: '#43B02A', color: 'white' }}>
              <div className="d-flex align-items-center">
                  <div className="symbol symbol-40 symbol-circle bg-white mr-3 d-flex justify-content-center align-items-center shadow-sm">
                      <i className="fa fa-mobile-alt" style={{ color: '#43B02A', fontSize: '1.2rem' }}></i>
                  </div>
                  <h5 className="modal-title font-weight-bolder mb-0" style={{ fontSize: '1.25rem' }}>M-Pesa Express</h5>
              </div>
              <button type="button" className="close text-white opacity-100" onClick={this.hide} disabled={isBusy} style={{ textShadow: 'none' }}>
                <span aria-hidden="true"><i className="ki ki-close icon-md text-white"></i></span>
              </button>
            </div>
            
            <div className="modal-body p-8 bg-white">
              <div className="text-muted font-size-sm font-weight-bold mb-6 text-center">
                 Provide the phone number to receive the prompt and the amount to pay.
              </div>

              <div className="form-group mb-6">
                <label className="font-weight-bolder text-dark">Phone Number</label>
                <div className="input-group input-group-lg input-group-solid shadow-none rounded-lg" style={{ border: '1px solid #E4E6EF' }}>
                    <div className="input-group-prepend">
                        <span className="input-group-text bg-transparent border-0"><i className="fa fa-phone-alt text-muted"></i></span>
                    </div>
                    <input type="text" className="form-control bg-transparent border-0 font-weight-bold" name="phone" value={form.phone} onChange={this.handleInputChange} disabled={isBusy} placeholder="e.g. 254712345678" style={{ fontSize: '1.1rem' }} />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="font-weight-bolder text-dark">Amount (KES)</label>
                <div className="input-group input-group-lg input-group-solid shadow-none rounded-lg" style={{ border: '1px solid #E4E6EF' }}>
                    <div className="input-group-prepend">
                        <span className="input-group-text bg-transparent border-0 font-weight-bolder text-muted">KES</span>
                    </div>
                    <input type="number" className="form-control bg-transparent border-0 font-weight-bold" name="amount" value={form.amount} onChange={this.handleInputChange} disabled={isBusy} placeholder="Amount to deposit" style={{ fontSize: '1.1rem' }} />
                </div>
              </div>
              
              <StatusDisplay status={status} message={this.state.message} />
            </div>
            
            <div className="modal-footer bg-light border-top-0 px-8 py-5 d-flex justify-content-between">
              <button type="button" className="btn btn-light-danger font-weight-bold px-6" onClick={this.hide} disabled={isBusy} style={{ borderRadius: '8px' }}>Cancel</button>
              
              {!isBusy && status !== 'ERROR' && (
                <button type="button" className="btn font-weight-bolder px-8 shadow-sm" onClick={this.initiatePayment} style={{ backgroundColor: '#43B02A', color: 'white', borderRadius: '8px' }}>
                    {this.props.actionText || "Top Up Now"} <i className="fa fa-arrow-right ml-2 font-size-sm"></i>
                </button>
              )}
              {status === 'ERROR' && (
                <button type="button" className="btn btn-warning font-weight-bolder px-8 shadow-sm" onClick={this.resetState} style={{ borderRadius: '8px' }}>
                    Try Again <i className="fa fa-redo ml-2 font-size-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }
}

export default MpesaPaymentModal;