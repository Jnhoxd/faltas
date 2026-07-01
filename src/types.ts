export interface Student {
  name: string;
  email: string;
  absences?: number;
  classNumber?: string;
  inauguralClass?: {
    date: string;
    notified: boolean;
  };
  practicalValidation?: {
    invalidDates: string[];
    notified: boolean;
  };
}

export type ActionType = 'absences' | 'inaugural' | 'practical';

export interface EmailTemplate {
  subject: string;
  message: string;
}