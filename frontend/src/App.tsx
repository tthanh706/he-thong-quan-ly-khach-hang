import React from 'react';
import OpportunityAttachmentPanel from './components/OpportunityAttachmentPanel';

const App: React.FC = () => {
  return (
    <div className="app">
      <OpportunityAttachmentPanel
        opportunityId={1}
        canUpload={true}
        canDelete={true}
      />
    </div>
  );
};

export default App;
