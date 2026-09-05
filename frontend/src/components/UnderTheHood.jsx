import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet, 
  Scale, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function UnderTheHood() {
  const [testInput, setTestInput] = useState('Vanguard Mfg Pvt Ltd');
  const [testRef, setTestRef] = useState('REF-0042/A');
  const [testAmount, setTestAmount] = useState('₹ 25,000.50');

  // Simulated live normalizer for demonstration
  const normalizedTest = testInput
    .toLowerCase()
    .replace(/\bpvt\b|\bpvt\.\b/g, 'private')
    .replace(/\bltd\b|\bltd\.\b/g, 'limited')
    .replace(/\bmfg\b/g, 'manufacturing')
    .replace(/\btech\b/g, 'technologies')
    .replace(/\bcorp\b/g, 'corporation')
    .replace(/\binc\b/g, 'incorporated')
    .replace(/\bco\b/g, 'company')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normalizedRef = testRef.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedAmt = parseFloat(testAmount.replace(/[^\d.]/g, '') || 0).toFixed(2);

  return (
    <div style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="track-pill">
            <Layers size={13} />
            <span>ARCHITECTURAL DEEP DIVE</span>
          </span>
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px' }}>
          Under the Hood: The Engine Mechanics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          How the deterministic multi-source pipeline reconciles disparate financial streams with mathematical certainty, strict ambiguity prevention, and zero hallucination.
        </p>
      </div>

      {/* Step 1: Tri-Stream Ingestion Matrix */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(0, 102, 255, 0.15)',
            border: '1px solid var(--border-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--razor-cyan)',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}>
            01
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tri-Stream Input Schema</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Invoices act as the primary anchor record to reconcile asynchronous customer payments and bank settlements.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileSpreadsheet size={15} color="#0284c7" />
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>invoices.csv</h5>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Accounts Receivable ledger created when a customer is billed.</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#f1f5f9', padding: '8px', borderRadius: '6px', color: '#0f172a' }}>
              invoice_id, invoice_date, customer, amount, reference
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileSpreadsheet size={15} color="#0066ff" />
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>payments.csv</h5>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Payment gateway logs (e.g. Razorpay/Stripe checkout events).</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#f1f5f9', padding: '8px', borderRadius: '6px', color: '#0f172a' }}>
              payment_id, date, customer, amount, reference, status
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileSpreadsheet size={15} color="#059669" />
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>bank_transactions.csv</h5>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Core banking account statement showing net deposited cash.</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#f1f5f9', padding: '8px', borderRadius: '6px', color: '#0f172a' }}>
              transaction_id, date, description, amount, reference
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Interactive Normalizer Playground */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(229, 169, 59, 0.15)',
            border: '1px solid var(--border-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--amber-warm)',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}>
            02
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Live Normalization Engine Playground</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Financial datasets suffer from abbreviation drift. Try typing variations below to see instant deterministic normalization:
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                RAW COMPANY NAME / DESCRIPTION:
              </label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  RAW REFERENCE:
                </label>
                <input
                  type="text"
                  value={testRef}
                  onChange={(e) => setTestRef(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  RAW AMOUNT:
                </label>
                <input
                  type="text"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Normalized Output Box */}
          <div style={{
            background: '#f0f9ff',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            border: '1px solid #bae6fd',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0f2fe', paddingBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                NORMALIZED OUTPUT LAYER
              </span>
              <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                ● CANONICAL FORMAT
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>customer_normalized:</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>
                "{normalizedTest}"
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>reference_normalized:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#b45309', fontWeight: 700 }}>
                  "{normalizedRef}"
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>amount_normalized:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#047857', fontWeight: 700 }}>
                  ₹ {normalizedAmt}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: 4-Signal Deterministic Scoring Matrix */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald-success)',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}>
            03
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>4-Signal Deterministic Scoring Architecture</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Maximum confidence score is 100 points, synthesized across orthogonal financial signals:
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>1. Reference Match</span>
              <span className="mono" style={{ color: 'var(--razor-cyan)', fontWeight: 800 }}>40 PTS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Exact alphanumeric match on sanitized reference code (e.g. <code>ref0042</code> == <code>ref0042</code>). Strongest deterministic anchor.
            </p>
          </div>

          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>2. Amount Match</span>
              <span className="mono" style={{ color: 'var(--emerald-success)', fontWeight: 800 }}>30 PTS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Penny-exact match (±₹0.01) earns full 30 pts. Minor rounding or 1% discrepancy yields 24 pts; &gt;5% yields 0 pts.
            </p>

          </div>

          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>3. Entity Similarity</span>
              <span className="mono" style={{ color: 'var(--amber-warm)', fontWeight: 800 }}>20 PTS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              RapidFuzz token set ratio and subset ratio. Expands trade suffixes and handles word ordering.
            </p>
          </div>

          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>4. Date Proximity</span>
              <span className="mono" style={{ color: '#a78bfa', fontWeight: 800 }}>10 PTS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Accounts for bank settlement clearing lag: 0-3 days lag earns 10 pts; 4-7 days lag earns 5 pts; &gt;14 days yields 0 pts.
            </p>
          </div>
        </div>
      </div>

      {/* Step 4: Ambiguity Prevention & 3-Way Consistency Matrix */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}>
            04
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>3-Way Consistency & Status Matrix</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              How the engine produces an honest exception classification rather than returning a binary True/False:
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>STATUS CLASSIFICATION</th>
                <th style={{ padding: '10px 14px' }}>INVOICE</th>
                <th style={{ padding: '10px 14px' }}>PAYMENT</th>
                <th style={{ padding: '10px 14px' }}>BANK SETTLEMENT</th>
                <th style={{ padding: '10px 14px' }}>FINANCIAL EXPLANATION</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}><span className="status-pill status-reconciled">RECONCILED</span></td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>All 3 records matched with matching amounts and verified signals.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}><span className="status-pill status-mismatch">AMOUNT MISMATCH</span></td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px', color: '#fb7185' }}>₹24,500</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Customer paid in full, but bank deposit is net of ₹500 processing fees.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}><span className="status-pill status-missing-payment">MISSING PAYMENT</span></td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px', color: '#fcd34d' }}>Missing</td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Direct bank wire deposit received without an online checkout session.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}><span className="status-pill status-missing-bank">MISSING BANK</span></td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px', color: '#7dd3fc' }}>Missing</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Customer paid on gateway, but bank settlement batch has not cleared yet.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}><span className="status-pill status-duplicate">DUPLICATE</span></td>
                <td style={{ padding: '12px 14px' }}>₹25,000</td>
                <td style={{ padding: '12px 14px' }}>Duplicate</td>
                <td style={{ padding: '12px 14px' }}>Duplicate</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Multiple conflicting records share identical reference or amount/date combinations.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
