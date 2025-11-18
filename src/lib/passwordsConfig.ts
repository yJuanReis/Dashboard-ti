// Configuração para mapear os campos da tabela passwords do Supabase
export const PASSWORDS_CONFIG = {
  // Nome da tabela no Supabase
  tableName: 'passwords',
  
  // Mapeamento de campos da tabela do Supabase
  fieldMapping: {
    id: 'id',                    // bigint generated always as identity
    service: 'servico',          // Nome do serviço
    username: 'usuario',         // Usuário/Email
    password: 'senha',           // Senha
    description: 'descricao',    // Descrição
    url: 'link_de_acesso',       // Link de acesso
    createdAt: 'created_at',     // Data de criação
    marina: 'marina',            // Marina
    local: 'local',              // Local
    contas_compartilhadas_info: 'contas_compartilhadas_info', // Contas compartilhadas
    winbox: 'winbox',            // Winbox
    www: 'www',                  // WWW
    ssh: 'ssh',                  // SSH
    cloud_intelbras: 'cloud_intelbras', // Cloud Intelbras
    link_rtsp: 'link_rtsp',      // Link RTSP
    tipo: 'tipo',                // Tipo
    status: 'status',            // Status
  },
  
  // Campos que são opcionais na tabela
  optionalFields: ['usuario', 'senha', 'descricao', 'link_de_acesso', 'marina', 'local', 'contas_compartilhadas_info', 'winbox', 'www', 'ssh', 'cloud_intelbras', 'link_rtsp', 'tipo'],
};

/**
 * Função para mapear os dados da tabela passwords do Supabase para o formato esperado
 */
export function mapTableData(row: any): any {
  const mapping = PASSWORDS_CONFIG.fieldMapping;
  
  // Função auxiliar para obter valor do campo
  const getField = (fieldName: string, isOptional: boolean = false, defaultValue: any = null) => {
    const mappedField = mapping[fieldName as keyof typeof mapping];
    
    if (mappedField && row[mappedField] !== undefined && row[mappedField] !== null) {
      return row[mappedField];
    }
    
    if (isOptional) {
      return defaultValue;
    }
    
    return defaultValue;
  };
  
  // Deriva categoria do serviço (pode ser melhorado no futuro)
  const deriveCategory = (service: string): string => {
    if (!service) return 'Outros';
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('email') || serviceLower.includes('gmail') || serviceLower.includes('outlook')) {
      return 'Email';
    }
    if (serviceLower.includes('servidor') || serviceLower.includes('server')) {
      return 'Servidores';
    }
    if (serviceLower.includes('rede') || serviceLower.includes('router') || serviceLower.includes('winbox')) {
      return 'Redes';
    }
    return 'Outros';
  };
  
  // Deriva ícone do serviço
  const deriveIcon = (service: string): string | null => {
    if (!service) return null;
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('email') || serviceLower.includes('gmail') || serviceLower.includes('outlook')) {
      return 'mail';
    }
    if (serviceLower.includes('servidor') || serviceLower.includes('server')) {
      return 'server';
    }
    if (serviceLower.includes('rede') || serviceLower.includes('router') || serviceLower.includes('winbox')) {
      return 'router';
    }
    return null;
  };
  
  const service = getField('service') || '';
  
  return {
    id: String(getField('id') || row.id || ''),
    service: service,
    username: getField('username', true) || '',
    password: getField('password', true) || '',
    category: deriveCategory(service),
    description: getField('description', true) || '',
    icon: deriveIcon(service),
    url: getField('url', true) || null,
    provider: null, // Não existe na tabela
    marina: getField('marina', true) || null,
    local: getField('local', true) || null,
    contas_compartilhadas_info: getField('contas_compartilhadas_info', true) || null,
    winbox: getField('winbox', true) || null,
    www: getField('www', true) || null,
    ssh: getField('ssh', true) || null,
    cloud_intelbras: getField('cloud_intelbras', true) || null,
    link_rtsp: getField('link_rtsp', true) || null,
    tipo: getField('tipo', true) || null,
    status: getField('status', true) || null,
    created_at: getField('createdAt', true) || row.created_at || null,
    updated_at: null, // Não existe na tabela
  };
}

