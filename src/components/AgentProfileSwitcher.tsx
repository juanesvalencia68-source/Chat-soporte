import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { AgentStatus, AgentProfile } from '../types/support';
import { CreateProfileModal } from './CreateProfileModal';
import { TeamLeaderManagementModal } from './TeamLeaderManagementModal';
import { ShareCustomerLinkModal } from './ShareCustomerLinkModal';
import { TeamLeaderLoginModal } from './TeamLeaderLoginModal';
import {
  Check,
  ChevronDown,
  Plus,
  Star,
  Clock,
  ShieldCheck,
  UserCheck,
  Crown,
  Users,
  Share2,
  Lock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  variant?: 'header' | 'modal' | 'embedded';
  onClose?: () => void;
}

export const AgentProfileSwitcher: React.FC<Props> = ({ variant = 'header', onClose }) => {
  const {
    agents,
    activeAgentId,
    activeAgent,
    switchActiveAgentProfile,
    updateActiveAgentStatus,
    unlockedLeaderIds,
    lockLeaderSession,
    setViewMode,
    setActiveLeaderId,
  } = useSupport();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [shareModalLeader, setShareModalLeader] = useState<AgentProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetLoginLeaderId, setTargetLoginLeaderId] = useState<string | null>(null);

  const statusColors: Record<AgentStatus, { dot: string; text: string; label: string }> = {
    online: { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'En línea' },
    busy: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Ocupado' },
    away: { dot: 'bg-orange-400', text: 'text-orange-700', label: 'En pausa' },
    offline: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Desconectado' },
  };

  const handleSelect = (agentId: string) => {
    switchActiveAgentProfile(agentId);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleLeaderClick = (leader: AgentProfile) => {
    if (unlockedLeaderIds.includes(leader.id)) {
      handleSelect(leader.id);
    } else {
      setTargetLoginLeaderId(leader.id);
      setShowLoginModal(true);
      setIsOpen(false);
    }
  };

  // Status button dropdown
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Separate Team Leaders vs Agents
  const teamLeaders = agents.filter((a) => a.roleType === 'team_leader');
  const supportAgents = agents.filter((a) => a.roleType !== 'team_leader');

  const isCurrentLeader = activeAgent.roleType === 'team_leader';

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-slate-200/90 hover:border-slate-300 p-1.5 pl-2.5 rounded-xl shadow-xs transition-colors">
        {/* Status dot selector */}
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-1 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
            title="Cambiar estado"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[activeAgent.status].dot}`} />
            <span className="hidden sm:inline">{statusColors[activeAgent.status].label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {statusMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {(['online', 'busy', 'away', 'offline'] as AgentStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    updateActiveAgentStatus(st);
                    setStatusMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left ${
                    activeAgent.status === st ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColors[st].dot}`} />
                  {statusColors[st].label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Profile Switcher Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:bg-slate-50 py-0.5 px-1.5 rounded-lg transition-colors text-left"
        >
          <div className="relative">
            <img
              src={activeAgent.avatar}
              alt={activeAgent.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
            />
            {isCurrentLeader && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow-2xs">
                <Crown className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="hidden md:block leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                {activeAgent.name}
              </span>
              {isCurrentLeader ? (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                  Leader
                </span>
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{activeAgent.departmentName}</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-88 sm:w-100 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Elegir Perfil de Conexión</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3" />
                Nuevo Perfil
              </button>
            </div>

            {/* Quick banner if current profile is a Team Leader */}
            {isCurrentLeader && (
              <div className="mb-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-900 font-semibold truncate">
                      {(activeAgent.assignedAgentIds || []).length} / 10 agentes a cargo
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      lockLeaderSession(activeAgent.id);
                      setIsOpen(false);
                    }}
                    className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    title="Cerrar sesión de líder"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Bloquear</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-200/60">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setActiveLeaderId(activeAgent.id);
                      setViewMode('leader');
                    }}
                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/60 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Panel Independiente →</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShareModalLeader(activeAgent);
                    }}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3 text-amber-600" />
                    <span>Link Clientes</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto pr-0.5">
              {/* Group 1: Team Leaders */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 w-max mb-1.5">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Team Leaders (Máx. 10 agentes a cargo)
                </span>
                <div className="space-y-1.5">
                  {teamLeaders.map((leader) => {
                    const isSelected = leader.id === activeAgentId;
                    const isUnlocked = unlockedLeaderIds.includes(leader.id);
                    const assignedCount = (leader.assignedAgentIds || []).length;

                    return (
                      <button
                        key={leader.id}
                        onClick={() => handleLeaderClick(leader)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-400'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={leader.avatar}
                            alt={leader.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-md object-cover border border-amber-200"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              statusColors[leader.status].dot
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                              {leader.name}
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUnlocked ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  Desbloqueado
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 rounded flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                                  Protegido
                                </span>
                              )}
                              <span
                                title="Compartir enlace exclusivo para clientes"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOpen(false);
                                  setShareModalLeader(leader);
                                }}
                                className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-amber-900 font-medium truncate">{leader.role}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-mono">
                            <span className="font-semibold text-slate-700">{leader.departmentName}</span>
                            <span>·</span>
                            <span className="text-amber-800 font-bold bg-amber-100/80 px-1 rounded">
                              {assignedCount}/10 agentes
                            </span>
                            <span>·</span>
                            <span>★ {leader.rating}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Support Agents */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 w-max mb-1.5">
                  <Users className="w-3 h-3 text-slate-500" />
                  Agentes de Soporte Operativo
                </span>
                <div className="space-y-1.5">
                  {supportAgents.map((agent) => {
                    const isSelected = agent.id === activeAgentId;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleSelect(agent.id)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-md object-cover border border-slate-200"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              statusColors[agent.status].dot
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 truncate">{agent.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{agent.role}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <span>{agent.departmentName}</span>
                            <span>·</span>
                            {agent.teamLeaderName && (
                              <span className="text-indigo-600 font-medium">Líder: {agent.teamLeaderName.split(' ')[0]}</span>
                            )}
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {agent.rating}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/60 -mx-3 -mb-3 p-3 rounded-b-xl flex items-center justify-between text-[11px] text-slate-500">
              <span>Agente actual: <strong className="text-slate-800">{activeAgent.name}</strong></span>
              <span className="font-mono tabular-nums">{activeAgent.resolvedCount} chats resueltos</span>
            </div>
          </div>
        </>
      )}

      <CreateProfileModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <TeamLeaderManagementModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} />
      <ShareCustomerLinkModal
        isOpen={Boolean(shareModalLeader)}
        onClose={() => setShareModalLeader(null)}
        teamLeader={shareModalLeader || undefined}
      />
      <TeamLeaderLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        targetLeaderId={targetLoginLeaderId}
        onSuccess={(l) => handleSelect(l.id)}
      />
    </div>
  );
};
