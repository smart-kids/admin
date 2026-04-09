import React, { Component } from "react";
import Data from "../../utils/data";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";

class ClassFeeCalculator extends Component {
    state = {
        // Raw Data
        classes: [],
        terms: [],
        feeStructures: [],
        students: [],
        
        // Filters
        selectedClass: "",
        selectedTerm: "",
        
        // Calculation Results
        calculationResults: null,
        loading: false,
        
        // UI State
        showBreakdown: true
    };
    
    componentDidMount() {
        this.loadData();
    }
    
    loadData = () => {
        // Load data from Data subscriptions
        this.setState({
            classes: Data.classes.list() || [],
            terms: Data.terms.list() || [],
            feeStructures: Data.feeStructures.list() || [],
            students: Data.students.list() || []
        });
    };
    
    handleFilterChange = (key, value) => {
        this.setState({ [key]: value, calculationResults: null });
    };
    
    calculateClassFees = async () => {
        const { selectedClass, selectedTerm } = this.state;
        
        if (!selectedClass || !selectedTerm) {
            alert('Please select both class and term');
            return;
        }
        
        this.setState({ loading: true });
        
        try {
            // Get fee structures for this class and term
            const classFeeStructures = await Data.feeStructures.findByClass(selectedClass, selectedTerm);
            
            // Get students in this class
            const classStudents = this.state.students.filter(student => 
                String(student.class?.id || student.class) === String(selectedClass)
            );
            
            // Calculate fees
            const feeBreakdown = {};
            let totalFeesPerStudent = 0;
            
            classFeeStructures.forEach(fs => {
                if (!feeBreakdown[fs.feeType]) {
                    feeBreakdown[fs.feeType] = {
                        amount: 0,
                        description: fs.description || '',
                        isRequired: fs.isRequired,
                        isActive: fs.isActive
                    };
                }
                feeBreakdown[fs.feeType].amount += parseFloat(fs.amount || 0);
                totalFeesPerStudent += parseFloat(fs.amount || 0);
            });
            
            // Calculate totals
            const totalClassFees = totalFeesPerStudent * classStudents.length;
            const requiredFeesPerStudent = classFeeStructures
                .filter(fs => fs.isRequired && fs.isActive)
                .reduce((sum, fs) => sum + parseFloat(fs.amount || 0), 0);
            
            const optionalFeesPerStudent = classFeeStructures
                .filter(fs => !fs.isRequired && fs.isActive)
                .reduce((sum, fs) => sum + parseFloat(fs.amount || 0), 0);
            
            const results = {
                className: this.getClassName(selectedClass),
                termName: this.getTermName(selectedTerm),
                studentCount: classStudents.length,
                feeStructures: classFeeStructures,
                feeBreakdown,
                totalFeesPerStudent,
                requiredFeesPerStudent,
                optionalFeesPerStudent,
                totalClassFees,
                students: classStudents.map(student => ({
                    name: student.names,
                    parentName: student.parent?.name || 'No Parent',
                    parentPhone: student.parent?.phone || 'No Phone',
                    totalFees: totalFeesPerStudent,
                    requiredFees: requiredFeesPerStudent,
                    optionalFees: optionalFeesPerStudent
                }))
            };
            
            this.setState({ calculationResults: results, loading: false });
            
        } catch (error) {
            console.error("Failed to calculate class fees:", error);
            alert('Failed to calculate class fees');
            this.setState({ loading: false });
        }
    };
    
    getClassName = (classId) => {
        const cls = this.state.classes.find(c => c.id === classId);
        return cls ? cls.name : 'Unknown Class';
    };
    
    getTermName = (termId) => {
        const term = this.state.terms.find(t => t.id === termId);
        return term ? term.name : 'Unknown Term';
    };
    
    exportToCSV = () => {
        const { calculationResults } = this.state;
        
        if (!calculationResults) return;
        
        let csv = 'Student Name,Parent Name,Parent Phone,Total Fees,Required Fees,Optional Fees\n';
        
        calculationResults.students.forEach(student => {
            csv += `"${student.name}","${student.parentName}","${student.parentPhone}",${student.totalFees},${student.requiredFees},${student.optionalFees}\n`;
        });
        
        // Add summary row
        csv += `\nSUMMARY,,,,${calculationResults.totalClassFees},${calculationResults.requiredFeesPerStudent * calculationResults.studentCount},${calculationResults.optionalFeesPerStudent * calculationResults.studentCount}\n`;
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `class-fees-${calculationResults.className.replace(/\s+/g, '-')}-${calculationResults.termName.replace(/\s+/g, '-')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    
    sendBulkSMS = () => {
        const { calculationResults } = this.state;
        
        if (!calculationResults) return;
        
        // Navigate to SMS page with pre-filled data
        const phoneNumbers = calculationResults.students
            .filter(student => student.parentPhone && student.parentPhone !== 'No Phone')
            .map(student => student.parentPhone);
        
        const message = `Dear Parent,\n\nFee breakdown for ${calculationResults.className} - ${calculationResults.termName}:\n`;
        
        Object.entries(calculationResults.feeBreakdown).forEach(([feeType, details]) => {
            message += `- ${feeType}: KES ${details.amount}\n`;
        });
        
        message += `\nTotal Fees: KES ${calculationResults.totalFeesPerStudent}\n\nPlease make payment to the school office.\n\nThank you`;
        
        // Store in localStorage for SMS page to pick up
        localStorage.setItem('bulkSmsRecipients', JSON.stringify(phoneNumbers));
        localStorage.setItem('bulkSmsMessage', message);
        
        // Navigate to SMS page
        window.location.href = '/communication/sms';
    };
    
    render() {
        const { 
            classes, 
            terms, 
            selectedClass, 
            selectedTerm, 
            calculationResults, 
            loading,
            showBreakdown
        } = this.state;
        
        return (
            <div className="container-fluid">
                <Navbar />
                <Subheader title="Class Fee Calculator" />
                
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Calculate Fees for Entire Class</h3>
                    </div>
                    
                    <div className="card-body">
                        {/* Filters */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label>Select Class:</label>
                                <select 
                                    className="form-control"
                                    value={selectedClass}
                                    onChange={(e) => this.handleFilterChange('selectedClass', e.target.value)}
                                >
                                    <option value="">Choose Class...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label>Select Term:</label>
                                <select 
                                    className="form-control"
                                    value={selectedTerm}
                                    onChange={(e) => this.handleFilterChange('selectedTerm', e.target.value)}
                                >
                                    <option value="">Choose Term...</option>
                                    {terms.map(term => (
                                        <option key={term.id} value={term.id}>{term.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label>&nbsp;</label>
                                <div>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={this.calculateClassFees}
                                        disabled={!selectedClass || !selectedTerm || loading}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Calculating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-calculator"></i> Calculate Fees
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Results */}
                        {calculationResults && (
                            <div className="mt-4">
                                {/* Summary Cards */}
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="card bg-primary text-white">
                                            <div className="card-body">
                                                <h5 className="card-title">Total Students</h5>
                                                <h3>{calculationResults.studentCount}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card bg-success text-white">
                                            <div className="card-body">
                                                <h5 className="card-title">Fees Per Student</h5>
                                                <h3>KES {calculationResults.totalFeesPerStudent.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card bg-info text-white">
                                            <div className="card-body">
                                                <h5 className="card-title">Required Fees</h5>
                                                <h3>KES {calculationResults.requiredFeesPerStudent.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card bg-warning text-white">
                                            <div className="card-body">
                                                <h5 className="card-title">Total Class Fees</h5>
                                                <h3>KES {calculationResults.totalClassFees.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Fee Breakdown */}
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title">Fee Breakdown Per Student</h5>
                                        <div className="card-tools">
                                            <button 
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => this.setState({ showBreakdown: !showBreakdown })}
                                            >
                                                <i className={`fas fa-chevron-${showBreakdown ? 'up' : 'down'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    {showBreakdown && (
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Fee Type</th>
                                                            <th>Amount</th>
                                                            <th>Description</th>
                                                            <th>Required</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(calculationResults.feeBreakdown).map(([feeType, details]) => (
                                                            <tr key={feeType}>
                                                                <td>
                                                                    <span className="badge badge-info">{feeType}</span>
                                                                </td>
                                                                <td>KES {details.amount.toLocaleString()}</td>
                                                                <td>{details.description || '-'}</td>
                                                                <td>
                                                                    <span className={`badge ${details.isRequired ? 'badge-success' : 'badge-secondary'}`}>
                                                                        {details.isRequired ? 'Yes' : 'No'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${details.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                                        {details.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="font-weight-bold">
                                                            <td>Total</td>
                                                            <td>KES {calculationResults.totalFeesPerStudent.toLocaleString()}</td>
                                                            <td>-</td>
                                                            <td>-</td>
                                                            <td>-</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Student List */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title">Student Fee Details</h5>
                                        <div className="card-tools">
                                            <button 
                                                className="btn btn-sm btn-success mr-2"
                                                onClick={this.exportToCSV}
                                            >
                                                <i className="fas fa-download"></i> Export CSV
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-info"
                                                onClick={this.sendBulkSMS}
                                            >
                                                <i className="fas fa-sms"></i> Send SMS
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Student Name</th>
                                                        <th>Parent Name</th>
                                                        <th>Parent Phone</th>
                                                        <th>Total Fees</th>
                                                        <th>Required Fees</th>
                                                        <th>Optional Fees</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {calculationResults.students.map((student, index) => (
                                                        <tr key={index}>
                                                            <td>{student.name}</td>
                                                            <td>{student.parentName}</td>
                                                            <td>{student.parentPhone}</td>
                                                            <td className="font-weight-bold">KES {student.totalFees.toLocaleString()}</td>
                                                            <td>KES {student.requiredFees.toLocaleString()}</td>
                                                            <td>KES {student.optionalFees.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default ClassFeeCalculator;
