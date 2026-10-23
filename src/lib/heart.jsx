import M from '../model/model.json';
import { forward } from '../core/nn.js';

export { M };
export const FEATS = {
  age: { label: 'Age', unit: 'yrs', min: 29, max: 79, step: 1 },
  sex: { label: 'Sex', options: [[0, 'Female'], [1, 'Male']] },
  cp: { label: 'Chest pain type', options: [[0, 'Asymptomatic'], [1, 'Atypical angina'], [2, 'Non-anginal pain'], [3, 'Typical angina']] },
  trestbps: { label: 'Resting blood pressure', unit: 'mm Hg', min: 94, max: 200, step: 1 },
  chol: { label: 'Serum cholesterol', unit: 'mg/dl', min: 126, max: 564, step: 1 },
  fbs: { label: 'Fasting blood sugar > 120', options: [[0, 'No'], [1, 'Yes']] },
  restecg: { label: 'Resting ECG', options: [[0, 'Normal'], [1, 'ST-T abnormality'], [2, 'LV hypertrophy']] },
  thalach: { label: 'Max heart rate achieved', unit: 'bpm', min: 71, max: 202, step: 1 },
  exang: { label: 'Exercise-induced angina', options: [[0, 'No'], [1, 'Yes']] },
  oldpeak: { label: 'ST depression (oldpeak)', unit: '', min: 0, max: 6.2, step: 0.1 },
  slope: { label: 'Slope of peak ST', options: [[0, 'Upsloping'], [1, 'Flat'], [2, 'Downsloping']] },
  ca: { label: 'Major vessels (fluoroscopy)', options: [[0, '0'], [1, '1'], [2, '2'], [3, '3']] },
  thal: { label: 'Thalassemia', options: [[1, 'Fixed defect'], [2, 'Normal'], [3, 'Reversible defect']] },
};
export const PRESETS = {
  'Healthy 35-year-old': { age: 35, sex: 0, cp: 2, trestbps: 116, chol: 190, fbs: 0, restecg: 0, thalach: 178, exang: 0, oldpeak: 0, slope: 2, ca: 0, thal: 2 },
  'Average 54-year-old': { age: 54, sex: 1, cp: 0, trestbps: 136, chol: 250, fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2, slope: 1, ca: 0, thal: 2 },
  'High-risk 63-year-old': { age: 63, sex: 1, cp: 0, trestbps: 150, chol: 290, fbs: 1, restecg: 1, thalach: 118, exang: 1, oldpeak: 2.6, slope: 1, ca: 2, thal: 3 },
};
export const toVec = (p) => M.features.map((f) => Number(p[f]));
export const predict = (vec) => forward(M.model, vec)[0];
export const band = (r) => (r < 0.3 ? ['Low risk', '#10b981', 'ok'] : r < 0.6 ? ['Moderate risk', '#f59e0b', 'warn'] : ['High risk', '#ef4444', 'bad']);
export const fmtVal = (f, v) => { const m = FEATS[f]; if (m.options) return (m.options.find((o) => o[0] === Number(v)) || [, v])[1]; return `${v}${m.unit ? ' ' + m.unit : ''}`; };

export function advice(p, risk) {
  const out = [];
  if (p.trestbps >= 140) out.push(['🩺', 'Blood pressure is in the hypertensive range', 'Reduce salt, stay active 150 min/week and discuss BP control with your doctor.']);
  else if (p.trestbps >= 130) out.push(['🩺', 'Blood pressure is elevated', 'Home monitoring and lifestyle changes can bring it below 130.']);
  if (p.chol >= 240) out.push(['🥗', 'High cholesterol', 'Cut saturated & trans fats, add fibre (oats, dal, greens) and get a lipid profile.']);
  if (p.thalach < 120) out.push(['🏃', 'Low exercise capacity', 'Graded, supervised aerobic exercise improves max heart rate over time.']);
  if (p.fbs) out.push(['🍬', 'High fasting blood sugar', 'Screen for diabetes (HbA1c) — it is a major cardiac risk multiplier.']);
  if (p.exang || p.oldpeak >= 2) out.push(['⚡', 'Exercise ECG changes', 'Angina or ST depression on exertion warrants a cardiology review.']);
  if (risk >= 0.6) out.unshift(['🚨', 'Consult a cardiologist soon', 'The model flags a high probability — a clinical evaluation (ECG, echo, stress test) is recommended.']);
  if (!out.length) out.push(['💚', 'Keep it up!', 'Your profile looks heart-healthy. Maintain regular exercise, sleep and annual check-ups.']);
  return out;
}
