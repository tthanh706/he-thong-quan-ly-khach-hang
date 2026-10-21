import React from 'react';
import PipelineStageManager from './components/PipelineStageManager';

const App: React.FC = () => {
  return (
    <div className="app">
      <PipelineStageManager
        pipelineId={1}
        opportunityId={1}
        currentStageId={1}
        userRole="manager"
      />
    </div>
  );
};

export default App;
