import { Student } from '../types/student';

const NOTIFICATIONS_PER_MONTH = {
  absences: 2,
  inaugural: 1,
  practical: 2
};

// Lista de usuários com permissões especiais para envio ilimitado
const UNLIMITED_USERS = [
  'larissa.cardoso@mg.senac.br'
];

export function isOldNotification(date: string): boolean {
  const notificationDate = new Date(date);
  const now = new Date();
  const diffHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
  return diffHours >= 72;
}

export function canSendNotification(
  student: Student,
  type: 'absences' | 'inaugural' | 'practical',
  isAdmin: boolean = false,
  userEmail?: string
): { allowed: boolean; reason?: string } {
  // Admins podem enviar notificações ilimitadas
  if (isAdmin) {
    return { allowed: true };
  }

  // Usuários com permissão especial podem enviar notificações ilimitadas de faltas
  if (userEmail && UNLIMITED_USERS.includes(userEmail.toLowerCase()) && type === 'absences') {
    return { allowed: true };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get notifications of the specified type
  const notifications = student.notifications?.[type] || [];

  // For inaugural class, check if already notified (only for non-admin users)
  if (type === 'inaugural' && notifications.length > 0) {
    return {
      allowed: false,
      reason: 'Aluno já foi notificado sobre a aula inaugural'
    };
  }

  // Count notifications for the current month
  const thisMonthNotifications = notifications.filter(notification => {
    const notificationDate = new Date(notification.date);
    return (
      notificationDate.getMonth() === currentMonth &&
      notificationDate.getFullYear() === currentYear
    );
  });

  if (thisMonthNotifications.length >= NOTIFICATIONS_PER_MONTH[type]) {
    return {
      allowed: false,
      reason: `Limite de ${NOTIFICATIONS_PER_MONTH[type]} notificação(ões) por mês atingido`
    };
  }

  return { allowed: true };
}

export function getLastNotificationDate(student: Student): string {
  const allNotifications = [
    ...(student.notifications?.absences || []),
    ...(student.notifications?.inaugural || []),
    ...(student.notifications?.practical || [])
  ];

  if (allNotifications.length === 0) return '';

  return allNotifications
    .map(n => n.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}