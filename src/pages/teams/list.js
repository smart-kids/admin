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
const school = localStorage.getItem("school");

class BasicTable extends React.Component {
  state = {
    teamToDelete: {},
    teamToEdit: {},
    teams: [],
    filteredTeams:[]
  };
  componentDidMount() {
    const teams = Data.teams.list();
    console.log(teams)
    this.setState({ teams, filteredTeams: teams });

    Data.teams.subscribe(({ teams }) => {
      this.setState({ teams, filteredTeams: teams });
    });
  }

  onSearch = e => {
    const { teams } = this.state
    const filteredTeams = teams.filter(team => team.name.toLowerCase().match(e.target.value.toLowerCase()))
    this.setState({ filteredTeams })
  }

  render() {
    const { teamToEdit, teamToDelete } = this.state;
    return (
      <div className="kt-quick-panel--right kt-demo-panel--right kt-offcanvas-panel--right kt-header--fixed kt-header-mobile--fixed kt-aside--enabled kt-aside--left kt-aside--fixed kt-aside--offcanvas-default kt-page--loading">
        <div className="kt-grid kt-grid--hor kt-grid--root">
          <div className="kt-portlet kt-portlet--mobile">
            <AddModal school={school} save={team => Data.teams.create(team)} />
            <UploadModal save={team => team.forEach(team => Data.teams.create(team))} />
            <DeleteModal teamToDelete={teamToDelete} delete={team => Data.teams.delete(team)}/>
            <EditModal teamToEdit={teamToEdit} update={team => Data.teams.update(team)}/>
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
                    label: "Team Name",
                    key: "name"
                  },
                ]}
                data={this.state.filteredTeams}
                edit={team => {
                  this.setState({ teamToEdit: team }, () => {
                    editModalInstance.show();
                  });
                }}
                delete={team => {
                  this.setState({ teamToDelete: team }, () => {
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
