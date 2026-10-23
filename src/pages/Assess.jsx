import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Activity, Save, Printer, Sparkles, Info } from 'lucide-react';
import { FEATS, PRESETS, M, toVec, predict, band, advice, fmtVal } from '../lib/heart.jsx';
import { explain } from '../core/nn.js';
import { Card, PageHead, Slider, Ring, Badge, Field } from '../core/ui.jsx';
import { usePersist, useApp } from '../core/context.jsx';
import { uid } from '../core/store.js';

export function PatientForm({ p, setP }) {
  return (
    <div className="grid g2" style={{ gap: '4px 16px' }}>
      {M.features.map((f) => { const m = FEATS[f]; return m.options ? (
        <Field key={f} label={m.label}><select className="input" value={p[f]} onChange={(e) => setP({ ...p, [f]: Number(e.target.value) })}>{m.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      ) : <Slider key={f} label={m.label} value={p[f]} min={m.min} max={m.max} step={m.step} unit={m.unit ? ' ' + m.unit : ''} onChange={(v) => setP({ ...p, [f]: v })} />; })}
    </div>
  );
}

export default function Assess() {
  const { toast, user } = useApp();
  const [p, setP] = useState(PRESETS['Average 54-year-old']);
  const [name, setName] = useState('');
  const [, setHist] = usePersist('history', []);
  const x = toVec(p); const risk = predict(x); const [lbl, col, kind] = band(risk);
  const base = M.features.map((f) => M.means[f]);
  const contrib = useMemo(() => explain(predict, x, base, M.features).slice(0, 8).map((c) => ({ ...c, label: FEATS[c.name].label, pct: +(c.impact * 100).toFixed(1) })), [p]); // eslint-disable-line
  function save() { setHist((h) => [{ id: uid(), name: name || `Patient ${h.length + 1}`, p, risk, at: Date.now(), by: user.name }, ...h]); toast('Assessment saved to history', 'ok'); }
  return (
    <>
      <PageHead title="Heart risk assessment" crumbs="HeartSense AI / Assess" sub="Enter clinical parameters — the deep neural network scores risk instantly in your browser">
        {Object.keys(PRESETS).map((k) => <button key={k} className="chip" onClick={() => setP(PRESETS[k])}>{k}</button>)}
      </PageHead>
      <div className="grid g-3-2 stagger">
        <Card title="Patient parameters" sub="13 features from the UCI Cleveland protocol" action={<input className="input" style={{ width: 200 }} placeholder="Patient name / ID" value={name} onChange={(e) => setName(e.target.value)} />}>
          <PatientForm p={p} setP={setP} />
        </Card>
        <div className="grid" style={{ gap: 18, alignContent: 'start' }}>
          <Card>
            <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div className="small bold muted mb12 row"><Activity size={15} color={col} /> PREDICTED PROBABILITY OF HEART DISEASE</div>
              <Ring value={risk * 100} size={190} stroke={16} color={col} label={(risk * 100).toFixed(1) + '%'} sub={lbl} />
              <div className="row mt16"><Badge kind={kind}>{lbl}</Badge><Badge kind="mute">DNN {M.model.layers.join('→')}</Badge></div>
              <div className="row mt16"><button className="btn btn-primary btn-sm" onClick={save}><Save size={15} /> Save</button><button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={15} /> Report</button></div>
            </div>
          </Card>
          <Card title="Why this score?" sub="Feature impact vs an average patient (percentage points)">
            <div style={{ height: 260 }}><ResponsiveContainer><BarChart data={contrib} layout="vertical" margin={{ left: 30, right: 16 }}>
              <XAxis type="number" tickLine={false} axisLine={false} unit="%" /><YAxis type="category" dataKey="label" width={130} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <ReferenceLine x={0} stroke="var(--border)" /><Tooltip formatter={(v, n, e) => [`${v > 0 ? '+' : ''}${v} pts`, fmtVal(e.payload.name, e.payload.value)]} />
              <Bar dataKey="pct" radius={4}>{contrib.map((c) => <Cell key={c.name} fill={c.pct > 0 ? '#ef4444' : '#10b981'} />)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="small faint row mt8"><Info size={13} /> Red raises risk, green lowers it.</div>
          </Card>
        </div>
      </div>
      <Card className="mt16 fade-up" title="Personalised recommendations" action={<Sparkles size={18} color="var(--accent)" />}>
        <div className="grid g3" style={{ gap: 12 }}>{advice(p, risk).map(([e, t, d]) => <div key={t} className="tile"><div style={{ fontSize: 24 }}>{e}</div><b className="small">{t}</b><p className="small muted mt8">{d}</p></div>)}</div>
        <p className="small faint mt16">⚕️ Educational project — not a medical device. Predictions come from a model trained on simulated Cleveland-style data and must not replace professional diagnosis.</p>
      </Card>
    </>
  );
}
