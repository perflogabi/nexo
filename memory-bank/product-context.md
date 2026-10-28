# Product Context — Nexo Assist

## Problema

Service desk por formulário gera: chamados para dúvidas já documentadas, duplicidade, prioridade errada, informações incompletas e triagem manual pesada.

## Usuários

### Funcionário (persona principal)

Entra com e-mail corporativo. Quer:

1. Tirar dúvida sem abrir chamado
2. Consultar status de chamado (mesmo sem número) e saber se está atrasado
3. Complementar chamado aberto
4. Abrir chamado só conversando, conferindo dados antes de criar
5. Falar com analista (preferência ou gravidade)
6. Retomar conversa em outro dia

### Analista (Suporte N1/N2)

Recebe chamados e conversas transferidas via **console do analista**. Quer:

1. Chamados com tipo/categoria/prioridade corretos e descrição completa
2. Ver conversas que precisam dele (incl. baixa confiança do agent)
3. Assumir conversa (agent pausado), devolver ao agent ou encerrar

## Jornadas principais

```
Login → Chat
  ├─ Dúvida → busca help center → resposta (+ transparência)
  ├─ Consulta → lista/seleção de chamados → status/SLA → oferta de analista
  ├─ Abertura → coleta campos → rascunho → confirmação → create/update
  ├─ Complemento → confirmação → update
  └─ Transferência → status waiting_analyst → agent silencioso

Console analista
  ├─ Filtrar conversas (ex.: aguardando, em atendimento)
  ├─ Assumir → agent paused
  ├─ Responder (humano)
  ├─ Devolver ao agent → agent ativo
  └─ Encerrar conversa
```

## Regras de negócio explícitas (Anexo A)

| Tema | Regra |
|------|--------|
| Tipos | `INC` (parado/não funciona) · `REQ` (acesso/equipamento/software) |
| Categorias | Acesso, Rede e VPN, Hardware, Software, E-mail, Outros |
| Abertura | Título, descrição, tipo, categoria, prioridade, afetado; **rascunho + confirmação** antes de criar/atualizar |
| Duplicidade | Aberto sobre mesmo problema → atualiza; resolvido ≤7 dias → pode reabrir |
| Transferência | Pedido do usuário, crítico, vencido, ou baixa confiança; inclui resumo; agent não responde |
| Privacidade | Dados de chamado só para quem abriu |
| Escopo | Só TI; RH/financeiro/facilities → redirecionar |
| Prioridade | Crítica 1h · Alta 4h úteis · Média 3 dias úteis · Baixa 5 dias úteis |

### Prazos (evidência PRD + interpretação)

| Prioridade | Texto no Anexo A | Interpretação adotada |
|------------|------------------|------------------------|
| Crítica | “1 hora” (sem “úteis”) | 1 **hora corrida**, 24/7 (apoio: artigo Anexo B — plantão 24h para críticos) |
| Alta | “4 horas úteis” | Horário útil configurável |
| Média | “3 dias úteis” | idem |
| Baixa | “5 dias úteis” | idem |

- Calendário útil v1: seg–sex 08–18 `America/Sao_Paulo`; **feriados omitidos no PRD** → não inventar lista; calendário injetável.
- Detalhe: `requirements-resolution.md` §2.4.

## Requisitos de UX (telas Anexo C + extensão)

| Tela | Conteúdo |
|------|----------|
| 1 Login | E-mail, senha, apresentação do Nexo Assist |
| 2 Abertura | Perguntas, prioridade com prazo, rascunho para confirmação |
| 3 Consulta | Seleção de chamados, status/prazo vencido, oferta de analista |
| 4 Console lista | Conversas, filtros, agent transferido/pausado, chamados do funcionário |
| 5 Console atendimento | Analista assumiu; devolver ao agent ou encerrar |
| Perfil | Presente no protótipo oficial; **leitura** dos dados + stubs visuais de senha (sem alteração real) |

## Chat — comportamentos esperados

- Respostas em tempo quase real (streaming ou chunks)
- Cards de chamado
- Seleção de chamado
- Rascunho para confirmação
- Perguntas com opções rápidas
- Limite de **30 mensagens por sessão** (texto PRD); interpretação: sessão = conversa; contam employee+agent — ver `requirements-resolution.md` §2.3
- Acima de cada resposta: chips de ações; detalhe com entendimento, ação, **grau de segurança**, motivo (PRD)
- Transferência: pedido / crítico / vencido / sem segurança — motivos separados; agent pausado com analista

## Não funcionais relevantes

- Persistência sobrevive a restart
- Chaves fora do código
- Chamados de um funcionário nunca expostos a outro
- Serviço de chamados pode falhar por alguns segundos (simular e tratar)
- Uso consciente do LLM (custo/latência por conversa)
