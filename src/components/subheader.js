import React from "react";
import { withRouter } from "react-router";
import Data from "../utils/data";

const MIN_BALANCE = 300;
// These heights are for the elements themselves, not for fixed positioning calculations here.
const BREADCRUMB_SUBHEADER_HEIGHT = 50; // Approx. height for Metronic subheader
const NOTIFICATION_BAR_HEIGHT = 45;    // Height for the notification bar

class Subheader extends React.Component {
  state = {
    selectedSchool: {},
  };

  componentDidMount() {
    const school = Data.schools.getSelected();
    this.setState({ selectedSchool: school || {} });

    Data.schools.subscribe(({ selectedSchool: newSelectedSchool, schools }) => {
      // Ensure selectedSchool is always an object, even if null/undefined from subscribe
      this.setState({
        selectedSchool: newSelectedSchool || (schools && schools.length > 0 ? schools[0] : {}),
      });
    });
  }

  render() {
    const { links, actions } = this.props;
    const { selectedSchool } = this.state;

    const showBreadcrumbs = links && links.length > 0;
    // Ensure selectedSchool and selectedSchool.financial exist before accessing balance
    const showLowBalanceNotification =
      selectedSchool &&
      selectedSchool.financial &&
      typeof selectedSchool.financial.balance === 'number' && // Make sure balance is a number
      selectedSchool.financial.balance < MIN_BALANCE && false; // Disabled as requested

    if (!showBreadcrumbs && !showLowBalanceNotification) {
      return null; // Render nothing if there's nothing to show
    }

    return (
      // This wrapper div is part of the normal document flow.
      // It will appear after the padding applied by MainLayout for the fixed navbars.
      <div
        style={{
          paddingLeft: "25px", // Standard Metronic container horizontal padding
          paddingRight: "25px",
          marginTop: "20px", // This creates the space "slightly below" the fixed nav area
        }}
      >
        {/* Low Balance Notification - Rendered first for prominence */}
        {showLowBalanceNotification && (
          <div
            id="kt_subheader_notification" // Unique ID
            // Re-using kt-subheader for some very basic grid/item structure if Metronic CSS provides it.
            // Otherwise, it's mostly custom styled.
            className="kt-subheader kt-grid__item"
            style={{
              height: `${NOTIFICATION_BAR_HEIGHT}px`,
              backgroundColor: "#FA064B", // Vibrant red
              color: "white",
              display: "flex",
              alignItems: "center",
              borderRadius: "8px", // Rounded corners
              padding: "0 20px", // Internal horizontal padding
              marginBottom: showBreadcrumbs ? "20px" : "0", // Space below if breadcrumbs follow
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", // Subtle shadow
            }}
          >
            {/*
              Using kt-container--fluid ensures the content within respects Metronic's fluid width.
              Removed explicit padding from here as the bar itself has padding.
            */}
            <div className="kt-container kt-container--fluid" style={{padding: 0}}>
              <div
                // Using kt-subheader__main for potential Metronic flex alignment,
                // but overriding to ensure space-between works well.
                className="kt-subheader__main"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  flexWrap: "wrap", // Allow wrapping for mobile
                }}
              >
                <div
                  className="kt-subheader__title" // Using for semantic grouping
                  style={{
                    color: "white",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    marginRight: '15px',
                    marginBottom: '15px', // Add margin below for mobile
                  }}
                >
                  Your account balance is currently below KSH {MIN_BALANCE},
                  please top up your account to avoid service disruption.
                </div>
                <div className="kt-subheader__toolbar"> {/* For button alignment */}
                  <button
                    onClick={() =>
                      this.props.history.push({
                        pathname: "/finance/topup",
                        // search: "?" + new URLSearchParams({ popup: true }).toString(),
                      })
                    }
                    className="btn btn-sm btn-light" // Light button for contrast on red
                    style={{
                      fontWeight: "bold",
                      whiteSpace: 'nowrap',
                      width: '100%', // Take full width for mobile
                    }}
                  >
                    Top Up Using Mpesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb Subheader */}
        {showBreadcrumbs && (
          <div
            id="kt_subheader" // Standard Metronic ID
            className="kt-subheader kt-grid__item"
            style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "15px 0" }}
          >
            <div className="kt-container kt-container--fluid">
              <div className="kt-subheader__main d-flex justify-content-between align-items-center">
                <div className="kt-subheader__title">
                  <div className="kt-subheader__breadcrumbs">
                    {links.map((link, index) => (
                      <React.Fragment key={link + index}>
                        <span className="kt-subheader__breadcrumbs-separator">
                          {index !== 0 && (
                            <i className="flaticon2-arrow-head1" />
                          )}
                        </span>
                        <span className="kt-subheader__breadcrumbs-link">
                          <a
                            href="#" // Should be real links or router Links
                            onClick={(e) => e.preventDefault()} // Prevent default for placeholder
                            className={`kt-link kt-link--white ${
                              index === 0
                                ? "kt-subheader__breadcrumbs-link--home"
                                : ""
                            }`}
                          >
                            {link}
                          </a>
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {actions && (
                  <div className="kt-subheader__toolbar">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Subheader);