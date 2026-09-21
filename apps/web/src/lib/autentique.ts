const AUTENTIQUE_ENDPOINT = "https://api.autentique.com.br/v2/graphql";

const CREATE_DOCUMENT_MUTATION = `
  mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!, $sandbox: Boolean) {
    createDocument(document: $document, signers: $signers, file: $file, sandbox: $sandbox) {
      id
      name
      created_at
      signatures {
        public_id
        name
        email
        delivery_method
        link { short_link }
      }
    }
  }
`;

/**
 * Canal de entrega do documento ao signatário.
 * Espelha o DeliveryMethodEnum da API (verificado por introspecção do schema).
 */
export type FormaEntrega = "email" | "whatsapp" | "sms" | "link";

const DELIVERY_METHOD: Record<FormaEntrega, string> = {
  email: "DELIVERY_METHOD_EMAIL",
  whatsapp: "DELIVERY_METHOD_WHATSAPP",
  sms: "DELIVERY_METHOD_SMS",
  link: "DELIVERY_METHOD_LINK",
};

type CreateContractParams = {
  pdfBuffer: Buffer;
  documentName: string;
  signerName: string;
  /** Obrigatório quando a entrega for por e-mail. */
  signerEmail?: string;
  /** Obrigatório quando a entrega for por WhatsApp ou SMS. */
  signerPhone?: string;
  /**
   * Canal de entrega. Quando omitido, é inferido: há e-mail → "email";
   * só há telefone → "whatsapp".
   */
  entrega?: FormaEntrega;
};

type CreateContractResult = {
  documentId: string;
  signingLink: string | null;
  /** Canal efetivamente usado — vai para o registro do caso. */
  entrega: FormaEntrega;
};

/**
 * Normaliza telefone brasileiro para o formato E.164 (+55DDDNNNNNNNNN).
 *
 * Aceita as formas que aparecem na prática — "(84) 99627-5585",
 * "84996275585", "5584996275585", "+55 84 99627-5585" — e rejeita o que
 * não for um número brasileiro plausível, em vez de enviar lixo à API.
 */
export function normalizarTelefone(bruto: string): string {
  const digitos = bruto.replace(/\D/g, "");

  // Já veio com código do país.
  if (digitos.length === 13 && digitos.startsWith("55")) return `+${digitos}`;
  // Fixo com código do país.
  if (digitos.length === 12 && digitos.startsWith("55")) return `+${digitos}`;
  // DDD + celular de 9 dígitos.
  if (digitos.length === 11) return `+55${digitos}`;
  // DDD + fixo de 8 dígitos.
  if (digitos.length === 10) return `+55${digitos}`;

  throw new Error(
    `Telefone inválido para envio pelo Autentique: "${bruto}". ` +
      "Informe DDD + número (ex.: 84 99627-5585)."
  );
}

/**
 * Cria um documento no Autentique e retorna o link de assinatura do
 * signatário. A entrega pode ser por e-mail ou por WhatsApp — em ambos os
 * casos o link também é devolvido, para que o escritório possa reenviá-lo
 * pelo canal que preferir.
 *
 * Docs: https://docs.autentique.com.br/api/mutations/criando-um-documento.md
 */
export async function createContractDocument({
  pdfBuffer,
  documentName,
  signerName,
  signerEmail,
  signerPhone,
  entrega,
}: CreateContractParams): Promise<CreateContractResult> {
  const token = process.env.AUTENTIQUE_API_TOKEN;
  if (!token) throw new Error("AUTENTIQUE_API_TOKEN não configurado");

  // ── Canal e validação ────────────────────────────────────────────────
  const canal: FormaEntrega = entrega ?? (signerEmail ? "email" : "whatsapp");

  if (canal === "email" && !signerEmail) {
    throw new Error("Entrega por e-mail exige signerEmail");
  }
  if ((canal === "whatsapp" || canal === "sms") && !signerPhone) {
    throw new Error(`Entrega por ${canal} exige signerPhone`);
  }

  const telefone = signerPhone ? normalizarTelefone(signerPhone) : undefined;

  const signer: Record<string, unknown> = {
    name: signerName,
    action: "SIGN",
    delivery_method: DELIVERY_METHOD[canal],
  };
  // A API rejeita campo nulo: só envia o que o canal exige.
  if (signerEmail) signer.email = signerEmail;
  if (telefone) signer.phone = telefone;

  const operations = {
    query: CREATE_DOCUMENT_MUTATION,
    variables: {
      document: { name: documentName },
      signers: [signer],
      file: null,
      // Documentos sandbox não consomem crédito e são apagados em alguns dias
      // pela própria Autentique. NUNCA deve ser true em produção.
      sandbox: process.env.AUTENTIQUE_SANDBOX === "true",
    },
  };
  const map = { file: ["variables.file"] };

  const form = new FormData();
  form.append("operations", JSON.stringify(operations));
  form.append("map", JSON.stringify(map));
  form.append(
    "file",
    new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
    `${documentName}.pdf`
  );

  const res = await fetch(AUTENTIQUE_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = await res.json();
  if (json.errors) {
    console.error("Autentique createDocument error:", JSON.stringify(json.errors));
    throw new Error(
      `Autentique: ${json.errors.map((e: { message: string }) => e.message).join("; ")}`
    );
  }

  const doc = json.data.createDocument;
  const assinaturas: { public_id: string; name: string; email: string | null;
                       link?: { short_link?: string } }[] = doc.signatures ?? [];

  // Na entrega por WhatsApp a resposta não traz telefone (o tipo Signature
  // não expõe esse campo), então a identificação é por e-mail quando houver
  // e por nome nos demais casos. Só enviamos um signatário, de modo que o
  // primeiro registro é o fallback seguro.
  const signature =
    (signerEmail && assinaturas.find((s) => s.email === signerEmail)) ||
    assinaturas.find((s) => s.name === signerName) ||
    assinaturas[0];

  if (!signature) {
    throw new Error("Autentique: signatário não encontrado na resposta");
  }

  const signingLink =
    signature.link?.short_link || (await fetchSignatureLink(token, signature.public_id));

  return { documentId: doc.id as string, signingLink, entrega: canal };
}

const DOCUMENT_QUERY = `
  query Documento($id: UUID!) {
    document(id: $id) {
      id
      name
      signatures {
        name
        email
        action { name }
        signed { created_at }
        rejected { created_at }
      }
    }
  }
`;

export type EstadoDocumento = {
  id: string;
  nome: string;
  /** Signatários com obrigação de assinar que já assinaram. */
  assinadas: number;
  total: number;
  /** true quando todos os signatários obrigatórios concluíram. */
  concluido: boolean;
  rejeitado: boolean;
  /** Data da última assinatura, quando concluído. */
  assinadoEm: string | null;
};

/**
 * Consulta o estado real de um documento no Autentique.
 *
 * Existe para que o webhook não precise confiar no corpo do POST: o payload
 * serve apenas de gatilho, e a verdade vem da API. Assim, mesmo que a
 * verificação de assinatura do webhook falhe ou não esteja configurada,
 * ninguém marca um contrato como assinado mandando um POST forjado.
 *
 * Atenção ao contar: a lista `signatures` inclui o registro do proprietário
 * do documento, que vem com `action: null` e nunca assina. Só entram na conta
 * os signatários com ação definida — contá-lo como pendente faria todo
 * documento parecer travado.
 */
export async function consultarDocumento(
  documentId: string
): Promise<EstadoDocumento | null> {
  const token = process.env.AUTENTIQUE_API_TOKEN;
  if (!token) throw new Error("AUTENTIQUE_API_TOKEN não configurado");

  const res = await fetch(AUTENTIQUE_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: DOCUMENT_QUERY, variables: { id: documentId } }),
    cache: "no-store",
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `Autentique (consulta): ${json.errors
        .map((e: { message: string }) => e.message)
        .join("; ")}`
    );
  }

  const doc = json.data?.document;
  if (!doc) return null;

  type Sig = {
    action: { name: string } | null;
    signed: { created_at: string } | null;
    rejected: { created_at: string } | null;
  };

  const signatarios: Sig[] = (doc.signatures ?? []).filter((s: Sig) => s.action);
  const assinadas = signatarios.filter((s) => s.signed);
  const datas = assinadas.map((s) => s.signed!.created_at).sort();

  return {
    id: doc.id,
    nome: doc.name,
    assinadas: assinadas.length,
    total: signatarios.length,
    concluido: signatarios.length > 0 && assinadas.length === signatarios.length,
    rejeitado: signatarios.some((s) => s.rejected),
    assinadoEm: datas.length ? datas[datas.length - 1] : null,
  };
}

const CREATE_LINK_TO_SIGNATURE_MUTATION = `
  mutation CreateLinkToSignature($publicId: UUID!) {
    createLinkToSignature(public_id: $publicId) {
      short_link
    }
  }
`;

/**
 * A mutation createDocument nem sempre retorna o link de assinatura inline
 * (depende da conta/config) — nesse caso é preciso gerar explicitamente.
 * Docs: https://docs.autentique.com.br/api/mutations/create-signature-link.md
 */
async function fetchSignatureLink(token: string, publicId: string): Promise<string | null> {
  const res = await fetch(AUTENTIQUE_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: CREATE_LINK_TO_SIGNATURE_MUTATION,
      variables: { publicId },
    }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `Autentique (link): ${json.errors.map((e: { message: string }) => e.message).join("; ")}`
    );
  }
  return (json.data?.createLinkToSignature?.short_link as string) || null;
}
