import React from "react";
import moment from "moment"
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import Footer from "../../components/footer";
import Stat from "./components/stat";
import Tutorials from "./components/tutorials";
import Questions from "./components/common-questions";
import Map from "./components/map";
import ProfilePanel from "../../components/profile-panel";
import Data from "../../utils/data";
import List from "../trips/list";
import OnboardingGuide from "./components/OnboardingGuide";

class Home extends React.Component {
  state = {
    trips: [],
    locations: [],
    schedules: [],
    complaints: [],
    students: 0,
    isSchoolEmpty: false,
    selectedSchoolContext: null
  };
  componentDidMount() {
    const trips = Data.trips.list();
    this.setState({ trips });

    // console.log(trips)
    // map points
    const locations = [];
    trips.map(trip => {
      trip.locReports.map(report => locations.push(report))
    })

    this.setState({ locations })

    const complaints = Data.complaints.list();
    this.setState({ complaints });

    Data.trips.subscribe(({ trips }) => {
      const students = trips
        .filter(trip => !trip.completedAt && !trip.isCancelled)
        .reduce((acc, trip) => {
          if (trip.schedule)
            return (acc += trip.schedule.route.students.length);
        }, 0);

      this.setState(Object.assign({ trips }, { students }));

      // map points
      const locations = [];
      this.state.trips.map(trip => {
        trip.locReports.map(report => locations.push(report))
      })
      this.setState({ locations })
    });

    const schedules = Data.schedules.list();
    this.setState({ schedules });

    Data.schedules.subscribe(schedules => {
      this.setState(schedules);
    });

    const checkEmptyState = () => {
        const schoolsData = Data.schools.list() || [];
        const schoolId = localStorage.getItem('school');
        const selectedSchool = schoolsData.find(s => String(s.id) === String(schoolId)) || {};
        
        const studentsList = Data.students.list() || [];
        const parentsList = Data.parents.list() || [];
        
        const hasStudents = selectedSchool.studentsCount > 0 || studentsList.length > 0;
        const hasParents = selectedSchool.parentsCount > 0 || parentsList.length > 0;
        
        this.setState({
            selectedSchoolContext: selectedSchool,
            isSchoolEmpty: !hasStudents && !hasParents
        });
    };

    Data.schools.subscribe(checkEmptyState);
    Data.students.subscribe(checkEmptyState);
    Data.parents.subscribe(checkEmptyState);
    checkEmptyState();

  }
  render() {

    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />
          <Subheader links={["Home"]} />

          <div
            className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
            style={{ height: "100vh" }}
            id="kt_content"
          >
            <div className="kt-container  kt-grid__item kt-grid__item--fluid">
              <div className="row">
                {/* <div className="col-lg-6 col-xl-8 order-lg-1 order-xl-1">
                  <div className="row">
                    <div
                      className="col-lg-12 col-xl-12 order-lg-1 order-xl-1"
                      style={{ height: "460px" }}
                    >
                      {this.state.locations[0] ? <Map locations={this.state.locations} height={'420px'} /> : "no locations registered yet"}
                      
                    </div>
                  </div>
                </div> */}

                <div className="col-lg-12 col-xl-12 order-lg-1 order-xl-1">
                  {this.state.isSchoolEmpty ? (
                      <OnboardingGuide schoolMeta={this.state.selectedSchoolContext} />
                  ) : (
                      <List filter={this.props.match.params.filter} />
                  )}
                </div>

              </div>
            </div>
          </div>
          <Footer />
        </div>
        <ProfilePanel />
      </div>
    );
  }
}

export default Home;
