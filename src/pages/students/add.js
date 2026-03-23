import React from "react";
import ErrorMessage from "./components/error-toast";
import AddParentModal from "../parents/add";
import AddClassModal from "../classes/add"
import AddRouteModal from "../routes/add"

import Select from 'react-select';

import Data from "../../utils/data"
const IErrorMessage = new ErrorMessage();

const $ = window.$;
const addParentModal = new AddParentModal();
const addClassModal = new AddClassModal();
const addRouteModal = new AddRouteModal();

const MODAL_ID = "student-modal-" + Math.random().toString().split(".")[1];

// --- NEW: Define the initial state as a constant ---
// This makes resetting the state much cleaner and less error-prone.
const initialState = {
  loading: false,
  names: "",
  route: "",
  gender: "",
  registration: "",
  class: "",
  parent: "",
  parent2: "",
  paidFees: 0,
  balanceBroughtForward: 0,

  // State for react-select value objects
  setClass: null,
  setRoute: null,
  setParent: null,
  setParent2: null,

  // Data lists (these don't need to be reset)
  parents: [],
  classes: [],
  routes: []
};


class Modal extends React.Component {
  // Use the new constant for the initial state
  state = { ...initialState };

  show() {
    // Optional: You can also reset the state every time the modal is shown
    // this.resetState(); 
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }
  
  hide() {
    $("#" + MODAL_ID).modal("hide");
  }

  // --- NEW: A dedicated method to reset the form's state ---
  resetState = () => {
    // We only want to reset the form fields, not the data lists (parents, classes, etc.)
    this.setState({
      loading: false,
      names: "",
      route: "",
      gender: "",
      registration: "",
      class: "",
      parent: "",
      parent2: "",
      paidFees: 0,
      balanceBroughtForward: 0,
      setClass: null,
      setRoute: null,
      setParent: null,
      setParent2: null,
    });
    // Also reset the jQuery validator to clear any previous error messages
    if (this.validator) {
      this.validator.resetForm();
    }
  }

  async componentDidMount() {
    const classes = Data.classes.list();
    this.setState({ classes });
    Data.classes.subscribe(({ classes }) => this.setState({ classes }));

    const routes = Data.routes.list();
    this.setState({ routes });
    Data.routes.subscribe(({ routes }) => this.setState({ routes }));

    const parents = Data.parents.list();
    this.setState({ parents });
    Data.parents.subscribe(({ parents }) => this.setState({ parents }));

    const _this = this;
    this.validator = $("#" + MODAL_ID + "form").validate({
      errorClass: "invalid-feedback",
      errorElement: "div",

      highlight: function (element) {
        $(element).addClass("is-invalid");
      },
      unhighlight: function (element) {
        $(element).removeClass("is-invalid");
      },

      async submitHandler(form, event) {
        event.preventDefault();
        try {
          _this.setState({ loading: true });

          const { names, route, gender, registration, class: className, parent, parent2, paidFees, balanceBroughtForward } = _this.state;
          
          const payload = { 
            names, 
            route, 
            gender, 
            registration, 
            class: className,
            parent, 
            parent2,
            paidFees: parseFloat(paidFees) || 0,
            balanceBroughtForward: parseFloat(balanceBroughtForward) || 0
          };

          await _this.props.save(payload);
          _this.hide();
          
          // --- CHANGED: Call the resetState method on success ---
          _this.resetState();

        } catch (error) {
          console.error("Submission failed:", error);
          if (error && error.message) {
            IErrorMessage.show({ message: error.message });
          } else {
            IErrorMessage.show();
          }
        } finally {
           _this.setState({ loading: false });
        }
      }
    });
  }

  render() {
    return (
      <div>
        {/* Modals for adding related data */}
        <AddParentModal save={parent => Data.parents.create(parent)} />
        {/* You probably need to pass teachers to this component if it uses them */}
        <AddClassModal save={classData => Data.classes.create(classData)} teachers={[]} />
        {/* And students to this one */}
        <AddRouteModal students={[]} save={route => Data.routes.create(route)} />
        
        <div
          className="modal"
          id={MODAL_ID}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="myLargeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              {/* --- FORM --- */}
              <form
                id={MODAL_ID + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Create Student</h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close" >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* ... The rest of your form JSX is unchanged ... */}
                  {/* ... Example input ... */}
                   <div className="kt-portlet__body">
                    <div className="form-group row">
                      {/* Full Name, Registration, Gender are fine */}
                      <div className="col-lg-4">
                        <label>Full Name:</label>
                        <input type="text" className="form-control" name="names" minLength="2" required value={this.state.names} onChange={(e) => this.setState({ names: e.target.value })} />
                      </div>
                      <div className="col-lg-4">
                        <label>Registration Number:</label>
                        <input type="text" className="form-control" name="registration" minLength="2" required value={this.state.registration} onChange={(e) => this.setState({ registration: e.target.value })} />
                      </div>
                      <div className="col-lg-4">
                        <label htmlFor="gender">Gender:</label>
                        <select name="gender" className="form-control" id="gender" required value={this.state.gender} onChange={(e) => this.setState({ gender: e.target.value })}>
                          <option value="">Select gender</option>
                          {["MALE", "FEMALE"].map(gender => (<option key={gender} value={gender}>{gender}</option>))}
                        </select>
                      </div>

                      {/* Class Selector */}
                      <div className="col-lg-6">
                        <div className="row">
                          <div className="col-lg-8">
                            <label>Class:</label>
                            <Select
                              name="class" 
                              value={this.state.setClass}
                              options={this.state.classes?.map(({ id: value, name: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({ class: value, setClass: { value, label } })}
                            />
                          </div>
                          <div className="col-lg-4 align-self-end">
                            <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addClassModal.show(); }}>
                              Add a Class
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Route Selector */}
                      <div className="col-lg-6">
                        <div className="row">
                          <div className="col-lg-8">
                            <label>Route:</label>
                            <Select
                              name="route"
                              value={this.state.setRoute}
                              options={this.state.routes?.map(({ id: value, name: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({ route: value, setRoute: { value, label } })}
                            />
                          </div>
                          <div className="col-lg-4 align-self-end">
                            <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addRouteModal.show(); }}>
                              Add a Route
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Parent Selector */}
                      <div className="col-lg-6">
                        <div className="row">
                          <div className="col-lg-8">
                            <label>Parent:</label>
                            <Select
                              name="parent"
                              value={this.state.setParent}
                              options={this.state.parents?.map(({ id: value, name, phone }) => ({ value, label: `${name} (${phone || 'No Phone'})` }))}
                              onChange={({ value, label }) => this.setState({ parent: value, setParent: { value, label } })}
                            />
                          </div>
                          <div className="col-lg-4 align-self-end">
                            <button className="btn btn-outline-brand" type="button" onClick={() => { this.hide(); addParentModal.show(); }}>
                              Add a Parent
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Second Parent Selector */}
                      <div className="col-lg-6">
                        <div className="row">
                          <div className="col-lg-8">
                            <label>Second Parent (Optional):</label>
                            <Select
                              name="parent2"
                              isClearable
                              value={this.state.setParent2}
                              options={this.state.parents?.map(({ id: value, name, phone }) => ({ value, label: `${name} (${phone || 'No Phone'})` }))}
                              onChange={(selected) => this.setState({ parent2: selected ? selected.value : "", setParent2: selected })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Paid Fees */}
                      <div className="col-lg-6">
                        <label>Paid Fees:</label>
                        <input type="number" className="form-control" name="paidFees" value={this.state.paidFees} onChange={(e) => this.setState({ paidFees: e.target.value })} />
                      </div>

                      {/* Balance Brought Forward */}
                      <div className="col-lg-6">
                        <label>Balance Brought Forward:</label>
                        <input type="number" className="form-control" name="balanceBroughtForward" value={this.state.balanceBroughtForward} onChange={(e) => this.setState({ balanceBroughtForward: e.target.value })} />
                      </div>

                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-brand" type="submit" disabled={this.state.loading}>
                    {this.state.loading ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />) : ("Save")}
                  </button>
                  <button data-dismiss="modal" type="button" className="btn btn-outline-brand">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Modal;