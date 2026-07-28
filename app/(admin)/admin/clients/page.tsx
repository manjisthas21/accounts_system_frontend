'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiLoader, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BusinessType {
  id: number;
  name: string;
}

interface ClientCompany {
  company_id: number;
  company_name: string;
  business_types: BusinessType[];
}

interface Client {
  id: number;
  name: string;
  companies: ClientCompany[];
}

interface CompanyForForm {
  id: number;
  name: string;
  business_types: BusinessType[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<CompanyForForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    companies: [] as { company_id: number; business_type_ids: number[] }[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients/');
      const clientsData = await clientsRes.json();
      console.log('Clients data:', clientsData);
      setClients(clientsData);

      // Fetch companies with their business types for the form dropdown
      const companiesRes = await fetch('/api/companies/with-business-types');
      const companiesData = await companiesRes.json();
      console.log('Companies data:', companiesData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Transform form data to match backend expected format
      const payload = {
        name: formData.name,
        mappings: formData.companies
          .filter(c => c.company_id > 0 && c.business_type_ids.length > 0)
          .map(c => ({
            company_id: c.company_id,
            business_type_ids: c.business_type_ids
          }))
      };
      
      console.log('Submitting payload:', payload);
      
      const url = editing 
        ? `/api/clients/${editing.id}`
        : `/api/clients/`;
      
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        toast.success(editing ? 'Client updated successfully' : 'Client added successfully');
        setShowModal(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        console.error('Save error:', error);
        toast.error(error.detail || 'Failed to save');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete all associated transactions.')) return;
    
    try {
      const response = await fetch(`/api/clients/${id}`, {
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

  const addCompanyToForm = () => {
    setFormData({
      ...formData,
      companies: [...formData.companies, { company_id: 0, business_type_ids: [] }]
    });
  };

  const removeCompanyFromForm = (index: number) => {
    const newCompanies = [...formData.companies];
    newCompanies.splice(index, 1);
    setFormData({ ...formData, companies: newCompanies });
  };

  const updateFormCompany = (index: number, companyId: number) => {
    const newCompanies = [...formData.companies];
    newCompanies[index] = { company_id: companyId, business_type_ids: [] };
    setFormData({ ...formData, companies: newCompanies });
  };

  const toggleFormBusinessType = (index: number, businessTypeId: number) => {
    const newCompanies = [...formData.companies];
    const currentIds = newCompanies[index].business_type_ids;
    
    if (currentIds.includes(businessTypeId)) {
      newCompanies[index].business_type_ids = currentIds.filter(id => id !== businessTypeId);
    } else {
      newCompanies[index].business_type_ids = [...currentIds, businessTypeId];
    }
    
    setFormData({ ...formData, companies: newCompanies });
  };

  const resetForm = () => {
    setFormData({ name: '', companies: [] });
    setEditing(null);
  };

  const getCompanyBusinessTypes = (companyId: number): BusinessType[] => {
    const company = companies.find(c => c.id === companyId);
    return company?.business_types || [];
  };

  const getCompanyName = (companyId: number): string => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Select a company';
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
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500">Manage clients and their associated companies & business types</p>
        </div>
        <div className="flex gap-3">
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <FiPlus /> Add Client
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Types</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => {
                const hasCompanies = client.companies && client.companies.length > 0;
                
                if (!hasCompanies) {
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{client.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400" colSpan={2}>No companies assigned</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditing(client);
                            // Convert existing companies to form format
                            const existingCompanies = client.companies?.map(c => ({
                              company_id: c.company_id,
                              business_type_ids: c.business_types.map(bt => bt.id)
                            })) || [];
                            setFormData({
                              name: client.name,
                              companies: existingCompanies
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                }
                
                // Client has companies - show each company as a separate row
                return client.companies.map((company, idx) => (
                  <tr key={`${client.id}-${idx}`} className="hover:bg-gray-50">
                    {idx === 0 && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-500" rowSpan={client.companies.length}>
                          {client.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900" rowSpan={client.companies.length}>
                          {client.name}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {company.company_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.business_types.map(bt => bt.name).join(', ')}
                    </td>
                    {idx === 0 && (
                      <td className="px-6 py-4 text-right" rowSpan={client.companies.length}>
                        <button
                          onClick={() => {
                            setEditing(client);
                            const existingCompanies = client.companies.map(c => ({
                              company_id: c.company_id,
                              business_type_ids: c.business_types.map(bt => bt.id)
                            }));
                            setFormData({
                              name: client.name,
                              companies: existingCompanies
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        
        {clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found. Click "Add Client" to create one.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Edit Client' : 'Add New Client'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Client Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter client name"
                  required
                />
              </div>

              {/* Companies and Business Types Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Companies & Business Types
                  </label>
                  <button
                    type="button"
                    onClick={addCompanyToForm}
                    className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Company
                  </button>
                </div>

                {formData.companies.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No companies added yet.</p>
                    <button
                      type="button"
                      onClick={addCompanyToForm}
                      className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      Click here to add a company
                    </button>
                  </div>
                )}

                {formData.companies.map((company, idx) => {
                  const availableBusinessTypes = getCompanyBusinessTypes(company.company_id);
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700">Company #{idx + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeCompanyFromForm(idx)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                        >
                          <FiTrash2 size={14} /> Remove
                        </button>
                      </div>
                      
                      {/* Company Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Company *
                        </label>
                        <select
                          value={company.company_id || ''}
                          onChange={(e) => updateFormCompany(idx, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">-- Select a Company --</option>
                          {companies.map(comp => (
                            <option key={comp.id} value={comp.id}>
                              {comp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Business Types Selection */}
                      {company.company_id > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Business Types * (Multi-select)
                          </label>
                          <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                            {availableBusinessTypes.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No business types available for this company.
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {availableBusinessTypes.map((bt) => (
                                  <label key={bt.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={company.business_type_ids.includes(bt.id)}
                                      onChange={() => toggleFormBusinessType(idx, bt.id)}
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">{bt.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          {company.business_type_ids.length > 0 && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ {company.business_type_ids.length} business type(s) selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}