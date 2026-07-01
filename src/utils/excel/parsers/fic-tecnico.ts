import { Student } from '../../../types/student';
import { sanitizeString } from '../../validators';
import * as XLSX from 'xlsx';

export function parseFicTecnico(sheet: XLSX.WorkSheet): {
  students: Student[];
  courseName: string;
  classNumber: string;
} {
  try {
    if (!sheet || !sheet['!ref']) {
      throw new Error('Planilha vazia ou inválida');
    }

    // Verifica células específicas
    const courseCell = sheet['A8'];
    const classCell = sheet['K8'];
    
    if (!courseCell?.v) {
      throw new Error('Nome do curso não encontrado na célula A8');
    }
    
    if (!classCell?.v) {
      throw new Error('Número da turma não encontrado na célula K8');
    }

    let courseName = String(courseCell.v).trim();
    let classNumber = String(classCell.v).trim();
    
    // Remove prefixos se existirem
    courseName = courseName.replace(/^Curso:\s*/i, '');
    classNumber = classNumber.replace(/^Turma:\s*/i, '');
    
    if (!classNumber || !courseName) {
      throw new Error(
        'Dados inválidos nas células de cabeçalho:\n' +
        `A8 (Curso): "${courseCell.v}"\n` +
        `K8 (Turma): "${classCell.v}"`
      );
    }

    // Converte a planilha para array de linhas
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const students: Student[] = [];
    let hasValidData = false;

    // Processa os alunos a partir da linha 12
    for (let R = 11; R <= range.e.r; ++R) {
      const nameCell = sheet[XLSX.utils.encode_cell({ r: R, c: 6 })]; // Coluna G
      const emailCell = sheet[XLSX.utils.encode_cell({ r: R, c: 17 })]; // Coluna R
      
      // Se encontrou pelo menos uma linha com dados, marca que tem dados válidos
      if (nameCell?.v || emailCell?.v) {
        hasValidData = true;
      }

      // Pula linhas vazias
      if (!nameCell?.v || !emailCell?.v) continue;

      const name = String(nameCell.v).trim();
      const email = String(emailCell.v).trim().toLowerCase();
      
      if (name && email) {
        students.push({
          name: sanitizeString(name),
          email: sanitizeString(email),
          classNumber,
          courseName,
          type: 'fic-tecnico',
          absences: 0,
          inauguralClass: { date: '', notified: false }
        });
      }
    }

    // Se encontrou linhas com algum dado mas nenhum aluno válido
    if (hasValidData && students.length === 0) {
      throw new Error(
        'Foram encontradas linhas com dados, mas nenhum aluno válido.\n' +
        'Verifique se:\n' +
        '- Os nomes dos alunos estão na coluna G\n' +
        '- Os emails dos alunos estão na coluna R\n' +
        '- As informações começam na linha 12\n' +
        '- Não há células vazias entre os dados'
      );
    }

    // Se não encontrou nenhum dado
    if (!hasValidData) {
      throw new Error(
        'Nenhum dado encontrado na planilha.\n' +
        'Verifique se:\n' +
        '- O arquivo está no formato correto\n' +
        '- Os dados começam na linha 12\n' +
        '- Os nomes estão na coluna G\n' +
        '- Os emails estão na coluna R'
      );
    }

    console.log('Importação concluída:', {
      totalAlunos: students.length,
      turma: classNumber,
      curso: courseName
    });

    return { students, courseName, classNumber };
  } catch (error) {
    console.error('Erro ao processar planilha FIC/Técnico:', error);
    throw error;
  }
}