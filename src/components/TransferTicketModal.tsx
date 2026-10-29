import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { Ticket } from '../types/support';
import { ArrowRightLeft, X, ShieldAlert, Check } from 'lucide-react';
import { AgentAvatarBadge } from './AgentAvatarBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export const TransferTicketModal: React.FC<Props> = ({ isOpen, onClose, ticket }) => {
  const { agents, activeAgentId, transferTicket } = useSupport();
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [handoverNote, setHandoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter out the currently assigned agent
  const eligibleAgents = agents.filter((a) => a.id !== activeAgentId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    setIsSubmitting(true);
    await transferTicket(ticket.id, selectedTargetId, handoverNote);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Transferir Conversación</h3>
              <p className="text-xs text-slate-500">Ticket {ticket.id} · {ticket.customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Seleccionar Agente o Especialidad de Destino *
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {eligibleAgents.map((ag) => {
                const isTarget = selectedTargetId === ag.id;
                return (
                  <div
                    key={ag.id}
                    onClick={() => setSelectedTargetId(ag.id)}
                    className={`cursor-pointer p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      isTarget
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AgentAvatarBadge
                      roleType={ag.roleType}
                      department={ag.department}
                      name={ag.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 truncate">{ag.name}</span>
                        {isTarget && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{ag.role}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{ag.departmentName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Internal Handover Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nota Interna de Transferencia (Visible solo al equipo)
              </label>
              <span className="text-[11px] text-amber-600 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Privado
              </span>
            </div>
            <textarea
              rows={3}
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="Ej. El cliente solicita factura electrónica formal con NIT actualizado para deducibilidad de impuestos."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedTargetId || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transferir Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
