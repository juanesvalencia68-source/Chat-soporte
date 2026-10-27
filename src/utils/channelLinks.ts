import { AgentProfile } from '../types/support';

/**
 * Returns the short, generic channel code for a team leader
 * - Jeremy Adams -> '01' (Soporte)
 * - Lucas Wilder -> '02' (Procesos)
 */
export function getLeaderChannelCode(leader?: AgentProfile | null): string {
  if (!leader) return '01';
  if (leader.channelCode) return leader.channelCode;
  if (leader.id === 'leader-jeremy' || leader.department === 'soporte') return '01';
  if (leader.id === 'leader-lucas' || leader.department === 'procesos') return '02';
  return leader.department || '01';
}

/**
 * Generates a clean, short, generic customer chat link WITHOUT personal names:
 * e.g. "https://domain.com/chat-soporte?c=01" or "https://domain.com/chat-soporte?c=soporte"
 */
export function buildCustomerChatLink(
  leader?: AgentProfile | null,
  options?: { format?: 'short_code' | 'dept_name' | 'clean_root' }
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const format = options?.format || 'short_code';

  if (format === 'clean_root') {
    return `${origin}/chat-soporte`;
  }

  if (format === 'dept_name') {
    const deptSlug = leader?.department || 'soporte';
    return `${origin}/chat-soporte?c=${deptSlug}`;
  }

  // Default: short code format (e.g. ?c=01 or ?c=02)
  const code = getLeaderChannelCode(leader);
  return `${origin}/chat-soporte?c=${code}`;
}

/**
 * Resolves a team leader from a generic channel query (c, ref, canal, channel, leader, etc.)
 */
export function resolveLeaderFromQuery(
  agents: AgentProfile[],
  codeOrParam: string | null
): AgentProfile | null {
  if (!codeOrParam) return null;
  const param = codeOrParam.trim().toLowerCase();

  const leaders = agents.filter((a) => a.roleType === 'team_leader');

  // Match by channel code (e.g. '01', '02')
  const byCode = leaders.find((l) => l.channelCode?.toLowerCase() === param);
  if (byCode) return byCode;

  // Match 01 / 1 / soporte / sp -> Leader of Soporte (Jeremy Adams)
  if (param === '01' || param === '1' || param === 'sp' || param === 'soporte' || param === 'spt') {
    return leaders.find((l) => l.department === 'soporte') || leaders[0] || null;
  }

  // Match 02 / 2 / procesos / pr -> Leader of Procesos (Lucas Wilder)
  if (param === '02' || param === '2' || param === 'pr' || param === 'procesos' || param === 'prc') {
    return leaders.find((l) => l.department === 'procesos') || leaders[1] || null;
  }

  // Fallback match by id (legacy backward compatibility)
  const byId = leaders.find((l) => l.id.toLowerCase() === param);
  if (byId) return byId;

  return null;
}
