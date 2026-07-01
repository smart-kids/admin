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
    padding: "0 10px",
    zIndex: 999999, // Ensure it sits on top globally
    height: "22px",
    fontSize: "11px"
  };

  return (
    <div style={footerStyle}>
      <div>ShulePlus</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <NetworkDebugOverlay />
        v{process.env.REACT_APP_VERSION || '1.0.0'}
      </div>
    </div>
  );
};

export default withRouter(Footer);
