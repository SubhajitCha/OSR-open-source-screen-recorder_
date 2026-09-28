export type LanguageCode =
  | 'en'
  | 'zh-CN'
  | 'zh-TW'
  | 'cs'
  | 'fr'
  | 'de'
  | 'es'
  | 'it'
  | 'ja'
  | 'ko'
  | 'nl'
  | 'ru'
  | 'pt'
  | 'da'
  | 'no'
  | 'fi'
  | 'sv'
  | 'th'
  | 'ms'
  | 'tr';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  hreflang: string;
  flag?: string;
  dir?: 'ltr' | 'rtl';
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SeoStepItem {
  step: string;
  title: string;
  desc: string;
}

export interface TranslationDictionary {
  // Metadata & SEO
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };

  // Common UI
  common: {
    loading: string;
    save: string;
    cancel: string;
    close: string;
    delete: string;
    download: string;
    edit: string;
    record: string;
    stop: string;
    pause: string;
    resume: string;
    settings: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
    home: string;
    back: string;
    copy: string;
    copied: string;
    export: string;
    reset: string;
    ready: string;
    recording: string;
    paused: string;
    processing: string;
    freeBadge: string;
    clientSideBadge: string;
  };

  // Navbar
  nav: {
    studio: string;
    library: string;
    docs: string;
    services: string;
    settings: string;
    exportVideo: string;
    startRecording: string;
    stopRecording: string;
    recordingsCount: string;
    switchTheme: string;
    selectLanguage: string;
  };

  // Recording Mode Selection (Hero)
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    modes: {
      screenCam: {
        title: string;
        desc: string;
      };
      screen: {
        title: string;
        desc: string;
      };
      camOnly: {
        title: string;
        desc: string;
      };
      audioOnly: {
        title: string;
        desc: string;
      };
    };
  };

  // In-Recording & Toolbar Controls
  recorder: {
    startRecordBtn: string;
    stopRecordBtn: string;
    pauseRecordBtn: string;
    resumeRecordBtn: string;
    micOn: string;
    micOff: string;
    camOn: string;
    camOff: string;
    systemAudioOn: string;
    systemAudioOff: string;
    pipShapeCircle: string;
    pipShapeSquare: string;
    pipShapeRounded: string;
    canvasBackground: string;
    aspectRatio: string;
    teleprompter: string;
    drawingTools: string;
    recordingDuration: string;
    requestPermission: string;
    addCam?: string;
    hideCam?: string;
    addCamera?: string;
    hideCamera?: string;
    muteMic?: string;
    unmuteMic?: string;
    shareScreen?: string;
    stopSharing?: string;
    layouts?: string;
    background?: string;
    settings?: string;
  };

  // Recording Canvas & Setup Overlays
  canvas?: {
    readyToRecord: string;
    readyToRecordDesc: string;
    screenSetup: string;
    screenSetupDesc: string;
    shareScreenBtn: string;
    micOnlyTitle: string;
    micOnlyDesc: string;
    camOnlyTitle: string;
    screenConnected?: string;
    screenLabel?: string;
    selectScreenToShare?: string;
  };

  // Library Page
  library?: {
    title: string;
    subtitle: string;
    storageUsage: string;
    emptyTitle: string;
    emptyDesc: string;
    startFirstRecording: string;
    recordingsTag: string;
    editInStudio: string;
    deleteModalTitle: string;
    deleteModalDesc: string;
    clearAllModalTitle: string;
    clearAllModalDesc: string;
    confirmDelete: string;
    deleting: string;
    noTags: string;
    loadingRecordings: string;
  };

  // Video Editor
  editor?: {
    studioTools: string;
    inspector: string;
    stageLayout: string;
    canvasBackground: string;
    videoTrim: string;
    zoomEffects: string;
    timeline: string;
    timelineHelp: string;
    activeVideo: string;
    zoom: string;
    exportVideoBtn: string;
    minimizeTools: string;
    restoreTools: string;
    aspectRatio: string;
    backgroundStyle: string;
    paddingMargin: string;
    roundedCorners: string;
    dropShadow: string;
    autoDetectZooms: string;
    addZoomSegment: string;
    zoomLevel: string;
    duration: string;
    play: string;
    pause: string;
  };

  // Review & Export Screen
  review: {
    title: string;
    subtitle: string;
    playbackPreview: string;
    downloadMp4: string;
    downloadWebm: string;
    trimVideo: string;
    openInEditor: string;
    recordAgain: string;
    saveToLibrary: string;
    savedSuccess: string;
    duration: string;
    fileSize: string;
    resolution: string;
  };

  // Settings Modal
  settingsModal: {
    title: string;
    subtitle: string;
    generalTab: string;
    videoTab: string;
    audioTab: string;
    languageTab: string;
    selectLanguage: string;
    resolution: string;
    frameRate: string;
    videoCodec: string;
    audioQuality: string;
    noiseSuppression: string;
    echoCancellation: string;
    autoGainControl: string;
    saveChanges: string;
  };

  // SEO Content Section (Comprehensive On-Page Guide)
  seoSection: {
    badge: string;
    mainHeading: string;
    introParagraph: string;

    section1Title: string;
    section1P1: string;
    section1P2: string;

    section2Title: string;
    section2Intro: string;
    steps: SeoStepItem[];

    section3Title: string;
    section3P1: string;
    section3P2: string;

    section4Title: string;
    section4Intro: string;
    privacyBullet1Title: string;
    privacyBullet1Desc: string;
    privacyBullet2Title: string;
    privacyBullet2Desc: string;
    privacyBullet3Title: string;
    privacyBullet3Desc: string;
    privacyBullet4Title: string;
    privacyBullet4Desc: string;

    faqTitle: string;
    faqs: FaqItem[];
  };

  // Footer
  footer: {
    brandTagline: string;
    clientSideNotice: string;
    recordingModesHeading: string;
    modes: {
      screenCam: string;
      desktopWindow: string;
      tabShare: string;
      camOnly: string;
      audioOnly: string;
    };
    studioToolsHeading: string;
    tools: {
      audioMixing: string;
      mp4Export: string;
      trimmer: string;
      canvasRadii: string;
      architecture: string;
      diagnostics: string;
    };
    companyLegalHeading: string;
    links: {
      about: string;
      privacy: string;
      terms: string;
      contact: string;
      library: string;
      error404: string;
      error500: string;
    };
    searchTermsHeading: string;
    searchTerms: string[];
    copyright: string;
    chooseLanguage: string;
  };
}
