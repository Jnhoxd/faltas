import { Student } from '../types/student';

type TeamsSender = {
  name: string;
  email: string;
  role?: 'professor' | 'administrador';
  unit?: string;
};

const TEAMS_NOTIFY_ENDPOINT = (import.meta.env.VITE_TEAMS_NOTIFY_ENDPOINT as string | undefined)
  || '/.netlify/functions/teams-notify';

const TEAM_WEBHOOK_CONFIGURED = Boolean(import.meta.env.VITE_TEAMS_WEBHOOK_URL);
const TEAMS_ENDPOINT_CONFIGURED = Boolean(import.meta.env.VITE_TEAMS_NOTIFY_ENDPOINT) || Boolean(TEAMS_NOTIFY_ENDPOINT);

const normalizeLabelValue = (value: string | undefined): string => {
  const text = String(value || '').trim();
  return text.replace(/^(Turma:|Curso:)\s*/i, '').trim() || 'não informado';
};

if (!TEAM_WEBHOOK_CONFIGURED && !TEAMS_ENDPOINT_CONFIGURED) {
  console.warn('Teams endpoint is not configured. Notifications will not be sent.');
}

export const teamsService = {
  async sendTeamsReminder(student: Student & { id: string }): Promise<void> {
    // Mensagem específica para lembrete automático (alunos com notificação há mais de 72 horas)
    const sender = { name: 'Sistema', email: 'sistema@senac.br' };
    const notificationType = 'Lembrete (mais de 72 horas)';
    await this.sendStudentNotification(student, sender, notificationType);
  },

  async sendStudentNotification(
    student: Student & { id: string },
    sender: TeamsSender,
    notificationType?: string
  ): Promise<void> {
    if (!TEAM_WEBHOOK_CONFIGURED && !TEAMS_ENDPOINT_CONFIGURED) {
      throw new Error('Teams notification is not configured. Configure VITE_TEAMS_WEBHOOK_URL or VITE_TEAMS_NOTIFY_ENDPOINT.');
    }

    const label = notificationType || 'Notificação';
    const isReminder = String(label).toLowerCase().includes('lembrete');
    const className = normalizeLabelValue(student.classNumber);
    const courseName = normalizeLabelValue(student.courseName);

    const body = {
      text: isReminder
        ? `Nova notificação — Lembrete: já se passaram mais de 72 horas desde a última notificação do tipo ${label} para o(a) aluno(a) ${student.name}. Turma: ${className}. Curso: ${courseName}. Enviada por: ${sender.name || sender.email || 'não informado'}`
        : [
            'Nova notificação:',
            `Foi encaminhada uma notificação de ${label} para o(a) aluno(a): ${student.name}.`,
            `Turma: ${className}.`,
            `Curso: ${courseName}.`,
            '',
            `Enviada por: ${sender.name || sender.email || 'não informado'}`
          ].join('\n')
    };

    console.log('[teamsService] Enviando notificação Teams', { endpoint: TEAMS_NOTIFY_ENDPOINT, body });

    try {
      const response = await fetch(TEAMS_NOTIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
      });

      console.log('[teamsService] Response status', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const message = await response.text();
        console.error('[teamsService] Falha ao enviar notificação Teams', { status: response.status, message });
        throw new Error(`Falha ao enviar notificação Teams: ${response.status} ${message}`);
      }

      // Some webhook endpoints return 204 No Content. Log text only if present.
      try {
        const text = await response.text();
        if (text) console.log('[teamsService] Response body', { text });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('[teamsService] Erro ao chamar endpoint de notificação', err);
      throw err;
    }
  },

  async sendStatusNotification(
    student: Student & { id: string },
    sender: TeamsSender,
    status: 'evaded' | 'dropout',
    reason?: string
  ): Promise<void> {
    if (!TEAM_WEBHOOK_CONFIGURED && !TEAMS_ENDPOINT_CONFIGURED) {
      throw new Error('Teams notification is not configured. Configure VITE_TEAMS_WEBHOOK_URL or VITE_TEAMS_NOTIFY_ENDPOINT.');
    }

    const actionText = status === 'evaded' ? 'evadiu' : 'desistiu';
    const title = `⚠️ **ATENÇÃO - ${status === 'evaded' ? 'EVASÃO' : 'DESISTÊNCIA'}**`;

    const className = normalizeLabelValue(student.classNumber);
    const courseName = normalizeLabelValue(student.courseName);

    const body = {
      text: [
        title,
        'Prezada equipe da secretaria,',
        '',
        `O(a) aluno(a): **${student.name}** da turma: **${className}** do curso: **${courseName}**, ${actionText}.`,
        `Motivo: ${reason || 'Motivo não informado'}`,
        '',
        `Gentileza realizar os procedimentos necessários.`
      ].join('\n')
    };

    console.log('[teamsService] Enviando status notification to Teams', { body });

    const response = await fetch(TEAMS_NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('[teamsService] Falha ao enviar status notification', { status: response.status, message });
      throw new Error(`Falha ao enviar notificação Teams: ${response.status} ${message}`);
    }
  }
};
