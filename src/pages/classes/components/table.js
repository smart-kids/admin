import React, { useState } from "react";
import Row from "./table-row";
import EmptyState from "../../../components/EmptyState";

export default props => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  if (!props.headers || !props.data) return null;
  const { options = { deleteable: true, editable: true } } = props;

  const totalPages = Math.ceil(props.data.length / rowsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  
  // Safe slice
  const paginatedData = props.data.slice((validPage - 1) * rowsPerPage, validPage * rowsPerPage);
  return (
    <div className="kt_datatable kt-datatable kt-datatable--default kt-datatable--brand kt-datatable--loaded">
      <table
        className="kt-datatable__table"
        style={{
          "display": "block",
          "overflowX": "auto",
          "whiteSpace": "nowrap"
        }}
      >
        <thead className="kt-datatable__head">
          <tr className="kt-datatable__row">
            <th style={{ width: "30px" }} className="kt-datatable__cell"></th>
            {props.headers.map(header => {
              return <th key={header.key} style={{ width: "150px" }} className="kt-datatable__cell">{header.label}</th>;
            })}
            <th style={{ width: "110px" }} className="kt-datatable__cell"></th>
          </tr>
        </thead>
        <tbody className="kt-datatable__body">
          {paginatedData.map(row => {
            return (
              <Row
                key={Math.random().toString()}
                headers={props.headers}
                data={row}
                edit={() => props.edit(row)}
                delete={() => props.delete(row)}
                options={options}
              />
            );
          })}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={props.headers.length + 2} style={{ padding: 0 }}>
                  <EmptyState
                      title="No Classes Found"
                      description="There are currently no classes to display. Structure your curriculum by adding a new class."
                      iconClass="la la-chalkboard"
                  />
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {props.data.length > 0 && (
        <div className="d-flex justify-content-between align-items-center p-3 border-top mt-2">
          <div className="text-muted" style={{fontSize: '0.9rem'}}>
            Showing {(validPage - 1) * rowsPerPage + 1} - {Math.min(validPage * rowsPerPage, props.data.length)} of {props.data.length}
          </div>
          <div className="d-flex align-items-center">
            <select 
              className="form-control form-control-sm mr-4" 
              style={{width: 'auto'}} 
              value={rowsPerPage} 
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value="15">15 rows</option>
              <option value="30">30 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>
            <button 
              className="btn btn-sm btn-light-primary mr-2" 
              disabled={validPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <i className="fa fa-chevron-left" style={{fontSize: '0.7rem'}}></i> Prev
            </button>
            <span className="mr-2 text-muted" style={{fontSize: '0.9rem'}}>Page {validPage} of {totalPages}</span>
            <button 
              className="btn btn-sm btn-light-primary" 
              disabled={validPage === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next <i className="fa fa-chevron-right" style={{fontSize: '0.7rem'}}></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
