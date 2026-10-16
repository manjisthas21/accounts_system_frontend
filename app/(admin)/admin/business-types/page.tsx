'use client';

import { useState, useEffect } from 'react';
import { businessTypeAPI } from '@/lib/api';
import { FiPlus, FiTrash2, FiLoader, FiX, FiEdit2, FiGrid, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BusinessTypesPage() {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  const loadBusinessTypes = async () => {
    try {
      const response = await businessTypeAPI.getAll();
      setBusinessTypes(response.data);
    } catch (error) {
      toast.error('Failed to load business types');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    setSubmitting(true);
    try {
      await businessTypeAPI.create({ name: newType });
      toast.success('Business type added successfully');
      setNewType('');
      setIsModalOpen(false);
      loadBusinessTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add business type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await businessTypeAPI.delete(id);
      toast.success('Business type deleted successfully');
      loadBusinessTypes();
    } catch (error) {
      toast.error('Failed to delete business type');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <FiLoader className="animate-spin text-4xl text-indigo-600 mb-4" />
        <p className="text-gray-500">Loading business types...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Business Types
              </h1>
              <p className="text-gray-500 mt-2">
                Manage and organize business categories for companies
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  Total: {businessTypes.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiList size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiGrid size={18} />
                </button>
              </div>
              
              {/* Add Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiPlus size={18} />
                Add Business Type
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {businessTypes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiGrid className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No business types yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first business type</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition inline-flex items-center gap-2"
            >
              <FiPlus /> Add Business Type
            </button>
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type Name</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {businessTypes.map((type: any, index: number) => (
                    <tr key={type.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">#{type.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {type.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{type.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(type.id, type.name)}
                          className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businessTypes.map((type: any) => (
              <div
                key={type.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">
                        {type.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(type.id, type.name)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{type.name}</h3>
                  <p className="text-gray-500 text-sm">ID: #{type.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Business Type Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all animate-slideUp">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add Business Type</h2>
                  <p className="text-sm text-gray-500 mt-1">Create a new business category</p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewType('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAdd}>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type Name
                  </label>
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This will be used to categorize companies in the system.
                  </p>
                </div>
                
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewType('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        
                        Add 
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}