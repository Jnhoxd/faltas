import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';
import { hashPassword } from './utils/crypto';
import { isOldNotification } from './utils/notificationLimits';
import { migrateExistingData } from './utils/migration';
import { StudentList } from './components/StudentList';
import { DataAnalysis } from './components/DataAnalysis';
import { MainScreen } from './components/MainScreen';
import { Student, ActionType } from './types/student';
import { handleAbsences } from './handlers/absenceHandler';
import { handleInauguralClass } from './handlers/inauguralClassHandler';
import { handlePracticalValidation } from './handlers/practicalValidationHandler';
import { studentService } from './services/studentService';
import { notificationService } from './services/notificationService';
import { teamsService } from './services/teamsService';
import { OldNotificationsPopup } from './components/OldNotificationsPopup';
import { UnitSelectionPopup } from './components/UnitSelectionPopup';
import { LoginScreen } from './components/LoginScreen';
import { LoadingOverlay } from './components/LoadingOverlay';
import { LogOut } from 'lucide-react';

const AUTH_STORAGE_KEY = 'authUser';

type AppUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'professor' | 'administrador';
  unit?: string;
  allowedClasses?: string[];
};

export default function App() {
  const [students, setStudents] = useState<(Student & { id: string })[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showOldNotifications, setShowOldNotifications] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'students' | 'analysis'>('main');
  const [selectedType, setSelectedType] = useState<'fic-tecnico' | 'aprendizagem' | null>(null);
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailLoadingMessage, setEmailLoadingMessage] = useState('Enviando email...');

  useEffect(() => {
    document.title = 'Controle de Alunos SENAC';
  }, []);

  useEffect(() => {
    const handleStudentsUpdate = (event: CustomEvent<(Student & { id: string })[]>) => {
      setStudents(event.detail);
    };

    window.addEventListener('studentsUpdated', handleStudentsUpdate as EventListener);

    return () => {
      window.removeEventListener('studentsUpdated', handleStudentsUpdate as EventListener);
    };
  }, []);

  // Check if user needs to select a unit
  useEffect(() => {
    if (currentUser && currentUser.role === 'professor' && !currentUser.unit) {
      setShowUnitSelection(true);
    }
  }, [currentUser]);

  // Migrate existing data on first load
  useEffect(() => {
    const migrate = async () => {
      try {
        setIsMigrating(true);
        await migrateExistingData();
      } catch (error) {
        console.error('Erro na migração:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    migrate();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedUser) {
      return;
    }

    try {
      const parsedUser: AppUser = JSON.parse(savedUser);
      if (parsedUser?.id && parsedUser?.email) {
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const getStudentsWithOldNotifications = () => {
    return students.filter(student => 
      student.notifications?.absences.some(
        notification => !notification.resolved && isOldNotification(notification.date)
      )
    );
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.unit) {
      loadStudents();
    }
  }, [activeTab, isAuthenticated, currentUser?.unit, currentView]);

  useEffect(() => {
    const studentsWithOldNotifications = getStudentsWithOldNotifications();
    if (studentsWithOldNotifications.length > 0 && currentUser?.role === 'administrador' && currentView === 'main') {
      setShowOldNotifications(true);
    }
  }, [students, currentUser, currentView]);

  useEffect(() => {
    const studentsToRemind = students.filter(student =>
      student.notifications?.absences.some(
        notification => !notification.resolved && !notification.teamReminderSent && isOldNotification(notification.date)
      )
    );

    if (!currentUser?.unit || currentUser.role !== 'administrador' || currentView !== 'main' || studentsToRemind.length === 0) {
      return;
    }

    const sendAutomaticReminders = async () => {
      try {
        for (const student of studentsToRemind) {
          await teamsService.sendTeamsReminder(student);

          const reminderIndices = student.notifications?.absences
            .map((notification, index) => ({ notification, index }))
            .filter(item => !item.notification.resolved && !item.notification.teamReminderSent && isOldNotification(item.notification.date))
            .map(item => item.index) || [];

          if (reminderIndices.length > 0) {
            await studentService.markAbsenceNotificationReminderSent(student.id, reminderIndices);
          }
        }
        await loadStudents();
      } catch (error) {
        console.error('Erro ao enviar lembrete Teams automático:', error);
      }
    };

    sendAutomaticReminders();
  }, [students, currentUser, currentView]);

  const loadStudents = async () => {
    if (!currentUser?.unit) return;

    try {
      const type = currentView === 'analysis'
        ? undefined
        : activeTab === 'all'
          ? undefined
          : activeTab as 'fic-tecnico' | 'aprendizagem';

      const loadedStudents = await studentService.getStudents(type, currentUser.unit);
      setStudents(loadedStudents);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      alert('Erro ao carregar alunos');
    }
  };

  const handleImportStudents = async (students: Student[], type: 'fic-tecnico' | 'aprendizagem') => {
    if (!currentUser?.unit) return;

    try {
      await studentService.addStudents(students, currentUser.unit);
      await loadStudents();
    } catch (error) {
      console.error('Erro ao importar alunos:', error);
      alert('Erro ao importar alunos. Tente novamente.');
    }
  };

  const handleStudentAction = async (student: Student & { id: string }, action: ActionType, data?: any) => {
    if (!currentUser) {
      alert('Você precisa estar logado para realizar esta ação');
      return;
    }

    const sender = {
      name: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role,
      unit: currentUser.unit
    };

    let updatedStudent: Student | null = null;

    switch (action) {
      case 'absences':
        setIsSendingEmail(true);
        setEmailLoadingMessage('Enviando notificação de faltas...');
        try {
          updatedStudent = await handleAbsences(student, sender);
        } catch (error) {
          console.error('Erro ao processar faltas:', error);
        } finally {
          setIsSendingEmail(false);
        }
        break;
      case 'inaugural':
        setIsSendingEmail(true);
        setEmailLoadingMessage('Enviando notificação de aula inaugural...');
        try {
          updatedStudent = await handleInauguralClass(student, sender);
          console.log('Resultado do handler de aula inaugural:', updatedStudent ? 'sucesso' : 'sem alterações');
        } catch (error) {
          console.error('Erro ao processar aula inaugural:', error);
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error('Detalhes do erro:', errorMsg);
        } finally {
          setIsSendingEmail(false);
        }
        break;
      case 'practical':
        setIsSendingEmail(true);
        setEmailLoadingMessage('Enviando notificação de práticas profissionais...');
        try {
          updatedStudent = await handlePracticalValidation(student, sender);
        } catch (error) {
          console.error('Erro ao processar práticas:', error);
        } finally {
          setIsSendingEmail(false);
        }
        break;
      case 'resolve-absence':
        if (currentUser?.role !== 'administrador') {
          alert('Apenas administradores podem marcar notificações como resolvidas');
          return;
        }
        try {
          await studentService.resolveAbsenceNotification(student.id, data.notificationIndex);
          await loadStudents();
        } catch (error) {
          console.error('Erro ao resolver notificação:', error);
          alert('Erro ao resolver notificação');
        }
        return;
    }

    if (updatedStudent) {
      try {
        console.log('Recarregando lista de alunos...');
        await loadStudents();
        console.log('Lista de alunos recarregada com sucesso');
      } catch (error) {
        console.error('Erro ao recarregar lista:', error);
        // Não desloga o usuário em caso de erro ao recarregar
      }
    }
  };

  const handleResolveOldAbsenceNotification = async (studentId: string, notificationIndex: number) => {
    if (currentUser?.role !== 'administrador') {
      alert('Apenas administradores podem marcar notificações como resolvidas');
      return;
    }

    try {
      await studentService.resolveAbsenceNotification(studentId, notificationIndex);
      await loadStudents();
    } catch (error) {
      console.error('Erro ao resolver notificação:', error);
      alert('Erro ao resolver notificação');
    }
  };

  const handleResolveAllStudentNotifications = async (student: Student & { id: string }) => {
    if (currentUser?.role !== 'administrador') {
      alert('Apenas administradores podem marcar notificações como resolvidas');
      return;
    }

    const unresolvedNotificationIndices = student.notifications?.absences
      .map((notification, index) => ({ notification, index }))
      .filter(item => !item.notification.resolved && isOldNotification(item.notification.date))
      .map(item => item.index) || [];

    if (unresolvedNotificationIndices.length === 0) {
      return;
    }

    try {
      await studentService.resolveAbsenceNotifications(student.id, unresolvedNotificationIndices);
      await loadStudents();
    } catch (error) {
      console.error('Erro ao resolver notificações do aluno:', error);
      alert('Erro ao resolver notificações do aluno');
    }
  };

  const handleResolveAllPendingNotifications = async (studentsToResolve: (Student & { id: string })[]) => {
    if (currentUser?.role !== 'administrador') {
      alert('Apenas administradores podem marcar notificações como resolvidas');
      return;
    }

    try {
      for (const student of studentsToResolve) {
        const unresolvedNotificationIndices = student.notifications?.absences
          .map((notification, index) => ({ notification, index }))
          .filter(item => !item.notification.resolved && isOldNotification(item.notification.date))
          .map(item => item.index) || [];

        if (unresolvedNotificationIndices.length > 0) {
          await studentService.resolveAbsenceNotifications(student.id, unresolvedNotificationIndices);
        }
      }
      await loadStudents();
    } catch (error) {
      console.error('Erro ao resolver todas as notificações pendentes:', error);
      alert('Erro ao resolver todas as notificações pendentes');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Usuário não encontrado');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const hashedPassword = await hashPassword(password);
      if (userData.password !== hashedPassword) {
        throw new Error('Senha incorreta');
      }

      const user = {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        unit: userData.unit,
        allowedClasses: userData.allowedClasses || []
      };

      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('main');
    setSelectedType(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const handleNavigation = (type: 'fic-tecnico' | 'aprendizagem' | null, view: 'students' | 'analysis' | 'main') => {
    setSelectedType(type);
    setCurrentView(view);
    if (type) {
      setActiveTab(type);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-premium">
      <header className="bg-slate-900 border-b border-slate-700 text-white">
        <div className="container mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Controle de Alunos SENAC
            </h1>
            {currentUser && (
              <p className="mt-2 text-sm md:text-base text-slate-400 max-w-2xl">
                {currentUser.fullName} • <span className="font-semibold">{currentUser.role === 'administrador' ? 'Administrador' : 'Professor'}</span>
                {currentUser.unit && ` • ${currentUser.unit}`}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 hover:border-slate-500"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        {currentView === 'main' ? (
          <MainScreen
            onNavigate={handleNavigation}
            isAdmin={currentUser?.role === 'administrador'}
            userUnit={currentUser?.unit || ''}
            studentsWithOldNotifications={getStudentsWithOldNotifications()}
            onCloseNotifications={() => setShowOldNotifications(false)}
            onResolveNotification={handleResolveOldAbsenceNotification}
            onResolveStudentNotifications={handleResolveAllStudentNotifications}
          />
        ) : currentView === 'students' ? (
          <>
            <button
              onClick={() => handleNavigation(null, 'main')}
              className="mb-6 text-slate-400 hover:text-cyan-400 flex items-center gap-2 transition-colors"
            >
              ← Voltar
            </button>
            <StudentList
              students={students}
              onImportStudents={handleImportStudents}
              onStudentAction={handleStudentAction}
              activeTab={activeTab}
              isAdmin={currentUser?.role === 'administrador'}
              allowedClasses={currentUser?.allowedClasses}
              unit={currentUser?.unit}
              senderName={currentUser?.fullName}
            />
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavigation(null, 'main')}
              className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              ← Voltar
            </button>
            <DataAnalysis students={students} />
          </>
        )}
      </main>

      {showUnitSelection && currentUser && (
        <UnitSelectionPopup
          userId={currentUser.id}
          onClose={() => setShowUnitSelection(false)}
        />
      )}

      {isSendingEmail && <LoadingOverlay message={emailLoadingMessage} />}
    </div>
  );
}