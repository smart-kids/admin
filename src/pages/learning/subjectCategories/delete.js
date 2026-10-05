import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Data from "../../../utils/data";

class Delete extends Component {
    state = {
        processing: false
    };

    handleDelete = async () => {
        const { item } = this.props;
        this.setState({ processing: true });
        try {
            await Data.rubricSubjectCategories.delete(item);
            if (window.toastr) window.toastr.success("Category deleted successfully");
            this.props.handleClose();
        } catch (err) {
            console.error(err);
            if (window.toastr) window.toastr.error("Failed to delete category");
        } finally {
            this.setState({ processing: false });
        }
    };

    render() {
        const { handleClose, item } = this.props;
        const { processing } = this.state;

        return (
            <Modal show onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Subject Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete the category <strong>{item.name}</strong>?</p>
                    <p className="text-danger small">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={this.handleDelete} disabled={processing}>
                        {processing ? 'Deleting...' : 'Delete Category'}
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default Delete;
