import React, { useState } from "react";
import { Search, Compass, BookOpen, Star, Sparkles, Filter } from "lucide-react";
import { ActivityCard } from "../types";
import { initialActivityCards } from "../mockData";

export default function ActivityBankModule() {
  const [activities] = useState<ActivityCard[]>(initialActivityCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  const filteredActivities = activities.filter(act => {
    const actNome = act.nome || "";
    const actObjetivo = act.objetivo || "";
    const actMateriais = act.materiaisNecessarios || [];

    const matchesSearch = actNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          actObjetivo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          actMateriais.some(mat => mat.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "todos" || act.categoria === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div id="activity-bank-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-pink-50 text-[#d43f72] text-lg">🧩</span> Banco de Atividades Clínicas
        </h2>
        <p className="text-xs text-slate-500 font-medium font-sans">Explore materiais de estimulação multissensorial, fichas dirigidas de alfabetização e estratégias psicopedagógicas prontas para uso.</p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por atividade, objetivo terapêutico ou materiais..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1070ca] focus:bg-white text-xs font-semibold text-slate-700 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setCategoryFilter("todos")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-all duration-200 ${categoryFilter === "todos" ? "bg-[#1070ca] text-white border-[#1070ca] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            🌟 Todos
          </button>
          <button
            onClick={() => setCategoryFilter("Memória")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-all duration-200 ${categoryFilter === "Memória" ? "bg-[#1070ca] text-white border-[#1070ca] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            🧠 Memória
          </button>
          <button
            onClick={() => setCategoryFilter("Leitura")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-all duration-200 ${categoryFilter === "Leitura" ? "bg-[#1070ca] text-white border-[#1070ca] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            📖 Leitura
          </button>
          <button
            onClick={() => setCategoryFilter("Funções executivas")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-all duration-200 ${categoryFilter === "Funções executivas" ? "bg-[#1070ca] text-white border-[#1070ca] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            ⚡ Funções Executivas
          </button>
          <button
            onClick={() => setCategoryFilter("Autorregulação")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-all duration-200 ${categoryFilter === "Autorregulação" ? "bg-[#1070ca] text-white border-[#1070ca] shadow-md shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            🫧 Autorregulação
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map((act) => {
          const categoryColors = {
            "Coordenação Motora": "bg-[#ebb448]",
            "Estimulação Sensorial": "bg-[#1070ca]",
            "Alfabetização Silábica": "bg-[#d43f72]",
            "Habilidades Sociais": "bg-slate-700",
            "Memória": "bg-amber-500",
            "Leitura": "bg-pink-600",
            "Funções executivas": "bg-indigo-600",
            "Autorregulação": "bg-teal-600"
          };
          const bgColor = categoryColors[act.categoria as keyof typeof categoryColors] || "bg-[#1070ca]";

          return (
            <div
              key={act.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header with solid bg and category name */}
                <div className={`p-5 ${bgColor} text-white`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">{act.categoria}</span>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white font-mono font-bold uppercase tracking-wide">Alvo: {act.faixaEtaria}</span>
                  </div>
                  <h3 className="font-display font-black text-base mt-3.5 leading-tight">{act.nome}</h3>
                </div>

                {/* Body content */}
                <div className="p-5 space-y-4 text-xs font-medium">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">Objetivo Clínico:</span>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{act.objetivo}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">Materiais Necessários:</span>
                    <div className="flex flex-wrap gap-1">
                      {(act.materiaisNecessarios || []).map((mat, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-150 font-bold px-2 py-0.5 rounded-md">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step by step */}
                  <div className="space-y-2 border-t border-slate-100 pt-3.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">Passo a Passo da Aplicação:</span>
                    <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed font-medium">
                      {(typeof act.instrucoes === 'string'
                        ? act.instrucoes.split(". ").map(s => s.trim()).filter(Boolean)
                        : (Array.isArray(act.instrucoes) ? act.instrucoes : [])
                      ).map((inst, idx) => {
                        const text = inst.endsWith(".") ? inst : `${inst}.`;
                        return <li key={idx} className="pl-1 text-left">{text}</li>;
                      })}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Bottom tag / advice */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-[#ebb448] font-mono font-black uppercase tracking-wider">
                💡 Dica ABA: Use reforçamento de frequência imediata durante a execução.
              </div>
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold">Nenhuma atividade corresponde aos critérios de busca.</p>
            <p className="text-xs">Tente usar palavras-chave como "areia", "lápis", "foco" ou "sílabas".</p>
          </div>
        )}
      </div>
    </div>
  );
}
