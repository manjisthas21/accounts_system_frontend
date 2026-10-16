'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { onAccountAPI, clientAPI, businessTypeAPI } from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit, FiTrash2, FiLoader,
    FiX, FiDollarSign, FiUser, FiBriefcase
} from 'react-icons/fi';

// ─── Form Fields ─────────────────────────────────────────────
const FormFields = ({ isEdit = false, formData, setFormData, clients, businessTypes, clientMap, btMap }) => (
    <div className="space-y-4">
        {/* Client */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
                <input
                    value={clientMap.get(Number(formData.client_id)) || `Client ${formData.client_id}`}
                    disabled
                    className="form-input w-full bg-gray-100 text-gray-500"
                />
            ) : (
                <select
                    value={formData.client_id}
                    onChange={(e) => setFormData((p) => ({ ...p, client_id: e.target.value }))}
                    className="form-select w-full"
                    required
                >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Business Type */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
                <input
                    value={btMap.get(Number(formData.business_type_id)) || `Type ${formData.business_type_id}`}
                    disabled
                    className="form-input w-full bg-gray-100 text-gray-500"
                />
            ) : (
                <select
                    value={formData.business_type_id}
                    onChange={(e) => setFormData((p) => ({ ...p, business_type_id: e.target.value }))}
                    className="form-select w-full"
                    required
                >
                    <option value="">Select Business Type</option>
                    {businessTypes.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Amount */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                inputMode="decimal"
                value={formData.amount ?? ''}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                        setFormData((p) => ({ ...p, amount: val }));
                    }
                }}
                className="form-input w-full"
                placeholder="0.00"
                required
            />
        </div>

        {/* Date */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
                selected={formData.date}
                onChange={(d) => setFormData((p) => ({ ...p, date: d }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="form-input w-full"
                required
            />
        </div>

        {/* Reference */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference No.
            </label>
            <input
                type="text"
                value={formData.reference_no}
                onChange={(e) => setFormData((p) => ({ ...p, reference_no: e.target.value }))}
                className="form-input w-full"
                placeholder="e.g. CHQ-1234 / NEFT-XXXX"
            />
        </div>

        {/* Remarks */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
            </label>
            <textarea
                value={formData.remarks}
                onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                className="form-input w-full min-h-[70px]"
                placeholder="Optional notes..."
            />
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────
export default function OnAccountPage() {
    const [records, setRecords] = useState([]);
    const [clients, setClients] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const [filters, setFilters] = useState({ client_id: '', business_type_id: '' });

    const emptyForm = {
        client_id: '',
        business_type_id: '',
        amount: '',
        date: new Date(),
        reference_no: '',
        remarks: '',
    };
    const [formData, setFormData] = useState(emptyForm);

    // ─── Load All ─────────────────────────────────────────────
    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            await Promise.all([loadRecords(), loadClients(), loadBusinessTypes()]);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

   const loadRecords = async (filterValues = filters) => {
    try {
        const params: { client_id?: number; business_type_id?: number } = {};

        if (filterValues.client_id) {
            params.client_id = Number(filterValues.client_id);
        }

        if (filterValues.business_type_id) {
            params.business_type_id = Number(filterValues.business_type_id);
        }

        console.log('FILTER PARAMS:', params);

        const res = await onAccountAPI.getAll(
            Object.keys(params).length ? params : undefined
        );

        console.log('FILTER RESPONSE:', res.data);

        setRecords(res.data);
    } catch (err) {
        console.error('Failed to load records:', err);
        toast.error('Failed to load records');
    }
};

    const loadClients = async () => {
        try {
            const res = await clientAPI.getAll();
            setClients(res.data);
        } catch (err) {
            console.error('Failed to load clients:', err);
            toast.error('Failed to load clients');
        }
    };

    const loadBusinessTypes = async () => {
        try {
            const res = await businessTypeAPI.getAll();
            setBusinessTypes(res.data);
        } catch (err) {
            console.error('Failed to load business types:', err);
            toast.error('Failed to load business types');
        }
    };

    // ─── Re-fetch when filters change ─────────────────────────
    useEffect(() => {
        if (!loading) loadRecords();
    }, [filters]);

    // ─── Lookup maps ──────────────────────────────────────────
    const clientMap = useMemo(() => {
        const m = new Map();
        clients.forEach((c) => m.set(Number(c.id), c.name));
        return m;
    }, [clients]);

    const btMap = useMemo(() => {
        const m = new Map();
        businessTypes.forEach((b) => m.set(Number(b.id), b.name));
        return m;
    }, [businessTypes]);

    // ─── Summary totals ───────────────────────────────────────
    const totals = useMemo(() => {
        const byClient = {};
        records.forEach((r) => {
            byClient[r.client_id] = (byClient[r.client_id] || 0) + r.amount;
        });
        const grandTotal = records.reduce((s, r) => s + r.amount, 0);
        return { grandTotal, clientCount: Object.keys(byClient).length };
    }, [records]);

    // ─── Format helpers ───────────────────────────────────────
    const formatDate = (d) => {
        if (!d) return '-';
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
    };

    const formatAmount = (n) =>
        Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Replace the toISODate helper in your page.tsx with this:
const toISODate = (date: Date | string | null): string | null => {
    if (!date) return null;
    if (date instanceof Date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;   // ← local date, NOT .toISOString() which shifts to UTC
    }
    // already a string — strip time if present
    return String(date).split('T')[0];
};

    // ─── Add ──────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                client_id: parseInt(formData.client_id),
                business_type_id: parseInt(formData.business_type_id),
                amount: parseFloat(formData.amount),
                date: toISODate(formData.date),
                reference_no: formData.reference_no || null,
                remarks: formData.remarks || null,
            };

            await onAccountAPI.create(payload);

            toast.success('Record added successfully');
            setShowAddModal(false);
            setFormData(emptyForm);
            await loadRecords();
        } catch (err) {
            console.error('Add error:', err);
            toast.error('Failed to add record');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Edit ─────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        const payload = {
            amount: parseFloat(String(formData.amount)),
            date: toISODate(formData.date),
            reference_no: formData.reference_no || null,
            remarks: formData.remarks || null,
        };

        await onAccountAPI.update(selectedRecord.id, payload);

        toast.success('Record updated successfully');
        setShowEditModal(false);
        setSelectedRecord(null);
        await loadRecords();
    } catch (err) {
        console.error('Edit error:', err);
        toast.error(err.response?.data?.detail || 'Failed to update record');
    } finally {
        setSubmitting(false);
    }
};

    // ─── Delete ───────────────────────────────────────────────
    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await onAccountAPI.delete(selectedRecord.id);

            toast.success('Deleted successfully');
            setShowDeleteModal(false);
            setSelectedRecord(null);
            await loadRecords();
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (record) => {
        setSelectedRecord(record);
        setFormData({
            client_id: record.client_id,
            business_type_id: record.business_type_id,
            amount: record.amount,
            date: (() => {
                const [y, m, d] = record.date.split('-').map(Number);
                return new Date(y, m - 1, d);
            })(),
            reference_no: record.reference_no || '',
            remarks: record.remarks || '',
        });
        setShowEditModal(true);
    };

    const openDelete = (record) => {
        setSelectedRecord(record);
        setShowDeleteModal(true);
    };

    // ─── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <FiLoader className="animate-spin text-4xl text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="panel mt-6">
            <h5 className="mb-6 text-lg font-semibold dark:text-white-light">
                On Account Balances
            </h5>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex items-center gap-4">
                    <div className="rounded-full bg-indigo-100 p-3">
                        <FiDollarSign className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Grand Total</p>
                        <p className="text-xl font-bold text-indigo-700">₹{formatAmount(totals.grandTotal)}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-4">
                    <div className="rounded-full bg-emerald-100 p-3">
                        <FiUser className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-500 font-medium uppercase tracking-wide">Clients</p>
                        <p className="text-xl font-bold text-emerald-700">{totals.clientCount}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-4">
                    <div className="rounded-full bg-amber-100 p-3">
                        <FiBriefcase className="text-amber-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-amber-500 font-medium uppercase tracking-wide">Total Entries</p>
                        <p className="text-xl font-bold text-amber-700">{records.length}</p>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-5 flex flex-wrap items-end gap-3">
                <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={() => { setFormData(emptyForm); setShowAddModal(true); }}
                >
                    <FiPlus /> Add On Account
                </button>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Filter by Client</label>
                    <select
                        value={filters.client_id}
                        onChange={(e) => setFilters((p) => ({ ...p, client_id: e.target.value }))}
                        className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none min-w-[160px]"
                    >
                        <option value="">All Clients</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Filter by Business Type</label>
                    <select
                        value={filters.business_type_id}
                        onChange={(e) => setFilters((p) => ({ ...p, business_type_id: e.target.value }))}
                        className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none min-w-[160px]"
                    >
                        <option value="">All Types</option>
                        {businessTypes.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {(filters.client_id || filters.business_type_id) && (
                    <button
                        onClick={() => setFilters({ client_id: '', business_type_id: '' })}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition mt-5"
                    >
                        <FiX /> Clear
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Business Type</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Reference No.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Remarks</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            records.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                        {clientMap.get(Number(r.client_id)) || `Client ${r.client_id}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                            {btMap.get(Number(r.business_type_id)) || `Type ${r.business_type_id}`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                                        ₹{formatAmount(r.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.date)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{r.reference_no || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate" title={r.remarks}>
                                        {r.remarks || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => openEdit(r)}
                                                className="text-blue-500 hover:text-blue-700 transition"
                                                title="Edit"
                                            >
                                                <FiEdit size={15} />
                                            </button>
                                            <button
                                                onClick={() => openDelete(r)}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {records.length > 0 && (
                        <tfoot>
                            <tr className="bg-indigo-50 border-t-2 border-indigo-200 font-bold text-sm">
                                <td colSpan={2} className="px-4 py-3 text-indigo-700">
                                    TOTAL ({records.length} entries)
                                </td>
                                <td className="px-4 py-3 text-right text-indigo-800">
                                    ₹{formatAmount(totals.grandTotal)}
                                </td>
                                <td colSpan={4} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* ── Add Modal ── */}
            <Transition appear show={showAddModal} as={Fragment}>
                <Dialog as="div" onClose={() => setShowAddModal(false)}>
                    <div className="fixed inset-0 z-[999] bg-black/50" />
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex min-h-screen items-start justify-center px-4 pt-10 pb-20">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-lg rounded-xl bg-white shadow-xl">
                                    <div className="flex items-center justify-between border-b p-5">
                                        <Dialog.Title className="text-lg font-bold text-gray-800">
                                            Add On Account Balance
                                        </Dialog.Title>
                                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>
                                    <form onSubmit={handleAdd} className="p-6 space-y-1">
                                        <FormFields
                                            isEdit={false}
                                            formData={formData}
                                            setFormData={setFormData}
                                            clients={clients}
                                            businessTypes={businessTypes}
                                            clientMap={clientMap}
                                            btMap={btMap}
                                        />
                                        <div className="flex justify-end gap-3 pt-5">
                                            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={submitting} className="btn btn-primary">
                                                {submitting ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* ── Edit Modal ── */}
            <Transition appear show={showEditModal} as={Fragment}>
                <Dialog as="div" onClose={() => setShowEditModal(false)}>
                    <div className="fixed inset-0 z-[999] bg-black/50" />
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex min-h-screen items-start justify-center px-4 pt-10 pb-20">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-lg rounded-xl bg-white shadow-xl">
                                    <div className="flex items-center justify-between border-b p-5">
                                        <Dialog.Title className="text-lg font-bold text-gray-800">
                                            Edit On Account Balance
                                        </Dialog.Title>
                                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>
                                    <form onSubmit={handleEdit} className="p-6 space-y-1">
                                        <FormFields
                                            isEdit={true}
                                            formData={formData}
                                            setFormData={setFormData}
                                            clients={clients}
                                            businessTypes={businessTypes}
                                            clientMap={clientMap}
                                            btMap={btMap}
                                        />
                                        <div className="flex justify-end gap-3 pt-5">
                                            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={submitting} className="btn btn-primary">
                                                {submitting ? 'Updating...' : 'Update'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* ── Delete Modal ── */}
            <Transition appear show={showDeleteModal} as={Fragment}>
                <Dialog as="div" onClose={() => setShowDeleteModal(false)}>
                    <div className="fixed inset-0 z-[999] bg-black/50" />
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-md rounded-xl bg-white shadow-xl">
                                    <div className="border-b p-5">
                                        <Dialog.Title className="text-lg font-bold text-red-600">
                                            Delete Record
                                        </Dialog.Title>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-700 mb-2">
                                            Are you sure you want to delete the on-account entry of{' '}
                                            <span className="font-bold text-indigo-600">
                                                ₹{selectedRecord ? formatAmount(selectedRecord.amount) : ''}
                                            </span>{' '}
                                            for{' '}
                                            <span className="font-bold">
                                                {selectedRecord ? clientMap.get(Number(selectedRecord.client_id)) : ''}
                                            </span>?
                                        </p>
                                        <p className="text-sm text-red-500">⚠️ This action cannot be undone.</p>
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={submitting}
                                                className="btn bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                {submitting ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}