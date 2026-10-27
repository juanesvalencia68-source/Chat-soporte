import React, { useState } from 'react';
import { useSupport } from '../context/SupportContext';
import { DepartmentId, UserRole } from '../types/support';
import { DEPARTMENTS } from '../data/initialData';
import { X, UserPlus, Check, Sparkles, Crown, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  {
    url: '/src/assets/images/leader_jeremy_adams_1793030244749.jpg',
    label: 'Jeremy Adams (Líder)',
  },
  {
    url: '/src/assets/images/leader_lucas_wilder_1793030379044.jpg',
    label: 'Lucas Wilder (Líder)',
  },
  {
    url: '/src/assets/images/agent_carlos_tech_1793027650432.jpg',
    label: 'Ingeniería / Soporte',
  },
  {
    url: '/src/assets/images/agent_elena_billing_1793027651667.jpg',
    label: 'Operaciones & Trámites',
  },
  {
    url: '/src/assets/images/agent_sofia_success_1793027651578.jpg',
    label: 'Investigación / Atención',
  },
];

export const CreateProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createAgentProfile, agents } = useSupport();

  const [roleType, setRoleType] = useState<UserRole>('team_leader');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Team Leader');
  const [department, setDepartment] = useState<DepartmentId>('soporte');
  const [teamLeaderId, setTeamLeaderId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [statusBio, setStatusBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const [initialGreeting, setInitialGreeting] = useState('');

  if (!isOpen) return null;

  // Available Team leaders with capacity (< 10)
  const availableLeaders = agents.filter(
    (a) => a.roleType === 'team_leader' && (a.assignedAgentIds || []).length < 10
  );

  const handleRoleTypeChange = (newType: UserRole) => {
    setRoleType(newType);
    const deptObj = DEPARTMENTS.find((d) => d.id === department);
    if (newType === 'team_leader') {
      setRole(`Team Leader de ${deptObj?.name || 'Soporte'}`);
    } else {
      setRole(`Especialista de ${deptObj?.name || 'Soporte'}`);
    }
  };

  const handleDepartmentChange = (newDept: DepartmentId) => {
    setDepartment(newDept);
    const deptObj = DEPARTMENTS.find((d) => d.id === newDept);
    if (roleType === 'team_leader') {
      setRole(`Team Leader de ${deptObj?.name || 'Soporte'}`);
    } else {
      setRole(`Especialista de ${deptObj?.name || 'Soporte'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    const deptObj = DEPARTMENTS.find((d) => d.id === department);
    const selectedLeader = agents.find((a) => a.id === teamLeaderId);

    createAgentProfile({
      name: name.trim(),
      role: role.trim(),
      roleType,
      department,
      departmentName: deptObj ? deptObj.name : 'Soporte',
      avatar: selectedAvatar,
      status: 'online',
      statusBio:
        statusBio.trim() ||
        (roleType === 'team_leader'
          ? `Líder del equipo de ${deptObj?.name} (Hasta 10 agentes a su cargo).`
          : `Especialista en ${deptObj?.name}.`),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@soporte.empresa.com`,
      teamLeaderId: roleType === 'agent' && teamLeaderId ? teamLeaderId : undefined,
      teamLeaderName: roleType === 'agent' && selectedLeader ? selectedLeader.name : undefined,
      cannedResponses: [
        {
          id: `c-custom-1`,
          title: roleType === 'team_leader' ? 'Intervención de Team Leader' : 'Saludo inicial',
          content:
            initialGreeting.trim() ||
            (roleType === 'team_leader'
              ? `¡Hola! Te saluda ${name.trim()}, Team Leader del área de ${deptObj?.name}. Estoy supervisando tu caso para darte una solución definitiva.`
              : `¡Hola! Te atiende ${name.trim()} del área de ${deptObj?.name}. ¿En qué te puedo colaborar el día de hoy?`),
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {roleType === 'team_leader' ? 'Crear Perfil de Team Leader' : 'Crear Perfil de Agente'}
              </h3>
              <p className="text-xs text-slate-500">
                {roleType === 'team_leader'
                  ? 'Gestiona su propio equipo de hasta 10 agentes a cargo'
                  : 'Atiende consultas en los departamentos de soporte'}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Role Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Nivel de Responsabilidad
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleTypeChange('team_leader')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  roleType === 'team_leader'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-400'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <Crown className={`w-4 h-4 ${roleType === 'team_leader' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <span className="block text-xs font-bold">Team Leader</span>
                  <span className="block text-[10px] text-slate-500">Máx. 10 agentes</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTypeChange('agent')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  roleType === 'agent'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <Users className={`w-4 h-4 ${roleType === 'agent' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <span className="block text-xs font-bold">Agente Operativo</span>
                  <span className="block text-[10px] text-slate-500">Bajo supervisión</span>
                </div>
              </button>
            </div>
          </div>

          {/* Avatar selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Foto de Perfil
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative rounded-lg overflow-hidden border-2 p-0.5 transition-all aspect-square ${
                    selectedAvatar === av.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={av.url}
                    alt={av.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-md"
                  />
                  {selectedAvatar === av.url && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Valeria Ortiz"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo o Título *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej. Team Leader de Procesos"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento de Operación</label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value as DepartmentId)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} — {dept.description}
                </option>
              ))}
            </select>
          </div>

          {/* If Agent, option to assign to a Team Leader */}
          {roleType === 'agent' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asignar al equipo de un Team Leader (Opcional - Máx. 10 agentes por líder)
              </label>
              <select
                value={teamLeaderId}
                onChange={(e) => setTeamLeaderId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Sin Team Leader asignado por el momento</option>
                {availableLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} — {leader.role} ({(leader.assignedAgentIds || []).length}/10 ocupados)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lider@soporte.empresa.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nota de Liderazgo / Especialidad</label>
              <input
                type="text"
                value={statusBio}
                onChange={(e) => setStatusBio(e.target.value)}
                placeholder="Ej. Supervisión de SLA y resolución de casos críticos"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Guardar y Conectarse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
