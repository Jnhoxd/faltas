import * as XLSX from 'xlsx';
import { Student } from './types/student';
import { isValidEmail, sanitizePhone, sanitizeString } from './validators';

export async function parseExcelFile(file: File, type: 'fic-tecnico' | 'aprendizagem'): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        let students: Student[] = [];
        
        if (type === 'fic-tecnico') {
          const classCell = firstSheet['K8'];
          const courseCell = firstSheet['A8'];
          
          const classNumber = classCell ? String(classCell.v).trim() : '';
          const courseName = courseCell ? String(courseCell.v).trim() : '';
          
          if (!classNumber || !courseName) {
            throw new Error('Número da turma ou nome do curso não encontrado');
          }
          
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' });
          
          students = rows
            .slice(1)
            .map((row: any) => ({
              name: sanitizeString(row['G']),
              email: sanitizeString(row['R']).toLowerCase(),
              whatsapp: sanitizePhone(String(row['Q'] || '')),
              classNumber,
              courseName,
              type: 'fic-tecnico' as const,
              absences: 0,
              inauguralClass: { date: '', notified: false }
            }))
            .filter(student => student.name && student.email);
        } else {
          // Aprendizagem
          const rows = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            range: 'A1:Z50' // Lê uma área maior para garantir
          }) as any[][];

          // Procura o curso na linha 6, coluna B (índice 1)
          const courseName = rows[5]?.[1]?.toString().trim();
          // Procura a turma na linha 6, coluna F (índice 5)
          const classNumber = rows[5]?.[5]?.toString().trim();

          console.log('Dados encontrados:', { courseName, classNumber, totalLinhas: rows.length });

          if (!courseName || !classNumber) {
            throw new Error(
              'Dados não encontrados nas células esperadas:\n' +
              `Curso (B6): ${courseName || 'não encontrado'}\n` +
              `Turma (F6): ${classNumber || 'não encontrado'}`
            );
          }

          // Começa a ler da linha 9 (índice 8) até a linha 45
          for (let i = 8; i < 45; i++) {
            const row = rows[i];
            if (!row) continue;

            const name = row[1]?.toString().trim(); // Coluna B
            const email = row[5]?.toString().trim(); // Coluna F

            console.log(`Processando linha ${i + 1}:`, { name, email });

            if (name && email && isValidEmail(email)) {
              students.push({
                name: sanitizeString(name),
                email: sanitizeString(email).toLowerCase(),
                whatsapp: sanitizePhone(String(row[16] || '')),
                classNumber,
                courseName,
                type: 'aprendizagem',
                absences: 0,
                inauguralClass: { date: '', notified: false }
              });
            }
          }
        }

        const validStudents = students.filter(student => 
          student.name && 
          student.email && 
          isValidEmail(student.email)
        );
        
        if (validStudents.length === 0) {
          throw new Error(
            'Nenhum aluno válido encontrado no arquivo.\n\n' +
            'Para turmas de Aprendizagem, verifique se:\n' +
            '- O nome do curso está na célula B6\n' +
            '- O número da turma está na célula F6\n' +
            '- Os nomes dos alunos começam na célula B9\n' +
            '- Os emails dos alunos começam na célula F9\n\n' +
            'Para turmas FIC/Técnico, verifique se:\n' +
            '- O nome do curso está na célula A8\n' +
            '- O número da turma está na célula K8\n' +
            '- Os nomes dos alunos estão na coluna G\n' +
            '- Os emails dos alunos estão na coluna R'
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