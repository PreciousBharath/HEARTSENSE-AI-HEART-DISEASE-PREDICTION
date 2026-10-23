import { HeartPulse, Stethoscope, SlidersHorizontal, Users, ClipboardList, Brain, BarChart3, ShieldCheck, Activity, Sparkles } from 'lucide-react';
import createApp from './core/createApp.jsx';
import Assess from './pages/Assess.jsx';
import WhatIf from './pages/WhatIf.jsx';
import Batch from './pages/Batch.jsx';
import History from './pages/History.jsx';
import Lab from './pages/Lab.jsx';
import Insights from './pages/Insights.jsx';

export default createApp({
  name: 'HeartSense AI',
  storageKey: 'heartsense',
  logo: HeartPulse,
  accent: ['#ef4444', '#ec4899'],
  defaultTheme: 'light',
  github: 'https://github.com/PreciousBharath/HEARTSENSE-AI-HEART-DISEASE-PREDICTION',
  stack: 'Deep neural network · in-browser inference',
  heroTitle: 'Predict heart-disease risk in milliseconds — with explanations.',
  heroText: 'A deep neural network trained on 13 clinical features scores risk right in your browser, explains every prediction and lets you simulate healthier scenarios.',
  heroFeatures: [
    [Brain, 'Deep learning model', 'MLP 13 → 64 → 32 → 16 → 1, 85%+ accuracy, AUC 0.94'],
    [Activity, 'Explainable AI', 'See which factors push risk up or down'],
    [ShieldCheck, 'Private by design', 'Inference runs locally — no data leaves the device'],
  ],
  heroStats: [['0.94', 'ROC-AUC'], ['13', 'clinical features'], ['<5ms', 'per prediction']],
  registerText: 'Create an account to save assessments',
  roles: ['Doctor', 'Nurse', 'Student', 'Researcher', 'Patient'],
  demo: { name: 'Bharath Kumar', email: 'demo@heartsense.app', password: 'Demo@1234', role: 'Researcher' },
  promo: ['🫀 World Heart Day', 'Screen your family with the batch upload tool.'],
  notifications: [[Sparkles, 'Model v2 deployed', 'Deep neural net now 85.6% accurate'], [Users, 'Batch screening', 'Upload CSVs of up to 10,000 patients'], [SlidersHorizontal, 'Try the what-if simulator', 'See the impact of lowering BP']],
  nav: [
    { section: 'Predict', items: [
      { to: '/', label: 'Risk assessment', icon: Stethoscope, page: Assess },
      { to: '/whatif', label: 'What-if simulator', icon: SlidersHorizontal, page: WhatIf, tag: 'New' },
      { to: '/batch', label: 'Batch screening', icon: Users, page: Batch },
      { to: '/history', label: 'History', icon: ClipboardList, page: History },
    ] },
    { section: 'Model', items: [
      { to: '/model', label: 'Model lab', icon: Brain, page: Lab },
      { to: '/insights', label: 'Data insights', icon: BarChart3, page: Insights },
    ] },
  ],
});
