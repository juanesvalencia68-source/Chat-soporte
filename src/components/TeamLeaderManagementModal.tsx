import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { AgentProfile } from '../types/support';
import { ShareCustomerLinkModal } from './ShareCustomerLinkModal';
import {
  X,
  Crown,
  Users,
  UserPlus,
  UserMinus,
  AlertTriangle,
  CheckCircle2,
  Star,
  Clock,
  Sparkles,
  Share2,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamLeader?: AgentProfile;
}

export const TeamLeaderManagementModal: React.FC<Props> = ({ isOpen, onClose, teamLeader }) => {
  const {
    agents,
    activeAgent,
    assignAgentToTeamLeader,
    removeAgentFromTeamLeader,
    createAgentProfile,
  } = useSupport();

  // Filter only Team Leaders
  const teamLeaders = agents.filter((a) => a.roleType === 'team_leader');

  // Internal state for selected team leader
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(() => {
    if (teamLeader) return teamLeader.id;
    if (activeAgent.roleType === 'team_leader') return activeAgent.id;
    return teamLeaders[0]?.id || 'leader-jeremy';
  });

  const currentLeader =
    teamLeaders.find((tl) => tl.id === selectedLeaderId) ||
    teamLeader ||
    teamLeaders[0] ||
    agents[0];

  const assignedAgentIds = currentLeader.assignedAgentIds || [];
  const assignedAgents = agents.filter((a) => assignedAgentIds.includes(a.id));
  const maxLimit = currentLeader.maxAgentsLimit || 10;
  const isAtLimit = assignedAgents.length >= maxLimit;

  // Modals for adding & sharing
  const [showAssignSelector, setShowAssignSelector] = useState(false);
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLeaderLink, setCopiedLeaderLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New agent form fields
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');

  // Agents available to be assigned (roleType === 'agent' and not already in this team)
  const availableAgentsToAssign = agents.filter(
    (a) => a.roleType === 'agent' && !assignedAgentIds.includes(a.id)
  );

  if (!isOpen) return null;

  const handleAssignExisting = (agentId: string) => {
    setErrorMessage(null);
    const res = assignAgentToTeamLeader(currentLeader.id, agentId);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    } else {
      setShowAssignSelector(false);
    }
  };

  const handleRemove = (agentId: string) => {
    setErrorMessage(null);
    removeAgentFromTeamLeader(currentLeader.id, agentId);
  };

  const handleCreateAgentForTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    if (assignedAgents.length >= maxLimit) {
      setErrorMessage('Límite alcanzado: Un Team Leader solo puede gestionar un máximo de hasta 10 agentes.');
      return;
    }

    createAgentProfile({
      name: newAgentName.trim(),
      role: newAgentRole.trim(),
      roleType: 'agent',
      department: currentLeader.department,
      departmentName: currentLeader.departmentName,
      avatar: '/src/assets/images/agent_carlos_tech_1793027650432.jpg',
      status: 'online',
      statusBio: `Agente a cargo de ${currentLeader.name} en el área de ${currentLeader.departmentName}.`,
      email: newAgentEmail.trim() || `${newAgentName.toLowerCase().replace(/\s+/g, '.')}@soporte.empresa.com`,
      teamLeaderId: currentLeader.id,
      teamLeaderName: currentLeader.name,
      cannedResponses: [
        {
          id: `c-${Date.now()}`,
          title: 'Saludo formal',
          content: `¡Hola! Te saluda ${newAgentName} del equipo de ${currentLeader.name}. Estoy para ayudarte.`,
        },
      ],
    });

    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentEmail('');
    setShowNewAgentForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Gestión de Team Leaders</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
                  Límite Máximo: 10 Agentes
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Supervisa y gestiona los agentes asignados a cada Team Leader oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Leaders Selector Tabs (Jeremy Adams & Lucas Wilder) */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-3 overflow-x-auto">
          {teamLeaders.map((tl) => {
            const isSelected = tl.id === currentLeader.id;
            const count = (tl.assignedAgentIds || []).length;
            return (
              <button
                key={tl.id}
                onClick={() => {
                  setSelectedLeaderId(tl.id);
                  setErrorMessage(null);
                  setShowAssignSelector(false);
                  setShowNewAgentForm(false);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500'
                    : 'bg-slate-100/80 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <img
                  src={tl.avatar}
                  alt={tl.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{tl.name}</span>
                    <Crown className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{tl.departmentName}</span>
                    <span>·</span>
                    <span className={`font-semibold ${count >= 10 ? 'text-red-600' : 'text-indigo-600'}`}>
                      {count}/10 agentes
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Leader Summary Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/60 to-indigo-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <img
                src={currentLeader.avatar}
                alt={currentLeader.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                <Crown className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{currentLeader.name}</span>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full bg-slate-900 text-white tracking-wider">
                  {currentLeader.departmentName}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{currentLeader.role}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  {currentLeader.rating}
                </span>
                <span>·</span>
                <span>{currentLeader.resolvedCount} casos supervisados</span>
              </div>
            </div>
          </div>

          {/* Quota Gauge */}
          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-600">Cupo de Agentes</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    isAtLimit ? 'text-red-600' : 'text-indigo-600'
                  }`}
                >
                  {assignedAgents.length} / {maxLimit}
                </span>
              </div>
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAtLimit
                      ? 'bg-red-500'
                      : assignedAgents.length >= 8
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (assignedAgents.length / maxLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {maxLimit - assignedAgents.length} lugares disponibles
              </span>
            </div>

            {/* Actions for Team Leader */}
            <div className="flex flex-col gap-1.5 border-l border-slate-200 pl-4">
              <button
                onClick={() => {
                  if (isAtLimit) {
                    setErrorMessage('Límite alcanzado: Este Team Leader ya tiene el máximo permitido de 10 agentes.');
                    return;
                  }
                  setShowAssignSelector(!showAssignSelector);
                  setShowNewAgentForm(false);
                  setErrorMessage(null);
                }}
                disabled={isAtLimit}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isAtLimit
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Asignar Agente
              </button>

              <button
                onClick={() => setShareModalOpen(true)}
                className="px-3 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Compartir enlace exclusivo para clientes"
              >
                <Share2 className="w-3 h-3 text-amber-700" />
                <span>Enlace Clientes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exclusive Customer Link Banner */}
        {(() => {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const directLink = `${origin}/?portal=cliente&leader=${currentLeader.id}&dept=${currentLeader.department}`;
          const handleDirectCopy = async () => {
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(directLink);
              }
              setCopiedLeaderLink(true);
              setTimeout(() => setCopiedLeaderLink(false), 3000);
            } catch (err) {
              console.error(err);
            }
          };

          return (
            <div className="mx-6 mt-3 p-3 bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-slate-50 border border-amber-300/60 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Share2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      Enlace Exclusivo para Clientes ({currentLeader.name})
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      Prioritario
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono truncate max-w-sm sm:max-w-md">
                    {directLink}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDirectCopy}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                    copiedLeaderLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiedLeaderLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Más opciones para compartir"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Error banner if limit reached */}
        {errorMessage && (
          <div className="p-3 mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drawer: Assign Existing Agent */}
        {showAssignSelector && (
          <div className="p-4 mx-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Selecciona un agente disponible para asignar a {currentLeader.name}:
              </span>
              <button onClick={() => setShowAssignSelector(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {availableAgentsToAssign.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No hay más agentes libres disponibles. Puedes crear uno nuevo abajo.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {availableAgentsToAssign.map((ag) => (
                  <div
                    key={ag.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={ag.avatar}
                        alt={ag.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 block truncate">{ag.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ag.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignExisting(ag.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors shrink-0 cursor-pointer"
                    >
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drawer: Create New Agent For This Team */}
        {showNewAgentForm && (
          <form
            onSubmit={handleCreateAgentForTeam}
            className="p-4 mx-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">
                Registrar nuevo agente bajo el liderazgo de {currentLeader.name} ({currentLeader.departmentName})
              </span>
              <button onClick={() => setShowNewAgentForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Ej. David Rincón"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cargo *</label>
                <input
                  type="text"
                  required
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder={`Ej. Especialista de ${currentLeader.departmentName}`}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="agente@soporte.empresa.com"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewAgentForm(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
              >
                Guardar y Asignar al Equipo
              </button>
            </div>
          </form>
        )}

        {/* Assigned Agents Roster */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Agentes a Cargo ({assignedAgents.length} de 10)
            </h4>
            <span className="text-[11px] text-slate-400">
              Cada Team Leader puede supervisar hasta 10 agentes simultáneos
            </span>
          </div>

          {assignedAgents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">Este Team Leader aún no tiene agentes asignados.</p>
              <p className="text-[11px] text-slate-400 mt-1">Usa los botones superiores para incorporar hasta 10 agentes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{agent.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            agent.status === 'online'
                              ? 'bg-emerald-500'
                              : agent.status === 'busy'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{agent.role}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          {agent.rating}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {agent.avgResponseTime}
                        </span>
                        <span>·</span>
                        <span>{agent.resolvedCount} resueltos</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(agent.id)}
                    title="Desvincular del equipo"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Regla de negocio: Límite estricto de máximo 10 agentes por Team Leader verificado.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Share Customer Link Modal */}
      <ShareCustomerLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        teamLeader={currentLeader}
      />
    </div>
  );
};
