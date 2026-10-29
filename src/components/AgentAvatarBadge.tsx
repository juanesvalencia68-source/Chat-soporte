import React from 'react';
import { Headphones, Crown, ShieldAlert, FileCheck, User, UserCheck, Sparkles, MessageCircle } from 'lucide-react';
import { DepartmentId, UserRole, AgentStatus } from '../types/support';

interface AgentAvatarBadgeProps {
  roleType?: UserRole | 'system' | 'customer';
  department?: DepartmentId;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: AgentStatus;
  showStatusDot?: boolean;
  className?: string;
}

export const AgentAvatarBadge: React.FC<AgentAvatarBadgeProps> = ({
  roleType = 'agent',
  department = 'soporte',
  name,
  size = 'md',
  status,
  showStatusDot = false,
  className = '',
}) => {
  // Dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  // Status dot color
  const statusColors: Record<AgentStatus, string> = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    away: 'bg-orange-500',
    offline: 'bg-slate-400',
  };

  // Determine appearance based on roleType and department
  let bgGradient = 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs';
  let IconComponent = Headphones;
  let isTeamLeader = false;

  if (roleType === 'system') {
    bgGradient = 'bg-gradient-to-br from-slate-700 to-slate-900 text-amber-300';
    IconComponent = Sparkles;
  } else if (roleType === 'customer') {
    bgGradient = 'bg-gradient-to-br from-slate-600 to-slate-800 text-white';
    IconComponent = User;
  } else if (roleType === 'team_leader') {
    isTeamLeader = true;
    bgGradient = 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-950 font-bold shadow-xs';
    IconComponent = Headphones;
  } else {
    // Standard customer service specialist by department
    if (department === 'soporte') {
      bgGradient = 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs';
      IconComponent = Headphones;
    } else if (department === 'procesos') {
      bgGradient = 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs';
      IconComponent = FileCheck;
    } else if (department === 'estafa') {
      bgGradient = 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs';
      IconComponent = ShieldAlert;
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none border border-black/10 ${sizeClasses[size]} ${bgGradient} ${className}`}
      title={name ? `${name} · Servicio al Cliente` : 'Atención al Cliente'}
    >
      <IconComponent className={`${iconSizes[size]} ${isTeamLeader ? 'text-amber-950' : 'text-white'} drop-shadow-xs`} />

      {/* Team Leader Crown Mini Badge */}
      {isTeamLeader && (
        <span
          className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-0.5 shadow-sm border border-amber-200"
          title="Team Leader"
        >
          <Crown className={size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
        </span>
      )}

      {/* Online / Status Dot */}
      {showStatusDot && status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-white ${dotSizes[size]} ${
            statusColors[status] || 'bg-emerald-500'
          }`}
        />
      )}
    </div>
  );
};
