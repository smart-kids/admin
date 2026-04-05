import React from "react";
import EmptyState from "../../../components/EmptyState";

// A simple spinner component (you can replace this with a more sophisticated one)
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px', // Ensure spinner has some space
                border: '1px solid #dee2e6', borderRadius: '0.25rem', padding: '20px' }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Loading...</span> {/* For accessibility */}
    </div>
  </div>
);

// A simple "No Documents" icon (you can use an SVG or an icon font class)
const NoDocumentsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    fill="currentColor"
    className="bi bi-folder-x" // Changed icon to something more generic for "no documents"
    viewBox="0 0 16 16"
    style={{ color: '#6c757d', marginBottom: '15px' }}
  >
    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181L15.546 8H14.54l.265-2.917A1 1 0 0 0 13.828 4H9.828a1 1 0 0 1-.707-.293L8.414 3H4.172a1 1 0 0 0-.999.817L2.54 8H1.546l-.992-4.13zM10.146 11.854a.5.5 0 1 0-.708.708L10.293 13.5l-.853.854a.5.5 0 1 0 .707.707L11 14.207l.854.853a.5.5 0 1 0 .707-.707L11.707 13.5l.853-.854a.5.5 0 1 0-.708-.708L11 12.793l-.854-.853zM15 10.5a.5.5 0 0 0-.5-.5h-10a.5.5 0 0 0 0 1h10a.5.5 0 0 0 .5-.5" />
  </svg>
);


export default props => {
  const {
    headers,
    data,
    loading,             // True if data is being fetched
    options: propOptions,
    onCreateNew,
    edit,
    delete: deleteItem,
    invite,
    transfer
  } = props;

  const defaultOptions = {
    deleteable: true,
    editable: true,
    adminable: false,
  };
  const options = { ...defaultOptions, ...propOptions };

  // Essential check: headers are required to build the table structure
  if (!headers || !Array.isArray(headers) || headers.length === 0) {
    console.warn("Table component requires a non-empty 'headers' array prop.");
    // You might want to render a specific error UI here if headers are missing
    return (
        <div className="alert alert-danger" role="alert">
            Table configuration error: Valid 'headers' prop is required.
        </div>
    );
  }

  // 1. LOADING STATE:
  // "when we have subscribed for data but haven't got it we are loading"
  // This state takes precedence. If `loading` is true, we show the spinner
  // regardless of the current content of `data` (it might be null, empty, or stale).
  if (loading === true) {
    return (
      <div className="table-loading-state" style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spinner />
        <p style={{marginTop: '10px', color: '#6c757d'}}>Loading data, please wait...</p>
      </div>
    );
  }

  // At this point, `loading` is `false`. Data fetching has (presumably) completed or hasn't started.

  // 2. EMPTY STATE:
  // "if we get an empty data we are saying no data found here"
  // This means `loading` is `false`, and `data` is either not provided (null/undefined)
  // or is an empty array.
  if (!data || data.length === 0) {
    return (
        <EmptyState 
            title="No Drivers Found"
            description="There are currently no drivers to display. Build your fleet by adding a new driver."
            iconClass="la la-truck"
            primaryAction={onCreateNew && typeof onCreateNew === 'function' ? onCreateNew : null}
            primaryActionText="Create New Item"
        />
    );
  }

  // 3. DATA AVAILABLE STATE:
  // "if we get data we render it"
  // This means `loading` is `false`, and `data` is an array with items.
  const hasActions = options.editable || options.deleteable || options.adminable || props.invite || props.transfer;

  return (
    <div style={{ display: "block", overflowX: "auto", whiteSpace: "nowrap" }}> {/* Wrapper for overflow */}
      <table
        className="table table-hover table-bordered" // Added table-bordered for clarity
      >
        <thead className="thead-light"> {/* Added a light theme for header */}
          <tr>
            {headers.map(header => (
              <th key={header.key || header.label} title={header.tooltip || header.label}>
                {header.label}
              </th>
            ))}
            {hasActions && <th key="actions-header" style={{minWidth: '150px'}}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || `row-${rowIndex}`}> {/* Ensure row.id is unique if possible */}
              {headers.map(header => (
                <td key={`${header.key || header.label}-${row.id || rowIndex}`}>
                  {row[header.key]}
                </td>
              ))}

              {hasActions && (
                <td
                  data-field="Actions"
                  data-autohide-disabled="false"
                  className="kt-datatable__cell" // Keep if this class is relevant for your styling
                >
                  <span
                    style={{
                      overflow: "visible",
                      position: "relative",
                      display: "inline-flex",
                      gap: "0.5rem" // Consistent spacing for buttons
                    }}
                  >
                    {options.editable === true && typeof edit === 'function' && (
                      <button
                        type="button"
                        className="v8-tooltip-container btn btn-sm btn-clean btn-icon btn-icon-md"
                        onClick={() => edit(row)}
                      >
                        <i style={{ color: "#1dc9b7" }} className="la la-edit" />
                        <span className="v8-tooltip-text">Edit Driver</span>
                      </button>
                    )}
                    {options.deleteable === true && typeof deleteItem === 'function' && (
                      <button
                        type="button"
                        className="v8-tooltip-container btn btn-sm btn-clean btn-icon btn-icon-md"
                        onClick={() => deleteItem(row)}
                      >
                        <i style={{ color: "#fd397a" }} className="la la-trash" />
                        <span className="v8-tooltip-text">Delete Driver</span>
                      </button>
                    )}
                    {typeof invite === 'function' && (
                       <button
                          type="button"
                          className="v8-tooltip-container btn btn-sm btn-outline-primary"
                          onClick={() => invite(row)}
                        >
                          <i className="la la-envelope" />
                          <span className="v8-tooltip-text">Invite Driver</span>
                        </button>
                    )}
                    {options.adminable === true && typeof transfer === 'function' && (
                      <button
                        type="button"
                        className="v8-tooltip-container btn btn-sm btn-outline-danger"
                        onClick={() => transfer(row)}
                      >
                        <i className="la la-random" />
                        <span className="v8-tooltip-text">Transfer Ownership</span>
                      </button>
                    )}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};