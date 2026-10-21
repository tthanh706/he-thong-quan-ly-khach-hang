import React, { useState } from 'react';
import pipelineApi from '../services/pipelineApi';
import type {
  PipelineStage,
  TransitionBlockedResponse,
  TransitionValidationResult,
} from '../types/pipeline.types';

interface StageTransitionModalProps {
  opportunityId: number;
  targetStage: PipelineStage;
  validationResult: TransitionValidationResult;
  onSuccess: (newStageId: number) => void;
  onError: (blocked: TransitionBlockedResponse) => void;
  onClose: () => void;
}

/**
 * StageTransitionModal
 *
 * Handles the stage transition flow:
 * - Shows passed/failed conditions
 * - Blocks if conditions not met
 * - Allows override for authorized users with mandatory reason
 */
const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  opportunityId,
  targetStage,
  validationResult,
  onSuccess,
  onError,
  onClose,
}) => {
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showOverrideForm, setShowOverrideForm] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { can_transition, failed_conditions, passed_conditions, user_can_override } = validationResult;

  const handleConfirmTransition = async () => {
    setLoading(true);
    setLocalError(null);

    try {
      const response = await pipelineApi.transitionStage(opportunityId, {
        target_stage_id: targetStage.id,
      });
      onSuccess(targetStage.id);
      console.info(response.message);
    } catch (err: unknown) {
      const blocked = err as TransitionBlockedResponse;
      if (blocked.blocked) {
        onError(blocked);
      } else {
        setLocalError('Chuyển giai đoạn thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideTransition = async () => {
    if (!overrideReason.trim()) {
      setLocalError('Lý do ghi đè là bắt buộc.');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await pipelineApi.transitionStage(opportunityId, {
        target_stage_id: targetStage.id,
        is_override: true,
        override_reason: overrideReason.trim(),
      });
      onSuccess(targetStage.id);
      console.info(response.message);
    } catch (err: unknown) {
      const blocked = err as TransitionBlockedResponse;
      if (blocked.blocked) {
        onError(blocked);
      } else {
        setLocalError('Ghi đè thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2>
            Chuyển sang giai đoạn: <strong>{targetStage.name}</strong>
          </h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </header>

        <div className="modal__body">
          {localError && (
            <div className="alert alert--error" role="alert">{localError}</div>
          )}

          {/* Passed Conditions */}
          {passed_conditions.length > 0 && (
            <section className="condition-section condition-section--passed">
              <h3>✓ Điều kiện đã thỏa mãn ({passed_conditions.length})</h3>
              <ul className="condition-list">
                {passed_conditions.map((c) => (
                  <li key={c.condition_id} className="condition-item condition-item--passed">
                    <span className="condition-item__icon">✓</span>
                    <span>{c.condition_type}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Failed Conditions */}
          {failed_conditions.length > 0 && (
            <section className="condition-section condition-section--failed">
              <h3>✗ Điều kiện chưa thỏa mãn ({failed_conditions.length})</h3>
              <ul className="condition-list">
                {failed_conditions.map((c) => (
                  <li key={c.condition_id} className="condition-item condition-item--failed">
                    <span className="condition-item__icon">✗</span>
                    <div>
                      <strong>{c.error_message}</strong>
                      <span className="condition-item__type">({c.condition_type})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Override Section */}
          {!can_transition && user_can_override && (
            <section className="override-section">
              {!showOverrideForm ? (
                <button
                  className="btn btn--warning"
                  onClick={() => setShowOverrideForm(true)}
                >
                  Ghi đè điều kiện (Override)
                </button>
              ) : (
                <div className="override-form">
                  <h3>⚠ Ghi đè điều kiện</h3>
                  <p className="override-form__warning">
                    Bạn đang ghi đè các điều kiện bắt buộc. Hành động này sẽ được ghi nhận vào Audit Log.
                  </p>
                  <label className="form-label" htmlFor="override-reason">
                    Lý do ghi đè <span className="required">*</span>
                  </label>
                  <textarea
                    id="override-reason"
                    className="form-textarea"
                    placeholder="Nhập lý do ghi đè (bắt buộc)..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    required
                  />
                  <div className="override-form__actions">
                    <button
                      className="btn btn--secondary"
                      onClick={() => setShowOverrideForm(false)}
                      disabled={loading}
                    >
                      Huỷ
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={handleOverrideTransition}
                      disabled={loading || !overrideReason.trim()}
                    >
                      {loading ? 'Đang xử lý...' : 'Xác nhận ghi đè & chuyển giai đoạn'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Blocked message for non-overriders */}
          {!can_transition && !user_can_override && (
            <div className="alert alert--warning">
              <strong>Không thể chuyển giai đoạn.</strong> Vui lòng hoàn thành các điều kiện trên
              hoặc liên hệ Trưởng nhóm/Quản lý để ghi đè.
            </div>
          )}
        </div>

        <footer className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Đóng
          </button>
          {can_transition && (
            <button
              className="btn btn--primary"
              onClick={handleConfirmTransition}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận chuyển giai đoạn'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default StageTransitionModal;
