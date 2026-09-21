// Regenera src/lib/revisional/inicial-mestre.ts a partir do markdown.
//
// O mestre é mantido em markdown para revisão jurídica, mas o build standalone
// do Next não empacota arquivos lidos por fs em runtime — por isso o módulo .ts.
//
// Rode depois de editar o markdown:  node scripts/sync-mestre.js

const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'lib', 'revisional')
const origem = path.join(dir, 'inicial-mestre.md')
const destino = path.join(dir, 'inicial-mestre.ts')

const md = fs.readFileSync(origem, 'utf8')

// Escapa o que quebraria o template literal: barra invertida, crase e ${
// Usa split/join em vez de regex — menos suscetível a erro de escape.
const escapado = md
  .split('\\').join('\\\\')
  .split('`').join('\\`')
  .split('${').join('\\${')

const saida =
  '// GERADO a partir de inicial-mestre.md — não edite aqui.\n' +
  '// Para atualizar:  node scripts/sync-mestre.js\n' +
  '//\n' +
  '// A fonte de revisão jurídica é o markdown ao lado. Este módulo existe\n' +
  '// porque o build standalone do Next não empacota arquivos lidos por fs.\n\n' +
  'export const INICIAL_MESTRE = `' + escapado + '`;\n'

fs.writeFileSync(destino, saida, 'utf8')

console.log('inicial-mestre.ts atualizado — ' + md.length + ' caracteres')
