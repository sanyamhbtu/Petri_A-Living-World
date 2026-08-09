"use client"

import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Leaf, ScanLine, Sprout, Wind, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import Vortex from '@/components/originkit/ui/tornado'
import DottedBackground from '@/components/originkit/ui/dotmatrix'

const notes = [
  { id: '01', label: 'Emergence', title: 'A world with memory', body: 'Every movement, meal, birth, and death becomes part of the field record.', accent: 'Watch the small things.' },
  { id: '02', label: 'Adaptation', title: 'Nothing is decorative', body: 'Resources run out. Boundaries matter. Small decisions compound across generations.', accent: 'Conditions shape behavior.' },
  { id: '03', label: 'Intervention', title: 'You are the disturbance', body: 'Place food, watch the response, then leave the system to make its own next move.', accent: 'The field answers back.' },
]

export function LandingPage() {
  const [activeNote, setActiveNote] = useState(0)
  const [mounted, setMounted] = useState(false)
  const note = notes[activeNote]

  useEffect(() => setMounted(true), [])

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-foreground relative selection:bg-emerald-500/30">
      {mounted && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
          <DottedBackground 
            bgColor="#020617"
            colors={["#10b981", "#059669", "#047857"]} 
            cellSize={20}
            frequency={1.5}
            speed={5}
          />
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10">
        <header className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 sm:px-8 lg:px-12 backdrop-blur-xl border-b border-white/10 bg-black/40 sticky top-0 z-50 shadow-2xl shadow-emerald-900/20">
          <Link href="/" className="flex items-center gap-4 group" aria-label="Petri home">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-900 text-black shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <Leaf aria-hidden="true" size={24} />
            </span>
            <span className="flex flex-col">
              <span className="font-serif text-2xl font-bold leading-none tracking-tight text-white group-hover:text-emerald-400 transition-colors">petri</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-500/80 mt-1">a living world</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="hidden sm:flex items-center gap-2 bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Activity size={14} className="animate-pulse text-emerald-400" /> Live Data
            </span>
            <Link className="transition-all hover:text-emerald-400 hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-2 group bg-white/5 px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/10" href="/playground">
              Enter playground <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-[1400px] px-6 pb-32 pt-32 sm:px-8 sm:pt-40 lg:px-12 lg:pb-48 relative min-h-[90vh] flex flex-col justify-center">
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen opacity-60"></div>
          
          <div className="max-w-4xl relative z-10">
            <div className="mb-12 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-emerald-400 bg-emerald-950/60 px-5 py-2.5 rounded-full border border-emerald-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Live ecosystem / online
            </div>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-white mb-8">
              A world that <br/><em className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 not-italic inline-block hover:scale-[1.02] transition-transform duration-500 pb-2">keeps</em> going.
            </h1>
            <p className="max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300 font-light mix-blend-plus-lighter">
              Petri is a living-world simulation where tiny creatures move, feed, reproduce, and disappear inside an evolving field. Once started, it never sleeps.
            </p>
            <div className="mt-16 flex flex-wrap items-center gap-8">
              <Link href="/playground" className="group relative inline-flex items-center gap-4 rounded-full bg-emerald-500 px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:scale-105 hover:bg-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                Observe the world <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-1.5 group-hover:-translate-y-1.5" size={20} />
              </Link>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Wind size={16} /> No account required
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto flex justify-center pb-24 opacity-60">
          <div className="animate-bounce p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <ArrowDown size={24} className="text-emerald-400" />
          </div>
        </div>

        {/* Feature Sections */}
        <section className="relative border-y border-white/10 bg-black/60 backdrop-blur-2xl">
          <div className="mx-auto grid max-w-[1400px] gap-16 px-6 py-32 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 relative z-10">
            <div className="sticky top-40 h-fit">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] mb-6 flex items-center gap-3">
                <ScanLine size={16} /> The premise
              </p>
              <h2 className="text-4xl sm:text-5xl font-serif leading-[1.1] tracking-tight text-white mb-8">Set a condition.<br/>Watch a life form.</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">Every interaction ripples through the ecology. What happens when food is scarce? What happens when it's abundant?</p>
            </div>
            <div className="grid gap-6 sm:gap-8">
              {notes.map((item, index) => (
                <button type="button" key={item.id} onClick={() => setActiveNote(index)} className={`text-left border border-white/5 p-8 transition-all duration-500 rounded-3xl group relative overflow-hidden ${index === activeNote ? 'bg-emerald-950/40 border-emerald-500/30 scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 ${index === activeNote ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                  <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:items-start justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold tracking-[0.2em] text-emerald-400 block mb-4">{item.id} — {item.label}</span>
                      <h3 className="font-serif text-2xl text-white mb-3">{item.title}</h3>
                      <p className="text-base leading-relaxed text-slate-400">{item.body}</p>
                    </div>
                    {index === activeNote && (
                      <div className="hidden sm:flex size-12 rounded-full bg-emerald-500/20 items-center justify-center border border-emerald-500/30 shrink-0">
                        <ArrowUpRight className="text-emerald-400" size={20} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto px-6 py-32 sm:px-8 lg:px-12 max-w-[1400px]">
          <div className="relative rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden p-10 sm:p-20 shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-emerald-900/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/50 px-5 py-2.5 rounded-full border border-emerald-500/20 mb-10">
                  <ScanLine size={16} /> Field note {note.id}
                </div>
                <p className="text-3xl sm:text-4xl font-serif leading-[1.3] text-white mb-8">{note.accent}</p>
                <p className="text-lg text-slate-400 leading-relaxed mb-12">{note.body} Open a live world and let the ecology answer.</p>
                <Link href="/playground" className="inline-flex items-center gap-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-emerald-400 transition-all hover:text-emerald-300 group">
                  <span className="border-b-2 border-emerald-500/30 pb-1 group-hover:border-emerald-400 transition-colors">Open the observation deck</span>
                  <span className="p-3 bg-emerald-950 rounded-full group-hover:bg-emerald-900 group-hover:scale-110 transition-all border border-emerald-500/20"><ArrowUpRight size={18} /></span>
                </Link>
              </div>
              <div className="relative h-[400px] rounded-3xl border border-white/10 bg-black/60 overflow-hidden flex items-center justify-center group shadow-inner">
                {mounted && (
                  <div className="absolute inset-0 opacity-60 mix-blend-screen">
                    <Vortex 
                      background="transparent" 
                      comets={true} 
                      repel={true} 
                      zoom={90}
                      twist={5}
                      speed={15}
                      lineOptions={{ color: "#34d399", count: 100, glow: 20 }} 
                      dotOptions={{ count: 3000, size: 25, color: "#10b981", glow: 20, flicker: 15 }} 
                    />
                  </div>
                )}
                <div className="relative z-10 size-40 rounded-full bg-black/80 border border-emerald-500/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_80px_rgba(16,185,129,0.4)] transition-shadow duration-700">
                  <Sprout className="text-emerald-400 animate-pulse" size={60} strokeWidth={1} />
                  <div className="absolute inset-0 border border-emerald-500/40 rounded-full animate-ping opacity-30"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-12 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span className="flex items-center gap-3 text-emerald-500/80"><Leaf size={16} className="text-emerald-500"/> Petri // a living world</span>
            <span className="flex items-center gap-3">Built for slow observation <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div></span>
          </div>
        </footer>
      </div>
    </main>
  )
}
