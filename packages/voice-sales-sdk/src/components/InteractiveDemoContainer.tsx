import React, { useEffect, useState } from 'react';
import type { VoiceVisualAction } from '../types.ts';

export interface InteractiveDemoContainerProps {
  id?: string;
  className?: string;
  defaultScene?: string;
  children: (props: {
    activeScene: string;
    setActiveScene: (scene: string) => void;
    activeAction?: string;
    activeGesture?: string;
    step?: number;
    lastAction: VoiceVisualAction | null;
  }) => React.ReactNode;
}

/**
 * High-converting Interactive Demo wrapper that automatically synchronizes
 * its active scene, step, or action when triggered by the Voice Sales Assistant.
 */
export const InteractiveDemoContainer: React.FC<InteractiveDemoContainerProps> = ({
  id = 'interactive-demo-section',
  className = '',
  defaultScene = 'overview',
  children,
}) => {
  const [activeScene, setActiveScene] = useState<string>(defaultScene);
  const [activeAction, setActiveAction] = useState<string | undefined>(undefined);
  const [activeGesture, setActiveGesture] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [lastAction, setLastAction] = useState<VoiceVisualAction | null>(null);

  useEffect(() => {
    const handleVoiceAction = (event: Event) => {
      const customEvent = event as CustomEvent<VoiceVisualAction>;
      const action = customEvent.detail;
      if (!action) return;

      setLastAction(action);

      if (action.type === 'openDemoScene' && action.scene) {
        setActiveScene(action.scene);
      }

      if (action.type === 'triggerDemoAction' || action.type === 'setDemoStep') {
        if (action.scene) setActiveScene(action.scene);
        if (action.action) setActiveAction(action.action);
        if (typeof action.step === 'number') setStep(action.step);
      }

      if (action.type === 'playGestureDemo') {
        if (action.scene) setActiveScene(action.scene);
        if (action.gesture) setActiveGesture(action.gesture);
        if (typeof action.step === 'number') setStep(action.step);
      }
    };

    window.addEventListener('voice:action', handleVoiceAction);
    window.addEventListener('tody:action', handleVoiceAction);

    return () => {
      window.removeEventListener('voice:action', handleVoiceAction);
      window.removeEventListener('tody:action', handleVoiceAction);
    };
  }, []);

  return (
    <section id={id} data-voice-target="demo" className={`relative ${className}`}>
      {children({
        activeScene,
        setActiveScene,
        activeAction,
        activeGesture,
        step,
        lastAction,
      })}
    </section>
  );
};
