// Configurações do EmailJS por unidade
export const EMAIL_CONFIG = {
  // Configuração para Patos de Minas
  'Patos de Minas': {
    SERVICE_ID: 'service_41bn64r',
    TEMPLATES: {
      ABSENCE: {
        TEMPLATE_ID: 'template_gkf4h3h',
        PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
        SERVICE_ID: 'service_41bn64r'
      },
      INAUGURAL: {
        TEMPLATE_ID: 'template_eakuieh',
        PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
        SERVICE_ID: 'service_41bn64r'
      },
      PRACTICAL: {
        SERVICE_ID: 'service_8wwd1w7',
        TEMPLATE_ID: 'template_xiromef',
        PUBLIC_KEY: 'sPVAYb16mBgmaWYZR'
      }
    }
  },

  // Configuração para Patrocínio (idêntica a Patos de Minas)
  'Patrocínio': {
    SERVICE_ID: 'service_41bn64r',
    TEMPLATES: {
      ABSENCE: {
        TEMPLATE_ID: 'template_gkf4h3h',
        PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
        SERVICE_ID: 'service_41bn64r'
      },
      INAUGURAL: {
        TEMPLATE_ID: 'template_eakuieh',
        PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
        SERVICE_ID: 'service_41bn64r'
      },
      PRACTICAL: {
        SERVICE_ID: 'service_8wwd1w7',
        TEMPLATE_ID: 'template_xiromef',
        PUBLIC_KEY: 'sPVAYb16mBgmaWYZR'
      }
    }
  }
}

// Configuração padrão para todas as outras unidades
const DEFAULT_CONFIG = {
  SERVICE_ID: 'service_41bn64r',
  TEMPLATES: {
    ABSENCE: {
      TEMPLATE_ID: 'template_gkf4h3h',
      PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
      SERVICE_ID: 'service_41bn64r'
    },
    INAUGURAL: {
      TEMPLATE_ID: 'template_eakuieh',
      PUBLIC_KEY: 'cy2BP_mpCEpgIy_-j',
      SERVICE_ID: 'service_41bn64r'
    },
    PRACTICAL: {
      SERVICE_ID: 'service_8wwd1w7',
      TEMPLATE_ID: 'template_xiromef',
      PUBLIC_KEY: 'sPVAYb16mBgmaWYZR'
    }
  }
}

// Configuração de fallback para usuários específicos ou quando o email principal falhar
const FALLBACK_CONFIG = {
  SERVICE_ID: 'service_4e9t09t',
  TEMPLATES: {
    ABSENCE: {
      TEMPLATE_ID: 'template_0py1v4l',
      PUBLIC_KEY: 'WXfUv7lXp9jADN4tL',
      SERVICE_ID: 'service_4e9t09t'
    },
    INAUGURAL: {
      TEMPLATE_ID: 'template_uf0g5yf',
      PUBLIC_KEY: 'WXfUv7lXp9jADN4tL',
      SERVICE_ID: 'service_4e9t09t'
    },
    PRACTICAL: {
      SERVICE_ID: 'service_ew9wbyl',
      TEMPLATE_ID: 'template_xiromef',
      PUBLIC_KEY: 'sPVAYb16mBgmaWYZR'
    }
  }
}

// Configuração para usuários específicos com service/template próprios
const USER_SPECIFIC_CONFIGS: Record<string, typeof DEFAULT_CONFIG> = {
  'ptm14758@mg.senac.br': {
    SERVICE_ID: 'service_whv468c',
    TEMPLATES: {
      ABSENCE: {
        SERVICE_ID: 'service_whv468c',
        TEMPLATE_ID: 'template_xvxy68j',
        PUBLIC_KEY: 'DGQnyrtLdwROnVW-t'
      },
      INAUGURAL: {
        SERVICE_ID: 'service_whv468c',
        TEMPLATE_ID: 'template_j2jg99x',
        PUBLIC_KEY: 'DGQnyrtLdwROnVW-t'
      },
      PRACTICAL: DEFAULT_CONFIG.TEMPLATES.PRACTICAL
    }
  }
};

// Lista de usuários que devem usar a configuração de fallback
const FALLBACK_USERS = [
  'larissa.cardoso@mg.senac.br'
];

// Função helper para obter a configuração (com fallback para default)
export function getUnitEmailConfig(unit: string, userEmail?: string) {
  const normalizedEmail = userEmail?.toLowerCase();

  if (normalizedEmail && USER_SPECIFIC_CONFIGS[normalizedEmail]) {
    console.log(`Usando configuração de email específica para usuário: ${userEmail}`);
    return USER_SPECIFIC_CONFIGS[normalizedEmail];
  }

  // Se o usuário está na lista de fallback, usa a configuração alternativa
  if (normalizedEmail && FALLBACK_USERS.includes(normalizedEmail)) {
    console.log(`Usando configuração de fallback para usuário: ${userEmail}`);
    return FALLBACK_CONFIG;
  }

  const config = EMAIL_CONFIG[unit as keyof typeof EMAIL_CONFIG];

  if (!config) {
    console.log(`Usando configuração padrão para unidade: ${unit}`);
    return DEFAULT_CONFIG;
  }

  // Garante que todos os templates estão presentes
  const result = {
    SERVICE_ID: config.SERVICE_ID,
    TEMPLATES: {
      ABSENCE: config.TEMPLATES.ABSENCE || DEFAULT_CONFIG.TEMPLATES.ABSENCE,
      INAUGURAL: config.TEMPLATES.INAUGURAL || DEFAULT_CONFIG.TEMPLATES.INAUGURAL,
      PRACTICAL: config.TEMPLATES.PRACTICAL || DEFAULT_CONFIG.TEMPLATES.PRACTICAL
    }
  };

  return result;
}

// Função para obter configuração de fallback em caso de erro
export function getFallbackEmailConfig() {
  console.log('Usando configuração de fallback devido a erro no envio principal');
  return FALLBACK_CONFIG;
}