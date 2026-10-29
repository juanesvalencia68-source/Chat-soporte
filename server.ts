import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_AGENTS, INITIAL_TICKETS, INITIAL_MESSAGES } from './src/data/initialData.ts';
import { AgentProfile, Ticket, Message, ServerSyncState } from './src/types/support.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authoritative in-memory state
let agents: AgentProfile[] = JSON.parse(JSON.stringify(INITIAL_AGENTS));
let tickets: Ticket[] = [];
let messages: Record<string, Message[]> = {};

// Typing indicators: ticketId -> { [clientId: string]: boolean }
const typingState: Record<string, Record<string, { isTyping: boolean; name: string; senderType: string }>> = {};

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Broadcast helper
  function broadcast(event: string, payload: unknown, excludeWs?: WebSocket) {
    const data = JSON.stringify({ event, payload });
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // REST API Routes
  app.get('/api/state', (_req: Request, res: Response) => {
    const state: ServerSyncState = {
      agents,
      tickets,
      messages,
    };
    res.json(state);
  });

  app.post('/api/clear', (_req: Request, res: Response) => {
    tickets = [];
    messages = {};
    broadcast('sync_state', { agents, tickets, messages });
    res.json({ success: true, message: 'Todas las conversaciones de prueba fueron eliminadas.' });
  });

  app.post('/api/tickets', (req: Request, res: Response) => {
    const { initialMessages, ...ticketData } = req.body;
    const newTicket: Ticket = ticketData;
    if (!newTicket.id) {
      newTicket.id = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    newTicket.createdAt = newTicket.createdAt || Date.now();
    newTicket.updatedAt = Date.now();

    const existingIndex = tickets.findIndex((t) => t.id === newTicket.id);
    if (existingIndex >= 0) {
      tickets[existingIndex] = { ...tickets[existingIndex], ...newTicket };
    } else {
      tickets.unshift(newTicket);
    }

    if (!messages[newTicket.id]) {
      messages[newTicket.id] = [];
    }

    if (Array.isArray(initialMessages)) {
      initialMessages.forEach((m: Message) => {
        if (!messages[newTicket.id].some((existing) => existing.id === m.id)) {
          messages[newTicket.id].push(m);
        }
      });
    }

    broadcast('ticket_created', newTicket);
    if (Array.isArray(initialMessages)) {
      initialMessages.forEach((m: Message) => {
        broadcast('new_message', m);
      });
    }

    res.status(201).json(newTicket);
  });

  app.post('/api/messages', (req: Request, res: Response) => {
    const message: Message = req.body;
    if (!message.id) {
      message.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }
    message.timestamp = message.timestamp || Date.now();

    const ticketId = message.ticketId;
    if (!messages[ticketId]) {
      messages[ticketId] = [];
    }
    if (!messages[ticketId].some((m) => m.id === message.id)) {
      messages[ticketId].push(message);
    }

    // Update ticket updatedAt, lastMessageSnippet, and status
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.updatedAt = Date.now();
      if (message.senderType !== 'internal_note') {
        ticket.lastMessageSnippet = message.content.slice(0, 80);
      }
      if (message.senderType === 'customer') {
        ticket.unreadCountAgent += 1;
      } else if (message.senderType === 'agent') {
        ticket.unreadCountClient += 1;
        ticket.status = ticket.status === 'pending' ? 'in_progress' : ticket.status;
        if (!ticket.assignedAgentId && message.senderId) {
          ticket.assignedAgentId = message.senderId;
          ticket.assignedAgentName = message.senderName;
          ticket.assignedAgentRole = message.senderRole;
        }
      }
      broadcast('ticket_updated', ticket);
    }

    broadcast('new_message', message);
    res.status(201).json(message);
  });

  app.put('/api/tickets/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const ticketIndex = tickets.findIndex((t) => t.id === id);

    if (ticketIndex === -1) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    const currentTicket = tickets[ticketIndex];
    const updatedTicket: Ticket = {
      ...currentTicket,
      ...updates,
      updatedAt: Date.now(),
    };
    tickets[ticketIndex] = updatedTicket;

    broadcast('ticket_updated', updatedTicket);
    res.json(updatedTicket);
  });

  app.post('/api/agents', (req: Request, res: Response) => {
    const agent: AgentProfile = req.body;
    const existingIndex = agents.findIndex((a) => a.id === agent.id);

    if (existingIndex >= 0) {
      agents[existingIndex] = { ...agents[existingIndex], ...agent };
      broadcast('agent_updated', agents[existingIndex]);
      res.json(agents[existingIndex]);
    } else {
      agents.push(agent);
      broadcast('agent_created', agent);
      res.status(201).json(agent);
    }
  });

  // WebSocket Connection Handling
  wss.on('connection', (ws: WebSocket) => {
    // Send full current state immediately upon connection
    const initialState: ServerSyncState = {
      agents,
      tickets,
      messages,
    };
    ws.send(JSON.stringify({ event: 'sync_state', payload: initialState }));

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data.toString());
        const { event, payload } = parsed;

        switch (event) {
          case 'post_message': {
            const message: Message = payload;
            if (!message.id) {
              message.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            }
            message.timestamp = Date.now();

            const ticketId = message.ticketId;
            if (!messages[ticketId]) {
              messages[ticketId] = [];
            }
            messages[ticketId].push(message);

            const ticket = tickets.find((t) => t.id === ticketId);
            if (ticket) {
              ticket.updatedAt = Date.now();
              if (message.senderType !== 'internal_note') {
                ticket.lastMessageSnippet = message.content.slice(0, 80);
              }
              broadcast('ticket_updated', ticket);
            }

            broadcast('new_message', message);
            break;
          }

          case 'update_ticket': {
            const updated: Ticket = payload;
            const index = tickets.findIndex((t) => t.id === updated.id);
            if (index >= 0) {
              tickets[index] = { ...tickets[index], ...updated, updatedAt: Date.now() };
              broadcast('ticket_updated', tickets[index]);
            }
            break;
          }

          case 'create_ticket': {
            const newTicket: Ticket = payload;
            if (!newTicket.id) {
              newTicket.id = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            newTicket.createdAt = Date.now();
            newTicket.updatedAt = Date.now();
            tickets.unshift(newTicket);
            if (!messages[newTicket.id]) {
              messages[newTicket.id] = [];
            }
            broadcast('ticket_created', newTicket);
            break;
          }

          case 'typing': {
            const { ticketId, senderKey, isTyping, name, senderType } = payload;
            if (!typingState[ticketId]) {
              typingState[ticketId] = {};
            }
            typingState[ticketId][senderKey] = { isTyping, name, senderType };
            broadcast('typing_update', { ticketId, typers: typingState[ticketId] });
            break;
          }

          case 'update_agent': {
            const updatedAgent: AgentProfile = payload;
            const index = agents.findIndex((a) => a.id === updatedAgent.id);
            if (index >= 0) {
              agents[index] = { ...agents[index], ...updatedAgent };
              broadcast('agent_updated', agents[index]);
            } else {
              agents.push(updatedAgent);
              broadcast('agent_created', updatedAgent);
            }
            break;
          }

          case 'reset_demo': {
            agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
            tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
            messages = JSON.parse(JSON.stringify(INITIAL_MESSAGES));
            broadcast('sync_state', { agents, tickets, messages });
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      // Cleanup client typing status if needed
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
