import React from "react";

import Table from "./components/table";
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "../settings/school/components/edit_school_details";
import DeleteModal from "./delete";
import InviteModal from "./invite";
import Data from "../../utils/data";
import SuccessMessage from "./components/success-toast";
import ErrorMessage from "./components/error-toast";

const $ = window.$;
const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();
const ISuccessMessage = new SuccessMessage();
const IErrorMessage = new ErrorMessage();
const inviteModalInstance = new InviteModal();

function keepOnlyKeys(obj, keysToKeep) {
  if (!obj || typeof obj !== 'object') return {};
  return Object.keys(obj)
    .filter(key => keysToKeep.includes(key))
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

class BasicTable extends React.Component {
  state = {
    schoolToInvite: {},
    admin: false,
    remove: {},
    schoolToEdit: "",
    selectedSchool: "",
    schools: [],
    filteredSchools: []
  };

  componentDidMount() {
    let user = localStorage.getItem('user');
    user = JSON.parse(user);
    if (user?.admin?.user === 'Super Admin') {
      this.setState({ admin: true });
    }

    const schools = Data.schools.list();
    this.setState({ schools, filteredSchools: schools });

    Data.schools.subscribe(({ schools }) => {
      this.setState({ schools, filteredSchools: schools });
    });
  }

  onSearch = e => {
    const { schools } = this.state
    const filteredSchools = schools.filter(school => school.name.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredSchools })
  }

  sendInvite = async (school) => {
    try {
      const data = {};
      Object.assign(data, {
        id: this.state.schoolToInvite.id,
        name: this.state.schoolToInvite.name,
        email: this.state.schoolToInvite.email,
        phone: this.state.schoolToInvite.phone,
        address: this.state.schoolToInvite.address,
      });

      await Data.schools.invite(data);
      ISuccessMessage.show();
    } catch (error) {
      throw new Error(error.message)
    }
  }

  createSchool = async (school) => {
    try {
      await Data.schools.create(school);
      ISuccessMessage.show({ message: "School has been created successfuly!", header: "Create School" });
    } catch (error) {
      throw new Error(error.message)
    }
  }

  editSchool = async (school) => {
    try {
      const validSchoolFields = ['id', 'name', 'phone', 'email', 'localStorage', 'themeColor', 'address', 'inviteSmsText', 'gradeOrder', 'termOrder'];
      const filteredSchoolData = keepOnlyKeys(school, validSchoolFields);
      await Data.schools.update(filteredSchoolData);
      ISuccessMessage.show({ message: "School has been updated successfuly!", header: "Edit School" });
    } catch (error) {
      throw new Error(error.message)
    }
  }

  deleteSchool = async (school) => {
    console.dir(Data.schools);
    try {
      await Data.schools.delete(school);
      ISuccessMessage.show({ message: "School has been deleted successfuly!", header: "Delete School" });
    } catch (error) {
      throw new Error(error.message)
    }
  }

  restoreSchool = async (school) => {
    try {
      await Data.schools.restore(school);
      ISuccessMessage.show({ message: "School has been restored successfuly!", header: "Restore School" });
    } catch (error) {
      throw new Error(error.message)
    }
  }

  render() {
    const { edit, schoolToInvite, remove, schools, filteredSchools, admin } = this.state;
    return (
      <div className="kt-quick-panel--right kt-demo-panel--right kt-offcanvas-panel--right kt-header--fixed kt-header-mobile--fixed kt-aside--enabled kt-aside--left kt-aside--fixed kt-aside--offcanvas-default kt-page--loading">
        <div className="kt-grid kt-grid--hor kt-grid--root">
          <div className="kt-portlet kt-portlet--mobile">
            <AddModal save={school => this.createSchool(school)} />
            <UploadModal user={this.user} save={schools => schools.forEach(school => Data.schools.create(school))} />
            <DeleteModal remove={remove} delete={school => this.deleteSchool(school)} />
            <InviteModal school={schoolToInvite} invite={() => this.sendInvite()} />
            <EditModal edit={edit} save={school => this.editSchool(school)} />
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
                    label: "School Names",
                    key: "name"
                  },
                  {
                    label: "Phone",
                    key: "phone"
                  },
                  {
                    label: "Email",
                    key: "email"
                  },
                  {
                    label: "Address",
                    key: "address"
                  }
                ]}
                data={this.state.filteredSchools}
                edit={school => {
                  this.setState({ edit: school }, () => {
                    editModalInstance.show();
                  });
                }}
                delete={school => {
                  this.setState({ remove: school }, () => {
                    deleteModalInstance.show();
                  });
                }}
                restore={school => {
                  this.restoreSchool(school);
                }}
                invite={school => {
                  this.setState({ schoolToInvite: school }, () => {
                    inviteModalInstance.show();
                  })
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
