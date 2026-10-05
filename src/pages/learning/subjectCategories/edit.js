import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import Data from "../../../utils/data";

class Edit extends Component {
    state = {
        name: '',
        subjects: [],
        availableSubjects: [],
        processing: false
    };

    componentDidMount() {
        this.fetchSubjects();
        this.unsubscribe = Data.subjects.subscribe(({ subjects }) => {
            this.setState({ availableSubjects: subjects || [] }, this.initData);
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    fetchSubjects = () => {
        const subjects = Data.subjects.list() || [];
        this.setState({ availableSubjects: subjects }, this.initData);
    };

    initData = () => {
        const { item } = this.props;
        const { availableSubjects } = this.state;
        if (item && availableSubjects.length > 0 && !this.state.name) {
            const selectedSubjects = (item.subjects || []).map(subId => {
                const sub = availableSubjects.find(s => s.id === subId);
                if (sub) return { value: sub.id, label: sub.name };
                return { value: subId, label: subId };
            });

            this.setState({
                name: item.name || '',
                subjects: selectedSubjects
            });
        }
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubjectsChange = (selectedOptions) => {
        this.setState({ subjects: selectedOptions || [] });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { name, subjects } = this.state;
        const { item } = this.props;

        if (!name) return alert("Please enter a category name");

        this.setState({ processing: true });
        try {
            const subjectIds = subjects.map(s => s.value);
            await Data.rubricSubjectCategories.update({ 
                id: item.id,
                name, 
                subjects: subjectIds,
                school: localStorage.getItem('school')
            });
            if (window.toastr) window.toastr.success("Category updated successfully");
            this.props.handleClose();
        } catch (err) {
            console.error(err);
            if (window.toastr) window.toastr.error("Failed to update category");
        } finally {
            this.setState({ processing: false });
        }
    };

    render() {
        const { handleClose } = this.props;
        const { name, subjects, availableSubjects, processing } = this.state;

        const subjectOptions = availableSubjects.map(s => ({
            value: s.id,
            label: s.name
        }));

        return (
            <Modal show onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Subject Category</Modal.Title>
                </Modal.Header>
                <form onSubmit={this.handleSubmit}>
                    <Modal.Body>
                        <div className="form-group">
                            <label>Category Name</label>
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
                            <label>Subjects</label>
                            <Select 
                                isMulti
                                options={subjectOptions}
                                value={subjects}
                                onChange={this.handleSubjectsChange}
                                placeholder="Select subjects..."
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                        <button type="submit" className="btn btn-brand" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </Modal.Footer>
                </form>
            </Modal>
        );
    }
}

export default Edit;
