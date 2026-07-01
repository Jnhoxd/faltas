import { Student } from '../../types/student';
import { sanitizeString, isValidEmail } from '../validators';

export async function parseCSVFile(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Falha ao ler o arquivo');
        }

        const text = e.target.result as string;
        const lines = text.split('\n').map(line => line.trim());
        
        // Procura a linha que contém o número da turma (E6)
        const classNumberLine = lines[5]; // Linha 6 (índice 5)
        if (!classNumberLine) {
          throw new Error('Linha 6 não encontrada no arquivo');
        }

        const classNumberCells = classNumberLine.split(',');
        const classNumber = classNumberCells[4]?.trim(); // Coluna E (índice 4)
        
        if (!classNumber) {
          throw new Error('Número da turma não encontrado na célula E6');
        }

        // Processa os alunos a partir da linha 9
        const students: Student[] = [];
        
        for (let i = 8; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          
          // Trata células que podem conter vírgulas dentro de aspas
          const cells: string[] = [];
          let currentCell = '';
          let insideQuotes = false;
          
          for (let char of line) {
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              cells.push(currentCell.trim());
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim()); // Adiciona a última célula

          const name = sanitizeString(cells[0]); // Coluna A
          const email = sanitizeString(cells[4]); // Coluna E

          if (name && email) {
            // Remove aspas extras do nome e email
            const cleanName = name.replace(/^"|"$/g, '').trim();
            const cleanEmail = email.replace(/^"|"$/g, '').trim();

            if (isValidEmail(cleanEmail)) {
              students.push({
                name: cleanName,
                email: cleanEmail.toLowerCase(),
                classNumber,
                courseName: 'Aprendizagem',
                type: 'aprendizagem',
                absences: 0,
                inauguralClass: { date: '', notified: false }
              });
            } else {
              console.warn(`Email inválido ignorado: ${cleanEmail} para o aluno: ${cleanName}`);
            }
          }
        }

        if (students.length === 0) {
          throw new Error('Nenhum aluno válido encontrado no arquivo CSV. Verifique se os dados estão nas colunas A (nome) e E (email).');
        }

        console.log(`Importados com sucesso: ${students.length} alunos`);
        resolve(students);
      } catch (error) {
        console.error('Erro ao processar CSV:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo CSV'));
    reader.readAsText(file);
  });
}