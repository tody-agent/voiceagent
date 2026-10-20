import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  VoiceAssistantConfig,
  VoiceChoice,
  VoiceFlowNode,
  VoiceVisualAction,
  VoiceWidgetState,
} from '../types.ts';
import { ConversationEngine, type VoiceEngineSnapshot } from '../services/conversationEngine.ts';
import { AudioManager, type AudioPlaybackState } from '../services/audioManager.ts';
import { dispatchVoiceVisualAction } from '../domBridge.ts';

export interface UseConversationReturn {
  config: VoiceAssistantConfig;
  snapshot: VoiceEngineSnapshot;
  currentNode: VoiceFlowNode;
  widgetState: VoiceWidgetState;
  isExpanded: boolean;
  isCompactCompanion: boolean;
  audioState: AudioPlaybackState;
  startVoice: (nodeId?: string) => Promise<void>;
  dismissInvite: () => void;
  selectChoice: (choice: VoiceChoice) => Promise<void>;
  jumpToNode: (nodeId: string) => Promise<void>;
  skipSpeech: () => void;
  goBack: () => Promise<void>;
  restart: () => Promise<void>;
  toggleMute: () => boolean;
  setCompact: (compact: boolean) => void;
  expandFromCompact: () => void;
  close: () => void;
}

export function useConversation(
  config: VoiceAssistantConfig,
  onAction?: (action: VoiceVisualAction) => void
): UseConversationReturn {
  const engine = useMemo(() => new ConversationEngine(config), [config]);
  const audioManager = useMemo(
    () => new AudioManager(config.audioBaseUrl, config.locale),
    [config.audioBaseUrl, config.locale]
  );

  const [snapshot, setSnapshot] = useState<VoiceEngineSnapshot>(() => engine.getSnapshot());
  const [widgetState, setWidgetState] = useState<VoiceWidgetState>('IDLE');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactCompanion, setIsCompactCompanion] = useState(false);
  const [audioState, setAudioState] = useState<AudioPlaybackState>(() => audioManager.getState());

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    return audioManager.subscribe((st) => setAudioState(st));
  }, [audioManager]);

  // Handle invitation trigger delay
  useEffect(() => {
    const delay = config.inviteDelayMs ?? 4000;
    if (delay < 0) return;

    const timer = setTimeout(() => {
      setWidgetState((current) => (current === 'IDLE' ? 'INVITING' : current));
    }, delay);

    return () => clearTimeout(timer);
  }, [config.inviteDelayMs]);

  const executeNodeActions = useCallback(
    async (node: VoiceFlowNode) => {
      if (node.visualAction) {
        dispatchVoiceVisualAction(node.visualAction, onActionRef.current);
      }

      if (node.compactDuringDemo) {
        setIsCompactCompanion(true);
      }

      setWidgetState('SPEAKING');
      await audioManager.playClip(node.audioId, node.transcript);
      setWidgetState(node.stage === 'offer' ? 'SHOWING_OFFER' : 'WAITING_FOR_RESPONSE');
    },
    [audioManager]
  );

  const startVoice = useCallback(
    async (nodeId?: string) => {
      setIsExpanded(true);
      const targetNode = nodeId ? engine.jumpToNode(nodeId) : engine.getSnapshot().currentNode;
      setSnapshot(engine.getSnapshot());
      await executeNodeActions(targetNode);
    },
    [engine, executeNodeActions]
  );

  const dismissInvite = useCallback(() => {
    setWidgetState('IDLE');
  }, []);

  const selectChoice = useCallback(
    async (choice: VoiceChoice) => {
      const nextNode = engine.selectChoice(choice);
      setSnapshot(engine.getSnapshot());
      await executeNodeActions(nextNode);
    },
    [engine, executeNodeActions]
  );

  const jumpToNode = useCallback(
    async (nodeId: string) => {
      const node = engine.jumpToNode(nodeId);
      setSnapshot(engine.getSnapshot());
      await executeNodeActions(node);
    },
    [engine, executeNodeActions]
  );

  const skipSpeech = useCallback(() => {
    audioManager.stop();
    setWidgetState(
      snapshot.currentNode.stage === 'offer'
        ? 'SHOWING_OFFER'
        : 'WAITING_FOR_RESPONSE'
    );
  }, [audioManager, snapshot.currentNode.stage]);

  const goBack = useCallback(async () => {
    const prevNode = engine.goBack();
    if (prevNode) {
      setSnapshot(engine.getSnapshot());
      await executeNodeActions(prevNode);
    }
  }, [engine, executeNodeActions]);

  const restart = useCallback(async () => {
    const startNode = engine.restart();
    setIsCompactCompanion(false);
    setSnapshot(engine.getSnapshot());
    await executeNodeActions(startNode);
  }, [engine, executeNodeActions]);

  const toggleMute = useCallback(() => {
    return audioManager.toggleMute();
  }, [audioManager]);

  const setCompact = useCallback((compact: boolean) => {
    setIsCompactCompanion(compact);
  }, []);

  const expandFromCompact = useCallback(() => {
    setIsCompactCompanion(false);
  }, []);

  const close = useCallback(() => {
    audioManager.stop();
    setIsExpanded(false);
    setIsCompactCompanion(false);
    setWidgetState('IDLE');
  }, [audioManager]);

  return {
    config,
    snapshot,
    currentNode: snapshot.currentNode,
    widgetState,
    isExpanded,
    isCompactCompanion,
    audioState,
    startVoice,
    dismissInvite,
    selectChoice,
    jumpToNode,
    skipSpeech,
    goBack,
    restart,
    toggleMute,
    setCompact,
    expandFromCompact,
    close,
  };
}
