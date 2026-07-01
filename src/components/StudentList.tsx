import React, { useState, useMemo } from 'react';
import { AlertCircle, Calendar, Trash2, Search, Briefcase, UserPlus, CheckCircle, UserX, UserMinus, Mail, Clock, CheckCircle2, Edit2, MessageSquare, LayoutGrid, List } from 'lucide-react';
import { Student, ActionType } from '../types/student';
import { SearchFilters } from './SearchFilters';
import { ImportButtons } from './ImportButtons';
import { NotificationHistory } from './NotificationHistory';
import { AddStudentForm } from './AddStudentForm';
import { ReplaceStudentForm } from './ReplaceStudentForm';
import { EditStudentForm } from './EditStudentForm';
import { studentService } from '../services/studentService';
import { teamsService } from '../services/teamsService';
import { useStudentFilters } from '../hooks/useStudentFilters';
import { getLastNotificationDate } from '../utils/notificationLimits';

interface StudentListProps {
  students: (Student & { id: string })[];
  onImportStudents: (students: Student[], type: 'fic-tecnico' | 'aprendizagem') => void;
  onStudentAction: (student: Student & { id: string }, action: ActionType, data?: any) => void;
  activeTab: string;
  isAdmin: boolean;
  allowedClasses?: string[];
  unit?: string;
  senderName?: string;
}

export function StudentList({ 
  students, 
  onImportStudents, 
  onStudentAction, 
  activeTab, 
  isAdmin,
  allowedClasses,
  unit,
  senderName
}: StudentListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('single');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReplaceForm, setShowReplaceForm] = useState<{
    studentId: string;
    name: string;
    status: 'evaded' | 'dropout';
  } | null>(null);
  const [editingStudent, setEditingStudent] = useState<{
    id: string;
    name: string;
    email: string;
    whatsapp?: string;
  } | null>(null);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // Filter by course type if not showing all
    if (activeTab !== 'all') {
      filtered = filtered.filter(student => student.type === activeTab);
    }

    // Filter by teacher permissions if not admin
    if (!isAdmin && allowedClasses) {
      filtered = filtered.filter(student => 
        student.classNumber && allowedClasses.includes(student.classNumber)
      );
    }

    return filtered;
  }, [students, activeTab, isAdmin, allowedClasses]);

  const {
    searchTerm,
    selectedClassOrCourse,
    selectedStatus,
    setSearchTerm,
    setSelectedClassOrCourse,
    setSelectedStatus,
    filteredStudents: searchFilteredStudents
  } = useStudentFilters(filteredStudents);

  const sortedStudents = [...searchFilteredStudents].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir alunos');
      return;
    }

    if (!window.confirm(`Deseja excluir o aluno ${name}?`)) return;
    
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(id);
      const updatedStudents = students.filter(student => student.id !== id);
      window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
    } catch (error) {
      alert('Erro ao excluir aluno');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (student: Student & { id: string }, status: 'evaded' | 'dropout') => {
    try {
      let reason = '';
      
      if (status === 'dropout') {
        reason = prompt('Por favor, informe o motivo da desistência:');
        if (!reason) {
          alert('O motivo da desistência é obrigatório');
          return;
        }
      } else if (status === 'evaded') {
        reason = prompt('Por favor, informe o motivo da evasão:');
        if (!reason) {
          alert('O motivo da evasão é obrigatório');
          return;
        }
      }

      await studentService.updateStudentStatus(student.id, status, reason);

      // Envia notificação ao Teams sobre evasão/desistência
      try {
        await teamsService.sendStatusNotification(student, { name: senderName || 'Sistema', email: '' }, status, reason);
        console.log('Notificação de status enviada ao Teams');
      } catch (err) {
        console.error('Erro ao enviar notificação de status ao Teams:', err);
      }
      const shouldReplace = window.confirm(
        `Aluno marcado como ${status === 'evaded' ? 'evadido' : 'desistente'}. Deseja substituí-lo por um novo aluno?`
      );
      
      if (shouldReplace) {
        setShowReplaceForm({
          studentId: student.id,
          name: student.name,
          status
        });
      } else {
        const updatedStudents = students.map(s => 
          s.id === student.id ? { ...s, status, [status === 'dropout' ? 'dropoutReason' : 'evadedReason']: reason } : s
        );
        window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
      }
    } catch (error) {
      alert('Erro ao atualizar status do aluno');
    }
  };

  const handleAddReason = async (student: Student & { id: string }) => {
    const isDropout = student.status === 'dropout';
    const reason = prompt(`Por favor, informe o motivo da ${isDropout ? 'desistência' : 'evasão'}:`);
    if (!reason) {
      alert(`O motivo da ${isDropout ? 'desistência' : 'evasão'} é obrigatório`);
      return;
    }

    try {
      await studentService.updateStudentStatus(student.id, student.status as 'dropout' | 'evaded', reason);
      const updatedStudents = students.map(s => 
        s.id === student.id ? { 
          ...s, 
          [isDropout ? 'dropoutReason' : 'evadedReason']: reason 
        } : s
      );
      window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
    } catch (error) {
      alert(`Erro ao adicionar motivo da ${isDropout ? 'desistência' : 'evasão'}`);
    }
  };

  const handleEditReason = async (student: Student & { id: string }) => {
    const isDropout = student.status === 'dropout';
    const currentReason = isDropout ? student.dropoutReason : student.evadedReason;
    const newReason = prompt(
      `Editar motivo da ${isDropout ? 'desistência' : 'evasão'}:`,
      currentReason
    );

    if (!newReason || newReason === currentReason) {
      return;
    }

    try {
      await studentService.updateStudentStatus(student.id, student.status as 'dropout' | 'evaded', newReason);
      const updatedStudents = students.map(s => 
        s.id === student.id ? { 
          ...s, 
          [isDropout ? 'dropoutReason' : 'evadedReason']: newReason 
        } : s
      );
      window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
    } catch (error) {
      alert(`Erro ao editar motivo da ${isDropout ? 'desistência' : 'evasão'}`);
    }
  };

  const handleReplaceStudent = async (originalStudentId: string, newStudentData: { name: string; email: string }) => {
    try {
      await studentService.replaceStudent(originalStudentId, newStudentData);
      
      // Recarrega a lista de alunos
      const updatedStudents = await studentService.getStudents(
        activeTab !== 'all' ? activeTab as 'fic-tecnico' | 'aprendizagem' : undefined,
        unit
      );
      
      window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
      setShowReplaceForm(null);
    } catch (error: any) {
      console.error('Erro ao substituir aluno:', error);
      alert(`Erro ao substituir aluno: ${error.message || 'Falha ao atualizar lista'}`);
    }
  };

  const handleAddSuccess = async () => {
    try {
      // Recarrega a lista de alunos após adicionar
      const updatedStudents = await studentService.getStudents(
        activeTab !== 'all' ? activeTab as 'fic-tecnico' | 'aprendizagem' : undefined,
        unit
      );
      
      window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: updatedStudents }));
    } catch (error: any) {
      console.error('Erro ao atualizar lista de alunos:', error);
      alert(`Erro ao atualizar lista de alunos: ${error.message || 'Falha ao carregar alunos'}`);
    }
  };

  const getMaskedEmail = (email: string) => {
    return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  };

  const getSelectedStudent = () => {
    return selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;
  };

  const isOldNotification = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
    return diffHours >= 72;
  };

  const hasUnresolvedOldAbsences = (student: Student) => {
    return student.notifications?.absences.some(
      notification => !notification.resolved && isOldNotification(notification.date)
    );
  };

  const handleResolveAbsence = async (student: Student & { id: string }, notificationIndex: number) => {
    try {
      await studentService.resolveAbsenceNotification(student.id, notificationIndex);
      onStudentAction(student, 'resolve-absence', { notificationIndex });
    } catch (error) {
      alert('Erro ao marcar notificação como resolvida');
    }
  };

  const renderActionButtons = (student: Student & { id: string }) => {
    const notificationCount = (
      (student.notifications?.absences?.length || 0) +
      (student.notifications?.inaugural?.length || 0) +
      (student.notifications?.practical?.length || 0)
    );

    const hasOldAbsences = hasUnresolvedOldAbsences(student);
    const isInactive = student.status === 'evaded' || student.status === 'dropout';

    const buttonClass = "flex items-center gap-2 px-3 py-2 rounded-2xl border font-semibold text-xs transition-all duration-200 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.25)] hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.28)] active:scale-[0.98]";

    const statusButtons = isAdmin && !isInactive && (
      <>
        <button
          onClick={() => handleUpdateStatus(student, 'evaded')}
          className={`${buttonClass} text-amber-950 bg-gradient-to-r from-amber-100/90 to-amber-50/80 border-amber-200/70 hover:from-amber-200/90 hover:to-amber-100/85`}
          title="Marcar como Evadido"
        >
          <UserX size={16} />
          <span className="hidden sm:inline">Evasão</span>
        </button>
        <button
          onClick={() => handleUpdateStatus(student, 'dropout')}
          className={`${buttonClass} text-rose-950 bg-gradient-to-r from-rose-100/90 to-rose-50/80 border-rose-200/70 hover:from-rose-200/90 hover:to-rose-100/85`}
          title="Marcar como Desistente"
        >
          <UserMinus size={16} />
          <span className="hidden sm:inline">Desistência</span>
        </button>
      </>
    );

    const deleteButton = isAdmin && (
      <button
        onClick={() => handleDeleteStudent(student.id, student.name)}
        disabled={isDeleting}
        className={`${buttonClass} text-red-950 bg-gradient-to-r from-red-100/90 to-red-50/85 border-red-200/70 hover:from-red-200/90 hover:to-red-100/90 ${
          isDeleting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Excluir Aluno"
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">Excluir</span>
      </button>
    );

    const historyButton = (
      <button
        onClick={() => setSelectedStudentId(student.id)}
        className={`${buttonClass} text-slate-700 bg-gradient-to-r from-slate-100/85 to-slate-50/80 border-slate-300/60 hover:from-slate-200/85 hover:to-slate-100 relative`}
        title="Ver histórico de notificações"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Histórico</span>
        {notificationCount > 0 && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white">
            {notificationCount}
          </span>
        )}
      </button>
    );

    const resolveButton = hasOldAbsences && isAdmin && (
      <button
        onClick={() => {
          const oldNotificationIndex = student.notifications?.absences.findIndex(
            n => !n.resolved && isOldNotification(n.date)
          );
          if (oldNotificationIndex !== undefined && oldNotificationIndex !== -1) {
            handleResolveAbsence(student, oldNotificationIndex);
          }
        }}
        className={`${buttonClass} text-teal-950 bg-gradient-to-r from-teal-100/90 to-teal-50/85 border-teal-200/70 hover:from-teal-200/90 hover:to-teal-100/85`}
        title="Marcar como resolvido"
      >
        <CheckCircle size={16} />
        <span className="hidden sm:inline">Resolver</span>
      </button>
    );

    const addReasonButton = isAdmin && (
      (student.status === 'dropout' && !student.dropoutReason) ||
      (student.status === 'evaded' && !student.evadedReason)
    ) && (
      <button
        onClick={() => handleAddReason(student)}
        className={`${buttonClass} text-slate-950 bg-gradient-to-r from-indigo-100/90 to-indigo-50/80 border-indigo-200/70 hover:from-indigo-200/90 hover:to-indigo-100/85`}
        title={`Adicionar motivo da ${student.status === 'dropout' ? 'desistência' : 'evasão'}`}
      >
        <UserMinus size={16} />
        <span className="hidden sm:inline">Adicionar Motivo</span>
      </button>
    );

    const editReasonButton = isAdmin && (
      (student.status === 'dropout' && student.dropoutReason) ||
      (student.status === 'evaded' && student.evadedReason)
    ) && (
      <button
        onClick={() => handleEditReason(student)}
        className={`${buttonClass} text-slate-950 bg-gradient-to-r from-indigo-100/90 to-indigo-50/80 border-indigo-200/70 hover:from-indigo-200/90 hover:to-indigo-100/85`}
        title={`Editar motivo da ${student.status === 'dropout' ? 'desistência' : 'evasão'}`}
      >
        <Edit2 size={16} />
        <span className="hidden sm:inline">Editar Motivo</span>
      </button>
    );

    const editButton = isAdmin && (
      <button
        onClick={() => setEditingStudent({ id: student.id, name: student.name, email: student.email, whatsapp: student.whatsapp })}
        className={`${buttonClass} text-slate-800 bg-gradient-to-r from-slate-100/90 to-slate-50/85 border-slate-300/60 hover:from-slate-200/90 hover:to-slate-100`}
        title="Editar informações do aluno"
      >
        <Edit2 size={16} />
        <span className="hidden sm:inline">Editar</span>
      </button>
    );

    const openWhatsapp = (student: Student & { id: string }) => {
      if (!student.whatsapp) {
        alert('Número de WhatsApp não cadastrado para este aluno.');
        return;
      }

      const phone = student.whatsapp.replace(/\D/g, '');
      const courseName = student.courseName || 'seu curso';
      const classNumber = student.classNumber || 'sua turma';
      const message = `Prezado(a)\n\n${student.name},\n\nEspero que esta mensagem encontre você bem.\n\nNotamos que você acumula faltas nas atividades do(a)\n${courseName}\n\n${classNumber}\n\nSua presença é fundamental para nós, e sentimos muito a sua ausência. Queremos reforçar nosso compromisso em oferecer o suporte necessário para que sua jornada de aprendizado seja a melhor possível.\n\n💙 Se houver algum fator dificultando sua participação — seja dúvida, desafio ou qualquer outra questão — conte conosco. Estamos aqui para ajudar e buscar soluções juntos.\n\nSabemos que imprevistos acontecem. Caso decida não continuar no curso, pedimos que formalize sua desistência enviando um e-mail com as informações abaixo:\n\n• Nome completo\n\n• CPF\n\n• Curso\n\n• Motivo da desistência\n\n⚠️ Atenção:\n\n• Se sua ausência não for justificada em até 72 horas, sua desistência será formalizada automaticamente.\n\nEstamos à disposição para esclarecer dúvidas ou fornecer mais informações. Entre em contato conosco pelo e-mail ou telefone disponível.\n\nSua participação é muito importante para nós, e esperamos contar com seu retorno em breve.\n\nAtenciosamente,\n\nEquipe SENAC\n\n${senderName || 'Usuário'}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    };

    const whatsappButton = isAdmin && student.whatsapp && (
      <button
        onClick={() => openWhatsapp(student)}
        className={`${buttonClass} text-emerald-950 bg-gradient-to-r from-emerald-100/90 to-emerald-50/85 border-emerald-200/70 hover:from-emerald-200/90 hover:to-emerald-100/85`}
        title="Enviar mensagem pelo WhatsApp"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>
    );

    const notificationButtons = (
      <>
        {!isInactive && (
          student.type === 'fic-tecnico' ? (
            <>
              <button
                onClick={() => onStudentAction(student, 'absences')}
                className={`${buttonClass} text-red-950 bg-gradient-to-r from-red-100/90 to-red-50/85 border-red-200/70 hover:from-red-200/90 hover:to-red-100/85`}
                title="Notificar Faltas"
              >
                <AlertCircle size={16} />
                <span className="hidden sm:inline">Faltas</span>
              </button>
              <button
                onClick={() => onStudentAction(student, 'inaugural')}
                className={`${buttonClass} text-cyan-950 bg-gradient-to-r from-cyan-100/90 to-cyan-50/85 border-cyan-200/70 hover:from-cyan-200/90 hover:to-cyan-100/85`}
                title="Falta Aula Inaugural"
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">Aula Inaugural</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStudentAction(student, 'absences')}
                className={`${buttonClass} text-red-950 bg-gradient-to-r from-red-100/90 to-red-50/85 border-red-200/70 hover:from-red-200/90 hover:to-red-100/85`}
                title="Notificar Faltas"
              >
                <AlertCircle size={16} />
                <span className="hidden sm:inline">Faltas</span>
              </button>
              <button
                onClick={() => onStudentAction(student, 'practical')}
                className={`${buttonClass} text-purple-950 bg-gradient-to-r from-purple-100/90 to-purple-50/85 border-purple-200/70 hover:from-purple-200/90 hover:to-purple-100/85`}
                title="Prática Profissional"
              >
                <Briefcase size={16} />
                <span className="hidden sm:inline">Práticas</span>
              </button>
            </>
          )
        )}
        {whatsappButton}
      </>
    );

    return (
      <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto py-2">
        {notificationButtons}

        <div className="hidden sm:block w-px h-6 bg-slate-200/60 mx-1" />

        {historyButton}
        {editButton}
        {resolveButton}
        {addReasonButton}
        {editReasonButton}

        {statusButtons && (
          <>
            <div className="hidden sm:block w-px h-6 bg-slate-200/60 mx-1" />
            {statusButtons}
          </>
        )}

        {deleteButton && (
          <>
            <div className="hidden sm:block w-px h-6 bg-slate-200/60 mx-1" />
            {deleteButton}
          </>
        )}
      </div>
    );
  };

  const renderStudentCard = (student: Student & { id: string }, index: number) => {
    const hasOldAbsences = hasUnresolvedOldAbsences(student);
    const isInactive = student.status === 'evaded' || student.status === 'dropout';
    const notificationCount = (
      (student.notifications?.absences?.length || 0) +
      (student.notifications?.inaugural?.length || 0) +
      (student.notifications?.practical?.length || 0)
    );
    
    // Padrão rotativo de cores premium para o accent bar
    const accentColors = ['bg-slate-900', 'bg-blue-900', 'bg-purple-900'];
    const accentColor = accentColors[index % accentColors.length];
    
    return (
      <div
        key={student.id}
        className={`
          relative overflow-hidden rounded-2xl border card-hover-bg
          bg-white backdrop-blur-xl
          shadow-[0_8px_32px_-4px_rgba(15,23,42,0.1)] 
          transition-all duration-300 hover:shadow-[0_24px_48px_-8px_rgba(15,23,42,0.15)]
          hover:-translate-y-0.5 group
          ${hasOldAbsences ? 'border-red-300/40' : 'border-slate-200/50'}
          ${isInactive ? 'opacity-70 border-slate-300/30' : ''}
        `}
      >
        {/* Top accent bar */}
        <div className={`h-1.5 ${hasOldAbsences ? 'bg-red-700' : accentColor}`} />
        
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-400/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-indigo-400/5 blur-3xl pointer-events-none" />
        
        {student.replacedStudent && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] py-1.5 px-3 rounded-bl-xl shadow-sm font-semibold">
            Ingresso Posterior
          </div>
        )}
        
        <div className="relative p-5">
          {/* ===== SECTION 1: STUDENT INFO ===== */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  {student.name}
                </h3>
                <div className="flex items-center gap-2 text-slate-600 mt-2">
                  <Mail size={16} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{getMaskedEmail(student.email)}</span>
                </div>
              </div>
              {isInactive && (
                <div className={`
                  px-3 py-1.5 rounded-lg border font-bold text-xs whitespace-nowrap
                  ${student.status === 'evaded' 
                    ? 'border-orange-300/50 bg-orange-50/80 text-orange-700' 
                    : 'border-red-300/50 bg-red-50/80 text-red-700'
                  }
                `}>
                  {student.status === 'evaded' ? '⚠️ Evadido' : '🚫 Desistente'}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200/70 mb-4" />

          {/* ===== SECTION 2: COURSE & CLASS INFO ===== */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3">Informações da Turma</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="text-base">📚</span>
                <span>{student.classNumber}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="text-base">🎓</span>
                <span>{student.courseName}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200/70 mb-4" />

          {/* ===== SECTION 3: STATUS REASON (if applicable) ===== */}
          {isInactive && (
            (student.status === 'dropout' && student.dropoutReason || 
             student.status === 'evaded' && student.evadedReason) && (
              <>
                <div className="px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/60 mb-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2">Motivo</p>
                  <p className="text-sm text-slate-700 leading-snug font-medium">
                    {student.status === 'dropout' ? student.dropoutReason : student.evadedReason}
                  </p>
                </div>
                <div className="h-px bg-slate-200/70 mb-5" />
              </>
            )
          )}

          {/* ===== SECTION 4: RESPONSES ===== */}
          {student.notifications && (
            (student.notifications.absences.some(n => n.response) ||
             student.notifications.inaugural.some(n => n.response) ||
             student.notifications.practical.some(n => n.response)) && (
              <>
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3">Respostas Recebidas</p>
                  <div className="grid gap-2">
                    {student.notifications.absences.map((notification, index) => (
                      notification.response && (
                        <div key={`absence-${index}`} className="flex items-center gap-2.5 text-emerald-700 text-sm bg-gradient-to-r from-emerald-50 to-emerald-100/40 p-2.5 rounded-2xl border border-emerald-200/50 shadow-sm">
                          <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-600" />
                          <span className="font-semibold">Respondeu sobre {notification.count} falta(s)</span>
                        </div>
                      )
                    ))}
                    {student.notifications.inaugural.map((notification, index) => (
                      notification.response && (
                        <div key={`inaugural-${index}`} className="flex items-center gap-2.5 text-cyan-700 text-sm bg-gradient-to-r from-cyan-50 to-cyan-100/40 p-2.5 rounded-2xl border border-cyan-200/50 shadow-sm">
                          <CheckCircle2 size={18} className="flex-shrink-0 text-cyan-600" />
                          <span className="font-semibold">Respondeu sobre aula inaugural</span>
                        </div>
                      )
                    ))}
                    {student.notifications.practical.map((notification, index) => (
                      notification.response && (
                        <div key={`practical-${index}`} className="flex items-center gap-2.5 text-violet-700 text-sm bg-gradient-to-r from-violet-50 to-violet-100/40 p-2.5 rounded-2xl border border-violet-200/50 shadow-sm">
                          <CheckCircle2 size={18} className="flex-shrink-0 text-violet-600" />
                          <span className="font-semibold">Respondeu sobre práticas</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                <div className="h-px bg-slate-200/70 mb-4" />
              </>
            )
          )}

          {/* ===== SECTION 5: LAST NOTIFICATION ===== */}
          {notificationCount > 0 && (
            <>
              <div className="flex items-center gap-2.5 text-slate-600 text-sm py-3 px-3.5 rounded-2xl bg-slate-50/60 mb-5">
                <Clock size={18} className="text-slate-400 flex-shrink-0" />
                <span>
                  Última notificação: <span className="text-slate-900 font-semibold">{
                    new Date(getLastNotificationDate(student)).toLocaleDateString('pt-BR')
                  }</span>
                </span>
              </div>
              <div className="h-px bg-slate-200/70 mb-5" />
            </>
          )}

          {/* ===== SECTION 6: ACTION BUTTONS ===== */}
          <div className="pt-2 border-t border-slate-200/50">
            {renderActionButtons(student)}
          </div>
        </div>
        
        {student.replacedStudent && (
          <div className="px-5 py-3 bg-gradient-to-r from-blue-50/55 to-indigo-50/55 border-t border-slate-200/50 text-sm">
            <p className="flex items-center gap-2 text-slate-700 font-semibold">
              <UserX size={18} className="text-blue-600 flex-shrink-0" />
              <span>
                Substituiu: <span className="text-slate-900">{student.replacedStudent.name}</span>
                <span className="text-slate-500 ml-2 font-normal text-xs">
                  ({student.replacedStudent.status === 'evaded' ? 'Evadido' : 'Desistente'})
                </span>
              </span>
            </p>
          </div>
        )}
      </div>
    );
  };

  const selectedStudent = getSelectedStudent();

  const classesWithCourses = Array.from(
    students.reduce((map, student) => {
      if (student.classNumber && student.courseName) {
        map.set(student.classNumber, student.courseName);
      }
      return map;
    }, new Map<string, string>()).entries()
  ).map(([classNumber, courseName]) => ({ classNumber, courseName }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-6 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Alunos</h2>

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setViewMode('grid')}
            title="Visão em grade"
            className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('single')}
            title="Visão por linha"
            className={`p-2 rounded-md transition ${viewMode === 'single' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            <List size={18} />
          </button>
        </div>

        {isAdmin && (
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:from-slate-900 hover:to-slate-950 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <UserPlus size={20} />
              Adicionar Aluno
            </button>
            <ImportButtons
              onImportStudents={onImportStudents}
              type={activeTab !== 'all' ? activeTab as 'fic-tecnico' | 'aprendizagem' : undefined}
            />
          </div>
        )}
      </div>

      <SearchFilters
        searchTerm={searchTerm}
        selectedClassOrCourse={selectedClassOrCourse}
        selectedStatus={selectedStatus}
        classesWithCourses={classesWithCourses}
        onSearchChange={setSearchTerm}
        onClassOrCourseChange={setSelectedClassOrCourse}
        onStatusChange={setSelectedStatus}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedStudents.map((student, index) => renderStudentCard(student, index))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedStudents.map((student, index) => renderStudentCard(student, index))}
        </div>
      )}

      {showAddForm && (
        <AddStudentForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleAddSuccess}
          type={activeTab !== 'all' ? activeTab as 'fic-tecnico' | 'aprendizagem' : 'aprendizagem'}
          unit={unit || ''}
          classesWithCourses={classesWithCourses}
        />
      )}

      {showReplaceForm && (
        <ReplaceStudentForm
          onClose={() => setShowReplaceForm(null)}
          onReplace={(newStudent) => handleReplaceStudent(showReplaceForm.studentId, newStudent)}
          originalStudent={{
            name: showReplaceForm.name,
            status: showReplaceForm.status
          }}
        />
      )}

      {selectedStudent && (
        <NotificationHistory
          notifications={selectedStudent.notifications || {
            absences: [],
            inaugural: [],
            practical: []
          }}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {editingStudent && (
        <EditStudentForm
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}