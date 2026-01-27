import React, { useState, useMemo } from 'react';
import { Project, FileNode } from '../types';
import { IconGitBranch, IconGitCommit, IconPlus, IconUndo, IconHistory } from './Icons';

interface VersionControlProps {
    project: Project;
    stagedFiles: Set<string>;
    onStageFile: (fileId: string) => void;
    onUnstageFile: (fileId: string) => void;
    onCommit: (message: string) => void;
}

const VersionControl: React.FC<VersionControlProps> = ({ project, stagedFiles, onStageFile, onUnstageFile, onCommit }) => {
    const [commitMessage, setCommitMessage] = useState('');

    const { changed, staged } = useMemo(() => {
        const changed: FileNode[] = [];
        const staged: FileNode[] = [];
        const traverse = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (node.type === 'file' && node.gitStatus) {
                    if (stagedFiles.has(node.id)) {
                        staged.push(node);
                    } else {
                        changed.push(node);
                    }
                }
                if (node.children) {
                    traverse(node.children);
                }
            }
        };
        traverse(project.structure);
        return { changed, staged };
    }, [project.structure, stagedFiles]);

    const handleCommit = () => {
        if (commitMessage.trim() && staged.length > 0) {
            onCommit(commitMessage);
            setCommitMessage('');
        }
    };
    
    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    return (
        <div className="h-full flex flex-col bg-zinc-900 text-sm">
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <IconGitBranch size={16}/>
                    <span>{project.currentBranch}</span>
                </div>
                <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    rows={3}
                />
                <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || staged.length === 0}
                    className="w-full mt-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <IconGitCommit />
                    Commit to '{project.currentBranch}'
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <ChangeSection title="Staged Changes" files={staged} onFileClick={onUnstageFile} icon={<IconUndo size={12}/>} />
                <ChangeSection title="Changes" files={changed} onFileClick={onStageFile} icon={<IconPlus size={12}/>} />

                 <div className="p-4 border-t border-zinc-800">
                     <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-3"><IconHistory size={14}/> History</h3>
                     <div className="space-y-3">
                         {project.commitHistory.map(commit => (
                             <div key={commit.id}>
                                 <p className="font-bold text-xs text-zinc-200 truncate">{commit.message}</p>
                                 <p className="text-[11px] text-zinc-500">{formatTimeAgo(commit.timestamp)}</p>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        </div>
    );
};

interface ChangeSectionProps {
    title: string;
    files: FileNode[];
    onFileClick: (fileId: string) => void;
    icon: React.ReactNode;
}

const ChangeSection: React.FC<ChangeSectionProps> = ({ title, files, onFileClick, icon }) => {
    if (files.length === 0) return null;

    return (
        <div className="p-4 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-400 mb-2">{title} ({files.length})</h3>
            <div className="space-y-1">
                {files.map(file => (
                    <div key={file.id} className="group flex items-center justify-between gap-2 py-1 px-2 rounded-md hover:bg-zinc-800">
                        <span className="text-zinc-300 text-xs">{file.name}</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-[10px] ${file.gitStatus === 'M' ? 'text-amber-400' : 'text-emerald-400'}`}>{file.gitStatus}</span>
                            <button onClick={() => onFileClick(file.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white">
                                {icon}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionControl;
