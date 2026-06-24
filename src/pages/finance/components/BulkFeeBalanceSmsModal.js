import React, { useState, useMemo, useEffect } from 'react';
import Handlebars from 'handlebars';
import Data from '../../../utils/data';
import MpesaPaymentModal from '../deposit';

// --- HANDLEBARS HELPERS ---
Handlebars.registerHelper("fallback", (value, fallback) => {
    return value ? new Handlebars.SafeString(value) : fallback;
});

Handlebars.registerHelper("toLocaleString", (value) => {
    return (parseFloat(value) || 0).toLocaleString();
});

/**
 * BulkFeeBalanceSmsModal
 * 
 * A bulk SMS modal for finance fee balances with:
 * - Template editing (like /comms UI)
 * - Message preview left-right layout
 * - Template input on right, messages on left
 * 
 * Props:
 * - show: boolean
 * - onClose: function
 * - recipients: Array<{ id, parentId, name, phone, studentNames, students, totalBalance, totalExpected, totalPaid, charges, history, parent }>
 * - onSend: function(finalMessages)
 * - onSavePhone: optional function(parentId, newPhone) => Promise
 */

const BulkFeeBalanceSmsModal = ({ show, onClose, recipients = [], onSend, onSavePhone }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [edits, setEdits] = useState({});         // { id: overrideMessage }
    const [phoneEdits, setPhoneEdits] = useState({}); // { id: phone }
    const [savingPhone, setSavingPhone] = useState(null); // id of recipient being saved
    const [schoolBalance, setSchoolBalance] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set()); // Set of selected recipient IDs
    
    // Template state
    const [messageTemplate, setMessageTemplate] = useState(`--- FEE STATEMENT ---\nParent: {{parent.name}}\nPeriod: {{term.name}}\n\n{{#each students}}\n{{names}}:\n  Expected: KES {{toLocaleString finances.expected}}\n  Paid: KES {{toLocaleString finances.paid}}\n  Balance: KES {{toLocaleString finances.balance}}\n{{/each}}\n\n{{#if charges}}\nAdditional Charges:\n{{#each charges}}\n  {{chargeType.name}}: KES {{toLocaleString amount}}\n{{/each}}\n{{/if}}\n\nTotal Balance: KES {{toLocaleString totalBalance}}\nPlease clear your balance. Contact the school for inquiries.`);

    useEffect(() => {
        const unsub = Data.schools.subscribe(({ selectedSchool }) => {
            if (selectedSchool) {
                setSchoolName(selectedSchool.name || '');
                if (selectedSchool.financial) {
                    setSchoolBalance(selectedSchool.financial.balance || 0);
                }
            }
        });
        return () => unsub();
    }, []);

    // Reset selection when modal opens
    useEffect(() => {
        if (show) {
            setSelectedIndex(0);
            setSearchTerm('');
            setEdits({});
            setPhoneEdits({});
            setSelectedIds(new Set());
        }
    }, [show]);

    const filteredRecipients = useMemo(() => {
        if (!searchTerm) return recipients;
        const lower = searchTerm.toLowerCase();
        return recipients.filter(r =>
            r.name.toLowerCase().includes(lower) ||
            (r.studentNames && r.studentNames.toLowerCase().includes(lower)) ||
            (r.phone && r.phone.includes(searchTerm))
        );
    }, [recipients, searchTerm]);

    // Selection handlers
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allIds = filteredRecipients.map(r => r.id);
        setSelectedIds(new Set(allIds));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const isAllSelected = filteredRecipients.length > 0 && filteredRecipients.every(r => selectedIds.has(r.id));
    const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

    const activeRecipient = filteredRecipients[selectedIndex] || filteredRecipients[0];

    const getPhone = (recipient) => {
        if (phoneEdits[recipient.id] !== undefined) return phoneEdits[recipient.id];
        return recipient.phone || '';
    };

    const getMessage = (recipient) => {
        // If user has edited this specific message, use that
        if (edits[recipient.id] !== undefined) return edits[recipient.id];
        
        // Otherwise, generate from template
        try {
            const template = Handlebars.compile(messageTemplate);
            const context = {
                parent: recipient.parent || recipient,
                students: recipient.students || [],
                totalBalance: recipient.totalBalance || 0,
                totalExpected: recipient.totalExpected || 0,
                totalPaid: recipient.totalPaid || 0,
                charges: recipient.charges || [],
                history: recipient.history || [],
                term: { name: recipient.termName || 'Current Term' },
                school: { name: schoolName }
            };
            return template(context);
        } catch (e) {
            console.error('Template compilation error:', e);
            return 'Error generating message from template';
        }
    };

    const handleMessageChange = (id, newMessage) => {
        setEdits(prev => ({ ...prev, [id]: newMessage }));
    };

    const handlePhoneChange = (id, newPhone) => {
        setPhoneEdits(prev => ({ ...prev, [id]: newPhone }));
    };

    const handleSavePhone = async (recipient) => {
        const newPhone = getPhone(recipient);
        if (!onSavePhone || !newPhone) return;
        setSavingPhone(recipient.id);
        try {
            await onSavePhone(recipient.parentId || recipient.id, newPhone);
            if (window.toastr) window.toastr.success('Phone number saved!');
        } catch (e) {
            console.error(e);
            if (window.toastr) window.toastr.error('Failed to save phone number.');
        } finally {
            setSavingPhone(null);
        }
    };

    const handleTemplateChange = (newTemplate) => {
        setMessageTemplate(newTemplate);
        // Clear all individual edits when template changes
        setEdits({});
    };

    const COST_PER_SMS = 2.0;
    const CHARS_PER_SEGMENT = 160;

    // Only count selected recipients that have a phone for cost/sending
    const selectedRecipients = recipients.filter(r => selectedIds.has(r.id));
    const sendableRecipients = selectedRecipients.filter(r => getPhone(r));

    const campaignStats = useMemo(() => {
        let totalSegments = 0;
        sendableRecipients.forEach(r => {
            const msg = getMessage(r);
            const segments = Math.ceil((msg.length || 1) / CHARS_PER_SEGMENT);
            totalSegments += segments;
        });
        const totalCost = totalSegments * COST_PER_SMS;
        return { totalSegments, totalCost };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRecipients, edits, phoneEdits, messageTemplate]);

    const handleConfirmSend = async () => {
        const parentIds = sendableRecipients.map(r => r.parentId || r.id);

        setIsSending(true);
        try {
            await onSend({
                template: messageTemplate,
                parentIds: parentIds
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    if (!show) return null;

    const missingPhoneCount = selectedRecipients.filter(r => !getPhone(r)).length;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', height: '90vh', display: 'flex', flexDirection: 'column' }}>

                    {/* Header */}
                    <div className="modal-header bg-white px-8 py-5 border-bottom flex-shrink-0">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <div className="symbol symbol-40 symbol-light-primary mr-4">
                                    <span className="symbol-label"><i className="flaticon2-sms text-primary"></i></span>
                                </div>
                                <div>
                                    <h5 className="modal-title font-weight-bolder text-dark">Bulk Fee Balance SMS</h5>
                                    <span className="text-muted font-weight-bold font-size-sm">
                                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${recipients.length} recipients`}
                                        {missingPhoneCount > 0 && selectedIds.size > 0 && (
                                            <span className="text-warning ml-2">
                                                <i className="flaticon-warning text-warning mr-1"></i>
                                                {missingPhoneCount} missing phone
                                            </span>
                                        )}
                                        {selectedIds.size === 0 && (
                                            <span className="text-warning ml-2">
                                                <i className="flaticon-warning text-warning mr-1"></i>
                                                No recipients selected
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <button type="button" className="close" onClick={onClose}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-0 d-flex overflow-hidden flex-grow-1" style={{ minHeight: 0 }}>

                        {/* Left Panel: Recipients List */}
                        <div style={{ width: '350px', flexShrink: 0 }} className="bg-light border-right h-100 d-flex flex-column">
                            <div className="p-4 bg-white border-bottom">
                                <div className="input-icon input-icon-right mb-3">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm border-0 bg-light"
                                        placeholder="Search parent/student..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <span><i className="flaticon2-search-1 icon-sm text-muted"></i></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted font-size-xs font-weight-bold">
                                        {selectedIds.size} of {filteredRecipients.length} selected
                                    </span>
                                    <div className="d-flex gap-1">
                                        {isAllSelected ? (
                                            <button
                                                className="btn btn-xs btn-light-primary font-weight-bold"
                                                onClick={handleDeselectAll}
                                            >
                                                Deselect All
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-xs btn-light-primary font-weight-bold"
                                                onClick={handleSelectAll}
                                                disabled={filteredRecipients.length === 0}
                                            >
                                                Select All
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow-1 overflow-auto custom-scroll">
                                {filteredRecipients.map((r, idx) => {
                                    const hasPhone = !!getPhone(r);
                                    const isActive = activeRecipient?.id === r.id;
                                    const isSelected = selectedIds.has(r.id);
                                    return (
                                        <div
                                            key={r.id}
                                            className={`px-5 py-4 border-bottom cursor-pointer ${isActive ? 'bg-white shadow-sm' : 'hover-bg-white'}`}
                                            style={{ borderLeft: isActive ? '4px solid #3699ff' : '4px solid transparent' }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center" style={{ minWidth: 0, flex: 1 }} onClick={() => setSelectedIndex(idx)}>
                                                    <div className="checkbox checkbox-inline mr-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleSelect(r.id);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                            <span></span>
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="font-weight-bolder text-dark-75 text-truncate" style={{ fontSize: '0.9rem' }}>{r.name}</div>
                                                        <div className="text-muted font-size-xs text-truncate">{r.studentNames}</div>
                                                        {!hasPhone ? (
                                                            <span className="label label-xs label-light-danger label-inline mt-1">
                                                                <i className="flaticon-warning icon-xs mr-1"></i> No Phone
                                                            </span>
                                                        ) : (
                                                            <div className="text-muted font-size-xs">{getPhone(r)}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {edits[r.id] !== undefined && (
                                                    <span className="label label-xs label-light-warning label-inline ml-2">Edited</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredRecipients.length === 0 && (
                                    <div className="p-8 text-center text-muted small">No recipients found</div>
                                )}
                            </div>
                        </div>

                        {/* Middle Panel: Template Editor */}
                        <div style={{ width: '400px', flexShrink: 0 }} className="bg-white border-right h-100 d-flex flex-column">
                            <div className="p-4 border-bottom">
                                <h6 className="font-weight-bolder text-dark mb-3">Message Template</h6>
                                <div className="mb-3">
                                    <span className="text-muted font-size-xs font-weight-bold text-uppercase mr-2">Variables:</span>
                                    <div className="d-flex flex-wrap gap-1 mt-2">
                                        <span className="badge badge-light-primary badge-pill cursor-pointer" style={{ fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => {
                                            const textarea = document.getElementById('template-textarea');
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const text = textarea.value;
                                            const newText = text.substring(0, start) + '{{parent.name}}' + text.substring(end);
                                            setMessageTemplate(newText);
                                        }}>{'{{parent.name}}'}</span>
                                        <span className="badge badge-light-primary badge-pill cursor-pointer" style={{ fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => {
                                            const textarea = document.getElementById('template-textarea');
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const text = textarea.value;
                                            const newText = text.substring(0, start) + '{{totalBalance}}' + text.substring(end);
                                            setMessageTemplate(newText);
                                        }}>{'{{totalBalance}}'}</span>
                                        <span className="badge badge-light-primary badge-pill cursor-pointer" style={{ fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => {
                                            const textarea = document.getElementById('template-textarea');
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const text = textarea.value;
                                            const newText = text.substring(0, start) + '{{term.name}}' + text.substring(end);
                                            setMessageTemplate(newText);
                                        }}>{'{{term.name}}'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow-1 p-4 d-flex flex-column">
                                <textarea
                                    id="template-textarea"
                                    className="form-control border-0 bg-light p-4 flex-grow-1"
                                    style={{ resize: 'none', borderRadius: '12px', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
                                    value={messageTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    placeholder="Enter message template..."
                                ></textarea>
                                <div className="mt-3 text-muted font-size-xs">
                                    <i className="flaticon-info text-primary mr-1"></i>
                                    Use Handlebars syntax for dynamic variables. Changes apply to all recipients.
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Message Preview */}
                        <div className="flex-grow-1 h-100 d-flex flex-column bg-light overflow-auto" style={{ padding: '24px', minWidth: 0 }}>
                            {activeRecipient ? (
                                <>
                                    {/* Recipient Info & Phone Edit */}
                                    <div className="bg-white rounded p-4 mb-4 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h4 className="font-weight-bolder text-dark mb-1">{activeRecipient.name}</h4>
                                                <div className="text-muted font-size-sm">{activeRecipient.studentNames}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-muted font-size-xs mb-1">Balance</div>
                                                <div className="font-weight-bolder h4 m-0 text-danger">KES {(activeRecipient.totalBalance || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <label className="font-weight-bold text-muted small text-uppercase mb-0 mr-3">Phone:</label>
                                            <input
                                                type="tel"
                                                className={`form-control form-control-sm mr-3 ${!getPhone(activeRecipient) ? 'border-danger' : 'border-success'}`}
                                                style={{ maxWidth: '180px', borderWidth: '2px' }}
                                                value={getPhone(activeRecipient)}
                                                onChange={e => handlePhoneChange(activeRecipient.id, e.target.value)}
                                                placeholder="e.g. 0712345678"
                                            />
                                            {(phoneEdits[activeRecipient.id] !== undefined || !activeRecipient.phone) && (
                                                <button
                                                    className={`btn btn-sm btn-primary font-weight-bold ${savingPhone === activeRecipient.id ? 'spinner spinner-white spinner-right' : ''}`}
                                                    disabled={savingPhone === activeRecipient.id || !getPhone(activeRecipient)}
                                                    onClick={() => handleSavePhone(activeRecipient)}
                                                >
                                                    Save
                                                </button>
                                            )}
                                            {getPhone(activeRecipient) && !phoneEdits[activeRecipient.id] && (
                                                <span className="text-success font-weight-bold ml-2 font-size-sm">
                                                    <i className="flaticon2-check-mark text-success mr-1"></i>Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Preview */}
                                    <div className="bg-white rounded p-4 shadow-sm flex-grow-1 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="font-weight-bolder text-dark mb-0">Message Preview</h6>
                                            <div className="text-right">
                                                <div className="text-muted font-size-xs mb-1">Characters</div>
                                                <div className="font-weight-bolder">{getMessage(activeRecipient).length}</div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 bg-light rounded p-4 overflow-auto" style={{ minHeight: '200px', maxHeight: '400px' }}>
                                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                                                {getMessage(activeRecipient)}
                                            </pre>
                                        </div>
                                        <div className="mt-3 d-flex align-items-center justify-content-between">
                                            <span className="text-muted font-size-sm">
                                                <i className="flaticon-info text-primary mr-1"></i>
                                                {Math.ceil(getMessage(activeRecipient).length / 160)} SMS segment(s)
                                            </span>
                                            {edits[activeRecipient.id] !== undefined && (
                                                <button
                                                    className="btn btn-xs btn-text-warning hover-btn-warning font-weight-bold"
                                                    onClick={() => {
                                                        const newEdits = { ...edits };
                                                        delete newEdits[activeRecipient.id];
                                                        setEdits(newEdits);
                                                    }}
                                                >Reset to Template</button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                    <i className="flaticon2-group icon-4x opacity-20 mb-4"></i>
                                    <p>Select a recipient from the sidebar</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer bg-light px-8 py-4 border-top d-flex justify-content-between align-items-center flex-shrink-0">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="d-flex flex-column mr-6">
                                <span className="text-muted font-size-sm font-weight-bold">Selected</span>
                                <span className="font-weight-bolder font-size-h6">{selectedIds.size}</span>
                            </div>
                            <div className="d-flex flex-column mr-6">
                                <span className="text-muted font-size-sm font-weight-bold">Will Send</span>
                                <span className="font-weight-bolder font-size-h6 text-success">{sendableRecipients.length}</span>
                            </div>
                            <div className="d-flex flex-column mr-6">
                                <span className="text-muted font-size-sm font-weight-bold">SMS Segments</span>
                                <span className="font-weight-bolder font-size-h6">{campaignStats.totalSegments}</span>
                            </div>
                            <div className="d-flex flex-column mr-6">
                                <span className="text-muted font-size-sm font-weight-bold">Est. Cost</span>
                                <span className="font-weight-bolder font-size-h6 text-primary">KES {campaignStats.totalCost.toFixed(2)}</span>
                            </div>
                            <div className={`d-flex flex-column px-3 py-1 rounded ${schoolBalance < campaignStats.totalCost ? 'bg-light-danger' : 'bg-light-success'}`}>
                                <span className={`${schoolBalance < campaignStats.totalCost ? 'text-danger' : 'text-success'} font-size-sm font-weight-bold`}>Balance</span>
                                <span className={`font-weight-bolder font-size-sm ${schoolBalance < campaignStats.totalCost ? 'text-danger' : 'text-success'}`}>KES {schoolBalance.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <button type="button" className="btn btn-light-danger font-weight-bold mr-3" onClick={onClose} disabled={isSending}>Cancel</button>
                            {schoolBalance < campaignStats.totalCost && schoolBalance >= 0 ? (
                                <button
                                    type="button"
                                    className="btn btn-danger font-weight-bold px-8"
                                    disabled
                                    title={`Balance KES ${schoolBalance.toFixed(2)} is less than estimated cost KES ${campaignStats.totalCost.toFixed(2)}`}
                                >
                                    <i className="fa fa-exclamation-triangle mr-2"></i>
                                    Insufficient Balance
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={`btn btn-primary font-weight-bold px-8 ${isSending ? 'spinner spinner-white spinner-right' : ''}`}
                                    onClick={handleConfirmSend}
                                    disabled={isSending || sendableRecipients.length === 0 || selectedIds.size === 0}
                                >
                                    {isSending ? 'Sending...' : `Send to ${sendableRecipients.length} Parent${sendableRecipients.length !== 1 ? 's' : ''}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #e4e6ef; border-radius: 4px; }
                .hover-bg-white:hover { background: #ffffff !important; }
            `}</style>
        </div>
    );
};

export default BulkFeeBalanceSmsModal;
