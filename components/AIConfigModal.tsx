import React, { useState } from 'react';
import { Project, CloudAIInstance } from '../types';
import { IconBot, IconSettings, IconPlus, IconTrash } from './Icons';

interface AIConfigModalProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ project, setProject, onClose }) => {
  const [editingProvider, setEditingProvider] = useState<CloudAIInstance | null | 'new-cloud'>(null);

  const handleSetActive = (id: string) => {
    setProject(p => ({...p, config: {...p.config, activeAIProviderId: id}}));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este provedor?")) {
      setProject(p => {
        const remainingProviders = p.config.cloudAIProviders.filter(provider => provider.id !== id);
        return {
            ...p,
            config: {
            ...p.config,
            cloudAIProviders: remainingProviders,
            activeAIProviderId: p.config.activeAIProviderId === id 
                ? remainingProviders[0]?.id || null 
                : p.config.activeAIProviderId,
            }
        };
      });
    }
  };

  const handleSave = (provider: CloudAIInstance) => {
    setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: p.config.cloudAIProviders.map(item => item.id === provider.id ? provider : item) }}));
    setEditingProvider(null);
  };

  const handleAdd = (provider: Omit<CloudAIInstance, 'id'>) => {
    const newId = `provider-${Date.now()}`;
    const newProvider = { ...provider, id: newId };
    setProject(p => ({ ...p, config: { ...p.config, cloudAIProviders: [...p.config.cloudAIProviders, newProvider]}}));
    setEditingProvider(null);
  };

  if (editingProvider) {
    return <ProviderEditForm provider={editingProvider} onSave={handleSave} onAdd={handleAdd} onCancel={() => setEditingProvider(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><IconSettings size={20} /></div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100 leading-tight">Painel de Controle de IA</h3>
                    <p className="text-xs text-zinc-500">Gerencie seus provedores de IA na Nuvem</p>
                </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl transition-colors">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400"><IconBot /> Provedores na Nuvem</h4>
                <button onClick={() => setEditingProvider('new-cloud')} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"><IconPlus /> Adicionar</button>
            </div>
            <div className="space-y-3">
                {project.config.cloudAIProviders.map(p => <ProviderCard key={p.id} provider={p} isActive={project.config.activeAIProviderId === p.id} onSetActive={handleSetActive} onEdit={(providerToEdit) => { setEditingProvider(providerToEdit); }} onDelete={handleDelete} />)}
            </div>
          </section>
        </div>

        <div className="p-6 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const ProviderCard = ({ provider, isActive, onSetActive, onEdit, onDelete }: { provider: CloudAIInstance, isActive: boolean, onSetActive: (id: string) => void, onEdit: (p: CloudAIInstance) => void, onDelete: (id: string) => void }) => (
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

const ProviderEditForm = ({ provider, onSave, onAdd, onCancel }: { provider: CloudAIInstance | 'new-cloud', onSave: (p: CloudAIInstance) => void, onAdd: (p: Omit<CloudAIInstance, 'id'>) => void, onCancel: () => void }) => {
  const isNew = provider === 'new-cloud';
  
  const [formData, setFormData] = useState<Omit<CloudAIInstance, 'id'> | CloudAIInstance>(
    isNew ? { name: '', provider: 'Gemini', model: 'gemini-3-pro-preview' } : provider
  );

  const title = isNew ? 'Adicionar Provedor Cloud' : 'Editar Provedor';

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

export default AIConfigModal;