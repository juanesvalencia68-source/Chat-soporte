import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { CreateProfileModal } from './CreateProfileModal';
import { ShareCustomerLinkModal } from './ShareCustomerLinkModal';
import { TeamLeaderLoginModal } from './TeamLeaderLoginModal';
import { AgentProfile } from '../types/support';
import { AgentAvatarBadge } from './AgentAvatarBadge';
import { X, UserPlus, Star, Clock, CheckCircle2, ShieldCheck, Crown, Users, Share2, Lock, KeyRound } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilesDirectoryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { agents, activeAgentId, switchActiveAgentProfile, unlockedLeaderIds, setActiveLeaderId, setViewMode } = useSupport();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareLeader, setShareLeader] = useState<AgentProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalLeaderId, setLoginModalLeaderId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Perfiles de Agentes de Soporte</h3>
              <p className="text-xs text-slate-500">
                Selecciona con qué perfil conectarte o registra nuevas especialidades para tu equipo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nuevo Perfil
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const isCurrent = agent.id === activeAgentId;

              return (
                <div
                  key={agent.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AgentAvatarBadge
                      roleType={agent.roleType}
                      department={agent.department}
                      name={agent.name}
                      size="lg"
                      status={agent.status}
                      showStatusDot
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{agent.name}</h4>
                          {agent.roleType === 'team_leader' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                              <Crown className="w-3 h-3 text-amber-600" />
                              Team Leader
                            </span>
                          )}
                        </div>
                        {isCurrent && (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Conectado
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-indigo-600 truncate">{agent.role}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                          {agent.departmentName}
                        </span>
                        {agent.roleType === 'team_leader' ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {(agent.assignedAgentIds || []).length} / 10 agentes a cargo
                          </span>
                        ) : agent.teamLeaderName ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Líder: {agent.teamLeaderName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {agent.statusBio}
                  </p>

                  {agent.roleType === 'team_leader' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-amber-600" />
                        Canal directo de clientes
                      </span>
                      <button
                        type="button"
                        onClick={() => setShareLeader(agent)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-amber-700" />
                        <span>Compartir Enlace</span>
                      </button>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        {agent.rating}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {agent.avgResponseTime}
                      </span>
                      <span>·</span>
                      <span>{agent.resolvedCount} resueltos</span>
                    </div>

                    {!isCurrent ? (
                      agent.roleType === 'team_leader' && !unlockedLeaderIds.includes(agent.id) ? (
                        <button
                          onClick={() => {
                            setLoginModalLeaderId(agent.id);
                            setShowLoginModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Ingresar credenciales</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {agent.roleType === 'team_leader' && (
                            <button
                              onClick={() => {
                                setActiveLeaderId(agent.id);
                                setViewMode('leader');
                                onClose();
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                            >
                              Panel →
                            </button>
                          )}
                          <button
                            onClick={() => {
                              switchActiveAgentProfile(agent.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Conectar perfil
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        {agent.roleType === 'team_leader' && (
                          <button
                            onClick={() => {
                              setActiveLeaderId(agent.id);
                              setViewMode('leader');
                              onClose();
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Panel →
                          </button>
                        )}
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Sesión activa
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{agents.length} perfiles disponibles en el sistema</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      <CreateProfileModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <ShareCustomerLinkModal
        isOpen={Boolean(shareLeader)}
        onClose={() => setShareLeader(null)}
        teamLeader={shareLeader || undefined}
      />
      <TeamLeaderLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        targetLeaderId={loginModalLeaderId}
        onSuccess={(l) => {
          switchActiveAgentProfile(l.id);
          onClose();
        }}
      />
    </div>
  );
};
