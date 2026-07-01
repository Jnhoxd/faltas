import React, { useState } from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SENAC_UNITS } from '../types/user';

interface UnitSelectionPopupProps {
  userId: string;
  onClose: () => void;
}

export function UnitSelectionPopup({ userId, onClose }: UnitSelectionPopupProps) {
  const [selectedUnit, setSelectedUnit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUnit) {
      setError('Selecione uma unidade');
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        unit: selectedUnit,
        updatedAt: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      console.error('Erro ao atualizar unidade:', err);
      setError('Erro ao salvar unidade. Tente novamente.');
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

        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Selecione sua Unidade
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          Por favor, selecione a unidade do SENAC à qual você pertence.
          Esta informação é necessária para acessar o ambiente correto do sistema.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unidade*
            </label>
            <select
              id="unit"
              required
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Selecione uma unidade</option>
              {SENAC_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}