
import React from 'react';
import { PropertyListing } from '../types';
import { AppLang, I18N } from '../App';

interface ListingCardProps {
  listing: PropertyListing;
  onSpeak?: (text: string) => void;
  onView?: (listing: PropertyListing) => void;
  lang?: AppLang;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onSpeak, onView, lang = 'EN' }) => {
  const t = I18N[lang];
  const isSocial = listing.source.toLowerCase().includes('facebook') || 
                   listing.source.toLowerCase().includes('marketplace') || 
                   listing.source.toLowerCase().includes('profile');

  const roleStyles = {
    'Owner': 'bg-red-600 text-white border-red-400/50',
    'Direct Contact': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    'Agent': 'bg-slate-700/50 text-slate-300 border-slate-600',
    'Unknown': 'bg-slate-800 text-slate-500 border-slate-700'
  };

  return (
    <div className="group h-full">
      <div className={`glass-3d rounded-[2.5rem] p-6 md:p-8 transition-all duration-500 border ${listing.isDirectOwner ? 'border-red-600/80 bg-red-600/5 shadow-[0_0_30px_rgba(227,30,36,0.2)]' : 'border-white/10'} glass-edge`}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          
          {/* Column 1: Core Asset Intelligence */}
          <div className="flex flex-col h-full">
            {/* Top Meta & Role */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] ${isSocial ? 'bg-red-600/20 text-red-500' : 'bg-red-500/10 text-red-400'} border border-white/5 w-fit`}>
                  {listing.source}
                </span>
                {onSpeak && (
                    <button 
                      onClick={() => onSpeak(`${listing.title}. ${listing.price}. ${listing.location}.`)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-red-500 active:scale-90 hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" /></svg>
                    </button>
                )}
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-lg ${roleStyles[listing.contactRole || 'Unknown']}`}>
                 {listing.contactRole === 'Owner' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                 {listing.contactRole}
              </div>
            </div>

            {/* Headline & Valuation */}
            <div className="mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight elegant-serif italic">
                {listing.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-red-500 tracking-tighter elegant-serif italic drop-shadow-[0_4px_12px_rgba(227,30,36,0.3)]">
                  {listing.price}
                </span>
              </div>
            </div>

            {/* Desktop-only CTA placement in first column for strong visual balance */}
            <div className="hidden md:block mt-auto">
               <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onView?.(listing)}
                className="w-full py-5 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.5em] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-red-500"
              >
                {t.openSource}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Deep Details & Contact Protocol */}
          <div className="flex flex-col space-y-5 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            {/* Geolocation Tag */}
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              <span className="tracking-[0.1em] uppercase leading-tight">{listing.location}</span>
            </div>

            {/* Description Fragment */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600/30 rounded-full"></div>
              <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed italic opacity-90 pl-5">
                {listing.description}
              </p>
            </div>

            {/* Verification Insight (Intelligence Node) */}
            {listing.verificationNote && (
              <div className="bg-red-600/5 p-4 rounded-2xl border border-red-600/10 text-[9px] font-medium text-red-400/80 italic leading-relaxed">
                 <span className="font-black uppercase tracking-widest block mb-1 text-red-500">Intelligence Node:</span>
                 {listing.verificationNote}
              </div>
            )}

            {/* Contact Matrix */}
            {(listing.contactName || listing.contactNumber) && (
              <div className={`p-5 rounded-3xl border backdrop-blur-md transition-colors ${listing.contactRole === 'Owner' ? 'bg-red-600/10 border-red-500/20 shadow-[0_4px_20px_rgba(227,30,36,0.1)]' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                  <div className="text-[9px] font-black text-red-500 uppercase tracking-widest">{t.identityLabel}</div>
                  {listing.contactRole === 'Owner' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#e31e24] animate-pulse"></div>}
                </div>
                <div className="space-y-1">
                  {listing.contactName && <div className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{listing.contactName}</div>}
                  <div className="text-sm font-black text-white tracking-[0.1em]">{listing.contactNumber || "Contact Via Source"}</div>
                </div>
              </div>
            )}

            {/* Mobile-only CTA placement at bottom for thumb-flow */}
            <div className="md:hidden pt-2">
               <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onView?.(listing)}
                className="w-full py-5 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.5em] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
              >
                {t.openSource}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ListingCard;
