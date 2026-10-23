import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardList, Trash2 } from 'lucide-react';
import { band, fmtVal } from '../lib/heart.jsx';
import { Card, PageHead, Badge, Empty } from '../core/ui.jsx';
import { usePersist } from '../core/context.jsx';

export default function History() {
  const [hist, setHist] = usePersist('history', []);
  const series = [...hist].reverse().map((h, i) => ({ i: i + 1, name: h.name, risk: +(h.risk * 100).toFixed(1) }));
  return (
    <>
      <PageHead title="Assessment history" crumbs="HeartSense AI / History" sub="Saved assessments stay in this browser">
        {hist.length > 0 && <button className="btn btn-danger btn-sm" onClick={() => confirm('Clear all saved assessments?') && setHist([])}><Trash2 size={15} /> Clear</button>}
      </PageHead>
      {!hist.length ? <Card><Empty icon={ClipboardList} title="No saved assessments" text="Run an assessment and press Save to build a timeline." /></Card> : (<>
        <Card className="fade-up" title="Risk over saved assessments"><div style={{ height: 220 }}><ResponsiveContainer><LineChart data={series} margin={{ left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} /><Tooltip />
          <Line dataKey="risk" stroke="var(--accent)" strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></Card>
        <div className="grid g3 mt16 stagger">{hist.map((h) => { const [l, c, k] = band(h.risk); return (
          <div key={h.id} className="card hover" style={{ borderTop: `4px solid ${c}` }}>
            <div className="between"><b>{h.name}</b><button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setHist(hist.filter((x) => x.id !== h.id))}><Trash2 size={14} /></button></div>
            <div className="small muted">{new Date(h.at).toLocaleString('en-IN')}</div>
            <div className="row mt12"><span style={{ fontSize: 30, fontWeight: 800, color: c }}>{(h.risk * 100).toFixed(1)}%</span><Badge kind={k}>{l}</Badge></div>
            <div className="small muted mt8">{fmtVal('age', h.p.age)} · {fmtVal('sex', h.p.sex)} · BP {h.p.trestbps} · Chol {h.p.chol} · {fmtVal('cp', h.p.cp)}</div>
          </div>); })}</div>
      </>)}
    </>
  );
}
