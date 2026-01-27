import React, { useState } from 'react';
import Launcher from './components/Launcher';
import IDE from './components/IDE';

const App: React.FC = () => {
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    const handleProjectSelect = (projectId: string) => {
        setActiveProjectId(projectId);
    };

    const handleExitProject = () => {
        setActiveProjectId(null);
    };

    if (!activeProjectId) {
        return <Launcher onProjectSelect={handleProjectSelect} />;
    }

    return <IDE projectId={activeProjectId} onExit={handleExitProject} />;
};

export default App;
