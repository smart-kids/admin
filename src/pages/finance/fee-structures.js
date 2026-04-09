import React, { Component } from "react";
import Data from "../../utils/data";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";

class FeeStructuresManagement extends Component {
    state = {
        // Raw Data
        classes: [],
        terms: [],
        feeStructures: [],
        
        // Filters
        selectedClass: "",
        selectedTerm: "",
        
        // UI State
        loading: true,
        showAddModal: false,
        showEditModal: false,
        editingFeeStructure: null,
        
        // Form Data
        formData: {
            feeType: 'TUITION',
            amount: '',
            description: '',
            isRequired: true,
            isActive: true
        },
        
        // Pagination
        currentPage: 1,
        itemsPerPage: 20
    };
    
    componentDidMount() {
        this.loadData();
    }
    
    loadData = async () => {
        try {
            // Load fee structures for selected class/term
            let feeStructures = [];
            if (this.state.selectedClass && this.state.selectedTerm) {
                feeStructures = await Data.feeStructures.findByClass(
                    this.state.selectedClass, 
                    this.state.selectedTerm
                );
            } else {
                feeStructures = Data.feeStructures.list() || [];
            }
            
            this.setState({ 
                feeStructures,
                loading: false 
            });
        } catch (error) {
            console.error("Failed to load fee structures:", error);
            this.setState({ loading: false });
        }
    };
    
    componentWillReceiveProps(nextProps) {
        const { classes, terms } = nextProps;
        if (classes && terms) {
            this.setState({ classes, terms });
        }
    }
    
    handleFilterChange = (key, value) => {
        this.setState({ [key]: value, currentPage: 1 }, this.loadData);
    };
    
    openAddModal = () => {
        this.setState({
            showAddModal: true,
            formData: {
                feeType: 'TUITION',
                amount: '',
                description: '',
                isRequired: true,
                isActive: true
            }
        });
    };
    
    openEditModal = (feeStructure) => {
        this.setState({
            showEditModal: true,
            editingFeeStructure: feeStructure,
            formData: {
                feeType: feeStructure.feeType,
                amount: feeStructure.amount,
                description: feeStructure.description || '',
                isRequired: feeStructure.isRequired,
                isActive: feeStructure.isActive
            }
        });
    };
    
    closeModal = () => {
        this.setState({
            showAddModal: false,
            showEditModal: false,
            editingFeeStructure: null,
            formData: {
                feeType: 'TUITION',
                amount: '',
                description: '',
                isRequired: true,
                isActive: true
            }
        });
    };
    
    handleInputChange = (field, value) => {
        this.setState({
            formData: {
                ...this.state.formData,
                [field]: value
            }
        });
    };
    
    handleSubmit = async () => {
        const { formData, selectedClass, selectedTerm, editingFeeStructure } = this.state;
        const schoolId = localStorage.getItem('school');
        
        if (!selectedClass || !selectedTerm) {
            alert('Please select both class and term');
            return;
        }
        
        if (!formData.feeType || !formData.amount) {
            alert('Please fill in fee type and amount');
            return;
        }
        
        try {
            const feeStructureData = {
                school: schoolId,
                class: selectedClass,
                term: selectedTerm,
                feeType: formData.feeType,
                amount: parseFloat(formData.amount),
                description: formData.description,
                isRequired: formData.isRequired,
                isActive: formData.isActive
            };
            
            if (editingFeeStructure) {
                // Update existing fee structure
                await Data.feeStructures.update({
                    id: editingFeeStructure.id,
                    ...feeStructureData
                });
            } else {
                // Create new fee structure
                await Data.feeStructures.create(feeStructureData);
            }
            
            this.closeModal();
            this.loadData();
        } catch (error) {
            console.error("Failed to save fee structure:", error);
            alert('Failed to save fee structure');
        }
    };
    
    handleDelete = async (feeStructure) => {
        if (!confirm('Are you sure you want to delete this fee structure?')) {
            return;
        }
        
        try {
            await Data.feeStructures.archive({
                id: feeStructure.id
            });
            this.loadData();
        } catch (error) {
            console.error("Failed to delete fee structure:", error);
            alert('Failed to delete fee structure');
        }
    };
    
    bulkCreateForAllClasses = async () => {
        const { classes, selectedTerm, formData } = this.state;
        const schoolId = localStorage.getItem('school');
        
        if (!selectedTerm || !formData.feeType || !formData.amount) {
            alert('Please select term and fill in fee type and amount');
            return;
        }
        
        if (!confirm(`Create ${formData.feeType} fee of ${formData.amount} for ALL classes in ${this.getTermName(selectedTerm)}?`)) {
            return;
        }
        
        try {
            const feeStructuresData = classes.map(cls => ({
                school: schoolId,
                class: cls.id,
                term: selectedTerm,
                feeType: formData.feeType,
                amount: parseFloat(formData.amount),
                description: formData.description || `${formData.feeType} fees for ${cls.name}`,
                isRequired: formData.isRequired,
                isActive: formData.isActive
            }));
            
            await Data.feeStructures.bulkCreate(feeStructuresData);
            this.loadData();
        } catch (error) {
            console.error("Failed to bulk create fee structures:", error);
            alert('Failed to create fee structures');
        }
    };
    
    getTermName = (termId) => {
        const term = this.state.terms.find(t => t.id === termId);
        return term ? term.name : 'Unknown Term';
    };
    
    getClassName = (classId) => {
        const cls = this.state.classes.find(c => c.id === classId);
        return cls ? cls.name : 'Unknown Class';
    };
    
    getFilteredFeeStructures = () => {
        const { feeStructures, selectedClass, selectedTerm } = this.state;
        
        return feeStructures.filter(fs => {
            if (selectedClass && String(fs.class?.id || fs.class) !== String(selectedClass)) {
                return false;
            }
            if (selectedTerm && String(fs.term?.id || fs.term) !== String(selectedTerm)) {
                return false;
            }
            return true;
        });
    };
    
    render() {
        const { 
            classes, 
            terms, 
            selectedClass, 
            selectedTerm, 
            loading, 
            showAddModal, 
            showEditModal, 
            formData,
            currentPage,
            itemsPerPage
        } = this.state;
        
        const filteredFeeStructures = this.getFilteredFeeStructures();
        const totalPages = Math.ceil(filteredFeeStructures.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedFeeStructures = filteredFeeStructures.slice(startIndex, startIndex + itemsPerPage);
        
        const feeTypeOptions = [
            { value: 'TUITION', label: 'Tuition Fees' },
            { value: 'REMEDIAL', label: 'Remedial Classes' },
            { value: 'TRANSPORT', label: 'Transport Fees' },
            { value: 'LUNCH', label: 'Lunch Program' },
            { value: 'ICT', label: 'ICT Integration' },
            { value: 'EXTRAS', label: 'Extra Activities' },
            { value: 'MATERIALS', label: 'Learning Materials' },
            { value: 'OTHER', label: 'Other Fees' }
        ];
        
        return (
            <div className="container-fluid">
                <Navbar />
                <Subheader title="Fee Structures Management" />
                
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Fee Structures</h3>
                        <div className="card-tools">
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={this.openAddModal}
                                disabled={!selectedClass || !selectedTerm}
                            >
                                <i className="fas fa-plus"></i> Add Fee Structure
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {/* Filters */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label>Class:</label>
                                <select 
                                    className="form-control"
                                    value={selectedClass}
                                    onChange={(e) => this.handleFilterChange('selectedClass', e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label>Term:</label>
                                <select 
                                    className="form-control"
                                    value={selectedTerm}
                                    onChange={(e) => this.handleFilterChange('selectedTerm', e.target.value)}
                                >
                                    <option value="">All Terms</option>
                                    {terms.map(term => (
                                        <option key={term.id} value={term.id}>{term.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label>&nbsp;</label>
                                <div>
                                    <button 
                                        className="btn btn-info btn-sm mr-2"
                                        onClick={this.bulkCreateForAllClasses}
                                        disabled={!selectedTerm}
                                    >
                                        <i className="fas fa-copy"></i> Bulk Create for All Classes
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Fee Structures Table */}
                        {loading ? (
                            <div className="text-center py-4">
                                <i className="fas fa-spinner fa-spin"></i> Loading...
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Term</th>
                                            <th>Fee Type</th>
                                            <th>Amount</th>
                                            <th>Description</th>
                                            <th>Required</th>
                                            <th>Active</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedFeeStructures.map(fs => (
                                            <tr key={fs.id}>
                                                <td>{this.getClassName(fs.class?.id || fs.class)}</td>
                                                <td>{this.getTermName(fs.term?.id || fs.term)}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {fs.feeType}
                                                    </span>
                                                </td>
                                                <td>{fs.amount}</td>
                                                <td>{fs.description || '-'}</td>
                                                <td>
                                                    <span className={`badge ${fs.isRequired ? 'badge-success' : 'badge-secondary'}`}>
                                                        {fs.isRequired ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${fs.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                        {fs.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => this.openEditModal(fs)}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => this.handleDelete(fs)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {filteredFeeStructures.length === 0 && (
                                    <div className="text-center py-4 text-muted">
                                        No fee structures found. {selectedClass && selectedTerm ? 'Add your first fee structure.' : 'Select class and term to view fee structures.'}
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
                
                {/* Add/Edit Modal */}
                {(showAddModal || showEditModal) && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {showAddModal ? 'Add Fee Structure' : 'Edit Fee Structure'}
                                    </h5>
                                    <button type="button" className="close" onClick={this.closeModal}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Fee Type:</label>
                                        <select 
                                            className="form-control"
                                            value={formData.feeType}
                                            onChange={(e) => this.handleInputChange('feeType', e.target.value)}
                                        >
                                            {feeTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount:</label>
                                        <input 
                                            type="number"
                                            className="form-control"
                                            value={formData.amount}
                                            onChange={(e) => this.handleInputChange('amount', e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description:</label>
                                        <textarea 
                                            className="form-control"
                                            value={formData.description}
                                            onChange={(e) => this.handleInputChange('description', e.target.value)}
                                            placeholder="Optional description"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-check">
                                        <input 
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={formData.isRequired}
                                            onChange={(e) => this.handleInputChange('isRequired', e.target.checked)}
                                        />
                                        <label className="form-check-label">Required Fee</label>
                                    </div>
                                    <div className="form-check">
                                        <input 
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={formData.isActive}
                                            onChange={(e) => this.handleInputChange('isActive', e.target.checked)}
                                        />
                                        <label className="form-check-label">Active</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={this.closeModal}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                                        {showAddModal ? 'Add' : 'Update'}
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

export default FeeStructuresManagement;
