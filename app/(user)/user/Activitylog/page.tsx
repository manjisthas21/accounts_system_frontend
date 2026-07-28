'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiSearch, FiX, FiLoader, FiActivity } from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityLog {
    id: number;
    username: string | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    description: string | null;
    ip_address: string | null;
    created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const ACTION_STYLE: Record<string, { bg: string; dot: string; label: string }> = {
    create: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Create' },
    update: { bg: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    label: 'Update' },
    delete: { bg: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',    label: 'Delete' },
};

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100">
            {[130, 170, 70, 110, 230, 85].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ActivityLogsPage() {
    const [logs, setLogs]       = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [skip, setSkip]       = useState(0);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [typeFilter,   setTypeFilter]   = useState('');
    const [search,       setSearch]       = useState('');

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchLogs = useCallback(async (reset = false) => {
        setLoading(true);
        setError(null);
        const currentSkip = reset ? 0 : skip;

        const params = new URLSearchParams({
            skip:  String(currentSkip),
            limit: String(PAGE_SIZE),
        });
        if (actionFilter) params.set('action',        actionFilter);
        if (typeFilter)   params.set('resource_type', typeFilter);

        try {
            const res = await fetch(`/api/activity-logs/?${params}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data: ActivityLog[] = await res.json();

            setLogs(prev => reset ? data : [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);
            if (reset) setSkip(0);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [actionFilter, typeFilter, skip]);

    useEffect(() => {
        setSkip(0);
        fetchLogs(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionFilter, typeFilter]);

    // ── Client-side search ────────────────────────────────────────────────────
    const filtered = search.trim()
        ? logs.filter(l =>
            l.description?.toLowerCase().includes(search.toLowerCase()) ||
            l.resource_type.toLowerCase().includes(search.toLowerCase()) ||
            l.username?.toLowerCase().includes(search.toLowerCase())
          )
        : logs;

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = {
        create: logs.filter(l => l.action === 'create').length,
        update: logs.filter(l => l.action === 'update').length,
        delete: logs.filter(l => l.action === 'delete').length,
    };

    // ── Loading state (initial) ───────────────────────────────────────────────
    if (loading && logs.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <FiLoader className="animate-spin text-4xl text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="panel mt-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h5 className="text-lg font-semibold dark:text-white-light flex items-center gap-2">
                    <FiActivity className="text-indigo-500" />
                    Activity Logs
                </h5>
               
            </div>


            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm mb-4">
                    ⚠️ {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">User</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Resource</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && logs.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-400">
                                    No activity logs found
                                </td>
                            </tr>
                        ) : (
                            filtered.map(log => {
                                const action = log.action?.toLowerCase();
const style = ACTION_STYLE[action] ?? ACTION_STYLE.update;
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50 transition">
                                        {/* Time */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-800">{timeAgo(log.created_at)}</div>
                                            <div className="text-xs text-gray-400">{formatDate(log.created_at)}</div>
                                        </td>

                                        {/* User */}
                                        <td className="px-4 py-3">
                                           {log.username ? (
    <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {log.username[0].toUpperCase()}
        </div>

        <span className="text-sm text-gray-700 truncate max-w-[160px]">
            {log.username}
        </span>
    </div>
) : (
    <span className="text-gray-300 text-sm">—</span>
)}
                                        </td>

                                        {/* Action badge */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {action}
                                            </span>
                                        </td>

                                        {/* Resource */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-gray-800">{log.resource_type}</span>
                                           
                                        </td>

                                        {/* Description */}
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                            <span className="line-clamp-2">{log.description ?? '—'}</span>
                                        </td>

                                        {/* IP */}
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                            {log.ip_address ?? '—'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>

                    {/* Footer total */}
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="bg-indigo-50 border-t-2 border-indigo-200 text-sm font-bold">
                                <td colSpan={6} className="px-4 py-3 text-indigo-700">
                                    Total {filtered.length} entries
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Load more */}
            {!loading && hasMore && filtered.length > 0 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            const nextSkip = skip + PAGE_SIZE;
                            setSkip(nextSkip);
                            fetchLogs(false);
                        }}
                        className="btn btn-outline text-sm"
                    >
                        Load more
                    </button>
                </div>
            )}

            {/* Loading more */}
            {loading && logs.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-400 flex justify-center items-center gap-2">
                    <FiLoader className="animate-spin" size={14} /> Loading...
                </div>
            )}
        </div>
    );
}