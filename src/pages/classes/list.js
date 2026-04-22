import React, { Component } from "react";
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

class ClassesManagement extends Component {
  state = {
    classes: [],
    teachers:[],
    filteredClasses:[],
    loading: true,
    currentPage: 1,
    itemsPerPage: 20
  };
  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      const classes = Data.classes.list();
      const teachers = Data.teachers.list();
      
      this.setState({ 
        classes, 
        filteredClasses: classes, 
        teachers,
        loading: false 
      });

      Data.classes.subscribe(({ classes }) => {
        this.setState({ classes, filteredClasses: classes, loading: false });
      });

      Data.teachers.subscribe(({ teachers }) => {
        this.setState({ teachers });
      });
    } catch (error) {
      console.error("Failed to load classes:", error);
      this.setState({ loading: false });
    }
  };

  onSearch = e => {
    const { classes } = this.state
    const filteredClasses = classes.filter(Iclass => Iclass.name.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredClasses })
  }

  render() {
    const { 
      classes, 
      teachers, 
      filteredClasses, 
      loading, 
      currentPage, 
      itemsPerPage 
    } = this.state;
    
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedClasses = filteredClasses.slice(startIndex, startIndex + itemsPerPage);
    
    return (
      <div className="container-fluid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Classes</h3>
            <div className="card-tools ml-auto">
              <button 
                className="btn btn-outline-primary btn-xs mr-2"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={() => uploadModalInstance.show()}
              >
                <i className="fas fa-upload"></i> Upload
              </button>
              <button 
                className="btn btn-outline-primary btn-xs"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={() => addModalInstance.show()}
              >
                <i className="fas fa-plus"></i> Add Class
              </button>
            </div>
          </div>
          
          <div className="card-body">
            {/* Search */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search classes..."
                    onChange={this.onSearch}
                    id="generalSearch"
                  />
                </div>
              </div>
            </div>
            
            {/* Classes Table */}
            {loading ? (
              <div className="text-center py-4">
                <i className="fas fa-spinner fa-spin"></i> Loading...
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Number of Students</th>
                      <th>Teacher</th>
                      <th>Parent Details</th>
                      <th>Fee Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClasses.map(cls => (
                      <tr key={cls.id}>
                        <td>{cls.name}</td>
                        <td>
                          <span className="badge badge-info">
                            {cls.students ? cls.students.length : 0} students
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const teacher = teachers.find(t => t.id === cls.teacher || (cls.teacher && typeof cls.teacher === 'object' && t.id === cls.teacher.id));
                            return teacher ? (
                              <span className="badge badge-success">
                                {teacher.name}
                              </span>
                            ) : (
                              <span className="badge badge-secondary">
                                No teacher assigned
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {cls.students && cls.students.length > 0 ? (
                            <div>
                              {cls.students.slice(0, 2).map((student, idx) => (
                                <div key={idx} className="small text-muted mb-1">
                                  {student.parent ? (
                                    <span>
                                      <i className="fas fa-user-friends"></i> {student.parent.name}
                                      {student.parent.phone && (
                                        <span className="ml-1">
                                          <a href={`tel:${student.parent.phone}`} className="text-primary">
                                            <i className="fas fa-phone"></i>
                                          </a>
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-muted">No parent info</span>
                                  )}
                                </div>
                              ))}
                              {cls.students.length > 2 && (
                                <div className="small text-muted">
                                  +{cls.students.length - 2} more parents
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-light text-muted">
                              No students enrolled
                            </span>
                          )}
                        </td>
                        <td>
                          {cls.feeAmount ? (
                            <span className="badge badge-primary">
                              ${cls.feeAmount}
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              No fee set
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-info mr-1"
                            onClick={() => {
                              this.setState({ edit: cls }, () => {
                                editModalInstance.show();
                              });
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              this.setState({ remove: cls }, () => {
                                deleteModalInstance.show();
                              });
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredClasses.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    No classes found. Add your first class to get started.
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => this.setState({ currentPage: currentPage - 1 })}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => this.setState({ currentPage: i + 1 })}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => this.setState({ currentPage: currentPage + 1 })}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
        
        {/* Modals */}
        <AddModal teachers={teachers} save={Iclass => Data.classes.create(Iclass)} />
        <UploadModal save={classes=> classes.forEach(Iclass => Data.classes.create(Iclass))} />
        <DeleteModal
          remove={this.state.remove}
          save={Iclass => Data.classes.delete(Iclass)}
        />
        <EditModal
          teachers={teachers}
          edit={this.state.edit}
          save={Iclass => Data.classes.update(Iclass)}
        />
      </div>
    );
  }
}

export default ClassesManagement;
