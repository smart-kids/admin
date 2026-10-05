import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import Data from "../../../utils/data";

class Add extends Component {
    state = {
        name: '',
        grade: null,
        subjects: [],
        availableSubjects: [],
        availableGrades: [],
        processing: false
    };

    componentDidMount() {
        this.fetchData();
        this.unsubscribeSubjects = Data.subjects.subscribe(({ subjects }) => {
            this.setState({ availableSubjects: subjects || [] });
        });
        this.unsubscribeGrades = Data.grades.subscribe(({ grades }) => {
            this.setState({ availableGrades: grades || [] });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeSubjects) this.unsubscribeSubjects();
        if (this.unsubscribeGrades) this.unsubscribeGrades();
    }

    fetchData = () => {
        const subjects = Data.subjects.list() || [];
        const grades = Data.grades.list() || [];
        this.setState({ availableSubjects: subjects, availableGrades: grades });
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleGradeChange = (selectedOption) => {
        this.setState({ grade: selectedOption, subjects: [] });
    };

    handleSubjectsChange = (selectedOptions) => {
        this.setState({ subjects: selectedOptions || [] });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { name, subjects } = this.state;
        if (!name) return alert("Please enter a category name");

        this.setState({ processing: true });
        try {
            const subjectIds = subjects.map(s => s.value);
            await Data.rubricSubjectCategories.create({ 
                name, 
                subjects: subjectIds,
                school: localStorage.getItem('school')
            });
            if (window.toastr) window.toastr.success("Category created successfully");
            this.props.handleClose();
        } catch (err) {
            console.error(err);
            if (window.toastr) window.toastr.error("Failed to create category");
        } finally {
            this.setState({ processing: false });
        }
    };

    render() {
        const { handleClose } = this.props;
        const { name, grade, subjects, availableSubjects, availableGrades, processing } = this.state;

        const gradeOptions = availableGrades.map(g => ({
            value: g.id,
            label: g.name
        }));

        const filteredSubjects = grade ? availableSubjects.filter(s => {
            const subjectGradeId = s.grade?.id || s.grade;
            return subjectGradeId === grade.value;
        }) : [];

        const subjectOptions = filteredSubjects.map(s => ({
            value: s.id,
            label: s.name
        }));

        return (
            <Modal show onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Subject Category</Modal.Title>
                </Modal.Header>
                <form onSubmit={this.handleSubmit}>
                    <Modal.Body>
                        <div className="form-group">
                            <label>Category Name (e.g. STEM)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="name" 
                                value={name} 
                                onChange={this.handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Select Grade / Class</label>
                            <Select 
                                options={gradeOptions}
                                value={grade}
                                onChange={this.handleGradeChange}
                                placeholder="Select a grade first..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Subjects</label>
                            <Select 
                                isMulti
                                options={subjectOptions}
                                value={subjects}
                                onChange={this.handleSubjectsChange}
                                placeholder={grade ? "Select subjects..." : "Select a grade first..."}
                                isDisabled={!grade}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                        <button type="submit" className="btn btn-brand" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Category'}
                        </button>
                    </Modal.Footer>
                </form>
            </Modal>
        );
    }
}

export default Add;
