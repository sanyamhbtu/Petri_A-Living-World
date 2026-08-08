"use client"

import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Leaf, ScanLine, Sprout, Wind } from 'lucide-react'
import { useState } from 'react'
import Vortex from '@/components/originkit/ui/tornado'

const notes = [
  { id: '01', label: 'Emergence', title: 'A world with memory', body: 'Every movement, meal, birth, and death becomes part of the field record.', accent: 'Watch the small things.' },
  { id: '02', label: 'Adaptation', title: 'Nothing is decorative', body: 'Resources run out. Boundaries matter. Small decisions compound across generations.', accent: 'Conditions shape behavior.' },
  { id: '03', label: 'Intervention', title: 'You are the disturbance', body: 'Place food, watch the response, then leave the system to make its own next move.', accent: 'The field answers back.' },
]

export function LandingPage() {
  const [activeNote, setActiveNote] = useState(0)
  const note = notes[activeNote]

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen overflow-hidden h-[120vh]">
          <Vortex 
            background="transparent" 
            comets={true} 
            repel={true} 
            zoom={85}
            twist={4}
            lineOptions={{ color: "#38bdf8", count: 200, glow: 15 }} 
            dotOptions={{ count: 8000, size: 20, color: "#10b981", glow: 15, flicker: 10 }} 
          />
      </div>

      <div className="relative z-10 backdrop-blur-[1px]">
        <header className="landing-header mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 backdrop-blur-md border-b border-white/5 bg-background/20 sticky top-0 z-50 rounded-b-3xl">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Petri home">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform"><Leaf aria-hidden="true" size={20} /></span>
            <span className="flex flex-col"><span className="font-serif text-lg font-medium leading-none tracking-tight">petri</span><span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">a living world</span></span>
          </Link>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:gap-8"><span className="hidden sm:inline bg-secondary/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-secondary-foreground shadow-[0_0_15px_rgba(255,255,255,0.05)]">Field study // 01</span><Link className="transition-all hover:text-primary hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center gap-2" href="/playground">Enter playground <ArrowUpRight size={14} /></Link></div>
        </header>

        <section className="landing-hero mx-auto grid max-w-[1400px] px-5 pb-20 pt-24 sm:px-8 sm:pt-32 lg:px-12 lg:pb-40 relative">
          <div className="max-w-3xl relative z-10 mix-blend-normal">
            <div className="mb-10 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]"><span className="size-2 rounded-full bg-primary animate-pulse" />Live ecosystem / online</div>
            <h1 className="font-serif text-3xl leading-[1.1] tracking-[-0.04em] text-pretty text-transparent bg-clip-text bg-gradient-to-br from-white via-secondary to-muted">
              A world that <em className="text-primary not-italic inline-block hover:scale-105 transition-transform drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">keeps</em> going.
            </h1>
            <p className="mt-10 max-w-xl text-base leading-relaxed text-slate-300 font-light mix-blend-plus-lighter">Petri is a living-world simulation where tiny creatures move, feed, reproduce, and disappear inside an evolving field.</p>
            <div className="mt-14 flex flex-wrap items-center gap-6">
              <Link href="/playground" className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
                Observe the world <ArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </Link>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400 bg-slate-800/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-700/50">No account required</span>
            </div>
          </div>
        </section>

        <div className="landing-scroll-cue mx-auto flex max-w-[1400px] justify-center items-center gap-3 px-5 pb-24 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400 sm:px-8 lg:px-12 animate-bounce">
          <ArrowDown size={16} className="text-primary" /> Continue into the field
        </div>

        <section className="relative border-y border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
          <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-32 relative z-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">The premise</p>
              <h2 className="mt-6 max-w-sm font-serif text-2xl leading-[1.15] tracking-[-0.03em]">Set a condition. Watch a life form.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              {notes.map((item, index) => (
                <button type="button" key={item.id} onClick={() => setActiveNote(index)} className={`text-left border-t-2 pt-6 transition-all duration-300 ${index === activeNote ? 'border-primary -translate-y-2' : 'border-slate-800 hover:border-primary/50 hover:-translate-y-1'} group relative bg-slate-950/20 rounded-b-2xl px-4 pb-6 backdrop-blur-sm hover:bg-slate-900/40`}>
                  <div className={`absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none ${index === activeNote ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
                  <span className="font-mono text-[12px] font-bold tracking-[0.16em] text-primary block mb-6">{item.id}</span>
                  <h3 className="font-serif text-lg leading-tight text-white/90">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">{item.body}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12 lg:py-40">
          <div className="relative">
            <div className="absolute -inset-10 bg-primary/5 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-md mb-8">
                <ScanLine size={16} /> Field note {note.id} / {note.label}
              </div>
              <p className="max-w-2xl font-serif text-2xl leading-[1.25] tracking-[-0.03em] text-white/90">{note.accent}</p>
            </div>
          </div>
          <div className="border-l-4 border-primary/30 pl-8 sm:pl-12 py-4 hover:border-primary transition-colors duration-500">
            <p className="max-w-md text-base leading-relaxed text-slate-300">{note.body} <br/><br/>Open a live world and let the ecology answer.</p>
            <Link href="/playground" className="mt-10 inline-flex items-center gap-3 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-primary transition-all hover:text-white group">
              Open the observation deck 
              <span className="p-2 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><ArrowUpRight size={16} /></span>
            </Link>
          </div>
        </section>

        <section className="emergence-section border-y border-white/5 bg-slate-900/60 text-slate-200 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="mx-auto grid max-w-[1400px] gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:px-12 lg:py-32 relative z-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] bg-primary/10 inline-block px-4 py-2 rounded-full border border-primary/20">After enough time</p>
              <h2 className="mt-8 max-w-xl font-serif text-2xl leading-[1.1] tracking-[-0.04em] text-pretty text-white">Patterns begin to look like choices.</h2>
            </div>
            <div className="relative min-h-[400px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-primary/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-900 shadow-[0_0_50px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_80px_rgba(16,185,129,0.3)] transition-shadow duration-700">
                  <Sprout className="text-primary animate-pulse" size={64} strokeWidth={1.5} />
                  <div className="absolute inset-0 border border-primary/30 rounded-full animate-ping opacity-20"></div>
                </div>
              </div>
              <div className="relative flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <span className="bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5">generation 02</span>
                <span className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5"><Wind size={14} className="text-primary" /> stable drift</span>
              </div>
              <p className="absolute bottom-8 left-8 right-8 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300 text-center bg-slate-900/60 py-3 rounded-xl backdrop-blur-md border border-white/5">Movement is the first language of the field.</p>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[1400px] flex-col gap-6 border-t border-white/5 px-5 py-12 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 bg-slate-950/40 backdrop-blur-lg rounded-t-3xl">
          <span className="flex items-center gap-3"><Leaf size={14} className="text-primary"/> Petri // a living world</span>
          <span className="flex items-center gap-2">Built for slow observation <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div></span>
        </footer>
      </div>
    </main>
  )
}
