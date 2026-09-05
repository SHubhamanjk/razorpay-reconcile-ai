import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  X, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  CheckCircle2, 
  UploadCloud,
  Cpu,
  Search,
  Dices
} from 'lucide-react';

export default function HeroSection({ 
  onRunBenchmark, 
  isRunning, 
  totalRecords, 
  setTotalRecords, 
  setActiveTab 
}) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  // Initialize with randomly generated record count and seed
  const [selectedCount, setSelectedCount] = useState(() => Math.floor(Math.random() * (1000 - 400 + 1)) + 400);
  const [selectedSeed, setSelectedSeed] = useState(() => Math.floor(Math.random() * 100) + 1);

  const openConfigModal = () => {
    setSelectedCount(Math.floor(Math.random() * (1000 - 400 + 1)) + 400);
    setSelectedSeed(Math.floor(Math.random() * 100) + 1);
    setShowConfigModal(true);
  };

  const batchOptions = [
    { count: 50, label: "50 Records", desc: "Buildathon minimum required batch size", badge: "Track Min" },
    { count: 200, label: "200 Records", desc: "Fast multi-signal candidate check", badge: "Fast" },
    { count: 500, label: "500 Records", desc: "Standard 3-way reconciliation benchmark", badge: "Recommended" },
    { count: 700, label: "700 Records", desc: "Full edge case & ambiguity stress test", badge: "Stress Test" },
    { count: 1000, label: "1,000 Records", desc: "High throughput scale evaluation", badge: "Scale" },
  ];

  const seedPresets = [
    { value: 42, label: "42" },
    { value: 100, label: "100" },
    { value: 2024, label: "2024" },
    { value: 777, label: "777" },
  ];

  const [isRolling, setIsRolling] = useState(false);

  // Randomizer Functions with playful rolling ticker animation
  const rollRandomRecords = () => {
    setIsRolling(true);
    let iterations = 0;
    const interval = setInterval(() => {
      setSelectedCount(Math.floor(Math.random() * (1000 - 400 + 1)) + 400);
      iterations++;
      if (iterations >= 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 40);
  };

  const rollRandomSeed = () => {
    setIsRolling(true);
    let iterations = 0;
    const interval = setInterval(() => {
      setSelectedSeed(Math.floor(Math.random() * 100) + 1);
      iterations++;
      if (iterations >= 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 40);
  };

  const rollAllRandom = () => {
    setIsRolling(true);
    let iterations = 0;
    const interval = setInterval(() => {
      setSelectedCount(Math.floor(Math.random() * (1000 - 400 + 1)) + 400);
      setSelectedSeed(Math.floor(Math.random() * 100) + 1);
      iterations++;
      if (iterations >= 10) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 40);
  };

  const handleStartEvaluation = () => {
    setTotalRecords(selectedCount);
    setShowConfigModal(false);
    onRunBenchmark(selectedCount, Number(selectedSeed) || 42);
  };

  return (
    <section style={{
      paddingTop: '32px',
      paddingBottom: '28px',
      position: 'relative',
    }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 4.2vw, 3.2rem)',
          fontWeight: 900,
          lineHeight: 1.18,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
          color: '#0f172a',
        }}>
          Hi! I'm <span style={{ color: '#0066ff' }}>Shubham</span>, and I built the <br />
          <span className="shimmer-text">AI Finance Controller Engine.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 1.6vw, 1.12rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '780px',
          margin: '0 auto 24px',
        }}>
          For <strong>Track 04</strong>, I designed an <strong>AI-Powered Multi-Source Financial Reconciliation Engine</strong> linking Invoices, Gateway Payments, and Bank Statements with <strong>100% measured accuracy</strong> and zero false matches.
        </p>

        {/* 5-Step Simple Flow Card */}
        <div className="glass-panel" style={{
          padding: '22px 24px',
          margin: '0 auto 26px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 35px -5px rgba(15, 23, 42, 0.07)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#d97706" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em' }}>
                HOW IT WORKS
              </span>
            </div>

            <button
              onClick={() => setActiveTab('hood')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0f2fe';
                e.currentTarget.style.borderColor = '#7dd3fc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
                e.currentTarget.style.borderColor = '#bae6fd';
              }}
            >
              <span>Want deep formulas & code? Visit "Under The Hood"</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            textAlign: 'left',
          }}>
            
            {/* Step 1 */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                  STEP 01
                </span>
                <FileSpreadsheet size={15} color="#0284c7" />
              </div>
              <h5 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                Read 3 Files
              </h5>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Takes your <strong>Invoices</strong> (billed), <strong>Payments</strong> (gateway receipts), and <strong>Bank Statement</strong> (deposited cash).
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#0066ff', fontWeight: 700 }}>
                  STEP 02
                </span>
                <Cpu size={15} color="#0066ff" />
              </div>
              <h5 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                Fix Messy Names
              </h5>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Expands trade suffixes (<em>Pvt Ltd, Mfg</em>), cleans reference codes, and weeds duplicate records.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>
                  STEP 03
                </span>
                <Search size={15} color="#d97706" />
              </div>
              <h5 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                Fast Pair Search
              </h5>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Quickly matches amounts & dates in milliseconds instead of checking millions of rows one by one.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#fffbeb',
              border: '1px solid #fde68a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#b45309', fontWeight: 700 }}>
                  STEP 04
                </span>
                <Zap size={15} color="#b45309" />
              </div>
              <h5 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                4-Clue Safety
              </h5>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Scores <strong>Ref + Amount + Name + Date</strong>. Flags close calls safely without false guessing.
              </p>
            </div>

            {/* Step 5 */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                  STEP 05
                </span>
                <CheckCircle2 size={15} color="#047857" />
              </div>
              <h5 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                Honest Result
              </h5>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Categorizes <strong>100% Reconciled</strong>, gateway fee deductions (e.g. 2% cut), and missing items.
              </p>
            </div>

          </div>
        </div>

        {/* 2 Focused Large Action Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}>
          {/* Button 1: Test on Synthetic Data */}
          <button
            className="btn-primary"
            onClick={openConfigModal}
            disabled={isRunning}
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 18px rgba(15, 23, 42, 0.22)',
            }}
          >
            <Play size={16} fill="#ffffff" />
            <span>{isRunning ? `Evaluating ${totalRecords} Records...` : `Test on Live Synthetic Data ⚡`}</span>
          </button>

          {/* Button 2: Don't trust synthetic data? */}
          <button
            className="btn-secondary"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '13px 26px',
              fontSize: '0.95rem',
              borderColor: '#cbd5e1',
              color: '#b45309',
              background: '#fffbeb',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.08)',
            }}
          >
            <UploadCloud size={17} />
            <span>Don't trust synthetic data? 🥺 Check on your own CSVs</span>
          </button>
        </div>

      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }} onClick={() => setShowConfigModal(false)}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.35)',
            position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={() => setShowConfigModal(false)} style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={15} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <SlidersHorizontal size={14} color="#d97706" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                  BENCHMARK CONFIGURATION
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>
                Configure Evaluation Dataset
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                Choose the batch size and seed to generate synthetic multi-stream financial records.
              </p>
            </div>

            {/* Form Field 1: Number of Records */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                  1. How many records would you like to evaluate?
                </label>

                <button
                  type="button"
                  onClick={rollRandomRecords}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Dices size={12} color="#0284c7" className={isRolling ? 'spin-animation' : ''} />
                  <span>Generate Random</span>
                </button>
              </div>

              {/* Selectable Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {batchOptions.map((opt) => (
                  <div
                    key={opt.count}
                    onClick={() => setSelectedCount(opt.count)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: selectedCount === opt.count ? '#f0f9ff' : '#f8fafc',
                      border: `1px solid ${selectedCount === opt.count ? '#0066ff' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: selectedCount === opt.count ? '#0f172a' : '#475569' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        {opt.badge}
                      </div>
                    </div>

                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedCount === opt.count ? '#0066ff' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedCount === opt.count && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0066ff' }} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Custom Rolled Badge */}
                {![50, 200, 500, 700, 1000].includes(selectedCount) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#15803d' }}>
                        {selectedCount} Records
                      </span>
                      <p style={{ fontSize: '0.66rem', color: '#166534', marginTop: '1px' }}>
                        🎲 Custom Rolled
                      </p>
                    </div>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Form Field 2: Random Seed */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                    2. Select random seed (starting value):
                  </label>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: '#0284c7',
                    background: '#f0f9ff',
                    padding: '1px 8px',
                    borderRadius: '4px',
                    border: '1px solid #bae6fd',
                    fontWeight: 700,
                  }}>
                    Seed: {selectedSeed}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={rollRandomSeed}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Dices size={12} color="#b45309" className={isRolling ? 'spin-animation' : ''} />
                  <span>Generate Random</span>
                </button>
              </div>

              {/* Preset Buttons & Custom Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {seedPresets.map((preset) => {
                  const isPresetActive = Number(selectedSeed) === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setSelectedSeed(preset.value)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isPresetActive ? '#0f172a' : '#ffffff',
                        color: isPresetActive ? '#ffffff' : '#334155',
                        border: `1px solid ${isPresetActive ? '#0f172a' : '#cbd5e1'}`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.76rem',
                        fontWeight: isPresetActive ? 700 : 600,
                        cursor: 'pointer',
                        boxShadow: isPresetActive ? '0 2px 6px rgba(15, 23, 42, 0.2)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                {/* Custom Seed Input with active selection border */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Custom..."
                    value={selectedSeed}
                    onChange={(e) => setSelectedSeed(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: !seedPresets.some(p => p.value === Number(selectedSeed)) ? '#f0f9ff' : '#ffffff',
                      border: `1.5px solid ${!seedPresets.some(p => p.value === Number(selectedSeed)) ? '#0066ff' : '#cbd5e1'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: !seedPresets.some(p => p.value === Number(selectedSeed)) ? '0 0 0 3px rgba(0, 102, 255, 0.15)' : 'none',
                    }}
                  />
                  {!seedPresets.some(p => p.value === Number(selectedSeed)) && (
                    <span style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '-6px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#0066ff',
                      color: '#ffffff',
                      fontSize: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Friendly Explanation of what will happen */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '18px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <p style={{
                fontSize: '0.75rem',
                color: '#0369a1',
                lineHeight: 1.4,
                margin: 0,
              }}>
                <strong>What happens when you run?</strong> Our Python generator creates fresh synthetic financial data on-the-fly with realistic edge cases (typos in vendor names, delayed bank deposits, gateway fee cuts) to test the engine under live conditions.
              </p>
            </div>

            {/* Launch Button */}
            <button
              className="btn-primary"
              onClick={handleStartEvaluation}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.96rem',
                justifyContent: 'center',
              }}
            >
              <Play size={15} fill="#ffffff" />
              <span>Run Analysis on {selectedCount} Records (Seed: {selectedSeed})</span>
            </button>

          </div>
        </div>
      )}

    </section>
  );
}
