import React from "react";
import NetworkDebugOverlay from "./NetworkDebugOverlay";
import { withRouter } from "react-router-dom";

const Footer = ({ location }) => {
  const hiddenPaths = ['/', '/register', '/recover', '/auth', '/quick-topup', '/website'];
  
  if (location && hiddenPaths.includes(location.pathname)) {
    return null;
  }

  const footerStyle = {
    position: "fixed",
    left: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#333",
    color: "white",
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 15px",
    zIndex: 999999, // Ensure it sits on top globally
    height: "35px"
  };

  return (
    <div style={footerStyle}>
      <div>ShulePlus</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <NetworkDebugOverlay />
        v1.3.1 (Staging)
      </div>
    </div>
  );
};

export default withRouter(Footer);
