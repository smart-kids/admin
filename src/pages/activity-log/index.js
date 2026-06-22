import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import Data from "../../utils/data";

export default function ActivityLogIndex() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data load
    if (Data.activityLogs.list().length > 0) {
      setLogs(Data.activityLogs.list());
      setLoading(false);
    } else {
      // In case it's not loaded yet, setTimeout or just wait for subscribe
      setLoading(false);
    }

    const unsub = Data.activityLogs.subscribe(({ activityLogs }) => {
      if (activityLogs) {
        setLogs(activityLogs);
        setLoading(false);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
        <Navbar />
        <div className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor" style={{height:"100vh"}}>
          <div className="kt-container kt-grid__item kt-grid__item--fluid mt-5">
            <div className="card">
                <div className="card-header">
                    <h3>Activity Log</h3>
                </div>
                <div className="card-body">
                    {loading ? (
                        <p>Loading activity logs...</p>
                    ) : (
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Entity</th>
                                    <th>Action</th>
                                    <th>User Title</th>
                                    <th>User ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td>{log.entity}</td>
                                        <td>{log.action}</td>
                                        <td>{log.userTitle}</td>
                                        <td>{log.userId}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan="5" className="text-center">No activity logs found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
