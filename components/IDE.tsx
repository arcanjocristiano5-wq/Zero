import React, { useState, useEffect, useCallback } from 'react';
import { Project, FileNode, Platform, Message, Commit } from '../types';
import * as db from '../db';
import * as geminiService from '../services/geminiService';

// Components
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import Terminal from './Terminal';
import AIConfigModal from './AIConfigModal';
import AIAssistant from './AIAssistant';
import VersionControl from './VersionControl';
import DeploymentPanel from './Deployment';

// Icons
import {
  IconSave, IconShare, IconSettings, IconFile, IconFolder, IconChevronRight, IconSparkles, IconGitBranch, IconLayoutGrid, IconPlus, IconPower, IconRocket
} from './Icons';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';


interface IDEProps {
    projectId: string;
    onExit: () => void;
}

const IDE: React.FC<IDEProps> = ({ projectId, onExit }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
    const [selection, setSelection] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeLeftPanel, setActiveLeftPanel] = useState('explorer');
    const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadProject = async () => {
            const proj = await db.getProject(projectId);
            if (proj) {
                setProject(proj);
                // Set initial active file
                const findFirstFile = (nodes: FileNode[]): FileNode | null => {
                    for(const node of nodes) {
                        if (node.type === 'file') return node;
                        if (node.children) {
                            const found = findFirstFile(node.children);
                            if (found) return found;
                        }
                    }
                    return null;
                }
                const firstFile = findFirstFile(proj.structure);
                setActiveFileId(firstFile?.id || null);

            } else {
                // Project not found, go back to launcher
                onExit();
            }
        };
        loadProject();
    }, [projectId, onExit]);

    const handleCodeChange = useCallback((fileId: string, newContent: string) => {
        setProject(p => {
            if (!p) return null;
            
            const updateRecursively = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === fileId) {
                        return { ...node, content: newContent, gitStatus: node.gitStatus === 'A' ? 'A' : 'M' };
                    }
                    if (node.children) {
                        return { ...node, children: updateRecursively(node.children) };
                    }
                    return node;
                });
            };

            return { ...p, structure: updateRecursively(p.structure) };
        });
    }, []);

    const handleSaveProject = async () => {
        if (project) {
            await db.saveProject(project);
            console.log("Project saved!");
        }
    };

    const handleSendMessage = async (prompt: string) => {
        if (!project || isAiLoading) return;

        const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', text: prompt, timestamp: Date.now() };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setIsAiLoading(true);

        try {
            const aiResponse = await geminiService.getArchitectResponse(prompt, currentMessages, project);
            const assistantMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', text: aiResponse, timestamp: Date.now() };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error getting response from AI:", error);
            const errorMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', text: "Desculpe, ocorreu um erro ao contatar a IA.", timestamp: Date.now() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleStageFile = (fileId: string) => {
        setStagedFiles(prev => new Set(prev).add(fileId));
    };

    const handleUnstageFile = (fileId: string) => {
        setStagedFiles(prev => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
        });
    };

    const handleCommit = (message: string) => {
        if (stagedFiles.size === 0 || !project) return;
    
        const fileSnapshots: Commit['fileSnapshots'] = [];
        const changedFiles: { [id: string]: FileNode } = {};
        
        const findAndSnapshot = (nodes: FileNode[], path: string) => {
            for (const node of nodes) {
                if (node.type === 'file' && stagedFiles.has(node.id)) {
                    const filePath = `${path}/${node.name}`.substring(1);
                    fileSnapshots.push({ path: filePath, content: node.content || '', status: node.gitStatus! });
                    changedFiles[node.id] = { ...node, gitStatus: undefined };
                }
                if (node.children) {
                    findAndSnapshot(node.children, `${path}/${node.name}`);
                }
            }
        };
        findAndSnapshot(project.structure, '');
    
        const newCommit: Commit = {
            id: `commit-${Date.now()}`,
            message,
            timestamp: Date.now(),
            fileSnapshots
        };
    
        setProject(p => {
            if (!p) return null;
    
            const updateRecursively = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (changedFiles[node.id]) {
                        return changedFiles[node.id];
                    }
                    if (node.children) {
                        return { ...node, children: updateRecursively(node.children) };
                    }
                    return node;
                });
            };
    
            return {
                ...p,
                structure: updateRecursively(p.structure),
                commitHistory: [newCommit, ...p.commitHistory],
            };
        });
    
        setStagedFiles(new Set());
    };
    
    const findFileById = (id: string, nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findFileById(id, node.children);
                if (found) return found;
            }
        }
        return null;
    };
    
    const activeFile = project ? findFileById(activeFileId || '', project.structure) : null;

    if (!project) {
        return <div className="bg-zinc-950 h-screen flex items-center justify-center text-white">Carregando Projeto...</div>;
    }
    
    return (
        <div className="h-screen bg-zinc-900 text-white flex flex-col font-sans">
            {isAiConfigOpen && <AIConfigModal project={project} setProject={setProject} onClose={() => setIsAiConfigOpen(false)} />}
            
            <Header project={project} onSave={handleSaveProject} onOpenAiConfig={() => setIsAiConfigOpen(true)} onExit={onExit} />

            <main className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={25} minSize={15} className="bg-zinc-900 flex flex-col">
                        <div className="flex-shrink-0 flex items-center p-1 border-b border-zinc-800 bg-zinc-950">
                            <button onClick={() => setActiveLeftPanel('explorer')} title="Explorer" className={`p-2 rounded-md transition ${activeLeftPanel === 'explorer' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}><IconLayoutGrid size={16}/></button>
                            <button onClick={() => setActiveLeftPanel('version-control')} title="Version Control" className={`p-2 rounded-md transition ${activeLeftPanel === 'version-control' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}><IconGitBranch size={16}/></button>
                            <button onClick={() => setActiveLeftPanel('deployment')} title="Deployment" className={`p-2 rounded-md transition ${activeLeftPanel === 'deployment' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}><IconRocket size={16}/></button>
                            <button onClick={() => setActiveLeftPanel('ai-assistant')} title="AI Assistant" className={`p-2 rounded-md transition ${activeLeftPanel === 'ai-assistant' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}><IconSparkles size={16}/></button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {activeLeftPanel === 'explorer' && <FileExplorer structure={project.structure} activeFileId={activeFileId} onFileSelect={setActiveFileId} onStageFile={handleStageFile} />}
                            {activeLeftPanel === 'version-control' && <VersionControl project={project} stagedFiles={stagedFiles} onStageFile={handleStageFile} onUnstageFile={handleUnstageFile} onCommit={handleCommit} />}
                            {activeLeftPanel === 'deployment' && <DeploymentPanel project={project} setProject={setProject} />}
                            {activeLeftPanel === 'ai-assistant' && <AIAssistant messages={messages} onSendMessage={handleSendMessage} isLoading={isAiLoading} />}
                        </div>
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-indigo-500 transition-colors" />
                    <Panel>
                        <PanelGroup direction="vertical">
                             <Panel defaultSize={65} minSize={20}>
                                <CodeEditor 
                                    project={project}
                                    activeFile={activeFile}
                                    onCodeChange={handleCodeChange}
                                    onSelectionChange={setSelection}
                                />
                             </Panel>
                             <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-indigo-500 transition-colors" />
                             <Panel defaultSize={35} minSize={10}>
                                <Terminal project={project} setProject={setProject} />
                             </Panel>
                        </PanelGroup>
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-indigo-500 transition-colors" />
                    <Panel defaultSize={40} minSize={25}>
                        <LivePreview project={project} />
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
};

const Header: React.FC<{ project: Project; onSave: () => void; onOpenAiConfig: () => void; onExit: () => void; }> = ({ project, onSave, onOpenAiConfig, onExit }) => (
    <header className="flex-shrink-0 h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 rounded-md hover:bg-zinc-800" title="Voltar ao Lançador">
                <IconPower />
            </button>
            <div className="w-px h-6 bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">Z</div>
              <h1 className="font-bold text-zinc-200">{project.name}</h1>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onSave} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-xs font-bold flex items-center gap-2 transition"><IconSave /> Salvar</button>
            <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-xs font-bold flex items-center gap-2 transition"><IconShare /> Compartilhar</button>
            <button onClick={onOpenAiConfig} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-xs font-bold flex items-center gap-2 transition"><IconSettings /> IA</button>
        </div>
    </header>
);

const FileExplorer: React.FC<{ structure: FileNode[]; activeFileId: string | null; onFileSelect: (id: string) => void; onStageFile: (id: string) => void; }> = ({ structure, activeFileId, onFileSelect, onStageFile }) => {
    const renderNode = (node: FileNode, path: string) => {
        const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
        const currentPath = `${path}/${node.name}`;

        const statusClass = node.gitStatus === 'M' ? 'text-amber-400' : node.gitStatus === 'A' ? 'text-emerald-400' : 'text-zinc-400';

        if (node.type === 'folder') {
            return (
                <div key={node.id} className="text-sm">
                    <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-zinc-800">
                        <IconChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        <IconFolder />
                        <span className="text-zinc-300">{node.name}</span>
                    </div>
                    {isOpen && (
                        <div className="pl-4 border-l border-zinc-800 ml-3">
                            {node.children?.map(child => renderNode(child, currentPath))}
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div key={node.id} onClick={() => onFileSelect(node.id)} className={`group flex items-center justify-between gap-2 py-1 px-2 ml-3 rounded-md cursor-pointer ${activeFileId === node.id ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-zinc-800'}`}>
                <div className="flex items-center gap-2">
                  <IconFile size={16} />
                  <span className={statusClass}>{node.name}</span>
                  {node.gitStatus && <span className={`font-bold text-[10px] ${statusClass}`}>{node.gitStatus}</span>}
                </div>
                {node.gitStatus && <button onClick={(e) => { e.stopPropagation(); onStageFile(node.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white"><IconPlus size={12}/></button>}
            </div>
        );
    };

    return (
        <div className="p-2 space-y-1">
            {structure.map(node => renderNode(node, ''))}
        </div>
    );
};

export default IDE;