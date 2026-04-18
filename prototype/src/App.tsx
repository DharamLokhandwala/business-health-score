import { useState, useRef, useEffect } from 'react';
import Result from './Result';
import Metrics from './Metrics';

export default function App() {
  const [showResult, setShowResult] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  // Intake stats
  const [pasteText, setPasteText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'upload' | 'paste' | 'estimates'>('estimates');
  const [modalPasteText, setModalPasteText] = useState('');
  const [strictUploadMode, setStrictUploadMode] = useState(false);

  // Estimate Form State
  const [estRev, setEstRev] = useState('');
  const [estComp, setEstComp] = useState('');
  const [estExp, setEstExp] = useState('');
  const [estTrend, setEstTrend] = useState<'up' | 'flat' | 'down' | null>(null);

  // UI Tweaks state
  const [tweakMark, setTweakMark] = useState<'monogram' | 'wordmark' | 'both'>('wordmark');
  const [tweakHeadline, setTweakHeadline] = useState<'worth' | 'sell' | 'score'>('worth');
  const [tweakLayout, setTweakLayout] = useState<'sideBySide' | 'stacked'>('sideBySide');
  const [tweakBg, setTweakBg] = useState('#7A1515');
  const [showTweaks, setShowTweaks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Example result boolean for "Business Health Score.html"
  const [sampleScore, setSampleScore] = useState<number | null>(74);

  // Computed Values
  const linesCount = pasteText.trim() ? pasteText.trim().split(/\n/).filter(Boolean).length : 0;
  const numMatches = (pasteText.match(/\$?\d[\d,]{2,}/g) || []).length;
  const hasInput = pasteText.trim().length > 4 || file !== null;

  // Sync background
  useEffect(() => {
    document.documentElement.style.setProperty('--bg', tweakBg);
  }, [tweakBg]);

  // Edit mode hook connection
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setShowTweaks(true);
      else if (d.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) { }
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleCalculateSample = () => {
    if (!hasInput) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const v = pasteText + (file ? file.name : '');
      let h = 0; for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0;
      const s = 62 + (h % 31);
      setSampleScore(s);
    }, 760);
  };

  const handleTemplateClick = (e: any) => {
    e.preventDefault();
    setPasteText(`Revenue: 1,820,000\nCOGS: 742,000\nPayroll (inc. owner 180k): 540,000\nSG&A: 210,000\nFleet / fuel: 72,000\nNet income: 256,000\nOwner add-backs: 62,000\n# Trucks: 9\n# Techs: 11\nYears in business: 14`);
  };

  const parseMoney = (s: string) => {
    if (!s) return null;
    const n = Number(String(s).replace(/[^0-9.]/g, ''));
    return isFinite(n) && n > 0 ? n : null;
  };

  // Switch exactly to the Result Component view
  const onGetReport = () => {
    // If we have actual estimates, show them, else use sample defaults
    setShowResult(true);
    setShowMetrics(false);
    setShowModal(false);
    setStrictUploadMode(false);
  };

  const renderModal = () => {
    if (!showModal) return null;
    return (
      <>
        <div className="modal-scrim" onClick={() => { setShowModal(false); setStrictUploadMode(false); }} style={{ display: 'flex' }}></div>
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => { setShowModal(false); setStrictUploadMode(false); }}>✕</button>
            <div className="modal-eyebrow">Step 01 / Intake</div>
            <h3 className="modal-title">How do you want to <em>start?</em></h3>

            <div className="tab-row" style={strictUploadMode ? { gridTemplateColumns: '1fr 1fr' } : undefined}>
              <button className={`tab ${modalTab === 'upload' ? 'on' : ''}`} onClick={() => setModalTab('upload')}>Upload P&amp;L</button>
              <button className={`tab ${modalTab === 'paste' ? 'on' : ''}`} onClick={() => setModalTab('paste')}>Paste numbers</button>
              {!strictUploadMode && (
                <button className={`tab recommended ${modalTab === 'estimates' ? 'on' : ''}`} onClick={() => setModalTab('estimates')}>
                  <span className="tab-reco">Fastest &middot; 60 sec</span>
                  <span className="tab-label">Quick estimates</span>
                </button>
              )}
            </div>

            {modalTab === 'upload' && (
              <div className="drop modal-drop">
                <div className="big">Drop your P&amp;L, <u>or&nbsp;browse</u>.</div>
                <div className="sub">CSV &middot; PDF &middot; XLSX &middot; XLS</div>
              </div>
            )}

            {modalTab === 'paste' && (
              <textarea className="paste modal-paste" spellCheck="false" placeholder="Revenue, expenses, what you pay yourself — rough numbers work."
                value={modalPasteText} onChange={e => setModalPasteText(e.target.value)}></textarea>
            )}

            {modalTab === 'estimates' && (
              <form className="sentence" onSubmit={e => e.preventDefault()}>
                <p className="sent">
                  My business makes
                  <span className="blank"><input type="text" inputMode="numeric" placeholder="$1,800,000" value={estRev} onChange={e => setEstRev(e.target.value)} /></span>
                  in revenue per year.
                </p>
                <p className="sent">
                  I pay myself about
                  <span className="blank"><input type="text" inputMode="numeric" placeholder="$120,000" value={estComp} onChange={e => setEstComp(e.target.value)} /></span>
                  per year.
                </p>
                <p className="sent">
                  My expenses (not counting my salary) run about
                  <span className="blank wide"><input type="text" inputMode="numeric" placeholder="$1,100,000" value={estExp} onChange={e => setEstExp(e.target.value)} /></span>
                  per year.
                </p>
                <p className="sent trend">
                  Over the last year, my revenue has been:
                  <span className="trend-pills">
                    <button type="button" className={`tp ${estTrend === 'up' ? 'on' : ''}`} onClick={() => setEstTrend('up')}>Growing <span className="a">↑</span></button>
                    <button type="button" className={`tp ${estTrend === 'flat' ? 'on' : ''}`} onClick={() => setEstTrend('flat')}>Flat <span className="a">→</span></button>
                    <button type="button" className={`tp ${estTrend === 'down' ? 'on' : ''}`} onClick={() => setEstTrend('down')}>Declining <span className="a">↓</span></button>
                  </span>
                </p>
              </form>
            )}

            <div className="modal-foot">
              <button className="cta modal-cta" onClick={onGetReport}>
                <span>Calculate My Score</span>
                <span className="arrow">→</span>
              </button>
              <p className="modal-fine">Rough numbers are fine. You can add your real P&amp;L later.</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (showMetrics) {
    return (
      <Metrics
        revenue={parseMoney(estRev) || 1800000}
        expenses={parseMoney(estExp) || 1100000}
        salary={parseMoney(estComp) || 120000}
        trend={estTrend}
        inputType={modalTab === 'estimates' ? 'estimates' : 'upload'}
        onBack={() => setShowMetrics(false)}
        onRequestUpload={() => {
          setStrictUploadMode(true);
          setModalTab('upload');
          setShowMetrics(false);
          setShowResult(false);
          setShowModal(true);
        }}
      />
    );
  }

  if (showResult) {
    return (
      <>
        <Result
          revenue={parseMoney(estRev) || 1800000}
          expenses={parseMoney(estExp) || 1100000}
          trend={estTrend}
          inputType={modalTab === 'estimates' ? 'estimates' : 'upload'}
          onBack={() => setShowResult(false)}
          onEdit={() => setShowModal(true)}
          onRequestUpload={() => {
            setStrictUploadMode(true);
            setModalTab('upload');
            setShowModal(true);
          }}
          onSeeMetrics={() => setShowMetrics(true)}
        />
        {renderModal()}
      </>
    );
  }

  return (
    <div className={`page ${tweakLayout === 'stacked' ? 'stacked' : ''} ${sampleScore ? 'result-on modal-on' : ''}`}>
      <header className="topbar">
        <a className="mark" href="#" aria-label="Contrarian Thinking">
          {tweakMark !== 'wordmark' && <span className="monogram" id="mkMonogram">CT</span>}
          {tweakMark !== 'monogram' && <span className="wordmark" id="mkWord">Contrarian Thinking</span>}
          <span className="slash">— Business Health Score</span>
        </a>
        <div className="topmeta">
          <span><span className="dot"></span>No. 01 / Diagnostic</span>
          <span className="est" style={{ display: 'inline' }}>EST. 2020</span>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">Business Health Score</div>
        <h1 className="headline" id="headline">
          {tweakHeadline === 'worth' && <>Find out your business <em>health</em>.</>}
          {/* {tweakHeadline === 'sell' && <>Is your business <em>ready to sell?</em></>}
          {tweakHeadline === 'score' && <>A two-minute <em>score</em> on the business you built.</>} */}
        </h1>
        {/* <div className="subhead">
          Takes 2 minutes.<span className="sep">·</span>No accountant required.<span className="sep">·</span>No sign-up.
        </div> */}
      </section>

      {!sampleScore ? (
        <>
          <section className="panels" id="panels" style={{ gridTemplateColumns: tweakLayout === 'stacked' ? '1fr' : undefined }}>
            <div className="panel">
              <div className="panel-head">
                <div className="label"><span className="num">01</span>Paste Your Numbers</div>
                <div className="pill-tag">Rough is fine</div>
              </div>
              <textarea className="paste" spellCheck="false"
                placeholder={"Revenue, expenses, what you pay yourself — rough numbers work.\n\ne.g.\nRevenue: 1,800,000\nCOGS: 720,000\nOwner comp: 180,000\nSG&A: 560,000\nNet: 340,000"}
                value={pasteText} onChange={e => setPasteText(e.target.value)}></textarea>
              <div className="paste-foot">
                <span id="pasteStatus">
                  {numMatches >= 2 ? <span className="ok">{numMatches} figures detected</span> : (pasteText.trim() ? 'Reading…' : 'Awaiting input')}
                </span>
                <span id="pasteCount">{linesCount} {linesCount === 1 ? 'line' : 'lines'}</span>
              </div>
            </div>

            {tweakLayout !== 'stacked' && <div className="or-div"></div>}

            <div className="panel">
              <div className="panel-head">
                <div className="label"><span className="num">02</span>Upload a File</div>
                <div className="pill-tag">Or drag &amp; drop</div>
              </div>
              <label className={`drop ${file ? 'has-file' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}>

                <div className="big">Drop a file, <u>or&nbsp;browse</u>.</div>
                <div className="sub">CSV · PDF · XLSX · XLS</div>

                <div className="filechip" style={{ display: file ? 'inline-flex' : 'none' }}>
                  <span id="fileName">{file?.name || 'statement.csv'}</span>
                  <span className="x" onClick={(e) => { e.preventDefault(); setFile(null); }} title="Remove">✕</span>
                </div>

                <input type="file" accept=".csv,.pdf,.xlsx,.xls" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  ref={fileInputRef} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
              </label>
            </div>
          </section>

          <div className="template-link">
            Don't have your numbers handy? <a href="#" onClick={handleTemplateClick}>Use our HVAC industry template<span className="arrow">→</span></a>
          </div>

          <div className="cta-wrap">
            <button className="cta" disabled={!hasInput || isLoading} onClick={handleCalculateSample}>
              <span>Calculate My Score</span>
              <span className="arrow">→</span>
            </button>
            <div className="assurance">
              <span className="lock"></span>
              Your data is never stored or shared
            </div>
          </div>
        </>
      ) : (() => {
        const C_R = 120;
        const C_Circumference = Math.PI * C_R;
        const dialProgress = (sampleScore || 74) / 100;
        const dialOffset = C_Circumference * (1 - dialProgress);

        let dialColor = '#D94545';
        const sc = sampleScore || 74;
        if (sc >= 86) dialColor = '#2D6A4F';
        else if (sc >= 66) dialColor = '#4A7C59';
        else if (sc >= 41) dialColor = '#C9943A';

        return (
        <section className="result is-sample" style={{ display: 'block' }}>
          <div className="sample-banner" aria-hidden="true">
            <span className="sb-dot"></span>
            <span>Example result &mdash; this could be your score</span>
          </div>
          <div className="sample-watermark" aria-hidden="true">SAMPLE</div>
          <div className="result-top">
            <div className="tag">What Your Score Tells You</div>
            <div className="asof">Sample &middot; Your results will appear here</div>
            <div className="res-sec verdict-sec">
              <div className="verdict-main">
                <h2 className="verdict-head">Sellable in <em>12&ndash;18 months.</em></h2>
                <div className="verdict-sub">Business Health Score: <strong id="scoreLine">{sampleScore}/100</strong></div>
              </div>
              <div style={{ position: 'relative', width: '200px', height: '100px', flexShrink: 0, overflow: 'hidden' }}>
                <svg viewBox="0 0 280 140" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="15" y1="130" x2="25" y2="130" stroke="rgba(245,237,216,0.2)" strokeWidth="1" />
                  <line x1="140" y1="10" x2="140" y2="20" stroke="rgba(245,237,216,0.2)" strokeWidth="1" />
                  <line x1="265" y1="130" x2="255" y2="130" stroke="rgba(245,237,216,0.2)" strokeWidth="1" />

                  <path d="M 20 130 A 120 120 0 0 1 260 130" fill="none" stroke="rgba(245,237,216,0.15)" strokeWidth="12" />
                  <path 
                    d="M 20 130 A 120 120 0 0 1 260 130" 
                    fill="none" stroke={dialColor} strokeWidth="12" 
                    strokeDasharray={C_Circumference} strokeDashoffset={dialOffset} 
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} 
                  />
                  
                  <line 
                    x1="140" y1="130" x2="140" y2="20" stroke="var(--ink)" strokeWidth="2" 
                    style={{ transformOrigin: '140px 130px', transform: `rotate(${dialProgress * 180 - 90}deg)`, transition: 'transform 0.8s ease-out' }} 
                  />
                  <circle cx="140" cy="130" r="4" fill="var(--ink)" />
                </svg>
                <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', color: 'var(--ink)', lineHeight: '1' }}>{sampleScore}</div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '4px' }}>/ 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className="verdict-block">
            <p className="verdict-body">See what's holding your score back &mdash; and what to fix first.</p>
          </div>
          <div className="result-cta">
            <button className="primary" onClick={() => setShowModal(true)}>Get Your Score Now</button>
            {/* <a href="#" style={{ marginLeft: 12, color: 'var(--ink-muted)', fontSize: 12 }} onClick={(e) => { e.preventDefault(); setSampleScore(null); }}>← Go back</a> */}
          </div>
        </section>
        );
      })()}

      <footer className="footer">
        <div className="col"><span>© Contrarian Thinking</span><span>Main Street Capital</span></div>
        <div className="col"><span>Independent · Not advice<em>— yet</em></span></div>
      </footer>

      {isLoading && <div className="loading"><div className="b" style={{ width: '100%', transition: 'width 760ms linear' }}></div></div>}

      {renderModal()}

      {showTweaks && (
        <div id="tweaks" className="on">
          <h4><span>Tweaks</span><span className="k">v1</span></h4>
          <div className="row">
            <label>Mark</label>
            <div className="seg">
              <button className={tweakMark === 'monogram' ? 'on' : ''} onClick={() => setTweakMark('monogram')}>Monogram</button>
              <button className={tweakMark === 'wordmark' ? 'on' : ''} onClick={() => setTweakMark('wordmark')}>Wordmark</button>
              <button className={tweakMark === 'both' ? 'on' : ''} onClick={() => setTweakMark('both')}>Both</button>
            </div>
          </div>
          <div className="row">
            <label>Headline</label>
            <div className="seg">
              <button className={tweakHeadline === 'worth' ? 'on' : ''} onClick={() => setTweakHeadline('worth')}>Worth</button>
              <button className={tweakHeadline === 'sell' ? 'on' : ''} onClick={() => setTweakHeadline('sell')}>Sell-ready</button>
              <button className={tweakHeadline === 'score' ? 'on' : ''} onClick={() => setTweakHeadline('score')}>Score</button>
            </div>
          </div>
          <div className="row">
            <label>Layout</label>
            <div className="seg">
              <button className={tweakLayout === 'sideBySide' ? 'on' : ''} onClick={() => setTweakLayout('sideBySide')}>Side-by-side</button>
              <button className={tweakLayout === 'stacked' ? 'on' : ''} onClick={() => setTweakLayout('stacked')}>Stacked</button>
            </div>
          </div>
          <div className="row">
            <label>Background</label>
            <div className="sw">
              {['#7A1515', '#611111', '#8A1C1C', '#1A1A1A'].map(color => (
                <button key={color} className={tweakBg === color ? 'on' : ''} style={{ '--c': color } as any} onClick={() => setTweakBg(color)}></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
