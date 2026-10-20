import { GoogleGenAI, Type } from '@google/genai';
import type { IntentClassificationRequest, IntentClassificationResult } from '../types.ts';

export async function classifyVoiceIntent(
  request: IntentClassificationRequest
): Promise<IntentClassificationResult> {
  const { query, currentNodeId = 'welcome', candidateNodes = [], productContext = 'Trợ lý tư vấn sản phẩm và giải pháp công nghệ' } = request;

  // Simple heuristic matching first
  const normalizedQuery = query.toLowerCase().trim();
  for (const node of candidateNodes) {
    if (node.label && normalizedQuery.includes(node.label.toLowerCase())) {
      return {
        intent: 'choice_selection',
        confidence: 0.95,
        targetNodeId: node.id,
        source: 'rule',
      };
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || candidateNodes.length === 0) {
    // Fallback: pick the first candidate node or maintain current
    const fallbackTarget = candidateNodes[0]?.id || currentNodeId;
    return {
      intent: 'fallback_selection',
      confidence: 0.5,
      targetNodeId: fallbackTarget,
      source: 'fallback',
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'voiceagent-engine',
        },
      },
    });

    const candidatesList = candidateNodes
      .map((c) => `- ID "${c.id}": ${c.label || c.transcript || 'Bước tiếp theo'}`)
      .join('\n');

    const prompt = `Bạn là hệ thống định tuyến ý định cho trợ lý bán hàng bằng giọng nói.
Bối cảnh sản phẩm: ${productContext}
Câu nói của khách hàng: "${query}"
Node hội thoại hiện tại: "${currentNodeId}"

Các node ứng viên tiếp theo có thể chọn:
${candidatesList}

Hãy phân tích và chọn node tiếp theo phù hợp nhất với nhu cầu của khách hàng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'Mô tả ý định khách hàng',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Độ tin cậy từ 0.0 đến 1.0',
            },
            targetNodeId: {
              type: Type.STRING,
              description: 'ID của node được chọn từ danh sách candidateNodes',
            },
          },
          required: ['intent', 'confidence', 'targetNodeId'],
        },
      },
    });

    const rawJson = response.text?.trim();
    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const isValid = candidateNodes.some((c) => c.id === parsed.targetNodeId);
      return {
        intent: parsed.intent || 'understood',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        targetNodeId: isValid ? parsed.targetNodeId : (candidateNodes[0]?.id || currentNodeId),
        source: 'gemini_api',
      };
    }
  } catch (err) {
    console.warn('[intentClassifier] LLM classification error:', err);
  }

  return {
    intent: 'fallback_selection',
    confidence: 0.5,
    targetNodeId: candidateNodes[0]?.id || currentNodeId,
    source: 'fallback',
  };
}
