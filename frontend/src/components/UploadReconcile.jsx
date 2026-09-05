import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Sparkles, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  SlidersHorizontal,
  Check,
  Eye,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { reconcileFiles } from '../utils/api';
import {
  parseCsvFileHeaderAndRows,
  computeAutoMapping,
  validateMapping,
  transformCsvWithMapping,
  STREAM_SCHEMAS
} from '../utils/csvMapper';
import ColumnMappingModal from './ColumnMappingModal';
import ResultsTable from './ResultsTable';
import RecordModal from './RecordModal';

export default function UploadReconcile({ setProcessingState }) {
  // Uploaded files and schema analysis states
  const [invoicesInfo, setInvoicesInfo] = useState(null);
  const [paymentsInfo, setPaymentsInfo] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);

  // Column Mapping Wizard Modal state
  const [activeModalStream, setActiveModalStream] = useState(null); // 'invoices' | 'payments' | 'bank_transactions'
  
  // Auto-Match Review Prompt Modal state (shown when user clicks Reconcile without reviewing auto-matched custom headers)
  const [showAutoMatchPrompt, setShowAutoMatchPrompt] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const resultsRef = useRef(null);

  // Handle file selection & instant schema inspection
  const handleFileChange = async (file, streamType) => {
    if (!file) return;
    setErrorMsg('');

    try {
      const parsed = await parseCsvFileHeaderAndRows(file);
      const autoMap = computeAutoMapping(parsed.headers, streamType);
      const validation = validateMapping(streamType, autoMap, parsed.headers);

      // If valid auto-mapping found, transform into normalized file with standard headers
      const readyFile = validation.isValid
        ? (transformCsvWithMapping(parsed.rawText, autoMap, file.name) || file)
        : file;

      const infoObj = {
        file: readyFile,
        originalFile: file,
        headers: parsed.headers,
        rows: parsed.rows,
        rawText: parsed.rawText,
        totalRows: parsed.totalRows,
        mapping: autoMap,
        isValid: validation.isValid,
        validation,
        isReviewed: validation.isExactMatch, // Exact matches need no review; custom headers start unreviewed
      };

      if (streamType === 'invoices') {
        setInvoicesInfo(infoObj);
      } else if (streamType === 'payments') {
        setPaymentsInfo(infoObj);
      } else if (streamType === 'bank_transactions') {
        setBankInfo(infoObj);
      }

      // If schema is not 100% matched, automatically prompt the column mapping modal
      if (!validation.isValid) {
        setActiveModalStream(streamType);
      }
    } catch (err) {
      setErrorMsg(`Failed to parse ${file.name}: ${err.message}`);
    }
  };

  // Called when user confirms mapping in the modal
  const handleApplyMapping = (transformedFile, newMapping, streamType) => {
    const updateInfo = (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        file: transformedFile,
        mapping: newMapping,
        isValid: true,
        isReviewed: true, // Marked as explicitly reviewed by user
        validation: {
          isValid: true,
          missingFields: [],
          totalRequired: STREAM_SCHEMAS[streamType]?.requiredFields?.length || 5,
          mappedCount: STREAM_SCHEMAS[streamType]?.requiredFields?.length || 5,
          hasCustomHeaders: prev.validation?.hasCustomHeaders,
          isExactMatch: prev.validation?.isExactMatch,
        }
      };
    };

    if (streamType === 'invoices') setInvoicesInfo(updateInfo);
    if (streamType === 'payments') setPaymentsInfo(updateInfo);
    if (streamType === 'bank_transactions') setBankInfo(updateInfo);
  };

  // Helper to get unreviewed streams that have custom headers
  const getUnreviewedCustomStreams = () => {
    const unreviewed = [];
    if (invoicesInfo?.validation?.hasCustomHeaders && !invoicesInfo?.isReviewed) {
      unreviewed.push({ streamType: 'invoices', name: 'Invoices CSV', info: invoicesInfo });
    }
    if (paymentsInfo?.validation?.hasCustomHeaders && !paymentsInfo?.isReviewed) {
      unreviewed.push({ streamType: 'payments', name: 'Payments CSV', info: paymentsInfo });
    }
    if (bankInfo?.validation?.hasCustomHeaders && !bankInfo?.isReviewed) {
      unreviewed.push({ streamType: 'bank_transactions', name: 'Bank Statement CSV', info: bankInfo });
    }
    return unreviewed;
  };

  const handleReconcileClick = () => {
    if (!invoicesInfo?.file || !paymentsInfo?.file || !bankInfo?.file) {
      setErrorMsg('Please upload all 3 files (invoices, payments, bank transactions)');
      return;
    }

    if (!invoicesInfo.isValid || !paymentsInfo.isValid || !bankInfo.isValid) {
      setErrorMsg('Please complete required column mappings for all uploaded CSV files before reconciling.');
      return;
    }

    const unreviewedCustomStreams = getUnreviewedCustomStreams();
    // If there are auto-matched custom headers that user hasn't reviewed yet, prompt for review
    if (unreviewedCustomStreams.length > 0) {
      setShowAutoMatchPrompt(true);
      return;
    }

    // Otherwise proceed directly
    executeReconcile();
  };

  const executeReconcile = async () => {
    setShowAutoMatchPrompt(false);
    setErrorMsg('');
    setIsUploading(true);
    setReconcileResult(null);
    if (setProcessingState) setProcessingState(true);

    try {
      const response = await reconcileFiles(
        invoicesInfo.file,
        paymentsInfo.file,
        bankInfo.file
      );
      setReconcileResult(response);

      // Trigger celebration confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0066ff', '#38bdf8', '#e5a93b', '#10b981', '#ffffff'],
      });

      // Smooth scroll down to results section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

    } catch (err) {
      setErrorMsg(err.message || 'Reconciliation failed');
    } finally {
      setIsUploading(false);
      if (setProcessingState) setProcessingState(false);
    }
  };

  const resetUpload = () => {
    setInvoicesInfo(null);
    setPaymentsInfo(null);
    setBankInfo(null);
    setReconcileResult(null);
    setShowAutoMatchPrompt(false);
    setErrorMsg('');
  };

  // Compute status counts for custom files
  const results = reconcileResult?.results || [];
  const exceptions = reconcileResult?.exceptions || [];
  const allItems = [...results, ...exceptions];
  const summary = reconcileResult?.summary || {};

  const counts = {
    ALL: summary.total_invoices || allItems.length,
    RECONCILED: summary.reconciled || allItems.filter(r => r.status === 'RECONCILED').length,
    AMOUNT_MISMATCH: allItems.filter(r => r.status === 'AMOUNT_MISMATCH').length,
    MISSING_PAYMENT: allItems.filter(r => r.status === 'MISSING_PAYMENT').length,
    MISSING_BANK_TRANSACTION: allItems.filter(r => r.status === 'MISSING_BANK_TRANSACTION').length,
    DUPLICATE: allItems.filter(r => r.status === 'DUPLICATE').length,
    REVIEW_REQUIRED: allItems.filter(r => r.status === 'REVIEW_REQUIRED').length,
  };

  const breakdownCards = [
    { label: "All Invoices", count: counts.ALL, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
    { label: "Reconciled", count: counts.RECONCILED, color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
    { label: "Amount Mismatch", count: counts.AMOUNT_MISMATCH, color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
    { label: "Missing Payment", count: counts.MISSING_PAYMENT, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    { label: "Missing Bank", count: counts.MISSING_BANK_TRANSACTION, color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
    { label: "Duplicates", count: counts.DUPLICATE, color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
    { label: "Review Needed", count: counts.REVIEW_REQUIRED, color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  ];

  // Helper for rendering stream upload card
  const renderUploadCard = (title, streamType, info, color, bgBorder) => {
    const isUploaded = !!info?.file;
    const isValid = info?.isValid;
    const isReviewed = info?.isReviewed;
    const missingCount = info?.validation?.missingFields?.length || 0;
    const totalRequired = STREAM_SCHEMAS[streamType]?.requiredFields?.length || 5;
    const mappedCount = info?.validation?.mappedCount || 0;
    const hasCustomHeaders = info?.validation?.hasCustomHeaders;
    const isExactMatch = info?.validation?.isExactMatch;

    return (
      <div className="glass-panel" style={{
        padding: '20px',
        border: isUploaded ? (isValid ? (hasCustomHeaders && !isReviewed ? '1.5px solid #3b82f6' : `1.5px solid ${color}`) : '1.5px solid #f59e0b') : '1px dashed #cbd5e1',
        textAlign: 'center',
        background: isUploaded ? (isValid ? (hasCustomHeaders && !isReviewed ? '#f8fafc' : bgBorder) : '#fffdf5') : '#ffffff',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div>
          {/* Icon */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: bgBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            color: color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <FileSpreadsheet size={22} />
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>
            {title}
          </h4>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
            Required: {STREAM_SCHEMAS[streamType]?.requiredFields.map(f => f.key).join(', ')}
          </p>

          {/* Validation Status Pill */}
          {isUploaded && (
            <div style={{ marginBottom: '12px' }}>
              {isValid ? (
                hasCustomHeaders ? (
                  isReviewed ? (
                    <div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        color: '#15803d',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                      }}>
                        <Check size={13} />
                        <span>Mapping Confirmed ({mappedCount}/{totalRequired})</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#059669', marginTop: '3px' }}>
                        Custom headers verified
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                      }}>
                        <Sparkles size={12} style={{ color: '#2563eb' }} />
                        <span>Auto-Matched ({mappedCount}/{totalRequired})</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
                        Custom headers detected • Review advised
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                  }}>
                    <Check size={13} />
                    <span>Schema Valid ({mappedCount}/{totalRequired} mapped)</span>
                  </div>
                )
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                }}>
                  <AlertTriangle size={13} />
                  <span>Mapping Needed ({missingCount} unassigned)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: isUploaded ? '#ffffff' : '#f1f5f9',
            border: `1px solid ${isUploaded ? '#cbd5e1' : '#cbd5e1'}`,
            color: '#0f172a',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files[0] || null, streamType)}
            />
            <span>{isUploaded ? `📄 ${info.file.name}` : `Upload ${title}`}</span>
          </label>

          {/* Column Mapping Button if file is uploaded */}
          {isUploaded && (
            <button
              onClick={() => setActiveModalStream(streamType)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: isValid ? (hasCustomHeaders && !isReviewed ? '#eff6ff' : '#f8fafc') : '#fef3c7',
                border: `1px solid ${isValid ? (hasCustomHeaders && !isReviewed ? '#bfdbfe' : '#e2e8f0') : '#f59e0b'}`,
                color: isValid ? (hasCustomHeaders && !isReviewed ? '#1d4ed8' : '#334155') : '#b45309',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={13} />
              <span>{isValid ? (isReviewed ? 'Edit Column Mapping' : 'Review & Edit Column Mapping') : 'Map Columns Now'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const getModalFileInfo = () => {
    if (activeModalStream === 'invoices') return invoicesInfo;
    if (activeModalStream === 'payments') return paymentsInfo;
    if (activeModalStream === 'bank_transactions') return bankInfo;
    return null;
  };

  const allFilesReady = invoicesInfo?.file && paymentsInfo?.file && bankInfo?.file;
  const allFilesValid = invoicesInfo?.isValid && paymentsInfo?.isValid && bankInfo?.isValid;
  const unreviewedStreams = getUnreviewedCustomStreams();
  const hasAnyCustomAutoMatched =
    invoicesInfo?.validation?.hasCustomHeaders ||
    paymentsInfo?.validation?.hasCustomHeaders ||
    bankInfo?.validation?.hasCustomHeaders;

  return (
    <div style={{ paddingTop: '28px', paddingBottom: '60px' }}>
      
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="track-pill">
            <UploadCloud size={13} />
            <span>CUSTOM CSV RECONCILIATION & SCHEMA MAPPING</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>
          Reconcile Your Own CSV Datasets
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
          Upload your 3 financial streams in any CSV format. The engine validates required fields on the fly and provides an interactive <strong>Column Mapping Wizard</strong> to align custom headers effortlessly.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 20px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          color: '#be123c',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3 Upload Drag & Drop Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        maxWidth: '980px',
        margin: '0 auto 24px',
      }}>
        {renderUploadCard('1. Invoices CSV', 'invoices', invoicesInfo, '#0284c7', '#f0f9ff')}
        {renderUploadCard('2. Payments CSV', 'payments', paymentsInfo, '#0066ff', '#f0fdf4')}
        {renderUploadCard('3. Bank Statement CSV', 'bank_transactions', bankInfo, '#059669', '#ecfdf5')}
      </div>

      {/* Notice Banner when custom headers are auto-matched */}
      {hasAnyCustomAutoMatched && (
        <div style={{
          maxWidth: '980px',
          margin: '0 auto 20px',
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)',
        }}>
          <Sparkles size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
          <div style={{ fontSize: '0.83rem', lineHeight: 1.45 }}>
            <strong style={{ fontWeight: 800 }}>Auto-Matched Columns Detected:</strong> We detected custom headers in your uploaded CSVs and automatically aligned them to the system schema. You can click <strong>"Review & Edit Column Mapping"</strong> on any card to confirm, or click <strong>Reconcile</strong> to review before processing.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        <button
          className="btn-primary"
          onClick={handleReconcileClick}
          disabled={!allFilesReady || !allFilesValid || isUploading}
          style={{ padding: '12px 32px', fontSize: '0.94rem' }}
        >
          <Play size={15} fill="#ffffff" />
          <span>
            {isUploading
              ? 'Executing Reconciler...'
              : !allFilesReady
              ? 'Upload 3 CSV Files'
              : !allFilesValid
              ? 'Complete Column Mapping'
              : 'Reconcile 3 CSV Streams'}
          </span>
        </button>

        {reconcileResult && (
          <button
            className="btn-secondary"
            onClick={resetUpload}
            style={{ padding: '11px 20px', fontSize: '0.88rem' }}
          >
            <RefreshCw size={14} />
            <span>Upload New Files</span>
          </button>
        )}
      </div>

      {/* ON-PAGE CUSTOM RECONCILIATION RESULTS SECTION */}
      {reconcileResult && (
        <div ref={resultsRef} style={{ marginTop: '30px' }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#059669" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                CUSTOM RECONCILIATION SUMMARY & HEALTH
              </h3>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#0284c7',
                background: '#f0f9ff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                border: '1px solid #bae6fd',
              }}>
                USER DATASET AUDIT
              </span>
            </div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Execution Time: <strong>{reconcileResult.execution_time_ms || 0} ms</strong>
            </div>
          </div>

          {/* Breakdown KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '24px',
          }}>
            {breakdownCards.map((card, i) => (
              <div key={i} style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                padding: '12px 14px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color, fontFamily: 'var(--font-mono)' }}>
                  {card.count}
                </span>
              </div>
            ))}
          </div>

          {/* Reconciliation Results Table */}
          <ResultsTable
            results={results}
            exceptions={exceptions}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
          />

        </div>
      )}

      {/* Auto-Match Review Confirmation Modal (shown when reconciling unreviewed auto-matched files) */}
      {showAutoMatchPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => setShowAutoMatchPrompt(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px' }}>
              <Sparkles size={14} style={{ color: '#2563eb' }} />
              <span>AUTO-MATCHED COLUMNS DETECTED</span>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
              Review Auto-Matched Columns Before Reconciling
            </h3>
            
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55, marginBottom: '20px' }}>
              We automatically mapped custom headers for <strong>{unreviewedStreams.length} dataset{unreviewedStreams.length > 1 ? 's' : ''}</strong> based on naming analysis. Please take a moment to review the alignments below to prevent unexpected mismatches during 3-way reconciliation.
            </p>

            {/* List of auto-matched streams and their mappings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {unreviewedStreams.map(({ streamType, name, info }) => {
                const schema = STREAM_SCHEMAS[streamType];
                return (
                  <div
                    key={streamType}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={16} color="#0284c7" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{name}</span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>({info.file?.name})</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowAutoMatchPrompt(false);
                          setActiveModalStream(streamType);
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#0284c7',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <SlidersHorizontal size={12} />
                        <span>Edit Mapping</span>
                      </button>
                    </div>

                    {/* Mappings pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {schema?.requiredFields.map(f => {
                        const mappedCol = info.mapping[f.key];
                        return (
                          <div
                            key={f.key}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{mappedCol || '—'}</span>
                            <span style={{ color: '#0284c7', fontWeight: 800 }}>➔</span>
                            <code style={{ color: '#0f172a', fontWeight: 700 }}>{f.key}</code>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAutoMatchPrompt(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const firstStream = unreviewedStreams[0]?.streamType;
                  setShowAutoMatchPrompt(false);
                  if (firstStream) setActiveModalStream(firstStream);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #93c5fd',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Eye size={15} />
                <span>Review Mappings Wizard</span>
              </button>

              <button
                onClick={executeReconcile}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0066ff 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)',
                }}
              >
                <Play size={14} fill="#ffffff" />
                <span>Proceed with Auto-Reconcile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tri-Party Record Audit & Gemini AI Copilot Modal */}
      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Interactive Column Mapping Wizard Modal */}
      {activeModalStream && (
        <ColumnMappingModal
          isOpen={!!activeModalStream}
          streamType={activeModalStream}
          fileInfo={getModalFileInfo()}
          onClose={() => setActiveModalStream(null)}
          onApplyMapping={(transformedFile, newMapping) =>
            handleApplyMapping(transformedFile, newMapping, activeModalStream)
          }
        />
      )}

    </div>
  );
}

