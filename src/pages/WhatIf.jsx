import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from 'recharts';
import { TrendingDown, ArrowRight } from 'lucide-react';
import { PRESETS, FEATS, toVec, predict, band } from '../lib/heart.jsx';
import { Card, PageHead, Slider, Ring, Badge } from '../core/ui.jsx';

const LEVERS = ['trestbps', 'chol', 'thalach', 'oldpeak', 'age'];

export default function WhatIf() {
  const [base, setBase] = useState('High-risk 63-year-old');
  const p0 = PRESETS[base];
  const [p, setP] = useState(p0);
  const [lever, setLever] = useState('chol');
  const r0 = predict(toVec(p0)), r1 = predict(toVec(p));
  const m = FEATS[lever];
  const curve = Array.from({ length: 40 }, (_, i) => { const v = m.min + ((m.max - m.min) * i) / 39; return { v: +v.toFixed(1), risk: +(predict(toVec({ ...p, [lever]: v })) * 100).toFixed(1) }; });
  const [l0, c0] = band(r0), [l1, c1] = band(r1);
  return (
    <>
      <PageHead title="What-if simulator" crumbs="HeartSense AI / What-if" sub="See how lifestyle and treatment targets could change the predicted risk">
        <select className="input" style={{ width: 240 }} value={base} onChange={(e) => { setBase(e.target.value); setP(PRESETS[e.target.value]); }}>{Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}</select>
      </PageHead>
      <div className="grid g3 stagger">
        <Card><div style={{ display: 'grid', placeItems: 'center' }}><div className="small bold muted mb12">CURRENT</div><Ring value={r0 * 100} size={150} stroke={13} color={c0} label={(r0 * 100).toFixed(1) + '%'} sub={l0} /></div></Card>
        <Card><div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center' }}>
          <ArrowRight size={34} color="var(--accent)" />
          <div style={{ fontSize: 34, fontWeight: 800, color: r1 <= r0 ? 'var(--ok)' : 'var(--bad)' }}>{r1 <= r0 ? '−' : '+'}{Math.abs((r1 - r0) * 100).toFixed(1)} pts</div>
          <div className="small muted">{r1 < r0 ? `${(((r0 - r1) / r0) * 100).toFixed(0)}% relative risk reduction` : 'Adjust the sliders to explore'}</div>
          <button className="btn btn-ghost btn-sm mt12" onClick={() => setP(p0)}>Reset</button></div></Card>
        <Card><div style={{ display: 'grid', placeItems: 'center' }}><div className="small bold muted mb12">SCENARIO</div><Ring value={r1 * 100} size={150} stroke={13} color={c1} label={(r1 * 100).toFixed(1) + '%'} sub={l1} /></div></Card>
      </div>
      <div className="grid g-1-2 mt16 stagger">
        <Card title="Modifiable factors" action={<TrendingDown size={18} color="var(--ok)" />}>
          {LEVERS.map((f) => <Slider key={f} label={FEATS[f].label} value={p[f]} min={FEATS[f].min} max={FEATS[f].max} step={FEATS[f].step} unit={FEATS[f].unit ? ' ' + FEATS[f].unit : ''} onChange={(v) => setP({ ...p, [f]: v })} />)}
          <div className="row wrap mt8">{[['exang', 'No angina on exertion', 0], ['fbs', 'Normal blood sugar', 0]].map(([f, l, v]) => <button key={f} className={`chip ${p[f] === v ? 'on' : ''}`} onClick={() => setP({ ...p, [f]: p[f] === v ? p0[f] : v })}>{l}</button>)}</div>
          <div className="tile small mt16"><b>Quick targets:</b> BP &lt; 130 · cholesterol &lt; 200 · max HR ↑ with cardio
            <div className="row mt8"><button className="btn btn-soft btn-sm" onClick={() => setP({ ...p, trestbps: Math.min(p.trestbps, 125), chol: Math.min(p.chol, 195), thalach: Math.max(p.thalach, 150), fbs: 0 })}>Apply healthy targets</button></div></div>
        </Card>
        <Card title="Sensitivity curve" sub="Risk as one factor changes, others held at the scenario values" action={<div className="row wrap">{LEVERS.map((f) => <button key={f} className={`chip ${lever === f ? 'on' : ''}`} onClick={() => setLever(f)}>{FEATS[f].label.split(' ').slice(-1)[0]}</button>)}</div>}>
          <div style={{ height: 330 }}><ResponsiveContainer><LineChart data={curve} margin={{ left: -10, right: 10 }}>
            <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.07} /><ReferenceArea y1={30} y2={60} fill="#f59e0b" fillOpacity={0.07} /><ReferenceArea y1={60} y2={100} fill="#ef4444" fillOpacity={0.07} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="v" type="number" domain={[m.min, m.max]} tickLine={false} axisLine={false} unit={m.unit ? ' ' + m.unit : ''} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} unit="%" /><Tooltip formatter={(v) => v + '%'} />
            <Line dataKey="risk" stroke="var(--accent)" strokeWidth={3} dot={false} type="monotone" />
            <ReferenceDot x={p[lever]} y={+(r1 * 100).toFixed(1)} r={8} fill="var(--accent)" stroke="#fff" strokeWidth={3} />
          </LineChart></ResponsiveContainer></div>
          <div className="row wrap"><Badge kind="ok">0–30% low</Badge><Badge kind="warn">30–60% moderate</Badge><Badge kind="bad">60%+ high</Badge></div>
        </Card>
      </div>
    </>
  );
}
