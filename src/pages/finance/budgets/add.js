import React, { Component } from 'react';
import Data from "../../../utils/data";

class Add extends Component {
    state = {
        title: "",
        amount: "",
        startDate: "",
        endDate: "",
        description: "",
        loading: false
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { title, amount, startDate, endDate, description } = this.state;
        const school = localStorage.getItem('school');

        if (!title || !amount) {
            if(window.toastr) window.toastr.error("Title and Amount are required.");
            return;
        }

        this.setState({ loading: true });
        try {
            await Data.budgets.create({
                title,
                amount: parseFloat(amount),
                startDate,
                endDate,
                description,
                school
            });
            if(window.toastr) window.toastr.success("Budget added successfully!");
            this.props.close();
        } catch (error) {
            console.error(error);
            if(window.toastr) window.toastr.error("Failed to add Budget.");
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { title, amount, startDate, endDate, description, loading } = this.state;
        return (
            <div className="modal-content border-0">
                <div className="modal-header">
                    <h5 className="modal-title">Add Budget</h5>
                    <button type="button" className="close" onClick={this.props.close}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={this.handleSubmit}>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Title *</label>
                            <div className="col-9">
                                <input className="form-control" type="text" name="title" value={title} onChange={this.handleChange} required placeholder="e.g. Q1 Budget" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Amount (KES) *</label>
                            <div className="col-9">
                                <input className="form-control" type="number" name="amount" value={amount} onChange={this.handleChange} required placeholder="e.g. 2000" min="0" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Start Date</label>
                            <div className="col-9">
                                <input className="form-control" type="date" name="startDate" value={startDate} onChange={this.handleChange} />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">End Date</label>
                            <div className="col-9">
                                <input className="form-control" type="date" name="endDate" value={endDate} onChange={this.handleChange} />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Description</label>
                            <div className="col-9">
                                <textarea className="form-control" name="description" value={description} onChange={this.handleChange} rows="3" placeholder="Optional details..." />
                            </div>
                        </div>
                        <div className="kt-portlet__foot mt-4">
                            <div className="kt-form__actions text-right">
                                <button type="button" onClick={this.props.close} className="btn btn-secondary mr-2">Cancel</button>
                                <button type="submit" className={`btn btn-brand ${loading ? 'kt-spinner kt-spinner--right kt-spinner--sm kt-spinner--light' : ''}`} disabled={loading}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}
export default Add;
