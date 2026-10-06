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
        this.unsubscribeBudgets = Data.budgets.subscribe(() => this.fetchData());
        this.unsubscribeExpenses = Data.expenses.subscribe(() => this.fetchData());
    }

    componentWillUnmount() {
        if (this.unsubscribeBudgets) this.unsubscribeBudgets();
        if (this.unsubscribeExpenses) this.unsubscribeExpenses();
    }

    fetchData = () => {
        const budgets = Data.budgets.list() || [];
        const expenses = Data.expenses.list() || [];
        this.setState({ budgets, expenses, loading: false });
    }

    render() {
        const { budgets, expenses, loading } = this.state;
        const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const remaining = totalBudget - totalSpent;

        const content = (
            <div>
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

                <div className="row mt-4">
                    <div className="col-lg-12">
                        <div className="kt-portlet">
                            <div className="kt-portlet__head">
                                <div className="kt-portlet__head-label">
                                    <h3 className="kt-portlet__head-title">Budget Allocation & Usage</h3>
                                </div>
                            </div>
                            <div className="kt-portlet__body">
                                <div className="table-responsive">
                                    <table className="table table-striped table-bordered table-hover">
                                        <thead>
                                            <tr>
                                                <th>Budget Title</th>
                                                <th>Amount Allocated (KES)</th>
                                                <th>Amount Spent (KES)</th>
                                                <th>Remaining (KES)</th>
                                                <th>Usage Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {budgets.map(budget => {
                                                // Calculate spent for this budget
                                                const spent = expenses
                                                    .filter(e => e.budget && (e.budget.id === budget.id || e.budget === budget.id))
                                                    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
                                                
                                                const allocated = Number(budget.amount) || 0;
                                                const rem = allocated - spent;
                                                const percentage = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
                                                
                                                // Determine progress bar color based on percentage
                                                let progressClass = 'bg-success';
                                                if (percentage > 75 && percentage <= 90) progressClass = 'bg-warning';
                                                else if (percentage > 90) progressClass = 'bg-danger';

                                                return (
                                                    <tr key={budget.id}>
                                                        <td><strong>{budget.title}</strong></td>
                                                        <td>{allocated.toLocaleString()}</td>
                                                        <td>{spent.toLocaleString()}</td>
                                                        <td>
                                                            <span className={`kt-font-bold ${rem < 0 ? 'kt-font-danger' : 'kt-font-success'}`}>
                                                                {rem.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td style={{ verticalAlign: 'middle', width: '25%' }}>
                                                            <div className="d-flex align-items-center">
                                                                <span className="mr-3 font-weight-bold">{percentage}%</span>
                                                                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                                                    <div className={`progress-bar ${progressClass}`} role="progressbar" style={{ width: `${percentage}%` }} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {budgets.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No budgets found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
