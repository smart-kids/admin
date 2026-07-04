import React, { Component } from 'react';
import Data from "../../../utils/data";
import { Modal } from "react-bootstrap";
import Add from "./add";
import Edit from "./edit";
import Delete from "./delete";

class List extends Component {
    state = {
        data: [],
        showAddModal: false,
        showEditModal: false,
        showDeleteModal: false,
        activeItem: null
    };

    componentDidMount() {
        this.unsubscribe = Data.expenses.subscribe(this.handleDataUpdate);
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    handleDataUpdate = (data) => {
        this.setState({ data: data.expenses || [] });
    };

    toggleAddModal = () => {
        this.setState(prevState => ({ showAddModal: !prevState.showAddModal }));
    };

    openEditModal = (item) => {
        this.setState({ activeItem: item, showEditModal: true });
    };

    closeEditModal = () => {
        this.setState({ activeItem: null, showEditModal: false });
    };

    openDeleteModal = (item) => {
        this.setState({ activeItem: item, showDeleteModal: true });
    };

    closeDeleteModal = () => {
        this.setState({ activeItem: null, showDeleteModal: false });
    };

    render() {
        const { data, showAddModal, showEditModal, showDeleteModal, activeItem } = this.state;

        return (
            <div className="kt-portlet kt-portlet--mobile">
                <div className="kt-portlet__head kt-portlet__head--lg">
                    <div className="kt-portlet__head-label">
                        <span className="kt-portlet__head-icon">
                            <i className="kt-font-brand flaticon2-line-chart" />
                        </span>
                        <h3 className="kt-portlet__head-title">Manage Expenses</h3>
                    </div>
                    <div className="kt-portlet__head-toolbar">
                        <div className="kt-portlet__head-wrapper">
                            <div className="kt-portlet__head-actions">
                                <button onClick={this.toggleAddModal} className="btn btn-brand btn-elevate btn-icon-sm">
                                    <i className="la la-plus" />
                                    New Expense
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="kt-portlet__body">
                    <div className="table-responsive">
                       <table className="table table-striped table-bordered table-hover table-checkable">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Amount (KES)</th>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Budget</th>
                                    <th>Receipt</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.title}</td>
                                        <td>{item.amount ? item.amount.toLocaleString() : '0'}</td>
                                        <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                        <td>{item.category || '-'}</td>
                                        <td>{item.budget ? item.budget : '-'}</td>
                                        <td>{item.receiptImage ? <a href={item.receiptImage} target="_blank" rel="noopener noreferrer">View</a> : '-'}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>
                                            <button onClick={() => this.openEditModal(item)} className="btn btn-sm btn-clean btn-icon btn-icon-md" title="Edit details">
                                                <i className="la la-edit" />
                                            </button>
                                            <button onClick={() => this.openDeleteModal(item)} className="btn btn-sm btn-clean btn-icon btn-icon-md" title="Delete">
                                                <i className="la la-trash" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center">No expenses found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal show={showAddModal} onHide={this.toggleAddModal} size="md">
                    <Add close={this.toggleAddModal} />
                </Modal>

                <Modal show={showEditModal} onHide={this.closeEditModal} size="md">
                    {activeItem && <Edit close={this.closeEditModal} data={activeItem} />}
                </Modal>

                <Modal show={showDeleteModal} onHide={this.closeDeleteModal} size="sm">
                    {activeItem && <Delete close={this.closeDeleteModal} item={activeItem} />}
                </Modal>
            </div>
        );
    }
}

export default List;
