import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { AgentProfile, Ticket, Attachment, DepartmentId } from '../types/support';
import { buildCustomerChatLink, getLeaderChannelCode } from '../utils/channelLinks';
import { ShareCustomerLinkModal } from './ShareCustomerLinkModal';
import { TeamLeaderLoginModal } from './TeamLeaderLoginModal';
import {
  Crown,
  Lock,
  Users,
  UserPlus,
  UserMinus,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  MessageSquare,
  ArrowRightLeft,
  Sliders,
  Sparkles,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Filter,
} from 'lucide-react';

interface Props {
  leaderId: string;
}

export const TeamLeaderIndependentPanel: React.FC<Props> = ({ leaderId }) => {
  const {
    agents,
    tickets,
    messages,
    unlockedLeaderIds,
    lockLeaderSession,
    assignAgentToTeamLeader,
    removeAgentFromTeamLeader,
    createAgentProfile,
    setSelectedAgentTicketId,
    setViewMode,
    sendMessage,
    updateActiveAgentStatus,
    switchActiveAgentProfile,
    answeringAsAgentId,
    setAnsweringAsAgentId,
    changeTicketDepartment,
    transferTicket,
    resolveTicket,
  } = useSupport();

  const leader = agents.find((a) => a.id === leaderId && a.roleType === 'team_leader');
  const isUnlocked = unlockedLeaderIds.includes(leaderId);

  const [activeTab, setActiveTab] = useState<'team' | 'queue' | 'link' | 'security'>('team');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetLoginLeaderId, setTargetLoginLeaderId] = useState<string | null>(null);

  // Link format selection in panel
  const [panelLinkFormat, setPanelLinkFormat] = useState<'short' | 'dept' | 'direct'>('short');

  // Agent assignment controls
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New agent inputs
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentDepartment, setNewAgentDepartment] = useState<DepartmentId>('soporte');

  // Search queue & Category management
  const [ticketSearch, setTicketSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<'all' | 'soporte' | 'procesos' | 'estafa' | 'my_team'>('all');
  const [transferringTicketId, setTransferringTicketId] = useState<string | null>(null);

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // If leader not found or not unlocked
  if (!leader || !isUnlocked) {
    const otherLeaders = agents.filter((a) => a.roleType === 'team_leader');

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Panel Protegido de Team Leader
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-3">
              Autenticación Requerida
            </h2>
            <p className="text-xs text-slate-600 mt-2">
              Para ingresar al panel de supervisión independiente de este Team Leader, debes ingresar su usuario y contraseña únicos.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setTargetLoginLeaderId(leaderId);
                setShowLoginModal(true);
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Desbloquear con Credenciales</span>
            </button>

            <button
              onClick={() => setViewMode('agent')}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Volver a la Consola General
            </button>
          </div>

          {/* Quick info about assigned leaders */}
          <div className="pt-4 border-t border-slate-100 text-left">
            <p className="text-[11px] font-semibold text-slate-500 mb-2">Team Leaders Oficiales:</p>
            <div className="space-y-2">
              {otherLeaders.map((tl) => (
                <div
                  key={tl.id}
                  onClick={() => {
                    setTargetLoginLeaderId(tl.id);
                    setShowLoginModal(true);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-amber-50/50 border border-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <img src={tl.avatar} alt={tl.name} className="w-7 h-7 rounded-md object-cover" />
                    <div className="leading-tight">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-900">{tl.name}</span>
                      <p className="text-[10px] text-slate-500">{tl.departmentName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 group-hover:text-amber-800">
                    Ingresar →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TeamLeaderLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          targetLeaderId={targetLoginLeaderId}
        />
      </div>
    );
  }

  // Assigned team agents
  const assignedAgentIds = leader.assignedAgentIds || [];
  const teamAgents = agents.filter((a) => assignedAgentIds.includes(a.id));
  const maxLimit = leader.maxAgentsLimit || 10;
  const isAtLimit = teamAgents.length >= maxLimit;
  const activeImpersonatedAgent = answeringAsAgentId
    ? agents.find((a) => a.id === answeringAsAgentId)
    : null;

  // Available agents to assign (not already in team)
  const availableToAssign = agents.filter(
    (a) => a.roleType === 'agent' && !assignedAgentIds.includes(a.id)
  );

  // Tickets filtered with global cross-department authority (Soporte, Procesos, Estafa)
  const displayTickets = tickets.filter((t) => {
    if (areaFilter === 'my_team') {
      return (
        t.referredByLeaderId === leader.id ||
        assignedAgentIds.includes(t.assignedAgentId || '')
      );
    }
    if (areaFilter !== 'all') {
      return t.department === areaFilter;
    }
    return true;
  });

  const filteredTickets = displayTickets.filter((t) => {
    if (!ticketSearch.trim()) return true;
    const q = ticketSearch.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.customer.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.departmentName.toLowerCase().includes(q) ||
      (t.assignedAgentName && t.assignedAgentName.toLowerCase().includes(q))
    );
  });

  const referralCount = tickets.filter((t) => t.referredByLeaderId === leader.id).length;

  const handleAssignExisting = (agentId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const res = assignAgentToTeamLeader(leader.id, agentId);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Agente asignado exitosamente a tu equipo a cargo');
      setShowAssignDropdown(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    setErrorMessage(null);
    removeAgentFromTeamLeader(leader.id, agentId);
    setSuccessMessage('Agente desvinculado de tu supervisión');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleQuickTransfer = (ticketId: string, targetAgentId: string) => {
    setErrorMessage(null);
    transferTicket(ticketId, targetAgentId, `Reasignado por el Team Leader ${leader.name}`);
    setTransferringTicketId(null);
    setSuccessMessage(`Ticket ${ticketId} transferido con éxito`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateNewAgent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isAtLimit) {
      setErrorMessage(`Has alcanzado el límite estricto de ${maxLimit} agentes a cargo.`);
      return;
    }

    if (!newAgentName.trim()) {
      setErrorMessage('Por favor ingresa el nombre del agente');
      return;
    }

    const deptNameMap: Record<DepartmentId, string> = {
      soporte: 'Soporte Técnico',
      procesos: 'Área de Procesos',
      estafa: 'Prevención / Estafa',
    };
    const targetDept = newAgentDepartment || leader.department;
    const targetDeptName = deptNameMap[targetDept] || 'Soporte Técnico';

    createAgentProfile({
      name: newAgentName.trim(),
      avatar: '/src/assets/images/agent_carlos_tech_1793027650432.jpg',
      role: newAgentRole.trim() || `Especialista de ${targetDeptName}`,
      roleType: 'agent',
      department: targetDept,
      departmentName: targetDeptName,
      status: 'online',
      statusBio: `Agente asignado bajo la supervisión de ${leader.name}.`,
      email: newAgentEmail.trim() || `${newAgentName.toLowerCase().replace(/\s+/g, '.')}@soporte.empresa.com`,
      cannedResponses: [
        {
          id: `cr-${Date.now()}-1`,
          title: 'Respuesta inicial de protocolo',
          content: `¡Hola! Me encuentro asignado al equipo de ${leader.name}. Con gusto atenderé tu consulta de inmediato.`,
        },
      ],
      teamLeaderId: leader.id,
      teamLeaderName: leader.name,
    });

    setNewAgentName('');
    setNewAgentEmail('');
    setNewAgentRole('');
    setShowNewAgentForm(false);
    setSuccessMessage('Nuevo agente registrado y vinculado a tu equipo');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const customerDirectLink =
    panelLinkFormat === 'direct'
      ? `${currentUrl}/chat-soporte`
      : panelLinkFormat === 'dept'
      ? `${currentUrl}/chat-soporte?c=${leader.department}`
      : `${currentUrl}/chat-soporte?c=${getLeaderChannelCode(leader)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerDirectLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans pb-12">
      {/* Top Navigation Bar of the Independent Panel */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Leader identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={leader.avatar}
                alt={leader.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow-sm"
              />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                <Crown className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Panel Independiente · {leader.name}</span>
                </h1>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 rounded-full">
                  Team Leader Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Departamento: <strong className="text-slate-200">{leader.departmentName}</strong></span>
                <span>·</span>
                <span className="font-mono text-amber-300/90">@{leader.username}</span>
                <span>·</span>
                <span className="text-emerald-400 font-medium">Sesión Autenticada</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Link Exclusivo Clientes</span>
            </button>

            <button
              onClick={() => {
                switchActiveAgentProfile(leader.id);
                setViewMode('agent');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Consola Operativa</span>
            </button>

            <button
              onClick={() => lockLeaderSession(leader.id)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cerrar sesión de este Team Leader y bloquear acceso"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Panel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 text-sm font-bold">×</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold">×</button>
          </div>
        )}

        {/* Impersonation Persona Active Banner */}
        {activeImpersonatedAgent && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-300/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={activeImpersonatedAgent.avatar}
                  alt={activeImpersonatedAgent.name}
                  className="w-10 h-10 rounded-lg object-cover border border-amber-400 shadow-2xs"
                />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950">
                    Modo Delegado Activo: Contestando como {activeImpersonatedAgent.name}
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    {activeImpersonatedAgent.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  El cliente verá las respuestas con el avatar y nombre de <strong>{activeImpersonatedAgent.name}</strong>, mientras conservas tu sesión de Team Leader.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  switchActiveAgentProfile(leader.id);
                  setViewMode('agent');
                }}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Consola de Respuesta</span>
              </button>
              <button
                onClick={() => setAnsweringAsAgentId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Restablecer a mi nombre ({leader.name.split(' ')[0]})
              </button>
            </div>
          </div>
        )}

        {/* Top KPI Metric Cards for this Leader */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Agentes a Cargo</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{teamAgents.length}</span>
              <span className="text-xs text-slate-500 font-medium">/ {maxLimit} máx</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAtLimit ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${(teamAgents.length / maxLimit) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Derivaciones por Enlace</span>
              <Share2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-900">{referralCount}</span>
              <span className="text-xs text-amber-700 font-medium">clientes VIP</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">Canal exclusivo de {leader.name.split(' ')[0]}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Gestión Multisector</span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{tickets.length}</span>
              <span className="text-xs text-slate-500 font-medium">casos globales</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Soporte · Procesos · Estafa
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>SLA & Calificación</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">★ {leader.rating}</span>
              <span className="text-xs text-slate-500 font-medium">~{leader.avgResponseTime}</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">{leader.resolvedCount} resueltos con éxito</p>
          </div>
        </div>

        {/* Navigation Tabs for Independent Panel */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'team'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Mi Equipo a Cargo ({teamAgents.length}/10)</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Bandeja de Supervisión ({displayTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Enlace Exclusivo Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-4 h-4 text-slate-700" />
            <span>Seguridad & Credenciales</span>
          </button>
        </div>

        {/* Tab 1: Mi Equipo a Cargo */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Especialistas asignados al equipo de {leader.name}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    {teamAgents.length} de 10 plazas ocupadas
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Como Team Leader, puedes supervisar, asignar o crear hasta un máximo estricto de 10 agentes a tu cargo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Dropdown to assign existing agent */}
                <div className="relative">
                  <button
                    disabled={isAtLimit}
                    onClick={() => {
                      setShowAssignDropdown(!showAssignDropdown);
                      setShowNewAgentForm(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isAtLimit
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Asignar Agente Existente</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showAssignDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-20 space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Agentes disponibles ({availableToAssign.length})
                      </div>
                      {availableToAssign.length === 0 ? (
                        <p className="p-2 text-xs text-slate-400 text-center">No hay agentes libres para asignar</p>
                      ) : (
                        availableToAssign.map((ag) => (
                          <button
                            key={ag.id}
                            onClick={() => handleAssignExisting(ag.id)}
                            className="w-full p-2 text-left hover:bg-indigo-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <img src={ag.avatar} alt={ag.name} className="w-7 h-7 rounded-md object-cover" />
                            <div className="min-w-0 flex-1 leading-tight">
                              <span className="text-xs font-bold text-slate-900 block truncate">{ag.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{ag.role}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Button to create brand new agent */}
                <button
                  disabled={isAtLimit}
                  onClick={() => {
                    setShowNewAgentForm(!showNewAgentForm);
                    setShowAssignDropdown(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isAtLimit
                      ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo Especialista</span>
                </button>
              </div>
            </div>

            {/* Create new agent form drawer */}
            {showNewAgentForm && (
              <form onSubmit={handleCreateNewAgent} className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>Registrar Nuevo Especialista a Cargo de {leader.name}</span>
                  </h4>
                  <button type="button" onClick={() => setShowNewAgentForm(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Mariana Soler"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Área / Categoría</label>
                    <select
                      value={newAgentDepartment}
                      onChange={(e) => setNewAgentDepartment(e.target.value as DepartmentId)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                    >
                      <option value="soporte">Soporte Técnico</option>
                      <option value="procesos">Área de Procesos</option>
                      <option value="estafa">Prevención / Estafa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Especialidad / Cargo</label>
                    <input
                      type="text"
                      placeholder="ej. Especialista Senior"
                      value={newAgentRole}
                      onChange={(e) => setNewAgentRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Correo Institucional</label>
                    <input
                      type="email"
                      placeholder="mariana.soler@soporte.empresa.com"
                      value={newAgentEmail}
                      onChange={(e) => setNewAgentEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewAgentForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    Guardar y Asignar a mi Equipo
                  </button>
                </div>
              </form>
            )}

            {/* Team Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamAgents.map((ag) => {
                const assignedTickets = tickets.filter((t) => t.assignedAgentId === ag.id);

                return (
                  <div
                    key={ag.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={ag.avatar}
                            alt={ag.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 leading-tight">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{ag.name}</h4>
                            <p className="text-xs text-indigo-600 font-medium truncate">{ag.role}</p>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5 truncate">
                              {ag.email}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAgent(ag.id)}
                          title="Desvincular agente de mi equipo"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          {ag.rating}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {ag.avgResponseTime}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-slate-700">
                          {assignedTickets.length} tickets activos
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Estado: <strong className="text-emerald-600 font-semibold">En línea</strong>
                        </span>
                        <button
                          onClick={() => {
                            switchActiveAgentProfile(leader.id);
                            setViewMode('agent');
                            setSelectedAgentTicketId(assignedTickets[0]?.id || null);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <span>Supervisar</span>
                          <span>→</span>
                        </button>
                      </div>

                      {/* Action to answer as this agent */}
                      {answeringAsAgentId === ag.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              switchActiveAgentProfile(leader.id);
                              setViewMode('agent');
                              setSelectedAgentTicketId(assignedTickets[0]?.id || null);
                            }}
                            className="flex-1 py-1.5 px-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Abrir Consola ({ag.name.split(' ')[0]})</span>
                          </button>
                          <button
                            onClick={() => setAnsweringAsAgentId(null)}
                            title="Desactivar modo delegado"
                            className="py-1.5 px-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            switchActiveAgentProfile(leader.id);
                            setAnsweringAsAgentId(ag.id);
                            setSelectedAgentTicketId(assignedTickets[0]?.id || null);
                            setViewMode('agent');
                          }}
                          className="w-full py-1.5 px-2.5 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                          <span>Contestar como {ag.name.split(' ')[0]}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {teamAgents.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No tienes agentes asignados a tu cargo aún</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Usa las opciones superiores para vincular agentes existentes o crear un nuevo especialista (máximo 10).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Bandeja de Supervisión Multisector */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Bandeja de Supervisión Multisector
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Soporte · Procesos · Estafa
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestiona, reclasifica de área, transfiere e interviene en cualquier caso de la organización sin restricción de categoría.
                </p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, ID o asunto..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Category / Area Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Área:
              </span>
              {[
                { id: 'all', label: 'Todas las Áreas', count: tickets.length },
                { id: 'soporte', label: 'Soporte', count: tickets.filter((t) => t.department === 'soporte').length },
                { id: 'procesos', label: 'Procesos', count: tickets.filter((t) => t.department === 'procesos').length },
                { id: 'estafa', label: 'Estafa / Fraude', count: tickets.filter((t) => t.department === 'estafa').length },
                {
                  id: 'my_team',
                  label: 'Mi Equipo & VIP',
                  count: tickets.filter(
                    (t) => assignedAgentIds.includes(t.assignedAgentId || '') || t.referredByLeaderId === leader.id
                  ).length,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAreaFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    areaFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      areaFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {filteredTickets.map((t) => {
                const isTransferringThis = transferringTicketId === t.id;

                return (
                  <div
                    key={t.id}
                    className="py-3 px-2 hover:bg-slate-50/80 rounded-lg transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">{t.subject}</span>

                          {/* Colored Department Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.department === 'soporte'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : t.department === 'procesos'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {t.departmentName}
                          </span>

                          {t.referredByLeaderId === leader.id && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" />
                              VIP Referral
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>
                            Cliente: <strong className="text-slate-700">{t.customer.name}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Asignado a: <strong className="text-indigo-600">{t.assignedAgentName || 'Sin asignar'}</strong>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[11px]">
                            {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Area Reclassifier Dropdown */}
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Área:</span>
                          <select
                            value={t.department}
                            onChange={(e) => changeTicketDepartment(t.id, e.target.value as any)}
                            className="text-xs font-bold text-slate-800 bg-transparent cursor-pointer focus:outline-none"
                            title="Reclasificar ticket a otra área"
                          >
                            <option value="soporte">Soporte</option>
                            <option value="procesos">Procesos</option>
                            <option value="estafa">Estafa</option>
                          </select>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : t.status === 'in_progress'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.status === 'pending' ? 'Pendiente' : t.status === 'in_progress' ? 'En Atención' : 'Resuelto'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {t.assignedAgentId && (
                            <button
                              onClick={() => {
                                switchActiveAgentProfile(leader.id);
                                if (t.assignedAgentId) {
                                  setAnsweringAsAgentId(t.assignedAgentId);
                                }
                                setSelectedAgentTicketId(t.id);
                                setViewMode('agent');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title={`Contestar a este cliente con el avatar y nombre de ${t.assignedAgentName || 'el agente asignado'}`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-700" />
                              <span>Contestar como {t.assignedAgentName ? t.assignedAgentName.split(' ')[0] : 'Agente'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              switchActiveAgentProfile(leader.id);
                              setSelectedAgentTicketId(t.id);
                              setViewMode('agent');
                            }}
                            className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Intervenir
                          </button>

                          <button
                            onClick={() => setTransferringTicketId(isTransferringThis ? null : t.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Reasignar a otro agente"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                            <span>Transferir</span>
                          </button>

                          {t.status !== 'resolved' && (
                            <button
                              onClick={() => resolveTicket(t.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Marcar este caso como resuelto"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Resolver</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Quick Transfer Tray */}
                    {isTransferringThis && (
                      <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                            Selecciona el especialista al cual transferir el ticket {t.id}:
                          </span>
                          <button
                            onClick={() => setTransferringTicketId(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕ Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {agents
                            .filter((a) => a.roleType === 'agent')
                            .map((ag) => (
                              <button
                                key={ag.id}
                                onClick={() => handleQuickTransfer(t.id, ag.id)}
                                className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer flex items-center gap-2 group"
                              >
                                <img src={ag.avatar} alt={ag.name} className="w-6 h-6 rounded-md object-cover" />
                                <div className="min-w-0 leading-tight">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 block truncate">
                                    {ag.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {ag.departmentName}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No se encontraron tickets en esta categoría o con los criterios de búsqueda.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Enlace Exclusivo Clientes */}
        {activeTab === 'link' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Enlace Corto y Genérico para Clientes · Canal de Soporte
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Sin nombres personales
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Comparte este enlace corto y limpio con tus clientes. Al ingresar a través de este link,
                  el cliente accede directamente al chat de soporte con atención prioritaria y la consulta se deriva
                  automáticamente a los agentes de tu equipo a cargo, manteniendo la confidencialidad de los nombres de los supervisores.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enlace de Chat Genérico
                </label>
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPanelLinkFormat('short')}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      panelLinkFormat === 'short'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Corto (?c={getLeaderChannelCode(leader)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelLinkFormat('dept')}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      panelLinkFormat === 'dept'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Por Área (?c={leader.department})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelLinkFormat('direct')}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      panelLinkFormat === 'direct'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Directo (/chat-soporte)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={customerDirectLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-800 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Formato: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">{customerDirectLink}</code> · Totalmente genérico y confidencial
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-amber-50/50">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  Atención Prioritaria
                </h4>
                <p className="text-slate-600 mt-1 text-[11px]">
                  El cliente recibe bienvenida de canal prioritario con distintivo de atención verificada sin exponer nombres privados de supervisión.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-indigo-50/50">
                <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Enrutamiento Preferente
                </h4>
                <p className="text-slate-600 mt-1 text-[11px]">
                  El ticket se asigna directamente a uno de los {teamAgents.length} agentes a tu cargo con prioridad alta.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-emerald-50/50">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Métricas Propias
                </h4>
                <p className="text-slate-600 mt-1 text-[11px]">
                  Registra {referralCount} clientes referidos y fidelizados bajo tu canal de supervisión.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Seguridad & Credenciales */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Credenciales Únicas de Team Leader
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cada Team Leader cuenta con un usuario y contraseña únicos para garantizar que únicamente el supervisor autorizado pueda acceder a este panel independiente.
                </p>
              </div>
            </div>

            <div className="max-w-xl bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Team Leader:</span>
                <span className="text-xs font-bold text-slate-900">{leader.name}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Usuario Único:</span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  {leader.username}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Contraseña Asignada:</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  •••••••••••• (Cifrada)
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Correo Oficial:</span>
                <span className="text-xs font-mono text-slate-700">{leader.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Límite de Agentes a Cargo:</span>
                <span className="text-xs font-bold text-indigo-700">{maxLimit} agentes estrictos</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => lockLeaderSession(leader.id)}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear y Cerrar Sesión de este Panel</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ShareCustomerLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        teamLeader={leader}
      />
    </div>
  );
};
