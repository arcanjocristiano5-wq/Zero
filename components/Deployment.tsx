import React, { useState } from 'react';
import { Project, Deployment } from '../types';
import { IconRocket, IconLink, IconGitCommit, IconHistory } from './Icons';

interface DeploymentPanelProps {
    project: Project;
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

type Provider = 'vercel' | 'netlify';
type DeploymentStatus = 'idle' | 'connecting' | 'connected' | 'deploying' | 'success' | 'failed';

const DEPLOYMENT_PROVIDERS = [
    { id: 'vercel', name: 'Vercel' },
    { id: 'netlify', name: 'Netlify' },
];

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({ project, setProject }) => {
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [status, setStatus] = useState<DeploymentStatus>('idle');
    const [selectedCommitId, setSelectedCommitId] = useState<string>(project.commitHistory[0]?.id || '');
    const [logs, setLogs] = useState<string[]>([]);
    const [liveUrl, setLiveUrl] = useState<string>('');

    const handleConnect = (provider: Provider) => {
        setSelectedProvider(provider);
        setStatus('connecting');
        setLogs([`Conectando com ${provider}...`]);
        setTimeout(() => {
            setStatus('connected');
            setLogs(prev => [...prev, 'Conexão bem-sucedida!']);
        }, 1500);
    };

    const handleDeploy = async () => {
        if (!selectedCommitId || !selectedProvider) return;
        setStatus('deploying');
        setLiveUrl('');
        setLogs([
            `Iniciando implantação para ${selectedProvider}...`,
            `Usando commit: ${selectedCommitId.substring(0, 12)}`,
            `Clonando repositório...`,
            `Instalando dependências... (npm install)`,
            `Construindo o projeto... (npm run build)`,
            `Otimizando build...`,
        ]);

        await new Promise(resolve => setTimeout(resolve, 2000));
        setLogs(prev => [...prev, 'Build bem-sucedido!']);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLogs(prev => [...prev, 'Implantando em infraestrutura global...']);
        await new Promise(resolve => setTimeout(resolve, 2500));

        const newUrl = `https://${project.name.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(2, 8)}.vercel.app`;
        setLiveUrl(newUrl);
        setStatus('success');
        setLogs(prev => [...prev, `Implantação concluída!`, `URL: ${newUrl}`]);

        const newDeployment: Deployment = {
            id: `dep-${Date.now()}`,
            commitId: selectedCommitId,
            timestamp: Date.now(),
            status: 'Success',
            url: newUrl,
        };
        setProject(p => p ? { ...p, deploymentHistory: [newDeployment, ...p.deploymentHistory] } : null);
    };

    const getCommitMessage = (commitId: string): string => {
        return project.commitHistory.find(c => c.id === commitId)?.message || 'Commit inicial';
    }
    
    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    }

    return (
        <div className="h-full flex flex-col bg-zinc-900 text-sm">
            <div className="p-4 border-b border-zinc-800">
                <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-300"><IconRocket/> Implantação</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!selectedProvider ? (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-400 mb-2">Selecione um Provedor</h4>
                        <div className="space-y-2">
                            {DEPLOYMENT_PROVIDERS.map(p => (
                                <button key={p.id} onClick={() => handleConnect(p.id as Provider)} className="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-bold flex items-center gap-3 transition">
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-zinc-400">Provedor: <span className="text-indigo-400">{selectedProvider}</span></h4>
                            <button onClick={() => { setSelectedProvider(null); setStatus('idle'); setLogs([]); }} className="text-[10px] text-zinc-500 hover:text-white">Alterar</button>
                        </div>

                        {status === 'connected' && (
                             <div>
                                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Selecionar Commit para Implantar</label>
                                <select value={selectedCommitId} onChange={e => setSelectedCommitId(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none mb-4">
                                     {project.commitHistory.length > 0 ? project.commitHistory.map(c => (
                                         <option key={c.id} value={c.id}>{c.message.substring(0, 50)} ({c.id.substring(7, 14)})</option>
                                     )) : <option disabled>Nenhum commit encontrado</option>}
                                </select>
                                <button 
                                    onClick={handleDeploy}
                                    disabled={project.commitHistory.length === 0}
                                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    Implantar Agora
                                </button>
                            </div>
                        )}
                    </div>
                )}
                 {(status === 'deploying' || status === 'success') && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-400 mb-2">Log de Implantação</h4>
                        <div className="bg-black/50 p-3 rounded-lg font-mono text-[11px] h-40 overflow-y-auto">
                            {logs.map((log, i) => <p key={i} className="whitespace-pre-wrap">{`> ${log}`}</p>)}
                            {status === 'deploying' && <div className="w-2 h-2 mt-1 bg-emerald-400 rounded-full animate-ping"/>}
                        </div>
                    </div>
                 )}
                 {status === 'success' && liveUrl && (
                     <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                         <p className="text-xs font-bold text-emerald-400 mb-1">Implantação bem-sucedida!</p>
                         <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-300 hover:underline flex items-center gap-1.5">
                             <IconLink size={12}/> {liveUrl}
                         </a>
                     </div>
                 )}
            </div>

            <div className="p-4 border-t border-zinc-800">
                <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-3"><IconHistory size={14}/> Histórico de Implantação</h3>
                <div className="space-y-3 max-h-32 overflow-y-auto">
                    {project.deploymentHistory.length > 0 ? project.deploymentHistory.map(d => (
                        <div key={d.id}>
                            <p className="font-bold text-xs text-zinc-200 truncate flex items-center gap-2">
                                <IconGitCommit size={12} className={d.status === 'Success' ? 'text-emerald-400' : 'text-red-400'}/>
                                {getCommitMessage(d.commitId)}
                            </p>
                            <div className="flex items-center gap-4">
                               <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-400 hover:underline">{d.url.replace('https://', '')}</a>
                               <p className="text-[11px] text-zinc-500">{formatTimeAgo(d.timestamp)}</p>
                            </div>
                        </div>
                    )) : <p className="text-[11px] text-zinc-500">Nenhuma implantação ainda.</p>}
                </div>
            </div>
        </div>
    );
};

export default DeploymentPanel;
