import type {
  VoiceAssistantConfig,
  VoiceChoice,
  VoiceFlowNode,
} from '../types.ts';

export interface VoiceConversationHistoryEntry {
  nodeId: string;
  audioId: string;
  transcript: string;
  userReply?: string;
  timestamp: number;
}

export interface VoiceEngineSnapshot {
  currentNodeId: string;
  currentNode: VoiceFlowNode;
  history: VoiceConversationHistoryEntry[];
  canGoBack: boolean;
  userTags: Record<string, string | boolean>;
}

export class ConversationEngine {
  private config: VoiceAssistantConfig;
  private currentNodeId: string;
  private history: VoiceConversationHistoryEntry[];
  private nodeStack: string[];
  private userTags: Record<string, string | boolean>;

  constructor(config: VoiceAssistantConfig, initialNodeId?: string) {
    this.config = config;
    const fallbackNodeId = Object.keys(config.nodes)[0] || 'welcome';
    const startId = initialNodeId || config.initialNodeId || fallbackNodeId;
    this.currentNodeId = config.nodes[startId] ? startId : fallbackNodeId;

    const startNode = this.config.nodes[this.currentNodeId];
    this.history = startNode
      ? [
          {
            nodeId: startNode.id,
            audioId: startNode.audioId,
            transcript: startNode.transcript,
            timestamp: Date.now(),
          },
        ]
      : [];
    this.nodeStack = [this.currentNodeId];
    this.userTags = {};
  }

  public getSnapshot(): VoiceEngineSnapshot {
    const currentNode =
      this.config.nodes[this.currentNodeId] ||
      Object.values(this.config.nodes)[0];

    return {
      currentNodeId: this.currentNodeId,
      currentNode,
      history: [...this.history],
      canGoBack: this.nodeStack.length > 1,
      userTags: { ...this.userTags },
    };
  }

  public selectChoice(choice: VoiceChoice): VoiceFlowNode {
    if (choice.tags) {
      this.userTags = { ...this.userTags, ...choice.tags };
    }

    if (this.history.length > 0) {
      this.history[this.history.length - 1].userReply = choice.label;
    }

    const targetNodeId = choice.next;
    const targetNode = this.config.nodes[targetNodeId];

    if (!targetNode) {
      console.warn(`Node ${targetNodeId} not found in voice config`);
      return this.getSnapshot().currentNode;
    }

    this.currentNodeId = targetNodeId;
    this.nodeStack.push(targetNodeId);

    this.history.push({
      nodeId: targetNode.id,
      audioId: targetNode.audioId,
      transcript: targetNode.transcript,
      timestamp: Date.now(),
    });

    return targetNode;
  }

  public jumpToNode(nodeId: string): VoiceFlowNode {
    const targetNode = this.config.nodes[nodeId];
    if (!targetNode) {
      return this.getSnapshot().currentNode;
    }
    this.currentNodeId = nodeId;
    this.nodeStack.push(nodeId);
    this.history.push({
      nodeId: targetNode.id,
      audioId: targetNode.audioId,
      transcript: targetNode.transcript,
      timestamp: Date.now(),
    });
    return targetNode;
  }

  public goBack(): VoiceFlowNode | null {
    if (this.nodeStack.length <= 1) return null;
    this.nodeStack.pop();
    const previousNodeId = this.nodeStack[this.nodeStack.length - 1];
    this.currentNodeId = previousNodeId;
    return this.config.nodes[previousNodeId] || null;
  }

  public restart(): VoiceFlowNode {
    const startId = this.config.initialNodeId || Object.keys(this.config.nodes)[0] || 'welcome';
    this.currentNodeId = startId;
    this.nodeStack = [startId];
    this.userTags = {};
    const startNode = this.config.nodes[startId];
    this.history = startNode
      ? [
          {
            nodeId: startNode.id,
            audioId: startNode.audioId,
            transcript: startNode.transcript,
            timestamp: Date.now(),
          },
        ]
      : [];
    return startNode;
  }
}
