"""
HeartSense AI — training pipeline
---------------------------------
Builds a Cleveland-style heart-disease dataset (13 clinical features), trains a deep
neural network (MLP 13→64→32→16→1) plus baselines, evaluates them and exports the
network weights + metrics to ../src/model/model.json for in-browser inference.

    pip install -r requirements.txt
    python train.py
"""
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, roc_curve, confusion_matrix
from sklearn.inspection import permutation_importance

rng = np.random.default_rng(42)
N = 4000

# ---------------------------------------------------------------- data simulation
age = rng.normal(54, 9, N).clip(29, 79).round()
sex = rng.binomial(1, 0.68, N)                                   # 1 = male
cp = rng.choice([0, 1, 2, 3], N, p=[0.47, 0.17, 0.28, 0.08])     # 0 typical angina … 3 asymptomatic (encoded as in UCI: 0 = asymptomatic risk-heavy)
trestbps = (rng.normal(131, 17, N) + (age - 54) * 0.35).clip(94, 200).round()
chol = (rng.normal(246, 48, N) + (age - 54) * 0.6).clip(126, 564).round()
fbs = rng.binomial(1, 0.15 + (age > 60) * 0.06, N)
restecg = rng.choice([0, 1, 2], N, p=[0.49, 0.48, 0.03])
thalach = (rng.normal(150, 20, N) - (age - 54) * 0.9).clip(71, 202).round()
exang = rng.binomial(1, 0.33, N)
oldpeak = np.abs(rng.normal(1.0, 1.1, N)).clip(0, 6.2).round(1)
slope = rng.choice([0, 1, 2], N, p=[0.07, 0.46, 0.47])
ca = rng.choice([0, 1, 2, 3], N, p=[0.58, 0.22, 0.13, 0.07])
thal = rng.choice([1, 2, 3], N, p=[0.06, 0.55, 0.39])            # 1 fixed defect, 2 normal, 3 reversible defect

raw = (0.045 * age + 0.85 * sex + 1.05 * (cp == 0) - 0.5 * (cp == 2) + 0.016 * (trestbps - 120)
         + 0.0045 * (chol - 200) + 0.25 * fbs + 0.3 * (restecg == 1) - 0.028 * (thalach - 150) + 1.0 * exang
         + 0.62 * oldpeak + 0.55 * (slope == 1) + 0.85 * ca + 1.25 * (thal == 3) + 0.6 * (thal == 1)
         + 0.9 * exang * (oldpeak > 1.5)) * 2.3 + rng.normal(0, 0.4, N)
# calibrate the intercept so that ~46 % of patients have disease (Cleveland prevalence)
lo, hi = -60.0, 60.0
for _ in range(60):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if (1 / (1 + np.exp(-(raw + mid)))).mean() < 0.46 else (lo, mid)
target = rng.binomial(1, 1 / (1 + np.exp(-(raw + lo))))

FEATURES = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
df = pd.DataFrame(dict(age=age, sex=sex, cp=cp, trestbps=trestbps, chol=chol, fbs=fbs, restecg=restecg, thalach=thalach,
                       exang=exang, oldpeak=oldpeak, slope=slope, ca=ca, thal=thal, target=target))
df.to_csv('heart_dataset.csv', index=False)
print(df.target.value_counts(normalize=True))

# ---------------------------------------------------------------- training
X, y = df[FEATURES].values, df.target.values
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)
sc = StandardScaler().fit(Xtr)
Xtr_s, Xte_s = sc.transform(Xtr), sc.transform(Xte)

dnn = MLPClassifier(hidden_layer_sizes=(64, 32, 16), activation='relu', alpha=8e-3, learning_rate_init=8e-4,
                    max_iter=400, early_stopping=True, validation_fraction=0.15, n_iter_no_change=25, random_state=1)
dnn.fit(Xtr_s, ytr)

models = {
    'Deep Neural Net': dnn,
    'Logistic Regression': LogisticRegression(max_iter=1000).fit(Xtr_s, ytr),
    'Random Forest': RandomForestClassifier(n_estimators=300, max_depth=8, random_state=1).fit(Xtr_s, ytr),
    'Gradient Boosting': GradientBoostingClassifier(random_state=1).fit(Xtr_s, ytr),
}
compare = []
for name, m in models.items():
    p = m.predict_proba(Xte_s)[:, 1]; yh = (p >= 0.5).astype(int)
    compare.append(dict(model=name, accuracy=accuracy_score(yte, yh), precision=precision_score(yte, yh), recall=recall_score(yte, yh),
                        f1=f1_score(yte, yh), auc=roc_auc_score(yte, p)))
    print(compare[-1])

p = dnn.predict_proba(Xte_s)[:, 1]; yh = (p >= 0.5).astype(int)
fpr, tpr, _ = roc_curve(yte, p)
idx = np.linspace(0, len(fpr) - 1, 40).astype(int)
pi = permutation_importance(dnn, Xte_s, yte, n_repeats=8, random_state=0, scoring='roc_auc')

# calibration: predicted vs observed in deciles
bins = np.clip((p * 10).astype(int), 0, 9)
calib = [dict(pred=float(p[bins == b].mean()), obs=float(yte[bins == b].mean()), n=int((bins == b).sum())) for b in range(10) if (bins == b).sum() > 5]

# EDA aggregates for the app
df['age_band'] = pd.cut(df.age, [28, 39, 49, 59, 69, 80], labels=['30s', '40s', '50s', '60s', '70s'])
eda = {
    'by_age': df.groupby('age_band', observed=True).target.mean().round(3).to_dict(),
    'by_cp': df.groupby('cp').target.mean().round(3).to_dict(),
    'by_sex': df.groupby('sex').target.mean().round(3).to_dict(),
    'by_thal': df.groupby('thal').target.mean().round(3).to_dict(),
    'by_ca': df.groupby('ca').target.mean().round(3).to_dict(),
    'corr': df[FEATURES + ['target']].corr()['target'].drop('target').round(3).to_dict(),
    'scatter': df.sample(300, random_state=3)[['age', 'thalach', 'chol', 'target']].values.tolist(),
    'prevalence': float(df.target.mean()), 'rows': len(df),
}

def r(x, n=5):
    if isinstance(x, np.ndarray): x = x.tolist()
    if isinstance(x, list): return [r(v, n) for v in x]
    return round(float(x), n) if isinstance(x, (float, np.floating)) else x

out = {
    'features': FEATURES,
    'model': {'weights': [r(w) for w in dnn.coefs_], 'biases': [r(b) for b in dnn.intercepts_], 'activation': 'relu', 'out': 'logistic',
              'mean': r(sc.mean_, 6), 'scale': r(sc.scale_, 6), 'layers': [13, 64, 32, 16, 1],
              'params': int(sum(w.size + b.size for w, b in zip(dnn.coefs_, dnn.intercepts_)))},
    'loss_curve': r(dnn.loss_curve_), 'val_curve': r(dnn.validation_scores_),
    'compare': [{k: (round(v, 4) if isinstance(v, float) else v) for k, v in c.items()} for c in compare],
    'confusion': confusion_matrix(yte, yh).tolist(),
    'roc': [[round(float(fpr[i]), 4), round(float(tpr[i]), 4)] for i in idx],
    'importance': sorted([[FEATURES[i], round(float(pi.importances_mean[i]), 4)] for i in range(len(FEATURES))], key=lambda x: -x[1]),
    'calibration': calib, 'eda': {k: ({str(a): b for a, b in v.items()} if isinstance(v, dict) else v) for k, v in eda.items()},
    'test_size': int(len(yte)), 'train_size': int(len(ytr)), 'epochs': int(dnn.n_iter_),
    'means': {f: round(float(df[f].mean()), 3) for f in FEATURES},
}
json.dump(out, open('../src/model/model.json', 'w'), separators=(',', ':'))
df.drop(columns='age_band').sample(40, random_state=11).drop(columns='target').to_csv('../public/sample_patients.csv', index=False)
print('exported model.json', round(len(json.dumps(out)) / 1024, 1), 'KB')
