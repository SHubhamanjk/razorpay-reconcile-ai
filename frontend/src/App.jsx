import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProcessingLive from './components/ProcessingLive';
import MetricsGrid from './components/MetricsGrid';
import ResultsTable from './components/ResultsTable';
import RecordModal from './components/RecordModal';
import UploadReconcile from './components/UploadReconcile';
import UnderTheHood from './components/UnderTheHood';
import { runBenchmark, checkHealth } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('benchmark');
  const [isOnline, setIsOnline] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalRecords, setTotalRecords] = useState(500);
  const [benchmarkReport, setBenchmarkReport] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [resultsList, setResultsList] = useState([]);
  const [exceptionsList, setExceptionsList] = useState([]);

  // Auto-scroll refs
  const processingRef = useRef(null);
  const resultsRef = useRef(null);

  // Check health periodically
  useEffect(() => {
    const ping = async () => {
      const ok = await checkHealth();
      setIsOnline(ok);
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

  // Run benchmark with live telemetry steps
  const handleRunBenchmark = async (count = 500, seed = 42) => {
    setIsRunning(true);
    setCurrentStep(1);
    setBenchmarkReport(null);

    // Auto scroll to live processing telemetry immediately
    setTimeout(() => {
      processingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

    // Step progress simulation timer
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 180);

    try {
      const report = await runBenchmark(count, seed);
      clearInterval(stepTimer);
      setCurrentStep(6);
      
      setTimeout(() => {
        setBenchmarkReport(report);
        if (report.reconciliation_details) {
          setResultsList(report.reconciliation_details.results || []);
          setExceptionsList(report.reconciliation_details.exceptions || []);
        }
        setIsRunning(false);

        // Auto scroll to results metrics grid
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);

        // Confetti on 100% accuracy
        if (report.accuracy >= 0.99) {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.55 },
            colors: ['#0066ff', '#38bdf8', '#e5a93b', '#10b981', '#ffffff'],
          });
        }
      }, 350);

    } catch (err) {
      clearInterval(stepTimer);
      setIsRunning(false);
      alert(`Benchmark execution error: ${err.message}`);
    }
  };

  // Custom reconciliation complete
  const handleReconciliationComplete = (response) => {
    setResultsList(response.results || []);
    setExceptionsList(response.exceptions || []);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isOnline={isOnline} />

      <main className="app-container" style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'benchmark' && (
          <>
            <HeroSection
              onRunBenchmark={handleRunBenchmark}
              isRunning={isRunning}
              totalRecords={totalRecords}
              setTotalRecords={setTotalRecords}
              setActiveTab={setActiveTab}
              lastLatency={benchmarkReport?.processing_time_seconds}
            />

            <div ref={processingRef}>
              <ProcessingLive
                isRunning={isRunning}
                currentStep={currentStep}
                totalRecords={totalRecords}
              />
            </div>

            {benchmarkReport && (
              <div ref={resultsRef} style={{ marginTop: '20px' }}>
                <MetricsGrid report={benchmarkReport} />
                <ResultsTable
                  results={resultsList}
                  exceptions={exceptionsList}
                  groundTruth={benchmarkReport?.ground_truth}
                  rawDatasets={benchmarkReport?.raw_datasets}
                  onSelectRecord={(rec) => setSelectedRecord(rec)}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'upload' && (
          <UploadReconcile
            onReconciliationComplete={handleReconciliationComplete}
            setProcessingState={setIsRunning}
          />
        )}

        {activeTab === 'hood' && (
          <UnderTheHood />
        )}
      </main>

      {/* Record Inspector Drawer / Modal */}
      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}



    </div>
  );
}
