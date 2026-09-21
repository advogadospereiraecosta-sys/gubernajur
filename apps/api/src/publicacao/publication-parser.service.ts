import { Injectable } from '@nestjs/common'

export type AcaoExtraida = {
  tipo: string
  prazoDias: number | null
  prazoTipo: 'CORRIDOS' | 'UTEIS' | null
  textoOriginal: string
  urgencia: 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA'
}

export type ParsedPublicacao = {
  urgencia: 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA'
  clasificacao: string
  itens: AcaoExtraida[]
  resumen: string
  confianza: number
}

@Injectable()
export class PublicationParserService {
  private readonly basePrompt = `
Você é um assistente jurídico especializado em análise de publicações processuais brasileiras.
Analise a publicação abaixo e extraia as informações no formato JSON solicitado.

REGRAS DE EXTRAÇÃO:

1. IDENTIFICAR AÇÕES/PRAzoS:
   - CONTESTACAO: prazo para contestar (geralmente 15 dias úteis)
   - RECURSO: prazo para recorrer (5 ou 15 dias úteis conforme instância)
   - MANIFESTACAO: prazo para manifestar sobre documento/oposição (geralmente 15 dias)
   - PERICIA: prazo para indicar assistente técnico ou impugnar honorários
   - DILIGENCIA: prazo para cumprir diligência determinada
   - ALLEGACOES: prazo para alegações finais, memoriais
   - CERTIDAO: prazo para certidão ou documento
   - PAGAMENTO: determinação de pagamento de custas/honorários
   - OUTRO: qualquer outra ação identificada

2. CLASSIFICAR URGÊNCIA:
   - URGENTE: prazo <= 5 dias úteis OU intimação de decisão/sentença
   - ALTA: prazo entre 6-10 dias úteis
   - NORMAL: prazo > 10 dias úteis
   - BAIXA: sem prazo processual identificado

3. RESUMO: máximo 200 caracteres, linguagem clara para advogado

EXEMPLO DE OUTPUT:
{
  "urgencia": "URGENTE",
  "clasificacion": "CONTESTACAO",
  "itens": [
    {
      "tipo": "CONTESTACAO",
      "prazoDias": 15,
      "prazoTipo": "UTEIS",
      "textoOriginal": "Fica a parte requerida intimada a, no prazo de 15 (quinze) dias úteis, apresentar contestação",
      "urgencia": "URGENTE"
    }
  ],
  "resumen": "Intimação para apresentar contestação em 15 dias úteis",
  "confianza": 0.95
}

ATENÇÃO:
- Se a publicação NÃO contém prazo para a parte, classifique como BAIXA
- Se menciona intimação de SENTENÇA ou DECISÃO, já é URGENTE mesmo sem prazo numérico
- Retorne SOMENTE o JSON, sem texto adicional
- Use acentos em português brasileiro
`

  /**
   * Parse a publicação usando Claude
   * Retorna null se falhar ou se skipIA estiver ativo
   */
  async parse(conteudo: string, tribunal: string, tipo: string): Promise<ParsedPublicacao | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('[PublicationParser] ANTHROPIC_API_KEY não configurada')
      return null
    }

    const contextoTribunal = this.getContextoTribunal(tribunal)
    const contextoTipo = this.getContextoTipo(tipo)

    const prompt = `${this.basePrompt}

Contexto:
- Tribunal: ${tribunal} ${contextoTribunal}
- Tipo da publicação: ${tipo} ${contextoTipo}

Publicação a analisar:
---
${conteudo}
---

Retorne o JSON agora:`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[PublicationParser] Erro Anthropic:', response.status, error)
        return null
      }

      const data = await response.json()
      const text = data.content?.[0]?.text

      if (!text) {
        console.error('[PublicationParser] Resposta vazia da API')
        return null
      }

      return this.parseJsonResponse(text)
    } catch (error) {
      console.error('[PublicationParser] Erro:', error)
      return null
    }
  }

  /**
   * Parse simplificado com regex para quando IA não disponível
   * Detecta padrões comuns mesmo sem chamada externa
   */
  parseFallback(conteudo: string): ParsedPublicacao {
    const upper = conteudo.toUpperCase()
    let urgencia: 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA' = 'BAIXA'
    const itens: AcaoExtraida[] = []
    let clasificacao = 'OUTRO'

    // Sentença / Decisão / Procedência → URGENTE
    const hasKeyword = /SENTEN[CÇ]A|DECIS[AO]|PROCED[EÊ]NCIA/i.test(upper)
    const hasQualifier = /(?:PARCIAL|TOTAL|TERMINATIVA|INTERLOCUT[IO]RIA|MONOCRÁTICA|DEFINITIVA)/i.test(upper) ||
         /(?:de\s+parcial|de\s+total|parcialmente\s+procedente|procedente\s+em\s+parte)/i.test(upper)
    if (hasKeyword && hasQualifier) {
      urgencia = 'URGENTE'
      clasificacao = 'SENTENCA'
      itens.push({
        tipo: 'SENTENCA',
        prazoDias: null,
        prazoTipo: null,
        textoOriginal: conteudo.substring(0, 200),
        urgencia: 'URGENTE',
      })
    }

    // Intimação para prazo específico
    const prazoMatch = conteudo.match(/(\d{1,2})\s*(?:dias?\s*úteis|dias?)\s*(úteis)?/i)
    if (prazoMatch) {
      const dias = parseInt(prazoMatch[1])
      const isUteis = /úteis/i.test(prazoMatch[0])

      if (/CONTESTA[CÇ]/i.test(upper)) {
        clasificacao = 'CONTESTACAO'
        urgencia = dias <= 5 ? 'URGENTE' : dias <= 10 ? 'ALTA' : 'NORMAL'
        itens.push({
          tipo: 'CONTESTACAO',
          prazoDias: dias,
          prazoTipo: isUteis ? 'UTEIS' : 'CORRIDOS',
          textoOriginal: prazoMatch[0],
          urgencia,
        })
      } else if (/RECURS?O|APELA[CÇ]/i.test(upper)) {
        clasificacao = 'RECURSO'
        urgencia = dias <= 5 ? 'URGENTE' : dias <= 10 ? 'ALTA' : 'NORMAL'
        itens.push({
          tipo: 'RECURSO',
          prazoDias: dias,
          prazoTipo: isUteis ? 'UTEIS' : 'CORRIDOS',
          textoOriginal: prazoMatch[0],
          urgencia,
        })
      } else if (/MANIFESTAR|MANIFESTA[CÇ]/i.test(upper)) {
        clasificacao = 'MANIFESTACAO'
        urgencia = dias <= 5 ? 'URGENTE' : dias <= 10 ? 'ALTA' : 'NORMAL'
        itens.push({
          tipo: 'MANIFESTACAO',
          prazoDias: dias,
          prazoTipo: isUteis ? 'UTEIS' : 'CORRIDOS',
          textoOriginal: prazoMatch[0],
          urgencia,
        })
      } else {
        clasificacao = 'OUTRO'
        urgencia = dias <= 5 ? 'URGENTE' : dias <= 10 ? 'ALTA' : 'NORMAL'
        itens.push({
          tipo: 'OUTRO',
          prazoDias: dias,
          prazoTipo: isUteis ? 'UTEIS' : 'CORRIDOS',
          textoOriginal: prazoMatch[0],
          urgencia,
        })
      }
    }

    // Audiência / Sessão designada
    if (/AUDI[ÊE]NCIA|SESSÃO|SESSAO/i.test(upper) &&
        /(?:DESIGNADA|PARA|DATA|HOR[ÁA]|CONVOCADA|INTIMACÃO|INTIMACAO)/i.test(upper)) {
      if (!itens.find(i => i.tipo === 'AUDIENCIA')) {
        urgencia = urgencia === 'BAIXA' ? 'ALTA' : urgencia
        clasificacao = clasificacao === 'OUTRO' ? 'AUDIENCIA' : clasificacao
        itens.push({
          tipo: 'AUDIENCIA',
          prazoDias: null,
          prazoTipo: null,
          textoOriginal: conteudo.substring(0, 200),
          urgencia,
        })
      }
    }

    // Diligência / Perícia
    if (/DILIG[ÊE]NCIA|PERICIA|HONORÁRIOS.*PERITO|ASSISTENTE.*TÉCNICO/i.test(upper)) {
      if (!itens.find(i => i.tipo === 'DILIGENCIA')) {
        urgencia = urgencia === 'BAIXA' ? 'NORMAL' : urgencia
        clasificacao = clasificacao === 'OUTRO' ? 'DILIGENCIA' : clasificacao
        itens.push({
          tipo: 'DILIGENCIA',
          prazoDias: null,
          prazoTipo: null,
          textoOriginal: conteudo.substring(0, 200),
          urgencia,
        })
      }
    }

    // Cópia para o advogado
    if (!itens.length) {
      urgencia = 'BAIXA'
      itens.push({
        tipo: 'OUTRO',
        prazoDias: null,
        prazoTipo: null,
        textoOriginal: conteudo.substring(0, 200),
        urgencia: 'BAIXA',
      })
    }

    return {
      urgencia,
      clasificacao: clasificacao as any, // Accento: Prisma usa "classificacao"
      itens,
      resumen: this.generateResum(upper, urgencia, clasificacao),
      confianza: 0.6, // Confiança baixa sem IA
    }
  }

  private parseJsonResponse(text: string): ParsedPublicacao | null {
    try {
      // Extrai JSON do texto (pode ter markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const data = JSON.parse(jsonMatch[0])

      // Validação mínima
      if (!data.urgencia || !data.clasificacion) return null

      return {
        urgencia: data.urgencia,
        // Parser retorna sem acento; Prisma espera com acento → mapeamos no service
        clasificacao: (data.clasificacion || data.clasificacao || '') as any,
        itens: Array.isArray(data.itens) ? data.itens : [],
        resumen: data.resumen || '',
        confianza: data.confianza || 0.8,
      }
    } catch {
      console.error('[PublicationParser] Erro ao parsear JSON:', text.substring(0, 100))
      return null
    }
  }

  private getContextoTribunal(tribunal: string): string {
    const contextos: Record<string, string> = {
      TJRN: '(RN - 15 dias úteis para contestação)',
      TJSP: '(SP - 15 dias úteis para contestação)',
      TJMG: '(MG - 15 dias úteis para contestação)',
      TJRJ: '(RJ - 15 dias úteis para contestação)',
      TJBA: '(BA - 15 dias úteis para contestação)',
      TRT2: '(TRT 2ª - 15 dias úteis para contestação, 8 dias para audiência)',
      TRT1: '(TRT 1ª - 15 dias úteis para contestação)',
      TRF5: '(TRF 5ª - 30 dias para contestação na JF)',
    }
    return contextos[tribunal] || '(15 dias úteis para contestação padrão)'
  }

  private getContextoTipo(tipo: string): string {
    const contextos: Record<string, string> = {
      'INTIMAÇÃO': '- ATENÇÃO: intimação exige atenção especial',
      'SENTENÇA': '- Julgamento de mérito, verificar recurso cabível',
      'DESPACHO': '- Diligência determinada pelo juiz',
      'DECISÃO': '- Decisão interlocutória, verificar recurso se cabível',
      'CERTIDÃO': '- Expedição de certidão',
      'AUDIÊNCIA': '- Designação de audiência, verificar comparecimento',
    }
    return contextos[tipo?.toUpperCase()] || ''
  }

  private generateResum(upper: string, urgencia: string, clasificacao: string): string {
    if (/SENTEN[CÇ]A/i.test(upper)) return 'Sentença proferida - verificar recurso cabível'
    if (/CONTESTA[CÇ]/i.test(upper)) return `Intimação para contestação (${urgencia})`
    if (/RECURS?O|APELA[CÇ]/i.test(upper)) return `Intimação para ${clasificacao} (${urgencia})`
    if (/AUDIÊNCIA|AUDIENCIA/i.test(upper)) return 'Designação de audiência'
    if (/DILIG[ÊE]NCIA|PERICIA/i.test(upper)) return 'Diligência/perícia determinada'
    return `Publicação ${clasificacao.toLowerCase()}`
  }
}
