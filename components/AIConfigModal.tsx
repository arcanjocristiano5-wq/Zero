
import React, { useState } from 'react';
import { Project, CloudAIInstance, LocalAIInstance } from '../types';
import { IconCpu, IconBot, IconSettings, IconPower, IconPlus, IconTrash, IconDownload } from './Icons';

interface AIConfigModalProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ project, setProject, onClose }) => {
  const [editingProvider, setEditingProvider] = useState<CloudAIInstance | LocalAIInstance | null | 'new-cloud' | 'new-local'>(null);

  const startDownload = () => {
    setProject(prev => ({ ...prev, config: { ...prev.config, localAIEngine: { status: 'downloading', downloadProgress: 0 }}}));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setProject(prev => ({ ...prev, config: { ...prev.config, localAIEngine: { status: 'installed', downloadProgress: 100 }}}));
      } else {
        setProject(prev => ({ ...prev, config: { ...prev.config, localAIEngine: { ...prev.config.localAIEngine, downloadProgress: progress }}}));
      }
    }, 400);
  };

  const handleSetActive = (id: string) => {
    setProject(p => ({...p, config: {...p.config, activeAIProviderId: id}}));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este provedor?")) {
      setProject(p => ({
        ...p,
        config: {
          ...p.config,
          cloudAIProviders: p.config.cloudAIProviders.filter(provider => provider.id !== id),
          localAIProviders: p.config.localAIProviders.filter(provider => provider.id !== id),
          activeAIProviderId: p.config.activeAIProviderId === id ? null : p.config.activeAIProviderId,
        }
      }));
    }
  };

  const handleSave = (provider: CloudAIInstance | LocalAIInstance) => {
    if ('apiKey' in provider) { // It's a CloudAIInstance
      setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: p.config.cloudAIProviders.map(item => item.id === provider.id ? provider : item) }}));
    } else { // It's a LocalAIInstance
      setProject(p => ({ ...p, config: { ...p.config, localAIProviders: p.config.localAIProviders.map(item => item.id === provider.id ? provider : item) }}));
    }
    setEditingProvider(null);
  };

  const handleAdd = (provider: Omit<CloudAIInstance, 'id'> | Omit<LocalAIInstance, 'id'>) => {
    const newId = `provider-${Date.now()}`;
    const newProvider = { ...provider, id: newId };
    if ('apiKey' in newProvider) {
      setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: [...p.config.cloudAIProviders, newProvider]}}));
    } else {
      setProject(p => ({ ...p, config: { ...p.config, localAIProviders: [...p.config.localAIProviders, newProvider]}}));
    }
    setEditingProvider(null);
  };

  if (editingProvider) {
    return <ProviderEditForm provider={editingProvider} onSave={handleSave} onAdd={handleAdd} onCancel={() => setEditingProvider(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><IconSettings size={20} /></div><div><h3 className="text-lg font-bold text-zinc-100 leading-tight">Painel de Controle de IA</h3><p className="text-xs text-zinc-500">Gerencie seus provedores de IA Locais e na Nuvem</p></div></div><button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl transition-colors">&times;</button></div>
        
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cloud Providers */}
          <section className="space-y-4"><div className="flex justify-between items-center"><h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconBot /> Provedores na Nuvem</h4><button onClick={() => setEditingProvider('new-cloud')} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"><IconPlus /> Adicionar</button></div><div className="space-y-3">{project.config.cloudAIProviders.map(p => <ProviderCard key={p.id} provider={p} isActive={project.config.activeAIProviderId === p.id} onSetActive={handleSetActive} onEdit={setEditingProvider} onDelete={handleDelete} />)}</div></section>
          
          {/* Local Providers */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconCpu /> Provedores Locais</h4>
              {project.config.localAIEngine.status === 'installed' && <button onClick={() => setEditingProvider('new-local')} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"><IconPlus /> Adicionar Manualmente</button>}
            </div>
            {project.config.localAIEngine.status !== 'installed' 
              ? <LocalEngineDownloader status={project.config.localAIEngine} onStartDownload={startDownload} /> 
              : (
                  <>
                    <div className="space-y-3">
                      {project.config.localAIProviders.length === 0 && <p className="text-center text-xs text-zinc-500 py-4">Nenhum provedor local configurado.</p>}
                      {project.config.localAIProviders.map(p => <ProviderCard key={p.id} provider={p} isActive={project.config.activeAIProviderId === p.id} onSetActive={handleSetActive} onEdit={setEditingProvider} onDelete={handleDelete} />)}
                    </div>
                    <ModelDownloader project={project} onAddModel={handleAdd} />
                  </>
              )
            }
          </section>
        </div>

        <div className="p-6 bg-zinc-950/80 border-t border-zinc-800 flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Fechar</button></div>
      </div>
    </div>
  );
};

const ProviderCard = ({ provider, isActive, onSetActive, onEdit, onDelete }: any) => (
  <div className={`p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
    <div className="flex justify-between items-start"><div><p className="font-bold text-xs text-zinc-100">{provider.name}</p><p className="text-[10px] text-zinc-500 font-mono mt-1">{provider.model}</p></div>{!isActive ? (<button onClick={() => onSetActive(provider.id)} className="px-2 py-1 text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600 rounded-md">Ativar</button>) : (<div className="px-2 py-1 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 rounded-md">Ativo</div>)}</div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700/50"><button onClick={() => onEdit(provider)} className="text-[10px] text-zinc-400 hover:text-white">Editar</button><div className="w-px h-3 bg-zinc-600"></div><button onClick={() => onDelete(provider.id)} className="text-[10px] text-zinc-400 hover:text-red-400">Excluir</button></div>
  </div>
);

const ProviderEditForm = ({ provider, onSave, onAdd, onCancel }: any) => {
  const isNew = provider === 'new-cloud' || provider === 'new-local';
  const type = provider.provider === 'Gemini' || provider === 'new-cloud' ? 'cloud' : 'local';
  
  const [formData, setFormData] = useState(isNew 
    ? (type === 'cloud' 
      ? { name: '', provider: 'Gemini', model: 'gemini-3-pro-preview', apiKey: '' } 
      : { name: '', model: 'llama3.1:8b', endpoint: 'http://localhost:11434', temperature: 0.7, contextWindow: 4096, cpuLimit: 80, ramLimit: 8 }
    ) : provider
  );

  const title = isNew ? (type === 'cloud' ? 'Adicionar Provedor Cloud' : 'Adicionar Provedor Local') : 'Editar Provedor';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) { onAdd(formData); } else { onSave(formData); }
  };
  
  return <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[70] flex items-center justify-center p-4"><form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"><div className="p-6 border-b border-zinc-800"><h3 className="font-bold text-zinc-100">{title}</h3></div><div className="p-6 space-y-4">{type === 'cloud' ? (<><div><label className="text-xs font-medium text-zinc-400">Nome do Provedor</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required /></div><div><label className="text-xs font-medium text-zinc-400">Modelo</label><input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div><div><label className="text-xs font-medium text-zinc-400">Chave API</label><input type="password" name="apiKey" value={formData.apiKey} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required /></div></>) : (<><div><label className="text-xs font-medium text-zinc-400">Nome do Provedor</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required /></div><div><label className="text-xs font-medium text-zinc-400">Modelo (Tag Ollama)</label><input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div><div><label className="text-xs font-medium text-zinc-400">Endpoint</label><input type="text" name="endpoint" value={formData.endpoint} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium text-zinc-400">Temperatura</label><input type="number" step="0.1" max="2" name="temperature" value={formData.temperature} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div><div><label className="text-xs font-medium text-zinc-400">Janela de Contexto</label><input type="number" step="512" name="contextWindow" value={formData.contextWindow} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium text-zinc-400">Limite CPU (%)</label><input type="number" name="cpuLimit" value={formData.cpuLimit} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div><div><label className="text-xs font-medium text-zinc-400">Limite RAM (GB)</label><input type="number" name="ramLimit" value={formData.ramLimit} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" /></div></div></>)}</div><div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-3"><button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancelar</button><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Salvar</button></div></form></div>;
};

const PREDEFINED_LOCAL_MODELS = [
  { name: 'Llama 3.1 8B Instruct', model: 'llama3.1:8b', endpoint: 'http://localhost:11434', size: '5.1 GB' },
  { name: 'Mistral 7B Instruct', model: 'mistral:7b', endpoint: 'http://localhost:11434', size: '4.1 GB' },
  { name: 'CodeGemma 7B', model: 'codegemma:7b', endpoint: 'http://localhost:11434', size: '4.9 GB' },
];

const ModelDownloader = ({ project, onAddModel }: { project: Project, onAddModel: (p: Omit<LocalAIInstance, 'id'>) => void }) => {
  const [downloading, setDownloading] = useState<{ [key: string]: number | undefined }>({});

  const startModelDownload = (modelData: any) => {
    if (project.config.localAIProviders.some(p => p.model === modelData.model)) {
      alert("Este modelo já existe na sua lista de provedores.");
      return;
    }

    setDownloading(prev => ({ ...prev, [modelData.model]: 0 }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setDownloading(prev => ({ ...prev, [modelData.model]: 100 }));
        
        setTimeout(() => {
            onAddModel({
                name: modelData.name,
                model: modelData.model,
                endpoint: modelData.endpoint,
                temperature: 0.7, cpuLimit: 80, ramLimit: 8, contextWindow: 4096,
            });
            setDownloading(prev => {
                const newState = { ...prev };
                delete newState[modelData.model];
                return newState;
            });
        }, 500);

      } else {
        setDownloading(prev => ({ ...prev, [modelData.model]: progress }));
      }
    }, 300);
  };
  
  const existingModels = project.config.localAIProviders.map(p => p.model);

  return (
    <div className="mt-6 pt-6 border-t border-zinc-700/50 space-y-4">
      <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Baixar Novos Modelos</h5>
      <div className="space-y-3">
        {PREDEFINED_LOCAL_MODELS.map(model => {
          const isDownloading = downloading[model.model] !== undefined;
          const isDownloaded = existingModels.includes(model.model);
          const progress = downloading[model.model];
          
          return (
            <div key={model.model} className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-200">{model.name}</p>
                <p className="text-[10px] text-zinc-500">{model.model} • {model.size}</p>
              </div>
              
              {isDownloading ? (
                 <div className="w-24 text-right">
                    <p className="text-[10px] font-mono text-indigo-400">{progress}%</p>
                    <div className="w-full h-1 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{width: `${progress}%`}}/>
                    </div>
                 </div>
              ) : (
                <button
                  onClick={() => startModelDownload(model)}
                  disabled={isDownloaded}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md flex items-center gap-1.5 transition disabled:opacity-50 ${isDownloaded ? 'text-emerald-400 cursor-default' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                >
                  {isDownloaded ? 'Instalado' : <><IconDownload /> Baixar</>}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};


const LocalEngineDownloader = ({ status, onStartDownload }: any) => (
  <div className="p-6 bg-zinc-800/40 border border-zinc-800 rounded-3xl space-y-4 text-center">
    <IconCpu size={24} className="mx-auto text-indigo-400" />
    <h4 className="text-sm font-bold text-zinc-100">Instalação de IA Local</h4>
    <p className="text-xs text-zinc-500">Baixe o runtime necessário para rodar modelos localmente, sem precisar de internet.</p>
    {status.status === 'idle' && <button onClick={onStartDownload} className="w-full py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition">Baixar Runtime Local (~1.2 GB)</button>}
    {status.status === 'downloading' && (<div className="space-y-3 pt-2"><div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-400"><span>Baixando...</span><span>{status.downloadProgress}%</span></div><div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${status.downloadProgress}%` }} /></div></div>)}
  </div>
);


export default AIConfigModal;
