import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';

export const notificationService = {
  async getStudentNotifications(studentId: string) {
    const docRef = doc(db, 'students', studentId);
    const snapshot = await getDocs(query(collection(db, 'students'), where('__name__', '==', studentId)));
    const student = snapshot.docs[0]?.data() as Student;
    
    return student?.notifications || {
      absences: [],
      inaugural: [],
      practical: []
    };
  },

  async addNotification(
    studentId: string, 
    type: 'absences' | 'inaugural' | 'practical', 
    data: any,
    sender: { name: string; email: string }
  ) {
    try {
      const docRef = doc(db, 'students', studentId);
      const snapshot = await getDocs(query(collection(db, 'students'), where('__name__', '==', studentId)));
      const student = snapshot.docs[0]?.data() as Student;
      
      const notifications = student?.notifications || {
        absences: [],
        inaugural: [],
        practical: []
      };

      const newNotification = {
        date: new Date().toISOString(),
        ...data,
        sentBy: sender
      };

      switch (type) {
        case 'absences':
          notifications.absences = [...notifications.absences, {
            ...newNotification,
            resolved: false,
            teamReminderSent: false
          }];
          break;
        case 'inaugural':
          notifications.inaugural = [...notifications.inaugural, newNotification];
          break;
        case 'practical':
          notifications.practical = [...notifications.practical, newNotification];
          break;
      }

      // Atualiza o documento com as novas notificações
      await updateDoc(docRef, { 
        notifications,
        // Atualiza também o contador de faltas para absences
        ...(type === 'absences' ? {
          absences: (student?.absences || 0) + (data.count || 0)
        } : {})
      });

      return notifications;
    } catch (error) {
      console.error('Erro ao adicionar notificação:', error);
      throw new Error('Falha ao salvar notificação');
    }
  }
};