import React, { useState, useEffect } from 'react';
import { Project, Platform, FileNode } from '../types';
import * as db from '../db';
import * as geminiService from '../services/geminiService';
import { IconTrash, IconFolder, IconPlus, IconSparkles } from './Icons';

interface LauncherProps {
    onProjectSelect: (projectId: string) => void;
}

const Launcher: React.FC<LauncherProps> = ({ onProjectSelect }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [prompt, setPrompt] = useState('');
    const [platform, setPlatform] = useState<Platform>(Platform.WEB);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const allProjects = await db.getAllProjects();
        setProjects(allProjects.sort((a, b) => b.lastSaved - a.lastSaved));
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
            await db.deleteProject(projectId);
            loadProjects();
        }
    };

    const handleGenerateProject = async () => {
        if (!prompt.trim()) {
            setError('Por favor, descreva o aplicativo que você deseja criar.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await geminiService.generateAppStructure(prompt, platform, {} as Project); // Pass empty project for context

            if (!result || !result.name || !result.files) {
                throw new Error("A resposta da IA está malformada.");
            }

            const newProject: Project = {
                id: `project-${Date.now()}`,
                name: result.name,
                description: prompt,
                structure: buildFileTree(result.files),
                lastSaved: Date.now(),
                commitHistory: [],
                deploymentHistory: [],
                branches: { main: null },
                currentBranch: 'main',
                config: {
                    targetPlatform: platform,
                    language: result.files.some((f: any) => f.path.endsWith('.ts') || f.path.endsWith('.tsx')) ? 'TypeScript' : 'JavaScript',
                    cloudAIProviders: [{ id: 'gemini-default', name: 'Gemini Pro (Padrão)', provider: 'Gemini', model: 'gemini-3-pro-preview' }],
                    activeAIProviderId: 'gemini-default',
                    aiEngine: 'cloud',
                    localAIProviders: [],
                    activeLocalAIProviderId: null,
                    helperAIs: [
                        { id: 'helper-sec', name: 'Guardião de Código', description: 'Analisa o código em busca de vulnerabilidades de segurança comuns.', task: 'Security Scan', status: 'not_downloaded', isActive: false },
                        { id: 'helper-opt', name: 'Otimizador de Performance', description: 'Sugere refatorações para melhorar o desempenho e a eficiência do código.', task: 'Code Optimization', status: 'not_downloaded', isActive: false }
                    ],
                },
            };
            
            await db.saveProject(newProject);
            onProjectSelect(newProject.id);

        } catch (err: any) {
            console.error("Falha ao gerar projeto:", err);
            setError(`Erro ao gerar projeto: ${err.message}. Tente novamente.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to convert flat file list to tree structure
    const buildFileTree = (files: { path: string; content: string; language?: string }[]): FileNode[] => {
        const root: FileNode[] = [];
        const map: { [key: string]: FileNode } = {};

        files.forEach(file => {
            const parts = file.path.split('/');
            let currentLevel = root;
            let currentPath = '';

            parts.forEach((part, index) => {
                currentPath += (currentPath ? '/' : '') + part;
                if (index === parts.length - 1) { // It's a file
                    currentLevel.push({
                        id: `file-${currentPath}-${Date.now()}`,
                        name: part,
                        type: 'file',
                        content: file.content,
                        language: file.language || part.split('.').pop(),
                        gitStatus: 'A'
                    });
                } else { // It's a folder
                    if (!map[currentPath]) {
                        const newFolder: FileNode = {
                            id: `folder-${currentPath}-${Date.now()}`,
                            name: part,
                            type: 'folder',
                            children: [],
                            isOpen: true,
                            gitStatus: 'A'
                        };
                        map[currentPath] = newFolder;
                        currentLevel.push(newFolder);
                    }
                    currentLevel = map[currentPath].children!;
                }
            });
        });
        return root;
    };
    

    return (
        <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-5xl mx-auto mb-4">Z</div>
                    <h1 className="text-4xl font-bold tracking-tighter text-zinc-100">ZERO</h1>
                    <p className="text-zinc-400 mt-2">O Arquiteto Universal de Aplicativos. Comece descrevendo o que você quer construir.</p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* New Project Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400"><IconPlus/> Criar Novo Projeto</h2>
                        <p className="text-xs text-zinc-500 mt-1 mb-4">Selecione uma plataforma e descreva seu aplicativo. A IA irá gerar a estrutura inicial do projeto para você.</p>
                        
                        <div className="space-y-4 flex-1 flex flex-col">
                            <div className="flex-1 flex flex-col">
                                <label className="text-xs font-medium text-zinc-400 mb-1.5">O que você quer construir?</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: 'Um aplicativo de lista de tarefas com banco de dados SQLite' ou 'um blog simples com posts e comentários'"
                                    className="w-full flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    rows={5}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-400 mb-1.5">Plataforma Alvo</label>
                                <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                                    {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
                        
                        <button 
                            onClick={handleGenerateProject}
                            disabled={isLoading}
                            className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:bg-zinc-700 disabled:cursor-wait flex items-center justify-center gap-2"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin"/> : <IconSparkles/>}
                            {isLoading ? 'Gerando...' : 'Gerar Aplicativo'}
                        </button>
                    </div>

                    {/* Existing Projects Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                         <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-300 mb-4"><IconFolder/> Projetos Existentes</h2>
                         <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {projects.length > 0 ? projects.map(p => (
                                <div key={p.id} onClick={() => onProjectSelect(p.id)} className="group bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/10 cursor-pointer transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-200 group-hover:text-indigo-300">{p.name}</p>
                                            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{p.description}</p>
                                        </div>
                                        <button onClick={(e) => handleDeleteProject(e, p.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 rounded-md transition"><IconTrash size={12}/></button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-zinc-500">Nenhum projeto encontrado.</p>
                                    <p className="text-xs text-zinc-600 mt-1">Crie seu primeiro projeto ao lado!</p>
                                </div>
                            )}
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Launcher;