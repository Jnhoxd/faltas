import React from 'react';
import { AlertCircle, Calendar, Briefcase, X, User, Clock } from 'lucide-react';

interface NotificationHistoryProps {
  notifications: {
    absences: { 
      date: string; 
      count: number;
      text?: string;
      resolved?: boolean;
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
    inaugural: { 
      date: string;
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
    practical: { 
      date: string;
      text: string;
      sentBy?: {
        name: string;
        email: string;
      };
    }[];
  };
  onClose: () => void;
}

export function NotificationHistory({ notifications, onClose }: NotificationHistoryProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const renderSentBy = (sentBy?: { name: string; email: string }) => {
    if (!sentBy) return null;
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <User size={12} />
        <span>Enviado por {sentBy.name}</span>
      </div>
    );
  };

  const renderTimestamp = (date: string) => (
    <div className="flex items-center gap-1 text-xs text-gray-400">
      <Clock size={12} />
      <span>{formatDateTime(date)}</span>
    </div>
  );

  const hasNotifications = 
    (notifications.absences?.length > 0) ||
    (notifications.inaugural?.length > 0) ||
    (notifications.practical?.length > 0);

  const totalNotifications = 
    (notifications.absences?.length || 0) +
    (notifications.inaugural?.length || 0) +
    (notifications.practical?.length || 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Histórico de Notificações</h3>
              <p className="text-sm text-gray-500 mt-1">
                Total de notificações: {totalNotifications}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {notifications.absences?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" />
                  Notificações de Faltas ({notifications.absences.length})
                </h4>
                <div className="space-y-3">
                  {notifications.absences.map((n, i) => (
                    <div 
                      key={i} 
                      className={`bg-red-50 p-4 rounded-lg border border-red-100 ${
                        n.resolved ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-red-700 font-medium">{n.count} falta(s)</p>
                          {n.text && (
                            <p className="text-red-600 text-sm mt-1">{n.text}</p>
                          )}
                        </div>
                        {n.resolved && (
                          <span className="text-green-500 text-xs bg-green-50 px-2 py-1 rounded-full">
                            Resolvido
                          </span>
                        )}
                      </div>
                      {renderTimestamp(n.date)}
                      {renderSentBy(n.sentBy)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notifications.inaugural?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  Faltas em Aula Inaugural ({notifications.inaugural.length})
                </h4>
                <div className="space-y-3">
                  {notifications.inaugural.map((n, i) => (
                    <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-blue-700">Falta na aula inaugural</p>
                      <p className="text-blue-600 text-sm mt-1">
                        Data da aula: {formatDate(n.date)}
                      </p>
                      {renderSentBy(n.sentBy)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notifications.practical?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-green-500" />
                  Práticas Profissionais ({notifications.practical.length})
                </h4>
                <div className="space-y-3">
                  {notifications.practical.map((n, i) => (
                    <div key={i} className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <p className="text-green-700">{n.text}</p>
                      {renderTimestamp(n.date)}
                      {renderSentBy(n.sentBy)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasNotifications && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma notificação enviada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}