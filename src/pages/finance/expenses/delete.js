import React, { Component } from 'react';
import Data from "../../../utils/data";

class Delete extends Component {
    state = { loading: false };

    handleDelete = async () => {
        this.setState({ loading: true });
        try {
            await Data.expenses.delete(this.props.item);
            if(window.toastr) window.toastr.success("Expense deleted successfully!");
            this.props.close();
        } catch (error) {
            console.error(error);
            if(window.toastr) window.toastr.error("Failed to delete Expense.");
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { item, close } = this.props;
        const { loading } = this.state;
        return (
            <div className="modal-content border-0">
                <div className="modal-header bg-danger">
                    <h5 className="modal-title font-weight-bolder text-white">Delete Expense</h5>
                    <button type="button" className="close" onClick={close}>
                        <span aria-hidden="true" className="text-white">&times;</span>
                    </button>
                </div>
                <div className="modal-body text-center py-5">
                    <i className="flaticon-warning text-danger" style={{ fontSize: '3rem' }}></i>
                    <h5 className="mt-4 mb-2">Are you sure?</h5>
                    <p className="text-muted">
                        You are about to delete the <strong>{item.name}</strong> expense. This action cannot be undone.
                    </p>
                </div>
                <div className="modal-footer bg-light justify-content-center">
                    <button type="button" className="btn btn-light-dark font-weight-bold mx-2" onClick={close}>Cancel</button>
                    <button 
                        type="button" 
                        className={`btn btn-danger font-weight-bold mx-2 ${loading ? 'kt-spinner kt-spinner--right kt-spinner--sm kt-spinner--light' : ''}`} 
                        onClick={this.handleDelete}
                        disabled={loading}
                    >
                        Yes, Delete!
                    </button>
                </div>
            </div>
        );
    }
}

export default Delete;
