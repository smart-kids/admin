import React from "react";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import TimeTableMatrix from "./matrix";

class TimeTablesIndex extends React.Component {
  render() {
    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />

          <div
            className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor pt-0"
            style={{ minHeight: "100vh" }}
            id="kt_content"
          >
            <div className="kt-container kt-grid__item kt-grid__item--fluid pt-0">
              <TimeTableMatrix />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TimeTablesIndex;
