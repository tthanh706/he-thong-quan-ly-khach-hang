import React, { useState } from 'react';
import pipelineApi from '../services/pipelineApi';
import type {
  ConditionType,
  CreateConditionPayload,
  PipelineStage,
  StageCondition,
  CONDITION_TYPE_LABELS,
} from '../types/pipeline.types';

interface ConditionConfigPanelProps {
  stage: PipelineStage;
  onClose: () => void;
}

const CONDITION_LABELS: Record<ConditionType, string> = {
  has_activity: 'Yêu cầu hoạt động',
  required_field: 'Trường bắt buộc',
  min_value: 'Giá trị tối thiểu',
  has_attachment: 'Yêu cầu đính kèm',
  has_contact: 'Yêu cầu liên hệ',
  custom: 'Tùy chỉnh',
};

const CONDITION_TYPES: ConditionType[] = [
  'has_activity',
  'required_field',
  'min_value',
  'has_attachment',
  'has_contact',
];

/**
 * ConditionConfigPanel
 *
 * Side panel for managers to configure stage transition conditions.
 * Supports CRUD operations on conditions.
 */
const ConditionConfigPanel: React.FC<ConditionConfigPanelProps> = ({ stage, onClose }) => {
  const [conditions, setConditions] = useState<StageCondition[]>(stage.conditions);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New condition form state
  const [newType, setNewType] = useState<ConditionType>('has_activity');
  const [newActivityType, setNewActivityType] = useState<string>('meeting');
  const [newMinCount, setNewMinCount] = useState<number>(1);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newMinValue, setNewMinValue] = useState<number>(0);
  const [newErrorMessage, setNewErrorMessage] = useState<string>('');

  const buildPayload = (): CreateConditionPayload => {
    let parameters: Record<string, unknown> = {};

    switch (newType) {
      case 'has_activity':
        parameters = { activity_type: newActivityType, min_count: newMinCount };
        break;
      case 'required_field':
        parameters = { field_name: newFieldName };
        break;
      case 'min_value':
        parameters = { min_value: newMinValue };
        break;
      case 'has_attachment':
      case 'has_contact':
        parameters = { min_count: newMinCount };
        break;
    }

    return {
      pipeline_stage_id: stage.id,
      condition_type: newType,
      parameters,
      error_message: newErrorMessage,
      is_active: true,
    };
  };

  const handleAddCondition = async () => {
    if (!newErrorMessage.trim()) {
      setError('Thông báo lỗi là bắt buộc.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await pipelineApi.createCondition(stage.id, buildPayload());
      setConditions((prev) => [...prev, result.data]);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      setError('Thêm điều kiện thất bại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCondition = async (conditionId: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá điều kiện này?')) return;

    try {
      await pipelineApi.deleteCondition(conditionId);
      setConditions((prev) => prev.filter((c) => c.id !== conditionId));
    } catch (err) {
      setError('Xoá điều kiện thất bại.');
      console.error(err);
    }
  };

  const resetForm = () => {
    setNewType('has_activity');
    setNewActivityType('meeting');
    setNewMinCount(1);
    setNewFieldName('');
    setNewMinValue(0);
    setNewErrorMessage('');
  };

  const renderParametersSummary = (condition: StageCondition): string => {
    const params = condition.parameters;
    switch (condition.condition_type) {
      case 'has_activity':
        return `Loại: ${params.activity_type ?? 'any'}, Tối thiểu: ${params.min_count ?? 1}`;
      case 'required_field':
        return `Trường: ${params.field_name ?? ''}`;
      case 'min_value':
        return `Giá trị ≥ ${(params.min_value ?? 0).toLocaleString('vi-VN')}`;
      case 'has_attachment':
      case 'has_contact':
        return `Tối thiểu: ${params.min_count ?? 1}`;
      default:
        return JSON.stringify(params);
    }
  };

  return (
    <div className="config-panel-overlay" onClick={onClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <header className="config-panel__header">
          <h2>Cấu hình điều kiện: {stage.name}</h2>
          <button className="config-panel__close" onClick={onClose}>×</button>
        </header>

        <div className="config-panel__body">
          {error && (
            <div className="alert alert--error">{error}</div>
          )}

          {/* Existing Conditions List */}
          <section className="config-panel__section">
            <h3>Điều kiện hiện tại ({conditions.length})</h3>
            {conditions.length === 0 ? (
              <p className="config-panel__empty">Chưa có điều kiện nào. Thêm điều kiện bên dưới.</p>
            ) : (
              <ul className="condition-config-list">
                {conditions.map((condition) => (
                  <li key={condition.id} className="condition-config-item">
                    <div className="condition-config-item__info">
                      <span className={`badge badge--sm ${condition.is_active ? 'badge--active' : 'badge--inactive'}`}>
                        {condition.is_active ? 'Bật' : 'Tắt'}
                      </span>
                      <strong>{CONDITION_LABELS[condition.condition_type]}</strong>
                      <p className="condition-config-item__params">
                        {renderParametersSummary(condition)}
                      </p>
                      <p className="condition-config-item__error">
                        Lỗi: &quot;{condition.error_message}&quot;
                      </p>
                    </div>
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => handleDeleteCondition(condition.id)}
                    >
                      Xoá
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add Condition Form */}
          <section className="config-panel__section">
            {!showAddForm ? (
              <button
                className="btn btn--primary"
                onClick={() => setShowAddForm(true)}
              >
                + Thêm điều kiện
              </button>
            ) : (
              <div className="add-condition-form">
                <h3>Thêm điều kiện mới</h3>

                <label className="form-label">Loại điều kiện</label>
                <select
                  className="form-select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ConditionType)}
                >
                  {CONDITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CONDITION_LABELS[type]}
                    </option>
                  ))}
                </select>

                {/* Dynamic parameter fields */}
                {newType === 'has_activity' && (
                  <>
                    <label className="form-label">Loại hoạt động</label>
                    <select
                      className="form-select"
                      value={newActivityType}
                      onChange={(e) => setNewActivityType(e.target.value)}
                    >
                      <option value="meeting">Cuộc gặp (Meeting)</option>
                      <option value="call">Cuộc gọi (Call)</option>
                      <option value="email">Email</option>
                      <option value="note">Ghi chú (Note)</option>
                      <option value="task">Nhiệm vụ (Task)</option>
                    </select>
                    <label className="form-label">Số lượng tối thiểu</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={newMinCount}
                      onChange={(e) => setNewMinCount(Number(e.target.value))}
                    />
                  </>
                )}

                {newType === 'required_field' && (
                  <>
                    <label className="form-label">Tên trường</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="vd: expected_revenue"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                    />
                  </>
                )}

                {newType === 'min_value' && (
                  <>
                    <label className="form-label">Giá trị tối thiểu</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      value={newMinValue}
                      onChange={(e) => setNewMinValue(Number(e.target.value))}
                    />
                  </>
                )}

                {(newType === 'has_attachment' || newType === 'has_contact') && (
                  <>
                    <label className="form-label">Số lượng tối thiểu</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={newMinCount}
                      onChange={(e) => setNewMinCount(Number(e.target.value))}
                    />
                  </>
                )}

                <label className="form-label">Thông báo lỗi khi không thỏa mãn</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="vd: Cần ít nhất 1 cuộc gặp trước khi chuyển giai đoạn."
                  value={newErrorMessage}
                  onChange={(e) => setNewErrorMessage(e.target.value)}
                />

                <div className="add-condition-form__actions">
                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    disabled={loading}
                  >
                    Huỷ
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={handleAddCondition}
                    disabled={loading || !newErrorMessage.trim()}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu điều kiện'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConditionConfigPanel;
