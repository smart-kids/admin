import React, { Component } from 'react';
import Data from "../../../utils/data";
import Add from "./add";
import Edit from "./edit";
import Delete from "./delete";

class List extends Component {
    state = {
        data: [],
        subjectsList: [],
        gradesList: [],
        showAddModal: false,
        showEditModal: false,
        showDeleteModal: false,
        activeItem: null,
        studentsList: []
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
        const subjectsList = Data.subjects.list() || [];
        const gradesList = Data.grades.list() || [];
        const studentsList = Data.students.list() || [];
        this.setState({ data, subjectsList, gradesList, studentsList });
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
                                    <th>Grade</th>
                                    <th>Subjects Included</th>
                                    <th>Students Enrolled</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => {
                                    // Map subjects
                                    const categorySubjects = (item.subjects || []).map(subId => {
                                        return this.state.subjectsList.find(s => s.id === subId) || { name: 'Unknown Subject', id: subId };
                                    });
                                    
                                    // Find Grade from the first subject
                                    let gradeName = "-";
                                    let gradeId = null;
                                    if (categorySubjects.length > 0 && categorySubjects[0].grade) {
                                        gradeId = categorySubjects[0].grade;
                                        const g = this.state.gradesList.find(gr => gr.id === gradeId);
                                        if (g) gradeName = g.name;
                                    }

                                    // Count students in this grade
                                    const studentsEnrolled = (this.state.studentsList || []).filter(st => {
                                        const stGradeId = st.class?.grade?.id || st.class?.grade;
                                        return stGradeId === gradeId;
                                    }).length;

                                    return (
                                        <tr key={item.id}>
                                            <td><strong>{item.name}</strong></td>
                                            <td>
                                                <span className="kt-badge kt-badge--brand kt-badge--inline kt-badge--pill font-weight-bold">
                                                    {gradeName}
                                                </span>
                                            </td>
                                            <td>
                                                {categorySubjects.length > 0 ? categorySubjects.map(sub => (
                                                    <span key={sub.id} className="kt-badge kt-badge--info kt-badge--inline kt-badge--pill mr-1 mb-1">
                                                        {sub.name}
                                                    </span>
                                                )) : <span className="text-muted">No subjects added</span>}
                                            </td>
                                            <td>
                                                <span className="kt-badge kt-badge--success kt-badge--dot mr-2"></span>
                                                <span className="kt-font-bold kt-font-success">{studentsEnrolled} Students</span>
                                            </td>
                                            <td>
                                                <button onClick={() => this.openEditModal(item)} className="btn btn-sm btn-clean btn-icon btn-icon-md" title="Edit details">
                                                    <i className="la la-edit" />
                                                </button>
                                                <button onClick={() => this.openDeleteModal(item)} className="btn btn-sm btn-clean btn-icon btn-icon-md" title="Delete">
                                                    <i className="la la-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center">No categories found.</td>
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
