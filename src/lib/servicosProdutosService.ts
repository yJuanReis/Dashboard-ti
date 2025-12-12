import { supabase } from './supabaseClient';
import { logger } from "@/lib/logger";

// Interface para Serviço
export interface Servico {
  id?: string;
  ano?: number;
  servico?: string;
  descricao?: string;
  empresa?: string;
  sc?: string;
  situacao?: string;
  data_solicitacao?: string;
  nota_fiscal?: string;
  vencimento?: string;
  valor?: string;
  oc?: string;
}

// Interface para Produto
export interface Produto {
  id?: string;
  ano?: number;
  fornecedor?: string;
  produto?: string;
  informacoes?: string;
  empresa?: string;
  sc?: string;
  situacao?: string;
  data_sc?: string;
  nota_fiscal?: string;
  vencimento?: string;
  valor?: string;
  oc?: string;
}

// Interface unificada para exibição
export interface ServicoProduto {
  id: string;
  tipo: 'servico' | 'produto';
  _dbId?: string; // ID real do banco de dados para updates
  ano?: number;
  // Campos de serviço
  servico?: string;
  descricao?: string;
  // Campos de produto
  fornecedor?: string;
  produto?: string;
  informacoes?: string;
  // Campos comuns
  empresa?: string;
  sc?: string;
  situacao?: string;
  data_solicitacao?: string;
  data_sc?: string;
  nota_fiscal?: string;
  vencimento?: string;
  valor?: string;
  oc?: string;
  created_at?: string; // Data de criação do registro
}

/**
 * Busca todos os serviços do Supabase
 */
export async function fetchServicos(): Promise<Servico[]> {
  try {
    console.log('🟡 [FETCH] Buscando serviços do Supabase...');
    logger.log('🔍 Buscando serviços do Supabase...');
    
    // Buscar todos os registros (Supabase tem limite padrão de 1000, então precisamos paginar)
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let totalCount: number | null = null;

    // Primeira busca para obter o total
    const firstQuery = await supabase
      .from('servicos')
      .select('*', { count: 'exact', head: true });

    if (firstQuery.error) {
      console.error('❌ [FETCH] Erro ao contar serviços:', firstQuery.error);
      logger.error('❌ Erro ao buscar serviços:', firstQuery.error);
      return [];
    }

    totalCount = firstQuery.count;
    console.log(`🟡 [FETCH] Total de registros no banco: ${totalCount}`);

    // Buscar todos os registros em páginas
    while (totalCount === null || from < totalCount) {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('created_at', { ascending: false })
        .order('ano', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('❌ [FETCH] Erro ao buscar serviços:', error);
        logger.error('❌ Erro ao buscar serviços:', error);
        return [];
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        console.log(`🟡 [FETCH] Buscou ${data.length} serviços (total acumulado: ${allData.length}/${totalCount})`);
      }

      // Se não retornou dados ou retornou menos que o pageSize, terminou
      if (!data || data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    console.log(`✅ [FETCH] Total de ${allData.length} serviços encontrados no Supabase`);
    logger.log(`✅ ${allData.length} serviços encontrados no Supabase`);
    
    const data = allData;
    return (data || []).map((item, index) => ({
      id: `servico_${item.id || index}_${item.ano || ''}_${item.data_solicitacao || ''}`,
      _dbId: item.id, // Guarda o ID real do banco para updates
      ano: item.ano || undefined,
      servico: item.servico || undefined,
      descricao: item.descricao || undefined,
      empresa: item.empresa || undefined,
      sc: item.sc || undefined,
      situacao: item.situacao || undefined,
      data_solicitacao: item.data_solicitacao || undefined,
      nota_fiscal: item.nota_fiscal || undefined,
      vencimento: item.vencimento || undefined,
      valor: item.valor || undefined,
      oc: item.oc || undefined,
      created_at: (item as any).created_at || undefined, // Preserva created_at para ordenação
    }));
  } catch (error) {
    logger.error('❌ Erro ao buscar serviços:', error);
    return [];
  }
}

/**
 * Busca todos os produtos do Supabase
 */
export async function fetchProdutos(): Promise<Produto[]> {
  try {
    console.log('🟣 [FETCH] Buscando produtos do Supabase...');
    logger.log('🔍 Buscando produtos do Supabase...');
    
    // Buscar todos os registros (Supabase tem limite padrão de 1000, então precisamos paginar)
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let totalCount: number | null = null;

    // Primeira busca para obter o total
    const firstQuery = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true });

    if (firstQuery.error) {
      console.error('❌ [FETCH] Erro ao contar produtos:', firstQuery.error);
      logger.error('❌ Erro ao buscar produtos:', firstQuery.error);
      return [];
    }

    totalCount = firstQuery.count;
    console.log(`🟣 [FETCH] Total de registros no banco: ${totalCount}`);

    // Buscar todos os registros em páginas
    while (totalCount === null || from < totalCount) {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false })
        .order('ano', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('❌ [FETCH] Erro ao buscar produtos:', error);
        logger.error('❌ Erro ao buscar produtos:', error);
        return [];
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        console.log(`🟣 [FETCH] Buscou ${data.length} produtos (total acumulado: ${allData.length}/${totalCount})`);
      }

      // Se não retornou dados ou retornou menos que o pageSize, terminou
      if (!data || data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    console.log(`✅ [FETCH] Total de ${allData.length} produtos encontrados no Supabase`);
    logger.log(`✅ ${allData.length} produtos encontrados no Supabase`);
    
    const data = allData;
    return (data || []).map((item, index) => ({
      id: `produto_${item.id || index}_${item.ano || ''}_${item.data_sc || ''}`,
      _dbId: item.id, // Guarda o ID real do banco para updates
      ano: item.ano || undefined,
      fornecedor: item.fornecedor || undefined,
      produto: item.produto || undefined,
      informacoes: item.informacoes || undefined,
      empresa: item.empresa || undefined,
      sc: item.sc || undefined,
      situacao: item.situacao || undefined,
      data_sc: item.data_sc || undefined,
      nota_fiscal: item.nota_fiscal || undefined,
      vencimento: item.vencimento || undefined,
      valor: item.valor || undefined,
      oc: item.oc || undefined,
      created_at: (item as any).created_at || undefined, // Preserva created_at para ordenação
    }));
  } catch (error) {
    logger.error('❌ Erro ao buscar produtos:', error);
    return [];
  }
}

/**
 * Busca serviços e produtos e retorna unificado
 */
export async function fetchServicosProdutos(): Promise<ServicoProduto[]> {
  try {
    const [servicos, produtos] = await Promise.all([
      fetchServicos(),
      fetchProdutos()
    ]);

    const servicosUnificados: ServicoProduto[] = servicos.map(s => ({
      id: s.id || `servico_${Date.now()}_${Math.random()}`,
      tipo: 'servico' as const,
      _dbId: (s as any)._dbId || s.id?.replace(/^servico_\d+_/, '').split('_')[0], // Preserva o ID do banco
      ano: s.ano,
      servico: s.servico,
      descricao: s.descricao,
      empresa: s.empresa,
      sc: s.sc,
      situacao: s.situacao,
      data_solicitacao: s.data_solicitacao,
      nota_fiscal: s.nota_fiscal,
      vencimento: s.vencimento,
      valor: s.valor,
      oc: s.oc,
      created_at: (s as any).created_at || undefined, // Preserva created_at do serviço
    }));

    const produtosUnificados: ServicoProduto[] = produtos.map(p => ({
      id: p.id || `produto_${Date.now()}_${Math.random()}`,
      tipo: 'produto' as const,
      _dbId: (p as any)._dbId || p.id?.replace(/^produto_\d+_/, '').split('_')[0], // Preserva o ID do banco
      ano: p.ano,
      fornecedor: p.fornecedor,
      produto: p.produto,
      informacoes: p.informacoes,
      empresa: p.empresa,
      sc: p.sc,
      situacao: p.situacao,
      data_sc: p.data_sc,
      nota_fiscal: p.nota_fiscal,
      vencimento: p.vencimento,
      valor: p.valor,
      oc: p.oc,
      created_at: (p as any).created_at || undefined, // Preserva created_at do produto
    }));

    const todos = [...servicosUnificados, ...produtosUnificados];
    
    // Ordenar por created_at (mais recente primeiro), se não houver, usar data de solicitação
    todos.sort((a, b) => {
      // Priorizar created_at se disponível
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (a.created_at) return -1; // a tem created_at, b não - a vem primeiro
      if (b.created_at) return 1;  // b tem created_at, a não - b vem primeiro
      
      // Fallback: usar data de solicitação
      const dataA = a.data_solicitacao || a.data_sc || '';
      const dataB = b.data_solicitacao || b.data_sc || '';
      return dataB.localeCompare(dataA);
    });

    logger.log(`✅ Total de ${todos.length} itens (${servicos.length} serviços + ${produtos.length} produtos)`);
    return todos;
  } catch (error) {
    logger.error('❌ Erro ao buscar serviços e produtos:', error);
    return [];
  }
}

/**
 * Cria um novo serviço no Supabase
 */
export async function createServico(
  servico: Omit<Servico, 'id'>
): Promise<Servico> {
  try {
    console.log('🟡 [SERVICE] Iniciando criação de serviço...', servico);
    logger.log('➕ Criando novo serviço...', servico);
    
    console.log('🟡 [SERVICE] Enviando dados para Supabase...');
    const { data, error } = await supabase
      .from('servicos')
      .insert(servico)
      .select()
      .single();

    if (error) {
      console.error('❌ [SERVICE] Erro do Supabase:', error);
      logger.error('❌ Erro ao criar serviço:', error);
      throw error;
    }
    
    console.log('✅ [SERVICE] Serviço criado com sucesso no banco:', data);

    const novoServico: Servico = {
      id: data.id,
      ano: data.ano || undefined,
      servico: data.servico || undefined,
      descricao: data.descricao || undefined,
      empresa: data.empresa || undefined,
      sc: data.sc || undefined,
      situacao: data.situacao || undefined,
      data_solicitacao: data.data_solicitacao || undefined,
      nota_fiscal: data.nota_fiscal || undefined,
      vencimento: data.vencimento || undefined,
      valor: data.valor || undefined,
      oc: data.oc || undefined,
    };

    // Registrar auditoria
    const { logCreate } = await import('@/lib/auditService');
    await logCreate(
      'servicos',
      data.id,
      data,
      `Criou serviço: ${novoServico.servico || 'Sem serviço'}`
    ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

    // Marcar automaticamente a despesa correspondente no checklist
    try {
      const { marcarDespesaPorServico } = await import('@/lib/despesasService');
      const despesaMarcada = await marcarDespesaPorServico(
        novoServico.servico,
        novoServico.empresa
      );
      
      // Sempre disparar evento, informando se foi marcada ou não
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('despesa:marcada-automaticamente', {
          detail: {
            servico: novoServico.servico,
            empresa: novoServico.empresa,
            marcada: despesaMarcada
          }
        }));
      }
      
      if (despesaMarcada) {
        logger.log(`✅ Despesa marcada automaticamente no checklist para o serviço: ${novoServico.servico}`);
      } else {
        logger.log(`ℹ️ Nenhuma despesa correspondente encontrada para o serviço: ${novoServico.servico}`);
      }
    } catch (despesaError) {
      // Não bloquear a criação do serviço se houver erro ao marcar despesa
      logger.warn('⚠️ Erro ao marcar despesa automaticamente (não bloqueia criação do serviço):', despesaError);
    }

    logger.log('✅ Serviço criado com sucesso:', novoServico);
    return novoServico;
  } catch (error) {
    logger.error('❌ Erro ao criar serviço:', error);
    throw error;
  }
}

/**
 * Cria um novo produto no Supabase
 */
export async function createProduto(
  produto: Omit<Produto, 'id'>
): Promise<Produto> {
  try {
    console.log('🟣 [PRODUTO] Iniciando criação de produto...', produto);
    logger.log('➕ Criando novo produto...', produto);
    
    console.log('🟣 [PRODUTO] Enviando dados para Supabase...');
    const { data, error } = await supabase
      .from('produtos')
      .insert(produto)
      .select()
      .single();

    if (error) {
      console.error('❌ [PRODUTO] Erro do Supabase:', error);
      logger.error('❌ Erro ao criar produto:', error);
      throw error;
    }
    
    console.log('✅ [PRODUTO] Produto criado com sucesso no banco:', data);

    const novoProduto: Produto = {
      id: data.id,
      ano: data.ano || undefined,
      fornecedor: data.fornecedor || undefined,
      produto: data.produto || undefined,
      informacoes: data.informacoes || undefined,
      empresa: data.empresa || undefined,
      sc: data.sc || undefined,
      situacao: data.situacao || undefined,
      data_sc: data.data_sc || undefined,
      nota_fiscal: data.nota_fiscal || undefined,
      vencimento: data.vencimento || undefined,
      valor: data.valor || undefined,
      oc: data.oc || undefined,
    };

    // Registrar auditoria
    const { logCreate } = await import('@/lib/auditService');
    await logCreate(
      'produtos',
      data.id,
      data,
      `Criou produto: ${novoProduto.produto || 'Sem produto'}`
    ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

    logger.log('✅ Produto criado com sucesso:', novoProduto);
    return novoProduto;
  } catch (error) {
    logger.error('❌ Erro ao criar produto:', error);
    throw error;
  }
}

/**
 * Atualiza um serviço existente no Supabase
 */
export async function updateServico(
  id: string,
  updates: Partial<Servico>
): Promise<Servico> {
  try {
    logger.log(`🔄 Atualizando serviço ${id}...`, updates);
    
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single();

    // Remove campos undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('servicos')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar serviço:', error);
      throw error;
    }

    const servicoAtualizado: Servico = {
      id: data.id,
      ano: data.ano || undefined,
      servico: data.servico || undefined,
      descricao: data.descricao || undefined,
      empresa: data.empresa || undefined,
      sc: data.sc || undefined,
      situacao: data.situacao || undefined,
      data_solicitacao: data.data_solicitacao || undefined,
      nota_fiscal: data.nota_fiscal || undefined,
      vencimento: data.vencimento || undefined,
      valor: data.valor || undefined,
      oc: data.oc || undefined,
    };

    // Registrar auditoria
    if (oldData) {
      const { logUpdate } = await import('@/lib/auditService');
      await logUpdate(
        'servicos',
        id,
        oldData,
        data,
        `Atualizou serviço: ${servicoAtualizado.servico || 'Sem serviço'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Serviço atualizado com sucesso:', servicoAtualizado);
    return servicoAtualizado;
  } catch (error) {
    logger.error('❌ Erro ao atualizar serviço:', error);
    throw error;
  }
}

/**
 * Atualiza um produto existente no Supabase
 */
export async function updateProduto(
  id: string,
  updates: Partial<Produto>
): Promise<Produto> {
  try {
    logger.log(`🔄 Atualizando produto ${id}...`, updates);
    
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    // Remove campos undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('produtos')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }

    const produtoAtualizado: Produto = {
      id: data.id,
      ano: data.ano || undefined,
      fornecedor: data.fornecedor || undefined,
      produto: data.produto || undefined,
      informacoes: data.informacoes || undefined,
      empresa: data.empresa || undefined,
      sc: data.sc || undefined,
      situacao: data.situacao || undefined,
      data_sc: data.data_sc || undefined,
      nota_fiscal: data.nota_fiscal || undefined,
      vencimento: data.vencimento || undefined,
      valor: data.valor || undefined,
      oc: data.oc || undefined,
    };

    // Registrar auditoria
    if (oldData) {
      const { logUpdate } = await import('@/lib/auditService');
      await logUpdate(
        'produtos',
        id,
        oldData,
        data,
        `Atualizou produto: ${produtoAtualizado.produto || 'Sem produto'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Produto atualizado com sucesso:', produtoAtualizado);
    return produtoAtualizado;
  } catch (error) {
    logger.error('❌ Erro ao atualizar produto:', error);
    throw error;
  }
}

/**
 * Deleta um serviço do Supabase
 */
export async function deleteServico(id: string): Promise<void> {
  try {
    logger.log(`🗑️ Deletando serviço ${id}...`);
    
    // Buscar dados para auditoria
    const { data: oldData } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar serviço:', error);
      throw error;
    }

    // Registrar auditoria
    if (oldData) {
      const { logDelete } = await import('@/lib/auditService');
      await logDelete(
        'servicos',
        id,
        oldData,
        `Deletou serviço: ${oldData.servico || 'Sem serviço'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Serviço deletado com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao deletar serviço:', error);
    throw error;
  }
}

/**
 * Deleta um produto do Supabase
 */
export async function deleteProduto(id: string): Promise<void> {
  try {
    logger.log(`🗑️ Deletando produto ${id}...`);
    
    // Buscar dados para auditoria
    const { data: oldData } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar produto:', error);
      throw error;
    }

    // Registrar auditoria
    if (oldData) {
      const { logDelete } = await import('@/lib/auditService');
      await logDelete(
        'produtos',
        id,
        oldData,
        `Deletou produto: ${oldData.produto || 'Sem produto'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Produto deletado com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao deletar produto:', error);
    throw error;
  }
}

