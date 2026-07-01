import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, BarChart2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { TeacherAccessManagement } from './TeacherAccessManagement';
import { OldNotificationsPopup } from './OldNotificationsPopup';
import { Student } from '../types/student';

interface MainScreenProps {
  onNavigate: (type: 'fic-tecnico' | 'aprendizagem' | null, view: 'students' | 'analysis' | 'main') => void;
  isAdmin: boolean;
  userUnit: string;
  studentsWithOldNotifications: (Student & { id: string })[];
  onCloseNotifications: () => void;
  onResolveNotification: (studentId: string, notificationIndex: number) => void;
  onResolveStudentNotifications: (student: Student & { id: string }) => void;
}

export function MainScreen({ onNavigate, isAdmin, userUnit, studentsWithOldNotifications, onCloseNotifications, onResolveNotification, onResolveStudentNotifications }: MainScreenProps) {
  const [showTeacherAccess, setShowTeacherAccess] = useState(false);
  const [showOldNotifications, setShowOldNotifications] = useState(studentsWithOldNotifications.length > 0 && isAdmin);

  React.useEffect(() => {
    setShowOldNotifications(studentsWithOldNotifications.length > 0 && isAdmin);
  }, [studentsWithOldNotifications, isAdmin]);

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-7xl mx-auto"
    >
      <div className="text-center mb-16">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="rounded-full bg-slate-100/90 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm shadow-slate-200">
            Dashboard
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Bem-vindo ao Sistema
          </h2>
          <p className="max-w-2xl text-slate-600 text-lg leading-8">
            Selecione uma opção para começar e acompanhe os principais controles da sua unidade.
          </p>
          <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"></div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => onNavigate('fic-tecnico', 'students')}
          className="group relative bg-white/95 p-7 rounded-[1.75rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 flex flex-col items-center gap-5 text-center"
        >
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-300/30 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
              FIC/Técnico
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[18rem]">
              Gerenciar alunos dos cursos FIC e Técnicos
            </p>
          </div>
        </motion.button>

        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => onNavigate('aprendizagem', 'students')}
          className="group relative bg-white/95 p-7 rounded-[1.75rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 flex flex-col items-center gap-5 text-center"
        >
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-300/30 transition-transform duration-300 group-hover:scale-105">
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
              Aprendizagem
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[18rem]">
              Gerenciar alunos dos cursos de Aprendizagem
            </p>
          </div>
        </motion.button>

        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => onNavigate(null, 'analysis')}
          className="group relative bg-white/95 p-7 rounded-[1.75rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 flex flex-col items-center gap-5 text-center"
        >
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-400/20 transition-transform duration-300 group-hover:scale-105">
            <BarChart2 size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
              Análise de Dados
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[18rem]">
              Visualizar estatísticas e relatórios
            </p>
          </div>
        </motion.button>

        {isAdmin && (
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowTeacherAccess(true)}
            className="group relative bg-white/95 p-7 rounded-[1.75rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 flex flex-col items-center gap-5 text-center"
          >
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-300/30 transition-transform duration-300 group-hover:scale-105">
              <Settings size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Gerenciar Acessos
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[18rem]">
                Configurar acesso dos professores às turmas
              </p>
            </div>
          </motion.button>
        )}
      </div>

      {showTeacherAccess && (
        <TeacherAccessManagement
          onClose={() => setShowTeacherAccess(false)}
          unit={userUnit}
        />
      )}

      {showOldNotifications && isAdmin && studentsWithOldNotifications.length > 0 && (
        <OldNotificationsPopup
          students={studentsWithOldNotifications}
          onClose={() => {
            setShowOldNotifications(false);
            onCloseNotifications();
          }}
          onResolveNotification={onResolveNotification}
          onResolveStudentNotifications={onResolveStudentNotifications}
        />
      )}
    </motion.div>
  );
}