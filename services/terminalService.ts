import React from 'react';
import { Project, FileNode } from '../types';

// Helper function to find a node by path in the file tree
const findNodeByPath = (path: string, structure: FileNode[]): { node: FileNode | null, parent: FileNode[] | null } => {
    if (path === '/') return { node: { id: 'root', name: '/', type: 'folder', children: structure }, parent: null };
    const parts = path.split('/').filter(p => p);
    let currentLevel: FileNode[] | undefined = structure;
    let parent: FileNode[] | null = null;
    let node: FileNode | null = null;
    
    for (const part of parts) {
        const found = currentLevel?.find(n => n.name === part);
        if (found) {
            node = found;
            parent = currentLevel!;
            currentLevel = found.children;
        } else {
            return { node: null, parent: null }; // Not found
        }
    }
    return { node, parent };
};

export class TerminalService {
    private project: Project;
    private setProject: React.Dispatch<React.SetStateAction<Project | null>>;
    public cwd: string = '/';

    constructor(project: Project, setProject: React.Dispatch<React.SetStateAction<Project | null>>) {
        this.project = project;
        this.setProject = setProject;
    }

    public updateProject(project: Project) {
        this.project = project;
    }

    public async executeCommand(input: string): Promise<string> {
        const [command, ...args] = input.trim().split(/\s+/);

        switch (command) {
            case 'help':
                return 'Available commands: help, ls, cat, clear, npm install, npm run test';
            case 'ls':
                return this.ls(args[0] || this.cwd);
            case 'cat':
                return this.cat(args[0]);
            case 'clear':
                return 'CLEAR_TERMINAL'; // Special command for the component
            case 'npm':
                return this.npm(args);
            default:
                return `command not found: ${command}`;
        }
    }

    private ls(path: string): string {
        const { node } = findNodeByPath(path, this.project.structure);
        if (node && node.type === 'folder') {
            return (node.children || []).map(child => {
                // ANSI escape codes for colors
                const color = child.type === 'folder' ? '\x1b[1;34m' : '\x1b[0m';
                const resetColor = '\x1b[0m';
                return `${color}${child.name}${resetColor}`;
            }).join('\n');
        }
        return `ls: cannot access '${path}': No such file or directory`;
    }

    private cat(path: string): string {
        const { node } = findNodeByPath(path, this.project.structure);
        if (node && node.type === 'file') {
            return node.content || '';
        }
        return `cat: ${path}: No such file or directory`;
    }

    private async npm(args: string[]): Promise<string> {
        if (args[0] === 'install') {
            const { node: pkgJsonNode } = findNodeByPath('/package.json', this.project.structure);
            if (!pkgJsonNode || pkgJsonNode.type !== 'file' || !pkgJsonNode.content) {
                return 'npm ERR! missing package.json';
            }
            // Simulate install
            const output = `> npm install\n\nup to date, audited 1 package in 2s\n\nfound 0 vulnerabilities\n`;
            
            // Create lock file and node_modules folder (if they don't exist)
            this.setProject(p => {
                if (!p) return null;
                let newStructure = [...p.structure];

                const { node: lockFile } = findNodeByPath('/package-lock.json', newStructure);
                if (!lockFile) {
                    const newLockFile: FileNode = { id: `file-lock-${Date.now()}`, name: 'package-lock.json', type: 'file', content: '{}', gitStatus: 'A' };
                    newStructure.push(newLockFile);
                }
                const { node: nodeModules } = findNodeByPath('/node_modules', newStructure);
                 if (!nodeModules) {
                    const newNodeModules: FileNode = { id: `folder-nm-${Date.now()}`, name: 'node_modules', type: 'folder', children: [], isOpen: false, gitStatus: 'A' };
                    newStructure.push(newNodeModules);
                }
                
                return { ...p, structure: newStructure };
            });

            return output;
        }
        if (args[0] === 'run' && args[1] === 'test') {
             const { node: pkgJsonNode } = findNodeByPath('/package.json', this.project.structure);
             if (!pkgJsonNode || pkgJsonNode.type !== 'file' || !pkgJsonNode.content) {
                return 'npm ERR! missing package.json';
            }
            const pkg = JSON.parse(pkgJsonNode.content);
            if (!pkg.scripts || !pkg.scripts.test) {
                return 'npm ERR! missing script: test';
            }
            return `> ${pkg.scripts.test}\n\nPASS  ./src/App.test.tsx\n ✓ Renders without crashing (5ms)\n\nTest Suites: 1 passed, 1 total\nTests:       1 passed, 1 total\nSnapshots:   0 total\nTime:        0.5s`;
        }
        return `npm: unknown command '${args.join(' ')}'`;
    }
}