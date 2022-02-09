import React from "react";
import './login.css'
import { Link } from "react-router-dom";
import axios from "axios"
import { API } from "../../utils/requests"
import Data from "../../utils/data";
import GoogleLogin from 'react-google-login';
import {onLoginSuccess, onLoginFailure, clientId}from "./googlelogin";


import { FacebookLoginButton, MicrosoftLoginButton, GoogleLoginButton, TwitterLoginButton } from "react-social-login-buttons";
// import $ from 'jquery'
const toastr = window.toastr;
toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut"
};

class Login extends React.Component {
    state = {
        user: "",
        password: "",
        phone_number: false,
        otp: false,
        error: ""
    }
    async FacebookLogin() {
        var _this = this
        /*global FB*/
        FB.login(function (response) {
            if (response.authResponse) {
                console.log('Welcome!  Fetching your information.... ');
                /*global FB*/
                FB.api('/me', function (response) {
                    console.log(response)
                    console.log('Good to see you, ' + response.name + '.');

                    _this.setState({
                        social_logged_in: true,
                        social_profile_pic: `https://graph.facebook.com/${response.id}/picture?type=normal`,
                        social_profile_id: response.id,
                        social_name: response.name
                    })
                });
            } else {
                alert('User cancelled login or did not fully authorize.');
            }
        });
    }
    async sendLoginCode() {
        // fetch
        const { user, password } = this.state
        try {
            const res = await axios.post(`${API}/auth/login`, {
                user
            })

            toastr.success("Sweet", "OPT code has been sent,please check your phone");
            this.setState({ otp: true })
        } catch (err) {
            toastr.warning("Sending your OTP failed", err.message);
            this.setState({ otp: false })
        }
    }
    async validateOtpCode() {
        const _this = this
        const { user, password } = this.state
        try {
            const res = await axios.post(`${API}/auth/verify/sms`, {
                user,
                password
            })

            toastr.success("Verification successfull", "Sweet");
            this.setState({ otp: true })

            setTimeout(function () {
                const { data: { token, data } } = res

                localStorage.setItem("authorization", token)
                localStorage.setItem("user", JSON.stringify(data))

                Data.init()

                return _this.props.history.push({
                    pathname: '/trips/all'
                })
            }, 2000)

        } catch (err) {
            console.log(err)
            toastr.warning("OTP verification failed", err.message);
            this.setState({ otp: false })
        }
    }
    MicrosoftLogin() {
        alert("MicrosoftLoginButton")
    }
    GoogleLogin() {

        alert("GoogleLoginButton")
    }
    TwitterLogin() {
        alert("TwitterLoginButton")
    }
    componentDidMount() {
 
        var _this = this
        // window.fbAsyncInit = function () {
        //     console.log("env", process.env)
        //     /*global FB*/
        //     FB.init({
        //         appId: "388407632531072",
        //         cookie: true,
        //         xfbml: true,
        //         version: 'v2.7'
        //     });

        //     /*global FB*/
        //     FB.AppEvents.logPageView();
        // };


        if (localStorage.getItem("authorization"))
            return _this.props.history.push({
                pathname: '/trips/all'
            })

        this.validator = window.$("#login").validate({
            errorClass: "invalid-feedback",
            errorElement: "div",

            highlight: function (element) {
                window.$(element).addClass("is-invalid");
            },
            
            unhighlight: function (element) {
                window.$(element).removeClass("is-invalid");
            },

            async submitHandler(form, event) {
                event.preventDefault();
                try {
                    const { user, password } = _this.state
                    const res = await axios.post(`${API}/auth/login`, {
                        user,
                        password,
                    })

                    const { data: { token, data } } = res

                    localStorage.setItem("authorization", token)
                    localStorage.setItem("user", JSON.stringify(data))

                    Data.init()

                    return _this.props.history.push({
                        pathname: '/trips/all'
                    })
                } catch (err) {
                    console.log({ err })
                    if (err && !err.response && !err.response.data)
                        _this.setState({ error: err.message })

                    _this.setState({ error: err.response.data.message })
                }
            }
        });
    }
  
    render() {
        return (
            <div>
                {/* begin:: Page */}
                <div className="kt-grid kt-grid--ver kt-grid--root">
                    {/* <div className="kt-grid__item   kt-grid__item--fluid kt-grid  kt-grid kt-grid--hor kt-login-v2" id="kt_login_v2">
                   
                        <div className="kt-grid__item  kt-grid  kt-grid--ver  kt-grid__item--fluid">
                            <div className="kt-login-v2__body" style={{
                                display: "flex"
                            }}>

                                <div className="container h-100" style={{ "marginTop": "20vh" }}>
                                    <div className="row h-100 justify-content-center align-items-center">
                                        <form className="col-12">
                                            <div className="form-group">
                                                <FacebookLoginButton onClick={() => this.FacebookLogin()} />
                                            </div>
                                           
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div> */}
                    <div className="kt-grid__item   kt-grid__item--fluid kt-grid  kt-grid kt-grid--hor kt-login-v2" id="kt_login_v2">
                        {/*begin::Item*/}
                        <div className="kt-grid__item  kt-grid  kt-grid--ver  kt-grid__item--fluid">
                            {/*begin::Body*/}
                            <div className="kt-login-v2__body">
                                <div className="kt-login-v2__wrapper">
                                    <div className="kt-login-v2__container" style={{ "marginTop": "20vh" }}>
                                        <img className="text-center row mx-auto justify-content-center align-items-center flex-column" src="designs/bus_logo.png" style={{ "marginTop": "5vh" }} width="30%"></img>

                                        <div className="kt-login-v2__title">
                                            <h3>Login to your account.</h3>
                                        </div>
                            
                                        <div className="g-signin">
                                        <GoogleLogin
                                                    clientId={clientId}
                                                    buttonText="Login With Google"
                                                    onSuccess={onLoginSuccess}
                                                    onFailure={onLoginFailure}
                                                    cookiePolicy={'single_host_origin'}
                     />
                                        </div>
                                        <div className="kt-login-v2__title">
                                            <h3>or use your email to sign in:</h3>
                                        </div>
                                        {/*begin::Form*/}
                                        <form id="login" className="kt-login-v2__form kt-form" action="true" autoComplete="off">
                                            {this.state.error ? <div className="alert alert-danger">
                                                <div className="alert-text">{this.state.error}</div>
                                            </div> : null}


                                            {
                                                this.state.phone_number
                                                    ? (<div className="row">
                                                        <div className="col-8">
                                                            <div className="form-group">
                                                                <input value={this.state.user} onChange={(e) => this.setState({ user: e.target.value })} className="form-control" type="text" placeholder="Username or Phone Number" name="username" autoComplete="off" required={true} />
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <button type="button" onClick={() => this.sendLoginCode()} className="btn btn-brand btn-elevate btn-pill" >Send Code</button>
                                                        </div>
                                                    </div>)
                                                    : (<div className="form-group">
                                                        <input value={this.state.user} onChange={(e) => {
                                                            const _this = this
                                                            this.setState({ user: e.target.value })

                                                            let re = new RegExp('^0(7(?:(?:[129][0-9])|(?:0[0-8])|(4[0-1]))[0-9]{6})$');

                                                            function testInfo(phoneInput) {
                                                                var OK = re.exec(phoneInput.value);
                                                                if (!OK) {
                                                                    // console.warn(phoneInput.value + ' isn\'t a phone number with area code!');
                                                                } else {
                                                                    // console.log('Thanks, your phone number is ' + OK[0]);
                                                                    _this.setState({ phone_number: true })
                                                                }
                                                            }

                                                            testInfo(e.target)

                                                        }} className="form-control" type="text" placeholder="Username or Phone Number" name="username" autoComplete="off" required={true} />
                                                    </div>)
                                            }
                                            <div className="form-group">
                                                {
                                                    !this.state.otp
                                                        ? <input onChange={(e) => this.setState({ password: e.target.value })} className="form-control" type="password" placeholder="Password" name="password" autoComplete="off" required={true} />
                                                        : <input onChange={(e) => this.setState({ password: e.target.value })} className="form-control" type="text" placeholder="Enter OTP Code here ie XXXXX" name="password" autoComplete="off" required={true} />
                                                }
                                            </div>
                                            {/*begin::Action*/}
                                            <div className="kt-login-v2__actions">
                                                <Link to="/recover" className="kt-link kt-link--brand">
                                                    <span className="kt-menu__link-text">Forgot Password ?</span>
                                                </Link>
                                                                                               
                                                {
                                                    !this.state.otp
                                                        ? <button type="submit" className="btn btn-brand btn-elevate btn-pill btn-sm" >Sign In</button>
                                                        : <button type="button" onClick={() => this.validateOtpCode()} className="btn btn-brand btn-elevate btn-pill btn-sm" >Confirm Code</button>
                                                }

                                            </div>                                

                                            {/*end::Action*/}
                                        </form>
                                        {/*end::Form*/}
                                        {/*begin::Options*/}
                                        {/*end::Options*/}
                                    </div>
                                </div>
                            </div>

                            {/*end::Wrapper*/}
                            {/* </div> */}
                            {/*begin::Body*/}
                        </div>
                        {/*end::Item*/}

                    </div>
                </div>
                {/* end:: Page */}
                {/* begin:: Aside */}
                <div className="kt-aside  kt-aside--fixed " id="kt_aside">
                    <div className="kt-aside__head">
                        <h3 className="kt-aside__title">
                            Dashboard
                </h3>
                        <a href="#" className="kt-aside__close" id="kt_aside_close"><i className="flaticon2-delete" /></a>
                    </div>
                    <div className="kt-aside__body">
                        {/* begin:: Aside Menu */}
                        <div className="kt-aside-menu-wrapper" id="kt_aside_menu_wrapper">
                            <div id="kt_aside_menu" className="kt-aside-menu " data-ktmenu-vertical={1} data-ktmenu-scroll={1}>
                                <ul className="kt-menu__nav ">
                                    <li className="kt-menu__section kt-menu__section--first">
                                        <h4 className="kt-menu__section-text">My Actions</h4>
                                        <i className="kt-menu__section-icon flaticon-more-v2" />
                                    </li><li className="kt-menu__item  kt-menu__item--active" aria-haspopup="true"><a href="#" className="kt-menu__link "><span className="kt-menu__link-text">Vendors To Approve</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><span className="kt-menu__link-text">Pending Vendors</span></a></li><li className="kt-menu__item  kt-menu__item--submenu" aria-haspopup="true" data-ktmenu-submenu-toggle="hover"><a href="javascript:;" className="kt-menu__link kt-menu__toggle"><span className="kt-menu__link-text">Active Vendors</span><i className="kt-menu__ver-arrow la la-angle-right" /></a><div className="kt-menu__submenu "><span className="kt-menu__arrow" /><ul className="kt-menu__subnav"><li className="kt-menu__item  kt-menu__item--parent" aria-haspopup="true"><span className="kt-menu__link"><span className="kt-menu__link-text">Active Vendors</span></span></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Vendors Dashboard</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Vendors Revenue</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Sales Reports</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Transactions</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Statements</span></a></li></ul></div></li><li className="kt-menu__section ">
                                        <h4 className="kt-menu__section-text">Vendor Reports</h4>
                                        <i className="kt-menu__section-icon flaticon-more-v2" />
                                    </li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><span className="kt-menu__link-text">Statements</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><span className="kt-menu__link-text">Transactions</span></a></li><li className="kt-menu__item  kt-menu__item--submenu" aria-haspopup="true" data-ktmenu-submenu-toggle="hover"><a href="javascript:;" className="kt-menu__link kt-menu__toggle"><span className="kt-menu__link-text">Archive</span><i className="kt-menu__ver-arrow la la-angle-right" /></a><div className="kt-menu__submenu "><span className="kt-menu__arrow" /><ul className="kt-menu__subnav"><li className="kt-menu__item  kt-menu__item--parent" aria-haspopup="true"><span className="kt-menu__link"><span className="kt-menu__link-text">Archive</span></span></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Base</span></a></li><li className="kt-menu__item " aria-haspopup="true"><a href="#" className="kt-menu__link "><i className="kt-menu__link-bullet kt-menu__link-bullet--dot"><span /></i><span className="kt-menu__link-text">Draggable</span></a></li></ul></div></li><li className="kt-menu__item " aria-haspopup="true"><a href="javascript:;" className="kt-menu__link "><span className="kt-menu__link-text">Invoices</span></a></li>				</ul>
                            </div>
                        </div>
                        {/* end:: Aside Menu */}
                    </div>
                </div>
                {/* end:: Aside */}
            </div>
        );
    }
}

export default Login;
