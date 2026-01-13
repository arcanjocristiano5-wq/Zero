
import React, { useState, useMemo } from 'react';
import { Project, FileNode } from '../types';
import { IconSmartphone, IconTablet, IconMonitor, IconTv } from './Icons';

interface LivePreviewProps {
  project: Project;
}

type DeviceType = 'smartphone' | 'tablet' | 'desktop' | 'tv';

const findMainContent = (nodes: FileNode[]): string => {
  const priorities = ['App.tsx', 'index.html', 'main.ts', 'App.js'];
  const search = (nodeList: FileNode[]): string | null => {
    for (const node of nodeList) {
      if (node.type === 'file' && priorities.some(p => node.name.includes(p))) {
        return node.content || '';
      }
      if (node.children) {
        const res = search(node.children);
        if (res) return res;
      }
    }
    return null;
  };
  return search(nodes) || '<h1>No entrypoint found</h1>';
};

const DEVICE_VIEWS: Record<DeviceType, React.FC<{ srcDoc: string }>> = {
  smartphone: ({ srcDoc }) => (
    <div className="relative mx-auto border-zinc-800 bg-zinc-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
      <div className="w-[148px] h-[18px] bg-zinc-800 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-[1rem]"></div>
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-zinc-900">
        <iframe title="Smartphone Preview" srcDoc={srcDoc} className="w-full h-full border-none" sandbox="allow-scripts" />
      </div>
    </div>
  ),
  tablet: ({ srcDoc }) => (
    <div className="relative mx-auto border-zinc-800 bg-zinc-800 border-[18px] rounded-[2rem] h-[600px] w-[450px] shadow-xl">
        <div className="rounded-[1rem] overflow-hidden w-full h-full bg-zinc-900">
            <iframe title="Tablet Preview" srcDoc={srcDoc} className="w-full h-full border-none" sandbox="allow-scripts" />
        </div>
    </div>
  ),
  desktop: ({ srcDoc }) => (
    <div className="w-[800px] h-[600px] border-8 border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
      <div className="bg-zinc-800 h-8 flex items-center px-4 gap-2 border-b border-zinc-700">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/30" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" /></div>
      </div>
      <iframe title="Desktop Preview" srcDoc={srcDoc} className="w-full h-[calc(100%-2rem)] border-none" sandbox="allow-scripts" />
    </div>
  ),
  tv: ({ srcDoc }) => (
    <div className="w-[1066px] h-[600px] bg-zinc-800 p-4 rounded-lg shadow-2xl">
       <iframe title="TV Preview" srcDoc={srcDoc} className="w-full h-full border-none bg-zinc-900" sandbox="allow-scripts" />
    </div>
  ),
};

const LivePreview: React.FC<LivePreviewProps> = ({ project }) => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');
  
  const content = useMemo(() => findMainContent(project.structure), [project.structure]);
  
  const srcDoc = useMemo(() => {
    if (content.trim().startsWith('<')) {
      return content;
    } else {
      return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body { background: #09090b; color: #fff; font-family: sans-serif; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; } #root { width: 100%; height: 100%; }</style></head><body><div id="root"><div><h2 class="text-indigo-400 text-lg font-bold mb-2">Simulação ZERO</h2><div class="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700 shadow-xl max-w-sm mx-auto">${content.includes('return') ? 'Renderizando Componente Dinâmico...' : content}</div></div></div></body></html>`;
    }
  }, [content]);

  const ActiveView = DEVICE_VIEWS[activeDevice];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-zinc-800">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">Live Preview</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
               <button onClick={() => setActiveDevice('smartphone')} title="Smartphone" className={`p-1.5 rounded-md transition ${activeDevice === 'smartphone' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <IconSmartphone size={14} />
               </button>
               <button onClick={() => setActiveDevice('tablet')} title="Tablet" className={`p-1.5 rounded-md transition ${activeDevice === 'tablet' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <IconTablet size={14} />
               </button>
               <button onClick={() => setActiveDevice('desktop')} title="Desktop" className={`p-1.5 rounded-md transition ${activeDevice === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <IconMonitor size={14} />
               </button>
               <button onClick={() => setActiveDevice('tv')} title="TV" className={`p-1.5 rounded-md transition ${activeDevice === 'tv' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <IconTv size={14} />
               </button>
          </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <ActiveView srcDoc={srcDoc} />
      </div>
    </div>
  );
};

export default LivePreview;
