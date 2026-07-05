import React from "react";
import Navbar from "../../../components/navbar";
import Subheader from "../../../components/subheader";
import List from "./expensesList";
import Footer from "../../../components/footer";

import Dashboard from "./dashboard";

class App extends React.Component {
  state = {
    activeTab: 'dashboard'
  };

  render() {
    const { activeTab } = this.state;
    return (
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
        <div
          className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
          id="kt_wrapper"
        >
          <Navbar />
          <Subheader links={["Finance", "Expense Management"]} />

          <div
            className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
            style={{minHeight:"100vh"}}
            id="kt_content"
          >
            <div className="kt-container  kt-grid__item kt-grid__item--fluid">
              <ul className="nav nav-tabs nav-tabs-line nav-tabs-line-brand" role="tablist">
                <li className="nav-item">
                  <a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => this.setState({activeTab: 'dashboard'})} href="#!" role="tab">
                    Dashboard
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${activeTab === 'list' ? 'active' : ''}`} onClick={() => this.setState({activeTab: 'list'})} href="#!" role="tab">
                    Expenses List
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div className={`tab-pane ${activeTab === 'dashboard' ? 'active' : ''}`} role="tabpanel">
                  {activeTab === 'dashboard' && <Dashboard isComponent={true} />}
                </div>
                <div className={`tab-pane ${activeTab === 'list' ? 'active' : ''}`} role="tabpanel">
                  {activeTab === 'list' && <List />}
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
