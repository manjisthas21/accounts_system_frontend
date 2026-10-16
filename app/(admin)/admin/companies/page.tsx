'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiLoader, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BusinessType {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  business_types: BusinessType[];
  business_type_ids?: number[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    business_type_ids: [] as number[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch companies with their business types
      const companiesRes = await fetch('/api/companies/with-business-types');
      const companiesData = await companiesRes.json();
      setCompanies(companiesData);

      // Fetch all business types for dropdown
      const btRes = await fetch('/api/business-types/');
      const btData = await btRes.json();
      setBusinessTypes(btData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        name: formData.name,
        business_type_ids: formData.business_type_ids
      };
      
      const url = editing 
        ? `/api/companies/${editing.id}`
        : `/api/companies/`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.success(editing ? 'Company updated successfully' : 'Company added successfully');
        setShowModal(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will affect client mappings.')) return;
    
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Deleted successfully');
        loadData();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', business_type_ids: [] });
    setEditing(null);
  };

  const toggleBusinessType = (typeId: number) => {
    setFormData(prev => ({
      ...prev,
      business_type_ids: prev.business_type_ids.includes(typeId)
        ? prev.business_type_ids.filter(id => id !== typeId)
        : [...prev.business_type_ids, typeId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader className="animate-spin text-4xl text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
          <p className="text-gray-500">Manage companies and their business types</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <FiPlus /> Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Types</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{company.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {company.business_types?.map(bt => bt.name).join(', ') || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setEditing(company);
                      setFormData({
                        name: company.name,
                        business_type_ids: company.business_types?.map(bt => bt.id) || []
                      });
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Edit Company' : 'Add Company'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Types
                </label>
                <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {businessTypes.map((bt) => (
                    <label key={bt.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.business_type_ids.includes(bt.id)}
                        onChange={() => toggleBusinessType(bt.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{bt.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}