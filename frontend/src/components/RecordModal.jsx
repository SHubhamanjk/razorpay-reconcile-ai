import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Activity,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { analyzeRecordWithAI, sendAIChatMessage } from '../utils/api';

/**
 * Renders Markdown-like formatted content (bold, bullet points, headers, inline code)
 * into rich, styled React HTML elements.
 */
function FormattedContent({ content, isUser = false }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const formatInlineText = (text) => {
    if (!text) return null;
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const matchedText = match[0];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        parts.push(
          <strong key={key++} style={{ fontWeight: 700, color: isUser ? '#ffffff' : '#0f172a' }}>
            {matchedText.slice(2, -2)}
          </strong>
        );
      } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
        parts.push(
          <code key={key++} style={{
            background: isUser ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
            color: isUser ? '#ffffff' : '#0284c7',
            padding: '1px 5px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            border: isUser ? 'none' : '1px solid #e2e8f0',
          }}>
            {matchedText.slice(1, -1)}
          </code>
        );
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        parts.push(
          <em key={key++} style={{ fontStyle: 'italic' }}>
            {matchedText.slice(1, -1)}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} style={{
          margin: '4px 0 6px',
          paddingLeft: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          listStyleType: 'disc',
        }}>
          {currentList.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.45, fontSize: '0.82rem' }}>
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      return;
    }

    // Headings (###, ##, #)
    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h5 key={`h3-${index}`} style={{ fontSize: '0.88rem', fontWeight: 800, margin: '8px 0 3px', color: isUser ? '#ffffff' : '#0f172a' }}>
          {formatInlineText(trimmed.slice(4))}
        </h5>
      );
      return;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList(index);
      const textOnly = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h4 key={`h2-${index}`} style={{ fontSize: '0.94rem', fontWeight: 800, margin: '10px 0 4px', color: isUser ? '#ffffff' : '#0f172a' }}>
          {formatInlineText(textOnly)}
        </h4>
      );
      return;
    }

    // Bullet points (*, -, •, 1.)
    const bulletMatch = trimmed.match(/^(\*|-|•|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      currentList.push(bulletMatch[2]);
      return;
    }

    // Regular line / paragraph
    flushList(index);
    elements.push(
      <p key={`p-${index}`} style={{ margin: '3px 0', lineHeight: 1.5, fontSize: '0.82rem' }}>
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList('final');
  return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
}

export default function RecordModal({ record, onClose }) {
  if (!record) return null;

  const {
    invoice_id,
    payment_id,
    transaction_id,
    status,
    score = 0,
    match_type,
    reasons = [],
    score_breakdown,
    invoice_amount,
    payment_amount,
    bank_amount,
    customer_name,
    reference,
  } = record;

  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'ai'
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Unified Chat Stream State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);

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

  const preparePayload = () => ({
    invoice_id,
    payment_id,
    transaction_id,
    status,
    score,
    match_type,
    reasons,
    score_breakdown,
    invoice_amount,
    payment_amount,
    bank_amount,
    customer_name,
    reference,
  });

  const handleRunAIAnalysis = async () => {
    setActiveTab('ai');
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const payload = preparePayload();
      const res = await analyzeRecordWithAI(payload);
      setAiAnalysis(res);
      // Reset chat stream with the opening forensic analysis report
      setChatMessages([
        {
          type: 'report',
          role: 'assistant',
          content: `Forensic Findings for ${invoice_id}: ${res.root_cause}`,
          data: res,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to complete AI investigation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isChatLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...chatMessages, { type: 'text', role: 'user', content: query, time }];
    setChatMessages(newHistory);
    setInputQuery('');
    setIsChatLoading(true);

    try {
      const payload = preparePayload();
      const res = await sendAIChatMessage(payload, newHistory, query);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [
        ...prev,
        { type: 'text', role: 'assistant', content: res.reply, time: replyTime },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { type: 'text', role: 'assistant', content: `⚠️ Error during inquiry: ${err.message}`, time },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
        borderRadius: '18px',
        position: 'relative',
        overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 0',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          position: 'relative',
        }}>
          {/* Close Button */}
          <button onClick={onClose} aria-label="Close modal" style={{
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
          }}>
            <X size={16} />
          </button>

          {/* Badges Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span className={`status-pill ${getStatusClass(status)}`}>
              {status.replace(/_/g, ' ')}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: '#f1f5f9',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              MATCH: {match_type}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: score >= 85 ? '#047857' : score >= 50 ? '#b45309' : '#e11d48',
              background: score >= 85 ? '#ecfdf5' : score >= 50 ? '#fffbeb' : '#fff1f2',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
            }}>
              SCORE: {score}/100
            </span>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            {invoice_id} — Tri-Party Reconciliation Audit
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, paddingBottom: '16px' }}>
            Customer: <strong style={{ color: '#0f172a' }}>{customer_name || 'N/A'}</strong> | Reference: <code style={{ color: '#0284c7', background: '#f0f9ff', padding: '1px 5px', borderRadius: '4px' }}>{reference || 'N/A'}</code>
          </p>

          {/* Navigation Tabs Bar */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e2e8f0',
          }}>
            {/* Tab 1: Audit & Streams */}
            <button
              onClick={() => setActiveTab('audit')}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'audit' ? 800 : 600,
                color: activeTab === 'audit' ? '#0066ff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <Activity size={16} />
              <span>Streams & Engine Audit</span>
              {activeTab === 'audit' && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: '#0066ff',
                  borderRadius: '3px 3px 0 0',
                }} />
              )}
            </button>

            {/* Tab 2: Investigate with AI */}
            <button
              onClick={() => {
                setActiveTab('ai');
                if (!aiAnalysis && !isAnalyzing) {
                  handleRunAIAnalysis();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'ai' ? 800 : 600,
                color: activeTab === 'ai' ? '#0066ff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <Sparkles size={16} style={{ color: activeTab === 'ai' ? '#0066ff' : '#8b5cf6' }} />
              <span>Investigate with AI</span>
              {aiAnalysis ? (
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  letterSpacing: '0.02em',
                }}>
                  {aiAnalysis.verdict}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: '#f3e8ff',
                  color: '#7e22ce',
                  padding: '2px 6px',
                  borderRadius: '8px',
                }}>
                  Gemini
                </span>
              )}
              {activeTab === 'ai' && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: '#0066ff',
                  borderRadius: '3px 3px 0 0',
                }} />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* TAB 1: STREAMS & ENGINE AUDIT */}
          {activeTab === 'audit' && (
            <div>
              {/* Tri-Party Streams Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}>
                {/* Stream 1: Invoice */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>STREAM 1</span>
                    <span style={{ fontSize: '0.68rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>Primary</span>
                  </div>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '2px 0 4px', color: '#0f172a' }}>Invoice</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                    {invoice_id}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    ₹{invoice_amount != null ? invoice_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A'}
                  </div>
                </div>

                {/* Stream 2: Payment */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: payment_id ? '#f0f9ff' : '#fff1f2',
                  border: `1px solid ${payment_id ? '#bae6fd' : '#fecdd3'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>STREAM 2</span>
                    <span style={{ fontSize: '0.68rem', background: payment_id ? '#e0f2fe' : '#ffe4e6', padding: '1px 6px', borderRadius: '4px', color: payment_id ? '#0369a1' : '#be123c' }}>
                      {payment_id ? 'Gateway' : 'Missing'}
                    </span>
                  </div>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '2px 0 4px', color: '#0f172a' }}>Payment</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: payment_id ? '#0284c7' : '#e11d48', fontWeight: 600 }}>
                    {payment_id || 'MISSING'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {payment_amount != null ? `₹${payment_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>

                {/* Stream 3: Bank Settlement */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: transaction_id ? '#ecfdf5' : '#fff1f2',
                  border: `1px solid ${transaction_id ? '#a7f3d0' : '#fecdd3'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>STREAM 3</span>
                    <span style={{ fontSize: '0.68rem', background: transaction_id ? '#d1fae5' : '#ffe4e6', padding: '1px 6px', borderRadius: '4px', color: transaction_id ? '#047857' : '#be123c' }}>
                      {transaction_id ? 'Settlement' : 'Missing'}
                    </span>
                  </div>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '2px 0 4px', color: '#0f172a' }}>Bank Settlement</h5>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: transaction_id ? '#047857' : '#e11d48', fontWeight: 600 }}>
                    {transaction_id || 'MISSING'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {bank_amount != null ? `₹${bank_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>
              </div>

              {/* 4-Signal Deterministic Scoring Breakdown */}
              {score_breakdown && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.02em', color: '#0f172a' }}>
                      4-SIGNAL DETERMINISTIC SCORING BREAKDOWN
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: score >= 85 ? '#047857' : score >= 50 ? '#b45309' : '#e11d48',
                    }}>
                      TOTAL: {score}/100
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reference Signal</span>
                        <span className="mono" style={{ color: '#0f172a', fontWeight: 700 }}>{score_breakdown.reference_score}/40 pts</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (score_breakdown.reference_score / 40) * 100)}%`, height: '100%', background: '#0284c7' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Amount Signal</span>
                        <span className="mono" style={{ color: '#0f172a', fontWeight: 700 }}>{score_breakdown.amount_score}/30 pts</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (score_breakdown.amount_score / 30) * 100)}%`, height: '100%', background: '#059669' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Entity Name Match</span>
                        <span className="mono" style={{ color: '#0f172a', fontWeight: 700 }}>{score_breakdown.customer_score}/20 pts</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (score_breakdown.customer_score / 20) * 100)}%`, height: '100%', background: '#d97706' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Date Proximity</span>
                        <span className="mono" style={{ color: '#0f172a', fontWeight: 700 }}>{score_breakdown.date_score}/10 pts</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (score_breakdown.date_score / 10) * 100)}%`, height: '100%', background: '#7c3aed' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Engine Audit Log */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    ENGINE AUDIT REASONING LOG
                  </h5>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Deterministic Rules Engine</span>
                </div>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  lineHeight: 1.5,
                  color: '#334155',
                }}>
                  {reasons.length > 0 ? (
                    reasons.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#0284c7' }}>›</span>
                        <span>{r}</span>
                      </div>
                    ))
                  ) : (
                    <div>No specific exception reasons logged.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATE WITH AI (Unified Continuous Conversation Window) */}
          {activeTab === 'ai' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '440px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}>
              
              {/* Chat Sub-Header */}
              <div style={{
                padding: '12px 20px',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                  }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                    Gemini Financial Forensic Copilot
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    Context: {invoice_id} ({customer_name || 'N/A'})
                  </span>
                  {aiAnalysis && (
                    <button
                      onClick={handleRunAIAnalysis}
                      title="Re-run investigation"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={11} /> Re-analyze
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Conversation Feed */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#fafafa',
              }}>
                
                {/* 1. Initial State: Start Investigation Banner */}
                {!aiAnalysis && !isAnalyzing && !analysisError && (
                  <div style={{
                    margin: 'auto 0',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                    borderRadius: '16px',
                    border: '1px dashed #86efac',
                  }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)',
                    }}>
                      <Sparkles size={26} />
                    </div>
                    <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                      Start Deep AI Forensic Investigation
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                      Gemini will inspect tri-party stream disparities, verify reference identifiers, identify root causes, and provide an auditor advisory directly in this window.
                    </p>
                    <button
                      onClick={handleRunAIAnalysis}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 22px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(5, 150, 105, 0.35)',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <Sparkles size={17} /> Start Investigation
                    </button>
                  </div>
                )}

                {/* 2. Loading State: High-End Futuristic Animated Spinner */}
                {isAnalyzing && (
                  <div style={{
                    margin: 'auto 0',
                    padding: '40px 20px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                    borderRadius: '18px',
                    border: '1px solid #86efac',
                    textAlign: 'center',
                    boxShadow: '0 12px 36px -8px rgba(16, 185, 129, 0.15)',
                  }}>
                    {/* Glowing Radar Multi-Ring Orbit */}
                    <div style={{
                      position: 'relative',
                      width: '88px',
                      height: '88px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {/* Outer Pulse Halo */}
                      <div style={{
                        position: 'absolute',
                        inset: '-8px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(2, 132, 199, 0.05) 60%, transparent 80%)',
                        animation: 'ai-pulse-glow 2.5s ease-in-out infinite',
                      }} />
                      
                      {/* Outer Ring Clockwise */}
                      <div style={{
                        position: 'absolute',
                        inset: '0',
                        borderRadius: '50%',
                        border: '3px solid transparent',
                        borderTopColor: '#10b981',
                        borderRightColor: '#0284c7',
                        animation: 'ai-ring-spin-cw 1.4s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite',
                      }} />

                      {/* Middle Ring Counter-Clockwise with Dashes */}
                      <div style={{
                        position: 'absolute',
                        inset: '10px',
                        borderRadius: '50%',
                        border: '2px dashed #38bdf8',
                        animation: 'ai-ring-spin-ccw 2.8s linear infinite',
                      }} />

                      {/* Inner Glowing Core */}
                      <div style={{
                        position: 'absolute',
                        inset: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                      }}>
                        <Sparkles size={22} style={{ color: '#ffffff' }} />
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Investigating with Gemini AI...
                    </h4>
                  </div>
                )}

                {/* 3. Error State */}
                {analysisError && !isAnalyzing && (
                  <div style={{
                    margin: 'auto 0',
                    padding: '22px 24px',
                    background: '#ffffff',
                    border: '1px solid #fecdd3',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(225, 29, 72, 0.08)',
                  }}>
                    {(analysisError.toLowerCase().includes('api key') ||
                      analysisError.toLowerCase().includes('gemini_api_key') ||
                      analysisError.toLowerCase().includes('not configured') ||
                      analysisError.toLowerCase().includes('unauthorized')) ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: '#fff1f2',
                            color: '#e11d48',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #fecdd3',
                            flexShrink: 0,
                          }}>
                            <KeyRound size={22} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>
                              Google Gemini API Key Configuration Required
                            </h4>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              AI Forensic Copilot features are currently offline
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55, margin: '0 0 14px' }}>
                          {analysisError}
                        </p>

                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          marginBottom: '16px',
                        }}>
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>
                            Setup Steps:
                          </div>
                          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                            <li>
                              Open or create the <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', color: '#0369a1', fontFamily: 'var(--font-mono)' }}>backend/.env</code> file.
                            </li>
                            <li>
                              Add your API key: <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', color: '#0369a1', fontFamily: 'var(--font-mono)' }}>GEMINI_API_KEY=your_key_here</code>
                            </li>
                            <li>
                              Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#0066ff', fontWeight: 600, textDecoration: 'underline' }}>Google AI Studio ↗</a>
                            </li>
                            <li>Save the file and click <strong>Retry Investigation</strong> below.</li>
                          </ol>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleRunAIAnalysis}
                            style={{
                              background: 'linear-gradient(135deg, #0066ff 0%, #0284c7 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '9px 18px',
                              borderRadius: '8px',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(0, 102, 255, 0.25)',
                            }}
                          >
                            <RefreshCw size={14} /> Retry Investigation
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AlertCircle size={20} style={{ color: '#e11d48', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.88rem' }}>AI Investigation Error</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{analysisError}</div>
                          </div>
                        </div>
                        <button
                          onClick={handleRunAIAnalysis}
                          style={{
                            background: '#e11d48',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <RefreshCw size={14} /> Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Unified Message Feed: Diagnosis Report Card + User/Gemini Chat Bubbles */}
                {chatMessages.map((msg, idx) => {
                  // If message is the opening Rich Forensic Report Card
                  if (msg.type === 'report') {
                    const report = msg.data;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                        }}>
                          <Bot size={18} />
                        </div>

                        <div style={{
                          flex: 1,
                          background: '#ffffff',
                          border: '1px solid #86efac',
                          borderRadius: '16px',
                          padding: '18px 20px',
                          boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
                        }}>
                          {/* Card Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ShieldCheck size={18} style={{ color: '#10b981' }} />
                              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#065f46' }}>
                                GEMINI FORENSIC DIAGNOSIS
                              </span>
                              <span style={{
                                fontSize: '0.72rem',
                                fontFamily: 'var(--font-mono)',
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                              }}>
                                {report.verdict}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700 }}>
                              Confidence: {Math.round(report.confidence * 100)}%
                            </span>
                          </div>

                          {/* Root Cause with rich formatting */}
                          <div style={{ marginBottom: '14px' }}>
                            <FormattedContent content={report.root_cause} />
                          </div>

                          {/* Forensic Findings */}
                          {report.actionable_items && report.actionable_items.length > 0 && (
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                Key Forensic Findings & Evidence:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {report.actionable_items.map((item, i) => (
                                  <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    fontSize: '0.82rem',
                                    color: '#334155',
                                    lineHeight: 1.45,
                                    background: '#f8fafc',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9',
                                  }}>
                                    <span style={{ color: '#10b981', fontWeight: 800, marginTop: '-1px' }}>•</span>
                                    <div style={{ flex: 1 }}>
                                      <FormattedContent content={item} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Auditor Advisory */}
                          {report.recommended_action && (
                            <div style={{
                              background: '#f0fdf4',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid #bbf7d0',
                              marginBottom: '6px',
                            }}>
                              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                                Auditor Advisory Recommendation:
                              </div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>
                                <FormattedContent content={report.recommended_action.label} />
                              </div>
                            </div>
                          )}

                          {msg.time && (
                            <div style={{ fontSize: '0.65rem', textAlign: 'right', color: '#94a3b8', marginTop: '6px' }}>
                              {msg.time}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Normal Text Messages (User & Assistant Replies)
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      gap: '8px',
                    }}>
                      {msg.role !== 'user' && (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                        }}>
                          <Bot size={15} />
                        </div>
                      )}

                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 16px',
                        borderRadius: msg.role === 'user' ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                        fontSize: '0.83rem',
                        lineHeight: 1.48,
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #0066ff 0%, #0284c7 100%)' : '#ffffff',
                        color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                        border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}>
                        <FormattedContent content={msg.content} isUser={msg.role === 'user'} />
                        {msg.time && (
                          <div style={{
                            fontSize: '0.65rem',
                            marginTop: '6px',
                            textAlign: 'right',
                            color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#94a3b8',
                          }}>
                            {msg.time}
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#334155',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={15} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Chat Typing Animation */}
                {isChatLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.78rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Bot size={15} />
                    </div>
                    <div style={{
                      background: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#0066ff',
                        animation: 'typing-dot-bounce 1.4s infinite ease-in-out',
                        animationDelay: '0s',
                      }} />
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#0066ff',
                        animation: 'typing-dot-bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.2s',
                      }} />
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#0066ff',
                        animation: 'typing-dot-bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.4s',
                      }} />
                      <span style={{ marginLeft: '6px', fontSize: '0.76rem', color: '#64748b' }}>Gemini is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bottom Chat Input Bar */}
              <div style={{
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  style={{
                    padding: '12px 18px 14px',
                    background: '#ffffff',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      placeholder={`Ask Gemini anything about ${invoice_id}...`}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      disabled={isChatLoading}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '24px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none',
                        background: '#f8fafc',
                        transition: 'all 0.2s',
                        color: '#0f172a',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#0066ff';
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 102, 255, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isChatLoading || !inputQuery.trim()}
                    title="Send Message"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: !inputQuery.trim() || isChatLoading ? '#e2e8f0' : 'linear-gradient(135deg, #0066ff 0%, #0284c7 100%)',
                      color: !inputQuery.trim() || isChatLoading ? '#94a3b8' : '#ffffff',
                      border: 'none',
                      cursor: !inputQuery.trim() || isChatLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: !inputQuery.trim() || isChatLoading ? 'none' : '0 3px 10px rgba(0, 102, 255, 0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
