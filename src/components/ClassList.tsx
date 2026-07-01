import React from 'react';
import { Plus } from 'lucide-react';
import { Class } from '../types';

interface ClassListProps {
  classes: Class[];
  onAddClass: () => void;
  onSelectClass: (classId: string) => void;
}

export function ClassList({ classes, onAddClass, onSelectClass }: ClassListProps) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Turmas</h2>
        <button
          onClick={onAddClass}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus size={20} />
          Nova Turma
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => onSelectClass(cls.id)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{cls.name}</h3>
            <p className="text-gray-600">{cls.students.length} alunos</p>
          </div>
        ))}
      </div>
    </div>
  );
}