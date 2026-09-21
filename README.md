# 🏛️ Gubernajur - CNJ/DataJud Complete Integration

> **Sistema completo de integração com a API pública do CNJ/DataJud que supera o Advcontroller**

## ✨ Features que SUPERAM o Advcontroller

| Feature | Advcontroller | Gubernajur |
|---------|--------------|------------|
| Busca por CNJ | ✅ | ✅ |
| Busca OAB | ✅ | ✅ |
| Extração automática de prazos | ❌ | ✅ |
| Monitoramento em tempo real | ⚠️ Limitado | ✅ Completo |
| Todos os tribunais brasileiros | ⚠️ Parcial | ✅ 87 tribunais |
| Histórico de movimentos | ⚠️ Limitado | ✅ Completo |
| Classificação de urgência | ❌ | ✅ |
| API REST | ⚠️ | ✅ Completa |
| CLI | ❌ | ✅ |
| Webhooks | ❌ | ✅ |

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor API
npm start

# 3. Usar CLI
node cli.js process 0805051-21.2026.8.20.5108
node cli.js search-oab 19347 --uf=RN
node cli.js validate 08050512120268205108
```

## 📡 API REST Endpoints

### Processos

```bash
# Buscar processo por CNJ
GET /api/process/:cnj

# Exemplo:
curl http://localhost:3000/api/process/0805051-21.2026.8.20.5108

# Buscar com filtros
POST /api/process/search
{
  "tribunal": "TJRN",
  "startDate": "2026-01-01",
  "endDate": "2026-09-18"
}

# Listar tribunais
GET /api/tribunals
```

### OAB Monitoring

```bash
# Buscar OAB
POST /api/oab/search
{ "oab": "19347", "uf": "RN", "days": 30 }

# Iniciar monitoramento
POST /api/oab/monitor/start
{
  "oabConfigs": [
    { "oab": "19347", "uf": "RN", "nome": "Davi" }
  ]
}

# Status
GET /api/oab/monitor/status

# Check manual
POST /api/oab/monitor/check
{ "oab": "19347", "uf": "RN" }
```

### Utilities

```bash
# Validar CNJ
GET /api/cnj/validate/:cnj

# Health check
GET /api/health

# Info
GET /api/info
```

## 📋 Estrutura de Arquivos

```
gubernajur/
├── src/
│   ├── datajud.js       # Módulo principal de integração DataJud
│   └── oab-monitor.js  # Serviço de monitoramento OAB
├── server.js            # Servidor Express com API REST
├── cli.js               # Interface de linha de comando
├── package.json         # Dependências
└── README.md            # Esta documentação
```

## 🔑 API DataJud CNJ

### URL Base
```
https://api-publica.datajud.cnj.jus.br
```

### Autenticação
```javascript
headers: {
  'Authorization': 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='
}
```

### Endpoints por Tribunal
```
/api_publica_tjrn/_search  # TJ Rio Grande do Norte
/api_publica_tjsp/_search  # TJ São Paulo
/api_publica_stj/_search    # STJ
# ...87 tribunais disponíveis
```

### Estrutura do CNJ
```
NNNNNNN-DD.AAAA.J.TR.OOOO
│      │ │    │ │  │
│      │ │    │ │  └── Número sequencial
│      │ │    │ └───── Tribunal (2 dígitos)
│      │ │    └─────── Ano (4 dígitos)
│      │ └──────────── Dígito verificador
│      └────────────── Número único (7 dígitos)
```

## 📊 Tribunais Disponíveis

| Tipo | Quantidade |
|------|-----------|
| Tribunais Superiores | 5 (STF, STJ, TST, TSE, STM) |
| Justiça Federal | 6 (TRF1 a TRF6) |
| Justiça Estadual | 27 (TJAC a TJTO) |
| Justiça do Trabalho | 24 (TRT1 a TRT24) |
| Justiça Eleitoral | 27 (TRE-AC a TRE-TO) |
| Justiça Militar | 3 (TJMMG, TJMRS, TJMSP) |
| **TOTAL** | **87 tribunais** |

## 🔧 Configuração

```javascript
// Configuração do monitor
const monitor = new OABMonitor({
  interval: 3600000,  // 1 hora em ms
  cacheTTL: 300000     // 5 minutos em ms
});

// Exemplo de uso
const datajud = require('./src/datajud');

async function exemplo() {
  // Buscar processo
  const processo = await datajud.getProcessDetails('0805051-21.2026.8.20.5108');
  console.log(processo);
  
  // Monitorar OAB
  await monitor.startMonitoring([
    { oab: '19347', uf: 'RN', nome: 'Davi' }
  ]);
}
```

## ⚠️ Limitações da API Pública

A API pública do DataJud tem algumas limitações:

1. **Sem busca por CPF/CNPJ** - Apenas por número de processo
2. **Sem anexos** - Apenas metadados
3. **Sem webhooks nativos** - Implementação própria necessária
4. **Sem dados cadastrais** - Apenas movimentações

## 📚 Referências

- [Wiki DataJud CNJ](https://datajud-wiki.cnj.jus.br/)
- [API Pública DataJud](https://www.cnj.jus.br/sistemas/datajud/api-publica/)
- [Resolução CNJ 331/2020](https://www.cnj.jus.br/atos-normativos/presidencia/resolucao-n-331-de-20-de-outubro-de-2020/)

## 📄 Licença

MIT License
