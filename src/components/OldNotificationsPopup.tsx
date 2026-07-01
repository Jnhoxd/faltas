import React from 'react';
import { X, AlertTriangle, Clock, BookOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';
import { Student } from '../types/student';
import { isOldNotification } from '../utils/notificationLimits';

interface OldNotificationsPopupProps {
  students: (Student & { id: string })[];
  onClose: () => void;
  onResolveNotification: (studentId: string, notificationIndex: number) => void;
  onResolveStudentNotifications: (student: Student & { id: string }) => void;
}

export function OldNotificationsPopup({ students, onClose, onResolveNotification, onResolveStudentNotifications, onResolveAllPendingNotifications }: OldNotificationsPopupProps) {
  const totalNotifications = students.reduce((sum, student) => {
    return sum + (student.notifications?.absences.filter(n => !n.resolved && isOldNotification(n.date)).length || 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <AlertTriangle className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Notificações Pendentes
              </h3>
              <p className="text-white/90 text-sm">
                {students.length} {students.length === 1 ? 'aluno com notificação pendente' : 'alunos com notificações pendentes'}
                {' • '}
                {totalNotifications} {totalNotifications === 1 ? 'notificação' : 'notificações'} há mais de 72 horas
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-orange-50 border-l-4 border-orange-400 px-6 py-4">
          <p className="text-sm text-orange-800 leading-relaxed">
            <span className="font-semibold">Atenção:</span> Os alunos abaixo receberam notificações de faltas há mais de 72 horas e ainda não responderam. Considere fazer um acompanhamento com esses alunos.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-4">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Ações rápidas</h4>
              <p className="text-sm text-gray-600">Resolva notificações pendentes individualmente usando os botões de cada aluno.</p>
            </div>
            {students.map((student, studentIndex) => {
              const unresolvedNotifications = student.notifications?.absences
                .map((notification, index) => ({ notification, index }))
                .filter(item => !item.notification.resolved && isOldNotification(item.notification.date)) || [];

              return (
                <div
                  key={student.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-red-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Student Header */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 border-b border-red-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            #{studentIndex + 1}
                          </span>
                          <h4 className="font-bold text-gray-900 text-lg">{student.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <GraduationCap size={16} className="text-gray-500" />
                            <span className="font-medium">Turma:</span>
                            <span>{student.classNumber}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <BookOpen size={16} className="text-gray-500" />
                            <span className="font-medium">Curso:</span>
                            <span>{student.courseName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                        {unresolvedNotifications.length} {unresolvedNotifications.length === 1 ? 'Notificação' : 'Notificações'}
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <h5 className="text-base font-semibold text-gray-900">Notificações de {student.name}</h5>
                        <p className="text-sm text-gray-600">{unresolvedNotifications.length} pendente(s)</p>
                      </div>
                      <button
                        onClick={() => onResolveStudentNotifications(student)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Resolver todas do aluno
                      </button>
                    </div>
                    <div className="space-y-3">
                      {unresolvedNotifications.map(({ notification, index }) => {
                        const date = new Date(notification.date);
                        const now = new Date();
                        const hoursDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
                        const daysDiff = Math.floor(hoursDiff / 24);

                        const formattedDate = date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });

                        const formattedTime = date.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={index}
                            className="bg-white rounded-lg border border-red-200 p-4 hover:border-red-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {notification.count} {notification.count === 1 ? 'Falta' : 'Faltas'}
                                  </div>
                                  {daysDiff >= 7 && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                                      Urgente
                                    </span>
                                  )}
                                </div>

                                {notification.text && (
                                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                    {notification.text}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>Notificado em {formattedDate}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>às {formattedTime}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">
                                  {daysDiff > 0 ? `${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}` : `${hoursDiff}h`}
                                </div>
                                <button
                                  onClick={() => onResolveNotification(student.id, index)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  Resolver
                                </button>
                                <p className="text-xs text-gray-500 mt-1">aguardando</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-700">{students.length}</span> {students.length === 1 ? 'aluno requer' : 'alunos requerem'} atenção
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-sm hover:shadow font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}