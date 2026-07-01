import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '../emailConfig';
import { isValidEmail, sanitizeString } from '../validators';

interface PracticalEmailParams {
  studentName: string;
  studentEmail: string;
  classNumber: string;
  courseName: string;
  invalidDates: string[];
}

export async function sendPracticalValidationEmail(params: PracticalEmailParams) {
  try {
    const sanitizedParams = {
      studentName: sanitizeString(params.studentName),
      studentEmail: sanitizeString(params.studentEmail).toLowerCase(),
      classNumber: sanitizeString(params.classNumber),
      courseName: sanitizeString(params.courseName),
      invalidDates: params.invalidDates.map(sanitizeString)
    };

    if (!isValidEmail(sanitizedParams.studentEmail)) {
      throw new Error(`Email inválido: ${sanitizedParams.studentEmail}`);
    }

    const datesFormatted = sanitizedParams.invalidDates.join(', ');
    const templateParams = {
      [EMAIL_CONFIG.TEMPLATE_PARAMS.NAME_FIELD]: sanitizedParams.studentName,
      [EMAIL_CONFIG.TEMPLATE_PARAMS.EMAIL_FIELD]: sanitizedParams.studentEmail,
      [EMAIL_CONFIG.TEMPLATE_PARAMS.CLASS_NUMBER_FIELD]: sanitizedParams.classNumber,
      [EMAIL_CONFIG.TEMPLATE_PARAMS.COURSE_NAME_FIELD]: sanitizedParams.courseName,
      [EMAIL_CONFIG.TEMPLATE_PARAMS.INVALID_DATES_FIELD]: datesFormatted,
      [EMAIL_CONFIG.TEMPLATE_PARAMS.MESSAGE_FIELD]: `Você precisa validar as práticas profissionais das seguintes datas: ${datesFormatted} da turma ${sanitizedParams.classNumber} do curso ${sanitizedParams.courseName}.`
    };

    const result = await emailjs.send(
      EMAIL_CONFIG.PRACTICAL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.PRACTICAL_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAIL_CONFIG.PRACTICAL_CONFIG.PUBLIC_KEY
    );

    if (result.status !== 200) {
      throw new Error(`Erro ao enviar email: ${result.text}`);
    }

    alert('Email enviado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    alert(`Erro ao enviar email para ${params.studentEmail}. Por favor, verifique o endereço de email.`);
    return false;
  }
}