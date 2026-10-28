import { AgentProfile, DepartmentOption, Ticket, Message, ServerSyncState } from '../types/support';

export const DEPARTMENTS: DepartmentOption[] = [
  {
    id: 'soporte',
    name: 'Soporte',
    description: 'Asistencia técnica, fallas de sistema y dudas de uso.',
    iconName: 'Wrench',
  },
  {
    id: 'procesos',
    name: 'Procesos',
    description: 'Gestión de trámites, validaciones y solicitudes operativas.',
    iconName: 'FileCheck',
  },
  {
    id: 'estafa',
    name: 'Estafa',
    description: 'Reportes de fraude, suplantación y transacciones sospechosas.',
    iconName: 'ShieldAlert',
  },
];

export const INITIAL_AGENTS: AgentProfile[] = [
  // --- TEAM LEADERS (ÚNICOS TEAM LEADERS OFICIALES) ---
  {
    id: 'leader-jeremy',
    name: 'Jeremy Adams',
    avatar: '/src/assets/images/leader_jeremy_adams_1793030244749.jpg',
    role: 'Team Leader de Soporte & Seguridad',
    roleType: 'team_leader',
    department: 'soporte',
    departmentName: 'Soporte',
    status: 'online',
    statusBio: 'Líder técnico y supervisor de operaciones. Supervisión de SLA y resolución de casos de alto impacto.',
    email: 'jeremy.adams@soporte.empresa.com',
    username: 'jeremy.adams',
    password: 'LeaderJeremy2026!',
    channelCode: '01',
    rating: 4.98,
    resolvedCount: 840,
    avgResponseTime: '1.0 min',
    maxAgentsLimit: 10,
    assignedAgentIds: ['agent-carlos', 'agent-felipe', 'agent-sofia'],
    cannedResponses: [
      {
        id: 'tl-1',
        title: 'Intervención de Team Leader',
        content: '¡Hola! Soy Jeremy Adams, Team Leader. He tomado tu caso directamente para garantizar una resolución inmediata.',
      },
      {
        id: 'tl-2',
        title: 'Asignación a especialista prioritario',
        content: 'He reasignado tu caso a uno de mis agentes a cargo con máxima prioridad. Te daremos respuesta inmediata.',
      },
    ],
  },
  {
    id: 'leader-lucas',
    name: 'Lucas Wilder',
    avatar: '/src/assets/images/leader_lucas_wilder_1793030379044.jpg',
    role: 'Team Leader de Procesos & Trámites',
    roleType: 'team_leader',
    department: 'procesos',
    departmentName: 'Procesos',
    status: 'online',
    statusBio: 'Líder operativo y supervisor de trámites, control de calidad documental y auditoría.',
    email: 'lucas.wilder@procesos.empresa.com',
    username: 'lucas.wilder',
    password: 'LeaderLucas2026!',
    channelCode: '02',
    rating: 4.97,
    resolvedCount: 810,
    avgResponseTime: '1.1 min',
    maxAgentsLimit: 10,
    assignedAgentIds: ['agent-elena', 'agent-mateo', 'agent-camila'],
    cannedResponses: [
      {
        id: 'tll-1',
        title: 'Supervisión de proceso especial',
        content: '¡Hola! Te saluda Lucas Wilder, Team Leader de Procesos. Estoy supervisando personalmente la aprobación de tu radicado.',
      },
      {
        id: 'tll-2',
        title: 'Validación de comité de trámites',
        content: 'Tu solicitud ha superado el filtro documental de nuestro equipo y ha sido aprobada formalmente.',
      },
    ],
  },

  // --- AGENTES A CARGO ---
  {
    id: 'agent-carlos',
    name: 'Carlos Mendoza',
    avatar: '/src/assets/images/agent_carlos_tech_1793027650432.jpg',
    role: 'Especialista Senior de Soporte',
    roleType: 'agent',
    department: 'soporte',
    departmentName: 'Soporte',
    status: 'online',
    statusBio: 'Resolución de problemas técnicos, incidencias operativas y fallas del sistema.',
    email: 'carlos.mendoza@soporte.empresa.com',
    rating: 4.96,
    resolvedCount: 428,
    avgResponseTime: '1.2 min',
    teamLeaderId: 'leader-jeremy',
    teamLeaderName: 'Jeremy Adams',
    cannedResponses: [
      {
        id: 'c-1',
        title: 'Saludo inicial de soporte',
        content: '¡Hola! Te atiende Carlos del área de Soporte. Estoy revisando el registro de tu caso en el sistema para darte una pronta solución.',
      },
      {
        id: 'c-2',
        title: 'Solicitar captura o detalles',
        content: '¿Podrías por favor compartir una captura de pantalla del error o describir el comportamiento anómalo que estás experimentando?',
      },
      {
        id: 'c-3',
        title: 'Incidencia en resolución',
        content: 'Hemos aislado la falla y aplicado la corrección correspondiente. ¿Podrías por favor verificar si ya funciona con normalidad?',
      },
    ],
  },
  {
    id: 'agent-felipe',
    name: 'Felipe Correa',
    avatar: '/src/assets/images/agent_carlos_tech_1793027650432.jpg',
    role: 'Ingeniero de Diagnóstico Técnico',
    roleType: 'agent',
    department: 'soporte',
    departmentName: 'Soporte',
    status: 'online',
    statusBio: 'Monitoreo de latencia, diagnóstico de conexiones y estabilidad de servicios.',
    email: 'felipe.correa@soporte.empresa.com',
    rating: 4.91,
    resolvedCount: 310,
    avgResponseTime: '1.4 min',
    teamLeaderId: 'leader-jeremy',
    teamLeaderName: 'Jeremy Adams',
    cannedResponses: [
      {
        id: 'f-1',
        title: 'Prueba de diagnóstico',
        content: 'He lanzado una prueba de diagnóstico en tu sesión y los logs indican normalidad en el servicio.',
      },
    ],
  },
  {
    id: 'agent-elena',
    name: 'Elena Vega',
    avatar: '/src/assets/images/agent_elena_billing_1793027651667.jpg',
    role: 'Especialista de Trámites y Procesos',
    roleType: 'agent',
    department: 'procesos',
    departmentName: 'Procesos',
    status: 'online',
    statusBio: 'Gestión y validación de trámites, tiempos de procesamiento y auditoría de solicitudes.',
    email: 'elena.vega@procesos.empresa.com',
    rating: 4.94,
    resolvedCount: 395,
    avgResponseTime: '1.5 min',
    teamLeaderId: 'leader-lucas',
    teamLeaderName: 'Lucas Wilder',
    cannedResponses: [
      {
        id: 'e-1',
        title: 'Saludo de Procesos',
        content: '¡Hola! Soy Elena del departamento de Procesos. Con gusto reviso el estado de tu trámite y la validación de tus requisitos.',
      },
      {
        id: 'e-2',
        title: 'Documentación en revisión',
        content: 'Los soportes documentales han sido ingresados a nuestra mesa de control y están en proceso de verificación formal.',
      },
      {
        id: 'e-3',
        title: 'Trámite completado',
        content: 'Tu proceso ha sido aprobado exitosamente. Se ha generado la constancia con número de radicado oficial.',
      },
    ],
  },
  {
    id: 'agent-mateo',
    name: 'Mateo Valenzuela',
    avatar: '/src/assets/images/agent_mateo_sales_1793027650993.jpg',
    role: 'Auditor de Procesos & Cumplimiento',
    roleType: 'agent',
    department: 'procesos',
    departmentName: 'Procesos',
    status: 'busy',
    statusBio: 'Revisión y validación de trámites especiales, apelaciones y procesos corporativos.',
    email: 'mateo.valenzuela@procesos.empresa.com',
    rating: 4.88,
    resolvedCount: 275,
    avgResponseTime: '1.8 min',
    teamLeaderId: 'leader-lucas',
    teamLeaderName: 'Lucas Wilder',
    cannedResponses: [
      {
        id: 'm-1',
        title: 'Validación de identidad',
        content: '¡Hola! Soy Mateo del área de Procesos. Para continuar con el trámite, requerimos verificar tu identidad con el documento registrado.',
      },
    ],
  },
  {
    id: 'agent-sofia',
    name: 'Sofía Restrepo',
    avatar: '/src/assets/images/agent_sofia_success_1793027651578.jpg',
    role: 'Analista de Prevención de Fraude & Estafas',
    roleType: 'agent',
    department: 'estafa',
    departmentName: 'Estafa',
    status: 'online',
    statusBio: 'Atención prioritaria a reportes de fraude, suplantación de identidad y protección de fondos.',
    email: 'sofia.restrepo@seguridad.empresa.com',
    rating: 4.99,
    resolvedCount: 520,
    avgResponseTime: '0.9 min',
    teamLeaderId: 'leader-jeremy',
    teamLeaderName: 'Jeremy Adams',
    cannedResponses: [
      {
        id: 's-1',
        title: 'Protocolo urgente de estafa',
        content: '¡Hola! Te atiende Sofía del equipo de Seguridad & Estafas. Hemos activado el protocolo de protección inmediata sobre tu cuenta.',
      },
      {
        id: 's-2',
        title: 'Bloqueo preventivo de seguridad',
        content: 'Hemos aplicado un congelamiento preventivo a las operaciones no autorizadas para salvaguardar tu saldo e información sensible.',
      },
    ],
  },
  {
    id: 'agent-camila',
    name: 'Camila Ríos',
    avatar: '/src/assets/images/agent_elena_billing_1793027651667.jpg',
    role: 'Investigadora de Incidentes de Seguridad',
    roleType: 'agent',
    department: 'estafa',
    departmentName: 'Estafa',
    status: 'away',
    statusBio: 'Trazabilidad de pagos fraudulentos, verificación de enlaces phishing y contención.',
    email: 'camila.rios@seguridad.empresa.com',
    rating: 4.92,
    resolvedCount: 180,
    avgResponseTime: '1.1 min',
    teamLeaderId: 'leader-lucas',
    teamLeaderName: 'Lucas Wilder',
    cannedResponses: [
      {
        id: 'cr-1',
        title: 'Verificación de enlace',
        content: 'El enlace que recibiste ha sido analizado y catalogado como sitio malicioso. No ingreses datos en él.',
      },
    ],
  },
];

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};


export function getInitialServerState(): ServerSyncState {
  return {
    agents: JSON.parse(JSON.stringify(INITIAL_AGENTS)),
    tickets: JSON.parse(JSON.stringify(INITIAL_TICKETS)),
    messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
  };
}
