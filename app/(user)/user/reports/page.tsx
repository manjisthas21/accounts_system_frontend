'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { reportAPI } from '@/lib/api';
import {
  FiLoader, FiCalendar, FiTag, FiFileText, FiClipboard,
  FiUsers, FiBriefcase, FiRefreshCw, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── tiny helpers ──────────────────────────────────────────────────────────────


const num = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const safeAmt = (v: number): number => {
  const r = Math.round((v || 0) * 100) / 100;
  return Math.abs(r) < 0.005 ? 0 : r;
};

const fmt = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount as number)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmt(amount as number));
};

const statusBadge = (status: string) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100  text-green-800',
  partially_paid: 'bg-blue-100   text-blue-800',
  closed: 'bg-gray-100   text-gray-800',
}[status] ?? 'bg-gray-100 text-gray-800');

const SLAB_MAP: Record<string, string> = {
  '0-30': '0–30 Days',
  '31-60': '31–60 Days',
  '61-90': '61–90 Days',
  '91-180': '91–180 Days',
  '181-360': '181–360 Days',
  '361-720': '361–720 Days',
  '720+': 'Above 720 Days',
};

const SLAB_ORDER = [
  '0–30 Days',
  '31–60 Days',
  '61–90 Days',
  '91–180 Days',
  '181–360 Days',
  '361–720 Days',
  'Above 720 Days',
];

const SLAB_COLORS: Record<string, string> = {
  '0–30 Days': 'bg-green-600',
  '31–60 Days': 'bg-yellow-500',
  '61–90 Days': 'bg-orange-500',
  '91–180 Days': 'bg-red-500',
  '181–360 Days': 'bg-red-600',
  '361–720 Days': 'bg-red-700',
  'Above 720 Days': 'bg-red-900',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026, 2027];

// ─── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, gradient }: { label: string; value: string | number; gradient: string }) => (
  <div className={`${gradient} rounded-xl p-4 text-white`}>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

// ─── TableShell ────────────────────────────────────────────────────────────────

const TableShell = ({ heads, children, footer }: any) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {heads.map((h: any, i: number) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.right ? 'text-right' : 'text-left'}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
        {footer && <tfoot className="bg-gray-50 border-t border-gray-200">{footer}</tfoot>}
      </table>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function UserReportsPage() {

  const [rawData, setRawData] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>({ months: [], years: [], clients: [], business_types: [] });
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('billing');
  const [openSlabs, setOpenSlabs] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    month: '', year: '', client_id: '', business_type_id: '', bill_number: ''
  });

  const prevReportRef = useRef<string | null>(null);

  const toggleSlab = (slab: string) => {
    setOpenSlabs(prev => ({
      ...prev,
      [slab]: !prev[slab],
    }));
  };

  // ── fetch raw data ────────────────────────────────────────────────────────
  const fetchRawData = useCallback(async (report: string) => {
    setLoading(true);
    setRawData(null);
    try {
      let response: any;
      console.log('Fetching report:', report);
      switch (report) {
        case 'billing': response = await reportAPI.getBilling(null, null, null, null); break;
        case 'collection': response = await reportAPI.getCollection(null, null, null, null); break;
        case 'summary': response = await reportAPI.getSummary(null, null, null, null); break;
        case 'outstanding':
          response = await reportAPI.getOutstanding(null, null);
          const oaRes = await fetch('/api/on-account/by-client-bt');
          const oaMap = await oaRes.json();
          response.data._onAccountMap = oaMap;
          break;
        default: return;
      }
      console.log('Response:', response);
      console.log('Setting rawData:', response.data);
      setRawData(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  // load filter options once
  useEffect(() => {
    reportAPI.getFilterOptions()
      .then((r: any) => setFilterOptions(r.data))
      .catch(() => { });
  }, []);

  // fetch when tab changes
  useEffect(() => {
    if (prevReportRef.current !== activeReport) {
      prevReportRef.current = activeReport;
      setFilters({ month: '', year: '', client_id: '', business_type_id: '', bill_number: '' });
      fetchRawData(activeReport);
    }
  }, [activeReport, fetchRawData]);

  // initial load
  useEffect(() => {
    fetchRawData('billing');
    prevReportRef.current = 'billing';
  }, [fetchRawData]);

  // ── client-side filtering ─────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!rawData) return null;

    const { month, year, client_id, business_type_id } = filters;

    const matchDate = (dateStr: string) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      if (month && MONTHS[d.getMonth()] !== month) return false;
      if (year && d.getFullYear() !== parseInt(year)) return false;
      return true;
    };

    const matchClient = (bill: any) =>
      !client_id || String(bill.client_id) === String(client_id);

    const matchBT = (bill: any) =>
      !business_type_id || String(bill.business_type_id) === String(business_type_id);

    // ── BILLING ──────────────────────────────────────────────────────────────
    if (activeReport === 'billing') {
      const bills = (rawData.bills || [])
        .filter((b: any) => matchDate(b.date) && matchClient(b) && matchBT(b))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);

      const total_bill_amount = safeAmt(bills.reduce((s: number, b: any) => s + (b.amount), 0));
      const total_gst = safeAmt(bills.reduce((s: number, b: any) => s + (b.gst), 0));
      const total_tds = safeAmt(bills.reduce((s: number, b: any) => s + (b.tds), 0));

      return {
        bills,
        summary: {
          total_bills: bills.length,
          total_bill_amount,
          total_gst,
          total_tds,
          net_amount: safeAmt(total_bill_amount - total_tds),
        },
      };
    }

    // ── COLLECTION ────────────────────────────────────────────────────────────
    if (activeReport === 'collection') {
      const collections = (rawData.collections || [])
        .filter((c: any) => matchDate(c.date) && matchClient(c) && matchBT(c))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);

      const total_collected = safeAmt(collections.reduce((s: number, c: any) => s + (c.collected_amount || 0), 0));
      const total_tds = safeAmt(collections.reduce((s: number, c: any) => s + (c.tds || 0), 0));

      return {
        collections,
        summary: {
          total_collected,
          total_tds,
          net_received: safeAmt(total_collected - total_tds),
        },
      };
    }

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    if (activeReport === 'summary') {
      const sourceBills = rawData.bills || [];

      if (sourceBills.length > 0) {
        // re-aggregate from raw bills after applying filters
        const filtered = sourceBills.filter((b: any) =>
          matchDate(b.date) && matchClient(b) && matchBT(b)
        );

        const client_wise: Record<string, {
          billed: number;
          collected: number;
          tds_received: number;
          credit_note: number;
          round_up: number;
          balance: number;
        }> = {};
        const business_type_wise: Record<string, {
          billed: number;
          collected: number;
          tds_received: number;
          credit_note: number;
          round_up: number;
          balance: number;
        }> = {};

        filtered.forEach((b: any) => {
          const c = b.client || 'N/A';
          const bt = b.business_type || 'N/A';


          client_wise[c] = client_wise[c] || {
            billed: 0,
            collected: 0,
            tds_received: 0,
            credit_note: 0,
            round_up: 0,
            balance: 0
          };

          business_type_wise[bt] = business_type_wise[bt] || {
            billed: 0,
            collected: 0,
            tds_received: 0,
            credit_note: 0,
            round_up: 0,
            balance: 0
          };

          const billAmount = num(b.amount);
          const collectionAmount = num(b.collected_amount);
          const tdsReceived = num(b.tds_received);
          const creditNote = num(b.credit_note);
          const roundUp = num(b.round_up);
          const balance = num(b.balance);

          client_wise[c].billed += billAmount;
          client_wise[c].collected += collectionAmount;
          client_wise[c].tds_received += tdsReceived;
          client_wise[c].credit_note += creditNote;
          client_wise[c].round_up += roundUp;
          client_wise[c].balance += balance;

          business_type_wise[bt].billed += billAmount;
          business_type_wise[bt].collected += collectionAmount;
          business_type_wise[bt].tds_received += tdsReceived;
          business_type_wise[bt].credit_note += creditNote;
          business_type_wise[bt].round_up += roundUp;
          business_type_wise[bt].balance += balance;
        });


        const cleanRows = (obj: typeof client_wise) =>
          Object.entries(obj).map(([key, v]) => ({
            billed: safeAmt(v.billed),
            collected: safeAmt(v.collected),
            tds_received: safeAmt(v.tds_received),
            credit_note: safeAmt(v.credit_note),
            balance: safeAmt(v.balance),
            _key: key,
          }));

        return {
          client_wise: cleanRows(client_wise).map(({ _key, ...rest }) => ({ client: _key, ...rest })),
          business_type_wise: cleanRows(business_type_wise).map(({ _key, ...rest }) => ({ type: _key, ...rest })),
        };
      }

      // fallback: backend returned only aggregated data
      const client_wise = (rawData.client_wise || []).filter((c: any) => {
        if (client_id && filterOptions.clients) {
          const found = filterOptions.clients.find((cl: any) => String(cl.id) === String(client_id));
          if (found && c.client !== found.name) return false;  // fragile
        }
        return true;
      });
      const business_type_wise = (rawData.business_type_wise || []).filter((bt: any) => {
        if (business_type_id && filterOptions.business_types) {
          const found = filterOptions.business_types.find((b: any) => String(b.id) === String(business_type_id));
          if (found && bt.type !== found.name) return false;
        }
        return true;
      });
      return { client_wise, business_type_wise };
    }

    // ── OUTSTANDING ───────────────────────────────────────────────────────────
    if (activeReport === 'outstanding') {
      const { bill_number } = filters;

      const bills = (rawData.bills || []).filter((b: any) => {
        const outstandingAmount = safeAmt(Number(b.outstanding ?? 0));


        if (outstandingAmount < 0.01) return false;

        // bill number search
        if (bill_number && !String(b.bill_number).toLowerCase().includes(bill_number.toLowerCase())) return false;

        if (client_id && filterOptions.clients) {
          const found = filterOptions.clients.find((c: any) => String(c.id) === String(client_id));
          if (found && b.client !== found.name) return false;
        }
        if (business_type_id && filterOptions.business_types) {
          const found = filterOptions.business_types.find((bt: any) => String(bt.id) === String(business_type_id));
          if (found && b.business_type !== found.name) return false;
        }
        return true;
      });

      const total_outstanding = safeAmt(
        bills.reduce((s: number, b: any) => s + Number(b.outstanding ?? 0), 0)
      );

      return {
        bills,
        total_outstanding,
        as_on_date: rawData.as_on_date,
        _onAccountMap: rawData._onAccountMap || {}
      };
    }

    return rawData;
  }, [rawData, filters, activeReport, filterOptions]);

  // ── CSV export ────────────────────────────────────────────────────────────

  const exportToCSV = () => {
    if (!filteredData) return;
    let csv = '';
    if (activeReport === 'billing') {
      csv = 'Date,Bill No,Client,Business Type,Amount,GST,TDS,Status\n';
      (filteredData.bills || []).forEach((b: any) => {
        csv += `${b.date},"${b.bill_number}","${b.client}","${b.business_type}",${b.amount},${b.gst},${b.tds},${b.status}\n`;
      });
    } else if (activeReport === 'collection') {
      csv = 'Date,Bill No,Client,Business Type,Collected,TDS,Net\n';
      (filteredData.collections || []).forEach((c: any) => {
        csv += `${c.date},"${c.bill_number}","${c.client}","${c.business_type}",${c.collected_amount},${c.tds},${c.net}\n`;
      });
    } else if (activeReport === 'outstanding') {
      const oaMap: Record<string, number> = filteredData._onAccountMap || {};
      csv = 'Bill No,Bill Date,Due Date,Client,Business Type,Outstanding,On Account,Actual Outstanding,Bucket\n';
      (filteredData.bills || []).forEach((b: any) => {
        const oa = oaMap[`${b.client_id}_${b.business_type_id}`] ?? 0;
        const actual = safeAmt(Number(b.outstanding ?? 0) - oa);
        csv += `"${b.bill_number}",${b.bill_date},${b.due_date},"${b.client}","${b.business_type}",${b.outstanding ?? 0},${oa},${actual},"${SLAB_MAP[b.aging_bucket] ?? b.aging_bucket}"\n`;
      });
    }
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderBilling = () => {
    if (!filteredData) return null;
    const { summary = {}, bills = [] } = filteredData;
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Bills" value={summary.total_bills || 0} gradient="bg-gradient-to-br from-blue-500   to-blue-600" />
          <StatCard label="Total Bill Amount" value={fmt(summary.total_bill_amount)} gradient="bg-gradient-to-br from-green-500  to-green-600" />
          <StatCard label="Total GST" value={fmt(summary.total_gst)} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard label="Net Amount" value={fmt(summary.net_amount)} gradient="bg-gradient-to-br from-orange-500 to-orange-600" />
        </div>
        <TableShell heads={[
          { label: 'Date' }, { label: 'Bill No' }, { label: 'Client' }, { label: 'Business Type' },
          { label: 'Amount', right: true }, { label: 'Status', right: true },
        ]}>
          {bills.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-12 text-gray-400">No records found</td></tr>
          ) : bills.map((b: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-500">{b.date}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{b.bill_number}</td>
              <td className="px-4 py-3 text-gray-600">{b.client}</td>
              <td className="px-4 py-3 text-gray-600">{b.business_type}</td>
              <td className="px-4 py-3 text-right font-semibold">{fmt(b.amount)}</td>
              <td className="px-4 py-3 text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                  {b.status?.replace('_', ' ')}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    );
  };

  const renderCollection = () => {
    if (!filteredData) return null;
    const { summary = {}, collections = [] } = filteredData;
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Collections" value={fmt(summary.total_collected)} gradient="bg-gradient-to-br from-green-500 to-green-600" />
          <StatCard label="Total TDS" value={fmt(summary.total_tds)} gradient="bg-gradient-to-br from-red-500   to-red-600" />
          <StatCard label="Net Received" value={fmt(summary.net_received)} gradient="bg-gradient-to-br from-blue-500  to-blue-600" />
        </div>
        <TableShell heads={[
          { label: 'Date' }, { label: 'Bill No' }, { label: 'Client' }, { label: 'Business Type' },
          { label: 'Collected', right: true }, { label: 'TDS', right: true }, { label: 'Net', right: true },
        ]}>
          {collections.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No records found</td></tr>
          ) : collections.map((c: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-500">{c.date}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{c.bill_number}</td>
              <td className="px-4 py-3 text-gray-600">{c.client}</td>
              <td className="px-4 py-3 text-gray-600">{c.business_type}</td>
              <td className="px-4 py-3 text-right font-semibold">{fmt(c.collected_amount)}</td>
              <td className="px-4 py-3 text-right text-gray-500">{fmt(c.tds)}</td>
              <td className="px-4 py-3 text-right font-semibold">{fmt(c.net)}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    );
  };

  const renderSummary = () => {
    if (!filteredData) return null;
    const cw = filteredData.client_wise || [];
    const bw = filteredData.business_type_wise || [];

    const totalBilled = safeAmt(cw.reduce((s: number, c: any) => s + (c.billed || 0), 0));
    const totalCollected = safeAmt(cw.reduce((s: number, c: any) => s + (c.collected || 0), 0));
    const totalBalance = safeAmt(cw.reduce((s: number, c: any) => s + (c.balance || 0), 0));
    const pct = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0.0';

    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Billed" value={fmt(totalBilled)} gradient="bg-gradient-to-br from-blue-500   to-blue-600" />
          <StatCard label="Total Collected" value={fmt(totalCollected)} gradient="bg-gradient-to-br from-green-500  to-green-600" />
          <StatCard label="Total Balance" value={fmt(totalBalance)} gradient="bg-gradient-to-br from-red-500    to-red-600" />
          <StatCard label="Collection %" value={`${pct}%`} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>
        <div className="space-y-6">

          {/* Client Wise */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Client Wise</h3>
            </div>
            <TableShell heads={[
              { label: 'Client' }, { label: 'Billed', right: true },
              { label: 'Collected', right: true },
              { label: 'TDS Received', right: true },
              { label: 'Credit Note', right: true },


              { label: 'Balance', right: true },
            ]}>
              {cw.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{c.client}</td>
                  <td className="px-4 py-2 text-right">{fmt(c.billed)}</td>
                  <td className="px-4 py-2 text-right">{fmt(c.collected)}</td>
                  <td className="px-4 py-2 text-right">{fmt(c.tds_received)}</td>
                  <td className="px-4 py-2 text-right">{fmt(c.credit_note)}</td>

                  <td className="px-4 py-2 text-right font-semibold">{fmt(c.balance)}</td>
                </tr>
              ))}
            </TableShell>
          </div>

          {/* Business Type Wise */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Business Type Wise</h3>
            </div>
            <TableShell heads={[
              { label: 'Business Type' }, { label: 'Billed', right: true },
              { label: 'Collected', right: true }, { label: 'TDS Received', right: true },
              { label: 'Credit Note', right: true },
              { label: 'Balance', right: true },
            ]}>
              {bw.map((b: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{b.type}</td>
                  <td className="px-4 py-2 text-right">{fmt(b.billed)}</td>
                  <td className="px-4 py-2 text-right">{fmt(b.collected)}</td>
                  <td className="px-4 py-2 text-right">{fmt(b.tds_received)}</td>
                  <td className="px-4 py-2 text-right">{fmt(b.credit_note)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{fmt(b.balance)}</td>
                </tr>
              ))}
            </TableShell>
          </div>

        </div>
      </div>
    );
  };

  const renderOutstanding = () => {

    if (!filteredData) return null;
    const bills = filteredData.bills || [];
    console.log("Outstanding Bills:", bills);
    const as_on = filteredData.as_on_date || new Date().toISOString().slice(0, 10);
    const oaMap: Record<string, number> = filteredData._onAccountMap || {};

    const slabs: Record<string, any[]> = SLAB_ORDER.reduce((acc: any, s) => { acc[s] = []; return acc; }, {});
    bills.forEach((b: any) => {
      const label = SLAB_MAP[b.aging_bucket] ?? 'Above 720 Days';
      slabs[label].push(b);
    });

    // grand totals — on-account per unique client+bt, not per bill
    const grandOutstanding = safeAmt(bills.reduce((s: number, b: any) => s + Number(b.outstanding ?? 0), 0));

    // unique client+bt keys across ALL bills
    const allKeys = new Set(bills.map((b: any) => `${b.client_id}_${b.business_type_id}`));
    const grandOA = safeAmt(Array.from(allKeys).reduce((s, key) => s + (oaMap[key as string] ?? 0), 0));
    const grandActual = safeAmt(grandOutstanding - grandOA);

    return (
      <div>
        <p className="text-sm text-gray-400 mb-4">As on: {as_on}</p>

        {SLAB_ORDER.map(slab => {
          const rows = slabs[slab];
          if (!rows.length) return null;

          const isOpen = openSlabs[slab];

          const subtotal = safeAmt(rows.reduce((s: number, b: any) => s + Number(b.outstanding ?? 0), 0));

          const slabKeys = new Set(rows.map((b: any) => `${b.client_id}_${b.business_type_id}`));
          const subtotalOA = safeAmt(Array.from(slabKeys).reduce((s, key) => s + (oaMap[key as string] ?? 0), 0));
          const subtotalActual = safeAmt(subtotal - subtotalOA);

          return (
            <div key={slab} className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">

              {/* HEADER (CLICKABLE) */}
              <div
                onClick={() => toggleSlab(slab)}
                className={`${SLAB_COLORS[slab]} text-white px-5 py-3 flex justify-between items-center cursor-pointer`}
              >
                <span className="font-semibold">
                  {isOpen ? '▼' : '▶'} {slab}
                </span>

                <div className="flex gap-6 text-sm">
                  <span>Outstanding: <b>{fmt(subtotal)}</b></span>
                  <span>On Account: <b>{fmt(subtotalOA)}</b></span>
                  <span>Actual: <b>{fmt(subtotalActual)}</b></span>
                </div>
              </div>

              {/* BODY (COLLAPSIBLE) */}
              {isOpen && (
                <TableShell
                  heads={[
                    { label: 'Bill No' },
                    { label: 'Bill Date' },
                    { label: 'Due Date' },
                    { label: 'Client' },
                    { label: 'Business Type' },
                    { label: 'Outstanding', right: true },
                    { label: 'TDS To Be Credited', right: true },
                  ]}
                  footer={
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-600">
                        Subtotal
                      </td>
                      <td colSpan={2} className="px-5 py-3 text-sm text-indigo-600 font-medium">
                        On Account: {fmt(subtotalOA)} → Actual:
                        <span
                          className="font-bold"
                          style={{ color: subtotalActual <= 0 ? '#16a34a' : '#dc2626' }}
                        >
                          {fmt(subtotalActual)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold">{fmt(subtotal)}</td>
                    </tr>
                  }
                >
                  {rows.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{b.bill_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{b.bill_date ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{b.due_date ?? '-'}</td>
                      <td className="px-4 py-3 text-sm">{b.client ?? '-'}</td>
                      <td className="px-4 py-3 text-sm">{b.business_type ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        {fmt(b.outstanding ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {fmt(b.tds_to_be_credited ?? 0)}
                      </td>
                    </tr>
                  ))}
                </TableShell>
              )}
            </div>
          );
        })}

        {bills.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            No outstanding bills found
          </div>
        )}

        {/* Grand Total Bar */}
        <div className="bg-gray-900 text-white rounded-xl px-5 py-4 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-bold tracking-wide">GRAND TOTAL</span>
            <div className="flex gap-8 text-sm">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Outstanding</p>
                <p className="text-lg font-bold text-red-400">{fmt(grandOutstanding)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">On Account</p>
                <p className="text-lg font-bold text-indigo-400">{fmt(grandOA)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Actual Outstanding</p>
                <p className="text-lg font-bold text-emerald-400">{fmt(grandActual)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── filter bar ─────────────────────────────────────────────────────────────

  const isOutstanding = activeReport === 'outstanding';
  const hasFilters = Object.values(filters).some(Boolean);

  const SelectFilter = ({
    label, icon: Icon, field, options, labelKey = 'name', valueKey = 'id', staticOptions,
  }: any) => (
    <div className="flex-1 min-w-[160px]">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {Icon && <Icon className="inline mr-1" size={12} />}{label}
      </label>
      <select
        value={filters[field as keyof typeof filters]}
        onChange={e => setFilters(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="">All</option>
        {staticOptions
          ? staticOptions.map((o: string) => <option key={o} value={o}>{o}</option>)
          : options?.map((o: any) => <option key={o[valueKey]} value={o[valueKey]}>{o[labelKey]}</option>)
        }
      </select>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 mb-6">
      <div className="flex flex-wrap gap-3 items-end">

        {!isOutstanding && (
          <>
            <SelectFilter label="Month" field="month" staticOptions={MONTHS} />
            <SelectFilter label="Year" field="year" staticOptions={YEARS.map(String)} />
          </>
        )}

        <SelectFilter label="Client" icon={FiUsers} field="client_id" options={filterOptions.clients} />
        <SelectFilter label="Business Type" icon={FiBriefcase} field="business_type_id" options={filterOptions.business_types} />

        {isOutstanding && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Bill Number</label>
            <input
              type="text"
              placeholder="Search bill no..."
              value={filters.bill_number}
              onChange={e => setFilters(prev => ({ ...prev, bill_number: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {hasFilters && (
          <button
            onClick={() => setFilters({ month: '', year: '', client_id: '', business_type_id: '', bill_number: '' })}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiX size={14} /> Clear
          </button>
        )}

        <button
          onClick={() => {
            setFilters({ month: '', year: '', client_id: '', business_type_id: '', bill_number: '' });
            fetchRawData(activeReport);
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>

      </div>

      {isOutstanding && (
        <p className="text-xs text-gray-400 mt-3">
          Outstanding report shows all unpaid bills. Filtering is instant — no extra server calls.
        </p>
      )}
    </div>
  );

  // ── tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'billing', name: 'Billing', icon: FiFileText },
    { id: 'collection', name: 'Collection', icon: FiClipboard },
    { id: 'summary', name: 'Summary', icon: FiTag },
    { id: 'outstanding', name: 'Outstanding', icon: FiCalendar },
  ];

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-screen-xl mx-auto">

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">Billing, collection &amp; outstanding</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveReport(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeReport === id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Icon size={15} /> {name}
          </button>
        ))}
      </div>

      {renderFilters()}

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <FiLoader className="animate-spin text-4xl text-indigo-500" />
        </div>
      ) : (
        <>
          {activeReport === 'billing' && renderBilling()}
          {activeReport === 'collection' && renderCollection()}
          {activeReport === 'summary' && renderSummary()}
          {activeReport === 'outstanding' && renderOutstanding()}
        </>
      )}
    </div>
  );
}