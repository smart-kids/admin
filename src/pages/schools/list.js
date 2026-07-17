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
    isEditModalOpen: false,
    showDeleted: false,
    searchQuery: "",
    schools: [],
    filteredSchools: []
  };

  componentDidMount() {
    let user = localStorage.getItem('user');
    user = JSON.parse(user);
    if (user?.admin?.user === 'Super Admin') {
      this.setState({ admin: true });
    }

    this.unsubscribe = Data.schools.subscribe(({ schools }) => {
      this.setState({ schools }, () => {
        this.updateFilteredSchools();
      });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  onSearch = (query) => {
    this.setState({ searchQuery: query }, () => {
      this.updateFilteredSchools();
    });
  }

  updateFilteredSchools = () => {
    const { schools, searchQuery, showDeleted } = this.state;
    
    let filtered = schools;

    // 1. Filter by deleted status
    if (!showDeleted) {
      filtered = filtered.filter(s => !s.isDeleted);
    }

    // 2. Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    // 3. Sort by student numbers (highest to lowest)
    filtered.sort((a, b) => {
      const countA = parseInt(a.studentsCount || 0);
      const countB = parseInt(b.studentsCount || 0);
      return countB - countA;
    });

    this.setState({ filteredSchools: filtered });
  }

  onToggleDeleted = (e) => {
    this.setState({ showDeleted: e.target.checked }, () => {
      this.updateFilteredSchools();
    });
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
      const validSchoolFields = ['id', 'name', 'phone', 'email', 'localStorage', 'themeColor', 'address', 'schoolSize', 'schoolType', 'schoolLevel', 'numberOfStudents', 'logo', 'inviteSmsText', 'gradeOrder', 'termOrder', 'mpesaPaybill', 'ratePerStudent'];
      const filteredSchoolData = keepOnlyKeys(school, validSchoolFields);
      
      if (filteredSchoolData.numberOfStudents !== undefined && filteredSchoolData.numberOfStudents !== "") {
          filteredSchoolData.numberOfStudents = parseInt(filteredSchoolData.numberOfStudents, 10);
      } else {
          delete filteredSchoolData.numberOfStudents;
      }
      
      if (filteredSchoolData.ratePerStudent !== undefined && filteredSchoolData.ratePerStudent !== "") {
          filteredSchoolData.ratePerStudent = parseFloat(filteredSchoolData.ratePerStudent);
      } else {
          delete filteredSchoolData.ratePerStudent;
      }
      
      await Data.schools.update(filteredSchoolData);
      ISuccessMessage.show({ message: "School has been updated successfuly!", header: "Edit School" });
    } catch (error) {
      throw new Error(error.message)
    }
  }

  deleteSchool = async (school) => {
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
    const { edit, schoolToInvite, remove, filteredSchools } = this.state;
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
                    <div className="d-flex align-items-center">
                      <input
                        className="form-control mr-3"
                        type="text"
                        placeholder="Search schools..."
                        onChange={(e) => this.onSearch(e.target.value)}
                        style={{ width: '250px' }}
                      />
                      <div className="custom-control custom-switch">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="showDeletedToggle"
                          checked={this.state.showDeleted}
                          onChange={this.onToggleDeleted}
                        />
                        <label className="custom-control-label text-muted" htmlFor="showDeletedToggle" style={{ cursor: 'pointer' }}>
                          Show Deleted
                        </label>
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
                    label: "Students",
                    key: "studentsCount",
                    render: (val) => <span className="font-weight-bold text-primary">{val || 0}</span>
                  },
                  {
                    label: "Email",
                    key: "email"
                  },
                  {
                    label: "Address",
                    key: "address"
                  },
                  {
                    label: "Type",
                    key: "schoolType"
                  },
                  {
                    label: "Level",
                    key: "schoolLevel"
                  },
                  {
                    label: "Size",
                    key: "schoolSize"
                  },
                  {
                    label: "Students (Reg)",
                    key: "numberOfStudents"
                  },
                  ...(this.state.admin ? [{
                    label: "SaaS Amount",
                    key: "ratePerStudent",
                    render: (val) => val ? `KES ${val}` : "-"
                  }] : []),
                  {
                    label: "Status",
                    key: "isDeleted",
                    render: (val) => val ? <span className="badge badge-danger">Deleted</span> : <span className="badge badge-success">Active</span>
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
