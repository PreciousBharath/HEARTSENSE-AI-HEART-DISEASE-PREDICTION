import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Legend } from 'recharts';
import { Database, Percent, Users, HeartPulse } from 'lucide-react';
import { M, FEATS } from '../lib/heart.jsx';
import { Card, PageHead, Stat } from '../core/ui.jsx';

const toArr = (o, lab) => Object.entries(o).map(([k, v]) => ({ k: lab ? lab(k) : k, v: +(v * 100).toFixed(1) }));
const opt = (f) => (k) => (FEATS[f].options.find((o) => String(o[0]) === k) || [, k])[1];

export default function Insights() {
  const E = M.eda;
  const corr = Object.entries(E.corr).map(([k, v]) => ({ k: FEATS[k].label, v })).sort((a, b) => b.v - a.v);
  const sc0 = E.scatter.filter((s) => !s[3]).map(([age, hr, chol]) => ({ age, hr, chol })), sc1 = E.scatter.filter((s) => s[3]).map(([age, hr, chol]) => ({ age, hr, chol }));
  const B = ({ title, data }) => (
    <Card title={title} sub="Disease rate (%)"><div style={{ height: 210 }}><ResponsiveContainer><BarChart data={data} margin={{ left: -18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="k" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis unit="%" tickLine={false} axisLine={false} /><Tooltip formatter={(v) => v + '%'} />
      <Bar dataKey="v" radius={[6, 6, 0, 0]}>{data.map((d) => <Cell key={d.k} fill={d.v > 60 ? '#ef4444' : d.v > 40 ? '#f59e0b' : '#10b981'} />)}</Bar></BarChart></ResponsiveContainer></div></Card>);
  return (
    <>
      <PageHead title="Data insights" crumbs="HeartSense AI / Insights" sub="Exploratory analysis of the training dataset" />
      <div className="grid g4 stagger">
        <Stat icon={Database} label="Patients in dataset" value={E.rows} /><Stat icon={Percent} label="Disease prevalence" value={E.prevalence * 100} suffix="%" decimals={1} color="#ef4444" />
        <Stat icon={Users} label="Clinical features" value={M.features.length} color="#10b981" /><Stat icon={HeartPulse} label="Model accuracy" value={M.compare[0].accuracy * 100} suffix="%" decimals={1} color="#f59e0b" />
      </div>
      <div className="grid g4 mt16 stagger">
        <B title="By age group" data={toArr(E.by_age)} /><B title="By chest pain type" data={toArr(E.by_cp, opt('cp'))} />
        <B title="By vessels coloured" data={toArr(E.by_ca)} /><B title="By thalassemia" data={toArr(E.by_thal, opt('thal'))} />
      </div>
      <div className="grid g2 mt16 stagger">
        <Card title="Correlation with target" sub="Pearson r"><div style={{ height: 320 }}><ResponsiveContainer><BarChart data={corr} layout="vertical" margin={{ left: 40 }}>
          <XAxis type="number" domain={[-0.6, 0.6]} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="k" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip />
          <Bar dataKey="v" radius={4}>{corr.map((c) => <Cell key={c.k} fill={c.v > 0 ? '#ef4444' : '#10b981'} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
        <Card title="Age vs max heart rate" sub="Bubble size = cholesterol"><div style={{ height: 320 }}><ResponsiveContainer><ScatterChart margin={{ left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" type="number" name="Age" domain={[28, 80]} tickLine={false} axisLine={false} /><YAxis dataKey="hr" type="number" name="Max HR" domain={[70, 205]} tickLine={false} axisLine={false} />
          <ZAxis dataKey="chol" range={[20, 120]} name="Chol" /><Tooltip /><Legend />
          <Scatter name="No disease" data={sc0} fill="#10b981" fillOpacity={0.6} /><Scatter name="Disease" data={sc1} fill="#ef4444" fillOpacity={0.6} /></ScatterChart></ResponsiveContainer></div></Card>
      </div>
    </>
  );
}
