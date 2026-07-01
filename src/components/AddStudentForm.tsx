import React, { useState } from 'react';
import { Student } from '../types/student';
import { studentService } from '../services/studentService';
import { X } from 'lucide-react';
import { isValidEmail, isValidPhoneNumber, sanitizePhone } from '../utils/validators';

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  type?: 'fic-tecnico' | 'aprendizagem';
  unit: string;
  classesWithCourses: Array<{ classNumber: string; courseName: string }>;
}

export function AddStudentForm({ onClose, onSuccess, type = 'aprendizagem', unit, classesWithCourses }: AddStudentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    classNumber: '',
    courseName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (!formData.email.trim() || !isValidEmail(formData.email)) {
        throw new Error('Email inválido');
      }

      if (formData.whatsapp.trim() && !isValidPhoneNumber(formData.whatsapp)) {
        throw new Error('WhatsApp inválido');
      }

      if (!formData.classNumber.trim()) {
        throw new Error('Selecione uma turma válida');
      }

      if (!formData.courseName.trim()) {
        throw new Error('O curso da turma selecionada não foi encontrado');
      }

      if (!unit) {
        throw new Error('Unidade é obrigatória');
      }
      
      const newStudent: Student = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsapp: sanitizePhone(formData.whatsapp.trim()),
        classNumber: formData.classNumber.trim(),
        courseName: formData.courseName.trim(),
        type,
        absences: 0,
        status: 'active',
        inauguralClass: { date: '', notified: false },
        notifications: {
          absences: [],
          inaugural: [],
          practical: []
        }
      };

      await studentService.addStudent(newStudent, unit);
      
      // Chama onSuccess para atualizar a lista
      onSuccess();
      
      // Fecha o modal
      onClose();
    } catch (error: any) {
      console.error('Erro ao adicionar aluno:', error);
      setError(error.message || 'Erro ao adicionar aluno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold mb-4">
          Adicionar Novo Aluno - {type === 'aprendizagem' ? 'Aprendizagem' : 'FIC/Técnico'}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {classesWithCourses.length === 0 && (
            <div className="p-3 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200">
              Nenhuma turma cadastrada. Cadastre uma turma ou importe alunos com turma existente antes de adicionar um novo aluno.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Aluno*
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome completo"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o email"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turma*
            </label>
            <select
              required
              value={formData.classNumber}
              onChange={(e) => {
                const selectedClassNumber = e.target.value;
                const selectedCourse = classesWithCourses.find(c => c.classNumber === selectedClassNumber)?.courseName || '';
                setFormData({ ...formData, classNumber: selectedClassNumber, courseName: selectedCourse });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || classesWithCourses.length === 0}
            >
              <option value="">Selecione a turma</option>
              {classesWithCourses.map((item) => (
                <option key={item.classNumber} value={item.classNumber}>
                  {`${item.classNumber} — ${item.courseName}`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o número de WhatsApp"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso selecionado*
            </label>
            <input
              type="text"
              value={formData.courseName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
              placeholder="Selecione uma turma para preencher o curso"
              disabled
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Adicionando...</span>
                </>
              ) : (
                'Adicionar Aluno'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}