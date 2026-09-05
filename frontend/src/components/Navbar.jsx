import React from 'react';
import { Cpu, Layers, UploadCloud, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'benchmark', label: 'Reconciliation Engine', icon: Cpu },
    { id: 'upload', label: 'Custom CSV Reconcile', icon: UploadCloud },
    { id: 'hood', label: 'Under The Hood', icon: Layers },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="app-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px',
      }}>
        {/* Brand Logo & Track Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
            onClick={() => setActiveTab('benchmark')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 19.5h20L12 2z" fill="#0066FF" />
              <path d="M12 7.5L5.5 19.5h13L12 7.5z" fill="#38BDF8" />
            </svg>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.22rem', letterSpacing: '-0.03em', color: '#0f172a' }}>
                Razorpay
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
                /buildathon
              </span>
            </div>
          </div>

          <div className="track-pill" style={{ marginLeft: '4px', padding: '4px 12px', fontSize: '0.74rem' }}>
            <Sparkles size={12} />
            <span>TRACK 04 : AI FINANCE CONTROLLER</span>
          </div>
        </div>

        {/* Navigation Button Group */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  border: `1px solid ${isActive ? '#0f172a' : '#cbd5e1'}`,
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 10px rgba(15, 23, 42, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
              >
                <Icon size={15} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
