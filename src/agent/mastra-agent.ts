/**
 * Agent Mastra registrado com as tools tipadas.
 * Usado como fachada documentada; o turno de produção passa por AgentBrain
 * (mock | gemini @google/genai). Mastra concentra tools + instructions.
 */

import { Agent } from '@mastra/core/agent';
import { NEXO_AGENT_INSTRUCTIONS } from '@/agent/instructions';
import { createMastraTools } from '@/agent/mastra-tools';
import type { AgentToolContext } from '@/agent/tools/tool-context';

export function createNexoMastraAgent(getCtx: () => AgentToolContext) {
  const tools = createMastraTools(getCtx);
  return new Agent({
    id: 'nexo-assist',
    name: 'Nexo Assist',
    instructions: NEXO_AGENT_INSTRUCTIONS,
    // Modelo só relevante se generate() via Mastra for usado com chave Google.
    // Turnos da app usam @google/genai (gemini-brain) ou mock.
    model: 'google/gemini-flash-lite-latest',
    tools,
  });
}
