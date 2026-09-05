import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Table,
  Check,
  Eye,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  STREAM_SCHEMAS,
  computeAutoMapping,
  validateMapping,
  transformCsvWithMapping,
} from '../utils/csvMapper';

export default function ColumnMappingModal({
  isOpen,
  onClose,
  streamType,
  fileInfo, // { file, headers, rows, rawText, totalRows }
  onApplyMapping,
}) {
  if (!isOpen || !fileInfo || !streamType) return null;

  const schema = STREAM_SCHEMAS[streamType];
  const detectedHeaders = fileInfo.headers || [];
  const previewRows = fileInfo.rows || [];

  const [activeTab, setActiveTab] = useState('mapping'); // 'mapping' | 'review'
  const [mapping, setMapping] = useState({});

  // Initialize or re-compute mapping when modal opens
  useEffect(() => {
    if (fileInfo?.headers) {
      const autoMap = computeAutoMapping(fileInfo.headers, streamType);
      setMapping(autoMap);
    }
  }, [fileInfo, streamType]);

  const validation = validateMapping(streamType, mapping, detectedHeaders);

  const handleSelectChange = (targetKey, selectedHeader) => {
    setMapping((prev) => ({
      ...prev,
      [targetKey]: selectedHeader,
    }));
  };

  const handleApply = () => {
    if (!validation.isValid) return;
    const transformedFile = transformCsvWithMapping(
      fileInfo.rawText,
      mapping,
      fileInfo.file?.name || `${streamType}.csv`
    );
    onApplyMapping(transformedFile, mapping);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '880px',
          height: '86vh',
          maxHeight: '760px',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          borderRadius: '18px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 0',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              {schema?.title || 'CSV DATASET'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              FILE: {fileInfo.file?.name} ({fileInfo.totalRows || 0} rows)
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Align CSV Columns to System Schema
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, paddingBottom: '14px' }}>
            Map your uploaded columns to the required reconciliation fields and review the live transformed data.
          </p>

          {/* Navigation Tabs Bar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('mapping')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'mapping' ? 800 : 600,
                color: activeTab === 'mapping' ? '#0066ff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <SlidersHorizontal size={15} />
              <span>1. Column Mapping</span>
              {validation.isValid ? (
                <span
                  style={{
                    fontSize: '0.66rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontWeight: 800,
                  }}
                >
                  ✓ Ready
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.66rem',
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontWeight: 800,
                  }}
                >
                  {validation.missingFields.length} Unmapped
                </span>
              )}
              {activeTab === 'mapping' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#0066ff',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('review')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'review' ? 800 : 600,
                color: activeTab === 'review' ? '#0066ff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <Eye size={15} />
              <span>2. Review Data Preview</span>
              {activeTab === 'review' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#0066ff',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body with explicit scrolling */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '20px 24px',
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* TAB 1: COLUMN MAPPING */}
          {activeTab === 'mapping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Auto-Mapping Review Guidance Banner */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.82rem',
                  color: '#1e40af',
                  lineHeight: 1.45,
                }}
              >
                <Info size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontWeight: 800 }}>Please Review Auto-Mapped Columns:</strong> We have automatically matched your CSV headers to the system schema based on column naming. Please verify the dropdown selections below or check the <strong>2. Review Data Preview</strong> tab before continuing.
                </div>
              </div>

              {/* Validation Status Bar */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: validation.isValid ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${validation.isValid ? '#a7f3d0' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {validation.isValid ? (
                    <CheckCircle2 size={18} style={{ color: '#059669' }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: '#d97706' }} />
                  )}
                  <div>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: validation.isValid ? '#065f46' : '#92400e',
                      }}
                    >
                      {validation.isValid
                        ? `All ${validation.totalRequired} required fields mapped successfully!`
                        : `${validation.mappedCount} of ${validation.totalRequired} fields mapped (${validation.missingFields.length} unassigned)`}
                    </span>
                    {!validation.isValid && (
                      <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '2px' }}>
                        Missing: {validation.missingFields.map((f) => f.label).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mapping Grid Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 28px 1.5fr',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <div>Target Required Field</div>
                  <div></div>
                  <div>Your Uploaded Column</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {schema?.requiredFields.map((field, idx) => {
                    const isMapped = !!mapping[field.key] && detectedHeaders.includes(mapping[field.key]);
                    const selectedVal = mapping[field.key] || '';
                    const samplePreviewVal =
                      selectedVal && previewRows[0] ? previewRows[0][selectedVal] : '';

                    return (
                      <div
                        key={field.key}
                        style={{
                          padding: '14px 16px',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 28px 1.5fr',
                          alignItems: 'center',
                          gap: '8px',
                          borderBottom:
                            idx === schema.requiredFields.length - 1 ? 'none' : '1px solid #f1f5f9',
                          background: isMapped ? '#ffffff' : '#fffdf5',
                        }}
                      >
                        {/* Target Schema Field Column */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                              {field.label}
                            </span>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              REQUIRED
                            </span>
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                            {field.desc}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#94a3b8',
                              fontFamily: 'var(--font-mono)',
                              marginTop: '2px',
                            }}
                          >
                            Target Key: <code style={{ color: '#0284c7' }}>{field.key}</code>
                          </div>
                        </div>

                        {/* Arrow Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowRight size={14} style={{ color: isMapped ? '#0284c7' : '#cbd5e1' }} />
                        </div>

                        {/* User Dropdown Selection Column */}
                        <div>
                          <select
                            value={selectedVal}
                            onChange={(e) => handleSelectChange(field.key, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: isMapped ? '1px solid #cbd5e1' : '1.5px solid #f59e0b',
                              fontSize: '0.84rem',
                              color: isMapped ? '#0f172a' : '#b45309',
                              fontWeight: 600,
                              background: isMapped ? '#ffffff' : '#fffbeb',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="">-- Select Matching Column --</option>
                            {detectedHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>

                          {/* Sample Value Preview */}
                          {selectedVal && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: '#64748b',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>Sample value:</span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  background: '#f1f5f9',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  color: '#0f172a',
                                  fontWeight: 600,
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {samplePreviewVal !== '' ? String(samplePreviewVal) : '(empty)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REVIEW DATA PREVIEW */}
          {activeTab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary of Mapping Card */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Current Schema Alignment:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {schema?.requiredFields.map((field) => {
                    const srcCol = mapping[field.key];
                    return (
                      <div
                        key={field.key}
                        style={{
                          background: srcCol ? '#f0fdf4' : '#fff1f2',
                          border: `1px solid ${srcCol ? '#bbf7d0' : '#fecdd3'}`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <code style={{ fontWeight: 700, color: '#0f172a' }}>{field.key}</code>
                        <span style={{ color: '#94a3b8' }}>←</span>
                        <span style={{ color: srcCol ? '#166534' : '#be123c', fontWeight: 600 }}>
                          {srcCol || 'MISSING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Table size={15} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      Transformed Output Preview (First 5 Rows)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Showing how engine will parse columns
                  </span>
                </div>

                <div style={{ overflowX: 'auto', padding: '12px 16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        {schema?.requiredFields.map((field) => (
                          <th
                            key={field.key}
                            style={{
                              padding: '8px 10px',
                              color: '#334155',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              background: '#f8fafc',
                              borderRight: '1px solid #f1f5f9',
                            }}
                          >
                            <div>{field.key}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>
                              ({mapping[field.key] || 'Not Mapped'})
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {schema?.requiredFields.map((field) => {
                            const srcCol = mapping[field.key];
                            const cellVal = srcCol ? row[srcCol] : '—';
                            return (
                              <td
                                key={field.key}
                                style={{
                                  padding: '8px 10px',
                                  color: srcCol ? '#0f172a' : '#94a3b8',
                                  fontFamily: 'var(--font-mono)',
                                  borderRight: '1px solid #f8fafc',
                                }}
                              >
                                {cellVal !== '' ? String(cellVal) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.78rem', color: validation.isValid ? '#059669' : '#d97706', fontWeight: 600 }}>
            {validation.isValid ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Ready to apply mapping
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Please assign all required fields
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'mapping' && validation.isValid && (
              <button
                onClick={() => setActiveTab('review')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Eye size={14} /> Review Preview
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              disabled={!validation.isValid}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: validation.isValid
                  ? 'linear-gradient(135deg, #0066ff 0%, #0284c7 100%)'
                  : '#cbd5e1',
                color: validation.isValid ? '#ffffff' : '#94a3b8',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: validation.isValid ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: validation.isValid ? '0 2px 10px rgba(0, 102, 255, 0.25)' : 'none',
              }}
            >
              <Check size={15} /> Apply Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
