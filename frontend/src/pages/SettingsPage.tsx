import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Shield, Key, CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { api } from '../api/client';
import { SettingsStatusResponse } from '../types';

interface SettingsPageProps {
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onSettingsUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ showToast, onSettingsUpdated }) => {
  const [status, setStatus] = useState<SettingsStatusResponse | null>(null);
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSettingsStatus();
      setStatus(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch settings status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGeminiKey(testKey || undefined, status?.active_model);
      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
      fetchStatus();
      onSettingsUpdated();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
      showToast(err.message || 'Connection test failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleModelChange = async (model: string) => {
    try {
      await api.updateModel(model);
      showToast(`Active model updated to ${model}.`, 'success');
      fetchStatus();
      onSettingsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update model.', 'error');
    }
  };

  const handleToggleMock = async (enabled: boolean) => {
    try {
      await api.toggleMockMode(enabled);
      showToast(enabled ? 'Mock AI mode activated.' : 'Gemini AI mode activated.', 'info');
      fetchStatus();
      onSettingsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle mock mode.', 'error');
    }
  };

  if (isLoading || !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading settings and health metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI & Model Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your Gemini API integration, test credentials, and configure local execution modes
          </p>
        </div>

        {/* Status Overview Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">AI Mode</span>
            <div className="flex items-center gap-2">
              <Cpu className={`w-5 h-5 ${status.use_mock_ai ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-sm font-bold text-white">
                {status.use_mock_ai ? 'Mock AI (Offline)' : 'Live Gemini'}
              </span>
            </div>
          </div>

          <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total AI Requests</span>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              <span className="text-sm font-bold text-white">{status.total_ai_requests}</span>
              <span className="text-[10px] text-slate-400">
                ({status.real_requests} live / {status.mock_requests} mock)
              </span>
            </div>
          </div>

          <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">API Credentials</span>
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${status.gemini_configured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-sm font-bold text-white">
                {status.gemini_configured ? 'Configured in backend/.env' : 'Using Local Fallback'}
              </span>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-3 pt-4 border-t border-studio-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Active Gemini Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {status.available_models.map((model) => (
              <button
                key={model}
                onClick={() => handleModelChange(model)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  status.active_model === model
                    ? 'bg-brand-950/60 border-brand-500 text-white shadow-md'
                    : 'bg-studio-950 border-studio-800 text-slate-400 hover:text-white hover:border-studio-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{model}</span>
                  {status.active_model === model && <CheckCircle className="w-4 h-4 text-brand-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {model.includes('flash') ? 'High speed, recommended for long books & outlines' : 'High reasoning, deep quality review'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Mock Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-studio-950 rounded-xl border border-studio-800">
          <div>
            <span className="text-sm font-bold text-white block">Mock AI Mode (Zero Quota Consumption)</span>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates high-quality simulated outlines, blueprints, and chapters offline. Perfect for testing.
            </p>
          </div>
          <button
            onClick={() => handleToggleMock(!status.use_mock_ai)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              status.use_mock_ai
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-studio-800 text-slate-300 hover:bg-studio-700'
            }`}
          >
            {status.use_mock_ai ? 'Mock Mode ON' : 'Mock Mode OFF'}
          </button>
        </div>

        {/* Connection Testing */}
        <div className="space-y-3 pt-4 border-t border-studio-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Test Gemini Connectivity
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Optionally paste a key to test, or leave blank to test backend/.env"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={handleTestKey}
              disabled={isTesting}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shrink-0 flex items-center justify-center gap-2"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-800 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block mb-0.5">{testResult.success ? 'Success' : 'Test Failed'}</span>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="p-4 bg-studio-950/80 rounded-xl border border-studio-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Shield className="w-4 h-4 text-brand-400" />
            <span>Security & API Key Isolation</span>
          </div>
          <p>
            Your `GEMINI_API_KEY` is loaded and executed strictly on the Python FastAPI backend. It is never transmitted to the browser, stored in client cookies, or exposed in frontend state.
          </p>
        </div>
      </div>
    </div>
  );
};

