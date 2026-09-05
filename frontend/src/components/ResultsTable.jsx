import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Database, Target, Layers, Sparkles } from 'lucide-react';


export default function ResultsTable({ 
  results = [], 
  exceptions = [], 
  groundTruth = [], 
  rawDatasets = null, 
  onSelectRecord 
}) {
  const [viewMode, setViewMode] = useState('reconciled'); // 'reconciled' | 'ground_truth' | 'raw_data'
  const [rawTab, setRawTab] = useState('invoices'); // 'invoices' | 'payments' | 'bank_transactions'
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const counts = useMemo(() => {
    const map = {
      ALL: results.length,
      RECONCILED: 0,
      AMOUNT_MISMATCH: 0,
      MISSING_PAYMENT: 0,
      MISSING_BANK_TRANSACTION: 0,
      DUPLICATE: 0,
      REVIEW_REQUIRED: 0,
      UNMATCHED: 0,
    };
    results.forEach((r) => {
      if (map[r.status] !== undefined) map[r.status]++;
    });
    return map;
  }, [results]);

  // Filtered Reconciled Results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.invoice_id.toLowerCase().includes(q) ||
        (item.reference && item.reference.toLowerCase().includes(q)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.payment_id && item.payment_id.toLowerCase().includes(q)) ||
        (item.transaction_id && item.transaction_id.toLowerCase().includes(q))
      );
    });
  }, [results, filterStatus, searchQuery]);

  // Filtered Ground Truth
  const filteredGroundTruth = useMemo(() => {
    if (!groundTruth || groundTruth.length === 0) return [];
    return groundTruth.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.invoice_id?.toLowerCase().includes(q) ||
        item.expected_status?.toLowerCase().includes(q) ||
        item.expected_payment_id?.toLowerCase().includes(q) ||
        item.expected_transaction_id?.toLowerCase().includes(q)
      );
    });
  }, [groundTruth, searchQuery]);

  // Filtered Raw Data
  const rawList = useMemo(() => {
    if (!rawDatasets || !rawDatasets[rawTab]) return [];
    const list = rawDatasets[rawTab];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((row) => 
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [rawDatasets, rawTab, searchQuery]);

  const activeDataset = viewMode === 'reconciled' 
    ? filteredResults 
    : viewMode === 'ground_truth' 
    ? filteredGroundTruth 
    : rawList;

  const totalPages = Math.max(1, Math.ceil(activeDataset.length / pageSize));
  const paginatedData = activeDataset.slice((page - 1) * pageSize, page * pageSize);

  const getStatusClass = (st) => {
    switch (st) {
      case 'RECONCILED': return 'status-reconciled';
      case 'AMOUNT_MISMATCH': return 'status-mismatch';
      case 'MISSING_PAYMENT': return 'status-missing-payment';
      case 'MISSING_BANK_TRANSACTION': return 'status-missing-bank';
      case 'DUPLICATE': return 'status-duplicate';
      case 'REVIEW_REQUIRED': return 'status-review';
      default: return 'status-unmatched';
    }
  };

  const exportCurrentCSV = () => {
    if (activeDataset.length === 0) return;
    let headers = [];
    let rows = [];

    if (viewMode === 'reconciled') {
      headers = ["Invoice ID", "Status", "Score", "Match Type", "Invoice Amount", "Payment ID", "Payment Amount", "Bank TX ID", "Bank Amount", "Customer", "Reference"];
      rows = activeDataset.map(r => [
        r.invoice_id, r.status, r.score, r.match_type, r.invoice_amount || '',
        r.payment_id || '', r.payment_amount || '', r.transaction_id || '',
        r.bank_amount || '', `"${r.customer_name || ''}"`, r.reference || ''
      ]);
    } else if (viewMode === 'ground_truth') {
      headers = ["Invoice ID", "Expected Status", "Expected Payment ID", "Expected Bank TX ID"];
      rows = activeDataset.map(gt => [
        gt.invoice_id, gt.expected_status, gt.expected_payment_id || '', gt.expected_transaction_id || ''
      ]);
    } else {
      headers = Object.keys(activeDataset[0] || {});
      rows = activeDataset.map(row => headers.map(h => `"${row[h] !== undefined ? row[h] : ''}"`));
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${viewMode}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (results.length === 0 && (!groundTruth || groundTruth.length === 0)) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '24px', padding: '22px' }}>
      
      {/* 3 Master View Mode Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '14px',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          
          {/* Tab 1: Reconciled Results */}
          <button
            onClick={() => { setViewMode('reconciled'); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              background: viewMode === 'reconciled' ? '#0f172a' : '#f8fafc',
              color: viewMode === 'reconciled' ? '#ffffff' : '#475569',
              border: `1px solid ${viewMode === 'reconciled' ? '#0f172a' : '#cbd5e1'}`,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'reconciled' ? '0 2px 8px rgba(15, 23, 42, 0.18)' : 'none',
            }}
          >
            <Layers size={14} />
            <span>Reconciled Results ({results.length})</span>
          </button>

          {/* Tab 2: Ground Truth (Only in Benchmark mode when ground truth exists) */}
          {groundTruth && groundTruth.length > 0 && (
            <button
              onClick={() => { setViewMode('ground_truth'); setPage(1); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                background: viewMode === 'ground_truth' ? '#0f172a' : '#f8fafc',
                color: viewMode === 'ground_truth' ? '#ffffff' : '#475569',
                border: `1px solid ${viewMode === 'ground_truth' ? '#0f172a' : '#cbd5e1'}`,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'ground_truth' ? '0 2px 8px rgba(15, 23, 42, 0.18)' : 'none',
              }}
            >
              <Target size={14} color={viewMode === 'ground_truth' ? '#ffffff' : '#059669'} />
              <span>Ground Truth Labels ({groundTruth.length})</span>
            </button>
          )}

          {/* Tab 3: Raw Generated Datasets */}
          {rawDatasets && (
            <button
              onClick={() => { setViewMode('raw_data'); setPage(1); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                background: viewMode === 'raw_data' ? '#0f172a' : '#f8fafc',
                color: viewMode === 'raw_data' ? '#ffffff' : '#475569',
                border: `1px solid ${viewMode === 'raw_data' ? '#0f172a' : '#cbd5e1'}`,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'raw_data' ? '0 2px 8px rgba(15, 23, 42, 0.18)' : 'none',
              }}
            >
              <Database size={14} color={viewMode === 'raw_data' ? '#ffffff' : '#0284c7'} />
              <span>Raw Generated CSVs</span>
            </button>
          )}

        </div>

        {/* Search & Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            width: '240px',
          }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0f172a',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <button onClick={exportCurrentCSV} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subtabs if in Raw Data view */}
      {viewMode === 'raw_data' && rawDatasets && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          background: '#f8fafc',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SELECT STREAM:</span>
          {['invoices', 'payments', 'bank_transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setRawTab(tab); setPage(1); }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: rawTab === tab ? '#0066ff' : 'transparent',
                color: rawTab === tab ? '#ffffff' : '#475569',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab}.csv ({rawDatasets[tab]?.length || 0})
            </button>
          ))}
        </div>
      )}

      {/* Filter Tabs if in Reconciled view */}
      {viewMode === 'reconciled' && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px',
        }}>
          {[
            { key: 'ALL', label: 'All Records', count: counts.ALL },
            { key: 'RECONCILED', label: 'Reconciled', count: counts.RECONCILED },
            { key: 'AMOUNT_MISMATCH', label: 'Amount Mismatch', count: counts.AMOUNT_MISMATCH },
            { key: 'MISSING_PAYMENT', label: 'Missing Payment', count: counts.MISSING_PAYMENT },
            { key: 'MISSING_BANK_TRANSACTION', label: 'Missing Bank', count: counts.MISSING_BANK_TRANSACTION },
            { key: 'DUPLICATE', label: 'Duplicates', count: counts.DUPLICATE },
            { key: 'REVIEW_REQUIRED', label: 'Review Needed', count: counts.REVIEW_REQUIRED },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilterStatus(f.key); setPage(1); }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: filterStatus === f.key ? '#0f172a' : '#f8fafc',
                border: `1px solid ${filterStatus === f.key ? '#0f172a' : '#e2e8f0'}`,
                color: filterStatus === f.key ? '#ffffff' : '#475569',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{f.label}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: filterStatus === f.key ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
                color: filterStatus === f.key ? '#ffffff' : '#64748b',
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Table Content */}
      <div style={{ overflowX: 'auto' }}>
        
        {/* VIEW 1: RECONCILED RESULTS TABLE */}
        {viewMode === 'reconciled' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600 }}>INVOICE ID</th>
                <th style={{ padding: '10px 12px' }}>CUSTOMER ENTITY</th>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>REFERENCE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>PAYMENT</th>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>BANK SETTLEMENT</th>
                <th style={{ padding: '10px 12px' }}>STATUS</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>CONFIDENCE</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>INSPECT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr
                  key={row.invoice_id}
                  onClick={() => onSelectRecord(row)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
                    {row.invoice_id}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                    {row.customer_name || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#475569' }}>
                    {row.reference || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₹{row.invoice_amount != null ? row.invoice_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: row.payment_id ? '#0284c7' : '#e11d48' }}>
                    {row.payment_id || 'None'}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: row.transaction_id ? '#047857' : '#e11d48' }}>
                    {row.transaction_id || 'None'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`status-pill ${getStatusClass(row.status)}`}>
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    <span style={{ color: row.score >= 85 ? '#047857' : row.score >= 50 ? '#b45309' : '#e11d48' }}>
                      {row.score}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '3px 7px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>


              ))}
            </tbody>
          </table>
        )}

        {/* VIEW 2: GROUND TRUTH TABLE */}
        {viewMode === 'ground_truth' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600 }}>INVOICE ID</th>
                <th style={{ padding: '10px 12px' }}>EXPECTED STATUS</th>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>EXPECTED PAYMENT ID</th>
                <th style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>EXPECTED BANK TX ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>GROUND TRUTH INTEGRITY</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((gt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
                    {gt.invoice_id}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`status-pill ${getStatusClass(gt.expected_status)}`}>
                      {gt.expected_status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: gt.expected_payment_id ? '#0284c7' : '#94a3b8' }}>
                    {gt.expected_payment_id || 'None (Missing)'}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: gt.expected_transaction_id ? '#047857' : '#94a3b8' }}>
                    {gt.expected_transaction_id || 'None (Missing)'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}>
                      ✓ Verified Known Label
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VIEW 3: RAW GENERATED DATASETS */}
        {viewMode === 'raw_data' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                {Object.keys(paginatedData[0] || {}).map((col) => (
                  <th key={col} style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600 }}>
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {Object.keys(row).map((col) => (
                    <td key={col} style={{ padding: '10px 12px', fontFamily: typeof row[col] === 'number' || col.includes('id') || col.includes('ref') ? 'var(--font-mono)' : 'inherit' }}>
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '12px',
        fontSize: '0.78rem',
        color: '#64748b',
      }}>
        <span>
          Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, activeDataset.length)} of {activeDataset.length}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: page === 1 ? '#f8fafc' : '#ffffff',
              border: '1px solid #cbd5e1',
              color: page === 1 ? '#94a3b8' : '#0f172a',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: page === totalPages ? '#f8fafc' : '#ffffff',
              border: '1px solid #cbd5e1',
              color: page === totalPages ? '#94a3b8' : '#0f172a',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
