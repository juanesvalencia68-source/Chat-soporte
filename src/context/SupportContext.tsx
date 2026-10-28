import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AgentProfile, Ticket, Message, ServerSyncState, DepartmentId, AgentStatus, Attachment, ViewMode } from '../types/support';
import { INITIAL_AGENTS, INITIAL_TICKETS, INITIAL_MESSAGES } from '../data/initialData';
import { sound } from '../services/sound';

interface SupportContextType {
  agents: AgentProfile[];
  tickets: Ticket[];
  messages: Record<string, Message[]>;
  activeAgentId: string;
  activeAgent: AgentProfile;
  selectedAgentTicketId: string | null;
  activeCustomerTicketId: string | null;
  viewMode: ViewMode;
  activeLeaderId: string | null;
  isConnected: boolean;
  typingUsers: Record<string, { name: string; senderType: string }[]>; // ticketId -> list of typers
  unlockedLeaderIds: string[];
  setViewMode: (mode: ViewMode) => void;
  setActiveLeaderId: (leaderId: string | null) => void;
  switchActiveAgentProfile: (agentId: string) => void;
  authenticateLeader: (leaderId: string, usernameOrEmail: string, pass: string) => { success: boolean; error?: string };
  lockLeaderSession: (leaderId: string) => void;
  isLeaderUnlocked: (leaderId: string) => boolean;
  updateActiveAgentStatus: (status: AgentStatus) => void;
  createAgentProfile: (newProfileData: Omit<AgentProfile, 'id' | 'resolvedCount' | 'rating' | 'avgResponseTime'>) => AgentProfile;
  assignAgentToTeamLeader: (leaderId: string, agentId: string) => { success: boolean; error?: string };
  removeAgentFromTeamLeader: (leaderId: string, agentId: string) => void;
  setSelectedAgentTicketId: (ticketId: string | null) => void;
  setActiveCustomerTicketId: (ticketId: string | null) => void;
  sendMessage: (ticketId: string, content: string, senderType: 'customer' | 'agent' | 'internal_note', attachments?: Attachment[]) => Promise<void>;
  createCustomerTicket: (
    subject: string,
    department: DepartmentId,
    customerName: string,
    customerEmail: string,
    initialMessage: string,
    preferredAgentId?: string | null,
    referredByLeaderId?: string | null
  ) => Promise<Ticket>;
  takeTicket: (ticketId: string) => Promise<void>;
  transferTicket: (ticketId: string, targetAgentId: string, handoverNote?: string) => Promise<void>;
  resolveTicket: (ticketId: string, csatScore?: number, comment?: string) => Promise<void>;
  changeTicketDepartment: (ticketId: string, newDept: DepartmentId) => Promise<void>;
  answeringAsAgentId: string | null;
  setAnsweringAsAgentId: (agentId: string | null) => void;
  sendTyping: (ticketId: string, isTyping: boolean, senderType: 'customer' | 'agent') => void;
  resetDemoData: () => void;
  clearAllConversations: () => void;
}

const SupportContext = createContext<SupportContextType | null>(null);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentProfile[]>(INITIAL_AGENTS);
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Clean legacy mock test keys
        localStorage.removeItem('soporte_tickets_v1');
        localStorage.removeItem('soporte_messages_v1');
        const stored = localStorage.getItem('soporte_tickets_v2');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return [];
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('soporte_messages_v2');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return {};
  });
  const [activeAgentId, setActiveAgentId] = useState<string>('leader-jeremy');
  const [selectedAgentTicketId, setSelectedAgentTicketId] = useState<string | null>(null);
  const [activeCustomerTicketId, setActiveCustomerTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [activeLeaderId, setActiveLeaderId] = useState<string | null>(null);
  const [answeringAsAgentId, setAnsweringAsAgentId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; senderType: string }[]>>({});
  const [unlockedLeaderIds, setUnlockedLeaderIds] = useState<string[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('soporte_unlocked_leaders') : null;
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const socketRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Active agent computed
  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  // Broadcast to other tabs & WebSockets
  const sendWsOrBroadcast = useCallback((event: string, payload: unknown) => {
    // 1. Send via WebSocket if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, payload }));
    }
    // 2. Broadcast via BroadcastChannel for multi-tab sync
    if (channelRef.current) {
      channelRef.current.postMessage({ event, payload });
    }
  }, []);

  // Initialize WebSocket, BroadcastChannel, and cross-tab storage sync
  useEffect(() => {
    // Setup BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('soporte_pro_sync');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { event: ev, payload } = event.data;
        handleIncomingSyncEvent(ev, payload);
      };
    }

    // Cross-tab / Cross-window storage event sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'soporte_tickets_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTickets(parsed);
        } catch {}
      }
      if (e.key === 'soporte_messages_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMessages(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingSyncEvent(data.event, data.payload);
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 2500);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    // Initial fallback fetch via REST
    fetch('/api/state')
      .then((res) => res.json())
      .then((state: ServerSyncState) => {
        if (state && state.agents && state.tickets) {
          setAgents(state.agents);
          if (state.tickets.length > 0) {
            setTickets(state.tickets);
            setMessages(state.messages || {});
            try {
              localStorage.setItem('soporte_tickets_v2', JSON.stringify(state.tickets));
              localStorage.setItem('soporte_messages_v2', JSON.stringify(state.messages || {}));
            } catch {}
          }
        }
      })
      .catch(() => {
        // Dev fallback already in local state
      });

    return () => {
      clearTimeout(reconnectTimer);
      window.removeEventListener('storage', handleStorage);
      if (ws) ws.close();
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  // Central handler for all sync events
  const handleIncomingSyncEvent = useCallback((event: string, payload: any) => {
    switch (event) {
      case 'sync_state': {
        const state = payload as ServerSyncState;
        setAgents(state.agents);
        setTickets(state.tickets);
        setMessages(state.messages);
        try {
          localStorage.setItem('soporte_tickets_v2', JSON.stringify(state.tickets));
          localStorage.setItem('soporte_messages_v2', JSON.stringify(state.messages));
        } catch {}
        break;
      }

      case 'new_message': {
        const msg = payload as Message;
        setMessages((prev) => {
          const ticketMsgs = prev[msg.ticketId] || [];
          if (ticketMsgs.some((m) => m.id === msg.id)) {
            return prev;
          }
          const next = {
            ...prev,
            [msg.ticketId]: [...ticketMsgs, msg],
          };
          try {
            localStorage.setItem('soporte_messages_v2', JSON.stringify(next));
          } catch {}
          return next;
        });

        // Update ticket snippet
        setTickets((prev) => {
          const next = prev.map((t) => {
            if (t.id === msg.ticketId) {
              return {
                ...t,
                updatedAt: msg.timestamp,
                lastMessageSnippet: msg.senderType === 'internal_note' ? t.lastMessageSnippet : msg.content.slice(0, 80),
              };
            }
            return t;
          });
          try {
            localStorage.setItem('soporte_tickets_v2', JSON.stringify(next));
          } catch {}
          return next;
        });

        // Sound chime for incoming messages
        if (msg.senderType === 'agent' || msg.senderType === 'customer') {
          sound.playIncomingMessage();
        }
        break;
      }

      case 'ticket_created': {
        const ticket = payload as Ticket;
        setTickets((prev) => {
          if (prev.some((t) => t.id === ticket.id)) return prev;
          const next = [ticket, ...prev];
          try {
            localStorage.setItem('soporte_tickets_v2', JSON.stringify(next));
          } catch {}
          return next;
        });
        setMessages((prev) => {
          const next = {
            ...prev,
            [ticket.id]: prev[ticket.id] || [],
          };
          try {
            localStorage.setItem('soporte_messages_v2', JSON.stringify(next));
          } catch {}
          return next;
        });
        sound.playIncomingMessage();
        break;
      }

      case 'ticket_updated': {
        const updatedTicket = payload as Ticket;
        setTickets((prev) => {
          const next = prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t));
          try {
            localStorage.setItem('soporte_tickets_v2', JSON.stringify(next));
          } catch {}
          return next;
        });
        break;
      }

      case 'agent_updated': {
        const updatedAgent = payload as AgentProfile;
        setAgents((prev) =>
          prev.map((a) => (a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a))
        );
        break;
      }

      case 'agent_created': {
        const newAgent = payload as AgentProfile;
        setAgents((prev) => {
          if (prev.some((a) => a.id === newAgent.id)) return prev;
          return [...prev, newAgent];
        });
        break;
      }

      case 'typing_update': {
        const { ticketId, typers } = payload;
        const activeTypers: { name: string; senderType: string }[] = [];
        if (typers) {
          Object.values(typers).forEach((val: any) => {
            if (val && val.isTyping) {
              activeTypers.push({ name: val.name, senderType: val.senderType });
            }
          });
        }
        setTypingUsers((prev) => ({
          ...prev,
          [ticketId]: activeTypers,
        }));
        break;
      }

      default:
        break;
    }
  }, []);

  // Switch agent profile
  const switchActiveAgentProfile = useCallback((agentId: string) => {
    setActiveAgentId(agentId);
    setAnsweringAsAgentId(null);
  }, []);

  // Authenticate Team Leader with unique credentials
  const authenticateLeader = useCallback(
    (leaderId: string, usernameOrEmail: string, pass: string): { success: boolean; error?: string } => {
      const leader = agents.find((a) => a.id === leaderId && a.roleType === 'team_leader');
      if (!leader) {
        return { success: false, error: 'Perfil de Team Leader no encontrado en el sistema' };
      }

      const inputUser = usernameOrEmail.trim().toLowerCase();
      const validUser =
        (leader.username && leader.username.toLowerCase() === inputUser) ||
        (leader.email && leader.email.toLowerCase() === inputUser);
      const validPass = leader.password === pass.trim();

      if (!validUser || !validPass) {
        return { success: false, error: 'Usuario o contraseña incorrectos. Verifica tus credenciales asignadas.' };
      }

      setUnlockedLeaderIds((prev) => {
        const next = prev.includes(leaderId) ? prev : [...prev, leaderId];
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('soporte_unlocked_leaders', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      setActiveLeaderId(leaderId);
      setActiveAgentId(leaderId);
      return { success: true };
    },
    [agents]
  );

  // Lock session for a Team Leader
  const lockLeaderSession = useCallback(
    (leaderId: string) => {
      setUnlockedLeaderIds((prev) => {
        const next = prev.filter((id) => id !== leaderId);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('soporte_unlocked_leaders', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      setActiveLeaderId((curr) => (curr === leaderId ? null : curr));
      setAnsweringAsAgentId(null);
      setActiveAgentId((curr) => {
        if (curr === leaderId) {
          const fallback = agents.find((a) => a.roleType !== 'team_leader') || agents[0];
          return fallback.id;
        }
        return curr;
      });
    },
    [agents]
  );

  // Check if a Team Leader is unlocked
  const isLeaderUnlocked = useCallback(
    (leaderId: string): boolean => {
      return unlockedLeaderIds.includes(leaderId);
    },
    [unlockedLeaderIds]
  );

  // Update status for the active profile
  const updateActiveAgentStatus = useCallback(
    (status: AgentStatus) => {
      const updated = { ...activeAgent, status };
      setAgents((prev) => prev.map((a) => (a.id === activeAgent.id ? updated : a)));
      sendWsOrBroadcast('update_agent', updated);

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeAgent, sendWsOrBroadcast]
  );

  // Register brand new agent profile
  const createAgentProfile = useCallback(
    (newProfileData: Omit<AgentProfile, 'id' | 'resolvedCount' | 'rating' | 'avgResponseTime'>) => {
      const isLeader = newProfileData.roleType === 'team_leader';
      const newId = `${isLeader ? 'leader' : 'agent'}-${Date.now().toString(36).slice(-5)}`;
      const newAgent: AgentProfile = {
        ...newProfileData,
        id: newId,
        resolvedCount: 0,
        rating: 5.0,
        avgResponseTime: '1.0 min',
        maxAgentsLimit: isLeader ? 10 : undefined,
        assignedAgentIds: isLeader ? [] : undefined,
      };

      setAgents((prev) => {
        // If assigned to a team leader, update leader's list
        if (newProfileData.teamLeaderId) {
          return prev.map((a) => {
            if (a.id === newProfileData.teamLeaderId) {
              const currentList = a.assignedAgentIds || [];
              if (currentList.length < 10) {
                return { ...a, assignedAgentIds: [...currentList, newId] };
              }
            }
            return a;
          }).concat(newAgent);
        }
        return [...prev, newAgent];
      });

      setActiveAgentId(newId);
      sendWsOrBroadcast('update_agent', newAgent);

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      }).catch(() => {});

      return newAgent;
    },
    [sendWsOrBroadcast]
  );

  // Assign agent to Team Leader (Max 10 agents strictly enforced)
  const assignAgentToTeamLeader = useCallback(
    (leaderId: string, agentId: string): { success: boolean; error?: string } => {
      const leader = agents.find((a) => a.id === leaderId);
      const agent = agents.find((a) => a.id === agentId);
      if (!leader || !agent) return { success: false, error: 'Perfil no encontrado' };

      const currentAssigned = leader.assignedAgentIds || [];
      if (currentAssigned.includes(agentId)) {
        return { success: false, error: 'Este agente ya forma parte de tu equipo' };
      }

      if (currentAssigned.length >= 10) {
        return {
          success: false,
          error: 'Límite alcanzado: Un Team Leader solo puede gestionar un máximo de hasta 10 agentes a su cargo.',
        };
      }

      const updatedAssigned = [...currentAssigned, agentId];
      const updatedLeader: AgentProfile = {
        ...leader,
        assignedAgentIds: updatedAssigned,
      };

      const updatedAgent: AgentProfile = {
        ...agent,
        teamLeaderId: leader.id,
        teamLeaderName: leader.name,
      };

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === leader.id) return updatedLeader;
          if (a.id === agent.id) return updatedAgent;
          return a;
        })
      );

      sendWsOrBroadcast('update_agent', updatedLeader);
      sendWsOrBroadcast('update_agent', updatedAgent);

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeader),
      }).catch(() => {});

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAgent),
      }).catch(() => {});

      return { success: true };
    },
    [agents, sendWsOrBroadcast]
  );

  // Remove agent from Team Leader
  const removeAgentFromTeamLeader = useCallback(
    (leaderId: string, agentId: string) => {
      const leader = agents.find((a) => a.id === leaderId);
      const agent = agents.find((a) => a.id === agentId);
      if (!leader || !agent) return;

      const updatedAssigned = (leader.assignedAgentIds || []).filter((id) => id !== agentId);
      const updatedLeader: AgentProfile = {
        ...leader,
        assignedAgentIds: updatedAssigned,
      };

      const updatedAgent: AgentProfile = {
        ...agent,
        teamLeaderId: null,
        teamLeaderName: undefined,
      };

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === leader.id) return updatedLeader;
          if (a.id === agent.id) return updatedAgent;
          return a;
        })
      );

      sendWsOrBroadcast('update_agent', updatedLeader);
      sendWsOrBroadcast('update_agent', updatedAgent);

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeader),
      }).catch(() => {});

      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAgent),
      }).catch(() => {});
    },
    [agents, sendWsOrBroadcast]
  );

  // Send message
  const sendMessage = useCallback(
    async (
      ticketId: string,
      content: string,
      senderType: 'customer' | 'agent' | 'internal_note',
      attachments?: Attachment[]
    ) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      let senderName = 'Cliente';
      let senderAvatar: string | undefined;
      let senderRole: string | undefined;
      let senderId = activeAgent.id;
      let impersonatedByLeaderName: string | undefined;
      let impersonatedByLeaderId: string | undefined;

      const impersonatedAgent =
        activeAgent.roleType === 'team_leader' && answeringAsAgentId
          ? agents.find((a) => a.id === answeringAsAgentId)
          : null;
      const effectiveAgent = impersonatedAgent || activeAgent;

      if (senderType === 'agent') {
        senderId = effectiveAgent.id;
        senderName = effectiveAgent.name;
        senderAvatar = effectiveAgent.avatar;
        senderRole = effectiveAgent.role;
        if (impersonatedAgent) {
          impersonatedByLeaderName = activeAgent.name;
          impersonatedByLeaderId = activeAgent.id;
        }
      } else if (senderType === 'internal_note') {
        senderName = `${activeAgent.name} (Nota Interna)`;
        senderAvatar = activeAgent.avatar;
        senderRole = activeAgent.role;
        senderId = activeAgent.id;
      } else if (senderType === 'customer' && ticket) {
        senderName = ticket.customer.name;
        senderId = ticket?.customerId || 'cust-me';
      }

      const newMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticketId,
        senderType,
        senderId,
        senderName,
        senderAvatar,
        senderRole,
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
        status: 'delivered',
        impersonatedByLeaderName,
        impersonatedByLeaderId,
      };

      // Optimistic update
      setMessages((prev) => {
        const next = {
          ...prev,
          [ticketId]: [...(prev[ticketId] || []), newMsg],
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('soporte_messages_v2', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      // Update ticket snippet
      setTickets((prev) => {
        const next = prev.map((t) => {
          if (t.id === ticketId) {
            return {
              ...t,
              updatedAt: Date.now(),
              lastMessageSnippet: senderType === 'internal_note' ? t.lastMessageSnippet : content.slice(0, 80),
              status: t.status === 'pending' && senderType === 'agent' ? 'in_progress' : t.status,
              assignedAgentId: t.assignedAgentId || (senderType === 'agent' ? effectiveAgent.id : t.assignedAgentId),
              assignedAgentName: t.assignedAgentName || (senderType === 'agent' ? effectiveAgent.name : t.assignedAgentName),
              assignedAgentAvatar: t.assignedAgentAvatar || (senderType === 'agent' ? effectiveAgent.avatar : t.assignedAgentAvatar),
              assignedAgentRole: t.assignedAgentRole || (senderType === 'agent' ? effectiveAgent.role : t.assignedAgentRole),
            };
          }
          return t;
        });
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('soporte_tickets_v2', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      sound.playSentMessage();

      // Dispatch to network
      sendWsOrBroadcast('post_message', newMsg);

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      }).catch(() => {});
    },
    [activeAgent, tickets, answeringAsAgentId, agents, sendWsOrBroadcast]
  );

  // Create ticket from customer
  const createCustomerTicket = useCallback(
    async (
      subject: string,
      department: DepartmentId,
      customerName: string,
      customerEmail: string,
      initialMessage: string,
      preferredAgentId?: string | null,
      referredByLeaderId?: string | null
    ) => {
      const now = Date.now();
      const ticketId = `TICK-${Math.floor(2000 + Math.random() * 7999)}`;
      const departmentNames: Record<DepartmentId, string> = {
        soporte: 'Soporte',
        procesos: 'Procesos',
        estafa: 'Estafa',
      };

      const referringLeader = referredByLeaderId
        ? agents.find((a) => a.id === referredByLeaderId && a.roleType === 'team_leader')
        : undefined;

      let assignedAgent: AgentProfile | undefined;
      if (preferredAgentId) {
        assignedAgent = agents.find((a) => a.id === preferredAgentId);
      } else if (referringLeader && referringLeader.assignedAgentIds && referringLeader.assignedAgentIds.length > 0) {
        // Prefer an available agent under this team leader's squad
        const squadAgents = agents.filter(
          (a) => referringLeader.assignedAgentIds!.includes(a.id) && a.status !== 'offline'
        );
        if (squadAgents.length > 0) {
          assignedAgent = squadAgents[Math.floor(Math.random() * squadAgents.length)];
        }
      }

      const newTicket: Ticket = {
        id: ticketId,
        subject,
        department,
        departmentName: departmentNames[department],
        status: assignedAgent ? 'in_progress' : 'pending',
        priority: referringLeader ? 'alta' : 'media',
        customerId: `cust-${Date.now().toString(36).slice(-4)}`,
        customer: {
          id: `cust-${Date.now().toString(36).slice(-4)}`,
          name: customerName,
          email: customerEmail,
          tier: referringLeader ? 'VIP' : 'Pro',
          location: 'América Latina',
          browser: 'Navegador Web · Conexión Segura',
        },
        assignedAgentId: assignedAgent ? assignedAgent.id : null,
        assignedAgentName: assignedAgent ? assignedAgent.name : undefined,
        assignedAgentAvatar: assignedAgent ? assignedAgent.avatar : undefined,
        assignedAgentRole: assignedAgent ? assignedAgent.role : undefined,
        createdAt: now,
        updatedAt: now,
        lastMessageSnippet: initialMessage.slice(0, 80),
        unreadCountClient: 0,
        unreadCountAgent: 1,
        referredByLeaderId: referringLeader ? referringLeader.id : undefined,
        referredByLeaderName: referringLeader ? referringLeader.name : undefined,
      };

      const initialCustomerMsg: Message = {
        id: `msg-${now}-1`,
        ticketId,
        senderType: 'customer',
        senderId: newTicket.customerId,
        senderName: customerName,
        content: initialMessage,
        timestamp: now,
        status: 'delivered',
      };

      const systemWelcomeMsg: Message = {
        id: `msg-${now}-2`,
        ticketId,
        senderType: 'system',
        senderId: 'system',
        senderName: 'Sistema',
        content: referringLeader
          ? `🌟 Bienvenido a SoportePro. Te has conectado mediante el canal directo de soporte (${departmentNames[department]}). Tu caso cuenta con atención prioritaria y seguimiento preferencial.`
          : assignedAgent
          ? `Tu conversación ha sido asignada a ${assignedAgent.name} (${assignedAgent.role}). Te responderá en breve.`
          : `Bienvenido a SoportePro. Tu ticket ha sido recibido en la cola de ${departmentNames[department]}. Un agente disponible tomará tu caso de inmediato.`,
        timestamp: now + 50,
      };

      setTickets((prev) => {
        const next = [newTicket, ...prev];
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('soporte_tickets_v2', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      setMessages((prev) => {
        const next = {
          ...prev,
          [ticketId]: [initialCustomerMsg, systemWelcomeMsg],
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('soporte_messages_v2', JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      setActiveCustomerTicketId(ticketId);
      setSelectedAgentTicketId(ticketId);

      sendWsOrBroadcast('create_ticket', newTicket);
      sendWsOrBroadcast('post_message', initialCustomerMsg);
      sendWsOrBroadcast('post_message', systemWelcomeMsg);

      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTicket,
          initialMessages: [initialCustomerMsg, systemWelcomeMsg],
        }),
      }).catch(() => {});

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialCustomerMsg),
      }).catch(() => {});

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemWelcomeMsg),
      }).catch(() => {});

      return newTicket;
    },
    [agents, sendWsOrBroadcast]
  );

  // Take ticket as active agent
  const takeTicket = useCallback(
    async (ticketId: string) => {
      const target = tickets.find((t) => t.id === ticketId);
      if (!target) return;

      const updated: Ticket = {
        ...target,
        status: 'in_progress',
        assignedAgentId: activeAgent.id,
        assignedAgentName: activeAgent.name,
        assignedAgentAvatar: activeAgent.avatar,
        assignedAgentRole: activeAgent.role,
        updatedAt: Date.now(),
      };

      const systemMsg: Message = {
        id: `sys-${Date.now()}`,
        ticketId,
        senderType: 'system',
        senderId: 'system',
        senderName: 'Sistema',
        content: `${activeAgent.name} se ha conectado y tomó la conversación con perfil de ${activeAgent.departmentName}.`,
        timestamp: Date.now(),
      };

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setMessages((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), systemMsg],
      }));

      sendWsOrBroadcast('update_ticket', updated);
      sendWsOrBroadcast('post_message', systemMsg);

      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeAgent, tickets, sendWsOrBroadcast]
  );

  // Transfer ticket to another agent profile
  const transferTicket = useCallback(
    async (ticketId: string, targetAgentId: string, handoverNote?: string) => {
      const targetAgent = agents.find((a) => a.id === targetAgentId);
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!targetAgent || !ticket) return;

      const updated: Ticket = {
        ...ticket,
        assignedAgentId: targetAgent.id,
        assignedAgentName: targetAgent.name,
        assignedAgentAvatar: targetAgent.avatar,
        assignedAgentRole: targetAgent.role,
        department: targetAgent.department,
        departmentName: targetAgent.departmentName,
        status: 'in_progress',
        updatedAt: Date.now(),
      };

      const now = Date.now();
      const messagesToAdd: Message[] = [];

      if (handoverNote && handoverNote.trim()) {
        messagesToAdd.push({
          id: `note-${now}`,
          ticketId,
          senderType: 'internal_note',
          senderId: activeAgent.id,
          senderName: `${activeAgent.name} (Nota de transferencia)`,
          senderAvatar: activeAgent.avatar,
          senderRole: activeAgent.role,
          content: `Transferido a ${targetAgent.name}: "${handoverNote.trim()}"`,
          timestamp: now,
        });
      }

      messagesToAdd.push({
        id: `sys-${now + 10}`,
        ticketId,
        senderType: 'system',
        senderId: 'system',
        senderName: 'Sistema',
        content: `La conversación ha sido transferida de ${activeAgent.name} a ${targetAgent.name} (${targetAgent.role}).`,
        timestamp: now + 10,
      });

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setMessages((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), ...messagesToAdd],
      }));

      sendWsOrBroadcast('update_ticket', updated);
      messagesToAdd.forEach((m) => sendWsOrBroadcast('post_message', m));

      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeAgent, agents, tickets, sendWsOrBroadcast]
  );

  // Resolve ticket
  const resolveTicket = useCallback(
    async (ticketId: string, csatScore?: number, comment?: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const updated: Ticket = {
        ...ticket,
        status: 'resolved',
        updatedAt: Date.now(),
        rating: csatScore
          ? {
              score: csatScore,
              comment,
              createdAt: Date.now(),
            }
          : ticket.rating,
      };

      const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        ticketId,
        senderType: 'system',
        senderId: 'system',
        senderName: 'Sistema',
        content: csatScore
          ? `El cliente ha calificado la atención con ${csatScore} estrellas${comment ? `: "${comment}"` : ''}. Ticket finalizado.`
          : `El ticket ha sido marcado como Resuelto por ${activeAgent.name}.`,
        timestamp: Date.now(),
      };

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setMessages((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), sysMsg],
      }));

      sound.playTicketResolved();

      sendWsOrBroadcast('update_ticket', updated);
      sendWsOrBroadcast('post_message', sysMsg);

      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeAgent, tickets, sendWsOrBroadcast]
  );

  // Reclassify / Change ticket department (Full Cross-Area Authority for Team Leaders)
  const changeTicketDepartment = useCallback(
    async (ticketId: string, newDept: DepartmentId) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const deptNames: Record<DepartmentId, string> = {
        soporte: 'Soporte',
        procesos: 'Procesos',
        estafa: 'Estafa',
      };

      const updated: Ticket = {
        ...ticket,
        department: newDept,
        departmentName: deptNames[newDept],
        updatedAt: Date.now(),
      };

      const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        ticketId,
        senderType: 'system',
        senderId: 'system',
        senderName: 'Sistema',
        content: `El caso ha sido reclasificado al departamento de ${deptNames[newDept]} por la supervisión de ${activeAgent.name}.`,
        timestamp: Date.now(),
      };

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setMessages((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), sysMsg],
      }));

      sendWsOrBroadcast('update_ticket', updated);
      sendWsOrBroadcast('post_message', sysMsg);

      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeAgent, tickets, sendWsOrBroadcast]
  );

  // Typing state
  const typingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sendTyping = useCallback(
    (ticketId: string, isTyping: boolean, senderType: 'customer' | 'agent') => {
      const impersonatedAgent =
        activeAgent.roleType === 'team_leader' && answeringAsAgentId
          ? agents.find((a) => a.id === answeringAsAgentId)
          : null;
      const effectiveAgent = impersonatedAgent || activeAgent;

      const senderKey = senderType === 'agent' ? `agent-${effectiveAgent.id}` : 'cust-current';
      const name = senderType === 'agent' ? effectiveAgent.name : 'Cliente';

      sendWsOrBroadcast('typing', {
        ticketId,
        senderKey,
        isTyping,
        name,
        senderType,
      });

      if (isTyping) {
        clearTimeout(typingTimerRef.current[senderKey]);
        typingTimerRef.current[senderKey] = setTimeout(() => {
          sendWsOrBroadcast('typing', {
            ticketId,
            senderKey,
            isTyping: false,
            name,
            senderType,
          });
        }, 3000);
      }
    },
    [activeAgent, answeringAsAgentId, agents, sendWsOrBroadcast]
  );

  // Reset demo
  const resetDemoData = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('soporte_unlocked_leaders');
        localStorage.removeItem('soporte_tickets_v2');
        localStorage.removeItem('soporte_messages_v2');
      }
    } catch {}
    setUnlockedLeaderIds([]);
    setActiveLeaderId(null);
    setAnsweringAsAgentId(null);
    setAgents(JSON.parse(JSON.stringify(INITIAL_AGENTS)));
    setTickets([]);
    setMessages({});
    setActiveAgentId('leader-jeremy');
    setSelectedAgentTicketId(null);
    setActiveCustomerTicketId(null);
    sendWsOrBroadcast('reset_demo', {});
    fetch('/api/clear', { method: 'POST' }).catch(() => {});
  }, [sendWsOrBroadcast]);

  // Clear all conversations / tickets / test messages completely
  const clearAllConversations = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('soporte_tickets_v2');
        localStorage.removeItem('soporte_messages_v2');
        localStorage.removeItem('soporte_tickets_v1');
        localStorage.removeItem('soporte_messages_v1');
      }
    } catch {}
    setTickets([]);
    setMessages({});
    setSelectedAgentTicketId(null);
    setActiveCustomerTicketId(null);
    sendWsOrBroadcast('sync_state', { agents, tickets: [], messages: {} });
    fetch('/api/clear', { method: 'POST' }).catch(() => {});
  }, [agents, sendWsOrBroadcast]);

  return (
    <SupportContext.Provider
      value={{
        agents,
        tickets,
        messages,
        activeAgentId,
        activeAgent,
        selectedAgentTicketId,
        activeCustomerTicketId,
        viewMode,
        activeLeaderId,
        answeringAsAgentId,
        isConnected,
        typingUsers,
        unlockedLeaderIds,
        setViewMode,
        setActiveLeaderId,
        setAnsweringAsAgentId,
        switchActiveAgentProfile,
        authenticateLeader,
        lockLeaderSession,
        isLeaderUnlocked,
        updateActiveAgentStatus,
        createAgentProfile,
        assignAgentToTeamLeader,
        removeAgentFromTeamLeader,
        setSelectedAgentTicketId,
        setActiveCustomerTicketId,
        sendMessage,
        createCustomerTicket,
        takeTicket,
        transferTicket,
        resolveTicket,
        changeTicketDepartment,
        sendTyping,
        resetDemoData,
        clearAllConversations,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const ctx = useContext(SupportContext);
  if (!ctx) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return ctx;
}
