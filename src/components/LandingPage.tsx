import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Heart, 
  Shield, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  UserCheck, 
  Instagram, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  X,
  Compass,
  ArrowUpRight,
  Smile,
  Award,
  ChevronRight,
  User,
  GraduationCap,
  Menu,
  Waves,
  Puzzle,
  BookMarked,
  Armchair,
  SprayCan,
  BrainCircuit,
  HandHeart,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  onEnterSystem: () => void;
}

// Solid Clean Logo Vector - Exactly reproducing the original logo colors (Blue, Yellow, Pink, Black)
// Designed in a premium, ultra-sharp vector presentation matching the modern UI
export function LogoSVG({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 380" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" referrerPolicy="no-referrer">
      {/* Soft shadow background element to blend with modern white cards */}
      <circle cx="140" cy="190" r="130" fill="#ffffff" />
      
      {/* Dandelion Stem in solid black */}
      <path d="M 130 210 Q 155 285 175 315" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
      
      {/* Dandelion Center */}
      <circle cx="130" cy="210" r="9.5" fill="#1e293b" />
      
      {/* Dandelion Seeds Rays */}
      <line x1="130" y1="210" x2="90" y2="190" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="85" y2="215" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="95" y2="240" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="115" y2="255" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="140" y2="260" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="170" y2="230" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="175" y2="205" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="165" y2="180" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="145" y2="160" stroke="#1e293b" strokeWidth="2" />
      <line x1="130" y1="210" x2="115" y2="165" stroke="#1e293b" strokeWidth="2" />
      
      {/* Fluff fluff dots around the center (Yellow: #ebb448) */}
      <circle cx="130" cy="210" r="40" stroke="#ebb448" strokeWidth="9" strokeDasharray="5 10" fill="none" />
      <circle cx="130" cy="210" r="55" stroke="#ebb448" strokeWidth="6" strokeDasharray="3 12" fill="none" />
      
      {/* Flying Seeds (Pink: #d43f72 and Blue: #1070ca) */}
      <path d="M 100 150 Q 80 120 65 100" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="65" cy="100" r="8" fill="#1070ca" />
      
      <path d="M 115 130 Q 95 95 80 70" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="80" cy="70" r="8" fill="#d43f72" />

      <path d="M 140 135 Q 135 90 130 60" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="130" cy="60" r="7" fill="#1070ca" />

      <path d="M 160 155 Q 180 120 195 90" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="195" cy="90" r="9" fill="#d43f72" />

      <path d="M 75 180 Q 45 160 25 145" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="25" cy="145" r="7" fill="#1070ca" />

      <path d="M 85 230 Q 55 235 30 240" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="30" cy="240" r="8" fill="#d43f72" />

      {/* Typography representation */}
      <text x="240" y="130" fontFamily="'Outfit', sans-serif" fontWeight="500" fontSize="22" fill="#1e293b" letterSpacing="4">ESPAÇO</text>
      <text x="240" y="175" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="34" fill="#0f172a" letterSpacing="1">APRENDER</text>
      
      {/* Tiny diagonal A */}
      <text x="240" y="245" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="18" fill="#1e293b">A</text>
      
      {/* SER with beautiful high contrast colors */}
      <text x="260" y="310" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="105" fill="#d43f72">S</text>
      <text x="330" y="310" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="105" fill="#ebb448">E</text>
      <text x="395" y="310" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="105" fill="#1070ca">R</text>
    </svg>
  );
}

type LandingTab = "home" | "space" | "specialties" | "about" | "contact";

const TAB_TO_PATH: Record<LandingTab, string> = {
  home: "/",
  space: "/nosso-espaco",
  specialties: "/especialidades",
  about: "/francine-tersi",
  contact: "/agendamento",
};

const PATH_TO_TAB: Record<string, LandingTab> = {
  "/": "home",
  "/nosso-espaco": "space",
  "/especialidades": "specialties",
  "/francine-tersi": "about",
  "/agendamento": "contact",
};

export default function LandingPage({ onEnterSystem }: LandingPageProps) {
  // Navigation State - Multi-tab high-end interactive experience, backed by real routes
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: LandingTab = PATH_TO_TAB[location.pathname] ?? "home";
  const setActiveTab = (tab: LandingTab) => navigate(TAB_TO_PATH[tab]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom interactive room navigator state
  const [selectedRoomId, setSelectedRoomId] = useState("snoezelen");

  // Parental Screener Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  // Appointment Scheduling Form State
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Psicopedagogia");
  const [preferredPeriod, setPreferredPeriod] = useState("Tarde");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const startQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizFinished(false);
  };

  const handleQuizAnswer = (answer: boolean) => {
    const newAnswers = [...quizAnswers, answer];
    setQuizAnswers(newAnswers);
    if (quizStep < 4) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentName.trim() && parentPhone.trim()) {
      setIsSubmitting(true);
      
      // WhatsApp message composition
      const waMessage = `Olá Francine! Gostaria de agendar um atendimento para meu filho(a) *${childName}* (${childAge} anos).\n\n*Informações do Contato:*\n- Nome do Responsável: ${parentName}\n- Telefone: ${parentPhone}\n- Especialidade: ${selectedSpecialty}\n- Período de preferência: ${preferredPeriod}\n- Observações: ${additionalDetails || "Nenhuma"}`;
      const encodedMsg = encodeURIComponent(waMessage);
      const whatsappUrl = `https://wa.me/5515996723208?text=${encodedMsg}`;
      
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmissionSuccess(true);
        window.open(whatsappUrl, "_blank");
        
        // Reset form
        setChildName("");
        setChildAge("");
        setParentName("");
        setParentPhone("");
        setAdditionalDetails("");
        
        setTimeout(() => setSubmissionSuccess(false), 3000);
      }, 1200);
    }
  };

  const quizQuestions = [
    "A criança apresenta dificuldade para manter contato visual ou interagir socialmente?",
    "Apresenta atraso no desenvolvimento da fala ou dificuldade para expressar desejos cotidianos?",
    "Fica muito irritada ou desorganizada diante de mudanças na rotina escolar ou familiar?",
    "Tem dificuldades marcantes na escrita, leitura silábica ou coordenação motora fina?",
    "Demonstra hipersensibilidade a barulhos altos, etiquetas de roupa ou texturas alimentares?"
  ];

  const getQuizResult = () => {
    const yesCount = quizAnswers.filter(a => a).length;
    if (yesCount >= 4) {
      return {
        title: "Avaliação Multidisciplinar Recomendada",
        desc: "Os sinais indicados sugerem a importância de uma investigação detalhada em neurodesenvolvimento ou processamento sensorial. Nossos programas em ABA e Snoezelen oferecem suporte de alto padrão.",
        accentColor: "text-[#d43f72]",
        bgColor: "bg-pink-50/60 border-pink-100"
      };
    } else if (yesCount >= 2) {
      return {
        title: "Acompanhamento Psicopedagógico Sugerido",
        desc: "A criança apresenta alguns marcos de atenção que se beneficiariam de uma triagem focada em aprendizagem e funções cognitivas escolares.",
        accentColor: "text-[#ebb448]",
        bgColor: "bg-amber-50/60 border-amber-100"
      };
    } else {
      return {
        title: "Acompanhamento Preventivo Ordinário",
        desc: "Os indicativos parecem normais para o desenvolvimento básico, contudo, orientações parentais sistemáticas ajudam a guiar novos estímulos e autonomia em casa.",
        accentColor: "text-[#1070ca]",
        bgColor: "bg-blue-50/60 border-blue-100"
      };
    }
  };

  const roomsData = {
    snoezelen: {
      title: "Sala de Integração Sensorial Snoezelen",
      desc: "Um ambiente de refúgio multissensorial climatizado de última geração. Desenvolvido para acalmar, organizar e focar crianças com desordens do processamento sensorial, Autismo e TDAH. Conta com colunas de bolhas iluminadas em cores fixas, feixes de fibra óptica confortáveis, balanços de compressão proprioceptiva e painéis táteis de alto engajamento.",
      benefits: ["Regulação do tônus e alerta tátil", "Alívio imediato da sobrecarga cognitiva", "Melhora de foco para terapias cognitivas"],
      tagColor: "bg-blue-50 text-[#1070ca] border-blue-100",
      icon: Waves,
      gradient: "from-[#1070ca] to-[#0b5194]",
    },
    aba: {
      title: "Consultório de Terapia de Intervenção ABA",
      desc: "Espaço planejado cientificamente para sessões focadas na Análise do Comportamento Aplicada. Livre de poluição visual excessiva para garantir a máxima atenção ativa da criança. Equipado com materiais de intervenção modernos, quadros visuais de rotina, e uma seleção de reforçadores pedagógicos organizados.",
      benefits: ["Modelagem de repertório pró-social", "Aquisição de fala funcional sistemática", "Expansão de tempo de atenção em tarefas"],
      tagColor: "bg-pink-50 text-[#d43f72] border-pink-100",
      icon: Puzzle,
      gradient: "from-[#d43f72] to-[#a12b53]",
    },
    psicopedagogia: {
      title: "Atelier de Apoio e Psicopedagogia",
      desc: "Um ambiente inspirador que estimula o raciocínio criativo, a leitura integrada e o cálculo lógico-matemático. Conta com acervo diversificado de jogos didáticos, metodologias multissensoriais para desmistificar a dislexia e a discalculia, gerando prazer em aprender.",
      benefits: ["Aceleração da escrita e consciência silábica", "Fortalecimento do cálculo mental e autonomia", "Redução da frustração com demandas escolares"],
      tagColor: "bg-amber-50 text-[#b8852c] border-amber-100",
      icon: BookMarked,
      gradient: "from-[#ebb448] to-[#b8852c]",
    }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-[#fcfbfa] font-sans text-slate-800 antialiased selection:bg-[#1070ca] selection:text-white pb-20">
      
      {/* Mobile menu navigation drawer (Rendered at top-level to bypass sticky/header clipping context) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Background Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-over App Menu Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-[380px] bg-white z-55 shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="p-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-11 flex items-center justify-center">
                    <LogoSVG className="h-full w-full" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-none">
                      Aprender a Ser
                    </h2>
                    <span className="text-[8px] text-[#1070ca] font-black uppercase tracking-widest font-mono">Clínica Pro</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Content (Middle) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* Navigation Links with beautiful app style */}
                <div className="space-y-2.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono px-1">Navegação Principal</p>
                  <div className="space-y-1.5">
                    {[
                      { id: "home", label: "Início", desc: "Página principal & pilares de atuação", icon: <Smile className="h-4.5 w-4.5" />, activeColor: "bg-blue-50 text-[#1070ca] border-blue-100/50", iconBg: "bg-blue-100/50 text-[#1070ca]" },
                      { id: "space", label: "Nosso Espaço", desc: "Salas Snoezelen, ABA e Atelier lúdico", icon: <Compass className="h-4.5 w-4.5" />, activeColor: "bg-emerald-50 text-emerald-700 border-emerald-100/50", iconBg: "bg-emerald-100/40 text-emerald-600" },
                      { id: "specialties", label: "Especialidades", desc: "Serviços de psicopedagogia e triagem", icon: <GraduationCap className="h-4.5 w-4.5" />, activeColor: "bg-amber-50 text-[#ebb448] border-amber-100/50", iconBg: "bg-amber-100/40 text-[#ebb448]" },
                      { id: "about", label: "Francine Tersi", desc: "Fundadora e direção clínica", icon: <User className="h-4.5 w-4.5" />, activeColor: "bg-rose-50 text-[#d43f72] border-rose-100/50", iconBg: "bg-rose-100/40 text-[#d43f72]" },
                      { id: "contact", label: "Agendamento", desc: "Contato rápido e localização", icon: <Calendar className="h-4.5 w-4.5" />, activeColor: "bg-indigo-50 text-indigo-700 border-indigo-100/50", iconBg: "bg-indigo-100/40 text-indigo-600" }
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 cursor-pointer border ${
                            isActive 
                              ? `${tab.activeColor} shadow-2xs` 
                              : "border-transparent text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white text-current shadow-3xs" : tab.iconBg}`}>
                            {tab.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wide leading-none">{tab.label}</span>
                              {isActive && <span className="h-1 w-1 rounded-full bg-current animate-pulse" />}
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                              {tab.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Bottom Action Footer with WhatsApp appointment */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">Unidade Tatuí Online</span>
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab("contact");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#d43f72] hover:bg-[#a12b53] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all text-center shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" /> Agendar Consulta Online
                </button>

                <button
                  onClick={() => {
                    onEnterSystem();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-slate-500 hover:text-[#1070ca] font-bold text-[10px] uppercase tracking-widest transition-colors text-center cursor-pointer"
                >
                  Entrar
                </button>

                <p className="text-[8px] text-slate-400 font-bold text-center uppercase tracking-widest font-mono">
                  © 2026 Espaço Aprender a Ser
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Modern, elegant sticky header with frosted glass style */}
      <header id="landing-header" className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Frame */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}>
            <div className="h-14 w-16 sm:h-16 sm:w-20 flex items-center justify-center">
              <LogoSVG className="h-full w-full" />
            </div>
          </div>

          {/* Premium Modern Navigation - Absolutely no retro black block borders */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-full border border-slate-200/50">
            {[
              { id: "home", label: "Início" },
              { id: "space", label: "Nosso Espaço" },
              { id: "specialties", label: "Especialidades" },
              { id: "about", label: "Francine Tersi" },
              { id: "contact", label: "Agendamento" }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#1070ca] text-white shadow-md shadow-blue-500/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Login and Hamburger button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onEnterSystem}
              className="hidden lg:flex px-4 py-2.5 rounded-full border border-slate-200 hover:border-[#1070ca] text-slate-600 hover:text-[#1070ca] font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer items-center"
            >
              Entrar
            </button>

            {/* Mobile / Tablet Menu Button (iPad, iPad Pro, and phones) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-[#1070ca] rounded-xl hover:bg-slate-100/80 transition cursor-pointer lg:hidden border border-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
          </div>
        </div>

      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <AnimatePresence mode="wait">
          
          {/* ==================== PAGE: HOME ==================== */}
          {activeTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {/* Sophisticated Modern Hero Section */}
              <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Hero Primary Card */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-4xl p-8 sm:p-12 shadow-xl shadow-slate-100/80 flex flex-col justify-between space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#1070ca]/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d43f72]/5 rounded-full blur-3xl" />
                  
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1070ca] rounded-full text-xs font-bold border border-blue-100">
                      <Sparkles className="h-3.5 w-3.5" /> Clínica Integrada • Tatuí-SP
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      Acolher com afeto,<br />
                      <span className="text-[#1070ca] font-black">compreender</span> com ciência.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                      O <strong>Espaço Aprender a Ser</strong> é uma clínica especializada no tratamento de dificuldades escolares e transtornos do neurodesenvolvimento. Através de estratégias de <strong>Análise do Comportamento Aplicada (ABA)</strong>, oferecemos um suporte estruturado focado no acolhimento de cada família.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab("specialties")}
                      className="px-6 py-3.5 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
                    >
                      Ver Especialidades <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("contact")}
                      className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs uppercase tracking-wider hover:scale-102 transition-all cursor-pointer"
                    >
                      Agendar Conversa
                    </button>
                  </div>
                </div>

                {/* Hero Secondary Features Card */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-4xl p-8 sm:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d43f72]/15 rounded-full blur-3xl" />
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest bg-white/10 text-[#ebb448] px-3 py-1 rounded-full uppercase">Integração Snoezelen</span>
                      <Smile className="h-6 w-6 text-[#ebb448]" />
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight">Espaços Planejados Cientificamente</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Dispomos de ambientes clínicos acolhedores de última geração, incluindo nossa Sala de Integração Sensorial equipada com luzes suaves reguladas, fibras ópticas e colunas de água, oferecendo regulação de excelência imediata.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-1.5 mt-8 backdrop-blur-xs">
                    <p className="text-[10px] font-mono font-bold text-[#d43f72] uppercase tracking-wider">Compromisso Ético e Humano</p>
                    <p className="text-xs text-slate-200 leading-snug">
                      Intervenções personalizadas com embasamento científico de ponta para autismo, TDAH e dificuldades pedagógicas.
                    </p>
                  </div>
                </div>

              </div>

              {/* Strategic Pillars Section */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-mono font-extrabold text-[#1070ca] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Diferenciais Clínicos</span>
                  <h3 className="font-display text-3xl font-extrabold text-slate-950">Os Três Pilares da Nossa Intervenção</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: "Acolhimento Centrado na Família",
                      desc: "Muito mais do que atender a criança, integramos pais e cuidadores no centro da evolução, oferecendo treinamento sistemático e apoio empático continuado.",
                      color: "border-t-4 border-[#d43f72]"
                    },
                    {
                      title: "Metodologia Científica ABA",
                      desc: "Toda atividade proposta é fundamentada e documentada. Coletamos dados quantitativos reais para nortear as decisões de alteração do planejamento clínico.",
                      color: "border-t-4 border-[#1070ca]"
                    },
                    {
                      title: "Foco em Autonomia de Vida",
                      desc: "Nossos terapeutas preparam a criança para alcançar liberdade. O objetivo final é a inclusão escolar bem-sucedida e a rotina independente em casa.",
                      color: "border-t-4 border-[#ebb448]"
                    }
                  ].map((pilar, index) => (
                    <div key={index} className={`bg-white border border-slate-100 ${pilar.color} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-3`}>
                      <span className="text-xs font-mono font-bold text-slate-400">Pilar {index + 1}</span>
                      <h4 className="font-display font-bold text-base text-slate-900">{pilar.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{pilar.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialties Preview */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-mono font-extrabold text-[#d43f72] bg-pink-50 px-3 py-1 rounded-full border border-pink-100 uppercase tracking-widest">Catálogo de Serviços</span>
                  <h3 className="font-display text-3xl font-extrabold text-slate-950">Nossas Especialidades</h3>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">Intervenções pautadas em rigor técnico, adaptadas à realidade de cada criança.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { title: "Psicopedagogia Clínica", icon: BookMarked, gradient: "from-[#1070ca] to-[#0b5194]" },
                    { title: "Neuropsicopedagogia", icon: BrainCircuit, gradient: "from-[#d43f72] to-[#a12b53]" },
                    { title: "Estratégias ABA", icon: Target, gradient: "from-[#ebb448] to-[#b8852c]" },
                    { title: "Integração Sensorial", icon: Waves, gradient: "from-slate-700 to-slate-900" },
                  ].map((esp, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab("specialties")}
                      className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left cursor-pointer space-y-3"
                    >
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${esp.gradient} flex items-center justify-center shadow-sm`}>
                        <esp.icon className="h-5.5 w-5.5 text-white" strokeWidth={1.75} />
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">{esp.title}</h4>
                      <span className="text-[11px] text-[#1070ca] font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                        Saiba mais <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1070ca] rounded-full text-xs font-bold border border-blue-100 uppercase tracking-widest">Como Funciona</span>
                  <h3 className="font-display text-3xl font-extrabold text-slate-950">O Caminho Até o Acolhimento</h3>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { step: "01", title: "Contato Inicial", desc: "Você nos chama pelo WhatsApp ou site e contamos um pouco sobre a necessidade do seu filho(a).", icon: MessageCircle },
                    { step: "02", title: "Avaliação Clínica", desc: "Realizamos uma avaliação multidisciplinar para entender o perfil de desenvolvimento da criança.", icon: HandHeart },
                    { step: "03", title: "Plano Individualizado", desc: "Elaboramos um plano de intervenção sob medida, com metas claras e mensuráveis.", icon: Target },
                    { step: "04", title: "Acompanhamento Contínuo", desc: "Sessões regulares com relatórios de evolução e ponte ativa com escola e família.", icon: HandHeart },
                  ].map((s, i) => (
                    <div key={i} className="relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
                      <span className="text-3xl font-black text-slate-100 font-display absolute top-4 right-5">{s.step}</span>
                      <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center relative z-10">
                        <s.icon className="h-5.5 w-5.5 text-[#1070ca]" strokeWidth={1.75} />
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900 relative z-10">{s.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium relative z-10">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meet Francine highlight */}
              <div className="grid md:grid-cols-12 gap-6 items-center bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="md:col-span-4 h-64 md:h-full">
                  <img
                    src="/images/1.png"
                    alt="Francine Maria Tersi"
                    className="w-full h-full object-cover object-[50%_20%]"
                  />
                </div>
                <div className="md:col-span-8 p-8 sm:p-10 space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#d43f72] rounded-full text-xs font-bold border border-rose-100 uppercase tracking-widest">
                    <User className="h-3.5 w-3.5" /> Direção Clínica
                  </span>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900">Francine Maria Tersi</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Psicopedagoga, Neuropsicopedagoga e Terapeuta ABA, fundadora do Espaço Aprender a Ser. Meu compromisso é caminhar ao lado das famílias e das crianças, promovendo o desenvolvimento com acolhimento, estratégias personalizadas e muito amor pela profissão.
                  </p>
                  <button
                    onClick={() => setActiveTab("about")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1070ca] hover:text-[#0b5194] transition-colors cursor-pointer"
                  >
                    Conhecer a trajetória completa <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Final Booking CTA */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-900/10 overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#1070ca]/20 blur-3xl" />
                <div className="relative z-10 max-w-xl mx-auto space-y-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 text-[#ebb448] rounded-full text-xs font-bold uppercase tracking-widest">
                    <Calendar className="h-3.5 w-3.5" /> Vamos conversar?
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Dê o primeiro passo para o desenvolvimento do seu filho(a)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Agende uma conversa inicial com nossa equipe e descubra como podemos ajudar de forma individualizada e acolhedora.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab("contact")}
                      className="w-full sm:w-auto px-6 py-3 bg-[#d43f72] hover:bg-[#a12b53] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Calendar className="h-4 w-4" /> Agendar Conversa
                    </button>
                    <a
                      href="https://wa.me/5515996723208"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Phone className="h-4 w-4" /> Falar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== PAGE: NOSSO ESPAÇO ==================== */}
          {activeTab === "space" && (
            <motion.div
              key="space-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Introduction Banner */}
              <div className="relative bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col md:flex-row items-center gap-8">
                <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-[#1070ca]/20 blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-[#d43f72]/15 blur-3xl translate-y-1/3 -translate-x-1/4" />
                <div className="relative z-10 space-y-4 flex-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 text-[#ebb448] rounded-full text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="h-3.5 w-3.5" /> Ambientes de Alto Nível
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    O Cuidado em Cada Centímetro Quadrado
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                    Nossa infraestrutura clínica foi inteiramente desenhada para proporcionar um senso de segurança psicológica e conforto tátil. Seguindo regras rígidas de adaptação para neurodesenvolvimento, reduzimos estímulos sonoros perturbadores e otimizamos a regulação sensorial.
                  </p>
                </div>
                <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Armchair className="h-11 w-11 text-[#ebb448]" />
                </div>
              </div>

              {/* Interactive Multi-view Rooms */}
              <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* Rooms Tab Selector */}
                <div className="lg:col-span-4 space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block px-1 mb-2">Selecione para explorar detalhes técnicos:</span>
                  {Object.entries(roomsData).map(([id, room]) => {
                    const isSelected = selectedRoomId === id;
                    const RoomIcon = room.icon;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedRoomId(id)}
                        className={`w-full p-4 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-3 border cursor-pointer group ${
                          isSelected
                            ? `bg-gradient-to-br ${room.gradient} border-transparent text-white shadow-lg shadow-slate-900/15 scale-[1.02]`
                            : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200/70"
                        }`}>
                          <RoomIcon className={`h-5 w-5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                        </span>
                        <span>{room.title.split(" de ")[0] === room.title ? room.title : room.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Details Window */}
                <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  {/* Visual header strip with icon and gradient */}
                  <div className={`relative h-32 sm:h-40 bg-gradient-to-br ${roomsData[selectedRoomId as keyof typeof roomsData].gradient} flex items-center justify-center overflow-hidden`}>
                    <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
                    <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-white/5" />
                    {(() => {
                      const RoomIcon = roomsData[selectedRoomId as keyof typeof roomsData].icon;
                      return <RoomIcon className="h-14 w-14 sm:h-16 sm:w-16 text-white/90 relative z-10" strokeWidth={1.5} />;
                    })()}
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <h3 className="font-display text-xl font-bold text-slate-900">
                        {roomsData[selectedRoomId as keyof typeof roomsData].title}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${roomsData[selectedRoomId as keyof typeof roomsData].tagColor}`}>
                        Padrão Clínico Certificado
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {roomsData[selectedRoomId as keyof typeof roomsData].desc}
                    </p>

                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Benefícios e Aplicação Prática:</span>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {roomsData[selectedRoomId as keyof typeof roomsData].benefits.map((b, idx) => (
                          <div key={idx} className="flex gap-2.5 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <CheckCircle2 className="h-4 w-4 text-[#1070ca] shrink-0" />
                            <span className="text-xs font-bold text-slate-700 leading-tight">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Photos Gallery Representation */}
              <div className="space-y-6">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-mono font-bold text-[#ebb448] uppercase tracking-widest">Nossos Diferenciais</span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">Ambientes pensados para o seu bem-estar</h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { label: "Área de Espera Lúdica", d: "Jogos interativos e livraria para os pais relaxarem.", icon: BookOpen, accent: "text-[#1070ca] bg-blue-50", col: "border-t-4 border-[#1070ca]" },
                    { label: "Mobiliário Adaptado", d: "Mesas e cadeiras com regulagem de altura ergonômica.", icon: Armchair, accent: "text-[#d43f72] bg-pink-50", col: "border-t-4 border-[#d43f72]" },
                    { label: "Higiene e Protocolo", d: "Higienização completa sistemática pós-atendimentos.", icon: SprayCan, accent: "text-[#b8852c] bg-amber-50", col: "border-t-4 border-[#ebb448]" }
                  ].map((f, i) => (
                    <div key={i} className={`bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow space-y-3 ${f.col}`}>
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${f.accent}`}>
                        <f.icon className="h-5.5 w-5.5" strokeWidth={1.75} />
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900 uppercase">{f.label}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== PAGE: ESPECIALIDADES ==================== */}
          {activeTab === "specialties" && (
            <motion.div
              key="specialties-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Specialized Catalog */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-[#d43f72] rounded-full text-xs font-bold border border-pink-100 uppercase tracking-widest">Catálogo de Serviços</span>
                  <h2 className="font-display text-3xl font-extrabold text-slate-950">Especialidades Integradas</h2>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">Oferecemos intervenções pautadas em rigor técnico de nível internacional.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                  {[
                    {
                      title: "Psicopedagogia Clínica",
                      desc: "Investiga e intervém nas barreiras de aprendizagem que prejudicam a evolução escolar. Foco na melhora da alfabetização, leitura fluida, escrita, cálculo matemático básico e raciocínio lógico.",
                      badgeColor: "bg-blue-50 text-[#1070ca] border-blue-100",
                      icon: BookMarked,
                      gradient: "from-[#1070ca] to-[#0b5194]",
                    },
                    {
                      title: "Neuropsicopedagogia Clínica",
                      desc: "Articula os conhecimentos sobre as bases neurais com a aprendizagem escolar. Estimula e desenvolve as funções executivas essenciais (como controle de impulsos, planejamento e flexibilidade cognitiva).",
                      badgeColor: "bg-pink-50 text-[#d43f72] border-pink-100",
                      icon: BrainCircuit,
                      gradient: "from-[#d43f72] to-[#a12b53]",
                    },
                    {
                      title: "Estratégias Baseadas em ABA",
                      desc: "Análise do Comportamento Aplicada (ABA). Intervenções intensivas altamente eficazes focadas em aumentar repertório comportamental adequado, desenvolver comunicação funcional e reduzir comportamentos disruptivos.",
                      badgeColor: "bg-amber-50 text-[#b8852c] border-amber-100",
                      icon: Target,
                      gradient: "from-[#ebb448] to-[#b8852c]",
                    },
                    {
                      title: "Integração Sensorial / Snoezelen",
                      desc: "Indicada para crianças com transtorno do processamento sensorial. Promove a adaptação e autorregulação através de canais multissensoriais estruturados e acolhedores de Snoezelen.",
                      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
                      icon: Waves,
                      gradient: "from-slate-700 to-slate-900",
                    }
                  ].map((esp, i) => (
                    <div key={i} className="group bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden">
                      <div className={`h-1.5 w-full bg-gradient-to-r ${esp.gradient}`} />
                      <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 space-y-4">
                        <div className="space-y-3">
                          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${esp.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                            <esp.icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                          </div>
                          <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${esp.badgeColor}`}>
                            Especialidade Clínica
                          </span>
                          <h3 className="font-display text-lg font-bold text-slate-900">{esp.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{esp.desc}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#1070ca] font-bold group-hover:gap-2 transition-all">
                          Mais Informações <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modern Clinical Questionnaire Screen (Interactive Screener tool) */}
              <div className="relative bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-sm overflow-hidden">
                <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-pink-50/70 blur-2xl" />
                <div className="relative max-w-2xl mx-auto space-y-6">

                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d43f72] to-[#a12b53] flex items-center justify-center mx-auto shadow-md shadow-pink-200">
                      <HandHeart className="h-7 w-7 text-white" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-mono font-extrabold text-[#d43f72] bg-pink-50 px-3 py-1 rounded-full border border-pink-100 uppercase tracking-widest inline-block">Triagem Rápida</span>
                    <h3 className="font-display text-2xl font-black text-slate-900">Seu filho(a) precisa de suporte?</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Responda a 5 perguntas elaboradas por nossos especialistas</p>
                  </div>

                  {!quizFinished ? (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        <span>Status</span>
                        <span>Pergunta {quizStep + 1} de 5</span>
                      </div>

                      {/* Custom Thin Step Bar */}
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                        {[0,1,2,3,4].map(idx => (
                          <div 
                            key={idx} 
                            className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                              idx <= quizStep ? "bg-[#1070ca]" : "bg-slate-300/40"
                            }`} 
                          />
                        ))}
                      </div>

                      <div className="text-center py-4">
                        <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                          {quizQuestions[quizStep]}
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleQuizAnswer(true)}
                          className="py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Sim, frequentemente
                        </button>
                        <button
                          onClick={() => handleQuizAnswer(false)}
                          className="py-3 bg-white hover:bg-slate-100 text-slate-700 rounded-full font-bold text-xs uppercase tracking-wider border border-slate-200 transition-colors cursor-pointer"
                        >
                          Não, raramente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                      <div className={`p-5 rounded-xl border ${getQuizResult().bgColor} space-y-2`}>
                        <h4 className={`font-display font-bold text-base uppercase tracking-tight flex items-center gap-2 ${getQuizResult().accentColor}`}>
                          <AlertCircle className="h-5 w-5 shrink-0" /> {getQuizResult().title}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {getQuizResult().desc}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                          onClick={startQuiz}
                          className="px-5 py-2.5 border border-slate-200 bg-white rounded-full text-slate-600 font-bold text-xs uppercase cursor-pointer"
                        >
                          Refazer Perguntas
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("contact");
                            setAdditionalDetails("Realizei a triagem rápida no site e obtive recomendação especializada.");
                          }}
                          className="px-6 py-2.5 bg-[#d43f72] hover:bg-[#a12b53] text-white rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Consultar no WhatsApp
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== PAGE: ABOUT (FRANCINE TERSI) ==================== */}
          {activeTab === "about" && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Professional Profile Frame */}
                <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-center space-y-6">
                  <div className="space-y-4">
                    <div className="w-36 h-36 rounded-full bg-slate-50 border border-slate-200/50 mx-auto overflow-hidden shadow-sm shadow-slate-100">
                      <img
                        src="/images/1.png"
                        alt="Francine Maria Tersi"
                        className="w-full h-full object-cover object-[50%_20%] scale-125"
                      />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-slate-900">Francine Maria Tersi</h3>
                      <p className="text-[#1070ca] font-extrabold text-[10px] uppercase tracking-wider mt-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block">
                        Fundadora & Diretora Clínica
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-3">CLÍNICA MULTI • REGISTRO SP</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Credenciais Ativas</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200/50">Psicopedagoga</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200/50">Neuropsicopedagoga</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200/50">Terapeuta ABA</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Bio */}
                <div className="lg:col-span-8 bg-white border border-slate-100 p-8 sm:p-10 rounded-3xl shadow-sm space-y-6">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-[#b8852c] rounded-full text-xs font-bold border border-amber-100 uppercase tracking-widest">Nossa Missão</span>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900">Educação e Saúde Integradas</h3>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    <p>
                      Olá, sou a <strong>Francine Maria Tersi</strong>. Ao longo da minha carreira, percebi que a evolução escolar e comportamental de uma criança depende diretamente da harmonia entre a ciência clínica, o amor do ambiente familiar e a adaptação do ambiente escolar.
                    </p>
                    <p>
                      Por isso, fundei o <strong>Espaço Aprender a Ser</strong> com o compromisso inabalável de oferecer intervenções individualizadas de alto padrão científico (ABA, Snoezelen e Neuropsicopedagogia), sem jamais perder o calor humano, o afeto e a sensibilidade necessários para acolher famílias.
                    </p>
                    <p>
                      Realizamos conexões permanentes e reuniões sistemáticas com as escolas de Tatuí e região, garantindo que as diretrizes terapêuticas sejam aplicadas na prática dentro da sala de aula para uma verdadeira inclusão escolar.
                    </p>
                  </div>

                  <blockquote className="border-l-4 border-[#d43f72] bg-rose-50/40 rounded-r-2xl px-5 py-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium italic">
                    "Por trás de cada conquista de uma criança, há uma rede de apoio, afeto e escuta. Como psicopedagoga, meu compromisso é caminhar ao lado das famílias e das crianças, promovendo o desenvolvimento com acolhimento, estratégias personalizadas e muito amor pela profissão. 🌱 Cada passo é único, e cada progresso, uma grande vitória!"
                  </blockquote>

                  <div className="rounded-2xl overflow-hidden border border-slate-100">
                    <img
                      src="/images/2.png"
                      alt="Francine Tersi em atendimento no Espaço Aprender a Ser"
                      className="w-full h-96 sm:h-[28rem] object-cover object-[50%_20%]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#1070ca]/10 text-[#1070ca] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Treinamento de Pais</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Capacitação sistemática para que a família domine ferramentas e manejos de rotina.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#1070ca]/10 text-[#1070ca] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Ponte Escolar Ativa</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Presença em reuniões escolares para adaptar e planejar o PEI (Plano de Ensino Individualizado).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Formação contínua & atualização</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      Estudar transforma atendimentos! Na psicopedagogia, estar em constante atualização é essencial para oferecer intervenções mais assertivas, criativas e eficazes. Cada curso, leitura e troca de experiência amplia nosso olhar e nos permite criar estratégias personalizadas, respeitando o ritmo e a necessidade de cada paciente.
                    </p>
                    <p className="text-xs sm:text-sm text-[#1070ca] font-bold">
                      💡 Investir em conhecimento é investir no sucesso de quem atendemos.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Terapia infantil</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      Terapia infantil é muito mais do que apenas brincar. É um espaço seguro onde a criança consegue expressar, através do brincar, aquilo que ainda não sabe colocar em palavras. É acolhimento, escuta e cuidado com cada fase do desenvolvimento, respeitando o tempo e a individualidade de cada criança. É onde emoções são compreendidas, vínculos são fortalecidos e o crescer se torna mais leve e saudável. 💛
                    </p>
                  </div>

                  <a
                    href="https://www.instagram.com/espacoaprenderaser1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#d43f72] hover:text-[#a12b53] transition-colors pt-2"
                  >
                    @espacoaprenderaser1 no Instagram →
                  </a>
                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== PAGE: CONTACT & BOOKING ==================== */}
          {activeTab === "contact" && (
            <motion.div
              key="contact-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Form Side */}
                <div className="lg:col-span-7 bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-sm space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#1070ca] uppercase tracking-wider block">Formulário de Pré-Agendamento</span>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900">Inicie o acolhimento hoje</h3>
                    <p className="text-xs text-slate-500 font-medium">Preencha as informações básicas para receber nosso retorno via WhatsApp.</p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Nome da Criança:</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: João Silva"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Idade da Criança:</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Ex: 5"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Nome do Responsável:</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Maria Silva"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Telefone de Contato (WhatsApp):</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="Ex: (15) 99672-3208"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Especialidade Desejada:</label>
                        <select 
                          value={selectedSpecialty}
                          onChange={(e) => setSelectedSpecialty(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        >
                          <option value="Psicopedagogia">Psicopedagogia Clínica</option>
                          <option value="Neuropsicopedagogia">Neuropsicopedagogia Clínica</option>
                          <option value="ABA">Estratégias Baseadas em ABA</option>
                          <option value="Snoezelen">Integração Sensorial / Snoezelen</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Período de Preferência:</label>
                        <select 
                          value={preferredPeriod}
                          onChange={(e) => setPreferredPeriod(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                        >
                          <option value="Manhã">Manhã</option>
                          <option value="Tarde">Tarde</option>
                          <option value="Noite">Noite</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Detalhes Adicionais (Opcional):</label>
                      <textarea 
                        rows={3}
                        placeholder="Quais são as principais dificuldades ou objetivos terapêuticos?"
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1070ca] text-slate-800 font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#d43f72] hover:bg-[#a12b53] disabled:bg-slate-400 text-white rounded-full font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-pink-500/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Processando..." : "Prosseguir para WhatsApp"} <MessageCircle className="h-4.5 w-4.5" />
                    </button>

                    {submissionSuccess && (
                      <p className="text-[11px] text-[#1070ca] font-bold text-center animate-pulse">
                        Sucesso! Redirecionando para o WhatsApp comercial da Clínica...
                      </p>
                    )}

                  </form>
                </div>

                {/* Info Side */}
                <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <span className="text-[10px] font-mono font-bold text-[#ebb448] tracking-widest uppercase block">Canais Oficiais</span>
                    <h3 className="font-display text-2xl font-bold leading-tight">Agendamento & Endereço</h3>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex gap-3">
                        <MapPin className="h-5 w-5 text-[#1070ca] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Endereço Físico:</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-semibold">Tatuí - SP, Brasil. Contate nosso comercial para informações de quadra e número de consultório.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Phone className="h-5 w-5 text-[#d43f72] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Telefone / WhatsApp Comercial:</h4>
                          <p className="text-xs text-[#ebb448] font-bold leading-relaxed">(15) 99672-3208</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Mail className="h-5 w-5 text-[#ebb448] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Atendimento a Convênios:</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-semibold">Emitimos relatórios de reembolso detalhados de acordo com diretrizes ANS para terapias multidisciplinares.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-[11px] text-slate-300 font-medium">
                    Horário de Funcionamento Comercial:<br />
                    <strong>Segunda a Sexta-feira: 08:00 às 18:00</strong><br />
                    Atendimentos agendados individualmente.
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/5515996723208" 
        target="_blank" 
        rel="noreferrer" 
        className="fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer border-2 border-white"
        title="Fale conosco no WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>

      {/* Modern Compact Footer */}
      <footer className="max-w-7xl mx-auto px-6 lg:px-8 mt-20 pt-8 border-t border-slate-100 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-extrabold text-sm text-slate-900 leading-none">Espaço Aprender a Ser</h4>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1">Clínica Multidisciplinar de Neurodesenvolvimento Infantil • Tatuí-SP</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-mono text-center mt-6">© 2026 Espaço Aprender a Ser. Todos os direitos reservados. Rigor científico e acolhimento humano.</p>
        <p className="text-[10px] text-slate-400 font-mono text-center mt-2">
          Desenvolvido por{" "}
          <a
            href="https://develoi.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1070ca] hover:text-[#0b5194] font-bold transition-colors"
          >
            Develoi Soluções Digitais
          </a>
        </p>
      </footer>

    </div>
  );
}
