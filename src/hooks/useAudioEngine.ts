import { useRef, useCallback, useState, useEffect } from "react";
import { SpatialMixer } from "../audio/spatialMixer";
import { AmbientSynth } from "../audio/ambientSynth";

type AudioEngine = {
  spatialMixer: SpatialMixer;
  ambientSynth: AmbientSynth;
  ctx: AudioContext;
};

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const initAudio = useCallback(() => {
    if (engineRef.current) return;

    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const spatialMixer = new SpatialMixer(ctx);
    const ambientSynth = new AmbientSynth(ctx, spatialMixer.output);

    engineRef.current = { ctx, spatialMixer, ambientSynth };
  }, []);

  const onWingNavigate = useCallback((departmentId: number) => {
    const engine = engineRef.current;
    if (!engine || isMuted) return;
    engine.ambientSynth.crossfadeTo(departmentId);
  }, [isMuted]);

  const startAmbient = useCallback((departmentId: number) => {
    const engine = engineRef.current;
    if (!engine || isMuted) return;
    engine.ambientSynth.crossfadeTo(departmentId);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    setIsMuted((prev) => {
      if (!prev) {
        engine.ambientSynth.stop();
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (engine) {
        engine.ambientSynth.stop();
        engine.ctx.close();
      }
    };
  }, []);

  return {
    initAudio,
    onWingNavigate,
    startAmbient,
    toggleMute,
    isMuted,
  };
}
