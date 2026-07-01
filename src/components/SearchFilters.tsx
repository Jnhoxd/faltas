import React, { useState } from 'react';

interface SearchFiltersProps {
  searchTerm: string;
  selectedClassOrCourse: string;
  selectedStatus: string;
  classesWithCourses: Array<{ classNumber: string; courseName: string }>;
  onSearchChange: (value: string) => void;
  onClassOrCourseChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function SearchFilters({
  searchTerm,
  selectedClassOrCourse,
  selectedStatus,
  classesWithCourses,
  onSearchChange,
  onClassOrCourseChange,
  onStatusChange
}: SearchFiltersProps) {
  const [classInput, setClassInput] = useState(selectedClassOrCourse);

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClassInput(value);
    onClassOrCourseChange(value);
  };

  return (
    <div className="mb-6 premium-panel p-6 rounded-[1.75rem] border border-white/10 shadow-[0_34px_100px_-55px_rgba(15,23,42,0.6)]">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_auto] lg:items-end">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 mb-3">Nome do Aluno</label>
            <input
              type="text"
              placeholder="Digite o nome do aluno..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="premium-input w-full px-5 py-3 rounded-3xl transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 mb-3">Turma</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite ou selecione a turma..."
                value={classInput}
                onChange={handleClassChange}
                className="premium-input w-full px-5 py-3 rounded-3xl transition-all duration-200"
                list="class-list"
                autoComplete="off"
              />
              <datalist id="class-list">
                {classesWithCourses.map((item) => (
                  <option
                    key={`${item.classNumber}-${item.courseName}`}
                    value={item.classNumber}
                  >
                    {`${item.classNumber} ${item.courseName}`}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)]">
          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 mb-4">Status</label>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={() => onStatusChange('')}
              className={`premium-pill ${selectedStatus === '' ? 'premium-pill-selected text-white bg-slate-900 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.65)]' : 'text-slate-300 bg-slate-900/10 border-slate-700 hover:bg-slate-900/20'}`}
            >
              Todos
            </button>
            <button
              onClick={() => onStatusChange('active')}
              className={`premium-pill ${selectedStatus === 'active' ? 'premium-pill-selected text-white bg-emerald-500 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.45)]' : 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20 hover:bg-emerald-500/15'}`}
            >
              Ativos
            </button>
            <button
              onClick={() => onStatusChange('evaded')}
              className={`premium-pill ${selectedStatus === 'evaded' ? 'premium-pill-selected text-white bg-orange-500 shadow-[0_20px_50px_-30px_rgba(249,115,22,0.45)]' : 'text-orange-200 bg-orange-500/10 border-orange-400/20 hover:bg-orange-500/15'}`}
            >
              Evadidos
            </button>
            <button
              onClick={() => onStatusChange('dropout')}
              className={`premium-pill ${selectedStatus === 'dropout' ? 'premium-pill-selected text-white bg-rose-500 shadow-[0_20px_50px_-30px_rgba(244,63,94,0.45)]' : 'text-rose-200 bg-rose-500/10 border-rose-400/20 hover:bg-rose-500/15'}`}
            >
              Desistentes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}