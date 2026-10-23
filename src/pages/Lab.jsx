import ModelLab from '../core/ModelLab.jsx';
import { M, FEATS } from '../lib/heart.jsx';

export default function Lab() {
  return <ModelLab M={M} title="Model lab" crumbs="HeartSense AI / Model lab" classes={['Healthy', 'Disease']} featLabel={(f) => FEATS[f].label} />;
}
