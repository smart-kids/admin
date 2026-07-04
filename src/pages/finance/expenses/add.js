import React, { Component } from 'react';
import Data from "../../../utils/data";

class Add extends Component {
    state = {
        title: "",
        amount: "",
        date: "",
        category: "",
        budget: "",
        description: "",
        receiptImage: null,
        loading: false,
        budgets: []
    };

    componentDidMount() {
        this.fetchBudgets();
    }

    fetchBudgets = async () => {
        try {
            const data = await Data.budgets.list();
            this.setState({ budgets: data });
        } catch (error) {
            console.error("Failed to fetch budgets", error);
        }
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleFileChange = (e) => {
        this.setState({ receiptImage: e.target.files[0] });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { title, amount, date, category, budget, description, receiptImage } = this.state;
        const school = localStorage.getItem('school');

        if (!title || !amount) {
            if(window.toastr) window.toastr.error("Title and Amount are required.");
            return;
        }

        this.setState({ loading: true });
        try {
            let receiptImageUrl = null;
            if (receiptImage) {
                const formData = new FormData();
                formData.append("file", receiptImage);
                const uploadRes = await fetch("https://graph-ongyy.kinsta.app/upload", {
                    method: "POST",
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData && uploadData.url) {
                    receiptImageUrl = uploadData.url;
                }
            }

            await Data.expenses.create({
                title,
                amount: parseFloat(amount),
                date,
                category,
                budget: budget || undefined,
                description,
                receiptImage: receiptImageUrl,
                school
            });
            if(window.toastr) window.toastr.success("Expense added successfully!");
            this.props.close();
        } catch (error) {
            console.error(error);
            if(window.toastr) window.toastr.error("Failed to add Expense.");
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { title, amount, date, category, budget, description, loading, budgets } = this.state;
        return (
            <div className="modal-content border-0">
                <div className="modal-header">
                    <h5 className="modal-title">Add Expense</h5>
                    <button type="button" className="close" onClick={this.props.close}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={this.handleSubmit}>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Title *</label>
                            <div className="col-9">
                                <input className="form-control" type="text" name="title" value={title} onChange={this.handleChange} required placeholder="e.g. Office Supplies" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Amount (KES) *</label>
                            <div className="col-9">
                                <input className="form-control" type="number" name="amount" value={amount} onChange={this.handleChange} required placeholder="e.g. 2000" min="0" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Date</label>
                            <div className="col-9">
                                <input className="form-control" type="date" name="date" value={date} onChange={this.handleChange} />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Category</label>
                            <div className="col-9">
                                <input className="form-control" type="text" name="category" value={category} onChange={this.handleChange} placeholder="e.g. Supplies" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Budget</label>
                            <div className="col-9">
                                <select className="form-control" name="budget" value={budget} onChange={this.handleChange}>
                                    <option value="">None</option>
                                    {budgets.map(b => (
                                        <option key={b.id} value={b.id}>{b.title} (Max: {b.amount})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="col-3 col-form-label">Receipt Image</label>
                            <div className="col-9">
                                <input className="form-control-file" type="file" accept="image/*" name="receiptImage" onChange={this.handleFileChange} />
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
