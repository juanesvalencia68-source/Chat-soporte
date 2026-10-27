import React from 'react';
import { X, HelpCircle, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

const FAQS = [
  {
    question: '¿Cuál es el tiempo promedio de respuesta del equipo de soporte?',
    answer: 'Nuestros agentes especializados responden en un promedio de 1 a 2 minutos en tiempo real. Si tu caso requiere diagnóstico técnico en profundidad, se asignará a un especialista prioritario.',
    topic: 'Consulta sobre tiempo de respuesta de soporte',
  },
  {
    question: '¿Cómo solicito la gestión o validación de un trámite en Procesos?',
    answer: 'Puedes iniciar un chat seleccionando el departamento de Procesos indicando tu número de radicado o solicitud. Nuestro equipo operativo validará los recaudos y agilizará tu gestión.',
    topic: 'Validación de trámite y gestión de procesos',
  },
  {
    question: '¿Qué debo hacer ante un intento de fraude, suplantación o transacción sospechosa?',
    answer: 'Comunícate inmediatamente seleccionando el departamento de Estafa. El equipo de seguridad y prevención de fraudes tomará medidas urgentes para proteger tu cuenta y tus fondos.',
    topic: 'Reporte urgente de fraude o sospecha de estafa',
  },
  {
    question: '¿Cómo reporto una falla técnica o incidencia en el sistema?',
    answer: 'Al seleccionar el departamento de Soporte, describe la anomalía observada y puedes adjuntar capturas de pantalla o logs del error para que un ingeniero técnico aplique la corrección.',
    topic: 'Diagnóstico técnico de sistema e incidencias',
  },
];

export const CustomerFaqModal: React.FC<Props> = ({ isOpen, onClose, onSelectTopic }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Centro de Ayuda & Preguntas Frecuentes</h3>
              <p className="text-xs text-slate-500">Respuestas rápidas a las consultas más comunes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3.5">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all text-left"
            >
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{faq.question}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
              <div className="mt-3 pl-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Resuelto habitualmente
                </span>
                <button
                  onClick={() => {
                    onSelectTopic(faq.topic);
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Consultar sobre esto en el chat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>¿No encontraste lo que buscabas? Inicia un chat en vivo con un especialista.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
