import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { hashPassword } from '../utils/crypto';
import { isValidEmail } from '../utils/validators';
import { SENAC_UNITS, getAdminPassword } from '../types/user';

interface RegisterFormProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

export function RegisterForm({ onBack, onRegisterSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    registrationNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'professor',
    adminPassword: '',
    unit: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (!formData.registrationNumber.trim()) {
      setError('Número de matrícula é obrigatório');
      return;
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setError('Email inválido. O email deve seguir o formato nome.sobrenome@mg.senac.br');
      return;
    }

    if (!formData.unit) {
      setError('Selecione uma unidade');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.role === 'administrador') {
      const expectedPassword = getAdminPassword(formData.unit);
      if (formData.adminPassword !== expectedPassword) {
        setError('Senha de administrador incorreta');
        return;
      }
    }

    setLoading(true);

    try {
      // Verificar se o email já está cadastrado
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Este email já está cadastrado');
        setLoading(false);
        return;
      }

      // Salvar o usuário no Firestore com a senha hasheada
      const hashedPassword = await hashPassword(formData.password);
      await addDoc(collection(db, 'users'), {
        fullName: formData.fullName,
        registrationNumber: formData.registrationNumber,
        email: formData.email.toLowerCase(),
        password: hashedPassword,
        role: formData.role,
        unit: formData.unit,
        createdAt: new Date().toISOString()
      });

      alert('Cadastro realizado com sucesso!');
      onRegisterSuccess();
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Preencha os dados abaixo para se cadastrar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                Número de Matrícula
              </label>
              <input
                id="registrationNumber"
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Digite seu número de matrícula"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                Unidade
              </label>
              <select
                id="unit"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione uma unidade</option>
                {SENAC_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="nome.sobrenome@mg.senac.br"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de Usuário
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'professor' | 'administrador' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="professor">Professor</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            {formData.role === 'administrador' && (
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Senha de Administrador
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Digite a senha de administrador"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Digite sua senha"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Confirme sua senha"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}