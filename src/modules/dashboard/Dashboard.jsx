import { useState } from 'react';
import Ic from '../../components/Ic';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import WeekNavigator from '../../components/WeekNavigator';
import BarChart from './BarChart';
import OccurrenceList from './OccurrenceList';
import { exportDashboard, exportDashboardMes } from './dashboardExport';
import { weekLabel, DAY_NAMES, isWeekPast } from '../../utils/weekLabel';
import { countFornos } from '../../utils/calcSemana';
import DashboardPlano from './DashboardPlano';
import FornosChart from './FornosChart';
import LuvasChart from './LuvasChart';
import styles from './Dashboard.module.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function groupByMonth(semanas) {
  const map = {};
  for (const s of semanas) {
    const d = new Date(s.dataInicio + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    if (!map[key]) map[key] = { key, label, semanas: [] };
    map[key].semanas.push(s);
  }
  return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
}

function MetaBar({ current, meta }) {
  const pct = Math.min(100, (current / Math.max(1, meta)) * 100);
  const ok = current >= meta;
  return (
    <div className={styles.metaBar}>
      <div
        className={styles.metaFill}
        style={{ width: `${pct}%`, background: ok ? 'var(--success)' : 'var(--accent)' }}
      />
    </div>
  );
}

export default function Dashboard({ semanas, onUpdateSemana }) {
  const sorted = [...semanas].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
  const [view, setView] = useState('semana');
  const [idx, setIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [exportPicker, setExportPicker] = useState(null); // { type: 'semana'|'mes', ... }

  async function handleExport(theme) {
    const target = exportPicker;
    setExportPicker(null);
    if (!target) return;
    try {
      if (target.type === 'semana') {
        await exportDashboard(target.semana, target.prevSemana, theme);
      } else {
        await exportDashboardMes(target.month, theme);
      }
    } catch (e) {
      alert(`Erro ao exportar: ${e.message}`);
    }
  }

  const exportThemeModal = exportPicker ? (
    <Modal open onClose={() => setExportPicker(null)} title="Exportar PDF">
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>
        Escolha o tema do relatório.
      </p>
      <div className={styles.exportThemeGrid}>
        <button className={styles.exportThemeBtn} onClick={() => handleExport('dark')}>
          <div className={styles.exportThemePreview} style={{ background: '#180f0b', borderColor: '#2b1e17' }}>
            <div style={{ height: 3, background: '#eb5927', borderRadius: '4px 4px 0 0' }} />
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[40, 28, 28].map((w, i) => (
                <div key={i} style={{ height: 3, width: `${w}%`, background: '#f0ebe7', borderRadius: 2, opacity: 0.3 }} />
              ))}
            </div>
          </div>
          <span className={styles.exportThemeName}>Escuro</span>
          <span className={styles.exportThemeDesc}>Para compartilhar</span>
        </button>
        <button className={styles.exportThemeBtn} onClick={() => handleExport('light')}>
          <div className={styles.exportThemePreview} style={{ background: '#f5f0ea', borderColor: '#d8d0c8' }}>
            <div style={{ height: 3, background: '#eb5927', borderRadius: '4px 4px 0 0' }} />
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[40, 28, 28].map((w, i) => (
                <div key={i} style={{ height: 3, width: `${w}%`, background: '#1c1410', borderRadius: 2, opacity: 0.25 }} />
              ))}
            </div>
          </div>
          <span className={styles.exportThemeName}>Claro</span>
          <span className={styles.exportThemeDesc}>Para imprimir</span>
        </button>
      </div>
    </Modal>
  ) : null;

  const months = groupByMonth(sorted);

  if (!sorted.length) {
    return (
      <div className={styles.empty}>
        <Ic name="factory" size={44} className={styles.emptyIcon} />
        <div>
          <p className={styles.emptyTitle}>Nenhuma semana registrada</p>
          <p className={styles.emptySub}>Vá para a aba Produção para começar a registrar.</p>
        </div>
      </div>
    );
  }

  // ── Semana view ──────────────────────────────────────────────────────────
  if (view === 'semana') {
    const semana  = sorted[idx];
    const prevSemana = sorted[idx + 1] ?? null;
    const dias = semana.dias || [];
    const totalVendas  = dias.reduce((acc, d) => acc + (Number(d.vendas)  || 0), 0);
    const totalEstoque = dias.reduce((acc, d) => acc + (Number(d.estoque) || 0), 0);
    const totalMilheiros = totalVendas + totalEstoque;
    const totalFornos = countFornos(dias);
    const chartData = dias.map((d, i) => ({
      label:       DAY_NAMES[i],
      vendas:      Number(d.vendas)      || 0,
      estoque:     Number(d.estoque)     || 0,
      emCaminhoes: Number(d.emCaminhoes) || 0,
    }));
    const plano = Array.isArray(semana.plano) && semana.plano.length === 6 ? semana.plano : null;
    const fornosChartData = dias.map((d, i) => {
      const enfornas = d.enfornas ?? (d.enforna ? [d.enforna] : []);
      return {
        label: DAY_NAMES[i],
        real:  enfornas.filter(e => e && e.trim()).length,
        plano: plano ? (Number(plano[i]) || 0) : null,
      };
    });
    const totalLuvas = dias.reduce((acc, d) => acc + (Number(d.luvas) || 0), 0);
    const custoLuvas = totalLuvas * 4.50;
    const luvasChartData = dias.map((d, i) => ({
      label: DAY_NAMES[i],
      pares: Number(d.luvas) || 0,
    }));

    const metaOk = totalFornos >= semana.meta;
    const past   = isWeekPast(semana);

    // Resumo operacional — peak values per day
    const picoPico = dias.reduce((best, d, i) => {
      const v = Number(d.vendas) || 0;
      return v > best.v ? { v, i } : best;
    }, { v: -1, i: -1 });
    const picoEstoque = dias.reduce((best, d, i) => {
      const v = Number(d.estoque) || 0;
      return v > best.v ? { v, i } : best;
    }, { v: -1, i: -1 });
    const picoEnforna = dias.reduce((best, d, i) => {
      const n = Array.isArray(d.enfornas) ? d.enfornas.filter(e => e && e.trim()).length : 0;
      return n > best.n ? { n, i } : best;
    }, { n: -1, i: -1 });
    const picoFunc = dias.reduce((best, d, i) => {
      const v = Number(d.qtdFunc) || 0;
      return v > best.v ? { v, i } : best;
    }, { v: -1, i: -1 });

    return (
      <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
        <div className={styles.topBar}>
          <div className={styles.toggle}>
            <button className={`${styles.toggleBtn} ${styles.toggleActive}`} onClick={() => setView('semana')}>Semana</button>
            <button className={styles.toggleBtn} onClick={() => setView('mes')}>Mês</button>
            <button className={styles.toggleBtn} onClick={() => setView('plano')}>Plano</button>
          </div>
          <div className={styles.navRow}>
            <WeekNavigator
              label={weekLabel(semana)}
              onPrev={() => setIdx(i => Math.min(sorted.length - 1, i + 1))}
              onNext={() => setIdx(i => Math.max(0, i - 1))}
              disablePrev={idx >= sorted.length - 1}
              disableNext={idx <= 0}
            />
            <Btn variant="ghost" size="sm" onClick={() => setExportPicker({ type: 'semana', semana, prevSemana })}>
              <Ic name="download" size={14} /> <span className={styles.btnLabel}>Exportar</span>
            </Btn>
          </div>
        </div>

        <div className={styles.heroCard}>
          <span className={styles.heroLabel}>Total Produzido</span>
          <span className={styles.heroValue}>{totalMilheiros.toFixed(1)} mi</span>
          <div className={styles.heroSplit}>
            <div className={styles.heroSub}>
              <span className={styles.heroSubLabel}>Vendas</span>
              <span className={styles.heroSubVal} style={{ color: 'var(--success)' }}>{totalVendas.toFixed(1)} mi</span>
            </div>
            <div className={styles.heroSubDivider} />
            <div className={styles.heroSub}>
              <span className={styles.heroSubLabel}>Estoque</span>
              <span className={styles.heroSubVal} style={{ color: 'var(--warning)' }}>{totalEstoque.toFixed(1)} mi</span>
            </div>
          </div>
        </div>

        <div className={styles.fornosCard}>
          <div className={styles.fornosHeader}>
            <span className={styles.fornosLabel}>Fornos / Meta</span>
            {metaOk
              ? <span className={`${styles.fornosBadge} ${styles.fornosBadgeOk}`}>✓ meta atingida</span>
              : <span className={`${styles.fornosBadge} ${styles.fornosBadgeWarn}`}>
                  {past ? 'faltou' : 'faltam'} {semana.meta - totalFornos}
                </span>
            }
          </div>
          <div className={styles.fornosCount}>
            <span className={styles.fornosNum}>{totalFornos}</span>
            <span className={styles.fornosDe}>de {semana.meta}</span>
          </div>
          <MetaBar current={totalFornos} meta={semana.meta} />
          <div className={styles.fornosDots}>
            {Array.from({ length: semana.meta }, (_, i) => (
              <span key={i} className={`${styles.dot} ${i < totalFornos ? styles.dotFilled : styles.dotEmpty}`} />
            ))}
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Milheiros por Dia</h2>
          <div className={styles.chartWrap}>
            <BarChart data={chartData} />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Fornos por Dia</h2>
          <div className={styles.chartWrap}>
            <FornosChart data={fornosChartData} />
          </div>
        </section>

        {totalLuvas > 0 && (
          <div className={styles.luvasCard}>
            <div className={styles.luvasHeader}>
              <span className={styles.luvasLabel}>Luvas</span>
              <div className={styles.luvasMeta}>
                <span className={styles.luvasTotal}>{totalLuvas} pares</span>
                <span className={styles.luvasDivider}>·</span>
                <span className={styles.luvasCusto}>
                  {custoLuvas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
            <div className={styles.luvasChartWrap}>
              <LuvasChart data={luvasChartData} />
            </div>
          </div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ocorrências da Semana</h2>
          <OccurrenceList dias={dias} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumo Operacional</h2>
          <div className={styles.resumoCard}>
            {[
              {
                label: 'Pico de vendas',
                show: picoPico.v > 0,
                day: DAY_NAMES[picoPico.i],
                val: `${picoPico.v.toFixed(1)} milh.`,
              },
              {
                label: 'Maior estoque',
                show: picoEstoque.v > 0,
                day: DAY_NAMES[picoEstoque.i],
                val: `${picoEstoque.v.toFixed(1)} milh.`,
              },
              {
                label: 'Maior enfornamento',
                show: picoEnforna.n > 0,
                day: DAY_NAMES[picoEnforna.i],
                val: `${picoEnforna.n} fornos`,
              },
              {
                label: 'Equipe máxima',
                show: picoFunc.v > 0,
                day: DAY_NAMES[picoFunc.i],
                val: `${picoFunc.v} funcs.`,
              },
            ].map(({ label, show, day, val }) => (
              <div key={label} className={styles.resumoRow}>
                <span className={styles.resumoLabel}>{label}</span>
                {show
                  ? <span className={styles.resumoVal}>{day} · {val}</span>
                  : <span className={styles.resumoValDim}>—</span>
                }
              </div>
            ))}
          </div>
        </section>

        {exportThemeModal}
      </div>
    );
  }

  // ── Plano view ───────────────────────────────────────────────────────────
  if (view === 'plano') {
    const semana = sorted[idx];
    return (
      <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
        <div className={styles.topBar}>
          <div className={styles.toggle}>
            <button className={styles.toggleBtn} onClick={() => setView('semana')}>Semana</button>
            <button className={styles.toggleBtn} onClick={() => setView('mes')}>Mês</button>
            <button className={`${styles.toggleBtn} ${styles.toggleActive}`} onClick={() => setView('plano')}>Plano</button>
          </div>
          <div className={styles.navRow}>
            <WeekNavigator
              label={weekLabel(semana)}
              onPrev={() => setIdx(i => Math.min(sorted.length - 1, i + 1))}
              onNext={() => setIdx(i => Math.max(0, i - 1))}
              disablePrev={idx >= sorted.length - 1}
              disableNext={idx <= 0}
            />
          </div>
        </div>
        <DashboardPlano
          semana={semana}
          onUpdateSemana={(patch) => onUpdateSemana(semana.id, patch)}
        />
      </div>
    );
  }

  // ── Mês view ─────────────────────────────────────────────────────────────
  const safeMonthIdx = Math.min(monthIdx, months.length - 1);
  const month = months[safeMonthIdx];
  const mSemanas = month ? [...month.semanas].sort((a, b) => a.numero - b.numero) : [];

  const mVendas  = mSemanas.reduce((acc, s) => acc + (s.dias || []).reduce((a, d) => a + (Number(d.vendas)  || 0), 0), 0);
  const mEstoque = mSemanas.reduce((acc, s) => acc + (s.dias || []).reduce((a, d) => a + (Number(d.estoque) || 0), 0), 0);
  const mMilheiros = mVendas + mEstoque;
  const mFornos  = mSemanas.reduce((acc, s) => acc + countFornos(s.dias || []), 0);
  const mMeta    = mSemanas.reduce((acc, s) => acc + (s.meta || 0), 0);
  const mMetaOk  = mFornos >= mMeta;

  const mChartData = mSemanas.map(s => ({
    label:       `S${s.numero}`,
    vendas:      (s.dias || []).reduce((a, d) => a + (Number(d.vendas)      || 0), 0),
    estoque:     (s.dias || []).reduce((a, d) => a + (Number(d.estoque)     || 0), 0),
    emCaminhoes: (s.dias || []).reduce((a, d) => a + (Number(d.emCaminhoes) || 0), 0),
  }));

  const mDias = mSemanas.flatMap(s => s.dias || []);

  return (
    <div className={styles.root} style={{ animation: 'slideUp 0.2s ease' }}>
      <div className={styles.topBar}>
        <div className={styles.toggle}>
          <button className={styles.toggleBtn} onClick={() => setView('semana')}>Semana</button>
          <button className={`${styles.toggleBtn} ${styles.toggleActive}`} onClick={() => setView('mes')}>Mês</button>
          <button className={styles.toggleBtn} onClick={() => setView('plano')}>Plano</button>
        </div>
        <div className={styles.navRow}>
          <WeekNavigator
            label={month ? month.label : '—'}
            onPrev={() => setMonthIdx(i => Math.min(months.length - 1, i + 1))}
            onNext={() => setMonthIdx(i => Math.max(0, i - 1))}
            disablePrev={safeMonthIdx >= months.length - 1}
            disableNext={safeMonthIdx <= 0}
          />
          <Btn variant="ghost" size="sm" onClick={() => setExportPicker({ type: 'mes', month })}>
            <Ic name="download" size={14} /> <span className={styles.btnLabel}>Exportar</span>
          </Btn>
        </div>
      </div>

      {month && (
        <>
          <div className={styles.heroCard}>
            <span className={styles.heroLabel}>Total Produzido — {month.label}</span>
            <span className={styles.heroValue}>{mMilheiros.toFixed(1)} mi</span>
            <div className={styles.heroSplit}>
              <div className={styles.heroSub}>
                <span className={styles.heroSubLabel}>Vendas</span>
                <span className={styles.heroSubVal} style={{ color: 'var(--success)' }}>{mVendas.toFixed(1)} mi</span>
              </div>
              <div className={styles.heroSubDivider} />
              <div className={styles.heroSub}>
                <span className={styles.heroSubLabel}>Estoque</span>
                <span className={styles.heroSubVal} style={{ color: 'var(--warning)' }}>{mEstoque.toFixed(1)} mi</span>
              </div>
            </div>
          </div>

          <div className={styles.fornosCard}>
            <div className={styles.fornosHeader}>
              <span className={styles.fornosLabel}>Fornos / Meta — {mSemanas.length} semanas</span>
              {mMetaOk
                ? <span className={`${styles.fornosBadge} ${styles.fornosBadgeOk}`}>✓ meta atingida</span>
                : <span className={`${styles.fornosBadge} ${styles.fornosBadgeWarn}`}>
                    faltaram {mMeta - mFornos}
                  </span>
              }
            </div>
            <div className={styles.fornosCount}>
              <span className={styles.fornosNum}>{mFornos}</span>
              <span className={styles.fornosDe}>de {mMeta}</span>
            </div>
            <MetaBar current={mFornos} meta={mMeta} />
          </div>

          {mChartData.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Milheiros por Semana</h2>
              <div className={styles.chartWrap}>
                <BarChart data={mChartData} />
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ocorrências do Mês</h2>
            <OccurrenceList dias={mDias} />
          </section>
        </>
      )}

      {exportThemeModal}
    </div>
  );
}
