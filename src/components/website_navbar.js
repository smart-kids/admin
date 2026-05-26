import React from "react";
import { Link } from "react-router-dom";

// Access app globally to avoid ES modules conflict
let app = null;
const KTUtil = window.KTUtil
const KTOffcanvas = window.KTOffcanvas

class Navbar extends React.Component {
  componentDidMount() {
    // window.KTLayout.init();
    // Safely initialize app from global scope
    app = window.app || window.KTApp;
    if (app && typeof app.init === 'function') {
      app.init();
    }

    var profilePanel = KTUtil.get('kt_offcanvas_toolbar_profile');
    var head = KTUtil.find(profilePanel, '.kt-offcanvas-panel__head');
    var body = KTUtil.find(profilePanel, '.kt-offcanvas-panel__body');

    var offcanvas = new KTOffcanvas(profilePanel, {
      overlay: true,
      baseClass: 'kt-offcanvas-panel',
      closeBy: 'kt_offcanvas_toolbar_profile_close',
      toggleBy: 'kt_offcanvas_toolbar_profile_toggler_btn'
    });

    KTUtil.scrollInit(body, {
      disableForMobile: true,
      resetHeightOnDestroy: true,
      handleWindowResize: true,
      height: function () {
        var height = parseInt(KTUtil.getViewPort().height);

        if (head) {
          height = height - parseInt(KTUtil.actualHeight(head));
          height = height - parseInt(KTUtil.css(head, 'marginBottom'));
        }

        height = height - parseInt(KTUtil.css(profilePanel, 'paddingTop'));
        height = height - parseInt(KTUtil.css(profilePanel, 'paddingBottom'));

        return height;
      }
    });

    var _this = this
    window.fbAsyncInit = function () {
      console.log("env", process.env)
      /*global FB*/
      FB.init({
        appId: "388407632531072",
        cookie: true,
        xfbml: true,
        version: 'v2.7'
      });

      /*global FB*/
      FB.AppEvents.logPageView();
    };

  }
  state = {
    profileShowing: false,
    userData: JSON.parse(localStorage.getItem("user")),
    buses: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    social_logged_in: false,
    social_profile_pic: "",
    social_name: ""
  };
  render() {
    return (
      <div
        id="kt_header"
        className="kt-header kt-grid__item kt-grid kt-grid--ver  kt-header--fixed "
      >
        {/* begin:: Brand */}
        <div className="kt-header__brand   kt-grid__item" id="kt_header_brand">
          <Link to="/home">
            <img
              alt="Logo"
              style={{ width: 150 }}
              src="/assets/media/logos/logo-v5.png"
            />
          </Link>
        </div>
        {/* end:: Brand */}

        {/* begin: Header Menu */}

        <div
          className="kt-header-menu-wrapper kt-grid__item"
          id="kt_header_menu_wrapper"
        >
          <div
            id="kt_header_menu"
            className="kt-header-menu kt-header-menu-mobile "
          >
            <ul className="kt-menu__nav ">

            
              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/home" className="kt-menu__link">
                  <span className="kt-menu__link-text">Our Platform</span>
                </Link>



              </li>



              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/home" className="kt-menu__link">
                  <span className="kt-menu__link-text">Contact Us</span>
                </Link>
              </li>


              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/register" className="kt-menu__link">
                  <span className="kt-menu__link-text">Join Us</span>
                </Link>
              </li>


              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/auth" className="kt-menu__link">
                  <span className="kt-menu__link-text">Sign In</span>
                </Link>
              </li>

            </ul>
          </div>
        </div>
        {/* end: Header Menu */} {/* begin:: Header Topbar */}
        {/* <div
          className="kt-header-menu-wrapper kt-grid__item"
          id="kt_header_menu_wrapper"
        >
          <div
            id="kt_header_menu"
            className="kt-header-menu kt-header-menu-mobile "
          >
            <ul className="kt-menu__nav ">
              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/register" className="kt-menu__link">
                  <span className="kt-menu__link-text">Sign up</span>
                </Link>
              </li>
            </ul>

            <ul className="kt-menu__nav ">
              <li
                className="kt-menu__item  kt-menu__item--submenu kt-menu__item--rel"
                data-ktmenu-submenu-toggle="click"
                aria-haspopup="true"
              >
                <Link to="/auth" className="kt-menu__link">
                  <span className="kt-menu__link-text">Sign in</span>
                </Link>
              </li>
            </ul>
          </div>
        </div> */}



        <div id="kt_header_mobile" className="kt-header-mobile  kt-header-mobile--fixed ">
          <div className="kt-header-mobile__logo">
            <Link to="/results">
              <img
                alt="Logo"
                style={{ width: 150, filter: 'invert(100 %)' }}
                src="/assets/media/logos/logo-v6.png"
              />
            </Link>
          </div>
          <div className="kt-header-mobile__toolbar">
            <button className="kt-header-mobile__toolbar-toggler" id="kt_header_mobile_toggler"><span /></button>
            <button className="kt-header-mobile__toolbar-topbar-toggler" id="kt_header_mobile_topbar_toggler"><i className="flaticon-more" /></button>
          </div>
        </div>

        {/* {this.state.profileShowing ? <div className="kt-offcanvas-panel-overlay" /> : null} */}

        {/* fancy profile */}
      </div>
    );
  }
}

export default Navbar;
