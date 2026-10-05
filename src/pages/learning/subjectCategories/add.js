import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Data from "../../../utils/data";

class Add extends Component {
    state = {
        name: '',
        subjects: [],
        processing: false
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { name, subjects } = this.state;
        if (!name) return alert("Please enter a category name");

        this.setState({ processing: true });
        try {
            await Data.rubricSubjectCategories.create({ 
                name, 
                subjects,
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
        const { name, processing } = this.state;

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
