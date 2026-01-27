import React, { useState } from 'react';
import { Project, CloudAIInstance, LocalAIInstance, HelperAIInstance } from '../types';
import { IconBot, IconSettings, IconPlus, IconCpu, IconDownload, IconTrash } from './Icons';

interface AIConfigModalProps {
  project: Project;
  setProject: (updater: (prev: Project) => Project) => void;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ project, setProject, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'helpers'>('main');
  const [editingProvider, setEditingProvider] = useState<CloudAIInstance | null | 'new-cloud'>(null);
  const [editingLocalProvider, setEditingLocalProvider] = useState<LocalAIInstance | null | 'new-local'>(null);

  // Cloud Provider Handlers
  const handleCloudSetActive = (id: string) => {
    setProject(p => ({...p, config: {...p.config, activeAIProviderId: id}}));
  };
  const handleCloudDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este provedor?")) {
      setProject(p => {
        const remainingProviders = p.config.cloudAIProviders.filter(provider => provider.id !== id);
        return { ...p, config: { ...p.config, cloudAIProviders: remainingProviders, activeAIProviderId: p.config.activeAIProviderId === id ? remainingProviders[0]?.id || null : p.config.activeAIProviderId } };
      });
    }
  };
  const handleCloudSave = (provider: CloudAIInstance) => {
    setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: p.config.cloudAIProviders.map(item => item.id === provider.id ? provider : item) }}));
    setEditingProvider(null);
  };
  const handleCloudAdd = (provider: Omit<CloudAIInstance, 'id'>) => {
    const newProvider = { ...provider, id: `provider-${Date.now()}` };
    setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: [...p.config.cloudAIProviders, newProvider]}}));
    setEditingProvider(null);
  };
  
  // Local Provider Handlers
  const handleLocalSetActive = (id: string) => {
    setProject(p => ({...p, config: {...p.config, activeLocalAIProviderId: id}}));
  };
  const handleLocalDownload = (id: string) => {
    setProject(p => ({ ...p, config: { ...p.config, localAIProviders: p.config.localAIProviders.map(item => item.id === id ? { ...item, status: 'downloading' } : item) }}));
    setTimeout(() => {
        setProject(p => ({ ...p, config: { ...p.config, localAIProviders: p.config.localAIProviders.map(item => item.id === id ? { ...item, status: 'downloaded' } : item) }}));
    }, 3000); // Simulate download time
  };
  const handleLocalAdd = (provider: Omit<LocalAIInstance, 'id'>) => {
    const newProvider = { ...provider, id: `local-provider-${Date.now()}` };
    setProject(p => ({ ...p, config: { ...p.config, localAIProviders: [...p.config.localAIProviders, newProvider]}}));
    setEditingLocalProvider(null);
  };
  
  // Helper AI Handlers
  const handleHelperDownload = (id: string) => {
    setProject(p => ({ ...p, config: { ...p.config, helperAIs: p.config.helperAIs.map(item => item.id === id ? { ...item, status: 'downloading' } : item) }}));
    setTimeout(() => {
        setProject(p => ({ ...p, config: { ...p.config, helperAIs: p.config.helperAIs.map(item => item.id === id ? { ...item, status: 'downloaded' } : item) }}));
    }, 2000);
  };
  const handleHelperToggle = (id: string, isActive: boolean) => {
    setProject(p => ({ ...p, config: { ...p.config, helperAIs: p.config.helperAIs.map(item => item.id === id ? { ...item, isActive } : item) }}));
  };


  if (editingProvider) {
    return <ProviderEditForm provider={editingProvider} onSave={handleCloudSave} onAdd={handleCloudAdd} onCancel={() => setEditingProvider(null)} />;
  }
  if (editingLocalProvider) {
    return <LocalProviderAddForm onAdd={handleLocalAdd} onCancel={() => setEditingLocalProvider(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><IconSettings size={20} /></div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100 leading-tight">Painel de Controle de IA</h3>
                    <p className="text-xs text-zinc-500">Gerencie seus assistentes de IA principais e de suporte</p>
                </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl transition-colors">&times;</button>
        </div>
        
        <div className="p-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-center gap-2">
            <button onClick={() => setActiveTab('main')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'main' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>IA Principal</button>
            <button onClick={() => setActiveTab('helpers')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'helpers' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>IAs de Suporte</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'main' && (
            <div>
                <div className="flex items-center justify-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm mx-auto mb-8">
                    <button onClick={() => setProject(p => ({...p, config: {...p.config, aiEngine: 'cloud'}}))} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition ${project.config.aiEngine === 'cloud' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:bg-zinc-700'}`}>Nuvem</button>
                    <button onClick={() => setProject(p => ({...p, config: {...p.config, aiEngine: 'local'}}))} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition ${project.config.aiEngine === 'local' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:bg-zinc-700'}`}>Local</button>
                </div>
                {project.config.aiEngine === 'cloud' ? (
                    <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconBot /> Provedores na Nuvem</h4>
                        <button onClick={() => setEditingProvider('new-cloud')} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"><IconPlus /> Adicionar</button>
                    </div>
                    <div className="space-y-3">
                        {project.config.cloudAIProviders.map((p: CloudAIInstance) => <ProviderCard key={p.id} provider={p} isActive={project.config.activeAIProviderId === p.id} onSetActive={handleCloudSetActive} onEdit={(provider) => { setEditingProvider(provider); }} onDelete={handleCloudDelete} />)}
                    </div>
                    </section>
                ) : (
                    <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconCpu size={16} /> Provedores Locais</h4>
                        <button onClick={() => setEditingLocalProvider('new-local')} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"><IconPlus /> Adicionar Manualmente</button>
                    </div>
                    <div className="space-y-3">
                        {project.config.localAIProviders.map((p: LocalAIInstance) => <LocalProviderCard key={p.id} provider={p} isActive={project.config.activeLocalAIProviderId === p.id} onSetActive={handleLocalSetActive} onDownload={handleLocalDownload} />)}
                    </div>
                    </section>
                )}
            </div>
          )}

          {activeTab === 'helpers' && (
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconCpu size={16} /> IAs Especializadas de Suporte</h4>
                </div>
                <p className="text-xs text-zinc-500">Ative IAs de suporte para auxiliar a IA principal em tarefas específicas, como segurança e otimização. Elas precisam ser baixadas antes de poderem ser ativadas.</p>
                <div className="space-y-3">
                    {project.config.helperAIs.map((p: HelperAIInstance) => <HelperAICard key={p.id} provider={p} onDownload={handleHelperDownload} onToggle={handleHelperToggle} />)}
                </div>
            </section>
          )}

        </div>

        <div className="p-6 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Fechar</button>
        </div>
      </div>
    </div>
  );
};

interface ProviderCardProps {
  provider: CloudAIInstance;
  isActive: boolean;
  onSetActive: (id: string) => void;
  onEdit: (p: CloudAIInstance) => void;
  onDelete: (id: string) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, isActive, onSetActive, onEdit, onDelete }) => (
  <div className={`p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
    <div className="flex justify-between items-start">
        <div>
            <p className="font-bold text-xs text-zinc-100">{provider.name}</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">{provider.model}</p>
        </div>
        {!isActive ? (
            <button onClick={() => onSetActive(provider.id)} className="px-2 py-1 text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600 rounded-md">Ativar</button>
        ) : (
            <div className="px-2 py-1 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 rounded-md">Ativo</div>
        )}
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700/50">
        <button onClick={() => onEdit(provider)} className="text-[10px] text-zinc-400 hover:text-white">Editar</button>
        <div className="w-px h-3 bg-zinc-600"></div>
        <button onClick={() => onDelete(provider.id)} className="text-[10px] text-zinc-400 hover:text-red-400">Excluir</button>
    </div>
  </div>
);

interface LocalProviderCardProps {
    provider: LocalAIInstance;
    isActive: boolean;
    onSetActive: (id: string) => void;
    onDownload: (id: string) => void;
}

const LocalProviderCard: React.FC<LocalProviderCardProps> = ({ provider, isActive, onSetActive, onDownload }) => {
    const compatibilityClasses = {
        compatible: 'bg-emerald-500/10 text-emerald-400',
        incompatible: 'bg-red-500/10 text-red-400',
        unknown: 'bg-zinc-500/10 text-zinc-400',
    };
    return (
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
            <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-700 rounded-lg"><IconCpu size={20} /></div>
                <div>
                    <p className="font-bold text-xs text-zinc-100">{provider.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-zinc-500 font-mono">{provider.engine}</p>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${compatibilityClasses[provider.compatibility]}`}>{provider.compatibility}</span>
                    </div>
                </div>
            </div>
            <div>
                {provider.status === 'not_downloaded' && (
                    <button onClick={() => onDownload(provider.id)} disabled={provider.compatibility !== 'compatible'} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase bg-indigo-600 hover:bg-indigo-700 rounded-md text-white disabled:bg-zinc-600 disabled:cursor-not-allowed"><IconDownload /> Download</button>
                )}
                {provider.status === 'downloading' && (
                    <button disabled className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-700 rounded-md text-zinc-400"><div className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin"/> Baixando...</button>
                )}
                {provider.status === 'downloaded' && !isActive && (
                    <button onClick={() => onSetActive(provider.id)} className="px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600 rounded-md">Ativar</button>
                )}
                {provider.status === 'downloaded' && isActive && (
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 rounded-md">Ativo</div>
                )}
            </div>
        </div>
    );
};
interface HelperAICardProps {
    provider: HelperAIInstance;
    onDownload: (id: string) => void;
    onToggle: (id: string, isActive: boolean) => void;
}
const HelperAICard: React.FC<HelperAICardProps> = ({ provider, onDownload, onToggle }) => {
    const taskColorClasses = {
      'Security Scan': 'bg-red-500/10 text-red-400',
      'Code Optimization': 'bg-amber-500/10 text-amber-400',
      'UI/UX Feedback': 'bg-sky-500/10 text-sky-400',
      'Database Design': 'bg-purple-500/10 text-purple-400',
    };
  
    return (
      <div className="p-4 rounded-2xl border bg-zinc-800/50 border-zinc-700 transition-all flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-bold text-xs text-zinc-100">{provider.name}</p>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${taskColorClasses[provider.task]}`}>{provider.task}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 pr-4">{provider.description}</p>
        </div>
        <div className="flex items-center gap-4">
            {provider.status === 'not_downloaded' && (
                <button onClick={() => onDownload(provider.id)} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600 rounded-md text-white"><IconDownload /> Download</button>
            )}
            {provider.status === 'downloading' && (
                <button disabled className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-700 rounded-md text-zinc-400"><div className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin"/> Baixando...</button>
            )}
            {provider.status === 'downloaded' && (
              <label htmlFor={`toggle-${provider.id}`} className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" id={`toggle-${provider.id}`} className="sr-only" checked={provider.isActive} onChange={(e) => onToggle(provider.id, e.target.checked)} />
                  <div className={`block w-10 h-5 rounded-full transition ${provider.isActive ? 'bg-indigo-600' : 'bg-zinc-600'}`}></div>
                  <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${provider.isActive ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            )}
        </div>
      </div>
    );
  };

const ProviderEditForm = ({ provider, onSave, onAdd, onCancel }: { provider: CloudAIInstance | 'new-cloud', onSave: (p: CloudAIInstance) => void, onAdd: (p: Omit<CloudAIInstance, 'id'>) => void, onCancel: () => void }) => {
  const isNew = provider === 'new-cloud';
  
  const [formData, setFormData] = useState<Omit<CloudAIInstance, 'id'> | CloudAIInstance>(
    isNew ? { name: '', provider: 'Gemini', model: 'gemini-3-pro-preview' } : provider
  );

  const title = isNew ? 'Adicionar Provedor Nuvem' : 'Editar Provedor';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      onAdd(formData as Omit<CloudAIInstance, 'id'>);
    } else {
      onSave(formData as CloudAIInstance);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[70] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800"><h3 className="font-bold text-zinc-100">{title}</h3></div>
        <div className="p-6 space-y-4">
            <div>
                <label className="text-xs font-medium text-zinc-400">Nome do Provedor</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required />
            </div>
            <div>
                <label className="text-xs font-medium text-zinc-400">Modelo</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" placeholder="ex: gemini-3-pro-preview" />
            </div>
        </div>
        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Salvar</button>
        </div>
      </form>
    </div>
  );
};

const LocalProviderAddForm = ({ onAdd, onCancel }: { onAdd: (p: Omit<LocalAIInstance, 'id'>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({ name: '', engine: '' });
  const title = 'Adicionar Provedor Local';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, status: 'downloaded', compatibility: 'unknown' });
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[70] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800"><h3 className="font-bold text-zinc-100">{title}</h3></div>
        <div className="p-6 space-y-4">
            <div>
                <label className="text-xs font-medium text-zinc-400">Nome do Modelo</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" required placeholder="ex: Meu Llama3 Customizado"/>
            </div>
            <div>
                <label className="text-xs font-medium text-zinc-400">Mecanismo (Opcional)</label>
                <input type="text" name="engine" value={formData.engine} onChange={handleChange} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm" placeholder="ex: Llama3" />
            </div>
            <p className="text-[11px] text-zinc-500">Esta função assume que o modelo já está acessível em sua máquina local via um endpoint compatível.</p>
        </div>
        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Adicionar</button>
        </div>
      </form>
    </div>
  );
};


export default AIConfigModal;