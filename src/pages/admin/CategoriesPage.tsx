import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, toggleCategoryActive } from '../../lib/api';
import type { Category } from '../../types';
import { FolderTree, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createCategory({ name: newName, description: newDescription });
      toast.success(`Category "${newName}" added.`);
      setNewName('');
      setNewDescription('');
      loadCategories();
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const updated = await toggleCategoryActive(cat.id);
      toast.success(`Category ${updated.name} is now ${updated.is_active ? 'Active' : 'Disabled'}`);
      loadCategories();
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Request Categories</h1>
        <p className="text-sm text-ink/70 mt-0.5">
          Manage service request categories and intake classifications
        </p>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleCreateCategory} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold font-heading text-ledger-navy flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-worn-gold" />
          <span>Add New Service Category</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. HVAC & Ventilation"
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Description / Scope
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. Air conditioning, heating ducts, exhaust fans"
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {creating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4 text-white" />
          )}
          <span>Create Category</span>
        </button>
      </form>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-4 bg-slate-50 font-bold text-xs text-ink/70 uppercase tracking-wider grid grid-cols-12 gap-4">
          <span className="col-span-4">Category Name</span>
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-right">Status / Toggle</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading categories...</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/60 transition-colors">
              <span className="col-span-4 font-bold text-sm text-ledger-navy">{cat.name}</span>
              <span className="col-span-6 text-xs text-ink/70">{cat.description}</span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-colors ${
                    cat.is_active
                      ? 'bg-emerald-100 text-resolved-green hover:bg-emerald-200'
                      : 'bg-red-100 text-site-orange hover:bg-red-200'
                  }`}
                >
                  {cat.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{cat.is_active ? 'Active' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
