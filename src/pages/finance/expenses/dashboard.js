import React, { Component } from 'react';
import Data from "../../../utils/data";
import Navbar from "../../../components/navbar";
import Subheader from "../../../components/subheader";
import Footer from "../../../components/footer";

class ExpensesDashboard extends Component {
    state = {
        expenses: [],
        loading: true
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            const expenses = await Data.expenses.list();
            this.setState({ expenses, loading: false });
        } catch (error) {
            console.error(error);
            this.setState({ loading: false });
        }
    }

    render() {
        const { expenses, loading } = this.state;
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        // Group by category
        const byCategory = expenses.reduce((acc, e) => {
            const cat = e.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + (e.amount || 0);
            return acc;
        }, {});

        const content = (
            <div className="row">
                <div className="col-lg-12">
                    <div className="kt-portlet">
                        <div className="kt-portlet__head">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">Expense Summary (Total: KES {loading ? '...' : totalSpent.toLocaleString()})</h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Total Spent (KES)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(byCategory).map(cat => (
                                        <tr key={cat}>
                                            <td>{cat}</td>
                                            <td>{byCategory[cat].toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(byCategory).length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="text-center">No expenses recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                    <Subheader links={["Finance", "Expenses Dashboard"]} />
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

export default ExpensesDashboard;
