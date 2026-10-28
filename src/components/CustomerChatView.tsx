import React, { useState, useRef, useEffect } from 'react';
import { useSupport } from '../context/SupportContext';
import { DepartmentId, Attachment, AgentProfile } from '../types/support';
import { DEPARTMENTS } from '../data/initialData';
import { resolveLeaderFromQuery } from '../utils/channelLinks';
import {
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  CheckCheck,
  Check,
  Star,
  PlusCircle,
  FileText,
  X,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Crown,
  Sparkles,
} from 'lucide-react';

interface Props {
  isEmbedded?: boolean;
}

export const CustomerChatView: React.FC<Props> = ({ isEmbedded = false }) => {
  const {
    tickets,
    messages,
    agents,
    activeCustomerTicketId,
    setActiveCustomerTicketId,
    sendMessage,
    createCustomerTicket,
    resolveTicket,
    sendTyping,
    typingUsers,
  } = useSupport();

  // Active ticket for the customer
  const currentTicket = tickets.find((t) => t.id === activeCustomerTicketId);
  const ticketMessages = (currentTicket && messages[currentTicket.id]) || [];

  // Filter out internal notes - customers must NEVER see internal team notes!
  const visibleMessages = ticketMessages.filter((m) => m.senderType !== 'internal_note');

  // Input states
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Referred Team Leader if customer arrived via exclusive link: ?leader=leader-jeremy
  const [referredLeader, setReferredLeader] = useState<AgentProfile | null>(null);

  // New ticket form state (clean on every refresh)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedDept, setSelectedDept] = useState<DepartmentId>('soporte');
  const [subjectText, setSubjectText] = useState('');
  const [firstMessageText, setFirstMessageText] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Detect generic channel or referral URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const channelParam =
        params.get('c') ||
        params.get('canal') ||
        params.get('ref') ||
        params.get('ch') ||
        params.get('leader');
      const deptParam = params.get('dept') as DepartmentId | null;

      if (channelParam) {
        const leader = resolveLeaderFromQuery(agents, channelParam);
        if (leader) {
          setReferredLeader(leader);
          if (deptParam && (deptParam === 'soporte' || deptParam === 'procesos' || deptParam === 'estafa')) {
            setSelectedDept(deptParam);
          } else {
            setSelectedDept(leader.department);
          }
        }
      }
    }
  }, [agents]);

  // Rating state
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages.length, typingUsers]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (currentTicket) {
      sendTyping(currentTicket.id, e.target.value.length > 0, 'customer');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentTicket) return;
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const text = inputText;
    const files = attachedFiles.length > 0 ? [...attachedFiles] : undefined;

    setInputText('');
    setAttachedFiles([]);
    setShowEmojiPicker(false);
    sendTyping(currentTicket.id, false, 'customer');

    await sendMessage(currentTicket.id, text, 'customer', files);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectText.trim() || !firstMessageText.trim()) return;

    setIsStartingChat(true);
    const newTicket = await createCustomerTicket(
      subjectText.trim(),
      selectedDept,
      customerName.trim(),
      customerEmail.trim(),
      firstMessageText.trim(),
      null,
      referredLeader?.id || null
    );
    setActiveCustomerTicketId(newTicket.id);
    setIsStartingChat(false);
    setSubjectText('');
    setFirstMessageText('');
  };

  // Simulated file attachment
  const handleSimulateAttachment = () => {
    const sampleFiles: Attachment[] = [
      { name: 'captura_de_pantalla_error.png', url: '#', size: '245 KB', type: 'image/png' },
      { name: 'archivo_configuracion.json', url: '#', size: '12 KB', type: 'application/json' },
      { name: 'recibo_bancario_orden.pdf', url: '#', size: '180 KB', type: 'application/pdf' },
    ];
    const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    setAttachedFiles((prev) => [...prev, randomFile]);
  };

  // Submit CSAT rating
  const handleSubmitRating = async () => {
    if (!currentTicket) return;
    await resolveTicket(currentTicket.id, ratingScore, ratingComment);
    setHasRated(true);
  };

  // Check if an agent is typing in current ticket
  const currentTyping = currentTicket ? typingUsers[currentTicket.id] || [] : [];
  const agentTypers = currentTyping.filter((t) => t.senderType === 'agent');

  // Customer header info
  const assignedAgent = currentTicket?.assignedAgentId
    ? agents.find((a) => a.id === currentTicket.assignedAgentId)
    : null;

  return (
    <div className={`flex flex-col h-full bg-white ${isEmbedded ? '' : 'rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden'}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {assignedAgent ? (
            <div className="relative shrink-0">
              <img
                src={assignedAgent.avatar}
                alt={assignedAgent.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {assignedAgent ? assignedAgent.name : 'Centro de Soporte al Cliente'}
              </h3>
              <span title="Agente Verificado" className="inline-flex">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {assignedAgent
                ? `${assignedAgent.role} · ${assignedAgent.departmentName}`
                : currentTicket
                ? `Cola de ${currentTicket.departmentName}`
                : 'En línea · Soporte multi-departamento'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {currentTicket && (
            <button
              onClick={() => setActiveCustomerTicketId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Nueva Consulta
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      {!currentTicket ? (
        /* Welcome / Start New Conversation View */
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center max-w-xl mx-auto w-full">
          <div className="text-center mb-5">
            <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-2.5">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">¿En qué podemos ayudarte hoy?</h2>
            <p className="text-sm text-slate-500 mt-1">
              Conéctate en tiempo real con nuestros agentes de soporte especializados.
            </p>
          </div>

          {/* VIP Referral Welcome Banner */}
          {referredLeader && (
            <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/15 via-amber-50 to-indigo-50/50 border-2 border-amber-400/80 rounded-2xl shadow-xs animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white tracking-wider uppercase">
                      Canal Directo de Soporte
                    </span>
                    <span className="text-xs text-amber-900 font-semibold">
                      Atención Prioritaria Verificada
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <span>Centro de Soporte Especializado · Área {referredLeader.departmentName}</span>
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Has ingresado mediante el canal directo de soporte y atención al cliente. Tu consulta en el área de{' '}
                    <strong className="text-indigo-900 font-semibold">{referredLeader.departmentName}</strong> será atendida con máxima prioridad por nuestro equipo especializado.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleStartNewChat} className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tu Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tu Correo</label>
                <input
                  type="email"
                  required
                  placeholder="tu.correo@ejemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Department selector: Soporte, Procesos, Estafa */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Selecciona el Departamento
                </label>
                {referredLeader && (
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    Canal prioritario activo ({referredLeader.departmentName})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEPARTMENTS.map((d) => {
                  const isLeaderDept = referredLeader?.department === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDept(d.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        selectedDept === d.id
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isLeaderDept && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300/60">
                          Recomendado
                        </span>
                      )}
                      <span className="block text-xs font-bold text-slate-900">{d.name}</span>
                      <span className="block text-[11px] text-slate-500 mt-1 leading-snug">{d.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de tu consulta</label>
              <input
                type="text"
                required
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="Ej. Error en sincronización de pagos o duda con mi plan"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Initial Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Describe tu problema o pregunta</label>
              <textarea
                required
                rows={3}
                value={firstMessageText}
                onChange={(e) => setFirstMessageText(e.target.value)}
                placeholder="Explícanos brevemente qué sucede para que un especialista disponible te atienda de inmediato..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isStartingChat}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Comenzar Chat con Soporte</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Active Conversation Screen */
        <>
          {/* Thread messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {/* Conversation start banner */}
            <div className="text-center my-2 space-y-1.5">
              <div className="inline-block bg-slate-100 text-slate-500 text-[11px] px-3 py-1 rounded-full font-medium">
                Consulta iniciada · {currentTicket.departmentName}
              </div>

              {currentTicket.referredByLeaderId && (
                <div className="flex justify-center">
                  <div className="bg-amber-50 border border-amber-300/80 text-amber-900 px-3.5 py-1 rounded-full text-center shadow-2xs flex items-center gap-1.5 text-xs font-semibold">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Atención Prioritaria · Canal Verificado de Soporte</span>
                  </div>
                </div>
              )}
            </div>

            {visibleMessages.map((msg) => {
              const isCustomer = msg.senderType === 'customer';
              const isSystem = msg.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-md bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full text-center shadow-xs">
                      <p className="text-[11px] text-slate-600 font-medium">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCustomer && (
                    <img
                      src={msg.senderAvatar || assignedAgent?.avatar || '/src/assets/images/agent_carlos_tech_1793027650432.jpg'}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 mb-1"
                    />
                  )}

                  <div className={`max-w-[82%] sm:max-w-md flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {isCustomer ? 'Tú' : msg.senderName}
                      </span>
                      {!isCustomer && msg.senderRole && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          · {msg.senderRole}
                        </span>
                      )}
                    </div>

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isCustomer
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 space-y-1.5 border-t border-current/10 pt-2">
                          {msg.attachments.map((file, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                                isCustomer ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium truncate">{file.name}</span>
                              <span className="text-[10px] opacity-75 shrink-0">({file.size})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Status */}
                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-600 font-mono">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isCustomer && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Agent Typing Indicator */}
            {agentTypers.length > 0 && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-1 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
                <span className="text-slate-600 text-[11px] font-medium">
                  {agentTypers[0].name} está escribiendo...
                </span>
              </div>
            )}

            {/* Rating Box if Resolved */}
            {currentTicket.status === 'resolved' && (
              <div className="my-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-xs text-center max-w-md mx-auto">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-emerald-900">Esta conversación ha sido resuelta</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  ¿Cómo calificarías la atención recibida por parte de nuestro agente de soporte?
                </p>

                {currentTicket.rating || hasRated ? (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-center">
                    <div className="flex justify-center gap-1 text-amber-400 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= (currentTicket.rating?.score || ratingScore)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-slate-800">¡Muchas gracias por tu calificación!</p>
                    {currentTicket.rating?.comment && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">"{currentTicket.rating.comment}"</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingScore(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= ratingScore ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Comentario sobre la atención (opcional)..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitRating}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                    >
                      Enviar Calificación
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
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

            {/* Quick emoji drawer */}
            {showEmojiPicker && (
              <div className="flex items-center gap-1 mb-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-100">
                {['👍', '🙏', '🚀', '😊', '💡', '⚡', '🔍', '❤️'].map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      setInputText((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-white rounded text-base transition-colors"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={handleSimulateAttachment}
                  title="Adjuntar captura o archivo"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Insertar emoji"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0 relative">
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje a soporte..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none max-h-28"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() && attachedFiles.length === 0}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl shadow-xs transition-colors shrink-0 mb-0.5"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
