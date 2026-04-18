import { useState, useEffect } from 'react';

interface MetricsProps {
  revenue: number;
  expenses: number;
  salary?: number;
  trend: 'up' | 'flat' | 'down' | null;
  inputType: 'estimates' | 'upload';
  onBack: () => void;
  onRequestUpload: () => void;
}

export default function Metrics({ revenue, expenses, salary, trend, inputType, onBack, onRequestUpload }: MetricsProps) {
  // Base configuration
  const safeTrend = trend || 'flat';
  const isEst = inputType === 'estimates';
  const safeSalaryBase = salary || 120000;

  // --- BASE MATH ENGINE --- //
  const sdeBase = Math.max(0, revenue - expenses);
  const marginBase = revenue > 0 ? (sdeBase / revenue) * 100 : 0;
  const safeInitialMargin = Number(marginBase.toFixed(1));

  // Determine Base Score to tightly match Result.tsx
  const marginBaseVal = revenue > 0 ? (sdeBase / revenue) : 0;
  let computedBaseScore = 64;
  computedBaseScore += Math.min(18, Math.max(-10, Math.round((marginBaseVal - 0.15) * 100)));
  if (safeTrend === 'up') computedBaseScore += 6;
  if (safeTrend === 'down') computedBaseScore -= 8;
  const baseScore = Math.max(48, Math.min(94, computedBaseScore));

  // State for UI & Sliders
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [trendSlider, setTrendSlider] = useState(0); // 0 to 25
  const [salarySlider, setSalarySlider] = useState(safeSalaryBase); // 80k to 200k
  const [marginSlider, setMarginSlider] = useState(safeInitialMargin);
  const [depSlider, setDepSlider] = useState(0); // 0, 1, 2

  // Ensures marginSlider never falls below initial margin if user restarts
  useEffect(() => {
    setMarginSlider(Math.max(safeInitialMargin, marginSlider));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeInitialMargin]);

  // --- DYNAMIC STATUSES --- //
  const trendStatus = safeTrend === 'up' ? 'STRONG' : (safeTrend === 'flat' ? 'AVERAGE' : 'NEEDS IMPROVEMENT');
  const trendColor = safeTrend === 'up' ? 'green' : (safeTrend === 'flat' ? 'amber' : 'red');
  
  let trendText = '+0% YOY';
  let trendImpl = "Flat revenue won't hurt you today \u2014 but buyers will want to see a growth story before you sell.";
  if (safeTrend === 'up') {
    trendText = '+12% YOY';
    trendImpl = "Your business is getting more valuable every year.";
  } else if (safeTrend === 'down') {
    trendText = '-8% YOY';
    trendImpl = "Declining revenue is the fastest way to lose valuation. This needs to change before you sell.";
  }

  const sdeStatus = sdeBase >= 500000 ? 'STRONG' : (sdeBase >= 200000 ? 'AVERAGE' : 'NEEDS IMPROVEMENT');
  const sdeColor = sdeBase >= 500000 ? 'green' : (sdeBase >= 200000 ? 'amber' : 'red');

  const isMarginHealthy = safeInitialMargin >= 25;
  const isMarginAverage = safeInitialMargin >= 20 && safeInitialMargin < 25;
  const marginStatusWord = isMarginHealthy ? 'STRONG' : (isMarginAverage ? 'AVERAGE' : 'NEEDS IMPROVEMENT');
  const marginColor = isMarginHealthy ? 'green' : (isMarginAverage ? 'amber' : 'red');

  // --- WHAT-IF ENGINE --- //
  
  // Margin impacts
  const marginCap = Math.max(35, safeInitialMargin);
  const marginRange = marginCap - safeInitialMargin;
  const marginProgress = marginRange > 0 ? (marginSlider - safeInitialMargin) / marginRange : 0;
  const maxEarningsAddedMargin = Math.max(0, (revenue * (marginCap / 100)) - sdeBase);
  const earningsAddedMargin = marginRange > 0 && expandedCards.includes('card3') ? marginProgress * maxEarningsAddedMargin : 0; 
  
  // Salary impacts
  const earningsAddedSalary = expandedCards.includes('card2') ? (safeSalaryBase - salarySlider) : 0;

  // Active SDE
  const sdeCurrent = sdeBase + earningsAddedMargin + earningsAddedSalary;
  
  // Active Multiples
  const effectiveDepSlider = (isEst || !expandedCards.includes('card4')) ? 0 : depSlider;
  const depBonus = (effectiveDepSlider / 2) * 1.5;

  const effectiveTrendSlider = expandedCards.includes('card1') ? trendSlider : 0;
  const trendBonus = (effectiveTrendSlider / 25) * 1.0;
  
  let mulLowBase = 2.2;
  let mulHighBase = 3.0;
  if (safeTrend === 'up') { mulLowBase = 2.6; mulHighBase = 3.4; }
  if (safeTrend === 'down') { mulLowBase = 1.8; mulHighBase = 2.6; }
  
  const mulLow = mulLowBase + depBonus + trendBonus;
  const mulHigh = mulHighBase + depBonus + trendBonus;

  // Projection math
  const initialExitLow = (sdeBase * mulLowBase) / 1000000;
  const initialExitHigh = (sdeBase * mulHighBase) / 1000000;
  const exitLow = (sdeCurrent * mulLow) / 1000000;
  const exitHigh = (sdeCurrent * mulHigh) / 1000000;
  
  // Display formatters
  const sdeDisplayStr = sdeCurrent !== sdeBase ? `$${Math.round(sdeCurrent).toLocaleString()} / yr` : `$${Math.round(sdeBase).toLocaleString()} / yr`;
  const marginPctDesc = marginRange > 0 ? marginProgress * 100 : 100;
  const depPctDesc = (effectiveDepSlider / 2) * 100;
  
  // Movement bounds
  const isTrendMoved = expandedCards.includes('card1') && trendSlider > 0;
  const isSalaryMoved = expandedCards.includes('card2') && salarySlider !== safeSalaryBase;
  const isMarginMoved = expandedCards.includes('card3') && marginProgress > 0.01;
  const isDepMoved = expandedCards.includes('card4') && effectiveDepSlider > 0;

  // SCORE METER LOGIC
  const marginPointBonus = marginRange > 0 ? marginProgress * 8 : 0;
  const growthPointBonus = (effectiveTrendSlider / 25) * 5;
  const salaryRangeToOptimal = Math.max(10000, safeSalaryBase - 80000);
  const rawSalaryBonus = ((safeSalaryBase - salarySlider) / salaryRangeToOptimal) * 3;
  const salaryPointBonus = Math.max(-10, Math.min(3, rawSalaryBonus)); // Capped properly so small optimal bases don't yield 10k points
  
  const activeMarginPts = expandedCards.includes('card3') ? marginPointBonus : 0;
  const activeGrowthPts = expandedCards.includes('card1') ? growthPointBonus : 0;
  const activeSalaryPts = expandedCards.includes('card2') ? salaryPointBonus : 0;

  let activeScore = Math.round(baseScore + activeMarginPts + activeGrowthPts + activeSalaryPts);
  if (activeScore > 100) activeScore = 100;
  if (activeScore < 0) activeScore = 0;
  
  const scoreDelta = activeScore - baseScore;
  const isScoreMoved = scoreDelta !== 0;

  // Score Dial Rendering Setup
  const C_R = 120;
  const C_Circumference = Math.PI * C_R;
  const dialProgress = activeScore / 100;
  const dialOffset = C_Circumference * (1 - dialProgress);
  
  let dialColor = '#D94545'; // red
  if (activeScore >= 86) dialColor = '#2D6A4F'; // strong green
  else if (activeScore >= 66) dialColor = '#4A7C59'; // muted green
  else if (activeScore >= 41) dialColor = '#C9943A'; // amber
  
  let verdictStr = '';
  if (activeScore <= 40) verdictStr = "Not ready to sell";
  else if (activeScore <= 55) verdictStr = "Needs significant work before selling";
  else if (activeScore <= 70) verdictStr = "Sellable with preparation";
  else if (activeScore <= 85) verdictStr = "Sellable in 12\u201318 months";
  else verdictStr = "Ready to sell now \u2014 strong position";

  const getHeaderLbl = (color: string) => color === 'green' ? "PUSH THIS FURTHER" : (color === 'amber' ? "WHAT IF YOU IMPROVED THIS?" : "WHAT IF YOU FIXED THIS?");
  
  const renderTrigger = (cardId: string, colorClass: string, isLocked: boolean = false) => {
    if (isLocked) return null;
    
    let btnLabel = '';
    if (colorClass === 'green') btnLabel = "PUSH THIS FURTHER";
    else if (colorClass === 'amber') btnLabel = "IMPROVE THIS";
    else btnLabel = "WHAT IF YOU FIXED THIS?";
    
    const isOpen = expandedCards.includes(cardId);
    return (
      <button className="trigger-btn" onClick={() => setExpandedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId])}>
        {isOpen ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        )}
        <span>{isOpen ? 'COLLAPSE' : btnLabel}</span>
      </button>
    );
  };

  return (
    <div className="page">
      <header className="topbar" style={{ paddingBottom: '24px', borderBottom: 'none' }}>
        <a href="#" className="go-back" onClick={(e) => { e.preventDefault(); onBack(); }}>
          &larr; YOUR SCORE
        </a>
      </header>

      <section className="hero" style={{ paddingTop: '0', paddingBottom: '36px', textAlign: 'center' }}>
        <h1 className="headline" style={{ fontSize: 'clamp(48px, 5.5vw, 76px)', textTransform: 'uppercase' }}>
          WHAT'S BEHIND YOUR SCORE
        </h1>
      </section>

      {/* Persistent Score Header & Info Card */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
          
          <div style={{ position: 'relative', width: '280px', height: '140px', overflow: 'hidden' }}>
            <svg viewBox="0 0 280 140" width="280" height="140" style={{ position: 'absolute', top: 0, left: 0 }}>
              
              {/* Subtle ticks at 0, 50, 100 */}
              <line x1="15" y1="130" x2="25" y2="130" stroke="rgba(245,237,216,0.3)" strokeWidth="1" />
              <line x1="140" y1="10" x2="140" y2="20" stroke="rgba(245,237,216,0.3)" strokeWidth="1" />
              <line x1="265" y1="130" x2="255" y2="130" stroke="rgba(245,237,216,0.3)" strokeWidth="1" />

              {/* Background Arc */}
              <path 
                d="M 20 130 A 120 120 0 0 1 260 130" 
                fill="none" 
                stroke="rgba(245,237,216,0.2)" 
                strokeWidth="12" 
              />
              
              {/* Colored Fill Arc */}
              <path 
                d="M 20 130 A 120 120 0 0 1 260 130" 
                fill="none" 
                stroke={dialColor}
                strokeWidth="12" 
                strokeDasharray={C_Circumference}
                strokeDashoffset={dialOffset}
                style={{ transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.4s ease-out' }}
              />
              
              {/* Needle Line */}
              <line 
                x1="140" y1="130" x2="140" y2="20" 
                stroke="var(--ink)" 
                strokeWidth="2" 
                style={{ 
                  transformOrigin: '140px 130px', 
                  transform: `rotate(${dialProgress * 180 - 90}deg)`, 
                  transition: 'transform 0.4s ease-out' 
                }} 
              />
              
              {/* Needle Center Pin */}
              <circle cx="140" cy="130" r="4" fill="var(--ink)" />
            </svg>
            
            {/* Overlay Score Text inside Arc */}
            <div style={{ position: 'absolute', bottom: '16px', width: '100%', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '56px', color: 'var(--ink)', lineHeight: '1' }}>
                {activeScore}
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '8px' }}>
                CURRENT SCORE
              </div>
            </div>
          </div>
          
          {/* Below Arc Meta */}
          <div style={{ position: 'relative', width: '280px', marginTop: '24px', borderTop: '1px solid rgba(245,237,216,0.1)', paddingTop: '20px', paddingBottom: '8px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '19px', color: 'var(--ink-muted)', fontStyle: 'italic', textAlign: 'center', lineHeight: '1.2' }}>
              {verdictStr}
            </div>
            <div style={{ position: 'absolute', right: '0', top: '24px', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 500, color: '#C9943A', opacity: isScoreMoved ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
              {scoreDelta > 0 ? `\u2191 +${scoreDelta} pts` : `\u2193 ${scoreDelta} pts`}
            </div>
          </div>
        </div>

        <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9943A', marginBottom: '16px' }}>
            INTERACTIVE SCENARIO BUILDER
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '32px', color: 'var(--ink)', lineHeight: '1.1', marginBottom: '16px' }}>
            Play around to see how you can increase your score.
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--ink-muted)', lineHeight: '1.6' }}>
            The four metrics below directly impact your total exit valuation. Open the panels, adjust the sliders, and watch how fixing specific gaps in your business instantly improves your health score and boosts your final payout.
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {/* CARD 1: REVENUE TREND */}
        <div className={`metric-card border-${trendColor}`}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div className={`mc-status-word ${trendColor}`} style={{ margin: 0 }}>{trendStatus}</div>
            {isEst && <div className="mc-badge">ESTIMATED</div>}
          </div>
          <div className="mc-card-title" style={{ marginTop: '0' }}>Is my business growing?</div>
          <div className={`mc-val ${isEst ? 'muted-val' : ''}`}>{trendText}</div>
          <div className="mc-desc">{trendImpl}</div>
          <div className="mc-jargon" style={{marginTop: 'auto', marginBottom: isEst ? '16px' : '0'}}>Also known as: Year-over-year revenue growth</div>
          {isEst && <div className="mc-anno-amber" style={{marginTop: 0}}>Based on your estimates. Upload your P&amp;L for a precise number.</div>}
          <div className="mc-chart-box" style={{marginTop: '24px'}}>
            <svg viewBox="0 0 100 30" width="100%" height="40" preserveAspectRatio="none">
              <path d={safeTrend === 'up' ? "M0,25 Q25,20 50,15 T100,5" : safeTrend === 'down' ? "M0,5 Q25,10 50,20 T100,25" : "M0,15 L100,15"} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          
          {renderTrigger('card1', trendColor)}
          
          {expandedCards.includes('card1') && (
            <div className="what-if-panel">
              <div className={`wi-header-${trendColor}`}>{getHeaderLbl(trendColor)}</div>
              <div className="wi-slider-label">What if my revenue grew faster?</div>
              
              <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px' }}></div>
                <div style={{ position: 'absolute', height: '8px', width: `${trendSlider * 4}%`, background: 'linear-gradient(90deg, #D94545, #C9943A)', borderRadius: '4px' }}></div>
                <input 
                  type="range" min="0" max="25" step="1" value={trendSlider} 
                  onChange={e => setTrendSlider(parseInt(e.target.value, 10))} 
                  style={{ position: 'absolute', width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: '24px', zIndex: 10 }} 
                />
                <div style={{ position: 'absolute', left: `calc(${trendSlider * 4}% - 12px)`, width: '24px', height: '24px', background: 'var(--ink)', borderRadius: '50%', pointerEvents: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', border: '2px solid #C9943A' }}></div>
              </div>
              <div className="wi-ticks"><span>0% today</span><span>25% growth</span></div>
              
              <div style={{marginTop: '32px'}}>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your business becomes more valuable to buyers &rarr;</span>
                  <span className="wi-row-val">{isTrendMoved ? `+${trendBonus.toFixed(1)}x` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your estimated exit value &rarr;</span>
                  <span className="wi-row-val">{isTrendMoved ? `$${exitLow.toFixed(1)}M \u2013 $${exitHigh.toFixed(1)}M` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-anno">Growth rate affects what buyers pay per dollar &mdash; not your current earnings.</div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: WHAT YOU TAKE HOME */}
        <div className={`metric-card border-${sdeColor} ${expandedCards.includes('card2') && isSalaryMoved ? 'fade-highlight' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div className={`mc-status-word ${sdeColor}`} style={{ margin: 0 }}>{sdeStatus}</div>
            {isEst && <div className="mc-badge">ESTIMATED</div>}
          </div>
          <div className="mc-card-title" style={{ marginTop: '0' }}>What would I walk away with?</div>
          <div className={`mc-val ${isEst ? 'muted-val' : ''}`}>{sdeDisplayStr}</div>
          <div className="mc-desc">This is the check you'd receive at closing.</div>
          <div className="mc-jargon" style={{marginTop: 'auto', marginBottom: isEst ? '16px' : '0'}}>Also known as: Seller's Discretionary Earnings (SDE)</div>
          {isEst && <div className="mc-anno-amber" style={{marginTop: 0}}>Based on your estimates. Upload your P&amp;L for a precise number.</div>}
          <div className="mc-chart-box" style={{marginTop: '24px'}}>
            <div style={{ width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '30%', right: '30%', top: '-6px', bottom: '-6px', borderLeft: '1px solid rgba(245,237,216,0.3)', borderRight: '1px solid rgba(245,237,216,0.3)', background: 'rgba(245,237,216,0.05)' }}></div>
              <div style={{ position: 'absolute', left: `${Math.min(95, 30 + (sdeCurrent / 1000000) * 20)}%`, top: '-8px', bottom: '-8px', width: '4px', background: '#C9943A', borderRadius: '2px', transition: 'left 0.2s linear' }}></div>
            </div>
          </div>
          
          {renderTrigger('card2', sdeColor)}
          
          {expandedCards.includes('card2') && (() => {
            const minSal = Math.min(40000, safeSalaryBase * 0.5);
            const maxSal = Math.max(200000, safeSalaryBase * 1.5);
            const rangeSal = maxSal - minSal;
            const pct = Math.max(0, Math.min(100, ((salarySlider - minSal) / rangeSal) * 100));
            return (
            <div className="what-if-panel">
              <div className={`wi-header-${sdeColor}`}>{getHeaderLbl(sdeColor)}</div>
              <div className="wi-slider-label">What if I optimized my salary before selling?</div>
              
              <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px' }}></div>
                <div style={{ position: 'absolute', height: '8px', width: `${pct}%`, background: 'linear-gradient(90deg, #D94545, #C9943A)', borderRadius: '4px' }}></div>
                <input 
                  type="range" min={minSal} max={maxSal} step="5000" value={salarySlider} 
                  onChange={e => setSalarySlider(parseInt(e.target.value, 10))} 
                  style={{ position: 'absolute', width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: '24px', zIndex: 10 }} 
                />
                <div style={{ position: 'absolute', left: `calc(${pct}% - 12px)`, width: '24px', height: '24px', background: 'var(--ink)', borderRadius: '50%', pointerEvents: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', border: '2px solid #C9943A' }}></div>
              </div>
              <div className="wi-ticks"><span>${Math.round(minSal/1000)}K</span><span>${Math.round(maxSal/1000)}K</span></div>
              
              <div style={{marginTop: '32px'}}>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your annual earnings would change by &rarr;</span>
                  <span className="wi-row-val">{isSalaryMoved ? `${earningsAddedSalary >= 0 ? '+' : '-'}$${Math.abs(earningsAddedSalary).toLocaleString()}` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your estimated exit value &rarr;</span>
                  <span className="wi-row-val">{isSalaryMoved ? `$${exitLow.toFixed(1)}M \u2013 $${exitHigh.toFixed(1)}M` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-anno">Your salary directly reduces your SDE &mdash; what buyers are purchasing. Lower salary, higher SDE, higher exit.</div>
              </div>
            </div>
            );
          })()}
        </div>

        {/* CARD 3: PROFIT PER JOB */}
        <div className={`metric-card border-${marginColor}`}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div className={`mc-status-word ${marginColor}`} style={{ margin: 0 }}>{marginStatusWord}</div>
            {isEst && <div className="mc-badge">ESTIMATED</div>}
          </div>
          <div className="mc-card-title" style={{ marginTop: '0' }}>AM I RUNNING A TIGHT SHIP?</div>
          <div className={`mc-val ${isEst ? 'muted-val' : ''}`}>{marginSlider.toFixed(1)}%</div>
          <div className="mc-desc" style={{marginBottom: '16px'}}>HVAC buyers expect 25&ndash;35%. Closing this gap adds real value to your exit.</div>
          <div className="mc-jargon" style={{marginTop: 'auto', marginBottom: isEst ? '16px' : '0'}}>Also known as: Gross margin</div>
          {isEst && <div className="mc-anno-amber" style={{marginTop: 0}}>Based on your estimates. Upload your P&amp;L for a precise number.</div>}
          
          <div style={{width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px', position: 'relative', marginBottom: '0', marginTop: '24px'}}>
            <div style={{position: 'absolute', left: '0', width: `${Math.min(100, marginSlider)}%`, height: '100%', background: 'var(--ink)', borderRadius: '4px', opacity: 0.8}}></div>
            <div style={{position: 'absolute', left: '25%', right: '65%', top: '-6px', bottom: '-6px', borderLeft: '1px dashed rgba(245,237,216,0.4)', borderRight: '1px dashed rgba(245,237,216,0.4)', background: 'rgba(110, 206, 123, 0.1)'}}></div>
          </div>

          {renderTrigger('card3', marginColor)}
          
          {expandedCards.includes('card3') && (
            <div className="what-if-panel">
              <div className={`wi-header-${marginColor}`}>{getHeaderLbl(marginColor)}</div>
              <div className="wi-slider-label">What if my margins improved to <u>{marginSlider.toFixed(1)}%</u>?</div>
              
              <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px' }}></div>
                <div style={{ position: 'absolute', height: '8px', width: `${marginPctDesc}%`, background: 'linear-gradient(90deg, #D94545, #C9943A)', borderRadius: '4px' }}></div>
                <input 
                  type="range" min={safeInitialMargin} max={marginCap} step="0.1" value={marginSlider} 
                  onChange={e => setMarginSlider(parseFloat(e.target.value))} 
                  style={{ position: 'absolute', width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: '24px', zIndex: 10 }} 
                />
                <div style={{ position: 'absolute', left: `calc(${marginPctDesc}% - 12px)`, width: '24px', height: '24px', background: 'var(--ink)', borderRadius: '50%', pointerEvents: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', border: '2px solid #C9943A' }}></div>
              </div>
              <div className="wi-ticks"><span>{safeInitialMargin}% today</span><span>{marginCap}% HVAC avg</span></div>
              
              <div style={{marginTop: '32px'}}>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your annual earnings increase by &rarr;</span>
                  <span className="wi-row-val">{isMarginMoved ? `+$${Math.round(earningsAddedMargin).toLocaleString()}` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-row">
                  <span className="wi-row-lbl">Your estimated exit value &rarr;</span>
                  <span className="wi-row-val">{isMarginMoved ? `$${exitLow.toFixed(1)}M \u2013 $${exitHigh.toFixed(1)}M` : '\u2014\u2014'}</span>
                </div>
                <div className="wi-anno">Better margins increase what you earn &mdash; and signal to buyers that your business runs efficiently.</div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 4: HOW MUCH YOU'RE NEEDED */}
        {isEst ? (
          <div className="metric-card locked" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="mc-card-title" style={{ margin: '0 0 16px 0', color: 'var(--ink)' }}>OWNER DEPENDENCY RISK</div>
            <div style={{ borderTop: '1px solid rgba(245,237,216,0.2)', margin: '0 -24px' }}></div>
            
            <a href="#" className="locked-unit" onClick={e => { e.preventDefault(); onRequestUpload(); }} style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--ink)', textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontFamily: 'var(--sans)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Upload your P&amp;L to unlock this metric
              </div>
            </a>
          </div>
        ) : (
          <div className="metric-card border-red">
            <div className="mc-status-word red" style={{ marginBottom: '4px' }}>NEEDS IMPROVEMENT</div>
            <div className="mc-card-title" style={{ marginTop: '0' }}>COULD THIS PLACE RUN WITHOUT ME?</div>
            
            <div className="mc-bar-large" style={{marginBottom: '8px'}}>
              <div style={{width: `${80 - depPctDesc * 0.6}%`, height: '100%', background: '#D94545', transition: 'width 0.2s'}}></div>
            </div>
            <div className="mc-sub serif-med" style={{color: 'var(--ink)'}}>Owner dependency &mdash; High</div>
            
            <div className="mc-desc" style={{marginBottom: '16px'}}>Buyers pay less for businesses that can't run without the owner.</div>
            <div className="mc-jargon" style={{marginTop: 'auto', marginBottom: '0'}}>Also known as: Owner dependency risk</div>
            
            {renderTrigger('card4', 'red')}
            
            {expandedCards.includes('card4') && (
              <div className="what-if-panel" style={{marginTop: '24px'}}>
                <div className="wi-header-red">WHAT IF YOU FIXED THIS?</div>
                <div className="wi-slider-label">What if my business ran more without me?</div>
                
                <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'rgba(245,237,216,0.1)', borderRadius: '4px' }}></div>
                  <div style={{ position: 'absolute', height: '8px', width: `${depPctDesc}%`, background: 'linear-gradient(90deg, #D94545, #C9943A)', borderRadius: '4px', transition: 'width 0.2s' }}></div>
                  <input 
                    type="range" min="0" max="2" step="1" value={depSlider} 
                    onChange={e => setDepSlider(parseInt(e.target.value, 10))} 
                    style={{ position: 'absolute', width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: '24px', zIndex: 10 }} 
                  />
                  <div style={{ position: 'absolute', left: `calc(${depPctDesc}% - 12px)`, width: '24px', height: '24px', background: 'var(--ink)', borderRadius: '50%', pointerEvents: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', border: '2px solid #C9943A', transition: 'left 0.2s' }}></div>
                </div>
                <div className="wi-ticks"><span>Runs on me</span><span>Some tasks</span><span>Runs without me</span></div>
                
                <div style={{marginTop: '32px'}}>
                  <div className="wi-row">
                    <span className="wi-row-lbl">Your earnings stay the same &rarr;</span>
                    <span className="wi-row-val muted">{isDepMoved ? `$${Math.round(sdeBase).toLocaleString()}` : '\u2014\u2014'}</span>
                  </div>
                  <div className="wi-row">
                    <span className="wi-row-lbl">Your estimated exit value &rarr;</span>
                    <span className="wi-row-val">{isDepMoved ? `$${exitLow.toFixed(1)}M \u2013 $${exitHigh.toFixed(1)}M` : '\u2014\u2014'}</span>
                  </div>
                  <div className="wi-anno">This doesn't change your earnings &mdash; it changes what buyers pay per dollar. Less risk to them means more money to you.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARD 5: 3-YEAR PROJECTION */}
        <div className="metric-card full-width">
          <div className="proj-head">
            <div className="proj-label">3-YEAR PROJECTION</div>
            <div className="proj-label">IF YOU FIX THE TWO GAPS</div>
          </div>
          
          <div className="proj-grid">
            <div className="proj-col">
              <div className="proj-tiny muted">TODAY</div>
              <div className="mc-val" style={{fontSize: '32px'}}>${initialExitLow.toFixed(1)}M &ndash; ${initialExitHigh.toFixed(1)}M</div>
            </div>
            <div className="proj-col">
              <div className="proj-tiny amber">AFTER FIXING YOUR GAPS</div>
              <div className="mc-val-large">${exitLow.toFixed(1)}M &ndash; ${exitHigh.toFixed(1)}M</div>
              <div className="proj-tiny muted" style={{textTransform: 'none', letterSpacing: '0', marginTop: '4px'}}>
                [${Math.round(sdeCurrent).toLocaleString()} earnings] &times; [( {mulLow.toFixed(1)}x - {mulHigh.toFixed(1)}x ) what buyers pay per dollar]
              </div>
              {isEst && (
                <div style={{fontFamily: 'var(--sans)', fontSize: '10px', color: 'var(--ink-muted)', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.4}}>
                  Projection is partial &mdash; owner dependency data missing. Upload P&amp;L for the full picture.
                </div>
              )}
            </div>
          </div>
          <div className="mc-desc mt-16" style={{textAlign: 'center', maxWidth: 'none', fontStyle: 'italic', fontFamily: 'var(--serif)', marginBottom: '0'}}>
            That's the difference between a good exit and a great one.
          </div>
        </div>
      </div>

      <div className="metrics-foot">
        <div className="res-cta-row" style={{maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <button className="cta cta-solid" onClick={() => alert('Demo: Booking consultation...')}>
            <span>BOOK A FREE 1:1 &mdash; Talk through your exit plan</span>
            <span className="arrow">&rarr;</span>
          </button>
          
          {inputType === 'estimates' && (
            <button className="cta cta-ghost" onClick={() => onRequestUpload()}>
              <span>UPLOAD P&amp;L FOR PRECISE NUMBERS</span>
              <span className="arrow">&rarr;</span>
            </button>
          )}
        </div>
        <p className="res-fine" style={{textAlign: 'center', marginTop: '16px'}}>
          Contrarian Thinking advisors specialize in HVAC and trades exits.
        </p>
      </div>

      <footer className="footer" style={{marginTop: '64px'}}>
        <div className="col"><span>© Contrarian Thinking</span><span>Main Street Capital</span></div>
        <div className="col"><span>Independent · Not advice<em>— yet</em></span></div>
      </footer>
    </div>
  );
}
