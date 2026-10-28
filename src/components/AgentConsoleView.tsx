import React, { useState, useRef, useEffect } from 'react';
import { useSupport } from '../context/SupportContext';
import { Ticket, Attachment } from '../types/support';
import { TransferTicketModal } from './TransferTicketModal';
import { AgentProfileSwitcher } from './AgentProfileSwitcher';
import { TeamLeaderManagementModal } from './TeamLeaderManagementModal';
import { ShareCustomerLinkModal } from './ShareCustomerLinkModal';
import {
  Send,
  Lock,
  MessageSquare,
  Search,
  CheckCircle2,
  ArrowRightLeft,
  User,
  Clock,
  Sparkles,
  Paperclip,
  CheckCheck,
  X,
  FileText,
  UserCheck,
  Building,
  MapPin,
  Laptop,
  Crown,
  Users,
  Share2,
  Link,
  ChevronDown,
} from 'lucide-react';

interface Props {
  isEmbedded?: boolean;
}

export const AgentConsoleView: React.FC<Props> = ({ isEmbedded = false }) => {
  const {
    agents,
    tickets,
    messages,
    activeAgent,
    activeAgentId,
    answeringAsAgentId,
    setAnsweringAsAgentId,
    selectedAgentTicketId,
    setSelectedAgentTicketId,
    sendMessage,
    takeTicket,
    resolveTicket,
    changeTicketDepartment,
    sendTyping,
    typingUsers,
    lockLeaderSession,
    setViewMode,
    setActiveLeaderId,
  } = useSupport();

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'mine' | 'team' | 'resolved'>('all');
  const [deptFilter, setDeptFilter] = useState<'all' | 'soporte' | 'procesos' | 'estafa'>('all');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isLeader = activeAgent.roleType === 'team_leader';
  const myTeamAgentIds = activeAgent.assignedAgentIds || [];
  const [impersonateDropdownOpen, setImpersonateDropdownOpen] = useState(false);

  const impersonatedAgent =
    isLeader && answeringAsAgentId
      ? agents.find((a) => a.id === answeringAsAgentId)
      : null;
  const effectiveSender = impersonatedAgent || activeAgent;

  // Leaders have global authority across all support, procesos, and estafa specialists
  const teamAgentsList = agents.filter((a) => a.roleType === 'agent');

  // Active ticket
  const currentTicket = tickets.find((t) => t.id === selectedAgentTicketId) || tickets[0] || null;
  const currentMessages = (currentTicket && messages[currentTicket.id]) || [];

  // Composer mode: Public reply vs Internal note
  const [composerMode, setComposerMode] = useState<'reply' | 'internal_note'>('reply');
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, typingUsers]);

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (deptFilter !== 'all' && t.department !== deptFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchCustomer = t.customer.name.toLowerCase().includes(q) || t.customer.email.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      if (!matchSubject && !matchCustomer && !matchId) return false;
    }

    if (filterTab === 'pending') return t.status === 'pending';
    if (filterTab === 'mine') return t.assignedAgentId === activeAgentId;
    if (filterTab === 'team') return myTeamAgentIds.includes(t.assignedAgentId || '') || t.referredByLeaderId === activeAgent.id;
    if (filterTab === 'resolved') return t.status === 'resolved';
    return true;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (currentTicket && composerMode === 'reply') {
      sendTyping(currentTicket.id, e.target.value.length > 0, 'agent');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentTicket) return;
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const text = inputText;
    const files = attachedFiles.length > 0 ? [...attachedFiles] : undefined;
    const isNote = composerMode === 'internal_note';

    setInputText('');
    setAttachedFiles([]);
    sendTyping(currentTicket.id, false, 'agent');

    await sendMessage(currentTicket.id, text, isNote ? 'internal_note' : 'agent', files);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Insert canned macro
  const handleInsertMacro = (macroText: string) => {
    setInputText(macroText);
  };

  const handleSimulateAttachment = () => {
    const sampleFiles: Attachment[] = [
      { name: 'guia_resolucion_incidencia.pdf', url: '#', size: '320 KB', type: 'application/pdf' },
      { name: 'diagrama_arquitectura_api.png', url: '#', size: '512 KB', type: 'image/png' },
    ];
    const rand = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    setAttachedFiles((prev) => [...prev, rand]);
  };

  // Check client typing
  const currentTyping = currentTicket ? typingUsers[currentTicket.id] || [] : [];
  const clientTypers = currentTyping.filter((t) => t.senderType === 'customer');

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const myAssignedCount = tickets.filter((t) => t.assignedAgentId === activeAgentId).length;

  return (
    <div className={`flex flex-col h-full bg-slate-100 ${isEmbedded ? '' : 'rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden'}`}>
      {/* Console Subheader with Current Profile Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Consola de Operaciones
          </span>
          <span className="text-slate-600 font-mono text-xs">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Conectado desde:</span>
            {isLeader ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1.5 shadow-2xs">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  {activeAgent.name} (Team Leader de {activeAgent.departmentName})
                </span>
                <button
                  onClick={() => {
                    setActiveLeaderId(activeAgent.id);
                    setViewMode('leader');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Abrir tu panel de supervisión independiente"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Panel Independiente</span>
                </button>
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="px-2 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Compartir link exclusivo para clientes de tu departamento"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Link Clientes</span>
                </button>
                <button
                  onClick={() => setTeamModalOpen(true)}
                  className="px-2 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Equipo ({myTeamAgentIds.length}/10)</span>
                </button>
                <button
                  onClick={() => lockLeaderSession(activeAgent.id)}
                  className="px-2 py-1 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Bloquear sesión de Team Leader"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bloquear</span>
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeAgent.name} ({activeAgent.departmentName})
                {activeAgent.teamLeaderName && (
                  <span className="text-[10px] text-indigo-300 font-normal">
                    · Líder: {activeAgent.teamLeaderName.split(' ')[0]}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Profile Switcher Trigger */}
        <AgentProfileSwitcher variant="header" />
      </div>

      {/* Main 3-Column Workstation */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Tickets Queue */}
        <div className="w-full md:w-80 lg:w-88 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Search box */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ticket o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200/80 text-[11px] font-medium flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterTab === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterTab === 'pending' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>En Cola</span>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('mine')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterTab === 'mine' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Mis Chats</span>
              {myAssignedCount > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {myAssignedCount}
                </span>
              )}
            </button>
            {isLeader && (
              <button
                onClick={() => setFilterTab('team')}
                className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  filterTab === 'team' ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-600" />
                <span>Mi Equipo</span>
              </button>
            )}
            <button
              onClick={() => setFilterTab('resolved')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filterTab === 'resolved' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resueltos
            </button>
          </div>

          {/* Department / Category Quick Filter */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">Área:</span>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'soporte', label: 'Soporte' },
              { id: 'procesos', label: 'Procesos' },
              { id: 'estafa', label: 'Estafa' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDeptFilter(d.id as any)}
                className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 ${
                  deptFilter === d.id
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No hay tickets en esta sección</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = currentTicket?.id === t.id;
                const isPending = t.status === 'pending';
                const isResolved = t.status === 'resolved';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedAgentTicketId(t.id)}
                    className={`p-3.5 cursor-pointer text-left transition-colors relative ${
                      isSelected
                        ? 'bg-indigo-50/60 border-l-2 border-indigo-600'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{t.customer.name}</span>
                      <span className="text-[10px] text-slate-600 font-mono tabular-nums shrink-0">
                        {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 truncate mb-1">{t.subject}</p>
                    <p className="text-[11px] text-slate-600 truncate">{t.lastMessageSnippet}</p>

                    <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase tracking-wider ${
                            t.department === 'soporte'
                              ? 'bg-blue-100 text-blue-800'
                              : t.department === 'procesos'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.departmentName}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{t.id}</span>
                      </div>

                      {isPending ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                          Sin asignar
                        </span>
                      ) : isResolved ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-200">
                          Resuelto
                        </span>
                      ) : (
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-200 truncate max-w-[100px]">
                          {t.assignedAgentName || 'En curso'}
                        </span>
                      )}
                    </div>

                    {t.referredByLeaderName && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                        <Crown className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span className="truncate">Ref: {t.referredByLeaderName}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Active Conversation */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden border-r border-slate-200">
          {currentTicket ? (
            <>
              {/* Ticket Top Action Bar */}
              <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {currentTicket.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{currentTicket.subject}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      Cliente: <strong className="text-slate-700">{currentTicket.customer.name}</strong> ({currentTicket.customer.email})
                    </span>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <span className="font-medium text-slate-500">Área:</span>
                      <select
                        value={currentTicket.department}
                        onChange={(e) => changeTicketDepartment(currentTicket.id, e.target.value as any)}
                        className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded px-2 py-0.5 cursor-pointer focus:outline-none"
                        title="Cambiar categoría / área del caso (Soporte, Procesos o Estafa)"
                      >
                        <option value="soporte">Soporte Técnico</option>
                        <option value="procesos">Procesos</option>
                        <option value="estafa">Prevención / Estafa</option>
                      </select>
                      {isLeader && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded font-medium flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 text-amber-600" />
                          Gestión TL
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations & Handover Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {currentTicket.assignedAgentId !== activeAgentId && (
                    <button
                      onClick={() => takeTicket(currentTicket.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Tomar con mi perfil ({activeAgent.name.split(' ')[0]})
                    </button>
                  )}

                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Transferir a otro perfil de agente"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                    Transferir
                  </button>

                  {currentTicket.status !== 'resolved' && (
                    <button
                      onClick={() => resolveTicket(currentTicket.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolver
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {currentMessages.map((msg) => {
                  const isAgent = msg.senderType === 'agent';
                  const isInternalNote = msg.senderType === 'internal_note';
                  const isSystem = msg.senderType === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <div className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full shadow-2xs">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  if (isInternalNote) {
                    return (
                      <div key={msg.id} className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl my-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            {msg.senderName}
                          </span>
                          <span className="font-mono text-[10px] text-amber-700 font-normal">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-amber-950 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isAgent ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAgent && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold shrink-0 mb-1">
                          {currentTicket.customer.name.slice(0, 1)}
                        </div>
                      )}

                      <div className={`max-w-[85%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-slate-700">{msg.senderName}</span>
                          {msg.impersonatedByLeaderName && (
                            <span className="text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-600" />
                              Resp. por {msg.impersonatedByLeaderName.split(' ')[0]}
                            </span>
                          )}
                          {isAgent && (
                            <span className="text-[10px] text-slate-500">
                              (Perfil: {msg.senderRole?.split(' ')[0] || 'Agente'})
                            </span>
                          )}
                        </div>

                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isAgent
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-current/10 pt-2">
                              {msg.attachments.map((f, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                                    isAgent ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="font-medium truncate">{f.name}</span>
                                  <span className="text-[10px] opacity-75 shrink-0">({f.size})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-600 font-mono">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isAgent && <CheckCheck className="w-3 h-3 text-indigo-600" />}
                        </div>
                      </div>

                      {isAgent && (
                        <img
                          src={msg.senderAvatar || activeAgent.avatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 mb-1"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Client typing indicator */}
                {clientTypers.length > 0 && (
                  <div className="flex items-center gap-2 text-indigo-600 text-xs py-1">
                    <span className="animate-pulse">●</span>
                    <span>El cliente está escribiendo un mensaje...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Macros Bar (from current agent profile) */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Macros de {activeAgent.name.split(' ')[0]}:
                </span>
                {activeAgent.cannedResponses.map((macro) => (
                  <button
                    key={macro.id}
                    onClick={() => handleInsertMacro(macro.content)}
                    className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                  >
                    {macro.title}
                  </button>
                ))}
              </div>

              {/* Composer Box */}
              <div className="p-3 bg-white border-t border-slate-200">
                {/* Team Leader Impersonation Selector: pick which agent to answer as */}
                {isLeader && (
                  <div className="mb-2.5 p-2 bg-gradient-to-r from-amber-50/90 via-white to-indigo-50/90 border border-amber-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Identidad de Envío:</span>
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setImpersonateDropdownOpen(!impersonateDropdownOpen)}
                          className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-300 hover:border-amber-400 rounded-lg shadow-2xs text-left cursor-pointer transition-colors"
                        >
                          <img
                            src={effectiveSender.avatar}
                            alt={effectiveSender.name}
                            className="w-5 h-5 rounded-md object-cover border border-slate-200"
                          />
                          <span className="font-bold text-slate-900 truncate max-w-[140px]">
                            {effectiveSender.name}
                          </span>
                          {effectiveSender.id === activeAgent.id ? (
                            <span className="text-[10px] text-amber-800 bg-amber-100 font-semibold px-1 rounded">
                              Líder (Tú)
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-700 bg-indigo-100 font-semibold px-1 rounded">
                              Agente
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                        </button>

                        {impersonateDropdownOpen && (
                          <div className="absolute left-0 bottom-full mb-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Selecciona quién firma la respuesta:
                            </div>

                            {/* Option 1: Leader themselves */}
                            <button
                              type="button"
                              onClick={() => {
                                setAnsweringAsAgentId(null);
                                setImpersonateDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                !answeringAsAgentId ? 'bg-amber-50 font-bold text-amber-950 border border-amber-200' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <img src={activeAgent.avatar} alt={activeAgent.name} className="w-6 h-6 rounded-md object-cover" />
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="text-xs truncate font-bold text-slate-900">{activeAgent.name} (Team Leader)</div>
                                <div className="text-[10px] text-amber-800 font-normal">Responder con tu perfil oficial</div>
                              </div>
                            </button>

                            <div className="border-t border-slate-100 my-1 pt-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Agentes a tu cargo ({teamAgentsList.length}):
                            </div>

                            {teamAgentsList.map((ag) => (
                              <button
                                key={ag.id}
                                type="button"
                                onClick={() => {
                                  setAnsweringAsAgentId(ag.id);
                                  setImpersonateDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                  answeringAsAgentId === ag.id ? 'bg-indigo-50 font-bold text-indigo-950 border border-indigo-200' : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <img src={ag.avatar} alt={ag.name} className="w-6 h-6 rounded-md object-cover" />
                                <div className="min-w-0 flex-1 leading-tight">
                                  <div className="text-xs truncate text-slate-900 font-semibold">{ag.name}</div>
                                  <div className="text-[10px] text-slate-500 font-normal truncate">{ag.role}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {impersonatedAgent ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-indigo-900 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          El cliente verá la respuesta como <strong>{impersonatedAgent.name}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnsweringAsAgentId(null)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                        >
                          Restablecer
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        Puedes escoger cualquier agente de tu equipo para contestar en su nombre
                      </span>
                    )}
                  </div>
                )}

                {/* Mode Selector: Public Reply vs Internal Note */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setComposerMode('reply')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        composerMode === 'reply'
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Respuesta al Cliente (Como {effectiveSender.name.split(' ')[0]})
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode('internal_note')}
                      className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        composerMode === 'internal_note'
                          ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-amber-700" />
                      Nota Interna Privada
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-600">
                    Enter para enviar · Shift+Enter para salto de línea
                  </span>
                </div>

                {/* Attachments */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateAttachment}
                    title="Adjuntar archivo o diagnóstico"
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 mb-0.5"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        composerMode === 'reply'
                          ? `Escribe tu respuesta como ${effectiveSender.name} (${effectiveSender.role})...`
                          : 'Escribe una nota interna para los demás agentes del equipo (no visible para el cliente)...'
                      }
                      className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:outline-none resize-none ${
                        composerMode === 'internal_note'
                          ? 'bg-amber-50/60 border-amber-300 focus:ring-1 focus:ring-amber-500 text-amber-950 placeholder-amber-700/60'
                          : 'bg-slate-50 focus:bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() && attachedFiles.length === 0}
                    className={`p-2.5 text-white rounded-xl shadow-xs transition-colors shrink-0 mb-0.5 disabled:opacity-40 disabled:pointer-events-none ${
                      composerMode === 'internal_note'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
              <p>Selecciona un ticket de la bandeja para comenzar a atender</p>
            </div>
          )}
        </div>

        {/* Right Column: Customer Dossier & Agent Profile Info */}
        <div className="hidden xl:flex w-72 bg-slate-50/70 p-4 border-l border-slate-200 flex-col gap-4 overflow-y-auto shrink-0">
          {/* Customer dossier */}
          {currentTicket && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Ficha del Cliente</h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Nombre</span>
                  <span className="font-semibold text-slate-900">{currentTicket.customer.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Correo</span>
                  <span className="text-slate-700 truncate block">{currentTicket.customer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Nivel / Plan</span>
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded mt-0.5">
                      {currentTicket.customer.tier}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Prioridad</span>
                    <span className="inline-block uppercase text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5">
                      {currentTicket.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ubicación
                  </span>
                  <span className="text-slate-700">{currentTicket.customer.location}</span>
                </div>
                {currentTicket.customer.browser && (
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Laptop className="w-3 h-3" /> Dispositivo
                    </span>
                    <span className="text-slate-600 text-[11px]">{currentTicket.customer.browser}</span>
                  </div>
                )}

                {currentTicket.referredByLeaderName && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-300/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Referido por Team Leader</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Ingreso exclusivo mediante enlace de <strong>{currentTicket.referredByLeaderName}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Agent Stats Card */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">Rendimiento de Mi Perfil</h4>
            </div>

            <div className="flex items-center gap-2.5">
              <img
                src={activeAgent.avatar}
                alt={activeAgent.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">{activeAgent.name}</span>
                <span className="text-[11px] text-slate-500 block truncate">{activeAgent.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Satisfacción</span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">★ {activeAgent.rating}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Resueltos</span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">{activeAgent.resolvedCount}</span>
              </div>
            </div>

            {/* If Team Leader: Show Team Management Card */}
            {isLeader && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Equipo a cargo
                  </span>
                  <span className="font-mono tabular-nums text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                    {myTeamAgentIds.length} / 10
                  </span>
                </div>
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="w-full py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir Mi Enlace de Clientes
                </button>
                <button
                  onClick={() => setTeamModalOpen(true)}
                  className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Gestionar Agentes del Equipo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer ticket modal */}
      {currentTicket && (
        <TransferTicketModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          ticket={currentTicket}
        />
      )}

      {/* Team Leader Management Modal */}
      <TeamLeaderManagementModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
      />

      {/* Share Customer Link Modal */}
      <ShareCustomerLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        teamLeader={activeAgent}
      />
    </div>
  );
};
