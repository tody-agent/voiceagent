export type VoiceStage =
  | 'greeting'
  | 'qualify'
  | 'pain'
  | 'value'
  | 'demo'
  | 'objection'
  | 'offer'
  | 'closing';

export type VoiceWidgetState =
  | 'IDLE'
  | 'INVITING'
  | 'OPENING'
  | 'SPEAKING'
  | 'WAITING_FOR_RESPONSE'
  | 'LISTENING'
  | 'THINKING'
  | 'SHOWING_DEMO'
  | 'SHOWING_OFFER'
  | 'COMPLETED'
  | 'ERROR';

export interface VoiceVisualAction {
  type:
    | 'scrollToSection'
    | 'highlightArea'
    | 'openDemoScene'
    | 'triggerDemoAction'
    | 'setDemoStep'
    | 'playGestureDemo'
    | 'showOfferCard'
    | 'pulseCTA'
    | 'collapseToCorner'
    | 'customEvent';
  target?: string;
  scene?: string;
  action?: string;
  gesture?: string;
  step?: number;
  payload?: Record<string, unknown>;
}

export interface VoiceTimelineCue {
  timeSeconds: number;
  action: VoiceVisualAction;
}

export interface VoiceChoice {
  /** Unique choice ID */
  id: string;
  /** Label on the button (max 2 buttons enforced: index 0 = Primary, index 1 = Secondary) */
  label: string;
  /** Next node ID */
  next: string;
  /** Optional metadata tags for lead scoring */
  tags?: Record<string, string | boolean>;
}

export interface VoiceNodeCTA {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string;
  secondaryNextNode?: string;
  badge?: string;
}

export interface VoiceFlowNode {
  id: string;
  audioId: string;
  /** Spoken transcript text (auto-split into 2-line rolling captions) */
  transcript: string;
  stage: VoiceStage;
  /** Strictly up to 2 choices (index 0 = Primary, index 1 = Secondary) */
  choices: VoiceChoice[];
  /** When true, widget shrinks to compact bottom-right HUD so user can view/interact with demo */
  compactDuringDemo?: boolean;
  visualAction?: VoiceVisualAction;
  animationTimeline?: VoiceTimelineCue[];
  cta?: VoiceNodeCTA;
}

export interface VoiceBrandConfig {
  assistantName: string;
  assistantRole: string;
  inviteTitle: string;
  inviteBody: string;
  primaryColor?: string;
  accentColor?: string;
  avatarUrl?: string;
}

export interface VoiceProductOffer {
  productName: string;
  versionOrTier?: string;
  headline: string;
  summary: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
}

export interface VoiceAssistantConfig {
  projectId: string;
  locale?: string;
  audioBaseUrl?: string;
  initialNodeId?: string;
  inviteDelayMs?: number;
  brand: VoiceBrandConfig;
  offer: VoiceProductOffer;
  nodes: Record<string, VoiceFlowNode>;
  onVisualAction?: (action: VoiceVisualAction) => void;
}

// Backward-compatibility aliases for Tody AI
export type TodyStage = VoiceStage;
export type TodyWidgetState = VoiceWidgetState;
export type TodyVisualAction = VoiceVisualAction;
export type TodyTimelineCue = VoiceTimelineCue;
export type TodyChoice = VoiceChoice;
export type TodyNodeCTA = VoiceNodeCTA;
export type TodyFlowNode = VoiceFlowNode;
export type TodyBrandConfig = VoiceBrandConfig;
export type TodyProductOffer = VoiceProductOffer;
export type TodyAssistantConfig = VoiceAssistantConfig;
