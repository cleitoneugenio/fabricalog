import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './modules/dashboard/Dashboard';
import SemanaList from './modules/semana/SemanaList';
import SemanaDetalhe from './modules/semana/SemanaDetalhe';
import PontoList from './modules/ponto/PontoList';
import PontoDetalhe from './modules/ponto/PontoDetalhe';
import EquipeList from './modules/equipe/EquipeList';
import FornoPlanta from './modules/forno/FornoPlanta';
import Camara from './modules/camara/Camara';
import ConfigModal from './modules/configuracoes/ConfigModal';
import MobileMenu from './components/MobileMenu';
import LoginScreen from './modules/auth/LoginScreen';
import CargaList from './modules/carga/CargaList';
import { useSemanaStore } from './store/useSemanaStore';
import { usePontoStore } from './store/usePontoStore';
import { useCarregamentoStore } from './store/useCarregamentoStore';
import { useEmployeeStore } from './store/useEmployeeStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useFornoStore } from './store/useFornoStore';
import { seedAll } from './data/seed';
import { exportBackup, parseBackupFile } from './utils/backup';
import { supabase } from './lib/supabase';
import { pushToCloud, pullFromCloud } from './lib/sync';
import { mergeByUpdatedAt } from './utils/syncMerge';

export default function App() {
  const [module, setModule]           = useState('dash');
  const [semanaId, setSemanaId]       = useState(null);
  const [pontoId, setPontoId]         = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser]               = useState(undefined); // undefined = carregando
  const [syncing, setSyncing]         = useState(false);
  const importRef = useRef();
  const syncTimer = useRef(null);
  const autoBackupDone = useRef(false);

  const semanaStore        = useSemanaStore();
  const pontoStore         = usePontoStore();
  const carregamentoStore  = useCarregamentoStore();
  const employeeStore = useEmployeeStore();
  const settingsStore = useSettingsStore();
  const fornoStore    = useFornoStore();

  // ── Auth: verifica sessão ao montar ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) syncDown();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Pull: merge dados da nuvem com dados locais (last-write-wins por item) ─
  async function syncDown() {
    const data = await pullFromCloud();
    if (!data) return;

    if (data.semanas?.length) {
      const merged = mergeByUpdatedAt(semanaStore.items, data.semanas);
      semanaStore.replaceAll(merged);
    }
    if (data.pontos?.length) {
      const merged = mergeByUpdatedAt(pontoStore.items, data.pontos);
      pontoStore.replaceAll(merged);
    }
    if (data.carregamentos?.length) {
      const merged = mergeByUpdatedAt(carregamentoStore.items, data.carregamentos);
      carregamentoStore.replaceAll(merged);
    }
    if (data.employees?.length) employeeStore.replaceAll(data.employees);
    if (data.settings && Object.keys(data.settings).length) settingsStore.update(data.settings);
    if (data.forno && Object.keys(data.forno).length) fornoStore.replaceAll?.(data.forno);

    scheduleAutoBackup();
  }

  // ── Backup automático diário ─────────────────────────────────────────────
  function scheduleAutoBackup() {
    if (autoBackupDone.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastBackup = localStorage.getItem('fabricalog_auto_backup_date');
    if (lastBackup === today) return;
    autoBackupDone.current = true;
    // Aguarda 4s para os stores estarem populados antes de exportar
    setTimeout(() => {
      exportBackup(
        semanaStore.items,
        pontoStore.items,
        employeeStore.employees,
        settingsStore.settings,
        carregamentoStore.items,
        { silent: true },
      ).then(() => {
        localStorage.setItem('fabricalog_auto_backup_date', today);
      }).catch(() => {
        autoBackupDone.current = false; // permite tentar novamente
      });
    }, 4000);
  }

  // ── Pull automático: tab visível + reconexão + intervalo de 60s ──────────
  const syncDownRef = useRef(syncDown);
  useEffect(() => { syncDownRef.current = syncDown; });

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncDownRef.current();
    };
    const onOnline = () => syncDownRef.current();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') syncDownRef.current();
    }, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [user]);

  // ── Push: envia dados para a nuvem com debounce de 3s ───────────────────
  const scheduleSync = useCallback(() => {
    if (!user) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncing(true);
      await pushToCloud({
        semanas:   semanaStore.items,
        pontos:    pontoStore.items,
        employees: employeeStore.employees,
        settings:  settingsStore.settings,
        forno:     fornoStore.chambers,
        carregamentos: carregamentoStore.items,
      });
      setSyncing(false);
    }, 3000);
  }, [user, semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, fornoStore.chambers, carregamentoStore.items]);

  useEffect(() => {
    scheduleSync();
  }, [semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, fornoStore.chambers, carregamentoStore.items]);

  // ── Navegação ─────────────────────────────────────────────────────────────
  const activeSemanaId = semanaId && semanaStore.getById(semanaId) ? semanaId : null;
  const activePontoId  = pontoId  && pontoStore.getById(pontoId)   ? pontoId  : null;

  function navigate(mod) {
    setModule(mod);
    setSemanaId(null);
    setPontoId(null);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const data = await parseBackupFile(file);
      semanaStore.replaceAll(data.semanas);
      pontoStore.replaceAll(data.pontos);
      if (data.employees)     employeeStore.replaceAll(data.employees);
      if (data.settings)      settingsStore.update(data.settings);
      if (data.carregamentos) carregamentoStore.replaceAll(data.carregamentos);
      navigate('dash');
    } catch (err) {
      alert(`Erro ao importar backup: ${err.message}`);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // ── Estados de carregamento / login ───────────────────────────────────────
  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Carregando...</span>
      </div>
    );
  }

  if (user === null) {
    return <LoginScreen onLogin={() => { supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); if (session?.user) syncDown(); }); }} />;
  }

  // ── Render principal ──────────────────────────────────────────────────────
  function renderContent() {
    if (module === 'dash') return <Dashboard semanas={semanaStore.items} onUpdateSemana={(id, patch) => semanaStore.update(id, patch)} />;

    if (module === 'semana') {
      if (activeSemanaId) {
        const semana = semanaStore.getById(activeSemanaId);
        return (
          <SemanaDetalhe
            semana={semana}
            carregamentos={carregamentoStore.items}
            onBack={() => setSemanaId(null)}
            onUpdateDia={(idx, patch) => semanaStore.updateDia(activeSemanaId, idx, patch)}
            onUpdate={(patch) => semanaStore.update(activeSemanaId, patch)}
            onDelete={() => { semanaStore.remove(activeSemanaId); setSemanaId(null); }}
          />
        );
      }
      return (
        <SemanaList
          semanas={semanaStore.items}
          onCreate={(partial) => { const id = semanaStore.create(partial); setSemanaId(id); }}
          onSelect={setSemanaId}
        />
      );
    }

    if (module === 'ponto') {
      if (activePontoId) {
        const ponto = pontoStore.getById(activePontoId);
        return (
          <PontoDetalhe
            ponto={ponto}
            employees={employeeStore.employees}
            settings={settingsStore.settings}
            onBack={() => setPontoId(null)}
            onUpdateCell={(empId, dayKey, value, nota) => pontoStore.updateCell(activePontoId, empId, dayKey, value, nota)}
            onUpdate={(patch) => pontoStore.update(activePontoId, patch)}
            onDelete={() => { pontoStore.remove(activePontoId); setPontoId(null); }}
          />
        );
      }
      return (
        <PontoList
          pontos={pontoStore.items}
          employees={employeeStore.employees}
          onCreate={(partial) => { const id = pontoStore.create(partial, employeeStore.employees); setPontoId(id); }}
          onSelect={setPontoId}
        />
      );
    }

    if (module === 'carga') return <CargaList store={carregamentoStore} />;

    if (module === 'camara') return <Camara />;

    if (module === 'forno') {
      return (
        <FornoPlanta
          chambers={fornoStore.chambers}
          onSetStatus={fornoStore.setStatus}
          onSetRestante={fornoStore.setRestante}
          onConcluirDescarga={fornoStore.concluirDescarga}
          onResetAll={fornoStore.resetAll}
        />
      );
    }

    if (module === 'equipe') {
      return (
        <EquipeList
          employees={employeeStore.employees}
          onAdd={employeeStore.add}
          onRename={employeeStore.rename}
          onRemove={employeeStore.remove}
        />
      );
    }

    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar
        active={module}
        onChange={navigate}
        syncing={syncing}
        userEmail={user.email}
        onExportBackup={() => exportBackup(semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, carregamentoStore.items)}
        onImportBackup={() => importRef.current?.click()}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <MobileMenu
          hidden={!!(activeSemanaId || activePontoId)}
          syncing={syncing}
          onExportBackup={() => exportBackup(semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, carregamentoStore.items)}
          onImportBackup={() => importRef.current?.click()}
          onOpenSettings={() => setShowSettings(true)}
          onLogout={handleLogout}
        />
        {renderContent()}
      </main>
      <BottomNav active={module} onChange={navigate} />

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      <ConfigModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settingsStore.settings}
        onSave={settingsStore.update}
      />

      {import.meta.env.DEV && (
        <button
          onClick={() => seedAll(semanaStore, pontoStore)}
          style={{
            position: 'fixed', bottom: 72, right: 12,
            background: 'oklch(20% 0.016 38)', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font)',
            cursor: 'pointer', zIndex: 999,
          }}
        >seed</button>
      )}
    </div>
  );
}
