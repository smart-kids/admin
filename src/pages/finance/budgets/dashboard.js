import React, { Component } from 'react';
import Data from "../../../utils/data";
import Navbar from "../../../components/navbar";
import Subheader from "../../../components/subheader";
import Footer from "../../../components/footer";

class BudgetsDashboard extends Component {
    state = {
        budgets: [],
        expenses: [],
        loading: true
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            const [budgets, expenses] = await Promise.all([
                Data.budgets.list(),
                Data.expenses.list()
            ]);
            this.setState({ budgets, expenses, loading: false });
        } catch (error) {
            console.error(error);
            this.setState({ loading: false });
        }
    }

    render() {
        const { budgets, expenses, loading } = this.state;
        const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const remaining = totalBudget - totalSpent;

        const content = (
            <div className="row">
                <div className="col-lg-4">
                    <div className="kt-portlet kt-iconbox kt-iconbox--brand kt-iconbox--animate-slower">
                        <div className="kt-portlet__body">
                            <div className="kt-iconbox__body">
                                <div className="kt-iconbox__icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" className="kt-svg-icon">
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                            <rect x="0" y="0" width="24" height="24" />
                                            <path d="M12,21 C7.02943725,21 3,16.9705627 3,12 C3,7.02943725 7.02943725,3 12,3 C16.9705627,3 21,7.02943725 21,12 C21,16.9705627 16.9705627,21 12,21 Z M12,19 C15.8659932,19 19,15.8659932 19,12 C19,8.13400675 15.8659932,5 12,5 C8.13400675,5 5,8.13400675 5,12 C5,15.8659932 8.13400675,19 12,19 Z" fill="#000000" fillRule="nonzero" opacity="0.3" />
                                        </g>
                                    </svg>
                                </div>
                                <div className="kt-iconbox__desc">
                                    <h3 className="kt-iconbox__title">Total Budget</h3>
                                    <div className="kt-iconbox__content">
                                        {loading ? '...' : `KES ${totalBudget.toLocaleString()}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="kt-portlet kt-iconbox kt-iconbox--danger kt-iconbox--animate-slower">
                        <div className="kt-portlet__body">
                            <div className="kt-iconbox__body">
                                <div className="kt-iconbox__desc">
                                    <h3 className="kt-iconbox__title">Total Spent</h3>
                                    <div className="kt-iconbox__content">
                                        {loading ? '...' : `KES ${totalSpent.toLocaleString()}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="kt-portlet kt-iconbox kt-iconbox--success kt-iconbox--animate-slower">
                        <div className="kt-portlet__body">
                            <div className="kt-iconbox__body">
                                <div className="kt-iconbox__desc">
                                    <h3 className="kt-iconbox__title">Remaining</h3>
                                    <div className="kt-iconbox__content">
                                        {loading ? '...' : `KES ${remaining.toLocaleString()}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

        if (this.props.isComponent) {
            return content;
        }

        return (
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
                    <Navbar />
                    <Subheader links={["Finance", "Budgets Dashboard"]} />
                    <div className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor" id="kt_content">
                        <div className="kt-container kt-grid__item kt-grid__item--fluid">
                            {content}
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }
}

export default BudgetsDashboard;
