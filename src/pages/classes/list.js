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
    classes: [],
    teachers:[],
    filteredClasses:[]
  };
  componentDidMount() {
    const classes = Data.classes.list();
    this.setState({ classes, filteredClasses: classes });

    const teachers = Data.teachers.list();
    this.setState({ teachers });

    Data.classes.subscribe(({ classes }) => {
      this.setState({ classes, filteredClasses: classes });
    });

    Data.teachers.subscribe(({ teachers }) => {
      this.setState({ teachers });
    });
  }

  onSearch = e => {
    const { classes } = this.state
    const filteredClasses = classes.filter(Iclass => Iclass.name.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredClasses })
  }

  render() {
    const { edit, remove } = this.state;
    return (
      <div className="kt-quick-panel--right kt-demo-panel--right kt-offcanvas-panel--right kt-header--fixed kt-header-mobile--fixed kt-aside--enabled kt-aside--left kt-aside--fixed kt-aside--offcanvas-default kt-page--loading">
        <div className="kt-grid kt-grid--hor kt-grid--root">
          <div className="kt-portlet kt-portlet--mobile">
            <AddModal teachers={this.state.teachers} save={Iclass => Data.classes.create(Iclass)} />
            <UploadModal save={classes=> classes.forEach(Iclass => Data.classes.create(Iclass))} />
            <DeleteModal
              remove={remove}
              save={Iclass => Data.classes.delete(Iclass)}
            />
            <EditModal
              teachers={this.state.teachers}
              edit={edit}
              save={Iclass => Data.classes.update(Iclass)}
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
                    label: "Class Name",
                    key: "name"
                  },
                  {
                    label: "Number of Students",
                    key: "student_num"
                  },
                  {
                    label: "Teacher",
                    key: "teacher_name"
                  },
                  {
                    label: "Fee Amount",
                    key: "feeAmount"
                  }
                ]}
                data={this.state.filteredClasses}
                edit={Iclass => {
                  this.setState({ edit: Iclass }, () => {
                    editModalInstance.show();
                  });
                }}
                delete={Iclass => {
                  this.setState({ remove: Iclass }, () => {
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
