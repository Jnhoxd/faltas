import { Student } from '../types/student';
import { sendAbsenceEmail } from '../utils/email';
import { notificationService } from '../services/notificationService';
import { teamsService } from '../services/teamsService';
import { canSendNotification } from '../utils/notificationLimits';

export async function handleAbsences(
  student: Student & { id: string }, 
  sender: { name: string; email: string; role?: 'professor' | 'administrador'; unit?: string }
): Promise<Student | null> {
  console.log('Iniciando handler de faltas:', {
    student: student.name,
    sender: sender.name,
    unit: sender.unit,
    studentType: student.type
  });

  // Verifica se o aluno está inativo
  if (student.status === 'evaded' || student.status === 'dropout') {
    alert('Não é possível enviar notificações para alunos evadidos ou desistentes');
    return null;
  }

  // Verifica limite de notificações (passa o email do usuário para verificar permissões especiais)
  const { allowed, reason } = canSendNotification(
    student, 
    'absences', 
    sender.role === 'administrador',
    sender.email
  );
  
  if (!allowed) {
    alert(reason);
    return null;
  }

  const absencesText = prompt(`Informe a quantidade de faltas do(a) aluno(a) ${student.name}:`);
  if (!absencesText) return null;

  if (!student.classNumber || !student.courseName) {
    alert('Erro: Dados da turma ou curso não encontrados para este aluno');
    return null;
  }

  if (!sender.unit) {
    alert('Erro: Unidade do usuário não encontrada');
    return null;
  }

  console.log('Enviando email com parâmetros:', {
    studentName: student.name,
    studentEmail: student.email,
    absencesText,
    classNumber: student.classNumber,
    courseName: student.courseName,
    unit: sender.unit,
    senderEmail: sender.email
  });

  const success = await sendAbsenceEmail({
    studentName: student.name,
    studentEmail: student.email,
    absencesText: absencesText,
    classNumber: student.classNumber,
    courseName: student.courseName,
    unit: sender.unit,
    senderEmail: sender.email
  });

  if (success) {
    const absencesCount = parseInt(absencesText, 10) || 0;
    
    console.log('Email enviado com sucesso, salvando notificação...');
    
    // Atualiza as notificações do aluno
    try {
      await notificationService.addNotification(
        student.id,
        'absences',
        { count: absencesCount, text: absencesText },
        sender
      );
      console.log('Notificação salva com sucesso');

      try {
        await teamsService.sendStudentNotification(student, sender, 'Faltas');
        console.log('Notificação enviada ao Teams com sucesso');
      } catch (teamsError) {
        console.error('Erro ao enviar notificação ao Teams:', teamsError);
      }
    } catch (notificationError) {
      console.error('Erro ao salvar notificação:', notificationError);
      alert('Email enviado, mas houve erro ao salvar a notificação no sistema');
    }

    // Retorna o aluno atualizado com as novas notificações
    return {
      ...student,
      absences: (student.absences || 0) + absencesCount,
      notifications: {
        absences: [
          ...(student.notifications?.absences || []),
          {
            date: new Date().toISOString(),
            count: absencesCount,
            text: absencesText,
            resolved: false,
            sentBy: {
              name: sender.name,
              email: sender.email
            }
          }
        ],
        inaugural: student.notifications?.inaugural || [],
        practical: student.notifications?.practical || []
      }
    };
  }

  console.log('Falha no envio do email');
  return null;
}