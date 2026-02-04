
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PropertyListing, SearchFilters } from './types';
import { searchListings, SearchResult } from './services/geminiService';
import ListingCard from './components/ListingCard';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const LANG_STORAGE_KEY = 'hippohomes_lang';

export type AppLang = 'EN' | 'PH' | 'ZH';
export type ViewMode = 'list' | 'map';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const I18N = {
  EN: {
    brand: "HIPPO HOMES PH",
    motto: "ASSET SCAN PROTOCOL",
    tagline: "COMMAND THE MARKET",
    subtagline: "Direct-to-Owner Intelligence. Secure your Manila asset.",
    authorize: "Initiate Asset Scan",
    placeholder: "Scan Metro Manila...",
    scanning: "Scanning Assets...",
    filters: "SCAN FILTERS",
    reset: "Reset System",
    close: "Close Node",
    direct: "Source Protocol",
    allSources: "All Intel",
    allSourcesDesc: "Includes agents, brokers & portals.",
    directOnly: "Direct Only",
    directOnlyDesc: "Prioritizes owner-like posts.",
    verifiedOnly: "Verified Direct Owner Only",
    verifiedOnlyDesc: "Strictly owners via deep scan.",
    confirm: "Lock Parameters",
    restore: "Reconnect System",
    linkError: "System Link Error",
    quotaError: "System Overload: Limit Reached",
    quotaDesc: "High-frequency scanning reached the limit. A paid API key is required.",
    footerSystem: "HIPPO HOMES PH NETWORK",
    insight: "AI INSIGHT",
    noResults: "Zero assets found.",
    voiceLink: "Voice Briefing",
    liveStrategist: "Live Strategist",
    liveConnecting: "Establishing Link...",
    liveActive: "Link Active: Voice Comm",
    liveEnd: "Disconnect Strategist",
    priceVerified: "Price Verified Protocol: Active",
    identity: "Owner ID",
    openSource: "View Deep Link",
    restoreLink: "Restore Node",
    collapseRecall: "Close Recall",
    recentRecall: "ASSET RECALL",
    recentEmpty: "Recall Buffer Empty",
    copyAnalysis: "Extract Intelligence",
    copied: "Copied",
    abort: "Stop Briefing",
    identityLabel: "Direct Contact",
    talkHint: "Talk to Strategist",
    noMicError: "MICROPHONE HARDWARE NOT DETECTED.",
    viewList: "List Protocol",
    viewMap: "Map Visualization"
  },
  PH: {
    brand: "HIPPO HOMES PH",
    motto: "ASSET SCAN PROTOCOL",
    tagline: "KONTROLIN ANG MERKADO",
    subtagline: "Direct-to-Owner Intelligence. Kunin ang iyong Manila asset.",
    authorize: "Simulan ang Scan",
    placeholder: "I-scan ang Metro Manila...",
    scanning: "Ini-scan ang Assets...",
    filters: "MGA FILTER",
    reset: "I-reset",
    close: "Isara",
    direct: "Source Protocol",
    allSources: "Lahat",
    allSourcesDesc: "Kasama ang agents at brokers.",
    directOnly: "Direct Lang",
    directOnlyDesc: "Inuuna ang mga posibleng owners.",
    verifiedOnly: "Verified Direct Owner Lang",
    verifiedOnlyDesc: "Tanging direct owners lang.",
    confirm: "I-lock ang Parameters",
    restore: "Ibalik ang Koneksyon",
    linkError: "Error sa System Link",
    quotaError: "Overload: Naabot ang Limit",
    quotaDesc: "Naabot na ang scanning limit. Kailangan ng paid API key.",
    footerSystem: "HIPPO HOMES PH NETWORK",
    insight: "AI INSIGHT",
    noResults: "Walang nahanap.",
    voiceLink: "Voice Briefing",
    liveStrategist: "Live Strategist",
    liveConnecting: "Kumokonekta...",
    liveActive: "Konektado: Voice Comm",
    liveEnd: "I-disconnect",
    priceVerified: "Price Verified: Aktibo",
    identity: "ID ng Owner",
    openSource: "Tingnan ang Link",
    restoreLink: "Ibalik ang Node",
    collapseRecall: "Isara",
    recentRecall: "ASSET RECALL",
    recentEmpty: "Walang Laman",
    copyAnalysis: "Kopyahin",
    copied: "Nakopya",
    abort: "Itigil",
    identityLabel: "Kontakin ang Owner",
    talkHint: "Kausapin ang Strategist",
    noMicError: "HINDI NADETECT ANG MIKROPONO.",
    viewList: "Listahan",
    viewMap: "Mapa"
  },
  ZH: {
    brand: "HIPPO HOMES PH",
    motto: "资产扫描协议",
    tagline: "掌控市场",
    subtagline: "直接业主情报。锁定马尼拉优质资产。",
    authorize: "启动资产扫描",
    placeholder: "扫描马尼拉大都会...",
    scanning: "正在扫描资产...",
    filters: "扫描过滤器",
    reset: "重置系统",
    close: "关闭节点",
    direct: "来源协议",
    allSources: "全部情报",
    allSourcesDesc: "包括代理商、经纪人和门户网站。",
    directOnly: "仅限直接",
    directOnlyDesc: "优先考虑类似业主的帖子。",
    verifiedOnly: "仅限验证的直接业主",
    verifiedOnlyDesc: "严格通过深度扫描寻找业主。",
    confirm: "锁定参数",
    restore: "重新连接系统",
    linkError: "系统链接错误",
    quotaError: "系统过载：达到限制",
    quotaDesc: "高频扫描已达上限。需要付费 API 密钥。",
    footerSystem: "HIPPO HOMES PH 网络",
    insight: "AI 洞察",
    noResults: "未发现资产。",
    voiceLink: "语音简报",
    liveStrategist: "在线战略家",
    liveConnecting: "建立连接...",
    liveActive: "链路激活：语音通话",
    liveEnd: "断开战略家",
    priceVerified: "价格验证协议：激活",
    identity: "业主 ID",
    openSource: "查看链接",
    restoreLink: "恢复节点",
    collapseRecall: "关闭召回",
    recentRecall: "资产召回",
    recentEmpty: "缓冲区为空",
    copyAnalysis: "提取情报",
    copied: "已复制",
    abort: "停止简报",
    identityLabel: "直接联系",
    talkHint: "与战略家对话",
    noMicError: "未检测到麦克风。",
    viewList: "列表",
    viewMap: "地图"
  }
};

const DEFAULT_FILTERS: SearchFilters = {
  query: 'BGC Condo 1BR',
  location: 'Metro Manila',
  propertyType: 'Condo',
  directSourceMode: 'direct',
};

const HippoLogo = ({ className = "", animated = false }: { className?: string, animated?: boolean }) => (
  <div className={`${className} flex items-center justify-center relative perspective-2000`}>
    <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="logoGlow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path 
        d="M200 20L30 110V260H370V110L200 20Z" 
        stroke="#e31e24" 
        strokeWidth="15" 
        fill="white" 
        strokeLinejoin="round"
        className={animated ? "animate-pulse" : ""}
      />
      <path 
        d="M200 40L60 120V240H340V120L200 40Z" 
        stroke="black" 
        strokeWidth="4" 
        fill="none" 
      />
      <text 
        x="50%" 
        y="65%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill="#e31e24" 
        style={{ fontSize: '120px', fontWeight: 900, fontStyle: 'italic', fontFamily: 'Arial Black' }}
        filter="url(#logoGlow)"
      >
        HH
      </text>
    </svg>
  </div>
);

const MapView: React.FC<{ listings: PropertyListing[], lang: AppLang }> = ({ listings, lang }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current && (window as any).L) {
      const L = (window as any).L;
      leafletMapRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([14.5833, 121.0], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(leafletMapRef.current);
    }

    if (leafletMapRef.current && (window as any).L) {
      const L = (window as any).L;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds = L.latLngBounds([]);

      listings.forEach(listing => {
        if (listing.lat && listing.lng) {
          const markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="relative w-10 h-10 flex items-center justify-center">
                <div class="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
                <div class="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center shadow-2xl relative z-10">
                  <span class="text-[8px] font-black text-white italic">HH</span>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const marker = L.marker([listing.lat, listing.lng], { icon: markerIcon })
            .addTo(leafletMapRef.current)
            .bindPopup(`
              <div class="p-2 min-w-[180px]">
                <h4 class="text-sm font-black mb-1 line-clamp-1">${listing.title}</h4>
                <p class="text-red-500 font-black text-base mb-2 italic">${listing.price}</p>
                <a href="${listing.sourceUrl}" target="_blank" class="block w-full text-center py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                  View Asset
                </a>
              </div>
            `);
          
          markersRef.current.push(marker);
          bounds.extend([listing.lat, listing.lng]);
        }
      });

      if (listings.length > 0 && bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [listings]);

  return (
    <div className="w-full h-[65vh] sm:h-[70vh] rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl relative glass-edge">
      <div ref={mapRef} className="w-full h-full z-10" />
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="glass-3d px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">MAP PROTOCOL</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<AppLang>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved === 'PH' || saved === 'ZH' || saved === 'EN') ? saved as AppLang : 'EN';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showSplash, setShowSplash] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const liveAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  const t = I18N[lang];

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    if (!outputAudioCtxRef.current) outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  }, []);

  const playClick = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.05);
  }, [initAudio]);

  const toggleLang = useCallback(() => {
    const langs: AppLang[] = ['EN', 'PH', 'ZH'];
    const next = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
    playClick();
  }, [lang, playClick]);

  const stopLiveSession = useCallback(() => {
    if (liveSessionRef.current) { try { liveSessionRef.current.close?.(); } catch(e) {} liveSessionRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    liveAudioSources.current.forEach(s => { try { s.stop(); } catch(e) {} });
    liveAudioSources.current.clear();
    setIsLiveMode(false);
    setIsLiveConnecting(false);
  }, []);

  const startLiveSession = useCallback(async () => {
    initAudio();
    setIsLiveConnecting(true);
    playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are the HippoHomes PH Asset Strategist. Language: ${lang}. Context: ${filters.query}.`,
        },
        callbacks: {
          onopen: () => {
            setIsLiveConnecting(false);
            setIsLiveMode(true);
            if (!audioCtxRef.current) return;
            const source = audioCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session && session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtxRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.onended = () => liveAudioSources.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              liveAudioSources.current.add(source);
            }
          },
          onclose: () => stopLiveSession(),
          onerror: () => stopLiveSession()
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) { stopLiveSession(); }
  }, [filters.query, initAudio, lang, playClick, stopLiveSession]);

  const handleSpeak = async (textToSpeak: string) => {
    if (isVoicePlaying) { activeSourceRef.current?.stop(); setIsVoicePlaying(false); return; }
    initAudio(); setIsVoiceLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && outputAudioCtxRef.current) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtxRef.current, 24000, 1);
        const source = outputAudioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioCtxRef.current.destination);
        source.onended = () => setIsVoicePlaying(false);
        activeSourceRef.current = source;
        source.start(); setIsVoicePlaying(true);
      }
    } finally { setIsVoiceLoading(false); }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    initAudio(); setIsLoading(true); setError(null);
    try {
      const result: SearchResult = await searchListings(filters);
      setListings(result.listings);
      setAiAnalysis(result.aiAnalysis);
      if (result.listings.length === 0) setError(t.noResults);
    } catch (err: any) { setError(`Failure: ${err.message || 'Error'}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => { clearTimeout(timer); stopLiveSession(); };
  }, [stopLiveSession]);

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden selection:bg-red-600 selection:text-white">
      
      {/* Splash Screen */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000 backdrop-blur-3xl bg-black ${!showSplash ? 'opacity-0 scale-150 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-center px-6">
          <HippoLogo className="w-48 h-48 mx-auto animate-float" />
          <h2 className="mt-8 text-3xl font-black text-white tracking-widest uppercase elegant-serif italic">HippoHomes<span className="text-red-600">PH</span></h2>
          <p className="mt-4 text-red-500/40 text-[8px] font-bold uppercase tracking-[0.6em]">{t.motto}</p>
        </div>
      </div>

      {/* Top Brand Bar - Mobile Optimized */}
      <header className={`fixed top-0 left-0 right-0 z-40 px-4 pt-4 transition-all duration-1000 ${showSplash ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-7xl mx-auto glass-3d rounded-3xl px-5 py-3 flex items-center justify-between border-white/5">
          <div className="flex items-center gap-2" onClick={() => window.location.reload()}>
            <HippoLogo className="w-8 h-8" />
            <h1 className="text-sm font-black text-white elegant-serif tracking-tighter">HIPPO<span className="text-red-600">HOMES</span></h1>
          </div>
          <button onClick={toggleLang} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-red-500 uppercase tracking-widest">{lang}</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto px-5 pt-24 transition-all duration-1000 delay-500 ${showSplash ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
        
        {/* Search Bar Block */}
        <div className="mb-8">
           <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text"
                placeholder={t.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:border-red-600/50 outline-none transition-all placeholder:opacity-30 font-medium"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              />
              <button type="submit" className="absolute right-2 top-2 p-2.5 bg-red-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
           </form>
        </div>

        {/* Intelligence Alert */}
        {aiAnalysis && !isLoading && (
          <div className="mb-8 glass-3d rounded-[2.5rem] p-6 border-l-4 border-red-600 animate-in slide-in-from-top-2 duration-500 relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_#e31e24]"></div>
                 <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest">{t.insight}</h4>
               </div>
               <button onClick={() => handleSpeak(aiAnalysis)} className={`p-2 rounded-xl transition-all ${isVoicePlaying ? 'bg-red-600 text-white' : 'bg-red-600/10 text-red-500'}`}>
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" /></svg>
               </button>
             </div>
             <p className="text-white/80 text-sm font-medium leading-relaxed italic elegant-serif">{aiAnalysis}</p>
          </div>
        )}

        {/* Results Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-20 h-20 border-t-2 border-red-600 rounded-full animate-spin"></div>
               <p className="mt-8 text-red-500 font-black uppercase tracking-widest text-[9px] animate-pulse">{t.scanning}</p>
            </div>
          ) : listings.length > 0 ? (
            viewMode === 'list' ? (
              <div className="grid grid-cols-1 gap-8">
                 {listings.map(l => <ListingCard key={l.id} listing={l} onSpeak={handleSpeak} lang={lang} />)}
              </div>
            ) : (
              <MapView listings={listings} lang={lang} />
            )
          ) : (
            <div className="text-center py-16 opacity-40">
               <HippoLogo className="w-40 h-40 mx-auto mb-8 grayscale opacity-20" />
               <p className="text-white text-xs font-black uppercase tracking-[0.5em]">{t.subtagline}</p>
            </div>
          )}
        </div>
      </main>

      {/* Strategic Bottom Dock - Mobile Master Controls */}
      {!showSplash && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md">
          <div className="glass-3d rounded-[2.5rem] p-2 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-white/10">
            
            <button 
              onClick={() => { playClick(); setViewMode('list'); }} 
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${viewMode === 'list' ? 'text-red-500 dock-active' : 'text-white/40'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">List</span>
            </button>

            <button 
              onClick={() => { playClick(); setViewMode('map'); }} 
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${viewMode === 'map' ? 'text-red-500 dock-active' : 'text-white/40'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">Map</span>
            </button>

            {/* Central Master Action */}
            <button 
              onClick={startLiveSession}
              className={`relative -top-6 w-16 h-16 rounded-full flex items-center justify-center transition-all ${isLiveMode ? 'bg-red-600 scale-110 shadow-[0_0_30px_#e31e24]' : 'bg-red-600 shadow-[0_10px_30px_rgba(227,30,36,0.6)]'}`}
            >
              {isLiveConnecting ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isLiveMode ? (
                <div className="flex gap-1 items-center">
                   <div className="w-1.5 h-6 bg-white rounded-full animate-pulse"></div>
                   <div className="w-1.5 h-8 bg-white rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                   <div className="w-1.5 h-6 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                </div>
              ) : (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              )}
              {!isLiveMode && !isLiveConnecting && <div className="absolute inset-0 bg-red-600 rounded-full pulse-ring -z-10"></div>}
            </button>

            <button 
              onClick={() => { playClick(); setIsFilterOpen(true); }} 
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${isFilterOpen ? 'text-red-500' : 'text-white/40'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4v2m0-6V4" /></svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">Filter</span>
            </button>

            <button 
              onClick={() => { playClick(); handleSearch(); }} 
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-white/40 active:text-red-500 transition-all`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">Scan</span>
            </button>
          </div>
        </nav>
      )}

      {/* Filter Sheet Overlay */}
      <div className={`fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute bottom-0 left-0 right-0 glass-3d rounded-t-[3rem] p-8 border-t border-red-600/30 transition-transform duration-500 transform ${isFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-md mx-auto">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-lg font-black text-white tracking-widest uppercase elegant-serif italic">{t.filters}</h3>
               <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 rounded-full text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                   <label className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-4">Source Intelligence</label>
                   <div className="grid grid-cols-1 gap-3">
                      {['all', 'direct', 'verified'].map(mode => (
                        <button key={mode} onClick={() => setFilters({...filters, directSourceMode: mode as any})} className={`w-full p-4 rounded-2xl border text-left transition-all ${filters.directSourceMode === mode ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}>
                           <span className="text-xs font-black uppercase tracking-widest block">{mode === 'all' ? t.allSources : mode === 'direct' ? t.directOnly : t.verifiedOnly}</span>
                        </button>
                      ))}
                   </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-4">Sector Selection</label>
                  <select 
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest outline-none" 
                    value={filters.location} 
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  >
                    <option value="Metro Manila">Metro Manila</option>
                    <option value="Makati">Makati</option>
                    <option value="BGC Taguig">BGC Taguig</option>
                    <option value="Pasay Bay Area">Pasay</option>
                  </select>
                </div>
                <button onClick={() => { setIsFilterOpen(false); handleSearch(); }} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.6em] rounded-2xl shadow-xl active:scale-95 transition-all text-[10px]">{t.confirm}</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
