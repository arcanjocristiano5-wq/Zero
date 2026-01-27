import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { IconSmartphone, IconTablet, IconMonitor, IconTv, IconTerminal } from './Icons';
import { bundle } from '../services/bundlerService';

interface LivePreviewProps {
  project: Project;
}

type DeviceType = 'smartphone' | 'tablet' | 'desktop' | 'tv';

const iframeHTML = `
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ZERO Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; background-color: #09090b; color: #fff; font-family: sans-serif; }
        .esbuild-error-overlay { position: fixed; inset: 0; padding: 2rem; background-color: rgba(9,9,11,0.9); color: #f87171; font-family: monospace; z-index: 9999; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
        [data-source-loc]:hover { outline: 2px solid #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); cursor: pointer; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
        const handleError = (err) => {
            const el = document.createElement('div');
            el.className = 'esbuild-error-overlay';
            el.innerText = err.message;
            document.body.appendChild(el);
            console.error(err);
        };

        window.addEventListener('message', (event) => {
            if (event.data.type === 'EXECUTE_CODE') {
                try {
                    const existingError = document.querySelector('.esbuild-error-overlay');
                    if (existingError) {
                        existingError.remove();
                    }
                    eval(event.data.code);
                } catch (err) {
                    handleError(err);
                }
            }
        });

        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-source-loc]');
            if (el) {
                e.preventDefault();
                e.stopPropagation();
                const loc = el.getAttribute('data-source-loc');
                window.parent.postMessage({ type: 'JUMP_TO_CODE', loc }, '*');
            }
        }, true);
    </script>
  </body>
</html>`;

const DEVICE_VIEWS: Record<DeviceType, React.FC<{ iframeRef: React.RefObject<HTMLIFrameElement> }>> = {
  smartphone: ({ iframeRef }) => (
    <div className="relative mx-auto border-zinc-800 bg-zinc-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
      <div className="w-[148px] h-[18px] bg-zinc-800 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-[1rem]"></div>
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-zinc-900">
        <iframe title="Smartphone Preview" ref={iframeRef} srcDoc={iframeHTML} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
      </div>
    </div>
  ),
  tablet: ({ iframeRef }) => (
    <div className="relative mx-auto border-zinc-800 bg-zinc-800 border-[18px] rounded-[2rem] h-[600px] w-[450px] shadow-xl">
        <div className="rounded-[1rem] overflow-hidden w-full h-full bg-zinc-900">
            <iframe title="Tablet Preview" ref={iframeRef} srcDoc={iframeHTML} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
        </div>
    </div>
  ),
  desktop: ({ iframeRef }) => (
    <div className="w-[800px] h-[600px] border-8 border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
      <div className="bg-zinc-800 h-8 flex items-center px-4 gap-2 border-b border-zinc-700">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/30" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" /></div>
      </div>
      <iframe title="Desktop Preview" ref={iframeRef} srcDoc={iframeHTML} className="w-full h-[calc(100%-2rem)] border-none" sandbox="allow-scripts allow-same-origin" />
    </div>
  ),
  tv: ({ iframeRef }) => (
    <div className="w-[1066px] h-[600px] bg-zinc-800 p-4 rounded-lg shadow-2xl">
       <iframe title="TV Preview" ref={iframeRef} srcDoc={iframeHTML} className="w-full h-full border-none bg-zinc-900" sandbox="allow-scripts allow-same-origin" />
    </div>
  ),
};

const LivePreview: React.FC<LivePreviewProps> = ({ project }) => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    const startBundling = async () => {
        setIsLoading(true);
        setError(null);
        const result = await bundle(project.structure);
        
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'EXECUTE_CODE', code: result.code }, '*');
        }
        
        if (result.error) {
            setError(result.error);
        }
        setIsLoading(false);
    };
    
    // Debounce bundling
    const timer = setTimeout(() => {
        startBundling();
    }, 750);

    return () => clearTimeout(timer);
  }, [project.structure]);

  const ActiveView = DEVICE_VIEWS[activeDevice];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-zinc-800">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">
                {isLoading ? 'Compilando...' : error ? 'Erro de Compilação' : 'Live Preview'}
              </span>
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
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative">
        {error && !isLoading && (
            <div className="absolute inset-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-xs code-font overflow-auto">
                <h3 className="font-bold text-red-300 mb-2 flex items-center gap-2"><IconTerminal /> Falha ao compilar</h3>
                <pre>{error}</pre>
            </div>
        )}
        <ActiveView iframeRef={iframeRef} />
      </div>
    </div>
  );
};

export default LivePreview;