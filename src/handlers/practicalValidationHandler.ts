import { Student } from '../types/student';
import { sendPracticalValidationEmail } from '../utils/email';
import { notificationService } from '../services/notificationService';
import { teamsService } from '../services/teamsService';
import { canSendNotification } from '../utils/notificationLimits';

export async function handlePracticalValidation(
  student: Student & { id: string },
  sender: { name: string; email: string; role?: 'professor' | 'administrador'; unit?: string }
): Promise<Student | null> {
  try {
    // Verifica se o aluno está inativo
    if (student.status === 'evaded' || student.status === 'dropout') {
      alert('Não é possível enviar notificações para alunos evadidos ou desistentes');
      return null;
    }

    // Verifica limite de notificações (passa o email do usuário)
    const { allowed, reason } = canSendNotification(
      student,
      'practical',
      sender.role === 'administrador',
      sender.email
    );

    if (!allowed) {
      alert(reason);
      return null;
    }

    const practicalText = prompt(`Informe as datas sobre as práticas profissionais não validadas do(a) aluno(a) ${student.name}:`);
    if (!practicalText) return null;

    if (!student.classNumber || !student.courseName) {
      alert('Erro: Dados da turma ou curso não encontrados para este aluno');
      return null;
    }

    if (!sender.unit) {
      alert('Erro: Unidade do usuário não encontrada');
      return null;
    }

    console.log('Enviando email de práticas para:', {
      student: student.name,
      email: student.email,
      unit: sender.unit,
      practicalText,
      senderEmail: sender.email
    });

    let success = false;
    try {
      success = await sendPracticalValidationEmail({
        studentName: student.name,
        studentEmail: student.email,
        classNumber: student.classNumber,
        courseName: student.courseName,
        practicalText: practicalText,
        unit: sender.unit,
        senderEmail: sender.email
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de práticas:', emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : 'Erro desconhecido';
      alert(`Erro ao enviar email: ${errorMsg}`);
      return null;
    }

    if (success) {
      try {
        await notificationService.addNotification(
          student.id,
          'practical',
          { text: practicalText },
          sender
        );

        try {
          await teamsService.sendStudentNotification(student, sender, 'Práticas');
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
        practicalValidation: {
          text: practicalText,
          notified: true
        },
        notifications: {
          ...student.notifications,
          practical: [
            ...(student.notifications?.practical || []),
            {
              date: new Date().toISOString(),
              text: practicalText,
              sentBy: {
                name: sender.name,
                email: sender.email
              }
            }
          ]
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Erro no handler de práticas:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    alert(`Erro ao processar práticas: ${errorMsg}`);
    return null;
  }
}