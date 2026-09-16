import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ComputerIcon,
  Camera01Icon,
  RotateRight01Icon,
  PlayIcon,
  PauseIcon,
  Cancel01Icon,
  Tick01Icon,
  Mic01Icon,
  Maximize01Icon,
  Shield01Icon,
} from 'hugeicons-react';
import {
  CompositionLayout,
  PipConfig,
  RecorderAspectRatio,
  RecorderBackgroundConfig,
  PrompterConfig,
  RecordingMode,
} from '../../types';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { AdjustableLayerBox, LayerRect } from './AdjustableLayerBox';
import { calculatePipMetrics } from '../../services/pipCoordinates';
import { BACKGROUND_PRESETS, NOISE_SVG_DATA_URL } from '../../services/backgroundPresets';

interface RecordingCanvasProps {
  layout: CompositionLayout;
  aspectRatio: RecorderAspectRatio;
  background: RecorderBackgroundConfig;
  pipConfig: PipConfig;
  onUpdatePipConfig: (updates: Partial<PipConfig>) => void;
  prompter: PrompterConfig;
  onUpdatePrompter: (updates: Partial<PrompterConfig>) => void;
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  micStream: MediaStream | null;
  isRecording: boolean;
  mode: RecordingMode;
  onShareScreen?: () => void;
  onStopSharingScreen?: () => void;
  onToggleCamera?: (active: boolean) => void;
  onEnableMic?: () => void;
  onStageHeightChange?: (height: number) => void;
}

export const RecordingCanvas: React.FC<RecordingCanvasProps> = ({
  layout,
  aspectRatio,
  background,
  pipConfig,
  onUpdatePipConfig,
  prompter,
  onUpdatePrompter,
  webcamStream,
  screenStream,
  micStream,
  isRecording,
  mode,
  onShareScreen,
  onStopSharingScreen,
  onToggleCamera,
  onEnableMic,
  onStageHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Measure and report exact stage height if requested (rounded to prevent sub-pixel layout loops)
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || !onStageHeightChange) return;
    let lastH = 0;
    const updateHeight = () => {
      const rect = stageEl.getBoundingClientRect();
      const rounded = Math.round(rect.height);
      if (rounded > 0 && Math.abs(rounded - lastH) >= 2) {
        lastH = rounded;
        onStageHeightChange(rounded);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(() => updateHeight());
    ro.observe(stageEl);
    return () => ro.disconnect();
  }, [onStageHeightChange, aspectRatio]);
  const innerStageRef = useRef<HTMLDivElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const camOnlyVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const prompterScrollRef = useRef<HTMLDivElement | null>(null);

  // Layer selection for direct manipulation (cyan outline + 4 corner handles)
  const [selectedLayer, setSelectedLayer] = useState<'screen' | 'cam' | null>(null);

  // Alignment guidelines active state when moving a frame in the middle
  const [alignmentGuides, setAlignmentGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  // Screen transform layer rectangle (percentages)
  const [screenRect, setScreenRect] = useState<LayerRect>(() => {
    if (layout === 'framed') {
      return { x: 7, y: 7, width: 86, height: 86 };
    }
    return { x: 0, y: 0, width: 100, height: 100 };
  });

  // Camera transform layer rectangle (percentages synchronized with pipConfig and layout)
  const [camRect, setCamRect] = useState<LayerRect>(() => {
    const metrics = calculatePipMetrics(pipConfig, 1920, 1080, layout);
    return {
      x: metrics.xPct,
      y: metrics.yPct,
      width: metrics.widthPct,
      height: metrics.heightPct,
    };
  });

  // Synchronize screenRect and camRect with active layout preset
  useEffect(() => {
    if (layout === 'framed') {
      setScreenRect({ x: 7, y: 7, width: 86, height: 86 });
    } else {
      setScreenRect({ x: 0, y: 0, width: 100, height: 100 });
    }

    const stage = innerStageRef.current?.getBoundingClientRect();
    const stageW = stage?.width || 1920;
    const stageH = stage?.height || 1080;

    // When selecting a layout preset, clear custom coordinates so preset takes immediate effect
    const activePipConfig =
      pipConfig.position === 'custom'
        ? {
            ...pipConfig,
            position: 'bottom-right' as const,
            customX: undefined,
            customY: undefined,
            customWidth: undefined,
            customHeight: undefined,
          }
        : pipConfig;

    if (pipConfig.position === 'custom') {
      onUpdatePipConfig(activePipConfig);
    }

    const metrics = calculatePipMetrics(activePipConfig, stageW, stageH, layout);
    setCamRect({
      x: metrics.xPct,
      y: metrics.yPct,
      width: metrics.widthPct,
      height: metrics.heightPct,
    });
  }, [layout]);

  // Synchronize camera box placement, dimensions, and shape with pipConfig and layout
  useEffect(() => {
    const updateMetrics = () => {
      const stage = innerStageRef.current?.getBoundingClientRect();
      const stageW = stage?.width || 1920;
      const stageH = stage?.height || 1080;
      const metrics = calculatePipMetrics(pipConfig, stageW, stageH, layout);

      setCamRect((prev) => {
        if (
          Math.abs(prev.x - metrics.xPct) < 0.1 &&
          Math.abs(prev.y - metrics.yPct) < 0.1 &&
          Math.abs(prev.width - metrics.widthPct) < 0.1 &&
          Math.abs(prev.height - metrics.heightPct) < 0.1
        ) {
          return prev;
        }
        return {
          x: metrics.xPct,
          y: metrics.yPct,
          width: metrics.widthPct,
          height: metrics.heightPct,
        };
      });
    };

    updateMetrics();

    // Auto-update on container resize
    const stageEl = innerStageRef.current;
    if (!stageEl || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      updateMetrics();
    });
    observer.observe(stageEl);

    return () => {
      observer.disconnect();
    };
  }, [
    layout,
    pipConfig.position,
    pipConfig.size,
    pipConfig.shape,
    pipConfig.customX,
    pipConfig.customY,
    pipConfig.customWidth,
    pipConfig.customHeight,
    aspectRatio,
  ]);

  const handleCamRectChange = useCallback(
    (newRect: LayerRect) => {
      setCamRect(newRect);
      onUpdatePipConfig({
        position: 'custom',
        customX: Math.round(newRect.x * 10) / 10,
        customY: Math.round(newRect.y * 10) / 10,
        customWidth: Math.round(newRect.width * 10) / 10,
        customHeight: Math.round(newRect.height * 10) / 10,
      });
    },
    [onUpdatePipConfig]
  );

  // Screen surface type ('monitor' | 'window' | 'browser')
  const [screenSurfaceType, setScreenSurfaceType] = useState<string>('monitor');
  const [screenResolution, setScreenResolution] = useState<{ width: number; height: number } | null>(null);

  // Detect surface type & capture handle on stream change
  const [isSelfCapture, setIsSelfCapture] = useState<boolean>(false);

  useEffect(() => {
    if (screenStream) {
      const track = screenStream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        const surface = (settings as { displaySurface?: string }).displaySurface || 'monitor';
        setScreenSurfaceType(surface);
        if (settings.width && settings.height) {
          setScreenResolution({ width: settings.width, height: settings.height });
        }

        // Check Chrome Capture Handle API
        const handle = (track as any).getCaptureHandle?.();
        const selfDetected = handle?.handle === 'osr-recorder';
        setIsSelfCapture(selfDetected);
      }
    } else {
      setScreenResolution(null);
      setIsSelfCapture(false);
    }
  }, [screenStream]);

  // Store stream resolution and maintain clean stage framing consistent with the recording compositor
  const handleScreenMetadata = useCallback((videoEl: HTMLVideoElement) => {
    if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return;
    setScreenResolution({ width: videoEl.videoWidth, height: videoEl.videoHeight });

    if (layout === 'framed') {
      setScreenRect({ x: 7, y: 7, width: 86, height: 86 });
    } else {
      setScreenRect({ x: 0, y: 0, width: 100, height: 100 });
    }
  }, [layout]);

  // Camera dimensions and positioning are unified and managed via calculatePipMetrics above

  // Attach webcam stream with explicit cleanup to release hardware handles
  useEffect(() => {
    const webcamVideo = webcamVideoRef.current;
    const camOnlyVideo = camOnlyVideoRef.current;

    if (webcamVideo) {
      if (webcamStream && webcamVideo.srcObject !== webcamStream) {
        webcamVideo.srcObject = webcamStream;
        webcamVideo.play().catch(() => {});
      } else if (!webcamStream && webcamVideo.srcObject) {
        webcamVideo.pause();
        webcamVideo.srcObject = null;
      }
    }
    if (camOnlyVideo) {
      if (webcamStream && camOnlyVideo.srcObject !== webcamStream) {
        camOnlyVideo.srcObject = webcamStream;
        camOnlyVideo.play().catch(() => {});
      } else if (!webcamStream && camOnlyVideo.srcObject) {
        camOnlyVideo.pause();
        camOnlyVideo.srcObject = null;
      }
    }
  }, [webcamStream, layout, mode]);

  // Attach screen stream with explicit cleanup
  useEffect(() => {
    const screenVideo = screenVideoRef.current;
    if (screenVideo) {
      screenVideo.srcObject = screenStream || null;
      if (screenStream) {
        screenVideo.play().catch(() => {});
        if (screenVideo.videoWidth > 0) {
          handleScreenMetadata(screenVideo);
        }
      } else {
        screenVideo.pause();
      }
    }

    return () => {
      if (screenVideo) {
        screenVideo.pause();
        screenVideo.srcObject = null;
      }
    };
  }, [screenStream, handleScreenMetadata]);

  // Teleprompter auto-scroll logic
  useEffect(() => {
    if (!prompter.enabled || !prompter.isScrolling) return;

    const interval = setInterval(() => {
      if (prompterScrollRef.current) {
        prompterScrollRef.current.scrollTop += prompter.speed * 0.8;
        if (
          prompterScrollRef.current.scrollTop + prompterScrollRef.current.clientHeight >=
          prompterScrollRef.current.scrollHeight
        ) {
          prompterScrollRef.current.scrollTop = 0;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [prompter.enabled, prompter.isScrolling, prompter.speed]);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] h-[min(460px,68vh)] w-auto max-w-[calc(100vw-7rem)]';
      case '1:1':
        return 'aspect-square h-[min(430px,65vh)] w-auto max-w-[calc(100vw-7rem)]';
      case '4:5':
        return 'aspect-[4/5] h-[min(460px,68vh)] w-auto max-w-[calc(100vw-7rem)]';
      case '4:3':
        return 'aspect-[4/3] w-[min(580px,calc(100vw-7rem),calc(62vh*4/3))] max-w-full';
      case '16:9':
      default:
        return 'aspect-video w-[min(760px,calc(100vw-7rem),calc(62vh*16/9))] max-w-full';
    }
  };

  // Canvas background style
  const getCanvasBackgroundStyle = (): React.CSSProperties => {
    if (background.type === 'none') {
      return { backgroundColor: '#111418' };
    }
    if (background.type === 'solid') {
      return { backgroundColor: background.value };
    }
    if (background.type === 'image' || background.value?.startsWith('url(') || background.value?.startsWith('http')) {
      const bgUrl = background.value?.startsWith('url(') ? background.value : `url("${background.value}")`;
      return {
        backgroundImage: bgUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (background.type === 'gradient' || background.type === 'grain') {
      return { background: background.value };
    }
    return { backgroundColor: '#111418' };
  };

  const resetScreenTransform = () => {
    setAlignmentGuides({ x: false, y: false });
    if (layout === 'framed') {
      setScreenRect({ x: 7, y: 7, width: 86, height: 86 });
    } else {
      setScreenRect({ x: 0, y: 0, width: 100, height: 100 });
    }
  };

  const resetCamTransform = () => {
    setAlignmentGuides({ x: false, y: false });
    const stage = innerStageRef.current?.getBoundingClientRect();
    const metrics = calculatePipMetrics(pipConfig, stage?.width || 1920, stage?.height || 1080, layout);
    setCamRect({
      x: metrics.xPct,
      y: metrics.yPct,
      width: metrics.widthPct,
      height: metrics.heightPct,
    });
  };

  return (
    <div
      ref={containerRef}
      id="recording-canvas-container"
      className="relative flex items-center justify-center select-none shrink-0"
      onClick={() => setSelectedLayer(null)}
    >
      {/* Outer Compact Canvas Frame */}
      <div
        ref={stageRef}
        id="recording-hero-stage"
        style={getCanvasBackgroundStyle()}
        className={`relative ${getAspectClass()} rounded-2xl border border-slate-700/40 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/70 overflow-hidden flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-150`}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Organic Film Grain Overlay */}
        {(background.type === 'grain' ||
          background.value?.includes('grain') ||
          BACKGROUND_PRESETS.find((p) => p.value === background.value)?.hasGrain) && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay z-0 opacity-40"
            style={{
              backgroundImage: `url("${NOISE_SVG_DATA_URL}")`,
              backgroundRepeat: 'repeat',
            }}
          />
        )}

        {/* Full-Stage Direct Composition Canvas (No invisible padding walls) */}
        <div
          ref={innerStageRef}
          className="relative w-full h-full rounded-2xl overflow-hidden bg-transparent flex items-center justify-center"
        >
            {/* 0. AUDIO ONLY MODE */}
            {mode === 'audio_only' ? (
              <AudioWaveformVisualizer
                stream={micStream}
                isRecording={isRecording}
                onEnableMic={onEnableMic}
              />
            ) : mode === 'cam_only' || layout === 'cam-only' ? (
              /* 1. CAMERA ONLY PRESENTER MODE (Compact & non-stretched framing) */
              <div className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
                {webcamStream ? (
                  <AdjustableLayerBox
                    id="adjustable-cam-only-layer"
                    isSelected={selectedLayer === 'cam'}
                    onSelect={() => setSelectedLayer('cam')}
                    rect={screenRect}
                    onChangeRect={setScreenRect}
                    containerRef={innerStageRef}
                    shape="rounded"
                    label="Camera"
                    disabled={isRecording}
                    onAlignChange={setAlignmentGuides}
                  >
                    <div className="relative w-full h-full flex items-center justify-center bg-black/90 shadow-2xl overflow-hidden rounded-lg ring-1 ring-white/10">
                      <video
                        ref={(el) => {
                          camOnlyVideoRef.current = el;
                          if (el) {
                            if (webcamStream && el.srcObject !== webcamStream) {
                              el.srcObject = webcamStream;
                              el.play().catch(() => {});
                            } else if (!webcamStream && el.srcObject) {
                              el.srcObject = null;
                            }
                          }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover rounded-lg ${
                          pipConfig.mirror ? 'scale-x-[-1]' : ''
                        }`}
                      />
                    </div>
                  </AdjustableLayerBox>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shadow-xl">
                      <Camera01Icon className="w-7 h-7 text-zinc-300" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">
                      Camera Only Presenter Mode
                    </span>
                    <span className="text-xs text-zinc-400 max-w-xs">
                      Clean presenter camera framing. Adjustable live before recording.
                    </span>
                    {onToggleCamera && (
                      <button
                        type="button"
                        onClick={() => onToggleCamera(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium text-xs transition-all border border-white/15 shadow-md cursor-pointer mt-1"
                      >
                        <Camera01Icon className="w-4 h-4 text-zinc-300" />
                        <span>Enable Camera Feed</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : layout === 'split' ? (
              /* 2. BESIDE PRESET (Camera sits beside the screen with visible background around both) */
              <div className="w-full h-full flex items-center justify-between p-4 sm:p-6 lg:p-8 gap-3 sm:gap-4 bg-transparent select-none">
                {/* 2A. LEFT: PRESENTER CAMERA CARD */}
                <div className="relative w-[26%] h-[84%] max-h-[90%] rounded-2xl overflow-hidden flex items-center justify-center bg-zinc-950 shadow-2xl shadow-black/60 ring-1 ring-white/20 shrink-0 isolate [transform:translateZ(0)]">
                  {webcamStream ? (
                    <video
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover rounded-2xl ${
                        pipConfig.mirror ? 'scale-x-[-1]' : ''
                      }`}
                      ref={(el) => {
                        if (el) {
                          if (webcamStream && el.srcObject !== webcamStream) {
                            el.srcObject = webcamStream;
                            el.play().catch(() => {});
                          } else if (!webcamStream && el.srcObject) {
                            el.srcObject = null;
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <Camera01Icon className="w-8 h-8 text-[#bef264] mb-2" />
                      <span className="text-xs font-bold text-zinc-200">Presenter Camera</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Camera feed</span>
                    </div>
                  )}
                </div>

                {/* 2B. RIGHT: CAPTURED SCREEN CARD */}
                <div className="relative flex-1 h-[84%] max-h-[90%] rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl shadow-black/60 ring-1 ring-white/20 isolate [transform:translateZ(0)] bg-zinc-900/40">
                  {screenStream ? (
                    <>
                      {/* LIVE SCREEN VIDEO (subtle preview running behind frosted glass shield) */}
                      <video
                        ref={(el) => {
                          screenVideoRef.current = el;
                          if (el && screenStream && el.srcObject !== screenStream) {
                            el.srcObject = screenStream;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          handleScreenMetadata(e.currentTarget);
                        }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl opacity-90"
                      />

                      {/* BLURRED FROSTED SHIELD WITH GREEN CHECKMARK */}
                      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-white/35 dark:bg-black/45 backdrop-blur-xl w-full h-full z-20 select-none rounded-2xl border border-white/20 dark:border-white/10">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-emerald-500/25">
                          <Tick01Icon className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white drop-shadow-xs">Ready to record</span>
                        <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-medium mt-0.5">Screen connected</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center text-center w-full h-full bg-zinc-950 rounded-2xl">
                      <ComputerIcon className="w-8 h-8 text-zinc-300 mb-2" />
                      <span className="text-xs font-semibold text-zinc-200">Screen</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Select screen to share</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 3. CLEAN DIRECT COMPOSITION: Freely adjustable Screen and Camera floating directly on backdrop */
              <div className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
                {/* 3A. ADJUSTABLE SCREEN LAYER */}
                <AdjustableLayerBox
                  id="adjustable-screen-layer"
                  isSelected={selectedLayer === 'screen'}
                  onSelect={() => setSelectedLayer('screen')}
                  rect={screenRect}
                  onChangeRect={setScreenRect}
                  containerRef={innerStageRef}
                  shape="rounded"
                  label="Screen"
                  lockAspectRatio={true}
                  disabled={isRecording}
                  onAlignChange={setAlignmentGuides}
                >
                  <div
                    className={`relative w-full h-full flex items-center justify-center bg-zinc-950/60 overflow-hidden group select-none transition-[border-color,box-shadow,background-color] duration-150 ${
                      layout === 'framed'
                        ? 'rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50'
                        : 'rounded-2xl'
                    }`}
                  >
                    {screenStream ? (
                      <>
                        {/* 1. LIVE SCREEN VIDEO (subtle preview running behind frosted glass shield) */}
                        <video
                          ref={(el) => {
                            screenVideoRef.current = el;
                            if (el && screenStream && el.srcObject !== screenStream) {
                              el.srcObject = screenStream;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          muted
                          playsInline
                          onLoadedMetadata={(e) => {
                            handleScreenMetadata(e.currentTarget);
                          }}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl opacity-90"
                        />

                        {/* BLURRED FROSTED SHIELD WITH GREEN CHECKMARK */}
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/35 dark:bg-black/45 backdrop-blur-xl transition-all pointer-events-auto select-none rounded-2xl border border-white/20 dark:border-white/10">
                          {/* Soft Green Checkmark */}
                          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-3">
                            <Tick01Icon className="w-8 h-8 stroke-[2.5]" />
                          </div>

                          {/* Subtle Reassuring Copy */}
                          <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight drop-shadow-xs">
                            Ready to record
                          </h3>

                          <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1 max-w-xs sm:max-w-sm leading-snug drop-shadow-xs">
                            Your screen is connected and all set.
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Screen Placeholder when not yet shared */
                      <div className="relative z-10 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shadow-xl">
                          <ComputerIcon className="w-6 h-6 text-zinc-300" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-semibold text-zinc-200 tracking-tight block">
                            Screen Setup
                          </span>
                          <span className="text-xs text-zinc-400 max-w-xs block leading-relaxed">
                            Share your window, browser tab, or entire display.
                          </span>
                        </div>
                        {onShareScreen && (
                          <button
                            type="button"
                            onClick={onShareScreen}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium text-xs transition-all border border-white/15 shadow-md cursor-pointer mt-1"
                          >
                            <ComputerIcon className="w-4 h-4 text-zinc-300" />
                            <span>Share Screen to Preview</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </AdjustableLayerBox>

                {/* 3B. ADJUSTABLE CAMERA LAYER (OVERLAY / CORNER-CAM / FRAMED) */}
                {(layout === 'overlay' || layout === 'corner-cam' || layout === 'framed' || webcamStream) && (
                  <AdjustableLayerBox
                    id="adjustable-camera-layer"
                    isSelected={selectedLayer === 'cam'}
                    onSelect={() => setSelectedLayer('cam')}
                    rect={camRect}
                    onChangeRect={handleCamRectChange}
                    containerRef={innerStageRef}
                    shape={
                      pipConfig.shape === 'circle'
                        ? 'circle'
                        : pipConfig.shape === 'rounded'
                        ? 'rounded'
                        : pipConfig.shape === 'square'
                        ? 'square'
                        : 'rectangle'
                    }
                    lockAspectRatio={true}
                    label="Camera"
                    disabled={isRecording}
                    onAlignChange={setAlignmentGuides}
                  >
                    <div
                      className="relative w-full h-full flex items-center justify-center bg-black/90 shadow-2xl overflow-hidden transition-[border-color,box-shadow] duration-150"
                      style={{
                        borderRadius:
                          pipConfig.shape === 'circle'
                            ? '9999px'
                            : pipConfig.shape === 'rounded'
                            ? '16px'
                            : pipConfig.shape === 'rectangle'
                            ? '12px'
                            : '0px',
                        borderWidth: `${pipConfig.borderWidth ?? 3}px`,
                        borderColor: pipConfig.borderColor || 'rgba(255, 255, 255, 0.2)',
                        borderStyle: (pipConfig.borderWidth ?? 3) > 0 ? 'solid' : 'none',
                      }}
                    >
                      {webcamStream ? (
                        <video
                          ref={(el) => {
                            webcamVideoRef.current = el;
                            if (el) {
                              if (webcamStream && el.srcObject !== webcamStream) {
                                el.srcObject = webcamStream;
                                el.play().catch(() => {});
                              } else if (!webcamStream && el.srcObject) {
                                el.srcObject = null;
                              }
                            }
                          }}
                          autoPlay
                          muted
                          playsInline
                          className={`w-full h-full object-cover ${
                            pipConfig.mirror ? 'scale-x-[-1]' : ''
                          }`}
                        />
                      ) : (
                        <div
                          onClick={() => onToggleCamera && onToggleCamera(true)}
                          className="flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-white/5 w-full h-full"
                        >
                          <Camera01Icon className="w-4 h-4 text-zinc-300 mb-1" />
                          <span className="text-[10px] font-medium text-zinc-300">Turn on Cam</span>
                        </div>
                      )}
                    </div>
                  </AdjustableLayerBox>
                )}
              </div>
            )}
          </div>

        {/* Floating Teleprompter Card */}
        {prompter.enabled && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-black/85 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl text-white animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/15">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Prompter
                </span>
                <span className="text-[9px] text-zinc-400 font-mono">{prompter.speed}x speed</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdatePrompter({ isScrolling: !prompter.isScrolling })}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors cursor-pointer"
                >
                  {prompter.isScrolling ? (
                    <PauseIcon className="w-3 h-3" />
                  ) : (
                    <PlayIcon className="w-3 h-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePrompter({ enabled: false })}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Cancel01Icon className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div
              ref={prompterScrollRef}
              className="max-h-20 overflow-y-auto leading-relaxed scroll-smooth px-1 text-center font-medium select-text"
              style={{ fontSize: `${prompter.fontSize}px` }}
            >
              {prompter.text || (
                <span className="text-zinc-500 italic">
                  No script entered. Click 'Prompter' in toolbar to add script.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Center Alignment Guidelines (Comes and sticks the frame in the middle when moving) */}
        {alignmentGuides.x && (
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-[#00e5ff] shadow-[0_0_10px_#00e5ff,0_0_3px_#00e5ff] pointer-events-none z-50 flex flex-col justify-between items-center py-2 animate-in fade-in duration-75"
          >
            <div className="w-1.5 h-1.5 rotate-45 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
          </div>
        )}
        {alignmentGuides.y && (
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#00e5ff] shadow-[0_0_10px_#00e5ff,0_0_3px_#00e5ff] pointer-events-none z-50 flex justify-between items-center px-2 animate-in fade-in duration-75"
          >
            <div className="w-1.5 h-1.5 rotate-45 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
          </div>
        )}
        {alignmentGuides.x && alignmentGuides.y && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#00e5ff] bg-[#00e5ff]/25 shadow-[0_0_14px_#00e5ff] pointer-events-none z-50 flex items-center justify-center animate-in zoom-in-75 duration-75">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
          </div>
        )}
      </div>

      {/* Direct Adjustment Helper Toolbar (When a layer is selected) */}
      {selectedLayer && !isRecording && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#181B20] text-slate-800 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-white/10 shadow-lg animate-in fade-in"
        >
          <button
            type="button"
            onClick={selectedLayer === 'screen' ? resetScreenTransform : resetCamTransform}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
            title="Reset position and size to default"
          >
            <RotateRight01Icon className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
            title="Deselect"
          >
            <Cancel01Icon className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
