import { Student } from '../../../types/student';
import { sanitizeString } from '../../validators';
import * as XLSX from 'xlsx';

export function parseApprenticeship(sheet: XLSX.WorkSheet): {
  students: Student[];
  courseName: string;
  classNumber: string;
} {
  try {
    if (!sheet || !sheet['!ref']) {
      throw new Error('Planilha vazia ou inválida');
    }

    // Procura as células de cabeçalho
    const courseCell = sheet['B6'];
    const classCell = sheet['F6'];

    if (!courseCell?.v) {
      throw new Error('Nome do curso não encontrado na célula B6');
    }

    if (!classCell?.v) {
      throw new Error('Número da turma não encontrado na célula F6');
    }

    const courseName = String(courseCell.v).trim();
    const classNumber = String(classCell.v).trim();

    console.log('Dados de cabeçalho encontrados:', {
      curso: courseName,
      turma: classNumber
    });

    const students: Student[] = [];
    let hasValidData = false;

    // Processa os alunos da linha 9 até a linha 45
    for (let R = 8; R <= 44; R++) {
      const nameCell = sheet[XLSX.utils.encode_cell({ r: R, c: 1 })]; // Coluna B
      const emailCell = sheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Coluna F
      
      // Log para cada linha processada
      console.log(`Processando linha ${R + 1}:`, {
        nome: nameCell?.v || 'vazio',
        email: emailCell?.v || 'vazio'
      });

      // Se encontrou dados em qualquer uma das células
      if (nameCell?.v || emailCell?.v) {
        hasValidData = true;
      }

      // Se ambas as células têm valor
      if (nameCell?.v && emailCell?.v) {
        const name = String(nameCell.v).trim();
        const email = String(emailCell.v).trim();

        // Log dos dados encontrados
        console.log('Dados válidos encontrados:', { name, email });

        students.push({
          name: sanitizeString(name),
          email: sanitizeString(email).toLowerCase(),
          classNumber,
          courseName,
          type: 'aprendizagem',
          absences: 0,
          inauguralClass: { date: '', notified: false }
        });
      }
    }

    // Se não encontrou nenhum dado
    if (!hasValidData) {
      throw new Error(
        'Nenhum dado encontrado nas células esperadas.\n\n' +
        'Verifique se:\n' +
        '- Os nomes dos alunos estão na coluna B (começando na linha 9)\n' +
        '- Os emails dos alunos estão na coluna F (começando na linha 9)\n' +
        '- O arquivo está no formato correto'
      );
    }

    // Se encontrou dados mas nenhum aluno válido
    if (hasValidData && students.length === 0) {
      throw new Error(
        'Foram encontrados dados nas células, mas nenhum aluno válido.\n\n' +
        'Verifique se:\n' +
        '- Os nomes e emails estão nas colunas corretas (B e F)\n' +
        '- Não há células vazias entre os dados\n' +
        '- Os emails estão em um formato válido'
      );
    }

    console.log('Importação concluída com sucesso:', {
      curso: courseName,
      turma: classNumber,
      totalAlunos: students.length,
      primeiroAluno: students[0]?.name,
      ultimoAluno: students[students.length - 1]?.name
    });

    return { students, courseName, classNumber };
  } catch (error) {
    console.error('Erro ao processar planilha de aprendizagem:', error);
    throw error;
  }
}