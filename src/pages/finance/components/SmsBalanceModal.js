import React, { useState } from 'react';

const SmsBalanceModal = ({ show, onClose, onSend, group, onInsufficientBalance, school }) => {
    const getBreakdownText = () => {
        if (!group) return "";
        const classFees = (group.totalExpected || 0) - (group.totalCharges || 0);
        let text = ` Breakdown: Class Fees KES ${classFees.toLocaleString()}.`;
        
        if (group.charges && group.charges.length > 0) {
            const chargesStr = group.charges.map(c => {
                const name = c.chargeType?.name || c.reason || 'Charge';
                return `${name} KES ${parseFloat(c.amount).toLocaleString()}`;
            }).join(', ');
            text += ` Charges: ${chargesStr}.`;
        }
        return text;
    };

    const getRecentPaymentsText = () => {
        if (!group?.history || group.history.length === 0) return "";
        
        const recent = group.history.slice(0, 3);
        const paymentsStr = recent.map(p => {
            const date = new Date(p.time || p.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            return `${date}: KES ${parseFloat(p.amount).toLocaleString()}`;
        }).join(', ');
        
        return ` Payments: ${paymentsStr}. Total Paid: KES ${group.totalPaid.toLocaleString()}.`;
    };

    const defaultTemplate = `Dear Parent, balance for ${group?.students?.map(s => s.names.split(' ')[0]).join(', ')} is KES ${group?.totalBalance?.toLocaleString()}.${getBreakdownText()}${getRecentPaymentsText()} Bal: KES ${group?.totalBalance?.toLocaleString()}.`;
    const [message, setMessage] = useState(defaultTemplate);
    const [isSending, setIsSending] = useState(false);

    if (!show || !group) return null;

    const handleSend = async () => {
        // Check SMS balance before sending
        const smsBalance = school?.financial?.balance || 0;
        const smsCost = 1; // 1 SMS per message
        
        if (smsBalance < smsCost) {
            if (onInsufficientBalance) {
                onInsufficientBalance();
            }
            return;
        }

        setIsSending(true);
        await onSend(message);
        setIsSending(false);
        onClose();
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Send SMS to Parent</h5>
                        <button type="button" className="close" onClick={onClose} disabled={isSending}>
                            <span>&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="alert alert-custom alert-light-info py-2 px-3 mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="font-weight-bold">SMS Balance:</span>
                                <span className="font-weight-bolder text-primary">
                                    {school?.financial?.balanceFormated || `${school?.financial?.balance || 0} SMS`}
                                </span>
                            </div>
                            <small className="form-text text-muted mt-1">
                                This message will cost 1 SMS credit
                            </small>
                        </div>
                        <div className="form-group mb-4">
                            <label className="font-weight-bold">Parent</label>
                            <input className="form-control" type="text" value={`${group.parent.name} (${group.parent.phone})`} disabled />
                        </div>
                        <div className="form-group">
                            <label className="font-weight-bold">Message Content</label>
                            <textarea 
                                className="form-control" 
                                rows="4" 
                                value={message} 
                                onChange={e => setMessage(e.target.value)}
                            />
                            <small className="form-text text-muted mt-2">
                                You can edit the message above before sending. Ensure your SMS balance is sufficient.
                            </small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSending}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={isSending}>
                            {isSending ? <span className="spinner-border spinner-border-sm mr-2"></span> : <i className="fa fa-paper-plane mr-2"></i>}
                            Send Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmsBalanceModal;
