import React from "react";

import Table from "./components/table";
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "./edit";
import DeleteModal from "./delete";
import Data from "../../utils/data";

const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();

class BasicTable extends React.Component {
  state = {
    buses: [],
    filteredBuses:[],
    drivers: []
  };
  componentDidMount() {
    const buses = Data.buses.list();
    this.setState({ buses, filteredBuses: buses });

    Data.buses.subscribe(({ buses }) => {
      this.setState({ buses, filteredBuses: buses });
    });

    const drivers = Data.drivers.list();
    this.setState({ drivers });

    Data.drivers.subscribe(driver => {
      this.setState(driver);
    });
  }

  onSearch = e => {
    const { buses } = this.state
    const filteredBuses = buses.filter(bus => bus.plate.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredBuses })
  }

  render() {
    const { edit, remove, drivers } = this.state;
    return (
      <div className="kt-quick-panel--right kt-demo-panel--right kt-offcanvas-panel--right kt-header--fixed kt-header-mobile--fixed kt-aside--enabled kt-aside--left kt-aside--fixed kt-aside--offcanvas-default kt-page--loading">
        <div className="kt-grid kt-grid--hor kt-grid--root">
          <div className="kt-portlet kt-portlet--mobile">
            <AddModal drivers={drivers} save={bus => Data.buses.create(bus)} />
            <UploadModal save={buses => buses.forEach(bus => Data.buses.create(bus))} />
            <DeleteModal
              remove={remove}
              save={bus => Data.buses.delete(bus)}
            />
            <EditModal
              edit={edit}
              drivers={drivers}
              save={bus => Data.buses.update(bus)}
            />
            <div className="kt-portlet__body">
              {/*begin: Search Form */}
              <div className="kt-form kt-fork--label-right kt-margin-t-20 kt-margin-b-10">
                <div className="row align-items-center">
                  <div className="col-xl-8 order-2 order-xl-1">
                    <div className="row align-items-center">
                      <div className="col-md-4 kt-margin-b-20-tablet-and-mobile">
                        <div className="kt-input-icon kt-input-icon--left">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search..."
                            onChange={this.onSearch}
                            id="generalSearch"
                          />
                          <span className="kt-input-icon__icon kt-input-icon__icon--left">
                            <span>
                              <i className="la la-search" />
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 order-2 order-xl-1">
                    <button
                      href="#"
                      className="btn btn-default btn-sm btn-bold btn-upper float-right"
                      onClick={() => uploadModalInstance.show()}
                    >
                      Upload
                    </button>
                    <button
                      href="#"
                      className="btn btn-default btn-sm btn-bold btn-upper float-right"
                      onClick={() => addModalInstance.show()}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
              {/*end: Search Form */}
            </div>
            <div className="kt-portlet__body" style={{ minHeight: "500px" }}>
              <Table
                headers={[
                  {
                    label: "Bus Make",
                    key: "make"
                  },
                  {
                    label: "Capacity",
                    key: "size"
                  },
                  {
                    label: "Driver",
                    key: "driver"
                  },
                  {
                    label: "Plate",
                    key: "plate"
                  }
                ]}
                data={this.state.filteredBuses}
                edit={bus => {
                  this.setState({ edit: bus }, () => {
                    editModalInstance.show();
                  });
                }}
                delete={bus => {
                  this.setState({ remove: bus }, () => {
                    deleteModalInstance.show();
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BasicTable;



