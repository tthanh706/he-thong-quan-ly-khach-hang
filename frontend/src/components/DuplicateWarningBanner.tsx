import React from 'react';
import type { DuplicateCheckResult, Lead } from '../types/lead.types';

interface DuplicateWarningBannerProps {
  result: DuplicateCheckResult;
  lead: Lead;
  onMerge: () => void;
  onLinkCustomer: () => void;
  onDismiss: () => void;
}

/**
 * DuplicateWarningBanner
 *
 * Displays a warning banner when duplicates or matching customers are found.
 * Provides actions to merge duplicates or link to existing customer.
 */
const DuplicateWarningBanner: React.FC<DuplicateWarningBannerProps> = ({
  result,
  lead,
  onMerge,
  onLinkCustomer,
  onDismiss,
}) => {
  if (!result.has_duplicates && !result.has_matching_customers) {
    return (
      <div className="duplicate-banner duplicate-banner--success">
        <div className="duplicate-banner__icon">✓</div>
        <div className="duplicate-banner__content">
          <strong>Không phát hiện trùng lặp</strong>
          <p>Lead &quot;{lead.full_name}&quot; không có bản ghi trùng lặp nào.</p>
        </div>
        <button className="duplicate-banner__dismiss" onClick={onDismiss}>
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="duplicate-banner duplicate-banner--warning">
      <div className="duplicate-banner__icon">⚠</div>
      <div className="duplicate-banner__content">
        <strong>Phát hiện trùng lặp!</strong>
        <p>{result.suggestion}</p>

        {/* Duplicate Leads Summary */}
        {result.has_duplicates && (
          <div className="duplicate-banner__section">
            <h4>Lead trùng lặp ({result.duplicate_leads.length})</h4>
            <ul className="duplicate-banner__list">
              {result.duplicate_leads.map((dup) => (
                <li key={dup.id}>
                  <strong>{dup.full_name}</strong>
                  {dup.email && <span> — {dup.email}</span>}
                  {dup.phone_number && <span> — {dup.phone_number}</span>}
                  {dup.company_name && <span> — {dup.company_name}</span>}
                  <span className={`badge badge--${dup.status}`}>{dup.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Matching Customers Summary */}
        {result.has_matching_customers && (
          <div className="duplicate-banner__section">
            <h4>Khách hàng phù hợp ({result.matching_customers.length})</h4>
            <ul className="duplicate-banner__list">
              {result.matching_customers.map((customer) => (
                <li key={customer.id}>
                  <strong>{customer.company_name}</strong>
                  {customer.email && <span> — {customer.email}</span>}
                  {customer.phone_number && <span> — {customer.phone_number}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="duplicate-banner__actions">
          {result.has_duplicates && (
            <button className="btn btn--warning" onClick={onMerge}>
              Gộp Lead trùng
            </button>
          )}
          {result.has_matching_customers && (
            <button className="btn btn--info" onClick={onLinkCustomer}>
              Gắn vào Khách hàng
            </button>
          )}
        </div>
      </div>
      <button className="duplicate-banner__dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
};

export default DuplicateWarningBanner;
