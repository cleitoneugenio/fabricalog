import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './components/Modal';
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
  const [isViewer, setIsViewer]           = useState(false);
  const [isEditor, setIsEditor]           = useState(false);
  const [viewerScopes, setViewerScopes]   = useState(null);
  const [viewerInvites, setViewerInvites] = useState([]);
  const [activeOwnerId, setActiveOwnerId] = useState(null);
  const [activeForno, setActiveForno]     = useState(null);  // chave do forno ativo ('cedan', 'continuo'…)
  const [adminFornos, setAdminFornos]     = useState([]);    // [{key, label}] — para o seletor do admin
  const [dataOwnerId, setDataOwnerId]     = useState(null);  // user_id do dono dos dados (admin/editor→admin)
  const [showFornoPicker, setShowFornoPicker] = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const importRef = useRef();
  const syncTimer = useRef(null);
  const autoBackupDone = useRef(false);
  const sessionReady = useRef(false); // bloqueia push durante troca de usuário

  const semanaStore        = useSemanaStore();
  const pontoStore         = usePontoStore();
  const carregamentoStore  = useCarregamentoStore();
  const employeeStore = useEmployeeStore();
  const settingsStore = useSettingsStore();
  const fornoStore    = useFornoStore();

  // ── Auth: verifica sessão ao montar ──────────────────────────────────────
  function clearDataStores() {
    semanaStore.replaceAll([]);
    pontoStore.replaceAll([]);
    carregamentoStore.replaceAll([]);
    employeeStore.replaceAll([]);
    fornoStore.replaceAll?.({});
  }

  function clearLocalStores() {
    sessionReady.current = false;
    clearDataStores();
    settingsStore.reset();
    setIsViewer(false);
    setIsEditor(false);
    setViewerScopes(null);
    setViewerInvites([]);
    setActiveOwnerId(null);
    setActiveForno(null);
    setAdminFornos([]);
    setDataOwnerId(null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) syncDown();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) syncDownRef.current();
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Pull: merge dados da nuvem com dados locais (last-write-wins por item) ─
  // replace=true: usado na troca de forno — sempre sobrescreve os stores locais
  async function syncDown(ownerId = null, fornoKey = null, replace = false) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    const prevId = localStorage.getItem('fabricalog_session_user');
    if (prevId !== currentUser.id) {
      clearLocalStores();
      localStorage.setItem('fabricalog_session_user', currentUser.id);
    }

    const resolvedOwnerId = ownerId ?? activeOwnerId ?? null;
    const resolvedForno   = fornoKey ?? activeForno ?? null;
    const data = await pullFromCloud(resolvedForno, resolvedOwnerId);
    if (!data) { sessionReady.current = true; return; }

    setIsViewer(data.isViewer ?? false);
    setIsEditor(data.isEditor ?? false);
    setViewerScopes(data.viewerScopes ?? null);
    setViewerInvites(data.viewerInvites ?? []);
    if (data.activeOwnerId) setActiveOwnerId(data.activeOwnerId);
    if (data.activeForno)   setActiveForno(data.activeForno);
    if (data.adminFornos)   setAdminFornos(data.adminFornos);
    if (data.adminUserId)   setDataOwnerId(data.adminUserId);

    if (data.needsFornoPicker) {
      setShowFornoPicker(true);
      return;
    }

    if (replace) {
      // Troca de forno: sobrescreve completamente, inclusive com arrays vazios
      semanaStore.replaceAll(data.semanas ?? []);
      pontoStore.replaceAll(data.pontos ?? []);
      carregamentoStore.replaceAll(data.carregamentos ?? []);
      employeeStore.replaceAll(data.employees ?? []);
      fornoStore.replaceAll?.(data.forno ?? {});
    } else {
      // Sync normal: merge last-write-wins (não apaga dados locais com remote vazio)
      if (data.semanas?.length) {
        semanaStore.replaceAll(data.isViewer ? data.semanas : mergeByUpdatedAt(semanaStore.items, data.semanas));
      }
      if (data.pontos?.length) {
        pontoStore.replaceAll(data.isViewer ? data.pontos : mergeByUpdatedAt(pontoStore.items, data.pontos));
      }
      if (data.carregamentos?.length) {
        carregamentoStore.replaceAll(data.isViewer ? data.carregamentos : mergeByUpdatedAt(carregamentoStore.items, data.carregamentos));
      }
      if (data.employees?.length) employeeStore.replaceAll(data.employees);
      if (data.forno && Object.keys(data.forno).length) fornoStore.replaceAll?.(data.forno);
    }
    if (data.settings && Object.keys(data.settings).length) settingsStore.update(data.settings);

    sessionReady.current = true;
    if (!data.isViewer) scheduleAutoBackup();
  }

  function switchForno(fornoKey) {
    setShowFornoPicker(false);
    sessionReady.current = false; // bloqueia push enquanto troca de forno
    setActiveForno(fornoKey);
    syncDown(null, fornoKey, true); // replace=true: não mescla com dados do forno anterior
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

  // Mantém adminFornos em sincronia com settings local (sem esperar cloud sync)
  const settingsFornoList = settingsStore.settings?.fornoList;
  useEffect(() => {
    if (!isViewer && !isEditor && settingsFornoList?.length) {
      setAdminFornos(settingsFornoList);
    }
  }, [settingsFornoList, isViewer, isEditor]);

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
    if (!user || isViewer || !sessionReady.current) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncing(true);
      await pushToCloud({
        adminUserId:   dataOwnerId,
        fornoKey:      activeForno ?? 'cedan',
        semanas:       semanaStore.items,
        pontos:        pontoStore.items,
        employees:     employeeStore.employees,
        settings:      settingsStore.settings,
        forno:         fornoStore.chambers,
        carregamentos: carregamentoStore.items,
      });
      setSyncing(false);
    }, 3000);
  }, [user, isViewer, dataOwnerId, activeForno, semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, fornoStore.chambers, carregamentoStore.items]);

  useEffect(() => {
    scheduleSync();
  }, [semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, fornoStore.chambers, carregamentoStore.items]);

  // ── Navegação ─────────────────────────────────────────────────────────────
  const activeSemanaId = semanaId && semanaStore.getById(semanaId) ? semanaId : null;
  const activePontoId  = pontoId  && pontoStore.getById(pontoId)   ? pontoId  : null;

  const modulosAtivos = settingsStore.settings?.modulosAtivos ?? null;

  // Opções de forno para o seletor (admin usa adminFornos; viewer/editor usa viewerInvites)
  const fornoOptions = (isViewer || isEditor)
    ? viewerInvites.map(inv => ({ key: inv.forno_key ?? 'cedan', label: inv.label ?? inv.forno_key ?? 'Forno' }))
    : adminFornos;

  const hasScope = (mod) => {
    if (isViewer || isEditor) return (viewerScopes ?? []).includes(mod);
    if (modulosAtivos) return modulosAtivos.includes(mod);
    return true;
  };

  function navigate(mod) {
    if (!hasScope(mod)) return;
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
    if (!hasScope(module)) return null;

    if (module === 'dash') return <Dashboard semanas={semanaStore.items} onUpdateSemana={(id, patch) => semanaStore.update(id, patch)} />;

    if (module === 'semana') {
      if (activeSemanaId) {
        const semana = semanaStore.getById(activeSemanaId);
        return (
          <SemanaDetalhe
            semana={semana}
            carregamentos={carregamentoStore.items}
            isViewer={isViewer}
            onBack={() => setSemanaId(null)}
            onUpdateDia={isViewer ? undefined : (idx, patch) => semanaStore.updateDia(activeSemanaId, idx, patch)}
            onUpdate={isViewer ? undefined : (patch) => semanaStore.update(activeSemanaId, patch)}
            onDelete={isViewer ? undefined : () => { semanaStore.remove(activeSemanaId); setSemanaId(null); }}
          />
        );
      }
      return (
        <SemanaList
          semanas={semanaStore.items}
          isViewer={isViewer}
          onCreate={isViewer ? undefined : (partial) => { const id = semanaStore.create(partial); setSemanaId(id); }}
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
            isViewer={isViewer}
            onBack={() => setPontoId(null)}
            onUpdateCell={isViewer ? undefined : (empId, dayKey, value, nota) => pontoStore.updateCell(activePontoId, empId, dayKey, value, nota)}
            onUpdateBonusValor={isViewer ? undefined : (empId, valor) => pontoStore.updateBonusValor(activePontoId, empId, valor)}
            onUpdate={isViewer ? undefined : (patch) => pontoStore.update(activePontoId, patch)}
            onDelete={isViewer ? undefined : () => { pontoStore.remove(activePontoId); setPontoId(null); }}
          />
        );
      }
      return (
        <PontoList
          pontos={pontoStore.items}
          employees={employeeStore.employees}
          isViewer={isViewer}
          onCreate={isViewer ? undefined : (partial) => { const id = pontoStore.create(partial, employeeStore.activeEmployees); setPontoId(id); }}
          onSelect={setPontoId}
        />
      );
    }

    if (module === 'carga') return <CargaList store={carregamentoStore} isViewer={isViewer} />;

    if (module === 'camara') return <Camara />;

    if (module === 'forno') {
      return (
        <FornoPlanta
          chambers={fornoStore.chambers}
          isViewer={isViewer}
          onSetStatus={isViewer ? undefined : fornoStore.setStatus}
          onSetRestante={isViewer ? undefined : fornoStore.setRestante}
          onConcluirDescarga={isViewer ? undefined : fornoStore.concluirDescarga}
          onResetAll={isViewer ? undefined : fornoStore.resetAll}
        />
      );
    }

    if (module === 'equipe') {
      return (
        <EquipeList
          employees={employeeStore.employees}
          isViewer={isViewer}
          onAdd={isViewer ? undefined : employeeStore.add}
          onRename={isViewer ? undefined : employeeStore.rename}
          onRemove={isViewer ? undefined : employeeStore.remove}
          onReactivate={isViewer ? undefined : employeeStore.reactivate}
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
        isViewer={isViewer}
        isEditor={isEditor}
        viewerScopes={viewerScopes}
        modulosAtivos={modulosAtivos}
        fornoOptions={fornoOptions}
        activeForno={activeForno}
        onSwitchForno={switchForno}
        onExportBackup={() => exportBackup(semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, carregamentoStore.items)}
        onImportBackup={() => importRef.current?.click()}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <MobileMenu
          hidden={!!(activeSemanaId || activePontoId)}
          syncing={syncing}
          isViewer={isViewer}
          isEditor={isEditor}
          onExportBackup={() => exportBackup(semanaStore.items, pontoStore.items, employeeStore.employees, settingsStore.settings, carregamentoStore.items)}
          onImportBackup={() => importRef.current?.click()}
          onOpenSettings={() => setShowSettings(true)}
          onLogout={handleLogout}
        />
        {renderContent()}
      </main>
      <BottomNav active={module} onChange={navigate} isViewer={isViewer} isEditor={isEditor} viewerScopes={viewerScopes} modulosAtivos={modulosAtivos} />

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      <ConfigModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settingsStore.settings}
        onSave={settingsStore.update}
        isViewer={isViewer}
        isEditor={isEditor}
        user={user}
        adminFornos={adminFornos}
        activeForno={activeForno}
        fornoOptions={fornoOptions}
        onSwitchForno={switchForno}
      />

      {/* Forno picker — aparece quando há múltiplos fornos e nenhum selecionado */}
      <Modal
        open={showFornoPicker}
        onClose={activeForno ? () => setShowFornoPicker(false) : () => {}}
        title="Selecionar Forno"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
            Você tem acesso a múltiplos fornos. Selecione qual deseja visualizar.
          </p>
          {fornoOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => switchForno(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1px solid ${opt.key === activeForno ? 'var(--accent)' : 'var(--border)'}`,
                background: opt.key === activeForno ? 'var(--accent-dim)' : 'oklch(17% 0.018 38)',
                fontFamily: 'var(--font)', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: opt.key === activeForno ? 'var(--accent)' : 'var(--text)' }}>
                {opt.label}
              </span>
              {opt.key === activeForno && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ativo
                </span>
              )}
            </button>
          ))}
        </div>
      </Modal>

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
