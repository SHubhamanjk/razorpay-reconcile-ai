import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Terminal, ShieldAlert, Cpu, Database, Activity } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: "Tri-Stream Ingestion & Header Verification",
    description: "Validating CSV encoding & required schema across Invoices, Payments, and Bank Transactions",
    icon: Database,
  },
  {
    id: 2,
    title: "Entity Normalization & Suffix Expansion",
    description: "Expanding legal suffixes (Pvt Ltd, Mfg, Corp), lowercasing, and sanitizing reference codes",
    icon: Cpu,
  },
  {
    id: 3,
    title: "Data Quality Audit & Duplicate Quarantine",
    description: "Detecting missing primary keys, negative amounts, and repeated reference clusters",
    icon: ShieldAlert,
  },
  {
    id: 4,
    title: "High-Speed Candidate Space Indexing",
    description: "O(1) reference hash lookup & tight numeric amount tolerance pre-filtering",
    icon: Activity,
  },
  {
    id: 5,
    title: "4-Signal Scoring & Ambiguity Margin Check",
    description: "Computing Reference (40) + Amount (30) + Entity Similarity (20) + Date Lag (10)",
    icon: Cpu,
  },
  {
    id: 6,
    title: "3-Way Consistency Classification",
    description: "Categorizing RECONCILED, AMOUNT_MISMATCH, MISSING_PAYMENT, DUPLICATE states",
    icon: CheckCircle2,
  },
];

export default function ProcessingLive({ isRunning, currentStep = 1, totalRecords = 500 }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 30);
    } else {
      setElapsedMs(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <div className="glass-panel" style={{
      marginTop: '20px',
      padding: '20px',
      border: '1px solid var(--border-blue)',
      boxShadow: '0 8px 30px -4px rgba(0, 102, 255, 0.1)',
      background: '#ffffff',
    }}>
      {/* Telemetry Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}>
            <Terminal size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>ENGINE TELEMETRY — LIVE EXECUTION</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Reconciling batch of {totalRecords} records across 3 independent financial streams
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: '#0369a1',
            background: '#f0f9ff',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #bae6fd',
            fontWeight: 600,
          }}>
            ⏱️ {(elapsedMs / 1000).toFixed(2)}s ELAPSED
          </div>
        </div>
      </div>

      {/* Sequential Pipeline Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
        {PIPELINE_STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: isCurrent 
                ? '#f0f9ff' 
                : isDone 
                ? '#ecfdf5' 
                : '#f8fafc',
              border: `1px solid ${
                isCurrent 
                  ? '#0066ff' 
                  : isDone 
                  ? '#a7f3d0' 
                  : '#e2e8f0'
              }`,
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: isDone ? '#047857' : isCurrent ? '#0066ff' : 'var(--text-muted)',
                }}>
                  PHASE 0{step.id}
                </span>

                {isDone ? (
                  <CheckCircle2 size={14} color="#047857" />
                ) : isCurrent ? (
                  <Loader2 size={14} color="#0066ff" className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#cbd5e1' }} />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Icon size={13} color={isCurrent ? '#0066ff' : isDone ? '#047857' : 'var(--text-muted)'} />
                <h5 style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isPending ? 'var(--text-muted)' : '#0f172a',
                }}>
                  {step.title}
                </h5>
              </div>

              <p style={{
                fontSize: '0.72rem',
                color: isPending ? '#94a3b8' : 'var(--text-secondary)',
                lineHeight: 1.35,
              }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
