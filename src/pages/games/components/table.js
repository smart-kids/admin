import React from "react";

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px', border: '1px solid #dee2e6', borderRadius: '0.25rem', padding: '20px' }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const NoDocumentsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    fill="currentColor"
    className="bi bi-folder-x"
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
    loading,
    options: propOptions,
    onCreateNew,
    edit,
    delete: deleteItem
  } = props;

  const defaultOptions = {
    deleteable: true,
    editable: true
  };
  const options = { ...defaultOptions, ...propOptions };

  if (!headers || !Array.isArray(headers) || headers.length === 0) {
    return (
        <div className="alert alert-danger" role="alert">
            Table configuration error: Valid 'headers' prop is required.
        </div>
    );
  }

  if (loading === true) {
    return (
      <div className="table-loading-state" style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spinner />
        <p style={{marginTop: '10px', color: '#6c757d'}}>Loading books, please wait...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty-state" style={{
        textAlign: 'center',
        padding: '50px 20px',
        border: '1px solid #dee2e6',
        borderRadius: '0.25rem',
        backgroundColor: '#f8f9fa'
      }}>
        <NoDocumentsIcon />
        <h4>No Books Found</h4>
        <p>There are currently no books in the digital library.</p>
        {onCreateNew && typeof onCreateNew === 'function' && (
          <button
            type="button"
            className="btn btn-primary mt-3"
            onClick={onCreateNew}
          >
            <i className="la la-plus" /> Add New Book
          </button>
        )}
      </div>
    );
  }

  const hasActions = options.editable || options.deleteable;

  return (
    <div style={{ display: "block", overflowX: "auto", whiteSpace: "nowrap" }}>
      <table className="table table-hover table-bordered">
        <thead className="thead-light">
          <tr>
            {headers.map(header => (
              <th key={header.key || header.label}>
                {header.label}
              </th>
            ))}
            {hasActions && <th key="actions-header" style={{minWidth: '100px'}}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || `row-${rowIndex}`}>
              {headers.map(header => (
                <td key={`${header.key || header.label}-${row.id || rowIndex}`}>
                  {header.key === 'coverUrl' ? (
                      row[header.key] ? <img src={row[header.key]} alt="cover" style={{height: '50px', borderRadius: '4px'}} /> : 'No Cover'
                  ) : (
                      row[header.key]
                  )}
                </td>
              ))}

              {hasActions && (
                <td className="kt-datatable__cell">
                  <span style={{ overflow: "visible", position: "relative", display: "inline-flex", gap: "0.5rem" }}>
                    {options.editable === true && typeof edit === 'function' && (
                      <button title="Edit book" type="button" className="btn btn-sm btn-clean btn-icon btn-icon-md" onClick={() => edit(row)}>
                        <i style={{ color: "#1dc9b7" }} className="la la-edit" />
                      </button>
                    )}
                    {options.deleteable === true && typeof deleteItem === 'function' && (
                      <button title="Delete book" type="button" className="btn btn-sm btn-clean btn-icon btn-icon-md" onClick={() => deleteItem(row)}>
                        <i style={{ color: "#fd397a" }} className="la la-trash" />
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
