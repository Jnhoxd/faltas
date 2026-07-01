import React from 'react';
import { Upload } from 'lucide-react';
import { Student } from '../types/student';
import { parseExcelFile } from '../utils/excel';

interface ImportButtonsProps {
  onImportStudents: (students: Student[], type: 'fic-tecnico' | 'aprendizagem') => void;
  type?: 'fic-tecnico' | 'aprendizagem';
}

export function ImportButtons({ onImportStudents, type }: ImportButtonsProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, studentType: 'fic-tecnico' | 'aprendizagem') => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        throw new Error('Nenhum arquivo selecionado');
      }

      // Verifica o tipo do arquivo
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        throw new Error('O arquivo deve estar no formato .xlsx (Excel)');
      }

      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';

      const students = await parseExcelFile(file, studentType);
      onImportStudents(students, studentType);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar arquivo. Verifique o formato.');
    }
  };

  if (type) {
    const isFileType = type === 'fic-tecnico';
    return (
      <label className={`cursor-pointer bg-gradient-to-r ${
        isFileType 
          ? 'from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950'
          : 'from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950'
      } text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-semibold text-sm`}>
        <Upload size={20} />
        Importar {type === 'fic-tecnico' ? 'FIC/Técnico' : 'Aprendizagem'}
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => handleFileChange(e, type)}
          className="hidden"
          key={Date.now()}
        />
      </label>
    );
  }

  return (
    <div className="flex gap-2">
      <label className="cursor-pointer bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:from-blue-900 hover:to-blue-950 transition-all shadow-md hover:shadow-lg font-semibold text-sm">
        <Upload size={20} />
        Importar FIC/Técnico
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => handleFileChange(e, 'fic-tecnico')}
          className="hidden"
          key={Date.now()}
        />
      </label>
      <label className="cursor-pointer bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:from-indigo-800 hover:to-indigo-950 transition-all shadow-md hover:shadow-lg font-semibold text-sm">
        <Upload size={20} />
        Importar Aprendizagem
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => handleFileChange(e, 'aprendizagem')}
          className="hidden"
          key={Date.now()}
        />
      </label>
    </div>
  );
}