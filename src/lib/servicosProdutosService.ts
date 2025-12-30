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

    // Verificar duplicidade de SC por empresa
    if (servico.sc && servico.empresa) {
      const scDuplicada = await checkSCDuplicadaPorEmpresa(servico.sc, servico.empresa);
      if (scDuplicada) {
        throw new Error(`Esta SC já foi lançada na ${servico.empresa}. Cada empresa deve ter SCs únicas.`);
      }
    }

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

    // Marcar automaticamente a despesa recorrente correspondente (MATCHING ESTRITO)
    try {
      console.log('🟡 [SERVICE] Validando combinação exata para matching automático...');
      const validacao = await validarCombinacaoSC(
        novoServico.servico,
        novoServico.descricao,
        novoServico.empresa
      );

      let despesaMarcada = false;

      if (validacao.valido && validacao.despesa) {
        // Atualizar status da despesa para LANCADO
        const { atualizarStatusDespesaRecorrente } = await import('@/lib/despesasService');
        await atualizarStatusDespesaRecorrente(validacao.despesa.id, 'LANCADO');

        console.log(`✅ [MATCHING] Despesa "${validacao.despesa.apelido}" marcada como LANCADO (matching exato)`);
        despesaMarcada = true;
      } else {
        console.log(`ℹ️ [MATCHING] Combinação não encontrada exatamente na tabela de despesas recorrentes`);
      }

      // Sempre disparar evento, informando se foi marcada ou não
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('despesa:marcada-automaticamente', {
          detail: {
            servico: novoServico.servico,
            marina: novoServico.empresa,
            marcada: despesaMarcada
          }
        }));
      }

      if (despesaMarcada) {
        logger.log(`✅ Despesa marcada automaticamente no checklist para o serviço: ${novoServico.servico}`);
      } else {
        logger.log(`ℹ️ Nenhuma despesa correspondente encontrada (matching exato) para o serviço: ${novoServico.servico}`);
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

    // Verificar duplicidade de SC por empresa
    if (produto.sc && produto.empresa) {
      const scDuplicada = await checkSCDuplicadaPorEmpresa(produto.sc, produto.empresa);
      if (scDuplicada) {
        throw new Error(`Esta SC já foi lançada na ${produto.empresa}. Cada empresa deve ter SCs únicas.`);
      }
    }

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

/**
 * Marca automaticamente uma despesa recorrente correspondente quando um serviço é criado
 */
async function marcarDespesaRecorrentePorServico(
  servicoNome: string | null | undefined,
  servicoDescricao: string | null | undefined,
  empresa: string | null | undefined
): Promise<boolean> {
  try {
    if (!servicoNome || !servicoNome.trim()) {
      return false;
    }

    console.log(`🔍 [MATCHING] Procurando despesa recorrente para: "${servicoNome}" (Empresa: ${empresa || 'N/A'})`);

    const { supabase } = await import('./supabaseClient');

    // Buscar despesas recorrentes ativas com status PENDENTE
    const { data: despesas, error } = await supabase
      .from('despesas_recorrentes')
      .select('*')
      .eq('ativo', true)
      .eq('status_mes_atual', 'PENDENTE');

    if (error) {
      console.error('❌ [MATCHING] Erro ao buscar despesas recorrentes:', error);
      return false;
    }

    if (!despesas || despesas.length === 0) {
      console.log('ℹ️ [MATCHING] Nenhuma despesa recorrente pendente encontrada');
      return false;
    }

    console.log(`📋 [MATCHING] Encontradas ${despesas.length} despesas recorrentes pendentes`);

    // Função auxiliar para normalizar strings
    const normalizar = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim()
        .replace(/\s+/g, ' '); // Normaliza espaços
    };

    const inputServico = normalizar(servicoNome);
    const inputDescricao = normalizar(servicoDescricao);
    const inputEmpresa = normalizar(empresa);

    console.log(`🔍 [MATCHING] Procurando match para: servico="${inputServico}", empresa="${inputEmpresa}"`);

    let melhorMatch: any = null;
    let melhorScore = 0;

    for (const despesa of despesas) {
      const matchTexto = normalizar(despesa.match_texto);
      const matchEmpresa = normalizar(despesa.match_empresa);
      const apelido = normalizar(despesa.apelido);

      console.log(`🔍 [MATCHING] Testando despesa: "${despesa.apelido}" (texto: "${matchTexto}", empresa: "${matchEmpresa}")`);

      let score = 0;
      let matchEncontrado = false;

      // MATCH EXATO NO MATCH_TEXTO (MÁXIMA PRIORIDADE)
      if (matchTexto && inputServico === matchTexto) {
        score += 200; // Aumentado para dar mais prioridade
        matchEncontrado = true;
        console.log(`🎯 [MATCHING] MATCH EXATO no match_texto: "${matchTexto}"`);
      }
      // MATCH EXATO NO APELIDO (ALTA PRIORIDADE)
      else if (apelido && inputServico === apelido) {
        score += 180;
        matchEncontrado = true;
        console.log(`🎯 [MATCHING] MATCH EXATO no apelido: "${apelido}"`);
      }
      // MATCH NA DESCRIÇÃO (PRIORIDADE MÉDIA)
      else if (inputDescricao && matchTexto && inputDescricao === matchTexto) {
        score += 150;
        matchEncontrado = true;
        console.log(`✅ [MATCHING] Match exato na descrição: "${matchTexto}"`);
      }
      // MATCH PARCIAL MAIS RIGOROSO - palavra completa no início
      else if (matchTexto && inputServico.startsWith(matchTexto + ' ')) {
        score += 120;
        matchEncontrado = true;
        console.log(`✅ [MATCHING] Match parcial rigoroso (início): "${matchTexto}"`);
      }
      else if (matchTexto && matchTexto.startsWith(inputServico + ' ')) {
        score += 120;
        matchEncontrado = true;
        console.log(`✅ [MATCHING] Match parcial rigoroso (início inverso): "${matchTexto}"`);
      }
      // MATCH PARCIAL NO APELIDO (menos rigoroso)
      else if (apelido && inputServico.startsWith(apelido + ' ')) {
        score += 100;
        matchEncontrado = true;
        console.log(`✅ [MATCHING] Match parcial no apelido (início): "${apelido}"`);
      }
      else if (apelido && apelido.startsWith(inputServico + ' ')) {
        score += 100;
        matchEncontrado = true;
        console.log(`✅ [MATCHING] Match parcial no apelido (início inverso): "${apelido}"`);
      }
      // MATCH PARCIAL MENOS RIGOROSO (palavras em comum)
      else if (matchTexto && (inputServico.includes(matchTexto) || matchTexto.includes(inputServico))) {
        // Verificar se é uma correspondência significativa
        const palavrasInput = inputServico.split(/\s+/).filter(p => p.length > 2);
        const palavrasMatch = matchTexto.split(/\s+/).filter(p => p.length > 2);
        const palavrasComuns = palavrasInput.filter(p => palavrasMatch.includes(p)).length;

        if (palavrasComuns >= Math.min(palavrasInput.length, palavrasMatch.length) * 0.7) {
          score += 80;
          matchEncontrado = true;
          console.log(`✅ [MATCHING] Match parcial significativo (${palavrasComuns} palavras): "${matchTexto}"`);
        }
      }

      // BÔNUS POR EMPRESA (só se houver match básico)
      if (matchEncontrado && matchEmpresa && inputEmpresa) {
        if (inputEmpresa === matchEmpresa) {
          score += 50;
          console.log(`🎯 [MATCHING] Empresa exata match: "${matchEmpresa}"`);
        } else if (inputEmpresa.includes(matchEmpresa) || matchEmpresa.includes(inputEmpresa)) {
          score += 25;
          console.log(`🎯 [MATCHING] Empresa parcial match: "${matchEmpresa}"`);
        }
      }

      console.log(`📊 [MATCHING] Score para "${despesa.apelido}": ${score}`);

      // Atualizar melhor match se score for maior
      if (matchEncontrado && score > melhorScore) {
        melhorMatch = despesa;
        melhorScore = score;
        console.log(`🏆 [MATCHING] Novo melhor match: "${despesa.apelido}" (score: ${score})`);
      }
    }

    if (!melhorMatch) {
      console.log('❌ [MATCHING] Nenhum match encontrado');
      return false;
    }

    // Threshold mínimo de score para considerar match (muito rigoroso para evitar falsos positivos)
    if (melhorScore < 120) {
      console.log(`⚠️ [MATCHING] Score muito baixo (${melhorScore}), ignorando match`);
      return false;
    }

    console.log(`🎯 [MATCHING] Match encontrado! "${melhorMatch.apelido}" (score: ${melhorScore})`);

    // Atualizar status da despesa para LANCADO
    const { atualizarStatusDespesaRecorrente } = await import('@/lib/despesasService');

    await atualizarStatusDespesaRecorrente(melhorMatch.id, 'LANCADO');

    console.log(`✅ [MATCHING] Despesa "${melhorMatch.apelido}" marcada como LANCADO`);
    return true;

  } catch (error) {
    console.error('❌ [MATCHING] Erro no matching automático:', error);
    return false;
  }
}

/**
 * Busca todas as empresas disponíveis para autocomplete
 */
export async function buscarEmpresasParaAutocomplete(): Promise<string[]> {
  try {
    console.log('🔍 [AUTOCOMPLETE] Buscando empresas disponíveis...');

    const { supabase } = await import('./supabaseClient');

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .select('match_empresa')
      .eq('ativo', true)
      .not('match_empresa', 'is', null)
      .order('match_empresa');

    if (error) {
      console.error('❌ [AUTOCOMPLETE] Erro ao buscar empresas:', error);
      return [];
    }

    // Remover duplicatas e ordenar
    const empresas = [...new Set(data?.map(d => d.match_empresa).filter(Boolean) || [])].sort();
    console.log(`✅ [AUTOCOMPLETE] ${empresas.length} empresas encontradas:`, empresas);

    return empresas;
  } catch (error) {
    console.error('❌ [AUTOCOMPLETE] Erro ao buscar empresas:', error);
    return [];
  }
}

/**
 * Busca serviços disponíveis para uma empresa específica
 */
export async function buscarServicosParaAutocomplete(empresa: string): Promise<string[]> {
  try {
    if (!empresa || !empresa.trim()) return [];

    console.log(`🔍 [AUTOCOMPLETE] Buscando serviços para empresa: ${empresa}`);

    const { supabase } = await import('./supabaseClient');

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .select('match_texto')
      .eq('ativo', true)
      .eq('match_empresa', empresa.trim())
      .not('match_texto', 'is', null)
      .order('match_texto');

    if (error) {
      console.error('❌ [AUTOCOMPLETE] Erro ao buscar serviços:', error);
      return [];
    }

    // Remover duplicatas e ordenar
    const servicos = [...new Set(data?.map(d => d.match_texto).filter(Boolean) || [])].sort();
    console.log(`✅ [AUTOCOMPLETE] ${servicos.length} serviços encontrados para ${empresa}:`, servicos);

    return servicos;
  } catch (error) {
    console.error('❌ [AUTOCOMPLETE] Erro ao buscar serviços:', error);
    return [];
  }
}

/**
 * Busca descrições disponíveis para um serviço + empresa específicos
 */
export async function buscarDescricoesParaAutocomplete(servico: string, empresa: string): Promise<string[]> {
  try {
    if (!servico || !servico.trim() || !empresa || !empresa.trim()) return [];

    console.log(`🔍 [AUTOCOMPLETE] Buscando descrições para serviço: ${servico} + empresa: ${empresa}`);

    const { supabase } = await import('./supabaseClient');

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .select('descricao_padrao, match_texto')
      .eq('ativo', true)
      .eq('match_empresa', empresa.trim())
      .eq('match_texto', servico.trim())
      .not('descricao_padrao', 'is', null)
      .order('descricao_padrao');

    if (error) {
      console.error('❌ [AUTOCOMPLETE] Erro ao buscar descrições:', error);
      return [];
    }

    // Coletar descrições únicas (descricao_padrao e match_texto como fallback)
    const descricoes = new Set<string>();

    data?.forEach(d => {
      if (d.descricao_padrao) descricoes.add(d.descricao_padrao);
      if (d.match_texto) descricoes.add(d.match_texto); // fallback
    });

    const resultado = Array.from(descricoes).sort();
    console.log(`✅ [AUTOCOMPLETE] ${resultado.length} descrições encontradas:`, resultado);

    return resultado;
  } catch (error) {
    console.error('❌ [AUTOCOMPLETE] Erro ao buscar descrições:', error);
    return [];
  }
}

/**
 * Valida se uma combinação Serviço + Descrição + Empresa existe exatamente na tabela
 */
export async function validarCombinacaoSC(
  servico: string,
  descricao: string,
  empresa: string
): Promise<{ valido: boolean; despesa?: any }> {
  try {
    if (!servico?.trim() || !empresa?.trim()) {
      return { valido: false };
    }

    console.log(`🔍 [VALIDATION] Validando combinação: Serviço="${servico}", Descrição="${descricao}", Empresa="${empresa}"`);

    const { supabase } = await import('./supabaseClient');

    // Primeiro tentar match exato
    let query = supabase
      .from('despesas_recorrentes')
      .select('*')
      .eq('ativo', true)
      .eq('status_mes_atual', 'PENDENTE')
      .eq('match_empresa', empresa.trim())
      .eq('match_texto', servico.trim());

    let { data, error } = await query;

    if (error) {
      console.error('❌ [VALIDATION] Erro ao validar combinação exata:', error);
      return { valido: false };
    }

    let encontrado = data && data.length > 0;
    let despesa = encontrado ? data[0] : undefined;

    // Se não encontrou match exato, tentar match parcial (serviço contém ou é contido)
    if (!encontrado) {
      console.log('🔄 [VALIDATION] Tentando match parcial...');

      const { data: allDespesas, error: errorAll } = await supabase
        .from('despesas_recorrentes')
        .select('*')
        .eq('ativo', true)
        .eq('status_mes_atual', 'PENDENTE');

      if (!errorAll && allDespesas) {
        console.log(`📋 [VALIDATION] Encontradas ${allDespesas.length} despesas pendentes para análise:`);
        allDespesas.forEach(d => console.log(`   - "${d.match_texto}" (${d.match_empresa}) - ${d.apelido}`));

        // Normalizar strings para comparação
        const normalizar = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        const inputServico = normalizar(servico);
        const inputDescricao = descricao ? normalizar(descricao) : '';
        const inputEmpresa = normalizar(empresa);

        console.log(`🔍 [VALIDATION] Procurando match para:`);
        console.log(`   Serviço: "${inputServico}"`);
        console.log(`   Descrição: "${inputDescricao}"`);
        console.log(`   Empresa: "${inputEmpresa}"`);

        for (const desp of allDespesas) {
          const matchTexto = normalizar(desp.match_texto || '');
          const matchDescricao = normalizar(desp.descricao_padrao || '');
          const matchEmpresa = normalizar(desp.match_empresa || '');

          console.log(`🔍 [VALIDATION] Testando despesa: "${desp.apelido}"`);
          console.log(`   match_texto: "${matchTexto}"`);
          console.log(`   match_empresa: "${matchEmpresa}"`);

          // Verificar se a empresa corresponde primeiro
          const empresaMatch = inputEmpresa === matchEmpresa;
          console.log(`   Empresa match: ${empresaMatch}`);

          if (empresaMatch) {
            // Verificar se o serviço contém ou é contido no match_texto
            const matchServico = inputServico === matchTexto ||
                                inputServico.includes(matchTexto) ||
                                matchTexto.includes(inputServico);

            console.log(`   Serviço match: ${matchServico} (${inputServico} vs ${matchTexto})`);

            // Verificar se a descrição corresponde (se fornecida)
            const matchDesc = !inputDescricao ||
                             inputDescricao === matchDescricao ||
                             inputDescricao.includes(matchDescricao) ||
                             matchDescricao.includes(inputDescricao);

            console.log(`   Descrição match: ${matchDesc} (${inputDescricao} vs ${matchDescricao})`);

            if (matchServico && matchDesc) {
              encontrado = true;
              despesa = desp;
              console.log(`✅ [VALIDATION] Match parcial encontrado: "${desp.apelido}"`);
              break;
            }
          }
        }
      }
    }

    console.log(`✅ [VALIDATION] Combinação ${encontrado ? 'VÁLIDA' : 'INVÁLIDA'}`, encontrado ? `para despesa: ${despesa?.apelido}` : '');

    return { valido: encontrado, despesa };
  } catch (error) {
    console.error('❌ [VALIDATION] Erro ao validar combinação:', error);
    return { valido: false };
  }
}

/**
 * Verifica se uma SC já existe para uma empresa específica
 * Retorna true se a SC já existe na empresa, false caso contrário
 */
export async function checkSCDuplicadaPorEmpresa(
  sc: string,
  empresa: string,
  excludeId?: string // ID do item atual para excluir da verificação (usado em edição)
): Promise<boolean> {
  try {
    if (!sc || !sc.trim() || !empresa || !empresa.trim()) {
      return false;
    }

    const normalizedSC = sc.trim().replace(/\D/g, ''); // Remove tudo exceto números
    const normalizedEmpresa = empresa.trim().toUpperCase();

    if (!normalizedSC) {
      return false;
    }

    logger.log(`🔍 Verificando duplicidade de SC ${normalizedSC} para empresa ${normalizedEmpresa}`);

    // Buscar serviços com a mesma SC e empresa
    let queryServicos = supabase
      .from('servicos')
      .select('id, sc, empresa')
      .eq('empresa', normalizedEmpresa);

    // Se for edição, excluir o item atual
    if (excludeId) {
      queryServicos = queryServicos.neq('id', excludeId);
    }

    const { data: servicos, error: errorServicos } = await queryServicos;

    if (errorServicos) {
      logger.error('❌ Erro ao buscar serviços para verificação de duplicidade:', errorServicos);
      throw errorServicos;
    }

    // Verificar duplicidade em serviços
    const servicoDuplicado = servicos?.some(servico => {
      if (!servico.sc) return false;
      const servicoNormalizedSC = servico.sc.replace(/\D/g, '');
      return servicoNormalizedSC === normalizedSC;
    });

    if (servicoDuplicado) {
      logger.log(`⚠️ SC ${normalizedSC} já existe em serviços para empresa ${normalizedEmpresa}`);
      return true;
    }

    // Buscar produtos com a mesma SC e empresa
    let queryProdutos = supabase
      .from('produtos')
      .select('id, sc, empresa')
      .eq('empresa', normalizedEmpresa);

    // Se for edição, excluir o item atual
    if (excludeId) {
      queryProdutos = queryProdutos.neq('id', excludeId);
    }

    const { data: produtos, error: errorProdutos } = await queryProdutos;

    if (errorProdutos) {
      logger.error('❌ Erro ao buscar produtos para verificação de duplicidade:', errorProdutos);
      throw errorProdutos;
    }

    // Verificar duplicidade em produtos
    const produtoDuplicado = produtos?.some(produto => {
      if (!produto.sc) return false;
      const produtoNormalizedSC = produto.sc.replace(/\D/g, '');
      return produtoNormalizedSC === normalizedSC;
    });

    if (produtoDuplicado) {
      logger.log(`⚠️ SC ${normalizedSC} já existe em produtos para empresa ${normalizedEmpresa}`);
      return true;
    }

    logger.log(`✅ SC ${normalizedSC} está disponível para empresa ${normalizedEmpresa}`);
    return false;
  } catch (error) {
    logger.error('❌ Erro ao verificar duplicidade de SC:', error);
    throw error;
  }
}