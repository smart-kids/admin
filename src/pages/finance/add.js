import React from "react";
import ErrorMessage from "./components/error-toast";
import AddParentModal from "./add_parent";
import AddSecondParentModal from "./add_parent";

import Data from "../../utils/data"
const IErrorMessage = new ErrorMessage();

const $ = window.$;
const addParentModalInstance = new AddParentModal();
const addSecondParentModalInstance = new AddSecondParentModal();

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    names: "",
    route: "",
    gender: "",
    registration: "",
    class: "",
    parent: "",
    parent2: "",
    parents: [],
    classes: [],
    selectedParents: [],
    filteredParents: [],
    routes: []
  };

  show() {
    $("#" + modalNumber).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }
  hide() {
    $("#" + modalNumber).modal("hide");
  }

  onParentChange = e => {
    this.setState({
      selectedParents: Object.assign(this.state.selectedParents, [e.target.value]),
      [e.target.name]: e.target.value
    })
  }

  async componentDidMount() {
    const parents = await Data.parents.list()
    this.setState({ parents, filteredParents: parents })

    const classes = await Data.classes.list()
    this.setState({ classes })


    Data.parents.subscribe(({ parents }) => this.setState({ parents, filteredParents: parents }))
    Data.classes.subscribe(({ classes }) => this.setState({ classes }))

    const _this = this;
    this.validator = $("#" + modalNumber + "form").validate({
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

          // cleanup
          // _this.state.loading = undefined;

          // reassign
          // _this.state.parents = undefined;
          // _this.state.routes = undefined;
          // _this.state.filteredParents = undefined
          // _this.state.selectedParents = undefined

          const { names, route, gender, registration, class: className, parent, parent2 } = _this.state

          await _this.props.save({ names, route, gender, registration, class: className, parent, parent2 });
          _this.hide();
          _this.setState({ loading: false });
        } catch (error) {
          _this.setState({ loading: false });
          if (error) {
            const { message } = error;
            return IErrorMessage.show({ message });
          }
          IErrorMessage.show();
        }
      }
    });
  }
  render() {
    return (
      <div>
        <div
          className="modal"
          id={modalNumber}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="myLargeModalLabel"
          aria-hidden="true"
        >
          <AddParentModal save={async parent => {
            Data.parents.create(parent)
            const parents = Data.parents.list()
            console.log(parents)
            const { id } = parents[parents.length - 1]

            this.setState({ parents, parent: id })
          }} />
          <AddSecondParentModal save={async parent => {
            Data.parents.create(parent)
            const parents = Data.parents.list()
            console.log(parents)
            const { id } = parents[parents.length - 1]

            this.setState({ parents, parent2: id })
          }} />
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Create Student</h5>
                  <button
                    type="button"
                    className="close"
                    data-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="kt-portlet__body">
                    <div className="form-group row">
                      <div className="col-lg-3">

                      </div>
                    </div>
                    <div className="form-group row">
                      <div className="col-lg-4">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullname"
                          name="fullname"
                          minLength="2"
                          required
                          value={this.state.names}
                          onChange={(e) => this.setState({
                            names: e.target.value
                          })}
                        />
                      </div>
                      <div className="col-lg-4">
                        <label>Registration Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="reg-no"
                          name="registration"
                          minLength="2"
                          required
                          value={this.state.registration}
                          onChange={(e) => this.setState({
                            registration: e.target.value
                          })}
                        />
                      </div>
                      <div className="col-lg-4">
                        <label htmlFor="exampleSelect1">Class:</label>
                        <select
                          name="class"
                          className="form-control"
                          required
                          value={this.state.class}
                          onChange={(e) => this.setState({
                            class: e.target.value
                          })}
                        >
                          <option value="">Select class</option>
                          {(this.state.classes || []).map(Iclass => (
                            <option key={Iclass.id} value={Iclass.id}>{Iclass.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-lg-6">
                        <label htmlFor="exampleSelect1">Route:</label>
                        <select
                          name="route"
                          className="form-control"
                          required
                          value={this.state.route}
                          onChange={(e) => this.setState({
                            route: e.target.value
                          })}
                        >
                          <option value="">Select route</option>
                          {this.props.routes.map(route => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-lg-6">
                        <label htmlFor="exampleSelect1">Gender:</label>
                        <select
                          name="gender"
                          className="form-control"
                          id="exampleSelect1"
                          required
                          value={this.state.gender}
                          onChange={(e) => this.setState({
                            gender: e.target.value
                          })}
                        >
                          <option value="">Select gender</option>
                          {["MALE", "FEMALE"].map(gender => {
                            return <option key={gender} value={gender}>{gender}</option>
                          })}
                        </select>
                      </div>
                      <div className="col-lg-8">
                        <label htmlFor="exampleSelect1">Parent:</label>
                        <select
                          name="parent"
                          className="form-control"
                          required
                          value={this.state.parent}
                          onChange={this.onParentChange}
                        >
                          <option value="">Select parent</option>
                          {(this.state.parents || []).map(parent => (
                            // !this.state.selectedParents.includes(parent.id) && 
                            <option key={parent.id} value={parent.id}>{parent.name}</option>

                          ))}
                        </select>
                      </div>
                      <div className="col-lg-3">
                        <button type="button" className="btn btn-outline-brand mt-4" onClick={addParentModalInstance.show}>Add Parent</button>
                      </div>
                      {/* <div className="col-lg-8">
                        <label htmlFor="exampleSelect1">Second Parent:</label>
                        <select
                          name="parent2"
                          className="form-control"
                          value={this.state.parent2}
                          onChange={this.onParentChange}
                        >
                          <option value="">Select parent</option>
                          <option value={this.state.parent2}>{this.state.parents.find(p => p.id === this.state.parent2)?.name}</option>
                          {this.state.parents.map(parent => (
                            !this.state.selectedParents.includes(parent.id) && <option value={parent.id}>{parent.name}</option>
                          ))}
                        </select>
                      </div> */}
                      <div className="col-lg-3">
                        <button type="button" className="btn btn-outline-brand mt-4" onClick={addSecondParentModalInstance.show}>Add Second Parent</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-brand"
                    type="submit"
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                        "Save"
                      )}
                  </button>
                  <button
                    data-dismiss="modal"
                    type="button"
                    className="btn btn-outline-brand"
                  >
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
