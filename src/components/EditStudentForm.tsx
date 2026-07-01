import React, { useState } from 'react';
import { X } from 'lucide-react';
import { isValidEmail, isValidPhoneNumber, sanitizePhone } from '../utils/validators';
import { studentService } from '../services/studentService';

interface EditStudentFormProps {
  student: {
    id: string;
    name: string;
    email: string;
    whatsapp?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStudentForm({ student, onClose, onSuccess }: EditStudentFormProps) {
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    whatsapp: student.whatsapp || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (!formData.email.trim() || !isValidEmail(formData.email)) {
        throw new Error('Email inválido');
      }

      if (formData.whatsapp.trim() && !isValidPhoneNumber(formData.whatsapp)) {
        throw new Error('WhatsApp inválido');
      }

      await studentService.updateStudentInfo(student.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsapp: sanitizePhone(formData.whatsapp.trim())
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar aluno:', error);
      setError(error.message || 'Erro ao atualizar aluno. Tente novamente.');
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

        <h3 className="text-lg font-semibold mb-4">Editar Aluno</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  <span>Salvando...</span>
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
