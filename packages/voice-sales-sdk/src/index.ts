// Types
export * from './types.ts';

// DOM Bridge & Events
export * from './domBridge.ts';

// React Components
export { VoiceSalesWidget, TodyWidget, type VoiceSalesWidgetProps } from './components/VoiceSalesWidget.tsx';
export { AudioWaveform, type AudioWaveformProps } from './components/AudioWaveform.tsx';
export { VoiceCaption, type VoiceCaptionProps } from './components/VoiceCaption.tsx';
export { QuickReplies, type QuickRepliesProps } from './components/QuickReplies.tsx';
export { OfferCard, type OfferCardProps } from './components/OfferCard.tsx';
export { StageProgressBar, type StageProgressBarProps } from './components/StageProgressBar.tsx';
export { InteractiveDemoContainer, type InteractiveDemoContainerProps } from './components/InteractiveDemoContainer.tsx';

// Services & Hooks
export { ConversationEngine, type VoiceEngineSnapshot, type VoiceConversationHistoryEntry } from './services/conversationEngine.ts';
export { AudioManager, type AudioPlaybackState, type AudioStateSubscriber } from './services/audioManager.ts';
export { useConversation, type UseConversationReturn } from './hooks/useConversation.ts';
