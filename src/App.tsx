import React, { useState, useEffect } from 'react';
import { SupportProvider, useSupport } from './context/SupportContext';
import { CustomerChatView } from './components/CustomerChatView';
import { AgentConsoleView } from './components/AgentConsoleView';
import { AgentProfileSwitcher } from './components/AgentProfileSwitcher';
import { ProfilesDirectoryModal } from './components/ProfilesDirectoryModal';
import { TeamLeaderManagementModal } from './components/TeamLeaderManagementModal';
import { CustomerFaqModal } from './components/CustomerFaqModal';
import { TeamLeaderIndependentPanel } from './components/TeamLeaderIndependentPanel';
import { TeamLeaderLoginModal } from './components/TeamLeaderLoginModal';
import { sound } from './services/sound';
import { resolveLeaderFromQuery } from './utils/channelLinks';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  MessageSquare,
  Headphones,
  HelpCircle,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Crown,
  Lock,
} from 'lucide-react';

function AppContent() {
  const {
    agents,
    viewMode,
    setViewMode,
    activeLeaderId,
    setActiveLeaderId,
    activeAgent,
    unlockedLeaderIds,
    resetDemoData,
    isConnected,
    setActiveCustomerTicketId,
  } = useSupport();

  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
  const [teamLeaderModalOpen, setTeamLeaderModalOpen] = useState(false);
  const [customerFaqOpen, setCustomerFaqOpen] = useState(false);
  const [leaderAuthModalOpen, setLeaderAuthModalOpen] = useState(false);
  const [targetAuthLeaderId, setTargetAuthLeaderId] = useState<string | null>(null);

  // Check URL query parameters and pathname on load to support direct links:
  // e.g. /leader or /team-leader or /agente or /chat-soporte or /?portal=leader
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal');
      const channelParam =
        params.get('c') ||
        params.get('canal') ||
        params.get('ref') ||
        params.get('ch') ||
        params.get('leader');

      if (channelParam) {
        const matched = resolveLeaderFromQuery(agents, channelParam);
        if (matched) {
          setActiveLeaderId(matched.id);
        }
      }

      // 1. Direct path, hash, or param for Team Leader panel
      const hash = window.location.hash.toLowerCase();
      if (
        pathname.includes('/leader') ||
        pathname.includes('/team-leader') ||
        pathname.includes('/supervision') ||
        pathname.includes('/admin') ||
        hash.includes('leader') ||
        hash.includes('team-leader') ||
        hash.includes('admin') ||
        hash.includes('supervision') ||
        portalParam === 'leader' ||
        portalParam === 'team_leader' ||
        portalParam === 'supervision'
      ) {
        const leaderSpecific = params.get('leader') || params.get('tl') || params.get('id');
        if (leaderSpecific) {
          setActiveLeaderId(leaderSpecific);
        }
        setViewMode('leader');
        return;
      }

      // 2. Direct path, hash, or param for Agent console
      if (
        pathname.includes('/agente') ||
        pathname.includes('/agent') ||
        pathname.includes('/consola') ||
        hash.includes('agente') ||
        hash.includes('agent') ||
        portalParam === 'agente' ||
        portalParam === 'agent'
      ) {
        setViewMode('agent');
        return;
      }

      // 3. Default or /chat-soporte -> Customer portal
      setViewMode('client');
    }
  }, [agents, setViewMode, setActiveLeaderId]);

  // Listen to hash changes (e.g. user types #leader or #agente without full reload)
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('leader') || h.includes('team-leader') || h.includes('admin') || h.includes('supervision')) {
        setViewMode('leader');
      } else if (h.includes('agente') || h.includes('agent')) {
        setViewMode('agent');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setViewMode]);

  // Global discrete shortcut (Alt + L) for staff/leaders
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && (e.key === 'l' || e.key === 'L')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L'))
      ) {
        e.preventDefault();
        setTargetAuthLeaderId('leader-jeremy');
        setLeaderAuthModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  /* =========================================================================
     1. PORTAL EXCLUSIVO PARA CLIENTES (Zero Agent Options, Sin Simulador)
     El cliente únicamente ve su chat, departamentos y asistencia.
     ========================================================================= */
  if (viewMode === 'client') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
        {/* Customer Header */}
        <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
          {/* Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                Centro de Atención al Cliente
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Soporte · Procesos · Estafa
              </span>
            </div>
          </div>

          {/* Customer Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCustomerFaqOpen(true)}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              Preguntas Frecuentes
            </button>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Soporte en Vivo Disponible
            </span>
          </nav>

          {/* Customer Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={toggleSound}
              title={isMuted ? 'Activar sonido de mensajes' : 'Silenciar notificaciones'}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => setActiveCustomerTicketId(null)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Nueva Consulta</span>
              <span className="xs:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        {/* Customer Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto flex flex-col h-[calc(100vh-105px)]">
          <CustomerChatView />
        </main>

        {/* Customer Footer */}
        <footer className="px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Atención segura con cifrado punto a punto · Soporte en vivo 24/7</span>
          </div>

          <div className="text-slate-400 text-[11px] flex items-center gap-2.5">
            <span>Centro Oficial de Atención al Cliente · Confidencialidad y Privacidad Garantizada</span>
            <button
              onClick={() => {
                setTargetAuthLeaderId('leader-jeremy');
                setLeaderAuthModalOpen(true);
              }}
              title="Acceso de Supervisión (Team Leaders) · También puedes usar Alt + L"
              className="text-slate-300 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </footer>

        {/* Customer FAQs Modal */}
        <CustomerFaqModal
          isOpen={customerFaqOpen}
          onClose={() => setCustomerFaqOpen(false)}
          onSelectTopic={(_topic) => {
            setActiveCustomerTicketId(null);
          }}
        />

        {/* Team Leader Login Modal for discrete access from client view */}
        <TeamLeaderLoginModal
          isOpen={leaderAuthModalOpen}
          onClose={() => setLeaderAuthModalOpen(false)}
          targetLeaderId={targetAuthLeaderId}
          onSuccess={(leader) => {
            setActiveLeaderId(leader.id);
            setViewMode('leader');
          }}
        />
      </div>
    );
  }

  /* =========================================================================
     2. PANEL INDEPENDIENTE DE TEAM LEADER (Protected Supervisor Dashboard)
     Cada Team Leader ingresa a su propio panel con sus credenciales únicas.
     ========================================================================= */
  if (viewMode === 'leader') {
    const leaderToDisplay = activeLeaderId || (activeAgent.roleType === 'team_leader' ? activeAgent.id : 'leader-jeremy');

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
        {/* Leader Top Switcher Sub-header */}
        <div className="bg-slate-950 px-6 py-2 text-white border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              Portal de Team Leaders
            </span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Cambiar de panel:</span>
              <button
                onClick={() => {
                  if (unlockedLeaderIds.includes('leader-jeremy')) {
                    setActiveLeaderId('leader-jeremy');
                  } else {
                    setTargetAuthLeaderId('leader-jeremy');
                    setLeaderAuthModalOpen(true);
                  }
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  leaderToDisplay === 'leader-jeremy'
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Jeremy Adams (Soporte)
              </button>
              <button
                onClick={() => {
                  if (unlockedLeaderIds.includes('leader-lucas')) {
                    setActiveLeaderId('leader-lucas');
                  } else {
                    setTargetAuthLeaderId('leader-lucas');
                    setLeaderAuthModalOpen(true);
                  }
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  leaderToDisplay === 'leader-lucas'
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Lucas Wilder (Procesos)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('agent')}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Consola Operativa de Agentes →
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setViewMode('client')}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Portal Clientes</span>
            </button>
          </div>
        </div>

        <TeamLeaderIndependentPanel leaderId={leaderToDisplay} />

        <TeamLeaderLoginModal
          isOpen={leaderAuthModalOpen}
          onClose={() => setLeaderAuthModalOpen(false)}
          targetLeaderId={targetAuthLeaderId}
          onSuccess={(leader) => {
            setActiveLeaderId(leader.id);
          }}
        />
      </div>
    );
  }

  /* =========================================================================
     3. CONSOLA DE AGENTES (General Agent Workspace)
     Gestión de colas, selección de perfil de soporte, Team Leaders y macros.
     ========================================================================= */
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Agent Header */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 bg-white border-b border-slate-200 shadow-2xs sticky top-0 z-30">
        {/* Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Headphones className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 block">
              SoportePro Console
            </span>
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider block">
              Área de Agentes
            </span>
          </div>
        </div>

        {/* Navigation & Tools */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setDirectoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Perfiles de Soporte
          </button>

          <button
            onClick={() => {
              if (activeAgent.roleType === 'team_leader' && unlockedLeaderIds.includes(activeAgent.id)) {
                setActiveLeaderId(activeAgent.id);
                setViewMode('leader');
              } else {
                setTargetAuthLeaderId('leader-jeremy');
                setLeaderAuthModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Paneles Team Leaders (Jeremy / Lucas)</span>
          </button>

          <button
            onClick={() => setTeamLeaderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Gestión de Equipos
          </button>

          <button
            onClick={() => setViewMode('client')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Abrir como lo vería un cliente"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            Ver Portal de Clientes
          </button>
        </nav>

        {/* Agent Controls & Profile Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Activar sonido' : 'Silenciar notificaciones'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={resetDemoData}
            title="Reiniciar datos de soporte"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'En Línea' : 'Reconectando'}</span>
          </div>

          {/* Profile Switcher: pick which agent or Team Leader to connect from */}
          <AgentProfileSwitcher variant="header" />
        </div>
      </header>

      {/* Agent Viewport */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1750px] w-full mx-auto flex flex-col h-[calc(100vh-58px)]">
        <AgentConsoleView />
      </main>

      {/* Profiles Directory Modal */}
      <ProfilesDirectoryModal
        isOpen={directoryModalOpen}
        onClose={() => setDirectoryModalOpen(false)}
      />

      {/* Team Leader Management Modal */}
      <TeamLeaderManagementModal
        isOpen={teamLeaderModalOpen}
        onClose={() => setTeamLeaderModalOpen(false)}
      />

      {/* Leader Auth Modal */}
      <TeamLeaderLoginModal
        isOpen={leaderAuthModalOpen}
        onClose={() => setLeaderAuthModalOpen(false)}
        targetLeaderId={targetAuthLeaderId}
        onSuccess={(leader) => {
          setActiveLeaderId(leader.id);
          setViewMode('leader');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <SupportProvider>
      <AppContent />
    </SupportProvider>
  );
}
