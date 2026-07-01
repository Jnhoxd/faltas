import emailjs from '@emailjs/browser';
import { getUnitEmailConfig, getFallbackEmailConfig } from './emailConfig';
import { isValidEmail, sanitizeString } from './validators';

interface BaseEmailParams {
  studentName: string;
  studentEmail: string;
  classNumber: string;
  courseName: string;
  unit: string;
  senderEmail?: string;
}

interface AbsenceEmailParams extends BaseEmailParams {
  absencesText: string;
}

interface InauguralClassEmailParams extends BaseEmailParams {
  inauguralDate: string;
}

interface PracticalValidationEmailParams extends BaseEmailParams {
  practicalText: string;
}

function sanitizeBaseParams(params: BaseEmailParams) {
  return {
    studentName: sanitizeString(params.studentName),
    studentEmail: sanitizeString(params.studentEmail),
    classNumber: sanitizeString(params.classNumber),
    courseName: sanitizeString(params.courseName),
    unit: sanitizeString(params.unit),
    senderEmail: params.senderEmail ? sanitizeString(params.senderEmail) : undefined
  };
}

function getEmailConfig(unit: string, senderEmail?: string) {
  return getUnitEmailConfig(unit, senderEmail);
}

async function sendEmailWithFallback(
  serviceId: string,
  templateId: string,
  templateParams: any,
  publicKey: string,
  fallbackType: 'absences' | 'inaugural' | 'practical'
) {
  try {
    console.log('Tentando envio com configuração principal...');
    const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    
    if (result.status === 200) {
      console.log('Email enviado com sucesso usando configuração principal');
      return result;
    } else {
      throw new Error(`Erro no status: ${result.text}`);
    }
  } catch (error) {
    console.warn('Falha no envio principal, tentando configuração de fallback...', error);
    
    try {
      const fallbackConfig = getFallbackEmailConfig();
      const fallbackTemplate = fallbackConfig.TEMPLATES[fallbackType.toUpperCase() as keyof typeof fallbackConfig.TEMPLATES];
      
      console.log('Enviando com configuração de fallback:', {
        serviceId: fallbackTemplate.SERVICE_ID,
        templateId: fallbackTemplate.TEMPLATE_ID
      });
      
      const fallbackResult = await emailjs.send(
        fallbackTemplate.SERVICE_ID,
        fallbackTemplate.TEMPLATE_ID,
        templateParams,
        fallbackTemplate.PUBLIC_KEY
      );
      
      if (fallbackResult.status === 200) {
        console.log('Email enviado com sucesso usando configuração de fallback');
        return fallbackResult;
      } else {
        throw new Error(`Erro no fallback: ${fallbackResult.text}`);
      }
    } catch (fallbackError) {
      console.error('Falha também no envio de fallback:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function sendAbsenceEmail(params: AbsenceEmailParams) {
  try {
    console.log('Iniciando envio de email de faltas:', params);
    
    if (!params.studentName || !params.studentEmail || !params.classNumber || !params.courseName || !params.unit) {
      throw new Error('Todos os campos são obrigatórios');
    }

    const sanitizedParams = {
      ...sanitizeBaseParams(params),
      absencesText: sanitizeString(params.absencesText)
    };

    console.log('Parâmetros sanitizados:', sanitizedParams);

    if (!sanitizedParams.absencesText) {
      throw new Error('O texto da notificação é obrigatório');
    }

    let config;
    try {
      config = getEmailConfig(sanitizedParams.unit, sanitizedParams.senderEmail);
      console.log('Configuração de email carregada:', {
        unit: sanitizedParams.unit,
        senderEmail: sanitizedParams.senderEmail,
        hasConfig: !!config,
        serviceId: config?.SERVICE_ID,
        templateId: config?.TEMPLATES?.ABSENCE?.TEMPLATE_ID
      });
    } catch (configError) {
      console.error('Erro ao obter configuração de email:', configError);
      throw new Error(`Configuração de email não encontrada para a unidade: ${sanitizedParams.unit}`);
    }

    // Usa sempre o SERVICE_ID específico do template ABSENCE
    const serviceId = config.TEMPLATES.ABSENCE.SERVICE_ID;

    console.log('Service ID selecionado:', serviceId);

    const templateParams = {
      to_name: sanitizedParams.studentName,
      to_email: sanitizedParams.studentEmail,
      turma: sanitizedParams.classNumber,
      curso: sanitizedParams.courseName,
      message: sanitizedParams.absencesText
    };

    console.log('Parâmetros do template:', templateParams);

    if (!serviceId || !config.TEMPLATES.ABSENCE.TEMPLATE_ID || !config.TEMPLATES.ABSENCE.PUBLIC_KEY) {
      throw new Error(`Configuração incompleta para a unidade ${sanitizedParams.unit}`);
    }

    const result = await sendEmailWithFallback(
      serviceId,
      config.TEMPLATES.ABSENCE.TEMPLATE_ID,
      templateParams,
      config.TEMPLATES.ABSENCE.PUBLIC_KEY,
      'absences'
    );

    console.log('Resultado do envio:', result);

    if (result.status === 200) {
      alert('Email enviado com sucesso');
      return true;
    } else {
      throw new Error(`Erro ao enviar email: ${result.text}`);
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'text' in error) {
      errorMessage = error.text as string;
    }
    
    alert(`Erro ao enviar email: ${errorMessage}`);
    return false;
  }
}

export async function sendInauguralClassEmail(params: InauguralClassEmailParams) {
  try {
    console.log('Iniciando envio de email de aula inaugural:', params);

    if (!params.studentName || !params.studentEmail || !params.classNumber || !params.courseName || !params.unit) {
      console.error('Erro: Campos obrigatórios ausentes');
      alert('Erro: Todos os campos são obrigatórios');
      return false;
    }

    const sanitizedParams = {
      ...sanitizeBaseParams(params),
      inauguralDate: sanitizeString(params.inauguralDate)
    };

    console.log('Parâmetros sanitizados:', sanitizedParams);

    if (!sanitizedParams.inauguralDate) {
      console.error('Erro: Data da aula inaugural ausente');
      alert('Data da aula inaugural é obrigatória');
      return false;
    }

    let config;
    try {
      config = getEmailConfig(sanitizedParams.unit, sanitizedParams.senderEmail);
      console.log('Configuração de email carregada:', {
        unit: sanitizedParams.unit,
        senderEmail: sanitizedParams.senderEmail,
        hasConfig: !!config,
        serviceId: config?.TEMPLATES?.INAUGURAL?.SERVICE_ID,
        templateId: config?.TEMPLATES?.INAUGURAL?.TEMPLATE_ID
      });
    } catch (configError) {
      console.error('Erro ao obter configuração de email:', configError);
      alert(`Erro: Configuração de email não encontrada para a unidade: ${sanitizedParams.unit}`);
      return false;
    }

    // Valida configuração antes de prosseguir
    if (!config || !config.TEMPLATES || !config.TEMPLATES.INAUGURAL) {
      console.error('Erro: Configuração de email inválida');
      alert(`Erro: Configuração de email inválida para a unidade ${sanitizedParams.unit}`);
      return false;
    }

    const serviceId = config.TEMPLATES.INAUGURAL.SERVICE_ID;
    const templateId = config.TEMPLATES.INAUGURAL.TEMPLATE_ID;
    const publicKey = config.TEMPLATES.INAUGURAL.PUBLIC_KEY;

    console.log('Service ID selecionado para aula inaugural:', serviceId);

    if (!serviceId || !templateId || !publicKey) {
      console.error('Erro: Configuração incompleta');
      alert(`Configuração incompleta para a unidade ${sanitizedParams.unit}`);
      return false;
    }

    const templateParams = {
      to_name: sanitizedParams.studentName,
      to_email: sanitizedParams.studentEmail,
      turma: sanitizedParams.classNumber,
      curso: sanitizedParams.courseName,
      data_inaugural: sanitizedParams.inauguralDate,
      message: `Você não compareceu à aula inaugural do dia ${sanitizedParams.inauguralDate} da turma ${sanitizedParams.classNumber} do curso ${sanitizedParams.courseName}.`
    };

    console.log('Parâmetros do template:', templateParams);

    console.log('Enviando email via EmailJS...');

    const result = await sendEmailWithFallback(
      serviceId,
      templateId,
      templateParams,
      publicKey,
      'inaugural'
    );

    console.log('Resultado do envio:', result);

    if (result.status === 200) {
      console.log('Email de aula inaugural enviado com sucesso');
      alert('Email enviado com sucesso');
      return true;
    } else {
      console.error('Erro no status do resultado:', result);
      alert(`Erro ao enviar email: ${result.text || 'Erro desconhecido'}`);
      return false;
    }
  } catch (error) {
    console.error('Erro capturado ao enviar email de aula inaugural:', error);

    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'text' in error) {
      errorMessage = error.text as string;
    }

    console.error('Mensagem de erro formatada:', errorMessage);
    alert(`Erro ao enviar email: ${errorMessage}`);
    return false;
  }
}

export async function sendPracticalValidationEmail(params: PracticalValidationEmailParams) {
  try {
    console.log('Iniciando envio de email de práticas:', params);

    if (!params.studentName || !params.studentEmail || !params.classNumber || !params.courseName || !params.unit) {
      alert('Erro: Todos os campos são obrigatórios');
      return false;
    }

    const sanitizedParams = {
      ...sanitizeBaseParams(params),
      practicalText: sanitizeString(params.practicalText)
    };

    if (!sanitizedParams.practicalText) {
      alert('O texto da prática profissional é obrigatório');
      return false;
    }

    if (!isValidEmail(sanitizedParams.studentEmail)) {
      alert('Email do aluno inválido');
      return false;
    }

    let config;
    try {
      config = getEmailConfig(sanitizedParams.unit, sanitizedParams.senderEmail);
      console.log('Configuração de email carregada:', {
        unit: sanitizedParams.unit,
        senderEmail: sanitizedParams.senderEmail,
        hasConfig: !!config,
        serviceId: config?.TEMPLATES?.PRACTICAL?.SERVICE_ID,
        templateId: config?.TEMPLATES?.PRACTICAL?.TEMPLATE_ID
      });
    } catch (configError) {
      console.error('Erro ao obter configuração de email:', configError);
      alert(`Erro: Configuração de email não encontrada para a unidade: ${sanitizedParams.unit}`);
      return false;
    }

    // Para práticas, usa configuração específica da unidade
    const practicalConfig = config.TEMPLATES.PRACTICAL;

    if (!practicalConfig || !practicalConfig.SERVICE_ID || !practicalConfig.TEMPLATE_ID || !practicalConfig.PUBLIC_KEY) {
      alert(`Configuração incompleta de práticas para a unidade ${sanitizedParams.unit}`);
      return false;
    }

    const templateParams = {
      to_name: sanitizedParams.studentName,
      to_email: sanitizedParams.studentEmail,
      turma: sanitizedParams.classNumber,
      curso: sanitizedParams.courseName,
      message: sanitizedParams.practicalText
    };

    console.log('Enviando email de práticas com configuração:', {
      unit: sanitizedParams.unit,
      senderEmail: sanitizedParams.senderEmail,
      serviceId: practicalConfig.SERVICE_ID,
      templateId: practicalConfig.TEMPLATE_ID
    });

    const result = await sendEmailWithFallback(
      practicalConfig.SERVICE_ID,
      practicalConfig.TEMPLATE_ID,
      templateParams,
      practicalConfig.PUBLIC_KEY,
      'practical'
    );

    if (result.status === 200) {
      console.log('Email de práticas enviado com sucesso');
      alert('Email enviado com sucesso');
      return true;
    } else {
      alert(`Erro ao enviar email: ${result.text || 'Erro desconhecido'}`);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar email de práticas:', error);

    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'text' in error) {
      errorMessage = error.text as string;
    }

    console.error('Mensagem de erro formatada:', errorMessage);
    alert(`Erro ao enviar email: ${errorMessage}`);

    return false;
  }
}