import React from "react";
import ErrorMessage from "./components/error-toast";
import deepEqual from 'deep-equal'

const IErrorMessage = new ErrorMessage();

const $ = window.$;

const schedule_types = [
  'PICK',
  'DROP'
];

const modalNumber = Math.random()
  .toString()
  .split(".")[1];

class Modal extends React.Component {
  state = {
    loading: false,
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
    edit: {
      routes: [],
      buses: [],
      route: "",
      days: [],
      selectedDays: []
    }
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

          const data = {}
          Object.assign(data, _this.state.edit)

          if (data.route) {
            data.route_name = data.route.name
          }

          if (data.bus) {
            data.bus_make = data.bus.make
          }

          // data.route_name = undefined
          // data.bus_make = undefined
          // data.id = undefined
          data.route = data.route.id
          data.days = data.days
          data.bus = data.bus.id
          await _this.props.save(data);

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

    $('#timepicker_start_edit').timepicker();
    $('#timepicker_start_edit').timepicker().on('changeTime.timepicker', e => {
      // e.time
      this.setState({
        edit: Object.assign(this.state.edit, {
          time: e.time.value
        })
      })
    })
    $('#timepicker_end_edit').timepicker();
    $('#timepicker_end_edit').timepicker().on('changeTime.timepicker', e => {
      // e.time
      this.setState({
        edit: Object.assign(this.state.edit, {
          end_time: e.time.value
        })
      })
    })
  }
  static getDerivedStateFromProps(props, state) {
    if (props.edit) {
      if (!deepEqual(props.edit, state.edit)) {
        return {
          edit: props.edit
        };
      }
      return null;
    }
    return null;
  }
  render() {
    const {
      edit: { names, route = {}, bus = {}, gender } = {}
    } = this.state;

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
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form
                id={modalNumber + "form"}
                className="kt-form kt-form--label-right"
              >
                <div className="modal-header">
                  <h5 className="modal-title">Edit Schedule</h5>
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
                        <label>Trip name:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="tripname"
                          name="tripname"
                          minLength="2"
                          required
                          value={this.state.edit.name}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              name: e.target.value
                            })
                          })}
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>Start Time</label>
                        <input
                          type="text"
                          className="form-control"
                          id="timepicker_start_edit"
                          name="start"
                          required
                          value={this.state.edit.time}
                          onChange={(e) => {
                            this.setState({
                              edit: Object.assign(this.state.edit, {
                                name: $('#timepicker_start').data("timepicker").getTime()
                              })
                            })
                          }}
                        />
                      </div>
                      <div className="col-lg-3">
                        <label>End Time</label>
                        <input
                          type="text"
                          className="form-control"
                          id="timepicker_end_edit"
                          name="end"
                          required
                          value={this.state.edit.end_time}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              name: $('#timepicker_end_edit').data("timepicker").getTime()
                            })
                          })}
                        />
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Route:</label>
                        <select
                          name="seats"
                          className="form-control"
                          required
                          value={this.state.edit.route_name}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              route: this.props.routes.filter(r => r.name == e.target.value)[0],
                              route_name: e.target.value
                            })
                          })}
                        >
                          <option value="">Select Route</option>
                          {(this.props.routes || []).map(
                            route => (
                              <option key={route.name} value={route.name}>{route.name}</option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Bus:</label>
                        <select
                          name="bus"
                          className="form-control"
                          required
                          value={this.state.edit.bus_make}
                          onChange={(e) => this.setState({
                            edit: Object.assign(this.state.edit, {
                              bus: this.props.buses.filter(r => r.make == e.target.value)[0],
                              bus_make: e.target.value
                            })
                          })}
                        >
                          <option value="">Select Bus</option>
                          {(this.props.buses || []).map(
                            bus => (
                              <option key={bus.make} value={bus.make}>{bus.make}</option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Schedule Type:</label>
                        <select
                          name="type"
                          type="text"
                          className="form-control"
                          value={this.state.edit.type}
                          onChange={(e) => this.setState({
                            type: e.target.value
                          })}
                        >
                          <option value="">Select type</option>
                          {schedule_types.map(
                            (type, index) => (
                              <option key={index} value={type}>{type}</option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="col-lg-3">
                        <br />
                        <label htmlFor="exampleSelect1">Select Days the route is taken</label>
                        <div className="kt-checkbox-list">
                          {this.state.days.map(day => {
                            return (<label key={day} className="kt-checkbox">
                              <input
                                type="checkbox"
                                checked={this.state.edit.days.includes(day)}
                                onChange={() => {
                                  if (this.state.edit.days.includes(day)) {
                                    return this.setState({
                                      edit: Object.assign(this.state.edit, {
                                        days: this.state.edit.days.filter(eday => eday != day)
                                      })
                                    })
                                  }
                                  this.setState({
                                    edit: Object.assign(this.state.edit, {
                                      days: [...this.state.edit.days, day]
                                    })
                                  })
                                }}
                              /> {day}
                              <span />
                            </label>)
                          })}
                        </div>
                      </div>
                      <div className="col-lg-3">
                        <label htmlFor="exampleSelect1">Driver:</label>
                        <select
                          name="seats"
                          type="text"
                          className="form-control"
                          value={this.state.driver}
                          onChange={(e) => this.setState({
                            driver: e.target.value
                          })}
                        >
                          <option value="">Select driver</option>
                          {(this.props.drivers || []).map(
                            driver => (
                              <option key={driver.id} value={driver.id}>{driver.names}</option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-lg-12">
                        <label>Schedule message:</label>
                        <textarea
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          minLength="2"
                          rows="8"
                          required
                          value={this.state.edit.message}
                          onChange={(e) => this.setState(Object.assign(this.state.edit, {
                            message: e.target.value
                          }))}
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
                    type="submit"
                    className="btn btn-outline-brand"
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
