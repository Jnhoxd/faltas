import { Student } from '../types/student';
import { sendInauguralClassEmail } from '../utils/email';
import { isValidDate } from '../utils/validators';
import { notificationService } from '../services/notificationService';
import { teamsService } from '../services/teamsService';
import { canSendNotification } from '../utils/notificationLimits';

export async function handleInauguralClass(
  student: Student & { id: string },
  sender: { name: string; email: string; role?: 'professor' | 'administrador'; unit?: string }
): Promise<Student | null> {
  let date: string | null = null;

  try {
    // Verifica se o aluno está inativo
    if (student.status === 'evaded' || student.status === 'dropout') {
      alert('Não é possível enviar notificações para alunos evadidos ou desistentes');
      return null;
    }

    // Verifica limite de notificações (passa o email do usuário)
    const { allowed, reason } = canSendNotification(
      student,
      'inaugural',
      sender.role === 'administrador',
      sender.email
    );

    if (!allowed) {
      alert(reason);
      return null;
    }

    date = prompt('Digite a data da aula inaugural (DD/MM/YYYY):');
    if (!date) {
      console.log('Usuário cancelou a entrada da data');
      return null;
    }

    if (!isValidDate(date)) {
      alert('Por favor, digite uma data válida no formato DD/MM/YYYY');
      return null;
    }

    if (!student.classNumber || !student.courseName) {
      alert('Erro: Dados da turma ou curso não encontrados para este aluno');
      return null;
    }

    if (!sender.unit) {
      alert('Erro: Unidade do usuário não encontrada');
      return null;
    }

    console.log('Enviando email de aula inaugural com parâmetros:', {
      studentName: student.name,
      studentEmail: student.email,
      classNumber: student.classNumber,
      courseName: student.courseName,
      inauguralDate: date,
      unit: sender.unit,
      senderEmail: sender.email
    });

    let success = false;
    try {
      success = await sendInauguralClassEmail({
        studentName: student.name,
        studentEmail: student.email,
        classNumber: student.classNumber,
        courseName: student.courseName,
        inauguralDate: date,
        unit: sender.unit,
        senderEmail: sender.email
      });

      console.log('Resultado do envio de email:', success);
    } catch (emailError) {
      console.error('Erro capturado ao enviar email de aula inaugural:', emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : 'Erro desconhecido';
      alert(`Erro ao enviar email: ${errorMsg}`);
      return null;
    }

    if (success) {
      console.log('Email enviado com sucesso, salvando notificação...');

      try {
        await notificationService.addNotification(
          student.id,
          'inaugural',
          { date },
          sender
        );
        console.log('Notificação salva com sucesso');

        try {
          await teamsService.sendStudentNotification(student, sender, 'Aula inaugural');
          console.log('Notificação enviada ao Teams com sucesso');
        } catch (teamsError) {
          console.error('Erro ao enviar notificação ao Teams:', teamsError);
        }
      } catch (notificationError) {
        console.error('Erro ao salvar notificação:', notificationError);
        alert('Email enviado, mas houve erro ao salvar a notificação no histórico');
      }

      return {
        ...student,
        inauguralClass: {
          date,
          notified: true
        },
        notifications: {
          absences: student.notifications?.absences || [],
          inaugural: [
            ...(student.notifications?.inaugural || []),
            {
              date: new Date().toISOString(),
              sentBy: {
                name: sender.name,
                email: sender.email
              }
            }
          ],
          practical: student.notifications?.practical || []
        }
      };
    } else {
      console.log('Email não foi enviado com sucesso');
    }

    return null;
  } catch (error) {
    console.error('Erro não tratado no handler de aula inaugural:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    alert(`Erro ao processar aula inaugural: ${errorMsg}`);
    return null;
  }
}