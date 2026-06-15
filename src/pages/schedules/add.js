import React from "react";
import ErrorMessage from "./components/error-toast";


import Select from 'react-select';
import Data from "../../utils/data";

import AddRouteModal from "../routes/add";
import AddBusModal from "../buses/add"
import AddDriverModal from "../drivers/add"

// embeded modals
const addRouteModal = new AddRouteModal();
const addBusModal = new AddBusModal()
const addDriverModal = new AddDriverModal()

const IErrorMessage = new ErrorMessage();
const $ = window.$;

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
    route: "",
    driver: "",
    days: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY"
    ],
    type: '',
    types: [
      'PICK',
      'DROP'
    ],
    selectedDays: [
      "MONDAY"
    ]
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
  componentDidMount() {
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
          _this.state.loading = undefined

          _this.state.time = $('#timepicker_start').data("timepicker").getTime()
          _this.state.end_time = $('#timepicker_end').data("timepicker").getTime()

          const schedule = {};
          schedule.time = _this.state.time;
          schedule.end_time = _this.state.end_time;
          schedule.days = _this.state.selectedDays
          schedule.type = _this.state.type;
          schedule.name = _this.state.name;
          schedule.bus = _this.state.bus;
          schedule.message = _this.state.message;
          schedule.route = _this.state.route;
          schedule.driver = _this.state.driver;

          await _this.props.save(schedule);
          _this.hide();
          _this.setState({ loading: false });
        } catch (error) {
          console.log(error);
          _this.setState({ loading: false });
          if (error) {
            const { message } = error;
            return IErrorMessage.show({ message });
          }
          IErrorMessage.show();
        }
      }
    });

    $('#timepicker_start').timepicker({
      icons: { // to change the icon
        up: "fa fa-chevron-up",
        down: "fa fa-chevron-down", 
      }
    });
    $('#timepicker_end').timepicker({
      icons: { // to change the icon
        up: "fa fa-chevron-up",
        down: "fa fa-chevron-down",
      }
    });
  }
  render() {
    return (
      <div>
        <AddRouteModal save={routes => Data.routes.create(routes)}/>
        <AddBusModal drivers={this.props.drivers} />
        <AddDriverModal />
        <div
          className="modal"
          id={modalNumber}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="myLargeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Schedule a trip</h5>
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
                      <div className="col-lg-6">
                        <label>Trip name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          minLength="2"
                          required
                          value={this.state.name}
                          onChange={(e) => this.setState({
                            name: e.target.value
                          })}
                        />
                      </div>
                      <div className="col-lg-6">
                        <label>Start Time</label>
                        <input
                          type="text"
                          className="form-control"
                          id="timepicker_start"
                          name="start"
                          required
                          // value={this.state.time}
                          onChange={(e) => this.setState({
                            time: e.target.value
                          })}
                        />
                      </div>
                      <div className="col-lg-6">
                        <label>End Time</label>
                        <input
                          type="text"
                          className="form-control"
                          id="timepicker_end"
                          name="end"
                          required
                          // value={this.state.end_time}
                          onChange={(e) => this.setState({
                            end_time: e.target.value
                          })}
                        />
                      </div>
                      {/* <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Route:</label>
                        <select
                          name="seats"
                          className="form-control"
                          required
                          value={this.state.route}
                          onChange={(e) => this.setState({
                            route: e.target.value
                          })}
                        >
                          <option value="">Select Route</option>
                          {this.props.routes.map(
                            route => (
                              <option key={route.id} value={route.id}>{route.name}</option>
                            )
                          )}
                        </select>
                      </div> */}
                      <div className="col-lg-6">
                        <div className="row">

                          <div className="col-lg-8">
                            <label htmlFor="exampleSelect1">Select Route:</label>
                            <Select
                              name="route"
                              value={this.state.setRoute}
                              options={this.props.routes?.map(({ id: value, name: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({
                                route: value,
                                setRoute: { value, label }
                              })}
                            />
                          </div>
                          <div className="col-lg-4">
                            <label htmlFor="exampleSelect1">↓</label>
                            <br></br>
                            <button
                              className="btn btn-outline-brand"
                              type="button"
                              onClick={() => {
                                console.log("adding")
                                this.hide()
                                addRouteModal.show()
                              }}
                            >
                              Add a Route
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="col-lg-6">

                        <div className="row">

                          <div className="col-lg-8">
                            <label htmlFor="exampleSelect1">Select Bus:</label>
                            <Select
                              name="bus"
                              value={this.state.setBus}
                              options={this.props.buses?.map(({ id: value, plate: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({
                                route: value,
                                setBus: { value, label }
                              })}
                            />
                          </div>
                          <div className="col-lg-4">
                            <label htmlFor="exampleSelect1">↓</label>
                            <br></br>
                            <button
                              className="btn btn-outline-brand"
                              type="button"
                              onClick={() => {
                                console.log("adding")
                                this.hide()
                                addBusModal.show()
                              }}
                            >
                              Add a Bus
                            </button>
                          </div>
                        </div>



                      </div>
                      <div className="col-lg-6">
                        <label htmlFor="exampleSelect1">Schedule Type:</label>
                        <select
                          name="type"
                          type="text"
                          required
                          className="form-control"
                          value={this.state.type}
                          onChange={(e) => this.setState({
                            type: e.target.value
                          })}
                        >
                          <option value="">Select type</option>
                          {this.state.types.map(
                            (type, index) => (
                              <option key={index} value={type}>{type}</option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="col-lg-6">
                        <br />
                        <label htmlFor="exampleSelect1">Select Days the route is taken</label>
                        <div className="kt-checkbox-list">
                          {this.state.days.map(day => {
                            return (<label key={day} className="kt-checkbox">
                              <input
                                type="checkbox"
                                checked={this.state.selectedDays.includes(day)}
                                onChange={() => {
                                  if (this.state.selectedDays.includes(day)) {
                                    return this.setState({
                                      selectedDays: this.state.selectedDays.filter(eday => eday !== day)
                                    })
                                  }
                                  this.setState({
                                    selectedDays: [...this.state.selectedDays, day]
                                  })
                                }} /> {day}
                              <span />
                            </label>)
                          })}
                        </div>
                      </div>
                      <div className="col-lg-6">
                        

                        <div className="row">
                          <div className="col-lg-8">
                            <label htmlFor="exampleSelect1">Drivers:</label>
                            <Select
                              name="driver"
                              value={this.state.setDriver}
                              options={(this.props.drivers || []).map(({ id: value, names: label }) => ({ value, label }))}
                              onChange={({ value, label }) => this.setState({
                                driver: value,
                                setDriver: { value, label }
                              })}
                            />
                          </div>
                          <div className="col-lg-4">
                            <label htmlFor="exampleSelect1">↓</label>
                            <br></br>
                            <button
                              className="btn btn-outline-brand"
                              type="button"
                              onClick={() => {
                                console.log("adding")
                                this.hide()
                                addDriverModal.show()
                              }}
                            >
                              Add a Driver
                            </button>
                          </div>
                        </div>


                      </div>
                      <div className="col-lg-12">
                        <label>Schedule message:</label>
                        <textarea
                          type="text"
                          className="form-control"
                          id="message"
                          name="message"
                          minLength="2"
                          rows="8"
                          required
                          value={this.state.message}
                          onChange={(e) => this.setState({
                            message: e.target.value
                          })}
                        />
                      </div>
                      <div className="col-lg-12">
                        <code>{`You can use the following placeholders {{student_name}} {{parent_name}} {{school_name}} {{time}}`}</code>
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
