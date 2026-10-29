import React, { useState, useEffect } from 'react';
import { useSupport } from '../context/SupportContext';
import { AgentProfile } from '../types/support';
import { AgentAvatarBadge } from './AgentAvatarBadge';
import {
  Lock,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetLeaderId?: string | null;
  onSuccess?: (leader: AgentProfile) => void;
}

export const TeamLeaderLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetLeaderId,
  onSuccess,
}) => {
  const { agents, authenticateLeader, unlockedLeaderIds } = useSupport();

  const teamLeaders = agents.filter((a) => a.roleType === 'team_leader');

  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(() => {
    if (targetLeaderId && teamLeaders.some((l) => l.id === targetLeaderId)) {
      return targetLeaderId;
    }
    return teamLeaders[0]?.id || 'leader-jeremy';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (targetLeaderId && teamLeaders.some((l) => l.id === targetLeaderId)) {
      setSelectedLeaderId(targetLeaderId);
    }
    setError(null);
    setSuccess(false);
  }, [targetLeaderId, isOpen]);

  if (!isOpen) return null;

  const currentLeader = teamLeaders.find((l) => l.id === selectedLeaderId) || teamLeaders[0];
  const isAlreadyUnlocked = unlockedLeaderIds.includes(currentLeader?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa tanto el usuario como la contraseña');
      return;
    }

    const res = authenticateLeader(selectedLeaderId, username, password);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess && currentLeader) {
          onSuccess(currentLeader);
        }
        onClose();
      }, 700);
    } else {
      setError(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header with decorative badge */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Acceso de Team Leader</span>
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Panel Protegido
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Cada Team Leader posee un usuario y contraseña únicos para su panel independiente.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Leader Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Selecciona el Team Leader
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {teamLeaders.map((leader) => {
                const isSelected = leader.id === selectedLeaderId;
                const isUnlocked = unlockedLeaderIds.includes(leader.id);

                return (
                  <button
                    key={leader.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeaderId(leader.id);
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <AgentAvatarBadge
                        roleType="team_leader"
                        department={leader.department}
                        name={leader.name}
                        size="md"
                      />
                      {isUnlocked ? (
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 bg-slate-700 text-amber-300 rounded-full p-0.5 border border-white">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                        {leader.name}
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                        {leader.departmentName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Acceso restringido
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usuario o Correo Institucional
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Ingresa tu usuario institucional"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña de Team Leader
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 pr-10 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 animate-in fade-in duration-100">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Credenciales validadas! Abriendo panel independiente...</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ingresar al Panel Independiente</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
