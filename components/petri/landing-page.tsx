"use client"

import Link from 'next/link'
import { ArrowDown, ArrowUpRight, CircleDot, Leaf, Radio, ScanLine, Sprout, Wind } from 'lucide-react'
import { useState } from 'react'

const notes = [
  { id: '01', label: 'Emergence', title: 'A world with memory', body: 'Every movement, meal, birth, and death becomes part of the field record.', accent: 'Watch the small things.' },
  { id: '02', label: 'Adaptation', title: 'Nothing is decorative', body: 'Resources run out. Boundaries matter. Small decisions compound across generations.', accent: 'Conditions shape behavior.' },
  { id: '03', label: 'Intervention', title: 'You are the disturbance', body: 'Place food, watch the response, then leave the system to make its own next move.', accent: 'The field answers back.' },
]

function FieldWindow() {
  return (
    <div className="landing-field relative aspect-[1.08] overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl shadow-[#203c22]/20 sm:aspect-[1.45] lg:aspect-[1.2]">
      <div className="field-grid absolute inset-0 opacity-90" />
      <div className="field-dither absolute inset-0" />
      <div className="field-patch patch-one" /><div className="field-patch patch-two" /><div className="field-patch patch-three" />
      <div className="field-tree tree-one" /><div className="field-tree tree-two" /><div className="field-tree tree-three" />
      <div className="landing-creature creature-one"><span /><CircleDot size={14} /></div>
      <div className="landing-creature creature-two"><span /><CircleDot size={11} /></div>
      <div className="landing-creature creature-three"><span /><CircleDot size={12} /></div>
      <div className="field-food food-one" /><div className="field-food food-two" /><div className="field-food food-three" />
      <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70"><span className="size-1.5 rounded-full bg-[#e3c35b]" />field 35°12′ N / 11°48′ E</div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70"><Radio size={12} /> websocket live</div>
      <div className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#182318]/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm">observation 001</div>
    </div>
  )
}

export function LandingPage() {
  const [activeNote, setActiveNote] = useState(0)
  const note = notes[activeNote]

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="landing-header mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Petri home">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Leaf aria-hidden="true" size={18} /></span>
          <span className="flex flex-col"><span className="font-serif text-xl leading-none tracking-tight">petri</span><span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">a living world</span></span>
        </Link>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:gap-8"><span className="hidden sm:inline">Field study // 01</span><Link className="transition-colors hover:text-primary" href="/playground">Enter playground <ArrowUpRight className="ml-1 inline" size={13} /></Link></div>
      </header>

      <section className="landing-hero mx-auto grid max-w-[1400px] gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-28">
        <div className="max-w-xl"><div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"><span className="size-2 rounded-full bg-primary" />Live ecosystem / online</div><h1 className="max-w-4xl font-serif text-[clamp(4rem,10vw,9.5rem)] leading-[0.84] tracking-[-0.065em] text-pretty">A world that <em className="text-primary">keeps</em> going.</h1><p className="mt-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">Petri is a living-world simulation where tiny creatures move, feed, reproduce, and disappear inside an evolving field.</p><div className="mt-10 flex flex-wrap items-center gap-4"><Link href="/playground" className="group inline-flex items-center gap-3 rounded-full bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:-translate-y-0.5">Observe the world <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={16} /></Link><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No account required</span></div></div>
        <FieldWindow />
      </section>

      <div className="landing-scroll-cue mx-auto flex max-w-[1400px] items-center gap-3 px-5 pb-16 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8 lg:px-12"><ArrowDown size={14} /> Continue into the field</div>

      <section className="border-y border-border bg-secondary/50"><div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-24"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">The premise</p><h2 className="mt-5 max-w-sm font-serif text-4xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">Set a condition. Watch a life form.</h2></div><div className="grid gap-8 sm:grid-cols-3 sm:gap-6">{notes.map((item, index) => <button type="button" key={item.id} onClick={() => setActiveNote(index)} className={`text-left border-t pt-4 transition-colors ${index === activeNote ? 'border-primary' : 'border-border hover:border-primary/50'}`}><span className="font-mono text-[10px] tracking-[0.16em] text-primary">{item.id}</span><h3 className="mt-8 font-serif text-2xl leading-tight">{item.title}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.body}</p></button>)}</div></div></section>

      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12 lg:py-32"><div><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"><ScanLine size={14} /> Field note {note.id} / {note.label}</div><p className="mt-6 max-w-2xl font-serif text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">{note.accent}</p></div><div className="border-l-2 border-primary pl-6 sm:pl-10"><p className="max-w-sm text-base leading-7 text-muted-foreground">{note.body} Open a live world and let the ecology answer.</p><Link href="/playground" className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary transition-colors hover:text-foreground">Open the observation deck <ArrowUpRight size={14} /></Link></div></section>

      <section className="emergence-section border-y border-border bg-[#1d301e] text-[#eee7d2]"><div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:px-12 lg:py-28"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c7d768]">After enough time</p><h2 className="mt-5 max-w-xl font-serif text-5xl leading-[0.9] tracking-[-0.055em] text-pretty sm:text-7xl">Patterns begin to look like choices.</h2></div><div className="relative min-h-64 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#304c2d] p-6"><div className="field-grid absolute inset-0 opacity-40" /><div className="absolute inset-0 flex items-center justify-center"><Sprout className="text-[#c7d768]" size={62} strokeWidth={1} /></div><div className="relative flex items-start justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/60"><span>generation 02</span><span className="flex items-center gap-2"><Wind size={13} /> stable drift</span></div><p className="absolute bottom-6 left-6 right-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">Movement is the first language of the field.</p></div></div></section>

      <footer className="mx-auto flex max-w-[1400px] flex-col gap-4 border-t border-border px-5 py-8 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>Petri // a living world</span><span>Built for slow observation</span></footer>
    </main>
  )
}
