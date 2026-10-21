import React, { useState } from 'react';
import leadApi from '../services/leadApi';
import type { Lead, MatchingCustomer } from '../types/lead.types';

interface LinkCustomerModalProps {
  lead: Lead;
  matchingCustomers: MatchingCustomer[];
  onLinkSuccess: () => void;
  onClose: () => void;
}

/**
 * LinkCustomerModal
 *
 * Modal for linking a lead to an existing customer record.
 * Displays matching customers and allows selection.
 */
const LinkCustomerModal: React.FC<LinkCustomerModalProps> = ({
  lead,
  matchingCustomers,
  onLinkSuccess,
  onClose,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async () => {
    if (!selectedCustomerId) {
      setError('Vui lòng chọn khách hàng để gắn.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await leadApi.linkLeadToCustomer(lead.id, {
        customer_id: selectedCustomerId,
      });
      onLinkSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gắn lead vào khách hàng thất bại.';
      setError(message);
      console.error('Link to customer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2>Gắn Lead vào Khách hàng hiện tại</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal__body">
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <p className="modal__description">
            Lead <strong>&quot;{lead.full_name}&quot;</strong> trùng khớp với các khách hàng sau.
            Chọn khách hàng để gắn lead vào hồ sơ.
          </p>

          <div className="customer-options">
            {matchingCustomers.map((customer) => (
              <label key={customer.id} className="customer-option">
                <input
                  type="radio"
                  name="customer_id"
                  value={customer.id}
                  checked={selectedCustomerId === customer.id}
                  onChange={() => setSelectedCustomerId(customer.id)}
                />
                <div className="customer-option__info">
                  <strong>{customer.company_name}</strong>
                  {customer.email && <span className="customer-option__detail">{customer.email}</span>}
                  {customer.phone_number && (
                    <span className="customer-option__detail">{customer.phone_number}</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {matchingCustomers.length === 0 && (
            <p className="modal__empty">Không tìm thấy khách hàng phù hợp.</p>
          )}
        </div>

        <footer className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Huỷ
          </button>
          <button
            className="btn btn--primary"
            onClick={handleLink}
            disabled={loading || !selectedCustomerId}
          >
            {loading ? 'Đang xử lý...' : 'Gắn vào Khách hàng'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LinkCustomerModal;
