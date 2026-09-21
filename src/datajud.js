/**
 * Gubernajur - CNJ/DataJud Complete Integration Module
 *
 * Complete integration with CNJ's DataJud public API for:
 * - Process search by CNJ number
 * - OAB monitoring (Diário da Justiça)
 * - Process data extraction
 * - Movement tracking
 * - Tribunal-specific searches
 */

const API_BASE_URL = 'https://api-publica.datajud.cnj.jus.br';
const API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

// Tribunal endpoints mapping (J = Jurisdicao, TR = Tribunal)
const TRIBUNALS = {
  // Tribunais Superiores
  STF: 'api_publica_stf',
  STJ: 'api_publica_stj',
  TST: 'api_publica_tst',
  TSE: 'api_publica_tse',
  STM: 'api_publica_stm',

  // Justiça Federal
  TRF1: 'api_publica_trf1',
  TRF2: 'api_publica_trf2',
  TRF3: 'api_publica_trf3',
  TRF4: 'api_publica_trf4',
  TRF5: 'api_publica_trf5',
  TRF6: 'api_publica_trf6',

  // Justiça Estadual
  TJAC: 'api_publica_tjac',
  TJAL: 'api_publica_tjal',
  TJAM: 'api_publica_tjam',
  TJAP: 'api_publica_tjap',
  TJBA: 'api_publica_tjba',
  TJCE: 'api_publica_tjce',
  TJDFT: 'api_publica_tjdft',
  TJES: 'api_publica_tjes',
  TJGO: 'api_publica_tjgo',
  TJMA: 'api_publica_tjma',
  TJMG: 'api_publica_tjmg',
  TJMS: 'api_publica_tjms',
  TJMT: 'api_publica_tjmt',
  TJPA: 'api_publica_tjpa',
  TJPB: 'api_publica_tjpb',
  TJPE: 'api_publica_tjpe',
  TJPI: 'api_publica_tjpi',
  TJPR: 'api_publica_tjpr',
  TJRJ: 'api_publica_tjrj',
  TJRN: 'api_publica_tjrn',
  TJRO: 'api_publica_tjro',
  TJRR: 'api_publica_tjrr',
  TJRS: 'api_publica_tjrs',
  TJSC: 'api_publica_tjsc',
  TJSE: 'api_publica_tjse',
  TJSP: 'api_publica_tjsp',
  TJTO: 'api_publica_tjto',

  // Justiça do Trabalho
  TRT1: 'api_publica_trt1',
  TRT2: 'api_publica_trt2',
  TRT3: 'api_publica_trt3',
  TRT4: 'api_publica_trt4',
  TRT5: 'api_publica_trt5',
  TRT6: 'api_publica_trt6',
  TRT7: 'api_publica_trt7',
  TRT8: 'api_publica_trt8',
  TRT9: 'api_publica_trt9',
  TRT10: 'api_publica_trt10',
  TRT11: 'api_publica_trt11',
  TRT12: 'api_publica_trt12',
  TRT13: 'api_publica_trt13',
  TRT14: 'api_publica_trt14',
  TRT15: 'api_publica_trt15',
  TRT16: 'api_publica_trt16',
  TRT17: 'api_publica_trt17',
  TRT18: 'api_publica_trt18',
  TRT19: 'api_publica_trt19',
  TRT20: 'api_publica_trt20',
  TRT21: 'api_publica_trt21',
  TRT22: 'api_publica_trt22',
  TRT23: 'api_publica_trt23',
  TRT24: 'api_publica_trt24',

  // Justiça Eleitoral
  TREAC: 'api_publica_tre_ac',
  TREAL: 'api_publica_tre_al',
  TREAM: 'api_publica_tre_am',
  TREAP: 'api_publica_tre_ap',
  TREBA: 'api_publica_tre_ba',
  TRECE: 'api_publica_tre_ce',
  TREDES: 'api_publica_tre_df',
  TREES: 'api_publica_tre_es',
  TREGO: 'api_publica_tre_go',
  TREMA: 'api_publica_tre_ma',
  TREMS: 'api_publica_tre_ms',
  TREM: 'api_publica_tre_mt',
  TREPA: 'api_publica_tre_pa',
  TREPE: 'api_publica_tre_pe',
  TREPI: 'api_publica_tre_pi',
  TREPR: 'api_publica_tre_pr',
  TRERJ: 'api_publica_tre_rj',
  TRERN: 'api_publica_tre_rn',
  TRERO: 'api_publica_tre_ro',
  TRERR: 'api_publica_tre_rr',
  TRERS: 'api_publica_tre_rs',
  TRESC: 'api_publica_tre_sc',
  TRESE: 'api_publica_tre_se',
  TRESP: 'api_publica_tre_sp',
  TRETO: 'api_publica_tre_to',

  // Justiça Militar
  TJMMG: 'api_publica_tjmmg',
  TJMRS: 'api_publica_tjmrs',
  TJMSP: 'api_publica_tjmsp'
};

// Map CNJ tribunal code to tribunal (J=8 for Justiça Estadual, positions 14-15)
const CNJ_TRIBUNAL_MAP = {
  // Tribunais Superiores (J=0)
  '00': 'STF', '01': 'STJ', '02': 'TST', '03': 'TSE', '04': 'STM',
  // Justiça Federal (J=1 ou 2)
  '01': 'TRF1', '02': 'TRF2', '03': 'TRF3', '04': 'TRF4', '05': 'TRF5', '06': 'TRF6',
  // Justiça do Trabalho (J=3 ou 4)
  '01': 'TRT1', '02': 'TRT2', '03': 'TRT3', '04': 'TRT4', '05': 'TRT5',
  '06': 'TRT6', '07': 'TRT7', '08': 'TRT8', '09': 'TRT9', '10': 'TRT10',
  '11': 'TRT11', '12': 'TRT12', '13': 'TRT13', '14': 'TRT14', '15': 'TRT15',
  '16': 'TRT16', '17': 'TRT17', '18': 'TRT18', '19': 'TRT19', '20': 'TRT20',
  '21': 'TRT21', '22': 'TRT22', '23': 'TRT23', '24': 'TRT24',
  // Justiça Eleitoral (J=5 ou 6)
  '01': 'TREAC', '02': 'TREAL', '03': 'TREAM', '04': 'TREAP', '05': 'TREBA',
  '06': 'TRECE', '07': 'TREDES', '08': 'TREES', '09': 'TREGO', '10': 'TREMA',
  '11': 'TREMS', '12': 'TREM', '13': 'TREPA', '14': 'TREPE', '15': 'TREPI',
  '16': 'TREPR', '17': 'TRERJ', '18': 'TRERN', '19': 'TRERO', '20': 'TRERR',
  '21': 'TRERS', '22': 'TRESC', '23': 'TRESE', '24': 'TRESP', '25': 'TRETO',
  // Justiça Militar (J=7)
  '01': 'TJMMG', '02': 'TJMRS', '03': 'TJMSP',
  // Justiça Estadual (J=8 ou 9) - Códigos oficiais CNJ
  '01': 'TJSP', '02': 'TJRJ', '03': 'TJMG', '04': 'TJRS', '05': 'TJBA',
  '06': 'TJPR', '07': 'TJCE', '08': 'TJPE', '09': 'TJAM', '10': 'TJPA',
  '11': 'TJMA', '12': 'TJSC', '13': 'TJGO', '14': 'TJDFT', '15': 'TJMS',
  '16': 'TJPB', '17': 'TJPI', '18': 'TJAL', '19': 'TJSE', '20': 'TJRN',
  '21': 'TJMT', '22': 'TJES', '23': 'TJRO', '24': 'TJTO', '25': 'TJAC',
  '26': 'TJAP', '27': 'TJRR', '28': 'TJAP', '29': 'TJRJ', '30': 'TJRN',
  '31': 'TJRO', '32': 'TJRR', '33': 'TJRS', '34': 'TJSC', '35': 'TJSE',
  '36': 'TJSP', '37': 'TJTO', '38': 'TJBA', '39': 'TJCE', '40': 'TJDFT',
  '41': 'TJES', '42': 'TJGO', '43': 'TJMA', '44': 'TJMG', '45': 'TJMS',
  '46': 'TJMT', '47': 'TJPA', '48': 'TJPB', '49': 'TJPE', '50': 'TJPI',
  '51': 'TJPR', '52': 'TJRN', '53': 'TJRO', '54': 'TJRR', '55': 'TJRS',
  '56': 'TJSC', '57': 'TJSE', '58': 'TJSP', '59': 'TJTO', '60': 'TJAC',
  '61': 'TJAL', '62': 'TJAM', '63': 'TJAP', '64': 'TJBA', '65': 'TJCE',
  '66': 'TJDFT', '67': 'TJES', '68': 'TJGO', '69': 'TJMA', '70': 'TJMG',
  '71': 'TJMS', '72': 'TJMT', '73': 'TJPA', '74': 'TJPB', '75': 'TJPE',
  '76': 'TJPI', '77': 'TJPR', '78': 'TJRN', '79': 'TJRO', '80': 'TJRR',
  '81': 'TJRS', '82': 'TJRN', '83': 'TJSE', '84': 'TJSP', '85': 'TJTO',
  '86': 'TJAC', '87': 'TJAL', '88': 'TJAM', '89': 'TJAP', '90': 'TJBA'
};

// Map CNJ position 14 (1-indexed) = J (jurisdiction)
const CNJ_JURISDICTION_MAP = {
  '0': 'Tribunais Superiores',
  '1': 'Justica Federal',
  '2': 'Justica Federal',
  '3': 'Justica do Trabalho',
  '4': 'Justica do Trabalho',
  '5': 'Justica Eleitoral',
  '6': 'Justica Eleitoral',
  '7': 'Justica Militar',
  '8': 'Justica Estadual',
  '9': 'Justica Estadual'
};

/**
 * Normalize CNJ number (with or without mask)
 */
function normalizeCNJ(cnj) {
  return cnj.replace(/[.\-\/]/g, '').trim();
}

/**
 * Extract tribunal from CNJ number
 */
function getTribunalFromCNJ(cnj) {
  const normalized = normalizeCNJ(cnj);
  if (normalized.length !== 20) {
    throw new Error('CNJ inválido. Deve conter 20 dígitos.');
  }

  // CNJ format: NNNNNNN-DD-AAAA-J-TR-OOOO
  // Positions (0-indexed):
  //   0-6: numero sequencial
  //   7-8: digito verificador
  //   9-12: ano
  //   13: jurisdicao (J)
  //   14-15: tribunal (TR)
  //   16-19: comarca
  const jurisdiction = normalized[13];  // position 14 (1-indexed) = J
  const tribunalCode = normalized.substring(14, 16);  // positions 15-16 (1-indexed) = TR

  const tribunal = CNJ_TRIBUNAL_MAP[tribunalCode];
  const jurisdictionType = CNJ_JURISDICTION_MAP[jurisdiction];

  return {
    tribunal,
    tribunalEndpoint: tribunal ? TRIBUNALS[tribunal] : null,
    jurisdiction: jurisdictionType,
    jurisdictionCode: jurisdiction
  };
}

/**
 * Make request to DataJud API
 */
async function datajudRequest(endpoint, body) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}/_search`, {
    method: 'POST',
    headers: {
      'Authorization': `APIKey ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`DataJud API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Format date from DataJud format (YYYYMMDDHHmmss)
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr.length < 8) return dateStr;
  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.length >= 10 ? dateStr.substring(8, 10) : '00';
    const minute = dateStr.length >= 12 ? dateStr.substring(10, 12) : '00';
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Parse DataJud source data into structured format
 */
function parseDataJudSource(source) {
  const classe = source.classe;
  const orgaoJulgador = source.orgaoJulgador;
  const movimentos = (source.movimento || []).map(m => ({
    id: m.id,
    codigo: m.codigo,
    descricao: m.descricao,
    dataHora: m.dataHora || m.data,
    tipo: m.tipo || 'ordinario'
  }));

  return {
    numeroProcesso: source.numeroProcesso,
    numeroProcessoFormatado: formatCNJ(source.numeroProcesso),
    classe: {
      nome: classe?.nome || source.classeNome || 'N/A',
      codigo: classe?.codigo || source.classeCodigo || null
    },
    assuntos: (source.assuntos || []).map(a => ({
      codigo: a.codigo,
      descricao: a.descricao
    })),
    assuntoPrincipal: source.assuntos?.[0]?.descricao || null,
    dataAjuizamento: source.dataAjuizamento,
    dataAjuizamentoFormatada: formatDate(source.dataAjuizamento),
    orgaoJulgador: {
      nome: orgaoJulgador?.nome || orgaoJulgador?.descricao || 'N/A',
      codigo: orgaoJulgador?.codigo || null
    },
    movimentos,
    movimentosCount: movimentos.length,
    ultimoMovimento: movimentos.length > 0 ? movimentos[movimentos.length - 1] : null,
    grau: source.grau || 1,
    tribunal: source.tribunal || null
  };
}

/**
 * Query process by CNJ number
 */
async function queryProcessByCNJ(cnj) {
  const { tribunal, tribunalEndpoint, jurisdiction } = getTribunalFromCNJ(cnj);

  if (!tribunalEndpoint) {
    throw new Error(`Tribunal não identificado para CNJ: ${cnj}`);
  }

  const normalizedCNJ = normalizeCNJ(cnj);

  const query = {
    query: {
      bool: {
        must: [
          { term: { 'numeroProcesso': normalizedCNJ } }
        ]
      }
    },
    size: 100
  };

  const result = await datajudRequest(tribunalEndpoint, query);

  return {
    tribunal,
    tribunalEndpoint,
    jurisdiction,
    total: result.hits?.total?.value || 0,
    processes: result.hits?.hits?.map(hit => parseDataJudSource(hit._source)) || []
  };
}

/**
 * Search processes by date range
 */
async function searchByDateRange(tribunalCode, startDate, endDate, options = {}) {
  const endpoint = TRIBUNALS[tribunalCode];
  if (!endpoint) {
    throw new Error(`Tribunal não encontrado: ${tribunalCode}`);
  }

  const { page = 0, size = 100 } = options;

  const query = {
    query: {
      bool: {
        must: [
          {
            range: {
              dataAjuizamento: {
                gte: startDate.replace(/[-\/]/g, ''),
                lte: endDate.replace(/[-\/]/g, '')
              }
            }
          }
        ]
      }
    },
    sort: [{ dataAjuizamento: 'desc' }],
    from: page * size,
    size
  };

  const result = await datajudRequest(endpoint, query);

  return {
    tribunal: tribunalCode,
    total: result.hits?.total?.value || 0,
    page,
    size,
    processes: result.hits?.hits?.map(hit => parseDataJudSource(hit._source)) || []
  };
}

/**
 * Search by OAB (for Diário da Justiça monitoring)
 */
async function searchByOAB(oab, uf, options = {}) {
  const { tribunalCode, page = 0, size = 100, startDate, endDate } = options;

  const must = [
    {
      multi_match: {
        query: oab,
        fields: ['movimento.descricao', 'movimento.codigo'],
        type: 'phrase'
      }
    }
  ];

  if (startDate && endDate) {
    must.push({
      range: {
        dataAjuizamento: {
          gte: startDate.replace(/[-\/]/g, ''),
          lte: endDate.replace(/[-\/]/g, '')
        }
      }
    });
  }

  const results = {};

  let tribunalsToSearch = [];

  if (tribunalCode && TRIBUNALS[tribunalCode]) {
    tribunalsToSearch = [[tribunalCode, TRIBUNALS[tribunalCode]]];
  } else if (uf) {
    const ufCode = uf.toUpperCase();
    tribunalsToSearch = Object.entries(TRIBUNALS).filter(([code]) => code === `TJ${ufCode}`);
  } else {
    tribunalsToSearch = Object.entries(TRIBUNALS);
  }

  for (const [code, endpoint] of tribunalsToSearch) {
    try {
      const query = {
        query: { bool: { must } },
        sort: [{ dataAjuizamento: 'desc' }],
        from: page * size,
        size
      };

      const result = await datajudRequest(endpoint, query);

      if (result.hits?.hits?.length > 0) {
        results[code] = {
          total: result.hits.total.value,
          processes: result.hits.hits.map(hit => {
            const parsed = parseDataJudSource(hit._source);
            const matchingMovements = parsed.movimentos.filter(m =>
              m.descricao?.includes(oab) || m.codigo?.includes(oab)
            );
            return { ...parsed, matchingMovements };
          })
        };
      }
    } catch (e) {
      console.warn(`Error searching ${code}:`, e.message);
    }
  }

  return results;
}

/**
 * Get all process details including movements
 */
async function getProcessDetails(cnj) {
  const result = await queryProcessByCNJ(cnj);

  if (result.processes.length === 0) {
    return { found: false, message: 'Processo não encontrado' };
  }

  const process = result.processes[0];

  return {
    found: true,
    tribunal: result.tribunal,
    ...process
  };
}

/**
 * Search by movement keywords
 */
async function searchByMovement(tribunalCode, keywords, options = {}) {
  const endpoint = TRIBUNALS[tribunalCode];
  if (!endpoint) {
    throw new Error(`Tribunal não encontrado: ${tribunalCode}`);
  }

  const { page = 0, size = 100, startDate, endDate } = options;

  const must = [
    {
      multi_match: {
        query: keywords,
        fields: ['movimento.descricao'],
        type: 'best_fields',
        fuzziness: 'AUTO'
      }
    }
  ];

  if (startDate && endDate) {
    must.push({
      range: {
        dataAjuizamento: {
          gte: startDate.replace(/[-\/]/g, ''),
          lte: endDate.replace(/[-\/]/g, '')
        }
      }
    });
  }

  const query = {
    query: { bool: { must } },
    sort: [{ dataAjuizamento: 'desc' }],
    from: page * size,
    size
  };

  const result = await datajudRequest(endpoint, query);

  return {
    tribunal: tribunalCode,
    keywords,
    total: result.hits?.total?.value || 0,
    processes: result.hits?.hits?.map(hit => parseDataJudSource(hit._source)) || []
  };
}

/**
 * Get available tribunals
 */
function getAvailableTribunals() {
  return Object.entries(TRIBUNALS).map(([code, endpoint]) => ({
    code,
    endpoint,
    url: `${API_BASE_URL}/${endpoint}/_search`
  }));
}

/**
 * Validate CNJ number format
 */
function validateCNJ(cnj) {
  const normalized = normalizeCNJ(cnj);

  if (normalized.length !== 20) {
    return { valid: false, error: 'CNJ deve conter 20 dígitos' };
  }

  if (!/^\d{20}$/.test(normalized)) {
    return { valid: false, error: 'CNJ deve conter apenas números' };
  }

  const tribunalInfo = getTribunalFromCNJ(normalized);
  if (!tribunalInfo.tribunalEndpoint) {
    return { valid: false, error: 'Tribunal não identificado no CNJ' };
  }

  return { valid: true, ...tribunalInfo };
}

/**
 * Format CNJ with mask
 */
function formatCNJ(cnj) {
  const normalized = normalizeCNJ(cnj);
  if (normalized.length !== 20) return cnj;
  return `${normalized.slice(0, 7)}-${normalized.slice(7, 9)}.${normalized.slice(9, 13)}.${normalized.slice(13, 14)}.${normalized.slice(14, 16)}.${normalized.slice(16)}`;
}

module.exports = {
  // Core functions
  queryProcessByCNJ,
  getProcessDetails,
  searchByDateRange,
  searchByOAB,
  searchByMovement,

  // Utility functions
  getTribunalFromCNJ,
  validateCNJ,
  normalizeCNJ,
  formatCNJ,
  formatDate,
  getAvailableTribunals,

  // Constants
  TRIBUNALS,
  API_BASE_URL
};
