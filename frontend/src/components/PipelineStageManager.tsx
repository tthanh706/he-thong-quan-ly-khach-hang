import React, { useCallback, useEffect, useState } from 'react';
import pipelineApi from '../services/pipelineApi';
import type {
  PipelineStage,
  TransitionBlockedResponse,
  TransitionValidationResult,
} from '../types/pipeline.types';
import ConditionConfigPanel from './ConditionConfigPanel';
import StageTransitionModal from './StageTransitionModal';

interface PipelineStageManagerProps {
  pipelineId: number;
  opportunityId: number;
  currentStageId: number;
  userRole: string;
}

/**
 * PipelineStageManager
 *
 * Main component for visualizing pipeline stages with their conditions,
 * handling transitions, and managing override flows.
 */
const PipelineStageManager: React.FC<PipelineStageManagerProps> = ({
  pipelineId,
  opportunityId,
  currentStageId,
  userRole,
}) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<number>(currentStageId);

  // Transition modal state
  const [transitionTarget, setTransitionTarget] = useState<PipelineStage | null>(null);
  const [validationResult, setValidationResult] = useState<TransitionValidationResult | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);

  // Config panel
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [configStage, setConfigStage] = useState<PipelineStage | null>(null);

  const isManager = ['manager', 'admin', 'team_lead'].includes(userRole);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pipelineApi.getStagesWithConditions(pipelineId);
      setStages(response.data);
    } catch (err) {
      setError('Không thể tải danh sách giai đoạn.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const handleStageClick = async (stage: PipelineStage) => {
    if (stage.id === activeStageId) return;

    setTransitionTarget(stage);
    setValidating(true);
    setValidationResult(null);

    try {
      const result = await pipelineApi.validateTransition(opportunityId, stage.id);
      setValidationResult(result);
      setShowTransitionModal(true);
    } catch (err) {
      setError('Không thể kiểm tra điều kiện chuyển giai đoạn.');
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  const handleTransitionSuccess = (newStageId: number) => {
    setActiveStageId(newStageId);
    setShowTransitionModal(false);
    setTransitionTarget(null);
    setValidationResult(null);
    fetchStages();
  };

  const handleTransitionError = (blocked: TransitionBlockedResponse) => {
    setError(blocked.message);
  };

  const handleConfigureStage = (stage: PipelineStage) => {
    setConfigStage(stage);
    setShowConfigPanel(true);
  };

  const getStageStatus = (stage: PipelineStage): 'completed' | 'active' | 'upcoming' => {
    if (stage.position < (stages.find((s) => s.id === activeStageId)?.position ?? 0)) {
      return 'completed';
    }
    if (stage.id === activeStageId) return 'active';
    return 'upcoming';
  };

  return (
    <div className="pipeline-manager">
      <header className="pipeline-manager__header">
        <h1>Quy trình bán hàng — Pipeline Stages</h1>
        <p className="pipeline-manager__subtitle">
          Nhấp vào giai đoạn để chuyển. Điều kiện sẽ được kiểm tra tự động.
        </p>
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
          <button onClick={() => setError(null)} className="alert__close">×</button>
        </div>
      )}

      {/* Stage Pipeline Visualization */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Đang tải...</span>
        </div>
      ) : (
        <div className="pipeline-stages">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage);
            return (
              <div key={stage.id} className="pipeline-stage-wrapper">
                <button
                  className={`pipeline-stage pipeline-stage--${status}`}
                  onClick={() => handleStageClick(stage)}
                  disabled={validating || status === 'active'}
                  title={stage.description ?? stage.name}
                >
                  <div className="pipeline-stage__indicator">
                    {status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="pipeline-stage__info">
                    <span className="pipeline-stage__name">{stage.name}</span>
                    {stage.conditions.length > 0 && (
                      <span className="pipeline-stage__conditions-badge">
                        {stage.conditions.filter((c) => c.is_active).length} điều kiện
                      </span>
                    )}
                  </div>
                </button>

                {/* Arrow connector */}
                {index < stages.length - 1 && (
                  <div className="pipeline-stage__connector">→</div>
                )}

                {/* Config button for managers */}
                {isManager && (
                  <button
                    className="pipeline-stage__config-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfigureStage(stage);
                    }}
                    title="Cấu hình điều kiện"
                  >
                    ⚙
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Transition Modal */}
      {showTransitionModal && transitionTarget && validationResult && (
        <StageTransitionModal
          opportunityId={opportunityId}
          targetStage={transitionTarget}
          validationResult={validationResult}
          onSuccess={handleTransitionSuccess}
          onError={handleTransitionError}
          onClose={() => {
            setShowTransitionModal(false);
            setTransitionTarget(null);
          }}
        />
      )}

      {/* Condition Config Panel (for managers) */}
      {showConfigPanel && configStage && (
        <ConditionConfigPanel
          stage={configStage}
          onClose={() => {
            setShowConfigPanel(false);
            setConfigStage(null);
            fetchStages();
          }}
        />
      )}
    </div>
  );
};

export default PipelineStageManager;
