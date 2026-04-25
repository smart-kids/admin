import React from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';

export const EntityOverviewCard = ({ title, entities, icon, color }) => {
  if (!entities || !Array.isArray(entities)) {
    return (
      <div className="card card-custom p-4">
        <div className="card-header border-0">
          <div className="card-title">
            <div className="card-label">
              <div className="d-flex align-items-center">
                <span className="symbol symbol-40 symbol-light-primary mr-3">
                  <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
                    <i className={`${icon} text-primary`}></i>
                  </span>
                </span>
                <h3 className="font-weight-bolder text-dark mb-0">{title}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body pt-2">
          <div className="text-center py-4">
            <div className="text-muted">No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-custom p-4">
      <div className="card-header border-0">
        <div className="card-title">
          <div className="card-label">
            <div className="d-flex align-items-center">
              <span className="symbol symbol-40 symbol-light-primary mr-3">
                <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
                  <i className={`${icon} text-primary`}></i>
                </span>
              </span>
              <h3 className="font-weight-bolder text-dark mb-0">{title}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="card-body pt-2">
        <div className="row">
          {entities.map((entity, index) => (
            <div key={index} className="col-6 mb-4">
              <div className="d-flex align-items-center">
                <div className="symbol symbol-30 symbol-light mr-3">
                  <span className="symbol-label">
                    <i className={`${entity.icon} text-muted`}></i>
                  </span>
                </div>
                <div>
                  <h4 className="font-weight-bolder mb-0" style={{ color }}>
                    {formatNumber(entity.count)}
                  </h4>
                  <p className="text-muted mb-0">{entity.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EntityDistributionCard = ({ title, data, total, icon, color }) => {
  if (!data || !Array.isArray(data)) {
    return (
      <div className="card card-custom p-4">
        <div className="card-header border-0">
          <div className="card-title">
            <div className="card-label">
              <div className="d-flex align-items-center">
                <span className="symbol symbol-40 symbol-light-primary mr-3">
                  <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
                    <i className={`${icon} text-primary`}></i>
                  </span>
                </span>
                <h3 className="font-weight-bolder text-dark mb-0">{title}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body pt-2">
          <div className="text-center py-4">
            <div className="text-muted">No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-custom p-4">
      <div className="card-header border-0">
        <div className="card-title">
          <div className="card-label">
            <div className="d-flex align-items-center">
              <span className="symbol symbol-40 symbol-light-primary mr-3">
                <span className="symbol-label" style={{ backgroundColor: color + '20', color }}>
                  <i className={`${icon} text-primary`}></i>
                </span>
              </span>
              <h3 className="font-weight-bolder text-dark mb-0">{title}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="card-body pt-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={index} className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="font-weight-bold">{item.name}</span>
                <span className="text-muted">{formatNumber(item.count)} ({percentage.toFixed(1)}%)</span>
              </div>
              <div className="progress progress-xs">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${percentage}%`, backgroundColor: item.color || color }}
                  aria-valuenow={percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
