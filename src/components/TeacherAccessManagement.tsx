import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';
import { Student } from '../types/student';
import { X, Save, Search, UserCheck, Trash2 } from 'lucide-react';

interface TeacherAccessManagementProps {
  onClose: () => void;
  unit: string;
}

interface ClassInfo {
  classNumber: string;
  courseName: string;
}

export function TeacherAccessManagement({ onClose, unit }: TeacherAccessManagementProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingClass, setDeletingClass] = useState<string | null>(null);

  useEffect(() => {
    loadTeachersAndClasses();
  }, [unit]);

  const loadTeachersAndClasses = async () => {
    try {
      // Load teachers
      const teachersRef = collection(db, 'users');
      const teachersQuery = query(
        teachersRef, 
        where('role', '==', 'professor'),
        where('unit', '==', unit)
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersData = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Load classes with course names
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(studentsRef, where('unit', '==', unit));
      const studentsSnapshot = await getDocs(studentsQuery);
      const classesMap = new Map<string, string>();
      
      studentsSnapshot.docs.forEach(doc => {
        const student = doc.data() as Student;
        if (student.classNumber) {
          classesMap.set(student.classNumber, student.courseName || 'Curso não especificado');
        }
      });

      const classesData: ClassInfo[] = Array.from(classesMap.entries())
        .map(([classNumber, courseName]) => ({ classNumber, courseName }))
        .sort((a, b) => a.classNumber.localeCompare(b.classNumber));

      setTeachers(teachersData);
      setClasses(classesData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar professores e turmas');
      setLoading(false);
    }
  };

  const handleTeacherSelect = async (teacherId: string) => {
    setSelectedTeacher(teacherId);
    const teacher = teachers.find(t => t.id === teacherId);
    setSelectedClasses(teacher?.allowedClasses || []);
  };

  const handleSave = async () => {
    if (!selectedTeacher) return;

    setSaving(true);
    try {
      const teacherRef = doc(db, 'users', selectedTeacher);
      await updateDoc(teacherRef, {
        allowedClasses: selectedClasses,
        updatedAt: new Date().toISOString()
      });

      setTeachers(prev => prev.map(teacher => 
        teacher.id === selectedTeacher 
          ? { ...teacher, allowedClasses: selectedClasses }
          : teacher
      ));

      alert('Permissões atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    const teacher = teachers.find(t => t.id === selectedTeacher);
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário ${teacher?.fullName}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const teacherRef = doc(db, 'users', selectedTeacher);
      await deleteDoc(teacherRef);

      setTeachers(prev => prev.filter(t => t.id !== selectedTeacher));
      setSelectedTeacher(null);
      setSelectedClasses([]);

      alert('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classNumber: string) => {
    const classInfo = classes.find(c => c.classNumber === classNumber);
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a turma ${classNumber} (${classInfo?.courseName})? Todos os alunos desta turma serão excluídos também. Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setDeletingClass(classNumber);
    try {
      // Find and delete all students in this class
      const studentsRef = collection(db, 'students');
      const studentsQuery = query(
        studentsRef,
        where('classNumber', '==', classNumber),
        where('unit', '==', unit)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      const deletePromises = studentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Remove class from the list
      setClasses(prev => prev.filter(c => c.classNumber !== classNumber));
      
      // Remove from selected classes if it was selected
      setSelectedClasses(prev => prev.filter(c => c !== classNumber));

      alert(`Turma ${classNumber} e seus ${studentsSnapshot.docs.length} aluno(s) excluído(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      alert('Erro ao excluir turma');
    } finally {
      setDeletingClass(null);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(classInfo =>
    classInfo.classNumber.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
    classInfo.courseName.toLowerCase().includes(classSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Gerenciar Acesso dos Professores</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lista de Professores */}
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar professor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleTeacherSelect(teacher.id!)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTeacher === teacher.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{teacher.fullName}</div>
                  <div className="text-sm opacity-80">{teacher.email}</div>
                  {teacher.allowedClasses?.length ? (
                    <div className="text-xs mt-1 flex items-center gap-1">
                      <UserCheck size={14} />
                      {teacher.allowedClasses.length} turma(s) permitida(s)
                    </div>
                  ) : null}
                </button>
              ))}

              {filteredTeachers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Nenhum professor encontrado
                </div>
              )}
            </div>
          </div>

          {/* Seleção de Turmas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {selectedTeacher 
                ? `Turmas Permitidas - ${teachers.find(t => t.id === selectedTeacher)?.fullName}`
                : 'Selecione um professor'}
            </h3>

            {selectedTeacher ? (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar turma..."
                      value={classSearchTerm}
                      onChange={(e) => setClassSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredClasses.map((classInfo) => (
                    <div
                      key={classInfo.classNumber}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <label className="flex items-center flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classInfo.classNumber)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses(prev => [...prev, classInfo.classNumber]);
                            } else {
                              setSelectedClasses(prev => prev.filter(c => c !== classInfo.classNumber));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">Turma {classInfo.classNumber}</div>
                          <div className="text-sm text-gray-600">{classInfo.courseName}</div>
                        </div>
                      </label>
                      <button
                        onClick={() => handleDeleteClass(classInfo.classNumber)}
                        disabled={deletingClass === classInfo.classNumber || saving}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Deletar turma e seus alunos"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {filteredClasses.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Nenhuma turma encontrada
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={handleDeleteTeacher}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                    Excluir Usuário
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    <Save size={20} />
                    {saving ? 'Salvando...' : 'Salvar Permissões'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Selecione um professor para gerenciar suas permissões
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}