import React from "react";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import GamesList from "./list"; 
import Footer from "../../components/footer";
import ProfilePanel from "../../components/profile-panel";

class GamesPage extends React.Component {
  render() {
    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />
          <Subheader links={["Games", "Manage Games"]} />

          <div
            className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
            id="kt_content"
          >
            <div className="kt-container  kt-grid__item kt-grid__item--fluid">
              <GamesList />
            </div>
          </div>
          <Footer />
        </div>
        <ProfilePanel />
      </div>
    );
  }
}

export default GamesPage;
