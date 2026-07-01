import * as XLSX from 'xlsx';
import { Student } from '../../types/student';
import { isValidEmail } from '../validators';
import { parseApprenticeship } from './parsers/apprenticeship';
import { parseFicTecnico } from './parsers/fic-tecnico';

export async function parseExcelFile(file: File, type: 'fic-tecnico' | 'aprendizagem'): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Não foi possível ler o arquivo');
        }

        console.log('Iniciando processamento do arquivo:', {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type
        });

        // Verifica se é um arquivo .xlsx
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
          throw new Error('O arquivo deve estar no formato .xlsx (Excel)');
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        let workbook;
        
        try {
          workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          console.log('Planilhas encontradas:', workbook.SheetNames);
        } catch (error) {
          console.error('Erro ao ler arquivo Excel:', error);
          throw new Error('Erro ao ler o arquivo Excel. Verifique se o arquivo não está corrompido.');
        }
        
        if (!workbook.SheetNames.length) {
          throw new Error('O arquivo Excel não contém nenhuma planilha');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) {
          throw new Error('Não foi possível ler a primeira planilha do arquivo');
        }

        console.log('Analisando primeira planilha:', {
          nome: workbook.SheetNames[0],
          intervalo: firstSheet['!ref'],
          tipo: type
        });

        // Parse based on type
        const { students, courseName, classNumber } = type === 'fic-tecnico'
          ? parseFicTecnico(firstSheet)
          : parseApprenticeship(firstSheet);

        console.log('Dados extraídos:', {
          curso: courseName,
          turma: classNumber,
          totalAlunos: students.length
        });

        // Validate students
        const validStudents = students.filter(student => {
          const isValid = student.name && student.email && isValidEmail(student.email);
          if (!isValid) {
            console.warn('Aluno inválido encontrado:', {
              nome: student.name || 'vazio',
              email: student.email || 'vazio',
              motivo: !student.name 
                ? 'Nome vazio' 
                : !student.email 
                ? 'Email vazio' 
                : 'Email inválido'
            });
          }
          return isValid;
        });
        
        console.log('Validação concluída:', {
          alunosEncontrados: students.length,
          alunosValidos: validStudents.length,
          alunosInvalidos: students.length - validStudents.length
        });
        
        if (validStudents.length === 0) {
          throw new Error(
            'Nenhum aluno válido encontrado no arquivo. Verifique se:\n\n' +
            (type === 'aprendizagem' 
              ? '- O nome do curso está na célula B6\n' +
                '- O número da turma está na célula F6\n' +
                '- Os nomes dos alunos estão na coluna B (B9 até B45)\n' +
                '- Os emails dos alunos estão na coluna F (F9 até F45)'
              : '- O nome do curso está na célula A8\n' +
                '- O número da turma está na célula K8\n' +
                '- Os nomes dos alunos estão na coluna G\n' +
                '- Os emails dos alunos estão na coluna R') +
            '\n\nCertifique-se também que:\n' +
            '- O arquivo está no formato correto (.xlsx)\n' +
            '- As células não estão vazias\n' +
            '- Os emails estão em um formato válido'
          );
        }
        
        resolve(validStudents);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsArrayBuffer(file);
  });
}