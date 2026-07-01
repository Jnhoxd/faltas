export interface Student {
  name: string;
  email: string;
  absences?: number;
  absencesText?: string;
  classNumber?: string;
  courseName?: string;
  type: 'fic-tecnico' | 'aprendizagem';
  status?: 'active' | 'evaded' | 'dropout' | 'replaced';
  whatsapp?: string;
  dropoutReason?: string;
  evadedReason?: string;
  replacedAt?: string;
  replacedStudent?: {
    name: string;
    status: 'evaded' | 'dropout';
    date: string;
  };
  notifications?: {
    absences: { 
      date: string; 
      count?: number;
      text?: string;
      resolved?: boolean;
      teamReminderSent?: boolean;
      response?: {
        date: string;
        message: string;
      };
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
    inaugural: { 
      date: string;
      response?: {
        date: string;
        message: string;
      };
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
    practical: { 
      date: string;
      text?: string;
      invalidDates?: string[];
      response?: {
        date: string;
        message: string;
      };
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
  };
  inauguralClass?: {
    date: string;
    notified: boolean;
  };
  practicalValidation?: {
    text?: string;
    invalidDates?: string[];
    notified: boolean;
  };
}

export type ActionType = 'absences' | 'inaugural' | 'practical' | 'resolve-absence' | 'update-status' | 'replace-student';