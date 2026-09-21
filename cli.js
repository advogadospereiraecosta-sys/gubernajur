#!/usr/bin/env node

/**
 * Gubernajur CLI - Command Line Interface
 */

const datajud = require('./src/datajud');
const OABMonitor = require('./src/oab-monitor');

const args = process.argv.slice(2);
const command = args[0];

// Colors
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`
};

function parseArgs(args) {
  const result = {};
  for (const arg of args) {
    const match = arg.match(/--(\w+)=(.+)/);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

const commands = {
  async process(cnj) {
    console.log(colors.bold('\n🔍 Querying process by CNJ...\n'));
    try {
      const result = await datajud.getProcessDetails(cnj);
      if (!result.found) {
        console.log(colors.red('Process not found'));
        return;
      }
      console.log(colors.bold('═══ PROCESS DETAILS ═══'));
      console.log(colors.cyan('CNJ:'), colors.bold(result.numeroProcessoFormatado));
      console.log(colors.cyan('Tribunal:'), result.tribunal);
      console.log(colors.cyan('Classe:'), result.classe?.nome);
      console.log(colors.cyan('Assunto:'), result.assuntoPrincipal || 'N/A');
      console.log(colors.cyan('Data:'), result.dataAjuizamentoFormatada);
      console.log(colors.cyan('Órgão:'), result.orgaoJulgador?.nome);
      console.log(colors.cyan('Movimentos:'), result.movimentosCount);
      if (result.ultimoMovimento) {
        console.log(colors.bold('\n📜 Último Movimento:'));
        console.log(`  [${result.ultimoMovimento.dataHora}] ${result.ultimoMovimento.descricao?.substring(0, 120)}`);
      }
    } catch (err) {
      console.error(colors.red('[ERROR]'), err.message);
    }
  },

  async searchOAB(oab, options = {}) {
    console.log(colors.bold(`\n🔍 Searching for OAB ${oab}...\n`));
    const monitor = new OABMonitor();
    try {
      const results = await monitor.searchOAB(oab, {
        uf: options.uf,
        days: parseInt(options.days) || 30
      });
      let total = 0;
      for (const [tribunal, data] of Object.entries(results)) {
        if (!data.processes?.length) continue;
        total += data.processes.length;
        console.log(colors.bold(`\n═══ ${tribunal} (${data.total} total) ═══`));
        data.processes.forEach((p, i) => {
          console.log(colors.cyan(`\n${i + 1}. ${p.numeroProcessoFormatado}`));
          console.log(`   Classe: ${p.classe?.nome}`);
          console.log(`   Data: ${p.dataAjuizamentoFormatada}`);
        });
      }
      console.log(colors.green(`\n✅ Found ${total} process(es)`));
    } catch (err) {
      console.error(colors.red('[ERROR]'), err.message);
    }
  },

  validate(cnj) {
    console.log(colors.bold('\n🔍 Validating CNJ...\n'));
    const result = datajud.validateCNJ(cnj);
    if (result.valid) {
      console.log(colors.green('✅ CNJ VÁLIDO'));
      console.log(colors.cyan('Formatted:'), datajud.formatCNJ(cnj));
      console.log(colors.cyan('Tribunal:'), result.tribunal);
      console.log(colors.cyan('Jurisdiction:'), result.jurisdiction);
    } else {
      console.log(colors.red('❌ CNJ INVÁLIDO'));
      console.log(colors.yellow(result.error));
    }
  },

  tribunals() {
    console.log(colors.bold('\n🏛️ AVAILABLE TRIBUNALS\n'));
    const list = datajud.getAvailableTribunals();
    console.log(`Total: ${list.length} tribunals\n`);
    list.forEach(t => console.log(`  ${colors.cyan(t.code.padEnd(8))} ${t.endpoint}`));
  },

  async monitor(action, options = {}) {
    const monitor = new OABMonitor();
    if (action === 'start') {
      console.log(colors.bold('\n🚀 Starting OAB Monitor...\n'));
      await monitor.startMonitoring([{ oab: '19347', uf: 'RN', nome: 'Teste' }]);
      process.on('SIGINT', () => { monitor.stopMonitoring(); process.exit(0); });
    } else if (action === 'status') {
      const status = monitor.getStatus();
      console.log(colors.bold('\n📊 Monitor Status:\n'));
      console.log(colors.cyan('Active:'), status.active ? colors.green('YES') : colors.red('NO'));
    }
  },

  help() {
    console.log(colors.bold(`
╔══════════════════════════════════════════════════════════════╗
║   🏛️  Gubernajur CLI - CNJ/DataJud Integration              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   COMMANDS:                                                  ║
║                                                              ║
║   process <cnj>        Get process details                   ║
║   search-oab <oab>     Search OAB mentions                   ║
║   validate <cnj>      Validate CNJ number                   ║
║   tribunals            List all tribunals                    ║
║   monitor <action>    OAB monitoring (start, status)        ║
║   help                 Show this help                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `));
  }
};

async function main() {
  const parsedArgs = parseArgs(args.slice(1));

  switch (command) {
    case 'process': await commands.process(args[1]); break;
    case 'search-oab': await commands.searchOAB(args[1], parsedArgs); break;
    case 'validate': commands.validate(args[1]); break;
    case 'tribunals': commands.tribunals(); break;
    case 'monitor': await commands.monitor(args[1], parsedArgs); break;
    default: commands.help();
  }
}

main().catch(console.error);
