import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Check, ChevronRight, ClipboardList, GraduationCap, HelpCircle, LockKeyhole, Menu, MessageCircleQuestion, Play, Sparkles, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const subjectPreview = [
  { name: "Mathematics", code: "MTH", color: "bg-[#FF6B57]", icon: "∑" },
  { name: "Biology", code: "BIO", color: "bg-[#7DAE92]", icon: "◒" },
  { name: "Physics", code: "PHY", color: "bg-[#7798D7]", icon: "◉" },
  { name: "Literature", code: "LIT", color: "bg-[#B28BC9]", icon: "Aa" },
];

function Mark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-[13px] ${light ? "bg-white/15 text-white" : "bg-[#FF674F] text-white"}`}>
        <span className="font-display text-xl font-bold">N</span>
      </div>
      <div className="leading-none">
        <div className={`font-display text-lg font-bold tracking-tight ${light ? "text-white" : "text-[#202426]"}`}>BRCM</div>
        <div className={`mt-1 text-[10px] font-bold uppercase tracking-[0.26em] ${light ? "text-white/55" : "text-[#93908A]"}`}>college portal</div>
      </div>
    </div>
  );
}

function LoginGate({ onClose, onDemo }: { onClose: () => void; onDemo: (role: "student" | "teacher") => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1D2020]/65 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sign in to BRCM College of Engineering and Technology">
      <div className="relative grid max-h-[740px] w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#F8F5EF] shadow-[0_35px_120px_rgba(0,0,0,.28)] lg:grid-cols-[1.02fr_.98fr]">
        <button onClick={onClose} className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-[#303332] shadow-sm transition hover:rotate-90 hover:bg-white" aria-label="Close sign in"><X className="h-4 w-4" /></button>
        <div className="relative min-h-[290px] overflow-hidden bg-[#F26E58] lg:min-h-[650px]">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute left-7 top-7 z-10 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white">Your learning, in orbit</div>
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline src="/campus-animation.webm" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-8 text-white lg:p-10">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/65"><Sparkles className="h-3.5 w-3.5" /> A calmer way to learn</div>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-[.95] tracking-[-0.05em] sm:text-5xl">A little more curious. A lot more connected.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">Pick up where you left off, ask better questions, and let your teachers meet you halfway.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <div className="mb-10"><Mark /><div className="mt-10 max-w-sm"><p className="eyebrow">Welcome back</p><h1 className="mt-3 font-display text-4xl font-semibold leading-[.95] tracking-[-0.05em] text-[#202426]">Come on in.<br />Your next idea is waiting.</h1><p className="mt-5 text-sm leading-6 text-[#77736D]">Sign in to access lesson notes, assignments, and your teacher inbox.</p></div></div>
          <button onClick={() => { onClose(); window.location.href = "/login"; }} className="group flex w-full items-center justify-between rounded-2xl bg-[#FF674F] px-5 py-4 text-left text-white shadow-[0_12px_24px_rgba(255,103,79,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ec5744] active:scale-[.98]"><span><span className="block text-sm font-bold">Continue with BRCM College</span><span className="mt-1 block text-xs text-white/65">Secure college sign-in</span></span><ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></button>
          <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#B0ABA2]"><span className="h-px flex-1 bg-[#E4DED4]" /> Choose your portal <span className="h-px flex-1 bg-[#E4DED4]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { onClose(); window.location.href = "/login"; }} className="rounded-2xl border border-[#E7E1D7] bg-white p-4 text-left transition hover:-translate-y-1 hover:border-[#FF674F] hover:shadow-lg"><div className="mb-7 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FF674F]"><GraduationCap className="h-4 w-4" /></div><div className="text-sm font-bold text-[#292C2B]">Student space</div><div className="mt-1 text-xs leading-5 text-[#8D8981]">Login as a student</div></button>
            <button onClick={() => { onClose(); window.location.href = "/login"; }} className="rounded-2xl border border-[#E7E1D7] bg-white p-4 text-left transition hover:-translate-y-1 hover:border-[#7798D7] hover:shadow-lg"><div className="mb-7 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#7798D7]"><Users className="h-4 w-4" /></div><div className="text-sm font-bold text-[#292C2B]">Teacher space</div><div className="mt-1 text-xs leading-5 text-[#8D8981]">Post & respond</div></button>
          </div>
          <p className="mt-8 text-center text-[11px] leading-5 text-[#A29D94]">By continuing, you agree to the college’s <span className="font-semibold text-[#77736D]">privacy policy</span> and <span className="font-semibold text-[#77736D]">community guidelines</span>.</p>
        </div>
      </div>
    </div>
  );
}

function Landing({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileOpen(false); };
  return (
    <div className="min-h-screen overflow-hidden bg-[#F8F5EF] text-[#252827]">
      <div className="absolute left-[-10rem] top-[30rem] h-[25rem] w-[25rem] rounded-full bg-[#FFD9CB]/50 blur-3xl" />
      <header className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 lg:px-10">
        <Mark />
        <nav className={`${mobileOpen ? "absolute left-5 right-5 top-20 flex" : "hidden"} items-center gap-6 rounded-2xl border border-[#E9E2D7] bg-[#F8F5EF]/95 p-4 shadow-xl md:static md:flex md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          <button onClick={() => scrollTo("experience")} className="nav-link">Experience</button><button onClick={() => scrollTo("community")} className="nav-link">Community</button><button onClick={() => scrollTo("questions")} className="nav-link">For teachers</button>
        </nav>
        <div className="flex items-center gap-3"><button className="hidden rounded-full px-4 py-2 text-xs font-bold text-[#5D5D57] transition hover:bg-white md:block" onClick={onOpenLogin}>Sign in</button><Button onClick={onOpenLogin} className="rounded-full bg-[#FF674F] px-5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(255,103,79,.2)] hover:bg-[#EC5744]">Enter portal <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button><button onClick={() => setMobileOpen(!mobileOpen)} className="grid h-10 w-10 place-items-center rounded-full border border-[#E5DFD5] md:hidden" aria-label="Toggle menu"><Menu className="h-4 w-4" /></button></div>
      </header>
      <main>
        <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[.88fr_1.12fr] lg:px-10 lg:pb-32 lg:pt-20">
          <div className="relative z-10"><div className="eyebrow flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-[#FF674F]" /> The college portal that feels human</div><h1 className="mt-6 max-w-xl font-display text-[clamp(4rem,8vw,7.8rem)] font-semibold leading-[.84] tracking-[-0.075em] text-[#252827]">Make room<br /><span className="text-[#FF674F]">for wonder.</span></h1><p className="mt-8 max-w-md text-base leading-7 text-[#77736D]">BRCM College gives every student a clear place to learn, share, and ask for help — with their teachers right there when it matters.</p><div className="mt-9 flex flex-wrap items-center gap-4"><button onClick={onOpenLogin} className="group rounded-full bg-[#252827] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#FF674F] active:scale-[.98]">Start your journey <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-1" /></button><button onClick={() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 rounded-full px-3 py-3 text-sm font-semibold text-[#65635E] transition hover:text-[#FF674F]"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#DCD5CB] bg-white"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span> See how it works</button></div><div className="mt-14 flex items-center gap-5 border-t border-[#E5DED4] pt-5"><div className="flex -space-x-2"><span className="avatar-dot bg-[#D98D6F]">A</span><span className="avatar-dot bg-[#7DAE92]">M</span><span className="avatar-dot bg-[#7798D7]">J</span><span className="avatar-dot bg-[#B28BC9]">+</span></div><p className="text-xs leading-5 text-[#858078]"><span className="font-bold text-[#4C4A45]">1,240 curious minds</span><br />already learning with BRCM College</p></div></div>
          <div className="relative min-h-[520px] lg:min-h-[640px]"><div className="absolute right-0 top-2 h-[430px] w-[82%] rounded-[42px] bg-[#F2C4AF] lg:h-[550px]" /><div className="absolute right-5 top-12 h-[420px] w-[86%] overflow-hidden rounded-[34px] bg-[#FF7B62] shadow-[0_24px_60px_rgba(198,107,81,.22)] lg:h-[525px]"><div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:23px_23px]" /><video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline src="/campus-animation.webm" /><div className="absolute bottom-7 left-7 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-white backdrop-blur-md"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-[#FFF1A9]" /> Live on campus</div><div className="mt-1 text-sm font-semibold">Your teacher is online</div></div></div><div className="float-card absolute -bottom-2 left-0 w-[220px] rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(63,56,45,.12)] backdrop-blur-sm lg:left-[-28px]"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF2E9] text-[#659272]"><Check className="h-4 w-4" /></span><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AEAAA2]">Today</span></div><div className="mt-7 text-sm font-bold text-[#333635]">Small wins count.</div><div className="mt-1 text-xs leading-5 text-[#8D8981]">3 lessons wrapped<br />1 question answered</div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EEE8DF]"><div className="h-full w-[72%] rounded-full bg-[#7DAE92]" /></div></div><div className="absolute right-[-15px] top-[-14px] grid h-[74px] w-[74px] place-items-center rounded-full bg-[#FCEAA2] text-[#6B5A2C] shadow-[0_14px_26px_rgba(191,158,56,.18)]"><span className="font-display text-3xl">✦</span></div></div>
        </section>
        <section id="experience" className="mx-auto max-w-[1240px] scroll-mt-10 px-6 py-24 lg:px-10"><div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">A softer system</p><h2 className="mt-3 max-w-lg font-display text-4xl font-semibold leading-[.95] tracking-[-.055em] sm:text-5xl">Everything you need.<br /><span className="text-[#9A968E]">Nothing you don’t.</span></h2></div><p className="max-w-xs text-sm leading-6 text-[#858078]">One connected space for the rhythm of college: learn, practice, ask, and keep moving.</p></div><div className="grid gap-4 md:grid-cols-3"><div className="feature-tile bg-[#252827] text-white"><div className="tile-number text-white/25">01</div><div className="mt-20 grid h-11 w-11 place-items-center rounded-2xl bg-[#FF674F]"><BookOpen className="h-5 w-5" /></div><h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">Find your focus</h3><p className="mt-3 text-sm leading-6 text-white/55">Slide through subjects, open the right notes, and see what’s next without digging.</p></div><div className="feature-tile bg-[#E7F0E8]"><div className="tile-number text-[#7DAE92]/50">02</div><div className="mt-20 grid h-11 w-11 place-items-center rounded-2xl bg-[#7DAE92] text-white"><MessageCircleQuestion className="h-5 w-5" /></div><h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-[#304438]">Ask without overthinking</h3><p className="mt-3 text-sm leading-6 text-[#617463]">Send a question straight to the teacher who can help — with context already attached.</p></div><div className="feature-tile bg-[#FCE8DE]"><div className="tile-number text-[#FF674F]/40">03</div><div className="mt-20 grid h-11 w-11 place-items-center rounded-2xl bg-[#FF674F] text-white"><ClipboardList className="h-5 w-5" /></div><h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-[#542F28]">Keep your momentum</h3><p className="mt-3 text-sm leading-6 text-[#9A6259]">See tasks, downloads, and feedback in one calm, confidence-building view.</p></div></div></section>
        <section id="community" className="border-y border-[#E5DED4] bg-white/45"><div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-10"><div><p className="eyebrow">A shared orbit</p><h2 className="mt-3 max-w-md font-display text-4xl font-semibold leading-[.95] tracking-[-.055em] sm:text-5xl">Teachers set the pace.<br /><span className="text-[#7798D7]">Students set the spark.</span></h2><p className="mt-6 max-w-sm text-sm leading-6 text-[#77736D]">Designed to make the handoff between teaching and learning feel less like paperwork and more like a conversation.</p><button onClick={onOpenLogin} className="mt-8 text-sm font-bold text-[#FF674F] hover:underline">See both sides <ArrowRight className="ml-1 inline h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-3xl border border-[#E9E2D8] bg-[#F8F5EF] p-6"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#A09B92]">Student view</span><GraduationCap className="h-5 w-5 text-[#FF674F]" /></div><div className="mt-12 space-y-2"><div className="h-3 w-[82%] rounded-full bg-[#E7DFD4]" /><div className="h-3 w-[58%] rounded-full bg-[#E7DFD4]" /><div className="mt-5 h-20 rounded-2xl bg-[#FFF0EA]" /></div></div><div className="rounded-3xl bg-[#DDE7F7] p-6"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#6A7B9B]">Teacher view</span><Users className="h-5 w-5 text-[#617FAB]" /></div><div className="mt-12 space-y-2"><div className="flex gap-2"><div className="h-9 w-9 rounded-xl bg-white/70" /><div className="h-3 mt-2 w-[62%] rounded-full bg-white/70" /></div><div className="flex gap-2"><div className="h-9 w-9 rounded-xl bg-white/70" /><div className="h-3 mt-2 w-[44%] rounded-full bg-white/70" /></div></div></div></div></div></section>
        <section id="questions" className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10"><div className="relative overflow-hidden rounded-[34px] bg-[#FF674F] px-7 py-14 text-white sm:px-14"><div className="absolute right-[-5%] top-[-80%] h-[650px] w-[650px] rounded-full border border-white/15" /><div className="relative flex flex-col justify-between gap-10 md:flex-row md:items-end"><div><p className="eyebrow text-white/60">Ready when you are</p><h2 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[.95] tracking-[-.055em] sm:text-6xl">College should feel like somewhere you belong.</h2></div><button onClick={onOpenLogin} className="group shrink-0 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#F05F4B] transition hover:-translate-y-1 hover:shadow-xl">Enter BRCM College <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-1" /></button></div></div></section>
      </main>
      <footer className="mx-auto flex max-w-[1240px] flex-col gap-5 border-t border-[#E5DED4] px-6 py-8 text-xs text-[#8B877F] sm:flex-row sm:items-center sm:justify-between lg:px-10"><Mark /><span>© 2026 BRCM College of Engineering and Technology · Built for curious minds</span></footer>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  useEffect(() => {
    if (!user) return;

    sessionStorage.setItem("brcm-role", user.role);
    if (user.role === "admin") {
      setLocation("/admin");
    } else if (user.role === "teacher") {
      setLocation("/teacher");
    } else {
      setLocation("/portal");
    }
  }, [user, setLocation]);
  const enterDemo = (_role: "student" | "teacher") => {
    setGateOpen(false);
    setLocation("/login");
  };
  return <><Landing onOpenLogin={() => setGateOpen(true)} />{gateOpen && <LoginGate onClose={() => setGateOpen(false)} onDemo={enterDemo} />}</>;
}
