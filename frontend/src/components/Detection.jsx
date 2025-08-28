import React, { useState } from 'react'
import logoFull from '../assets/logo-full.png'
import api from '../api/axios'
import { FiFileText, FiFlag } from 'react-icons/fi'

export const Detection = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [probs, setProbs] = useState(null);
  const [source, setSource] = useState(null);
  const [adjusted, setAdjusted] = useState(null);
  const [uncertain, setUncertain] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingDetect(true);
    setError(null);
    setSentiment(null);
    setResult(null);
    setProbs(null);
    setReport(null);
    setSource(null);
    setAdjusted(null);
    setUncertain(false);
    try {
      const { data } = await api.post('/detect', { text });
      setResult(data?.label || null);
      setProbs(data?.probabilities || null);
      setSource(data?.source || null);
      setAdjusted(data?.adjusted || null);
      setUncertain(Boolean(data?.uncertain));
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoadingDetect(false);
    }
  };

  const handleSentiment = async () => {
    setLoadingSentiment(true);
    setError(null);
    // Clear previous prediction-related state so only one result shows at a time
    setResult(null);
    setProbs(null);
    setReport(null);
    setSource(null);
    setAdjusted(null);
    setUncertain(false);
    setSentiment(null);
    try {
      const { data } = await api.post('/sentiment', { text });
      if (data?.error) throw { response: { data } };
      setSentiment({ label: data.sentiment, confidence: data.confidence, ppos: data.probability_positive });
    } catch (err) {
      setError(err.response?.data?.error || 'Sentiment analysis failed');
    } finally {
      setLoadingSentiment(false);
    }
  };

  const fetchReport = async () => {
    setLoadingReport(true);
    setError(null);
    try {
      const { data } = await api.post('/detect/report', { text });
      setReport(data);
      if (data?.source) setSource(data.source);
      if (data?.adjusted) setAdjusted(data.adjusted);
      if (typeof data?.uncertain === 'boolean') setUncertain(Boolean(data.uncertain));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch report');
    } finally {
      setLoadingReport(false);
    }
  }

  // Decide what to display in the main card
  const displayIsAdjusted = Boolean(source?.is_url && adjusted)
  const displayLabel = displayIsAdjusted ? adjusted?.label : result
  const displayProbs = displayIsAdjusted ? adjusted?.probabilities : probs

  return (
    <section className="w-full max-w-7xl flex justify-center items-center mb-10 px-4 sm:px-6 lg:px-8" >
      <div className="w-full flex flex-col lg:flex-row-reverse overflow-hidden gap-8">
        {/* Left: Hero content & form */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="flex items-center gap-4 mb-2">
            <img src={logoFull} alt="Truth Tribunal Logo" className="h-18 w-auto lg:hidden" />
            <h1 className="text-3xl sm:text-4xl text-red-800 tracking-tight">Fake News Detection</h1>
          </div>
          <p className="text-gray-700 text-lg mb-4 max-w-xl">Paste or type a news article below and our AI will instantly analyze it for authenticity. Empower yourself to spot misinformation!</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 min-h-[120px] text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition"
              placeholder="Paste or type a news article here..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow-md disabled:opacity-50"
                disabled={loadingDetect || !text.trim()}
              >
                {loadingDetect ? 'Detecting...' : 'Detect'}
              </button>
              <button
                type="button"
                onClick={handleSentiment}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition text-lg shadow-md disabled:opacity-50"
                disabled={loadingSentiment || !text.trim()}
              >
                {loadingSentiment ? 'Analyzing…' : 'Sentiment'}
              </button>
            </div>
          </form>
          {sentiment && (
            <div className={`px-4 py-2 rounded-sm text-lg shadow-sm border ${sentiment.label === 'Positive' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="mr-2">Sentiment :</span>
                  <span>{sentiment.label}</span>
                  <span className="ml-2 text-sm text-gray-600">(Confidence: {Number(sentiment.confidence).toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          )}
          {displayLabel && (
            <div className={`px-4 py-2 rounded-sm text-lg shadow-sm border ${displayLabel === 'Fake' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  {source?.is_url && (
                    <div className="text-xs text-gray-600 mb-1">
                      Source: <span className="font-semibold">{source.domain}</span>
                      {source.credibility && (
                        <span className="ml-2 text-gray-500">{source.credibility}</span>
                      )}
                    </div>
                  )}
                  <span className="mr-2">Prediction :</span>
                  <span>{displayLabel}</span>
                  {displayProbs && (
                    <span className="ml-2 text-sm text-gray-600">(Real: {displayProbs.Real?.toFixed?.(2)}, Fake: {displayProbs.Fake?.toFixed?.(2)})</span>
                  )}
                  {displayIsAdjusted && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 text-xs bg-yellow-100 text-black border border-yellow-200 rounded px-1.5 py-0.5"
                      title="Adjusted using source credibility"
                    >
                      <FiFlag /> adjusted
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchReport}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-red-700 border border-red-300 hover:bg-red-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loadingReport || !text.trim()}
                >
                  <FiFileText />
                  {loadingReport ? 'Generating Report...' : 'View Report'}
                </button>
              </div>
            </div>
          )}
          {report && (
            <div className="mt-3 p-3 border rounded-md bg-gray-50">
              {source?.is_url && report?.adjusted && (
                <div className="mb-3 rounded-md border bg-white p-2 text-xs text-gray-700">
                  <div className="font-semibold mb-1">Prediction vs Adjusted (URL)</div>
                  <div className="mb-3 rounded-md border bg-white p-2 text-xs text-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">URL blend</span> · domain: <span className="font-semibold">{source.domain}</span>
                      {source.credibility && (<span className="ml-1 text-gray-500">({source.credibility})</span>)}
                    </div>
                    
                  </div>
                  {report?.uncertain && (
                    <div className="mt-1 text-[11px] text-yellow-700">Low confidence: consider the token report and cross-check the source.</div>
                  )}
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded border p-2">
                      <div className="text-[11px] text-gray-500 mb-1">Raw model</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded px-1 py-0.5 text-white" style={{ backgroundColor: (report.label === 'Fake' ? '#dc2626' : '#16a34a') }}>{report.label}</span>
                        <span className="text-gray-700">Real: {report.probabilities?.Real?.toFixed?.(2)}, Fake: {report.probabilities?.Fake?.toFixed?.(2)}</span>
                      </div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-[11px] text-gray-500 mb-1">Adjusted (URL-aware)</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded px-1 py-0.5 text-white" style={{ backgroundColor: (report.adjusted.label === 'Fake' ? '#dc2626' : '#16a34a') }}>{report.adjusted.label}</span>
                        <span className="text-gray-700">Real: {report.adjusted.probabilities?.Real?.toFixed?.(2)}, Fake: {report.adjusted.probabilities?.Fake?.toFixed?.(2)}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] bg-yellow-100 text-black border border-yellow-200 rounded px-1 py-0.5" title="Adjusted using source credibility">adjusted</span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-600">weights: text {Math.round((report.adjusted.weights?.text ?? 0.7)*100)}% / source {Math.round((report.adjusted.weights?.source ?? 0.3)*100)}% · prior(fake): {(report.adjusted.prior_fake ?? 0.5).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-700 mb-2">
                Model tokens and importances
                <span className="ml-2 text-xs text-gray-500">
                  stronger color = higher influence; color indicates support vs oppose prediction
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <span style={{ backgroundColor: report.label === 'Fake' ? 'rgba(220,38,38,0.6)' : 'rgba(22,163,74,0.6)' }} className="inline-block w-3 h-3 rounded" />
                  supports {report.label}
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ backgroundColor: report.label === 'Fake' ? 'rgba(22,163,74,0.6)' : 'rgba(220,38,38,0.6)' }} className="inline-block w-3 h-3 rounded" />
                  opposes {report.label}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-sm">
                {(() => {
                  const tokens = report.tokens || [];
                  const signed = report.token_importances_signed || [];
                  const absVals = signed.map(v => Math.abs(v));
                  const pairs = absVals.map((v, i) => ({ i, v }));
                  const topN = new Set(pairs.sort((a, b) => b.v - a.v).slice(0, 10).map(p => p.i));
                  return tokens.map((tok, idx) => {
                    const s = Number.isFinite(signed[idx]) ? signed[idx] : 0;
                    // Exaggerate using gamma curve
                    const intensity = Math.min(1, Math.pow(Math.abs(s), 0.6));
                    const supportsPred = s >= 0;
                    const isPredFake = report.label === 'Fake';
                    const baseColor = supportsPred
                      ? (isPredFake ? [220, 38, 38] : [22, 163, 74])
                      : (isPredFake ? [22, 163, 74] : [220, 38, 38]);
                    const alpha = 0.2 + 0.8 * intensity;
                    const borderAlpha = 0.35 + 0.65 * intensity;
                    const bg = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
                    const border = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${borderAlpha})`;
                    const fontWeight = topN.has(idx) ? 700 : 400;
                    return (
                      <span
                        key={`${tok}-${idx}`}
                        style={{ backgroundColor: bg, borderColor: border, fontWeight }}
                        className="border px-1.5 py-0.5 rounded"
                      >
                        {tok}
                      </span>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          {error && (
            <div className="px-4 py-2 rounded-sm bg-yellow-100 text-yellow-800 font-semibold text-lg border border-yellow-200 shadow-sm">
              Error: {error}
            </div>
          )}
        </div>
        {/* Right: Illustration or logo */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-red-100 via-gray-100 to-gray-100 px-10">
          <img src={logoFull} alt="AI Detection Illustration" className="h-48 w-auto drop-shadow-xl" />
          <div className="mt-6 text-center text-gray-500 text-base max-w-xs">AI-powered, real-time news verification for everyone.</div>
        </div>
      </div>
    </section>
  )
}
