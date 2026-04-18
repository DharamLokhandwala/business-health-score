// Result Component

const fmt = (n: number) => {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K';
  return '$' + n.toLocaleString();
};

interface ResultProps {
  revenue: number;
  expenses: number;
  trend: 'up' | 'flat' | 'down' | null;
  inputType: 'estimates' | 'upload';
  onBack: () => void;
  onEdit?: () => void;
  onRequestUpload?: () => void;
  onSeeMetrics?: () => void;
}

export default function Result({ revenue, expenses, trend, inputType, onBack, onEdit, onRequestUpload, onSeeMetrics }: ResultProps) {
  const sde = revenue - expenses;
  let lo = 2.2;
  let hi = 3.0;

  if (trend === 'up') { lo = 2.6; hi = 3.4; }
  if (trend === 'down') { lo = 1.8; hi = 2.6; }

  const valLo = Math.max(0, sde * lo);
  const valHi = Math.max(0, sde * hi);

  const margin = sde / revenue;
  let score = 64;
  score += Math.min(18, Math.max(-10, Math.round((margin - 0.15) * 100)));

  if (trend === 'up') score += 6;
  if (trend === 'down') score -= 8;
  score = Math.max(48, Math.min(94, score));

  const C_R = 120;
  const C_Circumference = Math.PI * C_R;
  const dialProgress = score / 100;
  const dialOffset = C_Circumference * (1 - dialProgress);

  let dialColor = '#D94545';
  if (score >= 86) dialColor = '#2D6A4F';
  else if (score >= 66) dialColor = '#4A7C59';
  else if (score >= 41) dialColor = '#C9943A';

  let heading = <>Not sellable <em>yet.</em></>;
  if (score >= 80) heading = <>Sellable <em>now.</em></>;
  else if (score >= 70) heading = <>Sellable in <em>12&ndash;18&nbsp;months.</em></>;
  else if (score >= 60) heading = <>Sellable in <em>2&ndash;3&nbsp;years.</em></>;

  return (
    <div className="page">
      <header className="topbar">
        <a className="mark" href="#" onClick={(e) => { e.preventDefault(); onBack(); }} aria-label="Contrarian Thinking">
          <span className="monogram">CT</span>
          <span className="wordmark">Contrarian Thinking</span>
          <span className="slash">— Business Health Score</span>
        </a>
        <div className="topmeta">
          <a href="#" style={{ color: 'var(--ink-muted)', textDecoration: 'underline', textUnderlineOffset: '4px', marginRight: '16px', fontFamily: 'var(--sans)' }} onClick={(e) => { e.preventDefault(); onBack(); }}>← Go back</a>
          <span><span className="dot"></span>No. 03 / Result</span>
        </div>
      </header>

      <section className="intro">
        <div className="intro-eyebrow">Your Business Health Score</div>
        <h1 className="intro-title">Here's what your numbers <em>actually</em> say.</h1>
        <div className="intro-meta">
          <span>{inputType === 'estimates' ? 'Based on your estimates' : 'Based on verified data'}</span>
          <span className="mv" id="summary" style={{ margin: '0 8px' }}>HVAC &middot; {fmt(revenue)} Revenue</span>
          <span>Calculated just now</span>
          <a href="#" onClick={(e) => { e.preventDefault(); if(onEdit) { onEdit(); } else { onBack(); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', paddingLeft: '16px', textDecoration: 'none', color: '#C9943A', borderLeft: '1px solid rgba(245,237,216,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Edit</span>
          </a>
        </div>
      </section>

      <section className="result" id="result" style={{ display: 'block' }}>
        <div className="res-sec verdict-sec">
          <div className="verdict-main">
            <h2 className="verdict-head">{heading}</h2>
            <div className="verdict-sub">Business Health Score: <strong id="scoreLine">{score}/100</strong></div>
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
              <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', color: 'var(--ink)', lineHeight: '1' }}>{score}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '4px' }}>/ 100</div>
            </div>
          </div>
        </div>

        <div className="res-sec value-sec">
          <div className="res-label">Estimated Value</div>
          <div className="value-num">{fmt(valLo)} &ndash; {fmt(valHi)}</div>
          <div className="res-note">Based on your SDE and current HVAC market multiples.</div>
        </div>

        <div className="res-sec findings-sec">
          <div className="res-label">Two Things Keeping Your Score Down</div>
          <ul className="findings">
            <li className="finding">
              <span className="f-num">01</span>
              <span className="f-body"><strong>Owner dependency</strong> &mdash; your business needs you too much. Buyers will discount for this.</span>
            </li>
            <li className="finding">
              <span className="f-num">02</span>
              <span className="f-body"><strong>Thin margins</strong> &mdash; your current margins are below the HVAC average buyers expect.</span>
            </li>
          </ul>
        </div>

        <div className="res-sec cta-sec">
          <div style={{ marginBottom: '16px', fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: inputType === 'estimates' ? '#e2a348' : 'var(--ink-muted)', fontWeight: 600 }}>
            {inputType === 'estimates' ? 'ESTIMATED SCORE' : 'VERIFIED SCORE'}
          </div>
          {inputType === 'estimates' ? (
            <>
              <div className="res-cta-row">
                <button className="cta cta-solid" onClick={() => onRequestUpload ? onRequestUpload() : onBack()}>
                  <span>Upload your P&L to get precise score</span>
                  <span className="arrow">&rarr;</span>
                </button>
              </div>
              <p className="res-fine" style={{ marginTop: '12px', fontSize: '12px', letterSpacing: '0.04em' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); if (onSeeMetrics) onSeeMetrics(); }} style={{ color: 'var(--ink-muted)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                  See metrics breakdown <span className="arrow" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>&rarr;</span>
                </a>
              </p>
            </>
          ) : (
            <div className="res-cta-row">
              <button className="cta cta-solid" onClick={() => { if (onSeeMetrics) onSeeMetrics(); }}>
                <span>SEE ALL METRICS</span>
                <span className="arrow">&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="col"><span>© Contrarian Thinking</span><span>Main Street Capital</span></div>
        <div className="col"><span>Preliminary estimate <em>— not financial advice</em></span></div>
      </footer>
    </div>
  );
}
