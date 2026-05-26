import React from "react";
import './website.css'
import { Link } from "react-router-dom";
import axios from "axios"
import { API } from "../../utils/requests"
import Data from "../../utils/data"

import Navbar from "../../components/website_navbar";
import Subheader from "../../components/subheader";

import Page from "./center_page"

const $ = window.$;

class Login extends React.Component {
    state = {
        user: "",
        password: "",
        error: undefined
    }
    componentDidMount() {
        const _this = this;
        this.validator = $("#login").validate({
            errorClass: "invalid-feedback",
            errorElement: "div",

            highlight: function (element) {
                $(element).addClass("is-invalid");
            },

            unhighlight: function (element) {
                $(element).removeClass("is-invalid");
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
                        pathname: '/results'
                    })
                } catch (err) {
                    console.log({ err })
                    if (!err.response && !err.response.data)
                        _this.setState({ error: err.message })

                    _this.setState({ error: err.response.data.message })
                }
            }
        });
    }
    render() {
        return (
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div
                    className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
                    id="kt_wrapper"
                >
                    <Navbar />
                    <Page/>
                </div>
            </div>
        );
    }
}

export default Login;
