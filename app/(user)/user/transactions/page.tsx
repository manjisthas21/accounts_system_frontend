'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { transactionAPI, clientAPI, companyAPI } from '@/lib/api';
import { FiPlus, FiEye, FiLoader, FiSearch, FiEdit, FiTrash2, FiDownload, FiPrinter } from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


export default function UserTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
  const [allBusinessTypes, setAllBusinessTypes] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleteKey, setDeleteKey] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const SUPER_ADMIN_ID = 1;

  const [filters, setFilters] = useState({
    billNumber: '',
    clientName: '',
    companyName: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    client_id: '',
    company_id: '',
    business_type_id: '',
    financial_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    bill_number: '',
    bill_date: new Date(),
    collection_date: null,
    credit_note_date: null,
    due_date: null,
    taxable_value: '',
    govt_fee: '',
    collection_amount: '',
    tds_rate: 10,
    tds_rcvd: '',
    payment_term: 30,
    gst_rate: 18,
    credit_note_no: '',
    credit_note_value: '',
    remarks: '',
    taxable_value_edit_reason: '',

  });

  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);

  useEffect(() => {
    loadAllInitialData();

  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const loadAllInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTransactions(),
        loadClients(),
        loadCompanies(),
        loadBusinessTypesList()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const safeAmount = (val: number | null | undefined): number => {
    const n = Number(val ?? 0);
    if (isNaN(n)) return 0;
    const rounded = Math.round(n * 100) / 100;
    return Math.abs(rounded) < 0.005 ? 0 : rounded;
  };


  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteKey('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteKey || deleteKey.trim() === '') {
      toast.error('Please enter the admin delete key');
      return;
    }

    try {
      setSubmitting(true);

      await transactionAPI.delete(transactionToDelete.id, deleteKey);

      toast.success('Transaction deleted successfully');
      setShowDeleteModal(false);
      await loadTransactions();

    } catch (error) {
      console.error('Delete error:', error);

      if (error.response?.status === 403) {
        toast.error('Invalid admin key. Access denied.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to delete transaction');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        console.log("Decoded user:", decoded);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      console.log("Loaded User:", user); // DEBUG
      setCurrentUser(user);
    }
  }, []);



  // Check if current user is super admin
  const isSuperAdmin = () => {
    return Number(currentUser?.id) === 1;
  };




  const DateInput = ({ label, value, onChange, required = false, disabled = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText="dd/mm/yyyy"
        className="form-input w-full"
        disabled={disabled}
      />
    </div>
  );

  useEffect(() => {
    if (formData.bill_date && formData.payment_term) {
      const due = new Date(formData.bill_date);
      due.setDate(due.getDate() + Number(formData.payment_term));

      setFormData(prev => ({ ...prev, due_date: due }));
    }
  }, [formData.bill_date, formData.payment_term]);

  const loadBusinessTypesList = async () => {
    try {
      const response = await fetch('/api/business-types/');
      const data = await response.json();
      setAllBusinessTypes(data);
    } catch (error) {
      console.error('Failed to load business types list:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientAPI.getAll();
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await companyAPI.getAll();
      setAllCompanies(res.data);
    } catch (error) {
      console.error('Failed to load companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadBusinessTypes = async (companyId) => {
    setLoadingBusinessTypes(true);
    try {
      const res = await companyAPI.getBusinessTypes(companyId);
      setBusinessTypes(res.data?.business_types || []);
    } catch (error) {
      console.error('Business types error:', error);
      toast.error('Failed to load business types');
      setBusinessTypes([]);
    } finally {
      setLoadingBusinessTypes(false);
    }
  };

  const clientMap = useMemo(() => {
    const map = new Map();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const companyMap = useMemo(() => {
    const map = new Map();
    allCompanies.forEach(c => map.set(c.id, c.name));
    return map;
  }, [allCompanies]);

  const businessTypeMap = useMemo(() => {
    const map = new Map();
    allBusinessTypes.forEach(b => map.set(b.id, b.name));
    allCompanies.forEach(company => {
      if (Array.isArray(company.business_types)) {
        company.business_types.forEach(b => {
          if (!map.has(b.id)) map.set(b.id, b.name);
        });
      }
    });
    return map;
  }, [allBusinessTypes, allCompanies]);

  const getClientName = (clientId) => clientMap.get(clientId) || `Client ${clientId}`;
  const getCompanyName = (companyId) => companyMap.get(companyId) || `Company ${companyId}`;
  const getBusinessTypeName = (btId) => businessTypeMap.get(btId) || `Type ${btId}`;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      billNumber: '',
      clientName: '',
      companyName: '',
      status: ''
    });
    setSearchTerm('');
  };

  const filteredTransactions = useMemo(() => transactions.filter(t => {
    const matchesBillNumber = filters.billNumber ? t.bill_number?.toLowerCase().includes(filters.billNumber.toLowerCase()) : true;
    const matchesClientName = filters.clientName ? getClientName(t.client_id)?.toLowerCase().includes(filters.clientName.toLowerCase()) : true;
    const matchesCompanyName = filters.companyName ? getCompanyName(t.company_id)?.toLowerCase().includes(filters.companyName.toLowerCase()) : true;
    const matchesStatus = filters.status ? t.status === filters.status : true;
    const matchesSearch = searchTerm ? (
      t.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(t.client_id)?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;
    return matchesBillNumber && matchesClientName && matchesCompanyName && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.bill_date);
    const dateB = new Date(b.bill_date);
    if (dateA - dateB !== 0) return dateA - dateB;
    return a.id - b.id;
  }), [transactions, filters, searchTerm, clientMap, companyMap]);

  const totalPages = useMemo(
    () => Math.ceil(filteredTransactions.length / rowsPerPage),
    [filteredTransactions]
  );


  const getPagination = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2);
      if (totalPages > 5) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages;
  }, [totalPages]);

  // Helper function to format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columnTotals = useMemo(() => {
    const raw = {
      taxable_value: filteredTransactions.reduce((sum, t) => sum + (t.taxable_value || 0), 0),
      govt_fee: filteredTransactions.reduce((sum, t) => sum + (t.govt_fee || 0), 0),
      gst_amount: filteredTransactions.reduce((sum, t) => sum + (t.gst_amount || 0), 0),
      total_bill_amount: filteredTransactions.reduce((sum, t) => sum + (t.total_bill_amount || 0), 0),
      collection_amount: filteredTransactions.reduce((sum, t) => sum + (t.collection_amount || 0), 0),
      balance: filteredTransactions.reduce((sum, t) => sum + safeAmount(t.balance), 0),
      actual_tds_receivable: filteredTransactions.reduce((sum, t) => sum + (t.actual_tds_receivable || 0), 0),
      tds_rcvd: filteredTransactions.reduce((sum, t) => sum + (t.tds_rcvd || 0), 0),
      tds_to_be_credited: filteredTransactions.reduce((sum, t) => sum + (t.tds_to_be_credited || 0), 0),
      credit_note_value: filteredTransactions.reduce((sum, t) => sum + (t.credit_note_value || 0), 0),
    };

    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Math.round(v * 100) / 100])
    );
  }, [filteredTransactions]);

  const exportToExcel = () => {
    const exportData = filteredTransactions.map(t => ({
      'Bill Number': t.bill_number,
      'Bill Date': t.bill_date,
      'Bill Month': t.bill_month,
      'Client': getClientName(t.client_id),
      'Company': getCompanyName(t.company_id),
      'Business Type': getBusinessTypeName(t.business_type_id),
      'Financial Year': t.financial_year,
      'Taxable Value': t.taxable_value,
      'Govt Fee': t.govt_fee,
      'GST Amount': t.gst_amount,
      'Total Amount': t.total_bill_amount,
      'Collection Amount': t.collection_amount,
      'Balance': t.balance,
      'TDS Rate': t.tds_rate,
      'TDS Receivable': t.actual_tds_receivable,
      'TDS Received': t.tds_rcvd,
      'TDS to Credit': t.tds_to_be_credited,
      'Status': t.status,
      'Due Date': t.due_date,
      'Payment Term': t.payment_term,
      'Collection Date': t.collection_date,
      'Collection Month': t.collection_month,
      'Credit Note No': t.credit_note_no,
      'Credit Note Date': t.credit_note_date,
      'Credit Note Value': t.credit_note_value,
      'Aging (Bill Date)': t.aging_from_bill_date,
      'Aging (Due Date)': t.aging_from_due_date,
      'Slab': t.slab,
      'Aging Bucket': t.aging_bucket
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Transactions Report', 14, 15);

    const tableData = filteredTransactions.map(t => [
      t.bill_number,
      t.bill_date,
      getClientName(t.client_id),
      `₹${t.total_bill_amount?.toLocaleString()}`,
      `₹${t.balance?.toLocaleString()}`,
      t.status?.toUpperCase(),
      `${t.aging_from_due_date} days`
    ]);

    autoTable(doc, {
      head: [['Bill No', 'Date', 'Client', 'Total', 'Balance', 'Status', 'Aging']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Exported to PDF successfully');
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);

    setFormData({
      taxable_value: transaction.taxable_value ?? '',
      gst_rate: transaction.gst_rate ?? 18,
      bill_number: transaction.bill_number || '',

      collection_amount: transaction.collection_amount ?? 0,
      collection_date: transaction.collection_date || '',

      tds_rate: transaction.tds_rate ?? 10,
      tds_rcvd: transaction.tds_rcvd ?? 0,

      payment_term: transaction.payment_term ?? 30,

      credit_note_date: transaction.credit_note_date || '',
      credit_note_no: transaction.credit_note_no || '',
      credit_note_value: transaction.credit_note_value ?? 0,
      remarks: transaction.remarks || '',
      round_up: transaction.round_up ?? 0,
      taxable_value_edit_reason: transaction.taxable_value_edit_reason || '',
    });

    setShowEditModal(true);
  };
  const handleUpdate = async (e) => {
    e.preventDefault();

     const taxableChanged = Number(formData.taxable_value) !== Number(selectedTransaction.taxable_value);
  if (isSuperAdmin() && taxableChanged && !formData.taxable_value_edit_reason?.trim()) {
    toast.error('Please provide a reason for editing the taxable value');
    return;
  }



    setSubmitting(true);

    try {
      const payload = {
        client_id: Number(selectedTransaction.client_id),
        company_id: Number(selectedTransaction.company_id),
        business_type_id: Number(selectedTransaction.business_type_id),

        financial_year: selectedTransaction.financial_year,
        bill_number: selectedTransaction.bill_number,
        bill_date: selectedTransaction.bill_date,

        taxable_value: Number(formData.taxable_value ?? selectedTransaction.taxable_value),
        gst_rate: parseFloat(formData.gst_rate || 18),
        govt_fee: Number(selectedTransaction.govt_fee || 0),

        collection_amount: Number(formData.collection_amount || 0),
        collection_date: formData.collection_date || null,

        tds_rate: Number(formData.tds_rate || 0),
        tds_rcvd: Number(formData.tds_rcvd || 0),

        credit_note_no: formData.credit_note_no || null,
        credit_note_date: formData.credit_note_date || null,
        credit_note_value: Number(formData.credit_note_value || 0),
        remarks: formData.remarks || null,
        round_up: parseFloat(formData.round_up) || 0,
        taxable_value_edit_reason: formData.taxable_value_edit_reason || null,
      };

      const response = await transactionAPI.update(
        selectedTransaction.id,
        payload
      );

      setTransactions((prev) => {
        const index = prev.findIndex(t => t.id === selectedTransaction.id);

        if (index === -1) return prev;

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...Object.fromEntries(
            Object.entries(response.data).filter(
              ([_, v]) => v !== null && v !== undefined
            )
          )
        };

        return updated;
      });

      toast.success('Transaction updated successfully');
      setShowEditModal(false);
      resetForm();
      setSelectedTransaction(null);

    } catch (error) {
      console.error(error);
      toast.error('Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionAPI.delete(transactionId);

      toast.success('Transaction deleted successfully');
      await loadTransactions();

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  const generateFinancialYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();

    for (let i = -5; i <= 5; i++) {
      const start = currentYear + i;
      const end = (start + 1).toString().slice(-2);
      years.push(`${start}-${end}`);
    }

    return years;
  };

  const handleClientChange = async (e) => {
    const clientId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      company_id: '',
      business_type_id: ''
    }));
    setBusinessTypes([]);
    setCompanies([]);
    if (!clientId) return;
    setLoadingCompanies(true);
    try {
      const response = await clientAPI.getById(clientId);
      const selectedClient = response.data;
      if (selectedClient.mappings?.length > 0) {
        const clientCompanies = selectedClient.mappings.map((mapping) => {
          const company = allCompanies.find(c => c.id === mapping.company_id);
          return {
            company_id: mapping.company_id,
            company_name: company?.name || `Company ${mapping.company_id}`,
            business_type_ids: mapping.business_type_ids
          };
        });
        setCompanies(clientCompanies);
      } else {
        toast.error('No companies assigned to this client');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Failed to load client details');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanyChange = (e) => {
    const companyId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      company_id: companyId,
      business_type_id: ''
    }));
    setBusinessTypes([]);
    if (!companyId) return;
    loadBusinessTypes(companyId);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      setSubmitting(true);

      const response = await fetch('/api/transactions/upload-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      // ❌ FULL REJECT CASE
      if (!response.ok || data.success === false) {
        const errors = data?.errors || [];

        // show first error in toast
        toast.error(
          errors.length
            ? `Row ${errors[0].row}: ${errors[0].message}`
            : (data.detail || 'CSV validation failed')
        );

        // log full error list
        console.table(errors);

        return;
      }

      // ✅ SUCCESS ONLY WHEN FULL FILE OK
      toast.success(`Successfully uploaded ${data.success_count || 'all'} rows`);

      await loadTransactions();
      setCsvFile(null);

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatForAPI = (date) => {
    if (!date) return null;

    // If it's already a Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // If it's a string, try to parse it
    if (typeof date === 'string') {
      // Check if it's already in DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date;
      }

      // Try to create a Date object from string
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = parsedDate.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        client_id: parseInt(formData.client_id),
        company_id: parseInt(formData.company_id),
        business_type_id: parseInt(formData.business_type_id),
        financial_year: formData.financial_year,
        bill_number: formData.bill_number,
        bill_date: formatForAPI(formData.bill_date),
        taxable_value: parseFloat(formData.taxable_value),
        gst_rate: parseFloat(formData.gst_rate ?? 18),
        govt_fee: parseFloat(formData.govt_fee || 0),
        collection_amount: parseFloat(formData.collection_amount || 0),
        tds_rate: parseFloat(formData.tds_rate || 10),
        tds_rcvd: parseFloat(formData.tds_rcvd || 0),
        payment_term: parseInt(formData.payment_term || 30),
        collection_date: formatForAPI(formData.collection_date),
        credit_note_date: formatForAPI(formData.credit_note_date),
        credit_note_no: formData.credit_note_no || null,
        credit_note_value: parseFloat(formData.credit_note_value || 0)
      };
      await transactionAPI.create(payload);
      toast.success('Transaction added successfully');
      setShowAddModal(false);
      resetForm();
      await loadTransactions();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      bill_number: '',
      client_id: '',
      company_id: '',
      business_type_id: '',
      financial_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      bill_date: new Date(), // Changed from string to Date object
      taxable_value: '',
      gst_rate: 18,
      govt_fee: 0,
      collection_amount: 0,
      tds_rate: 10,
      tds_rcvd: 0,
      payment_term: 30,
      collection_date: null, // Changed from '' to null
      credit_note_date: null, // Changed from '' to null
      credit_note_no: '',
      credit_note_value: 0,
      taxable_value_edit_reason: ''
    });

    setCompanies([]);
    setBusinessTypes([]);
    setSelectedTransaction(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.replace('_', ' ').toUpperCase();
  };


  const paginatedTransactions = useMemo(
    () => filteredTransactions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredTransactions, currentPage]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel mt-6 overflow-hidden">
      <h5 className="mb-5 text-lg font-semibold dark:text-white-light">
        Transactions Management
      </h5>

      <div className="mb-4 flex flex-wrap items-center gap-3">

        {/* Add Transaction */}
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <FiPlus className="mr-2" /> Add Transaction
        </button>

        {/* CSV Upload */}
        <div className="flex flex-col gap-1">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            className="border px-3 py-2 rounded"
          />

          <p className="text-xs text-gray-500">
            ⚠️ CSV date format must be <b>DD-MM-YYYY</b> (example: 08-02-2025)
          </p>
        </div>

        <button
          onClick={handleCSVUpload}
          className="btn btn-success"
          disabled={submitting}
        >
          {submitting ? 'Uploading...' : 'Upload CSV'}
        </button>

      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Bill Number */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bill Number</label>
            <input
              type="text"
              name="billNumber"
              value={filters.billNumber}
              onChange={handleFilterChange}
              placeholder="Search bill"
              className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Client */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Client</label>
            <input
              type="text"
              name="clientName"
              value={filters.clientName}
              onChange={handleFilterChange}
              placeholder="Search client"
              className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Company */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Company</label>
            <input
              type="text"
              name="companyName"
              value={filters.companyName}
              onChange={handleFilterChange}
              placeholder="Search company"
              className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* Search */}


      {/* Full Data Table with All Columns */}
      <div className="w-full overflow-x-auto max-w-full">
        <table className="min-w-[2000px] table-fixed table-hover">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 w-[120px] text-center text-xs font-semibold uppercase">Actions</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Bill No</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Bill Date</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Bill Month</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Client</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Company</th>
              <th className="px-3 py-3  w-[120px] text-left text-xs font-semibold uppercase">Business Type</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">Financial Year</th>
              <th className="px-3 py-3  w-[120px] text-right text-xs font-semibold uppercase">Taxable</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">Govt Fee</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">GST</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">Total</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">Collected</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">Balance</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase">Tds rate</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase">Actual Tds receivable</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase">TDS Received</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase">TDS To Be Credited</th>

              <th className="px-3 py-3 w-[120px] text-center text-xs font-semibold uppercase">Status</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">Due Date</th>
              <th className="px-3 py-3 w-[120px] text-center text-xs font-semibold uppercase">Term</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">Coll Date</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">Coll Month</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">CN No</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">CN Date</th>
              <th className="px-3 py-3 w-[120px] text-right text-xs font-semibold uppercase">
                CN Value
              </th>
              <th className="px-3 py-3 w-[120px] text-center text-xs font-semibold uppercase">Aging Bill</th>
              <th className="px-3 py-3 w-[120px] text-center text-xs font-semibold uppercase">Aging Due</th>
              <th className="px-3 py-3 w-[120px] text-left text-xs font-semibold uppercase">Slab</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>

                    {currentUser && isSuperAdmin() && (
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete (Super Admin Only)"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="View"
                    >
                      <FiEye size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">{transaction.bill_number}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{formatDate(transaction.bill_date)}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{transaction.bill_month}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{getClientName(transaction.client_id)}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{getCompanyName(transaction.company_id)}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{getBusinessTypeName(transaction.business_type_id)}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{transaction.financial_year}</td>
                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">₹{transaction.taxable_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">₹{transaction.govt_fee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">₹{transaction.gst_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-indigo-600 whitespace-nowrap">₹{transaction.total_bill_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">₹{transaction.collection_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-sm font-semibold whitespace-nowrap"
                  style={{ color: safeAmount(transaction.balance) > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{safeAmount(transaction.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-center text-sm whitespace-nowrap">
                  {transaction.tds_rate}%
                </td>

                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">
                  ₹{transaction.actual_tds_receivable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">
                  ₹{transaction.tds_rcvd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                <td className="px-3 py-2 text-right text-sm whitespace-nowrap">
                  ₹{transaction.tds_to_be_credited?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>


                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(transaction.status)}`}>
                    {formatStatus(transaction.status)}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{formatDate(transaction.due_date)}</td>
                <td className="px-3 py-2 text-center text-sm whitespace-nowrap">{transaction.payment_term}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{formatDate(transaction.collection_date)}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{transaction.collection_month || '-'}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{transaction.credit_note_no || '-'}</td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{formatDate(transaction.credit_note_date)}</td>
                <td className="px-3 py-3 text-right w-[120px] whitespace-nowrap">₹{transaction.credit_note_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.aging_from_bill_date <= 30 ? 'bg-green-100 text-green-800' :
                    transaction.aging_from_bill_date <= 60 ? 'bg-yellow-100 text-yellow-800' :
                      transaction.aging_from_bill_date <= 90 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {transaction.aging_from_bill_date}d
                  </span>
                </td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.aging_from_due_date <= 30 ? 'bg-green-100 text-green-800' :
                    transaction.aging_from_due_date <= 60 ? 'bg-yellow-100 text-yellow-800' :
                      transaction.aging_from_due_date <= 90 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {transaction.aging_from_due_date}d
                  </span>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">{transaction.slab}</td>

              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 border-t-2 border-indigo-300 font-bold text-sm sticky bottom-0">

              {/* Actions + Bill No */}
              <td className="px-3 py-3 text-center text-indigo-700" colSpan={2}>
                TOTALS ({filteredTransactions.length} rows)
              </td>

              {/* Bill Date */}
              <td />

              {/* Bill Month */}
              <td />

              {/* Client */}
              <td />

              {/* Company */}
              <td />

              {/* Business Type */}
              <td />

              {/* Financial Year */}
              <td />

              {/* Taxable */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.taxable_value.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Govt Fee */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.govt_fee.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* GST */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.gst_amount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Total */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.total_bill_amount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Collected */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.collection_amount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Balance */}
              <td
                className="px-3 py-3 text-right whitespace-nowrap"
                style={{ color: columnTotals.balance > 0 ? '#dc2626' : '#16a34a' }}
              >
                ₹{columnTotals.balance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* TDS Rate */}
              <td />

              {/* Actual TDS Receivable */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.actual_tds_receivable.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* TDS Received */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.tds_rcvd.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* TDS To Be Credited */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.tds_to_be_credited.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Status */}
              <td />

              {/* Due Date */}
              <td />

              {/* Term */}
              <td />

              {/* Coll Date */}
              <td />

              {/* Coll Month */}
              <td />

              {/* CN No */}
              <td />

              {/* CN Date */}
              <td />

              {/* CN Value */}
              <td className="px-3 py-3 text-right text-indigo-800 whitespace-nowrap">
                ₹{columnTotals.credit_note_value.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>

              {/* Aging Bill */}
              <td />

              {/* Aging Due */}
              <td />

              {/* Slab */}
              <td />

            </tr>
          </tfoot>
        </table>



        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 px-2">

        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex gap-2">

          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>



          <div className="flex gap-2 items-center">

            {getPagination.map((item, index) =>
              item === "..." ? (
                <span key={index} className="px-2">...</span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(item)}
                  className={`px-3 py-1 border rounded ${currentPage === item ? 'bg-indigo-600 text-white' : ''
                    }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>

          </div>

        </div>
      </div>

      <Transition appear show={showEditModal} as={Fragment}>
        <Dialog as="div" open={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="fixed inset-0 z-[999] bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-20">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="panel w-full max-w-3xl rounded-lg bg-white shadow-xl">

                  <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-lg font-bold">Edit Transaction</h3>
                    <button onClick={() => setShowEditModal(false)}>✕</button>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleUpdate} className="space-y-5">

                      {/* Bill Number (readonly) */}
                      <div>
                        <label className="text-sm font-medium">Bill Number</label>
                        <input
                          value={formData.bill_number}
                          disabled
                          className="form-input w-full bg-gray-100"
                        />
                      </div>

                      {/* Taxable Value - Super Admin Only */}
                      {isSuperAdmin() && (
                        <>
                          {/* Taxable Value */}
                          <div>
                            <label className="text-sm font-medium">Taxable Value</label>
                            <input
                              type="number"
                              value={formData.taxable_value}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  taxable_value: e.target.value === '' ? 0 : Number(e.target.value)
                                }))
                              }
                              className="form-input w-full"
                            />
                          </div>

                          {/* 🔥 Reason for Edit — required if taxable value changed */}
                          <div>
                            <label className="text-sm font-medium">
                              Reason for Editing Taxable Value <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={formData.taxable_value_edit_reason || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  taxable_value_edit_reason: e.target.value
                                }))
                              }
                              className="form-input w-full min-h-[60px]"
                              placeholder="Explain why taxable value is being changed..."
                            
                            />
                          </div>
                        </>
                      )}

                      {/* Collection Amount */}
                      <div>
                        <label className="text-sm font-medium">Collection Amount</label>
                        <input
                          type="number"
                          value={formData.collection_amount || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              collection_amount: e.target.value === '' ? 0 : Number(e.target.value)
                            }))
                          }
                          className="form-input w-full appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Collection Date */}
                      <div>
                        <label className="text-sm font-medium">Collection Date</label>
                        <input
                          type="date"
                          value={formData.collection_date || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              collection_date: e.target.value
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>


                      <div>
                        <label className="text-sm font-medium">Round Up / Adjustment</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.round_up ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              round_up: e.target.value  // ✅ keep as raw string while typing
                            }))
                          }
                          className="form-input w-full"
                          placeholder="e.g. -0.75 to deduct, 0.75 to add"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Negative value deducts from balance, positive adds to balance.
                        </p>
                      </div>

                      {/* TDS Rate */}
                      <div>
                        <label className="text-sm font-medium">TDS Rate (%)</label>
                        <input
                          type="number"
                          value={formData.tds_rate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tds_rate: Number(e.target.value || 0)
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>



                      {/* TDS Received */}
                      <div>
                        <label className="text-sm font-medium">TDS Received</label>
                        <input
                          type="number"
                          value={formData.tds_rcvd}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tds_rcvd: Number(e.target.value || 0)
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>



                      {/* Payment Term */}
                      <div>
                        <label className="text-sm font-medium">Payment Term (Days)</label>
                        <input
                          type="number"
                          value={formData.payment_term}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              payment_term: Number(e.target.value || 30)
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>

                      {/* Credit Note No */}
                      <div>
                        <label className="text-sm font-medium">Credit Note No</label>
                        <input
                          type="text"
                          value={formData.credit_note_no || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              credit_note_no: e.target.value
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>

                      {/* Credit Note Date */}
                      <div>
                        <label className="text-sm font-medium">Credit Note Date</label>
                        <input
                          type="date"
                          value={formData.credit_note_date || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              credit_note_date: e.target.value
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>

                      {/* Credit Note Value */}
                      <div>
                        <label className="text-sm font-medium">Credit Note Value</label>
                        <input
                          type="number"
                          value={formData.credit_note_value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              credit_note_value: Number(e.target.value || 0)
                            }))
                          }
                          className="form-input w-full"
                        />
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="text-sm font-medium">Remarks</label>
                        <textarea
                          value={formData.remarks || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              remarks: e.target.value
                            }))
                          }
                          className="form-input w-full min-h-[80px]"
                          placeholder="Enter remarks..."
                        />
                      </div>



                      {/* Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn btn-primary"
                        >
                          {submitting ? 'Updating...' : 'Update'}
                        </button>
                      </div>

                    </form>
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>


      {/* Delete Confirmation Modal */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="fixed inset-0 z-[999] bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="panel w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
                  <div className="border-b p-5 dark:border-gray-700">
                    <Dialog.Title className="text-xl font-bold text-red-600">
                      Delete Transaction
                    </Dialog.Title>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        Are you sure you want to delete transaction{' '}
                        <span className="font-bold">{transactionToDelete?.bill_number}</span>?
                      </p>
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ This action cannot be undone!
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Delete Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={deleteKey}
                        onChange={(e) => setDeleteKey(e.target.value)}
                        className="form-input w-full"
                        placeholder="Enter admin delete key"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        className="btn btn-outline px-4"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDelete}
                        disabled={submitting}
                        className="btn bg-red-600 hover:bg-red-700 text-white px-4"
                      >
                        {submitting ? 'Deleting...' : 'Delete Permanently'}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Transaction Modal - Fixed with proper styling */}
      <Transition appear show={showAddModal} as={Fragment}>
        <Dialog as="div" open={showAddModal} onClose={() => setShowAddModal(false)}>
          <div className="fixed inset-0 z-[999] bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-20">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="panel w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl transition-all dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
                    <div className="text-xl font-bold text-gray-800 dark:text-white">Add New Transaction</div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Client <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.client_id}
                            onChange={handleClientChange}
                            className="form-select w-full"
                            required
                          >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.company_id}
                            onChange={handleCompanyChange}
                            className="form-select w-full"
                            required
                            disabled={!formData.client_id}
                          >
                            <option value="">Select Company</option>
                            {companies.map(company => (
                              <option key={company.company_id} value={company.company_id}>
                                {company.company_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Business Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.business_type_id}
                            onChange={(e) => setFormData({ ...formData, business_type_id: e.target.value })}
                            className="form-select w-full"
                            required
                            disabled={!formData.company_id}
                          >
                            <option value="">Select Business Type</option>
                            {businessTypes.map(bt => (
                              <option key={bt.id} value={bt.id}>{bt.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Financial Year
                          </label>
                          <select
                            value={formData.financial_year}
                            onChange={(e) =>
                              setFormData({ ...formData, financial_year: e.target.value })
                            }
                            className="border px-3 py-2 rounded w-full"
                          >
                            <option value="">Select Financial Year</option>

                            {generateFinancialYears().map((fy) => (
                              <option key={fy} value={fy}>
                                {fy}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bill Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.bill_number}
                            onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                            className="form-input w-full"
                            required
                            placeholder="INV-001"
                          />
                        </div>

                        <div>

                          <DateInput
                            label="Bill Date"
                            value={formData.bill_date}
                            required
                            onChange={(date) =>
                              setFormData({ ...formData, bill_date: date })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Taxable Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.taxable_value}
                            onChange={(e) => setFormData({ ...formData, taxable_value: e.target.value })}
                            className="form-input w-full"
                            required
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            GST Rate (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.gst_rate}
                            onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                            className="form-input w-full"
                            placeholder="18"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Govt Fee
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.govt_fee}
                            onChange={(e) => setFormData({ ...formData, govt_fee: e.target.value })}
                            className="form-input w-full"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Collection Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.collection_amount || ''}
                            onChange={(e) => setFormData({ ...formData, collection_amount: e.target.value })}
                            className="form-input w-full appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        </div>

                        <div>

                          <DateInput
                            label="Collection Date"
                            value={formData.collection_date}
                            onChange={(date) =>
                              setFormData({ ...formData, collection_date: date })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            TDS Rate (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.tds_rate}
                            onChange={(e) => setFormData({ ...formData, tds_rate: e.target.value })}
                            className="form-input w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            TDS Received
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.tds_rcvd}
                            onChange={(e) => setFormData({ ...formData, tds_rcvd: e.target.value })}
                            className="form-input w-full"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Term (days)
                          </label>
                          <input
                            type="number"
                            value={formData.payment_term}
                            onChange={(e) => setFormData({ ...formData, payment_term: e.target.value })}
                            className="form-input w-full"
                          />
                        </div>


                      </div>

                      {/* Credit Note Section */}
                      <div className="border-t pt-5 mt-3 dark:border-gray-700">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4">Credit Note Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Credit Note No.
                            </label>
                            <input
                              type="text"
                              value={formData.credit_note_no}
                              onChange={(e) => setFormData({ ...formData, credit_note_no: e.target.value })}
                              className="form-input w-full"
                              placeholder="CN-001"
                            />
                          </div>

                          <div>

                            <DateInput
                              label="Credit Note Date"
                              value={formData.credit_note_date}
                              onChange={(date) =>
                                setFormData({ ...formData, credit_note_date: date })
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Credit Note Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.credit_note_value}
                              onChange={(e) => setFormData({ ...formData, credit_note_value: e.target.value })}
                              className="form-input w-full"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-5 border-t dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="btn btn-outline px-6"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn btn-primary px-6"
                        >
                          {submitting ? 'Saving...' : 'Save Transaction'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Detail Modal */}
      <Transition appear show={showDetailModal} as={Fragment}>
        <Dialog as="div" open={showDetailModal} onClose={() => setShowDetailModal(false)}>
          <div className="fixed inset-0 z-[999] bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-20">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="panel w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
                    <div className="text-xl font-bold text-gray-800 dark:text-white">Transaction Details</div>
                    <button
                      type="button"
                      onClick={() => setShowDetailModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {selectedTransaction && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Bill Number</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.bill_number}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Bill Date</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.bill_date}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Bill Month</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.bill_month}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Client</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{getClientName(selectedTransaction.client_id)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Company</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{getCompanyName(selectedTransaction.company_id)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Business Type</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{getBusinessTypeName(selectedTransaction.business_type_id)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Taxable Value</label>
                          <p className="font-semibold text-gray-800 dark:text-white">₹{selectedTransaction.taxable_value?.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">GST Amount</label>
                          <p className="font-semibold text-gray-800 dark:text-white">₹{selectedTransaction.gst_amount?.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Total Amount</label>
                          <p className="font-semibold text-indigo-600 dark:text-indigo-400">₹{selectedTransaction.total_bill_amount?.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Balance</label>
                          <p className="font-semibold text-red-600 dark:text-red-400">₹{selectedTransaction.balance?.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
                          <p><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedTransaction.status)}`}>
                            {formatStatus(selectedTransaction.status)}
                          </span></p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Due Date</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.due_date}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Slab</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.slab}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Aging Bucket</label>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.aging_bucket}</p>
                        </div>
                      </div>
                    )}
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