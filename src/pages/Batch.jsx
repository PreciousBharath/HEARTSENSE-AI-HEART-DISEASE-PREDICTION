import { useRef, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart } from 'recharts';
import { Upload, FileSpreadsheet, Download, Users } from 'lucide-react';
import { M, toVec, predict, band } from '../lib/heart.jsx';
import { parseCSV } from '../core/nn.js';
import { Card, PageHead, Badge, Empty } from '../core/ui.jsx';
import { useApp } from '../core/context.jsx';
import { downloadText, toCSV } from '../core/store.js';

export default function Batch() {
  const { toast } = useApp(); const ref = useRef();
  const [rows, setRows] = useState([]); const [file, setFile] = useState('');
  function load(text, name) {
    try {
      const data = parseCSV(text); const miss = M.features.filter((f) => !(f in data[0]));
      if (miss.length) throw new Error('Missing columns: ' + miss.join(', '));
      setRows(data.map((d, i) => { const r = predict(toVec(d)); return { id: d.id || `P${String(i + 1).padStart(3, '0')}`, ...d, risk: r, band: band(r)[0] }; }).sort((a, b) => b.risk - a.risk));
      setFile(name); toast(`Scored ${data.length} patients`, 'ok');
    } catch (e) { toast(e.message, 'bad'); }
  }
  async function sample() { const t = await (await fetch('./sample_patients.csv')).text(); load(t, 'sample_patients.csv'); }
  const hist = Array.from({ length: 10 }, (_, i) => ({ b: `${i * 10}-${i * 10 + 10}%`, n: rows.filter((r) => Math.min(9, Math.floor(r.risk * 10)) === i).length, c: band(i / 10 + 0.05)[1] }));
  const bands = ['Low risk', 'Moderate risk', 'High risk'].map((b) => ({ name: b, value: rows.filter((r) => r.band === b).length, c: band(b === 'Low risk' ? 0.1 : b === 'Moderate risk' ? 0.4 : 0.8)[1] }));
  return (
    <>
      <PageHead title="Batch screening" crumbs="HeartSense AI / Batch" sub="Upload a CSV of patients and triage them by predicted risk">
        <input ref={ref} type="file" accept=".csv" hidden onChange={(e) => { const f = e.target.files[0]; if (f) f.text().then((t) => load(t, f.name)); e.target.value = ''; }} />
        <button className="btn btn-ghost" onClick={sample}><FileSpreadsheet size={16} /> Load sample (40 patients)</button>
        <button className="btn btn-primary" onClick={() => ref.current.click()}><Upload size={16} /> Upload CSV</button>
      </PageHead>
      {!rows.length ? (
        <Card><Empty icon={Users} title="No patients loaded" text={`CSV columns required: ${M.features.join(', ')}`} action={<button className="btn btn-primary" onClick={sample}>Try the sample file</button>} /></Card>
      ) : (<>
        <div className="grid g-2-1 stagger">
          <Card title="Risk distribution" sub={file}>
            <div style={{ height: 240 }}><ResponsiveContainer><BarChart data={hist} margin={{ left: -20 }}><XAxis dataKey="b" tickLine={false} axisLine={false} tick={{ fontSize: 10.5 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip />
              <Bar dataKey="n" name="Patients" radius={[6, 6, 0, 0]}>{hist.map((h) => <Cell key={h.b} fill={h.c} />)}</Bar></BarChart></ResponsiveContainer></div>
          </Card>
          <Card title="Triage summary">
            <div style={{ height: 180 }}><ResponsiveContainer><PieChart><Pie data={bands} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>{bands.map((b) => <Cell key={b.name} fill={b.c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            <div className="row wrap" style={{ justifyContent: 'center' }}>{bands.map((b) => <span key={b.name} className="badge" style={{ color: b.c, background: b.c + '22' }}>{b.name}: {b.value}</span>)}</div>
          </Card>
        </div>
        <Card className="mt16 fade-up" title={`${rows.length} patients · sorted by risk`} action={<button className="btn btn-ghost btn-sm" onClick={() => downloadText('heartsense_scored.csv', toCSV(rows.map((r) => ({ ...r, risk: r.risk.toFixed(4) }))), 'text/csv')}><Download size={15} /> Download results</button>}>
          <div className="table-wrap" style={{ maxHeight: 460, overflowY: 'auto' }}><table className="tbl"><thead><tr><th>ID</th><th>Age</th><th>Sex</th><th>BP</th><th>Chol</th><th>Max HR</th><th>Oldpeak</th><th>Vessels</th><th>Risk</th><th>Band</th></tr></thead>
            <tbody>{rows.map((r) => { const [l, c, k] = band(r.risk); return (
              <tr key={r.id}><td className="mono small">{r.id}</td><td>{r.age}</td><td>{r.sex ? 'M' : 'F'}</td><td>{r.trestbps}</td><td>{r.chol}</td><td>{r.thalach}</td><td>{r.oldpeak}</td><td>{r.ca}</td>
                <td><div className="row" style={{ gap: 8 }}><div className="progress" style={{ width: 80 }}><i style={{ width: r.risk * 100 + '%', background: c }} /></div><b className="small mono">{(r.risk * 100).toFixed(1)}%</b></div></td><td><Badge kind={k}>{l}</Badge></td></tr>); })}</tbody></table></div>
        </Card>
      </>)}
    </>
  );
}
