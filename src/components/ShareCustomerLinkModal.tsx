import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { AgentProfile } from '../types/support';
import { buildCustomerChatLink, getLeaderChannelCode } from '../utils/channelLinks';
import { AgentAvatarBadge } from './AgentAvatarBadge';
import {
  X,
  Share2,
  Copy,
  Check,
  Crown,
  ExternalLink,
  MessageCircle,
  Mail,
  Sparkles,
  ShieldCheck,
  Users,
  Link as LinkIcon,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamLeader?: AgentProfile;
}

export const ShareCustomerLinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teamLeader,
}) => {
  const { agents, activeAgent, setViewMode } = useSupport();
  const [copied, setCopied] = useState(false);
  const [linkFormat, setLinkFormat] = useState<'short' | 'dept' | 'direct'>('short');

  // All official team leaders (Jeremy Adams & Lucas Wilder)
  const teamLeaders = agents.filter((a) => a.roleType === 'team_leader');

  // Selected leader inside modal
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(() => {
    if (teamLeader) return teamLeader.id;
    if (activeAgent.roleType === 'team_leader') return activeAgent.id;
    return teamLeaders[0]?.id || 'leader-jeremy';
  });

  const currentLeader =
    teamLeaders.find((tl) => tl.id === selectedLeaderId) ||
    teamLeader ||
    teamLeaders[0] ||
    activeAgent;

  if (!isOpen) return null;

  // Generate generic customer chat link (short & without personal names)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerLink =
    linkFormat === 'direct'
      ? `${origin}/chat-soporte`
      : linkFormat === 'dept'
      ? `${origin}/chat-soporte?c=${currentLeader.department}`
      : `${origin}/chat-soporte?c=${getLeaderChannelCode(currentLeader)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(customerLink);
      } else {
        const input = document.createElement('input');
        input.value = customerLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar link:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `¡Hola! Puedes comunicarte con nuestro equipo de atención y soporte a través de nuestro canal de chat directo aquí:\n${customerLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Canal de chat y soporte directo - Área ${currentLeader.departmentName}`;
    const body = `Hola,\n\nTe comparto el enlace directo a nuestro canal de chat de atención para que puedas iniciar una consulta con respuesta prioritaria:\n\n${customerLink}\n\nQuedamos a tu entera disposición.\n\nAtentamente,\nEquipo de Soporte & Atención al Cliente`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleTestLinkInClientView = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(customerLink);
      window.history.pushState({}, '', url);
    }
    setViewMode('client');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Share2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Enlace Exclusivo para Clientes</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
                  Team Leader
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Comparte este enlace directo para que los clientes se comuniquen con tu equipo
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

        {/* Team Leader Selector Tabs */}
        {teamLeaders.length > 1 && (
          <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Líder:
            </span>
            {teamLeaders.map((tl) => {
              const isSelected = tl.id === currentLeader.id;
              return (
                <button
                  key={tl.id}
                  onClick={() => {
                    setSelectedLeaderId(tl.id);
                    setCopied(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-amber-500 text-slate-900 shadow-2xs ring-1 ring-amber-500'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <AgentAvatarBadge roleType="team_leader" department={tl.department} name={tl.name} size="xs" />
                  <span>{tl.name}</span>
                  <Crown className="w-3 h-3 text-amber-500" />
                </button>
              );
            })}
          </div>
        )}

        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Leader Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <AgentAvatarBadge
              roleType="team_leader"
              department={currentLeader.department}
              name={currentLeader.name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{currentLeader.name}</h4>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full bg-slate-900 text-white tracking-wider">
                  {currentLeader.departmentName}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{currentLeader.role}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>{(currentLeader.assignedAgentIds || []).length} agentes asignados a su cargo</span>
              </div>
            </div>
          </div>

          {/* Exclusive Link Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enlace Genérico de Chat
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Sin nombres personales · Enlace seguro
              </span>
            </div>

            {/* Format Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setLinkFormat('short')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  linkFormat === 'short'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Corto Genérico (?c={getLeaderChannelCode(currentLeader)})
              </button>
              <button
                type="button"
                onClick={() => setLinkFormat('dept')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  linkFormat === 'dept'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Área (?c={currentLeader.department})
              </button>
              <button
                type="button"
                onClick={() => setLinkFormat('direct')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  linkFormat === 'direct'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Directo (/chat-soporte)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={customerLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all"
                />
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Enlace genérico copiado al portapapeles. Listo para enviar al cliente.
              </p>
            )}
          </div>

          {/* Quick Sharing Channels */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Compartir Directamente
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-sky-600" />
                <span>Enviar por Correo</span>
              </button>
            </div>
          </div>

          {/* Preview of what the customer sees */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Vista previa del cliente al abrir tu enlace
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Canal Prioritario
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-300/70 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    Atención Prioritaria · Canal Verificado de Soporte
                  </span>
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                  Área: <span className="font-semibold text-indigo-700">{currentLeader.departmentName}</span> · Tu consulta será atendida prioritariamente por el equipo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Enlace seguro y exclusivo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestLinkInClientView}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Probar en Portal Clientes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
