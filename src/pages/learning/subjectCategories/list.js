import React, { Component } from 'react';
import Data from "../../../utils/data";
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
        this.fetchData();
        this.unsubscribe = Data.rubricSubjectCategories.subscribe(({ rubricSubjectCategories }) => {
            this.setState({ data: rubricSubjectCategories || [] });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    fetchData = () => {
        const data = Data.rubricSubjectCategories.list() || [];
        this.setState({ data });
    }

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
                        <h3 className="kt-portlet__head-title">Manage Subject Categories</h3>
                    </div>
                    <div className="kt-portlet__head-toolbar">
                        <div className="kt-portlet__head-wrapper">
                            <div className="kt-portlet__head-actions">
                                <button onClick={this.toggleAddModal} className="btn btn-brand btn-elevate btn-icon-sm">
                                    <i className="la la-plus" />
                                    New Category
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
                                    <th>Name</th>
                                    <th>Subjects</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.subjects ? item.subjects.join(', ') : '-'}</td>
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
                                        <td colSpan="3" className="text-center">No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showAddModal && <Add handleClose={this.toggleAddModal} />}
                {showEditModal && activeItem && <Edit handleClose={this.closeEditModal} item={activeItem} />}
                {showDeleteModal && activeItem && <Delete handleClose={this.closeDeleteModal} item={activeItem} />}
            </div>
        );
    }
}

export default List;
