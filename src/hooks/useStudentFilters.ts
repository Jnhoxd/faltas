import { useState, useMemo } from 'react';
import { Student } from '../types/student';

export function useStudentFilters(students: (Student & { id: string })[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassOrCourse, setSelectedClassOrCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClassOrCourse = !selectedClassOrCourse || 
        student.classNumber === selectedClassOrCourse || 
        student.courseName === selectedClassOrCourse;
      const matchesStatus = !selectedStatus || student.status === selectedStatus || 
        (!student.status && selectedStatus === 'active');

      return matchesSearch && matchesClassOrCourse && matchesStatus;
    });
  }, [students, searchTerm, selectedClassOrCourse, selectedStatus]);

  return {
    searchTerm,
    selectedClassOrCourse,
    selectedStatus,
    setSearchTerm,
    setSelectedClassOrCourse,
    setSelectedStatus,
    filteredStudents
  };
}