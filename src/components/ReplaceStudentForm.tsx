import React, { useState } from 'react';
import { X } from 'lucide-react';
import { isValidEmail } from '../utils/validators';

interface ReplaceStudentFormProps {
  onClose: () => void;
  onReplace: (newStudent: { name: string; email: string }) => void;
  originalStudent: {
    name: string;
    status: 'evaded' | 'dropout';
  };
}

export function ReplaceStudentForm({ onClose, onReplace, originalStudent }: ReplaceStudentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    onReplace(formData);
    onClose();
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
          Substituir Aluno {originalStudent.status === 'evaded' ? 'Evadido' : 'Desistente'}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Substituindo o aluno: <span className="font-medium">{originalStudent.name}</span>
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Novo Aluno*
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome completo"
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
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Substituir Aluno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}