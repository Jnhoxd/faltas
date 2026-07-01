export interface Notification {
  type: 'absences' | 'inaugural' | 'practical';
  date: string;
  details: {
    absences?: number;
    inauguralDate?: string;
    invalidDates?: string[];
  };
}

export interface StudentNotifications {
  studentId: string;
  notifications: Notification[];
}