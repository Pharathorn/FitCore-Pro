/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Dumbbell, 
  Timer as TimerIcon, 
  Utensils, 
  TrendingUp, 
  User, 
  Bell, 
  Plus, 
  ChevronRight, 
  TrendingDown,
  LayoutGrid,
  Users,
  Calendar,
  Settings,
  ArrowLeft,
  CalendarDays,
  Play,
  History,
  Info,
  CheckCircle2,
  Timer,
  PlusCircle,
  MoreVertical,
  ChevronLeft,
  LogOut,
  Verified,
  ShoppingBasket,
  Check,
  Share2,
  FileText,
  Egg,
  Leaf,
  Fish,
  Apple,
  Flame,
  Menu,
  BarChart3,
  Camera,
  Trash2,
  Upload,
  Eye,
  ShoppingCart,
  Download,
  FileDown,
  Droplets,
  Sun,
  Sword,
  Trophy,
  Moon,
  Footprints,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'home' | 'dashboard' | 'workout' | 'timer' | 'nutrition' | 'progress' | 'profile' | 'onboarding' | 'login' | 'welcome' | 'register';

interface ProgressPhoto {
  id: string;
  date: string;
  label: string;
  img: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'training' | 'habits' | 'nutrition';
  completed: boolean;
}

interface Coach {
  id: string;
  name: string;
  phone: string;
  img: string;
}

interface Client {
  id: string;
  name: string;
  program: string;
  status: string;
  active: boolean;
  img: string;
  weight?: string;
  bodyFat?: string;
  stepsTarget?: number;
  waterTarget?: number;
  achievements?: Achievement[];
  progressPhotos?: ProgressPhoto[];
  assignedCoachId?: string;
}

interface DailyLog {
  date: string;
  weight?: number;
  sleepHours?: number;
  sleepQuality?: 'Mal' | 'Regular' | 'Bien' | 'Excelente';
  stepsCompleted: boolean;
  waterCompleted: boolean;
}

interface Ingredient {
  name: string;
  amount: string;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  name: string;
  desc: string;
  kcal: number;
  time: string;
  checked: boolean;
  ingredients: Ingredient[];
}

interface DailyNutrition {
  day: string;
  meals: Meal[];
}

// --- Constants & Data ---
const coaches: Coach[] = [
  { id: 'c1', name: 'Coach Alex', phone: '34600000000', img: 'https://picsum.photos/seed/coach1/100/100' },
  { id: 'c2', name: 'Coach Maria', phone: '34611111111', img: 'https://picsum.photos/seed/coach2/100/100' },
  { id: 'c3', name: 'Coach Juan', phone: '34622222222', img: 'https://picsum.photos/seed/coach3/100/100' }
];

const clients: Client[] = [
  { id: '1', name: 'Sarah Jenkins', program: 'Powerlifting • Phase 2', status: 'Today', active: true, img: 'https://picsum.photos/seed/sarah/100/100', weight: '64.2 kg', bodyFat: '21.4%', stepsTarget: 10000, waterTarget: 2.5, assignedCoachId: 'c1' },
  { id: '2', name: 'Marcus Chen', program: 'Hypertrophy • Week 4', status: '2 days ago', active: false, img: 'https://picsum.photos/seed/marcus/100/100', weight: '82.5 kg', bodyFat: '15.2%', stepsTarget: 8000, waterTarget: 3.0, assignedCoachId: 'c2' },
  { id: '3', name: 'Elena Rodriguez', program: 'Endurance • Advanced', status: 'Yesterday', active: true, img: 'https://picsum.photos/seed/elena/100/100', weight: '58.0 kg', bodyFat: '18.5%', stepsTarget: 12000, waterTarget: 2.0, assignedCoachId: 'c1' },
];

// --- Components ---

const BottomNav = ({ active, onChange, role }: { active: Screen; onChange: (s: Screen) => void; role: 'admin' | 'client' | null }) => {
  const navItems = [
    ...(role === 'admin' ? [{ id: 'dashboard', label: 'Panel', icon: LayoutGrid }] : [{ id: 'home', label: 'Inicio', icon: LayoutGrid }]),
    { id: 'workout', label: 'Entrenar', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrición', icon: Utensils },
    { id: 'progress', label: 'Progreso', icon: TrendingUp },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-dark/95 backdrop-blur-lg border-t border-white/10 px-4 pb-6 pt-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id as Screen)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              active === item.id ? "text-primary" : "text-slate-500"
            )}
          >
            <item.icon className={cn("size-6", active === item.id && "fill-current")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const HomeScreen = ({ clientData, isCoach }: { clientData: Client | null; isCoach?: boolean }) => {
  const assignedCoach = coaches.find(c => c.id === clientData?.assignedCoachId);
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${today}`);
    return saved ? JSON.parse(saved) : {
      date: today,
      stepsCompleted: false,
      waterCompleted: false
    };
  });

  const [targets, setTargets] = useState(() => {
    const saved = clientData ? localStorage.getItem(`clientTargets_${clientData.id}`) : null;
    return saved ? JSON.parse(saved) : {
      steps: clientData?.stepsTarget || 10000,
      water: clientData?.waterTarget || 2.5
    };
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`dailyLog_${clientData?.id || 'default'}_${today}`, JSON.stringify(dailyLog));
  }, [dailyLog, clientData?.id]);

  useEffect(() => {
    if (clientData) {
      localStorage.setItem(`clientTargets_${clientData.id}`, JSON.stringify(targets));
    }
  }, [targets, clientData?.id]);

  const updateLog = (updates: Partial<DailyLog>) => {
    if (isCoach) return; // Coach can't log daily metrics for client
    setDailyLog(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="flex items-center p-4 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-primary/30">
          <img src={clientData?.img || "https://picsum.photos/seed/user/100/100"} className="w-full h-full object-cover" alt="User" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-xs text-slate-400 font-medium">
            {isCoach ? 'Dashboard de Cliente' : (assignedCoach ? `Coach: ${assignedCoach.name}` : '¡Hola de nuevo!')}
          </p>
          <h2 className="text-lg font-bold leading-tight tracking-tight">{clientData?.name || 'Usuario'}</h2>
        </div>
        <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-5" />
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* Daily Goals Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold tracking-tight">Objetivos {isCoach ? '(Editables)' : 'de Hoy'}</h3>
            {isCoach && <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Modo Coach</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={cn(
                "glass-card rounded-2xl p-4 flex flex-col items-center gap-3 transition-all border-2",
                dailyLog.stepsCompleted && !isCoach ? "border-primary bg-primary/10" : "border-white/5"
              )}
            >
              <div className={cn("p-3 rounded-xl", dailyLog.stepsCompleted && !isCoach ? "bg-primary text-bg-dark" : "bg-white/5 text-primary")}>
                <TrendingUp className="size-6" />
              </div>
              <div className="text-center w-full">
                <p className="text-[10px] font-bold uppercase text-slate-400">Pasos</p>
                {isCoach ? (
                  <input 
                    type="number" 
                    value={targets.steps}
                    onChange={(e) => setTargets(prev => ({ ...prev, steps: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-center font-black text-lg focus:ring-1 focus:ring-primary outline-none mt-1"
                  />
                ) : (
                  <p className="text-lg font-black">{targets.steps}</p>
                )}
              </div>
              {!isCoach && (
                <button 
                  onClick={() => updateLog({ stepsCompleted: !dailyLog.stepsCompleted })}
                  className={cn(
                    "size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    dailyLog.stepsCompleted ? "bg-primary border-primary" : "border-white/20"
                  )}
                >
                  {dailyLog.stepsCompleted && <Check className="size-4 text-bg-dark" />}
                </button>
              )}
            </div>

            <div 
              className={cn(
                "glass-card rounded-2xl p-4 flex flex-col items-center gap-3 transition-all border-2",
                dailyLog.waterCompleted && !isCoach ? "border-primary bg-primary/10" : "border-white/5"
              )}
            >
              <div className={cn("p-3 rounded-xl", dailyLog.waterCompleted && !isCoach ? "bg-primary text-bg-dark" : "bg-white/5 text-primary")}>
                <Flame className="size-6" />
              </div>
              <div className="text-center w-full">
                <p className="text-[10px] font-bold uppercase text-slate-400">Agua (L)</p>
                {isCoach ? (
                  <input 
                    type="number" 
                    step="0.5"
                    value={targets.water}
                    onChange={(e) => setTargets(prev => ({ ...prev, water: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-center font-black text-lg focus:ring-1 focus:ring-primary outline-none mt-1"
                  />
                ) : (
                  <p className="text-lg font-black">{targets.water}</p>
                )}
              </div>
              {!isCoach && (
                <button 
                  onClick={() => updateLog({ waterCompleted: !dailyLog.waterCompleted })}
                  className={cn(
                    "size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    dailyLog.waterCompleted ? "bg-primary border-primary" : "border-white/20"
                  )}
                >
                  {dailyLog.waterCompleted && <Check className="size-4 text-bg-dark" />}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Daily Logging Section */}
        <section className="glass-panel rounded-3xl p-6 space-y-6">
          <h3 className="text-lg font-bold">{isCoach ? 'Último Registro del Cliente' : 'Registro Diario'}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Peso en Ayunas (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={dailyLog.weight || ''}
                onChange={(e) => updateLog({ weight: parseFloat(e.target.value) })}
                placeholder={isCoach ? "Sin registro" : "Ej: 75.5"}
                disabled={isCoach}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Horas de Sueño</label>
                <input 
                  type="number" 
                  value={dailyLog.sleepHours || ''}
                  onChange={(e) => updateLog({ sleepHours: parseInt(e.target.value) })}
                  placeholder={isCoach ? "-" : "Ej: 8"}
                  disabled={isCoach}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Calidad</label>
                <select 
                  value={dailyLog.sleepQuality || ''}
                  onChange={(e) => updateLog({ sleepQuality: e.target.value as any })}
                  disabled={isCoach}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none disabled:opacity-50"
                >
                  <option value="" disabled>Seleccionar</option>
                  <option value="Mal">Mal</option>
                  <option value="Regular">Regular</option>
                  <option value="Bien">Bien</option>
                  <option value="Excelente">Excelente</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Summary Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold">Resumen de Progreso</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="size-4 text-primary" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Entrenamiento</span>
              </div>
              <p className="text-sm font-bold">Próxima sesión:</p>
              <p className="text-primary text-xs font-bold">Empuje (Mañana)</p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="size-4 text-primary" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Nutrición</span>
              </div>
              <p className="text-sm font-bold">Hoy:</p>
              <p className="text-primary text-xs font-bold">1,850 / 2,200 kcal</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// --- Screens ---

const DashboardScreen = ({ coach, onAddClient, onSelectClient }: { coach: Coach | null; onAddClient: () => void; onSelectClient: (client: Client) => void }) => {
  const engagementData = [
    { day: 'MON', value: 65 },
    { day: 'TUE', value: 85 },
    { day: 'WED', value: 45 },
    { day: 'THU', value: 95 },
    { day: 'FRI', value: 70 },
    { day: 'SAT', value: 30 },
    { day: 'SUN', value: 20 },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
      <header className="flex items-center p-4 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-primary/30">
          <img src={coach?.img || "https://picsum.photos/seed/coach/100/100"} className="w-full h-full object-cover" alt="Coach" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-xs text-slate-400 font-medium">Panel de Entrenador,</p>
          <h2 className="text-lg font-bold leading-tight tracking-tight">{coach?.name || 'Coach Alex'}</h2>
        </div>
        <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-5" />
        </button>
      </header>

      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex-1 min-w-[140px] glass-card rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Clientes Totales</p>
          <p className="text-2xl font-bold mt-1">124</p>
          <div className="flex items-center gap-1 mt-1 text-primary">
            <TrendingUp className="size-3" />
            <span className="text-xs font-bold">+5.2%</span>
          </div>
        </div>
        <div className="flex-1 min-w-[140px] glass-card rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Activos Ahora</p>
          <p className="text-2xl font-bold mt-1">18</p>
          <div className="flex items-center gap-1 mt-1 text-red-500">
            <TrendingDown className="size-3" />
            <span className="text-xs font-bold">-2.1%</span>
          </div>
        </div>
      </div>

      <section className="px-4 py-2">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-base font-bold">Actividad Semanal</h3>
              <p className="text-slate-400 text-xs">Media de actividad 85%</p>
            </div>
            <p className="text-primary text-xl font-bold neon-text">Alta</p>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 px-1">
            {engagementData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className={cn(
                    "w-full rounded-t-sm relative overflow-hidden transition-all",
                    d.value > 70 ? "bg-primary" : "bg-primary/40"
                  )} 
                  style={{ height: `${d.value}%` }}
                />
                <span className={cn("text-[10px] font-bold", d.value > 70 ? "text-primary" : "text-slate-400")}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[22px] font-bold tracking-tight">Clientes Activos</h3>
          <button className="text-primary text-sm font-semibold">Ver Todos</button>
        </div>
        <div className="space-y-3">
          {clients.map((client, i) => (
            <button 
              key={i} 
              onClick={() => onSelectClient(client)}
              className="w-full flex items-center gap-4 p-4 glass-card rounded-xl text-left transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20">
                <img src={client.img} className="w-full h-full object-cover" alt={client.name} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{client.name}</h4>
                <p className="text-slate-400 text-xs mt-0.5">{client.program}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{client.status}</p>
                <p className={cn("text-[10px] font-medium uppercase tracking-tight", client.active ? "text-primary" : "text-slate-500")}>
                  {client.active ? 'Activo' : 'Descanso'}
                </p>
              </div>
              <ChevronRight className="size-5 text-slate-400" />
            </button>
          ))}
        </div>
      </section>

      <button 
        onClick={onAddClient}
        className="fixed bottom-24 right-6 h-14 px-6 rounded-full bg-primary text-bg-dark shadow-lg shadow-primary/20 flex items-center justify-center gap-2 z-30 transition-transform active:scale-95 hover:scale-105"
      >
        <PlusCircle className="size-6" />
        <span className="font-bold">Nuevo Cliente</span>
      </button>
    </div>
  );
};

const WelcomeScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,102,0.1),transparent_70%)]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="bg-primary/20 p-6 rounded-3xl mb-8 animate-bounce">
          <Dumbbell className="text-primary size-16" />
        </div>
        
        <h1 className="text-5xl font-black text-center mb-4 tracking-tighter italic">
          BeFit <span className="text-primary neon-text">PRO</span>
        </h1>
        <p className="text-slate-400 text-center text-lg mb-12 max-w-[280px]">
          Tu transformación física comienza con un plan inteligente.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={onLogin}
            className="w-full h-16 bg-primary text-bg-dark font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <User className="size-5" />
            Iniciar Sesión
          </button>
        </div>

        <p className="mt-12 text-slate-500 text-sm font-medium">
          v2.4.0 • Edición Élite
        </p>
      </div>
    </div>
  );
};

const RegisterScreen = ({ onRegister, onBack }: { onRegister: () => void; onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col p-6 max-w-md mx-auto w-full">
      <header className="pt-6 mb-12 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Nuevo Cliente</h1>
          <p className="text-slate-400">Crea una cuenta para tu cliente</p>
        </div>
      </header>

      <form className="space-y-6 flex-1" onSubmit={(e) => { e.preventDefault(); onRegister(); }}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1">Usuario</label>
          <input 
            required
            className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            placeholder="nombre_usuario" 
            type="text" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1">Contraseña</label>
          <input 
            required
            className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            placeholder="••••••••" 
            type="password" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1">Confirmar Contraseña</label>
          <input 
            required
            className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            placeholder="••••••••" 
            type="password" 
          />
        </div>

        <button type="submit" className="w-full h-14 bg-primary text-bg-dark font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8">
          <span>Crear Cuenta</span>
          <ChevronRight className="size-6" />
        </button>
      </form>
    </div>
  );
};

const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState('');
  const dateInputRef = useState<HTMLInputElement | null>(null)[0];
  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = value;
    if (value.length > 2) {
      formatted = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    setBirthDate(formatted);
  };

  const handleDatePickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      setBirthDate(`${day}/${month}/${year}`);
    }
  };

  const stepTitles = [
    "Perfil Básico",
    "Biometría",
    "Estilo de Vida",
    "Experiencia y Motivación"
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <header className="w-full max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleBack}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white transition-opacity",
              step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="text-lg font-bold">Personalicemos tu entrenamiento</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex justify-between items-end">
            <p className="text-sm font-medium text-slate-400">Paso {step} de {totalSteps}</p>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{stepTitles[step - 1]}</p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Cuéntanos sobre ti</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Nombre y Apellidos</label>
                  <input className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Juan Pérez" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Género</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none">
                    <option disabled value="">Selecciona tu género</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">No binario / Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Fecha de nacimiento</label>
                  <div className="relative">
                    <input 
                      className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                      placeholder="DD / MM / AAAA" 
                      type="text" 
                      value={birthDate}
                      onChange={handleDateChange}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      <input 
                        type="date" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={handleDatePickerChange}
                      />
                      <CalendarDays className="text-slate-400 size-5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Tus medidas</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Altura (cm)</label>
                  <input className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="175" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Peso actual (kg)</label>
                    <input className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="70" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Peso objetivo (kg)</label>
                    <input className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="65" type="number" />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Tu estilo de vida</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Nivel de actividad actual</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none">
                    <option disabled value="">Selecciona tu actividad</option>
                    <option value="sedentary">Sedentario (Poco o nada de ejercicio)</option>
                    <option value="active">Activo (Ejercicio 3-5 días/semana)</option>
                    <option value="very_active">Muy activo (Ejercicio 6-7 días/semana)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Volumen de entrenamiento actual</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none">
                    <option disabled value="">Selecciona tu volumen</option>
                    <option value="none">Nada</option>
                    <option value="1_week">1 vez por semana</option>
                    <option value="3_week">3 días por semana</option>
                    <option value="more">Más de 3 días por semana</option>
                  </select>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Experiencia y Motivación</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Experiencia entrenando en gimnasio</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none">
                    <option disabled value="">Selecciona tu experiencia</option>
                    <option value="beginner">Principiante (Menos de 6 meses)</option>
                    <option value="intermediate">Intermedio (6 meses a 2 años)</option>
                    <option value="advanced">Avanzado (Más de 2 años)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Nivel de motivación</label>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      defaultValue="7" 
                      className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Bajo</span>
                      <span>Medio</span>
                      <span>Extremo</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button 
              onClick={handleNext}
              className="w-full h-14 bg-primary text-bg-dark font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8"
            >
              <span>{step === totalSteps ? 'Finalizar' : 'Continuar'}</span>
              <ChevronRight className="size-6" />
            </button>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-md mx-auto px-4 py-8">
        <p className="text-center text-slate-400 text-xs px-6">
          {step === 2 
            ? "Usamos esta información para calcular tu IMC y ajustar tu plan calórico de forma segura."
            : "Tus datos están seguros con nosotros y se usan exclusivamente para personalizar tu experiencia."}
        </p>
      </footer>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (role: 'admin' | 'client') => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const demoAccounts = [
      { email: 'cliente@cliente.com', password: '123', role: 'client' as const },
      { email: 'admin@admin.com', password: '123', role: 'admin' as const }
    ];

    const user = demoAccounts.find(u => u.email === email && u.password === password);

    if (user) {
      onLogin(user.role);
    } else {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col justify-center px-6 max-w-[480px] mx-auto w-full">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary/20 p-4 rounded-2xl mb-6">
          <Dumbbell className="text-primary size-12" />
        </div>
        <h1 className="text-[32px] font-bold leading-tight text-center">Bienvenido de nuevo</h1>
        <p className="text-slate-400 text-base mt-2 text-center">Accede a tu plan personalizado</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold ml-1">Correo electrónico</label>
          <input 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary/50 transition-all" 
            placeholder="ejemplo@email.com" 
            type="email" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold ml-1">Contraseña</label>
          <div className="relative">
            <input 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary/50 transition-all" 
              placeholder="••••••••" 
              type="password" 
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <User className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="text-primary text-sm font-medium hover:underline">¿Olvidaste tu contraseña?</button>
        </div>

        <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-bg-dark font-bold text-lg h-14 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
          <span>Entrar</span>
          <ChevronRight className="size-6" />
        </button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-slate-400 text-sm italic">
          Solo el administrador puede crear nuevas cuentas.
        </p>
      </div>
    </div>
  );
};

const WorkoutScreen = ({ isCoach, clientData }: { isCoach?: boolean; clientData?: Client | null }) => {
  const [view, setView] = useState<'days' | 'exercises' | 'detail' | 'summary'>('days');
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [sets, setSets] = useState<any[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [problematicExercises, setProblematicExercises] = useState<number[]>([]);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://picsum.photos/seed/benchpress/800/450");
  const [fatigue, setFatigue] = useState(5);
  const [feedback, setFeedback] = useState("");

  const [workoutDays, setWorkoutDays] = useState([
    { 
      id: 1, 
      title: 'Día 1: Pecho y Tríceps', 
      subtitle: 'Fase de Hipertrofia • Semana 3',
      exercises: [
        { 
          id: 101, 
          name: 'Flat Barbell Bench Press', 
          sets: 3, 
          reps: '10-12', 
          rest: 120, 
          video: "https://picsum.photos/seed/benchpress/800/450",
          initialSets: [
            { id: 1, kg: 80, reps: 10, rpe: 8, rir: 2, completed: false },
            { id: 2, kg: 80, reps: 10, rpe: 8, rir: 2, completed: false },
            { id: 3, kg: 80, reps: 10, rpe: 8, rir: 2, completed: false },
          ]
        },
        { 
          id: 102, 
          name: 'Incline Dumbbell Flyes', 
          sets: 3, 
          reps: '12-15', 
          rest: 90, 
          video: "https://picsum.photos/seed/flyes/100/100",
          initialSets: [
            { id: 1, kg: 18, reps: 12, rpe: 7, rir: 3, completed: false },
            { id: 2, kg: 18, reps: 12, rpe: 7, rir: 3, completed: false },
            { id: 3, kg: 18, reps: 12, rpe: 7, rir: 3, completed: false },
          ]
        }
      ]
    },
    { id: 2, title: 'Día 2: Espalda y Bíceps', subtitle: 'Fase de Hipertrofia • Semana 3', exercises: [] },
    { id: 3, title: 'Día 3: Pierna Completa', subtitle: 'Fase de Hipertrofia • Semana 3', exercises: [] },
  ]);

  useEffect(() => {
    let timer: any;
    if (isResting && restTime > 0) {
      timer = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            // Simple browser notification simulation
            if (!isCoach) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isResting, restTime, isCoach]);

  const startWorkout = (day: any) => {
    setSelectedDay(day);
    setCurrentExerciseIdx(0);
    if (day.exercises.length > 0) {
      setSets(day.exercises[0].initialSets);
      setVideoUrl(day.exercises[0].video);
      setView('detail');
    } else {
      setView('exercises');
    }
  };

  const toggleSet = (id: number) => {
    if (isCoach) return;
    const newSets = sets.map(s => {
      if (s.id === id) {
        const newState = !s.completed;
        if (newState) {
          // Start rest timer automatically
          setRestTime(selectedDay.exercises[currentExerciseIdx].rest);
          setIsResting(true);
        }
        return { ...s, completed: newState };
      }
      return s;
    });
    setSets(newSets);
  };

  const updateSet = (id: number, field: string, value: any) => {
    setSets(sets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSet = (id: number) => {
    setSets(sets.filter(s => s.id !== id));
  };

  const reportPain = () => {
    const exerciseId = selectedDay.exercises[currentExerciseIdx].id;
    setProblematicExercises([...problematicExercises, exerciseId]);
    nextExercise();
  };

  const nextExercise = () => {
    if (currentExerciseIdx < selectedDay.exercises.length - 1) {
      const nextIdx = currentExerciseIdx + 1;
      setCurrentExerciseIdx(nextIdx);
      setSets(selectedDay.exercises[nextIdx].initialSets);
      setVideoUrl(selectedDay.exercises[nextIdx].video);
      setIsResting(false);
      setRestTime(0);
    } else {
      setView('summary');
    }
  };

  const deleteWorkoutDay = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este día de entrenamiento completo?')) {
      setWorkoutDays(workoutDays.filter(d => d.id !== id));
    }
  };

  const addWorkoutDay = () => {
    const newId = workoutDays.length > 0 ? Math.max(...workoutDays.map(d => d.id)) + 1 : 1;
    const newDay = {
      id: newId,
      title: `Día ${newId}: Nuevo Entrenamiento`,
      subtitle: 'Programación personalizada',
      exercises: []
    };
    setWorkoutDays([...workoutDays, newDay]);
  };

  const allSetsCompleted = sets.length > 0 && sets.every(s => s.completed);

  if (view === 'days') {
    return (
      <div className="min-h-screen bg-bg-dark text-white pb-32">
        <header className="p-6">
          <h1 className="text-3xl font-black italic tracking-tighter">
            {isCoach ? `Programación: ${clientData?.name}` : 'Mis Entrenamientos'}
          </h1>
          <p className="text-slate-400 font-medium">Selecciona una sesión para comenzar</p>
        </header>
        <main className="p-4 space-y-4">
          {workoutDays.map((day) => (
            <div key={day.id} className="relative group">
              <button 
                onClick={() => startWorkout(day)}
                className="w-full glass-card rounded-2xl p-5 text-left border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{day.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{day.subtitle}</p>
                    <div className="flex gap-4 mt-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                        <Dumbbell className="size-3" /> {day.exercises.length} Ejercicios
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                        <Timer className="size-3" /> ~65 min
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-6 text-slate-600 group-hover:text-primary transition-colors" />
                </div>
              </button>
              {isCoach && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkoutDay(day.id);
                  }}
                  className="absolute top-4 right-12 p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Eliminar día"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>
          ))}
          {isCoach && (
            <button 
              onClick={addWorkoutDay}
              className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold flex flex-col items-center gap-2 hover:border-primary/40 hover:text-primary transition-all"
            >
              <PlusCircle className="size-8" />
              <span>Añadir Nuevo Día de Entrenamiento</span>
            </button>
          )}
        </main>
      </div>
    );
  }

  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-bg-dark text-white p-6 flex flex-col">
        <header className="mb-8 text-center">
          <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-12 text-primary" />
          </div>
          <h1 className="text-3xl font-black italic">¡Entrenamiento Finalizado!</h1>
          <p className="text-slate-400">Gran trabajo hoy, completa el feedback para tu coach.</p>
        </header>
        <main className="flex-1 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Nivel de Fatiga (1-10)</label>
            <div className="flex flex-col gap-4">
              <input 
                type="range" min="1" max="10" value={fatigue} 
                onChange={(e) => setFatigue(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
              />
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Fresco</span>
                <span className="text-primary text-lg">{fatigue}</span>
                <span>Agotado</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Comentarios / Problemas</label>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="¿Alguna molestia? ¿Algún ejercicio que no pudiste hacer?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </main>
        <button 
          onClick={() => setView('days')}
          className="w-full py-5 bg-primary text-bg-dark font-black text-lg rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform"
        >
          GUARDAR Y FINALIZAR
        </button>
      </div>
    );
  }

  const currentExercise = selectedDay.exercises[currentExerciseIdx];

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('days')} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="size-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">
                {currentExercise.name}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {currentExerciseIdx + 1} de {selectedDay.exercises.length} Ejercicios
              </p>
            </div>
          </div>
          <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="size-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full">
        {!isCoach && (
          <div className="p-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
              {selectedDay.exercises.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-full flex-1 transition-all duration-500",
                    i < currentExerciseIdx ? "bg-primary" : i === currentExerciseIdx ? "bg-primary/40" : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-2">
          <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
            <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center group">
              <img 
                src={videoUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                alt="Exercise Video" 
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <button className="relative z-10 flex shrink-0 items-center justify-center rounded-full size-16 bg-primary text-bg-dark shadow-lg hover:scale-110 transition-transform">
                <Play className="size-8 fill-current" />
              </button>
              {isCoach && (
                <button 
                  onClick={() => setShowVideoEditor(true)}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-lg text-white hover:text-primary transition-colors"
                >
                  <Settings className="size-5" />
                </button>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">VÍDEO DE TÉCNICA</div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tight mb-1">{currentExercise.name}</h2>
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Info className="size-3" /> {sets.length} Series • {currentExercise.reps} Reps
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest">
                      <Timer className="size-3" /> {currentExercise.rest}s Descanso
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sets.map((set, idx) => (
                  <div 
                    key={set.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl transition-all border",
                      set.completed && !isCoach
                        ? "bg-white/5 border-white/10 opacity-60" 
                        : "bg-white/5 border-white/5"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-full font-black text-sm transition-colors",
                      set.completed && !isCoach ? "bg-primary text-bg-dark" : "bg-white/10 text-white"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-slate-500 font-black">KG</label>
                        <input 
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg" 
                          type="number" 
                          value={set.kg}
                          onChange={(e) => updateSet(set.id, 'kg', parseInt(e.target.value) || 0)}
                          disabled={set.completed && !isCoach}
                        />
                      </div>
                      <div className="flex flex-col items-center border-x border-white/10">
                        <label className="text-[8px] uppercase text-slate-500 font-black">REPS</label>
                        <input 
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg" 
                          type="number" 
                          value={set.reps}
                          onChange={(e) => updateSet(set.id, 'reps', parseInt(e.target.value) || 0)}
                          disabled={set.completed && !isCoach}
                        />
                      </div>
                      <div className="flex flex-col items-center border-r border-white/10">
                        <label className="text-[8px] uppercase text-slate-500 font-black">RPE</label>
                        <select 
                          value={set.rpe}
                          onChange={(e) => updateSet(set.id, 'rpe', parseInt(e.target.value))}
                          disabled={set.completed && !isCoach}
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg appearance-none cursor-pointer"
                        >
                          {Array.from({length: 11}, (_, i) => i).map(val => (
                            <option key={val} className="bg-bg-dark" value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-slate-500 font-black">RIR</label>
                        <select 
                          value={set.rir}
                          onChange={(e) => updateSet(set.id, 'rir', parseInt(e.target.value))}
                          disabled={set.completed && !isCoach}
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg appearance-none cursor-pointer"
                        >
                          {Array.from({length: 6}, (_, i) => i).map(val => (
                            <option key={val} className="bg-bg-dark" value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {isCoach ? (
                      <button 
                        onClick={() => deleteSet(set.id)}
                        className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    ) : set.completed ? (
                      <CheckCircle2 onClick={() => toggleSet(set.id)} className="size-6 text-primary fill-current cursor-pointer" />
                    ) : (
                      <button 
                        onClick={() => toggleSet(set.id)}
                        className="bg-primary text-bg-dark px-3 py-2 rounded-xl font-black text-[10px] hover:brightness-110 transition-all active:scale-95"
                      >
                        ANOTAR
                      </button>
                    )}
                  </div>
                ))}

                {isResting && !isCoach && (
                  <div className="mt-4 bg-primary text-bg-dark p-4 rounded-2xl flex items-center justify-between shadow-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <Timer className="size-8" />
                      <div>
                        <p className="text-[10px] font-black uppercase leading-none">Descanso en curso</p>
                        <p className="text-3xl font-black">
                          {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setRestTime(prev => prev + 15)}
                        className="bg-black/10 hover:bg-black/20 p-2 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-bold">+15s</span>
                      </button>
                      <button 
                        onClick={() => { setIsResting(false); setRestTime(0); }}
                        className="bg-black text-white px-4 py-2 rounded-xl font-black text-xs"
                      >
                        SALTAR
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSets([...sets, { id: Date.now(), kg: 0, reps: 0, rpe: 8, rir: 2, completed: false }])}
                className="mt-4 w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:text-primary hover:border-primary/30 transition-all"
              >
                <Plus className="size-4" /> {isCoach ? 'Añadir Serie Prescrita' : 'Añadir Serie Extra'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {!isCoach && (
            <button 
              onClick={reportPain}
              className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Bell className="size-5" /> Reportar Molestia / Saltar Ejercicio
            </button>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              {isCoach ? 'SIGUIENTE EN LA RUTINA' : 'SIGUIENTE EJERCICIO'}
            </h3>
            {currentExerciseIdx < selectedDay.exercises.length - 1 ? (
              <button 
                disabled={!allSetsCompleted && !isCoach}
                onClick={nextExercise}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                  allSetsCompleted || isCoach 
                    ? "bg-white/5 border-white/10 hover:border-primary/40" 
                    : "bg-white/5 border-white/5 opacity-40 grayscale cursor-not-allowed"
                )}
              >
                <div className="size-16 rounded-xl bg-slate-800 bg-cover bg-center shrink-0 overflow-hidden" style={{ backgroundImage: `url(${selectedDay.exercises[currentExerciseIdx + 1].video})` }}></div>
                <div className="flex-1">
                  <h4 className="font-bold">{selectedDay.exercises[currentExerciseIdx + 1].name}</h4>
                  <p className="text-sm text-slate-400">{selectedDay.exercises[currentExerciseIdx + 1].initialSets.length} Series • {selectedDay.exercises[currentExerciseIdx + 1].reps} Reps</p>
                </div>
                {allSetsCompleted || isCoach ? (
                  <ChevronRight className="size-5 text-primary" />
                ) : (
                  <Settings className="size-5 text-slate-600" />
                )}
              </button>
            ) : (
              <button 
                disabled={!allSetsCompleted && !isCoach}
                onClick={() => setView('summary')}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all",
                  allSetsCompleted || isCoach 
                    ? "bg-primary text-bg-dark shadow-xl shadow-primary/20" 
                    : "bg-white/5 text-slate-600 opacity-40 grayscale cursor-not-allowed"
                )}
              >
                FINALIZAR ENTRENAMIENTO
              </button>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showVideoEditor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVideoEditor(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-white/10 rounded-t-[32px] p-8 z-[70]"
            >
              <h3 className="text-2xl font-black italic mb-6">Cambiar Vídeo de Técnica</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enlace de Vídeo (YouTube/Vimeo)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-bg-dark px-4 text-slate-500">O subir archivo</span></div>
                </div>
                <button className="w-full h-14 border-2 border-dashed border-white/10 rounded-xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary transition-all">
                  <Camera className="size-5" /> Seleccionar Archivo MP4/MOV
                </button>
                <button 
                  onClick={() => setShowVideoEditor(false)}
                  className="w-full py-4 bg-primary text-bg-dark font-black rounded-xl mt-4"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const TimerScreen = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [mode, setMode] = useState<'stopwatch' | 'timer' | 'tabata'>('stopwatch');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMin, setPickerMin] = useState(1);
  const [pickerSec, setPickerSec] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'timer') {
          setTime((prev) => {
            if (prev <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prev - 10;
          });
        } else {
          setTime((prev) => prev + 10);
        }
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return {
      main: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      centi: centiseconds.toString().padStart(2, '0')
    };
  };

  const handleStartPause = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? (pickerMin * 60000 + pickerSec * 1000) : 0);
    setLaps([]);
  };

  const setTimerMode = (newMode: 'stopwatch' | 'timer' | 'tabata') => {
    setMode(newMode);
    setIsRunning(false);
    setTime(newMode === 'timer' ? (pickerMin * 60000 + pickerSec * 1000) : 0);
    setLaps([]);
  };

  const handleApplyPicker = () => {
    const newTime = (pickerMin * 60000) + (pickerSec * 1000);
    setTime(newTime);
    setShowPicker(false);
  };

  const handleLap = () => {
    if (isRunning) {
      setLaps([time, ...laps]);
    }
  };

  const timeDisplay = formatTime(time);

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="flex items-center justify-between p-4 border-b border-white/10 bg-bg-dark/50 sticky top-0 z-10 backdrop-blur-md">
        <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
          <Menu className="size-6" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Cronómetro</h1>
        <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
          <Settings className="size-6" />
        </button>
      </header>

      <nav className="flex border-b border-white/10 bg-bg-dark">
        <button 
          onClick={() => setTimerMode('stopwatch')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'stopwatch' ? "border-primary text-primary" : "border-transparent text-slate-500")}
        >
          Cronómetro
        </button>
        <button 
          onClick={() => setTimerMode('timer')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'timer' ? "border-primary text-primary" : "border-transparent text-slate-500")}
        >
          Temporizador
        </button>
        <button 
          onClick={() => setTimerMode('tabata')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'tabata' ? "border-primary text-primary" : "border-transparent text-slate-500")}
        >
          Tabata
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 mt-8">
        <div className="relative flex flex-col items-center justify-center">
          <svg className="size-72 md:size-80 transform -rotate-90">
            <circle className="text-primary/10" cx="50%" cy="50%" fill="transparent" r="48%" stroke="currentColor" strokeWidth="4" />
            <circle 
              className="text-primary transition-all duration-300" 
              cx="50%" cy="50%" fill="transparent" r="48%" stroke="currentColor" 
              strokeDasharray={mode === 'timer' ? `${(time / (pickerMin * 60000 + pickerSec * 1000)) * 300} 300` : `${(time % 60000) / 60000 * 300} 300`} 
              strokeWidth="6" 
              strokeLinecap="round"
            />
          </svg>
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              mode === 'timer' && !isRunning && "cursor-pointer hover:scale-105 transition-transform"
            )}
            onClick={() => mode === 'timer' && !isRunning && setShowPicker(true)}
          >
            <div className="flex items-baseline gap-1">
              <span className="text-6xl md:text-7xl font-extrabold tracking-tighter">{timeDisplay.main}</span>
              <span className="text-2xl font-bold text-primary neon-text">.{timeDisplay.centi}</span>
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400 mt-2">
              {mode === 'timer' && !isRunning ? 'Toca para ajustar' : (isRunning ? 'En curso' : 'Pausado')}
            </p>
          </div>
        </div>

        {mode === 'tabata' && (
          <div className="w-full max-w-sm grid grid-cols-2 gap-4">
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col items-center">
              <span className="text-xs font-bold text-primary uppercase mb-1">Trabajo</span>
              <span className="text-2xl font-bold">20s</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase mb-1">Descanso</span>
              <span className="text-2xl font-bold">10s</span>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 max-h-48 overflow-y-auto no-scrollbar">
          {laps.map((lapTime, i) => {
            const lapDisplay = formatTime(lapTime);
            return (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400 font-medium">Vuelta {laps.length - i}</span>
                <span className={cn("font-mono font-bold", i === 0 ? "text-primary" : "text-white")}>
                  {lapDisplay.main}.{lapDisplay.centi}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      <div className="px-6 py-8 flex items-center justify-center gap-6">
        <button 
          onClick={handleReset}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 text-white hover:scale-105 transition-transform active:scale-95"
        >
          <History className="size-8" />
        </button>
        <button 
          onClick={handleStartPause}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-bg-dark shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:scale-110 transition-transform active:scale-95"
        >
          {isRunning ? <div className="size-10 flex gap-2 items-center justify-center"><div className="w-3 h-10 bg-bg-dark rounded-sm"></div><div className="w-3 h-10 bg-bg-dark rounded-sm"></div></div> : <Play className="size-10 fill-current" />}
        </button>
        <button 
          onClick={handleLap}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 text-white hover:scale-105 transition-transform active:scale-95"
        >
          <TimerIcon className="size-8" />
        </button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-bg-dark border border-white/10 rounded-3xl p-8 z-[70] shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 text-center">Ajustar Temporizador</h3>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutos</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="99"
                    value={pickerMin}
                    onChange={(e) => setPickerMin(parseInt(e.target.value) || 0)}
                    className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <span className="text-3xl font-bold mt-6">:</span>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Segundos</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    value={pickerSec}
                    onChange={(e) => setPickerSec(parseInt(e.target.value) || 0)}
                    className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPicker(false)}
                  className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 active:scale-95 transition-transform"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleApplyPicker}
                  className="flex-1 py-4 bg-primary text-bg-dark font-bold rounded-xl active:scale-95 transition-transform"
                >
                  Aplicar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const NutritionScreen = ({ isCoach, clientData }: { isCoach?: boolean; clientData?: Client | null }) => {
  const [selectedDay, setSelectedDay] = useState(2); // 0: Mon, 1: Tue, 2: Wed, etc.
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weekDates = [22, 23, 24, 25, 26, 27, 28];

  const [nutritionPlan, setNutritionPlan] = useState<DailyNutrition[]>(() => {
    const saved = localStorage.getItem(`nutritionPlan_${clientData?.id || 'default'}`);
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 7 }, (_, i) => ({
      day: days[i],
      meals: i === 2 ? [
        { 
          name: 'Desayuno', 
          desc: 'Avena con bayas y proteína', 
          kcal: 420, 
          time: '08:30 AM', 
          checked: true,
          ingredients: [
            { name: 'Avena integral', amount: '60g', protein: 8, carbs: 40, fats: 4 },
            { name: 'Proteína de suero', amount: '30g', protein: 24, carbs: 2, fats: 1 },
            { name: 'Arándanos frescos', amount: '50g', protein: 0, carbs: 7, fats: 0 },
          ]
        },
        { 
          name: 'Comida', 
          desc: 'Ensalada de pollo a la plancha', 
          kcal: 580, 
          time: '01:15 PM', 
          checked: true,
          ingredients: [
            { name: 'Pechuga de pollo', amount: '150g', protein: 45, carbs: 0, fats: 3 },
            { name: 'Mezcla de lechugas', amount: '100g', protein: 1, carbs: 3, fats: 0 },
            { name: 'Aceite de oliva', amount: '10ml', protein: 0, carbs: 0, fats: 9 },
          ]
        },
        { 
          name: 'Cena', 
          desc: 'Salmón con quinoa y espárragos', 
          kcal: 450, 
          time: '07:00 PM', 
          checked: false,
          ingredients: [
            { name: 'Salmón fresco', amount: '120g', protein: 25, carbs: 0, fats: 15 },
            { name: 'Quinoa cocida', amount: '100g', protein: 4, carbs: 21, fats: 2 },
          ]
        },
        { 
          name: 'Merienda', 
          desc: 'Yogur griego y almendras', 
          kcal: 150, 
          time: '09:30 PM', 
          checked: false,
          ingredients: [
            { name: 'Yogur griego natural', amount: '125g', protein: 12, carbs: 5, fats: 0 },
            { name: 'Almendras', amount: '15g', protein: 3, carbs: 3, fats: 8 },
          ]
        },
      ] : []
    }));
  });

  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem(`nutritionTargets_${clientData?.id || 'default'}`);
    return saved ? JSON.parse(saved) : { protein: 150, carbs: 250, fats: 70, kcal: 2200 };
  });

  useEffect(() => {
    localStorage.setItem(`nutritionPlan_${clientData?.id || 'default'}`, JSON.stringify(nutritionPlan));
  }, [nutritionPlan, clientData?.id]);

  useEffect(() => {
    localStorage.setItem(`nutritionTargets_${clientData?.id || 'default'}`, JSON.stringify(targets));
  }, [targets, clientData?.id]);

  useEffect(() => {
    const savedPdf = localStorage.getItem(`nutritionPdf_${clientData?.id || 'default'}`);
    if (savedPdf) setPdfUrl(savedPdf);
  }, [clientData?.id]);

  const currentDaily = nutritionPlan[selectedDay];
  const currentMeals = currentDaily.meals;

  // Calculate Macros
  const calculateDailyMacros = (meals: Meal[]) => {
    return meals.reduce((acc, meal) => {
      meal.ingredients.forEach(ing => {
        acc.protein += ing.protein;
        acc.carbs += ing.carbs;
        acc.fats += ing.fats;
        acc.kcal += (ing.protein * 4) + (ing.carbs * 4) + (ing.fats * 9);
      });
      return acc;
    }, { protein: 0, carbs: 0, fats: 0, kcal: 0 });
  };

  const dailyMacros = calculateDailyMacros(currentMeals);

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPdfUrl(base64);
      localStorage.setItem(`nutritionPdf_${clientData?.id || 'default'}`, base64);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                data: base64.split(',')[1],
                mimeType: "application/pdf"
              }
            },
            {
              text: `Extract the nutrition plan from this PDF. 
              Return a JSON array of exactly 7 objects (one for each day of the week, starting Monday). 
              Each object MUST have:
              - 'day': string (e.g. 'Lunes')
              - 'meals': array of objects
              
              Each meal object MUST have:
              - 'name': string (e.g. 'Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena')
              - 'desc': string (short description of the meal)
              - 'time': string (e.g. '08:00', '14:30')
              - 'kcal': number (estimated total calories for the meal)
              - 'ingredients': array of objects
              
              Each ingredient object MUST have:
              - 'name': string (the food item)
              - 'amount': string (e.g. '100g', '2 unidades', '1 cucharada')
              - 'protein': number (grams of protein)
              - 'carbs': number (grams of carbohydrates)
              - 'fats': number (grams of fats)
              
              Ensure the output is ONLY the JSON array. If a day is missing in the PDF, return an empty meals array for that day.`
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed)) {
          setNutritionPlan(parsed.map((d: any, i: number) => ({
            day: days[i],
            meals: d.meals.map((m: any) => ({ ...m, checked: false }))
          })));
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        alert("Error al procesar el PDF. Asegúrate de que el formato sea legible.");
      } finally {
        setIsParsingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateShoppingList = () => {
    const list: Record<string, Set<string>> = {};
    nutritionPlan.forEach(day => {
      day.meals.forEach(meal => {
        meal.ingredients.forEach(ing => {
          const name = ing.name.trim().toLowerCase();
          if (!list[name]) list[name] = new Set();
          list[name].add(ing.amount);
        });
      });
    });
    // Convert back to record with arrays and capitalized names
    const result: Record<string, string[]> = {};
    Object.entries(list).forEach(([name, amounts]) => {
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      result[capitalized] = Array.from(amounts);
    });
    return result;
  };

  const handleClearPlan = () => {
    if (confirm("¿Estás seguro de que quieres borrar todo el plan nutricional?")) {
      setNutritionPlan(Array.from({ length: 7 }, (_, i) => ({
        day: days[i],
        meals: []
      })));
      setPdfUrl(null);
      localStorage.removeItem(`nutritionPdf_${clientData?.id || 'default'}`);
    }
  };

  const exportShoppingListPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Lista de la Compra Semanal", 20, 20);
    doc.setFontSize(12);
    
    const shoppingList = generateShoppingList();
    let y = 40;
    Object.entries(shoppingList).forEach(([name, amounts]) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${name}: ${amounts.join(', ')}`, 20, y);
      y += 10;
    });
    
    doc.save("lista-compra-semanal.pdf");
  };

  const handleAddMeal = () => {
    const newMeal: Meal = {
      name: 'Nueva Comida',
      desc: 'Descripción de la comida',
      kcal: 0,
      time: '12:00 PM',
      checked: false,
      ingredients: []
    };
    const newPlan = [...nutritionPlan];
    newPlan[selectedDay].meals.push(newMeal);
    setNutritionPlan(newPlan);
    setSelectedMeal(newMeal);
  };

  const updateMeal = (updatedMeal: Meal) => {
    const newPlan = [...nutritionPlan];
    const mealIdx = newPlan[selectedDay].meals.findIndex(m => m === selectedMeal);
    if (mealIdx !== -1) {
      newPlan[selectedDay].meals[mealIdx] = updatedMeal;
      setNutritionPlan(newPlan);
      setSelectedMeal(updatedMeal);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="bg-bg-dark sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Utensils className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight tracking-tight">
                {isCoach ? `Nutrición: ${clientData?.name}` : 'Mi Nutrición'}
              </h2>
              <p className="text-slate-400 text-xs">{days[selectedDay]}, {weekDates[selectedDay]} Oct</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowWeeklyView(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary hover:bg-primary/10 transition-colors"
              title="Vista Semanal"
            >
              <CalendarDays className="size-5" />
            </button>
            <button 
              onClick={() => setShowShoppingList(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary hover:bg-primary/10 transition-colors"
              title="Lista de la Compra"
            >
              <ShoppingCart className="size-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between px-4 pb-4 overflow-x-auto no-scrollbar gap-2">
          {days.map((day, i) => (
            <button 
              key={i}
              onClick={() => setSelectedDay(i)}
              className={cn(
                "flex flex-col items-center min-w-[44px] py-3 rounded-2xl transition-all",
                selectedDay === i ? "bg-primary text-bg-dark" : "bg-white/5 text-slate-400"
              )}
            >
              <span className="text-[10px] font-bold uppercase mb-1">{day}</span>
              <span className="text-base font-black">{weekDates[i]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isCoach && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Objetivos Diarios (Coach)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kcal</label>
                <input 
                  type="number" 
                  value={targets.kcal}
                  onChange={(e) => setTargets({ ...targets, kcal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Prot (g)</label>
                <input 
                  type="number" 
                  value={targets.protein}
                  onChange={(e) => setTargets({ ...targets, protein: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Carb (g)</label>
                <input 
                  type="number" 
                  value={targets.carbs}
                  onChange={(e) => setTargets({ ...targets, carbs: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Gras (g)</label>
                <input 
                  type="number" 
                  value={targets.fats}
                  onChange={(e) => setTargets({ ...targets, fats: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {isCoach && (
          <div className="flex gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all">
              <Upload className="size-5 text-primary" />
              <span className="text-sm font-bold">{isParsingPdf ? 'Procesando...' : 'Subir PDF Nutrición'}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isParsingPdf} />
            </label>
            {pdfUrl && (
              <button 
                onClick={() => window.open(pdfUrl)}
                className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 text-primary font-bold hover:bg-primary/20 transition-all"
              >
                <Eye className="size-5" /> Ver PDF
              </button>
            )}
            <button 
              onClick={handleClearPlan}
              className="flex size-14 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
              title="Borrar Plan"
            >
              <Trash2 className="size-6" />
            </button>
          </div>
        )}

        {!isCoach && pdfUrl && (
          <button 
            onClick={() => window.open(pdfUrl)}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-4 text-primary font-bold hover:bg-primary/20 transition-all"
          >
            <FileText className="size-5" /> Ver Plan Nutricional (PDF)
          </button>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proteínas', current: Math.round(dailyMacros.protein), target: targets.protein, color: 'text-primary' },
            { label: 'Carbos', current: Math.round(dailyMacros.carbs), target: targets.carbs, color: 'text-blue-400' },
            { label: 'Grasas', current: Math.round(dailyMacros.fats), target: targets.fats, color: 'text-orange-400' },
          ].map((macro) => (
            <div key={macro.label} className="flex flex-col items-center gap-3 rounded-xl p-4 glass-card">
              <div className="relative flex items-center justify-center">
                <svg className="size-16">
                  <circle className="text-white/10" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
                  <circle 
                    className={cn(macro.color, "transition-all duration-500")}
                    cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                    strokeDasharray="176" strokeDashoffset={176 - (176 * Math.min(100, (macro.current / macro.target) * 100)) / 100} 
                    strokeLinecap="round" strokeWidth="4" 
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold">{Math.round((macro.current / macro.target) * 100)}%</span>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">{macro.label}</p>
                <p className="text-[10px] font-bold">{macro.current}g / {macro.target}g</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold tracking-tight">
              {isCoach ? 'Plan Nutricional' : 'Comidas de hoy'}
            </h3>
            <span className="text-primary text-sm font-medium">{Math.round(dailyMacros.kcal)} kcal consumidas</span>
          </div>
          <div className="space-y-3">
            {currentMeals.length > 0 ? currentMeals.map((meal, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedMeal(meal)}
                className="flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-6 rounded border flex items-center justify-center transition-colors",
                    meal.checked ? "bg-primary border-primary" : "border-slate-500"
                  )}>
                    {meal.checked && <Check className="size-4 text-bg-dark font-bold" />}
                  </div>
                  <div className="flex flex-col">
                    <p className={cn("font-semibold", meal.checked && !isCoach && "line-through text-slate-500")}>{meal.name}</p>
                    <p className="text-slate-400 text-sm">{meal.desc}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-medium">{meal.kcal} kcal</p>
                    <p className="text-slate-400 text-xs">{meal.time}</p>
                  </div>
                  {isCoach && <Settings className="size-5 text-slate-500 group-hover:text-primary transition-colors" />}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-slate-500 font-medium">No hay comidas programadas para hoy</p>
              </div>
            )}
          </div>
          {isCoach && (
            <button 
              onClick={handleAddMeal}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-bg-dark font-bold hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="size-5" /> Prescribir Comida
            </button>
          )}
        </div>
      </main>

      {/* Meal Detail / Edit Modal */}
      <AnimatePresence>
        {selectedMeal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMeal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-white/10 rounded-t-[32px] p-6 z-[70] max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              
              {isCoach ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-primary italic">Editar Comida</h3>
                    <button onClick={() => setSelectedMeal(null)} className="text-slate-500 hover:text-white"><Plus className="size-6 rotate-45" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nombre de la Comida</label>
                      <input 
                        type="text" 
                        value={selectedMeal.name}
                        onChange={(e) => updateMeal({ ...selectedMeal, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Descripción / Notas</label>
                      <input 
                        type="text" 
                        value={selectedMeal.desc}
                        onChange={(e) => updateMeal({ ...selectedMeal, desc: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Hora</label>
                        <input 
                          type="text" 
                          value={selectedMeal.time}
                          onChange={(e) => updateMeal({ ...selectedMeal, time: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Kcal Totales</label>
                        <input 
                          type="number" 
                          value={selectedMeal.kcal}
                          onChange={(e) => updateMeal({ ...selectedMeal, kcal: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Ingredientes</h4>
                      <button 
                        onClick={() => updateMeal({
                          ...selectedMeal,
                          ingredients: [...selectedMeal.ingredients, { name: '', amount: '', protein: 0, carbs: 0, fats: 0 }]
                        })}
                        className="text-primary text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="size-3" /> Añadir
                      </button>
                    </div>
                    <div className="space-y-3">
                      {selectedMeal.ingredients.map((ing, idx) => (
                        <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Nombre"
                              value={ing.name}
                              onChange={(e) => {
                                const newIngs = [...selectedMeal.ingredients];
                                newIngs[idx].name = e.target.value;
                                updateMeal({ ...selectedMeal, ingredients: newIngs });
                              }}
                              className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Cant."
                              value={ing.amount}
                              onChange={(e) => {
                                const newIngs = [...selectedMeal.ingredients];
                                newIngs[idx].amount = e.target.value;
                                updateMeal({ ...selectedMeal, ingredients: newIngs });
                              }}
                              className="w-20 bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-center outline-none"
                            />
                            <button 
                              onClick={() => {
                                const newIngs = selectedMeal.ingredients.filter((_, i) => i !== idx);
                                updateMeal({ ...selectedMeal, ingredients: newIngs });
                              }}
                              className="text-red-500 p-2"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">Prot (g)</span>
                              <input 
                                type="number" 
                                value={ing.protein}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].protein = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-1 text-xs text-center outline-none"
                              />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">Carb (g)</span>
                              <input 
                                type="number" 
                                value={ing.carbs}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].carbs = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-1 text-xs text-center outline-none"
                              />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">Gras (g)</span>
                              <input 
                                type="number" 
                                value={ing.fats}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].fats = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-1 text-xs text-center outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newPlan = [...nutritionPlan];
                      newPlan[selectedDay].meals = newPlan[selectedDay].meals.filter(m => m !== selectedMeal);
                      setNutritionPlan(newPlan);
                      setSelectedMeal(null);
                    }}
                    className="w-full py-4 text-red-500 font-bold border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Eliminar Comida
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-primary italic">{selectedMeal.name}</h3>
                      <p className="text-slate-400 font-medium">{selectedMeal.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{selectedMeal.kcal}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase">KCAL TOTALES</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Ingredientes y Macros</h4>
                    <div className="space-y-3">
                      {selectedMeal.ingredients.map((ing: Ingredient, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-white">{ing.name}</p>
                            <p className="text-primary font-black">{ing.amount}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center bg-black/20 rounded-lg py-2">
                              <p className="text-[8px] text-slate-500 font-bold uppercase">Prot</p>
                              <p className="text-xs font-bold">{ing.protein}g</p>
                            </div>
                            <div className="text-center bg-black/20 rounded-lg py-2">
                              <p className="text-[8px] text-slate-500 font-bold uppercase">Carb</p>
                              <p className="text-xs font-bold">{ing.carbs}g</p>
                            </div>
                            <div className="text-center bg-black/20 rounded-lg py-2">
                              <p className="text-[8px] text-slate-500 font-bold uppercase">Gras</p>
                              <p className="text-xs font-bold">{ing.fats}g</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newPlan = [...nutritionPlan];
                      const dayIdx = selectedDay;
                      const mealIdx = newPlan[dayIdx].meals.findIndex(m => m === selectedMeal);
                      newPlan[dayIdx].meals[mealIdx].checked = !newPlan[dayIdx].meals[mealIdx].checked;
                      setNutritionPlan(newPlan);
                      setSelectedMeal(null);
                    }}
                    className={cn(
                      "w-full mt-8 py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all",
                      selectedMeal.checked ? "bg-white/10 text-white" : "bg-primary text-bg-dark"
                    )}
                  >
                    {selectedMeal.checked ? 'DESMARCAR COMIDA' : 'MARCAR COMO COMPLETADA'}
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Weekly View Modal */}
      <AnimatePresence>
        {showWeeklyView && (
          <div className="fixed inset-0 z-[100] bg-bg-dark overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic text-primary">Plan Semanal</h2>
              <button onClick={() => setShowWeeklyView(false)} className="size-12 bg-white/5 rounded-full flex items-center justify-center"><Plus className="size-8 rotate-45" /></button>
            </div>
            <div className="space-y-6">
              {nutritionPlan.map((day, i) => {
                const macros = calculateDailyMacros(day.meals);
                return (
                  <div key={i} className="glass-card rounded-3xl p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">{day.day} - {weekDates[i]} Oct</h3>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{Math.round(macros.kcal)} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center bg-black/20 rounded-xl py-2">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">P</p>
                        <p className="text-xs font-bold">{Math.round(macros.protein)}g</p>
                      </div>
                      <div className="text-center bg-black/20 rounded-xl py-2">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">C</p>
                        <p className="text-xs font-bold">{Math.round(macros.carbs)}g</p>
                      </div>
                      <div className="text-center bg-black/20 rounded-xl py-2">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">G</p>
                        <p className="text-xs font-bold">{Math.round(macros.fats)}g</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.meals.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-400">{m.name} - {m.desc}</span>
                          <span className="font-medium">{m.kcal} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopping List Modal */}
      <AnimatePresence>
        {showShoppingList && (
          <div className="fixed inset-0 z-[100] bg-bg-dark overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic text-primary">Lista de la Compra</h2>
              <button onClick={() => setShowShoppingList(false)} className="size-12 bg-white/5 rounded-full flex items-center justify-center"><Plus className="size-8 rotate-45" /></button>
            </div>
            <div className="glass-card rounded-3xl p-6 border border-white/5 mb-8">
              <div className="space-y-4">
                {Object.entries(generateShoppingList()).map(([name, amounts], i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold">{name}</span>
                    <span className="text-slate-400 text-sm">{amounts.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportShoppingListPdf}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-bg-dark py-4 rounded-2xl font-black shadow-xl"
              >
                <Download className="size-5" /> EXPORTAR PDF
              </button>
              <button 
                onClick={() => {
                  const list = generateShoppingList();
                  const text = Object.entries(list).map(([n, a]) => `${n}: ${a.join(', ')}`).join('\n');
                  navigator.clipboard.writeText(text);
                  alert("Lista copiada al portapapeles");
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white py-4 rounded-2xl font-black border border-white/10"
              >
                <Share2 className="size-5" /> COMPARTIR
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProgressScreen = ({ isCoach, clientData }: { isCoach?: boolean; clientData?: Client | null }) => {
  const [range, setRange] = useState('1M');
  const [activeTab, setActiveTab] = useState<'resumen' | 'historial' | 'logros' | 'fotos'>('resumen');
  const [photos, setPhotos] = useState<ProgressPhoto[]>(() => {
    const saved = localStorage.getItem(`progressPhotos_${clientData?.id || 'default'}`);
    return saved ? JSON.parse(saved) : [
      { id: '1', date: '12 Ene, 2024', label: 'Inicio', img: 'https://picsum.photos/seed/p1/300/400' },
      { id: '2', date: '05 Feb, 2024', label: 'Semana 4', img: 'https://picsum.photos/seed/p2/300/400' },
    ];
  });

  const achievements: Achievement[] = [
    { id: '1', title: 'Primer Paso', description: 'Primer entrenamiento completado', icon: 'Dumbbell', category: 'training', completed: true },
    { id: '2', title: 'Constancia de Hierro', description: 'Racha de 7 días entrenando', icon: 'Flame', category: 'training', completed: true },
    { id: '3', title: 'Hidratación Pro', description: '100 litros de agua bebidos', icon: 'Droplets', category: 'habits', completed: true },
    { id: '4', title: 'Madrugador', description: 'Entrenar antes de las 8 AM', icon: 'Sun', category: 'training', completed: false },
    { id: '5', title: 'Guerrero del Finde', description: 'Entrenar Sábado y Domingo', icon: 'Sword', category: 'training', completed: false },
    { id: '6', title: 'Chef Fitness', description: '7 días cumpliendo macros', icon: 'Utensils', category: 'nutrition', completed: true },
    { id: '7', title: 'Transformación', description: 'Subir 4 fotos de progreso', icon: 'Camera', category: 'habits', completed: false },
    { id: '8', title: 'Fuerza Bruta', description: 'Nuevo récord en Sentadilla', icon: 'Trophy', category: 'training', completed: false },
    { id: '9', title: 'Sueño Reparador', description: '3 días con sueño excelente', icon: 'Moon', category: 'habits', completed: true },
    { id: '10', title: 'Caminante', description: 'Objetivo de pasos semanal cumplido', icon: 'Footprints', category: 'habits', completed: true },
  ];

  useEffect(() => {
    localStorage.setItem(`progressPhotos_${clientData?.id || 'default'}`, JSON.stringify(photos));
  }, [photos, clientData?.id]);

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: ProgressPhoto = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            label: `Semana ${photos.length + 1}`,
            img: event.target?.result as string
          };
          setPhotos(prev => [newPhoto, ...prev]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const latestWeight = (() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${today}`);
    if (saved) {
      const log = JSON.parse(saved);
      if (log.weight) return `${log.weight} kg`;
    }
    return isCoach ? clientData?.weight : '82.5 kg';
  })();

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="sticky top-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center p-4 justify-between max-w-7xl mx-auto">
          <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
            <Menu className="size-6" />
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {isCoach ? `Progreso: ${clientData?.name}` : 'Mi Progreso'}
          </h1>
          <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
            <Bell className="size-6" />
          </button>
        </div>
        <nav className="flex border-b border-white/10 px-4 gap-8 max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'historial', label: 'Historial' },
            { id: 'logros', label: 'Logros' },
            { id: 'fotos', label: 'Fotos' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 pt-4 whitespace-nowrap text-sm font-bold border-b-2 transition-all",
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-500"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'resumen' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium uppercase">Peso Actual</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{latestWeight}</p>
                  <span className="text-red-500 text-xs font-bold">-1.2%</span>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium uppercase">Grasa Corp.</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{isCoach ? clientData?.bodyFat : '18.4%'}</p>
                  <span className="text-primary text-xs font-bold">-0.5%</span>
                </div>
              </div>
            </div>

            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Progreso de Peso</h2>
                <div className="flex gap-2">
                  {['1M', '3M', '1Y'].map((r) => (
                    <button 
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold transition-colors",
                        range === r ? "bg-primary text-bg-dark" : "bg-white/10 text-white"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48 flex items-end justify-between gap-2">
                {[80, 75, 78, 72, 70, 68, 65, 62].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                    <div 
                      className={cn("absolute bottom-0 w-full rounded-t-sm transition-all duration-500", i === 7 ? "bg-primary" : "bg-primary/40")} 
                      style={{ height: `${range === '1M' ? h : h * 0.8}%` }} 
                    />
                    {i === 7 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary neon-text">{latestWeight.split(' ')[0]}</div>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                <span>{range === '1M' ? 'Sem 1' : 'Ene'}</span>
                <span>{range === '1M' ? 'Sem 4' : 'Jun'}</span>
                <span>Actual</span>
              </div>
            </section>
          </>
        )}

        {activeTab === 'logros' && (
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={cn(
                  "glass-card rounded-2xl p-4 flex flex-col items-center text-center gap-2 border-2 transition-all",
                  achievement.completed ? "border-primary/20 bg-primary/5" : "border-white/5 opacity-40 grayscale"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full mb-1",
                  achievement.completed ? "bg-primary text-bg-dark" : "bg-white/10 text-slate-400"
                )}>
                  {achievement.icon === 'Dumbbell' && <Dumbbell className="size-6" />}
                  {achievement.icon === 'Flame' && <Flame className="size-6" />}
                  {achievement.icon === 'Droplets' && <Droplets className="size-6" />}
                  {achievement.icon === 'Sun' && <Sun className="size-6" />}
                  {achievement.icon === 'Sword' && <Sword className="size-6" />}
                  {achievement.icon === 'Utensils' && <Utensils className="size-6" />}
                  {achievement.icon === 'Camera' && <Camera className="size-6" />}
                  {achievement.icon === 'Trophy' && <Trophy className="size-6" />}
                  {achievement.icon === 'Moon' && <Moon className="size-6" />}
                  {achievement.icon === 'Footprints' && <Footprints className="size-6" />}
                </div>
                <h4 className="font-bold text-sm leading-tight">{achievement.title}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fotos' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Galería de Evolución</h2>
              <button 
                onClick={handleAddPhoto}
                className="text-primary text-sm font-bold flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
              >
                {isCoach ? 'Subir para Cliente' : 'Añadir Foto'} <Camera className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 group">
                  <img src={photo.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Progress" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xs font-bold">{photo.date}</p>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-wider">{photo.label}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleAddPhoto}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-all cursor-pointer bg-white/5"
              >
                <PlusCircle className="size-8 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nueva Foto</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'historial' && (
          <div className="glass-panel rounded-xl p-6 text-center py-12">
            <TrendingUp className="size-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Próximamente</h3>
            <p className="text-sm text-slate-500 mt-2">Estamos preparando el historial detallado de tus métricas.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const ProfileScreen = ({ userRole, clientData, coachData, onLogout }: { userRole: 'admin' | 'client' | null; clientData: Client | null; coachData: Coach | null; onLogout: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [assignedCoachId, setAssignedCoachId] = useState(clientData?.assignedCoachId || '');

  const isViewingClient = userRole === 'admin' && clientData !== null;
  const isCoachSelf = userRole === 'admin' && clientData === null;

  const [editedData, setEditedData] = useState({
    name: isViewingClient ? clientData?.name || '' : (isCoachSelf ? coachData?.name || '' : 'Sarah Jenkins'),
    img: isViewingClient ? clientData?.img || '' : (isCoachSelf ? coachData?.img || '' : 'https://picsum.photos/seed/sarah/200/200')
  });

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditedData(prev => ({ ...prev, img: event.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const latestWeight = (() => {
    if (isCoachSelf) return null;
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${today}`);
    if (saved) {
      const log = JSON.parse(saved);
      if (log.weight) return `${log.weight} kg`;
    }
    return isViewingClient ? clientData?.weight : '64.2 kg';
  })();

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="flex items-center p-4 justify-between border-b border-white/10 sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md">
        <h2 className="text-lg font-bold tracking-tight">
          {isViewingClient ? `Perfil: ${clientData?.name}` : (isCoachSelf ? 'Mi Perfil (Coach)' : 'Mi Perfil')}
        </h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-primary font-bold text-sm"
        >
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <main className="p-6">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="relative group">
            <div className="size-32 rounded-full border-4 border-primary overflow-hidden relative">
              <img src={editedData.img} className="w-full h-full object-cover" alt="Profile" />
              {isEditing && (
                <button 
                  onClick={handleImageUpload}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="size-8 text-white" />
                </button>
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-bg-dark rounded-full p-1 border-2 border-bg-dark">
              <Verified className="size-4" />
            </div>
          </div>
          <div className="text-center w-full">
            {isEditing ? (
              <input 
                type="text"
                value={editedData.name}
                onChange={(e) => setEditedData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-2xl font-bold text-center w-full focus:ring-2 focus:ring-primary outline-none"
              />
            ) : (
              <h3 className="text-2xl font-bold tracking-tight">{editedData.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-1 justify-center">
              <span className="size-2 rounded-full bg-primary neon-text"></span>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                {isCoachSelf ? 'ENTRENADOR ÉLITE' : (clientData?.active || userRole === 'client' ? 'ACTIVA' : 'EN PAUSA')} • RACHA DE 8 MESES
              </p>
            </div>
          </div>
        </div>

        {!isCoachSelf && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="glass-card rounded-xl p-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Peso Actual</p>
              <p className="text-xl font-bold">{latestWeight}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Grasa Corporal</p>
              <p className="text-xl font-bold">{isViewingClient ? clientData?.bodyFat : '21.4%'}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isViewingClient && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asignación de Entrenador</p>
              <select 
                value={assignedCoachId}
                onChange={(e) => setAssignedCoachId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="" disabled>Seleccionar Entrenador</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 italic">Como administrador, puedes reasignar este cliente a otro coach.</p>
            </div>
          )}

          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <Settings className="size-5 text-slate-400" />
              <span className="font-semibold">{isViewingClient ? 'Ajustes del Cliente' : 'Ajustes de cuenta'}</span>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </button>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Soporte Directo</p>
            {coaches.map((coach, i) => (
              <button 
                key={i}
                onClick={() => {
                  const message = encodeURIComponent(`Hola ${coach.name}, necesito soporte con mi plan.`);
                  window.open(`https://wa.me/${coach.phone}?text=${message}`, '_blank');
                }}
                className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <MessageCircle className="size-4 text-green-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block text-sm">Soporte con {coach.name}</span>
                    <span className="text-[10px] text-slate-500">WhatsApp Directo</span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400" />
              </button>
            ))}
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center p-4 mt-6 text-red-500 font-bold border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="size-5 mr-2" /> Cerrar sesión
          </button>
        </div>
      </main>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-bg-dark flex flex-col"
          >
            <header className="flex items-center p-4 border-b border-white/10">
              <button onClick={() => setShowSettings(false)} className="p-2">
                <ChevronLeft className="size-6" />
              </button>
              <h2 className="text-lg font-bold ml-2">Ajustes de Cuenta</h2>
            </header>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Notificaciones</h3>
                <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Notificaciones Push</span>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 size-4 bg-bg-dark rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Recordatorios de Agua</span>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 size-4 bg-bg-dark rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Seguridad</h3>
                <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Cambiar Contraseña</span>
                  <ChevronRight className="size-5 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Privacidad de Datos</span>
                  <ChevronRight className="size-5 text-slate-400" />
                </button>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-primary text-bg-dark font-bold rounded-xl"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loggedInCoach, setLoggedInCoach] = useState<Coach | null>(null);

  const showNav = !['onboarding', 'login', 'welcome', 'register'].includes(screen);

  const handleLogin = (role: 'admin' | 'client') => {
    setUserRole(role);
    if (role === 'admin') {
      setLoggedInCoach(coaches[0]); // Default to first coach for demo
      setScreen('dashboard');
    } else {
      setScreen('home');
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setScreen('home');
  };

  const isCoachViewing = userRole === 'admin' && selectedClient !== null;

  return (
    <div className="bg-bg-dark min-h-screen font-sans">
      {isCoachViewing && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full overflow-hidden border border-primary/40">
              <img src={selectedClient.img} className="w-full h-full object-cover" alt={selectedClient.name} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Modo Edición: <span className="text-white">{selectedClient.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                // Simulate saving
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-bg-dark px-6 py-3 rounded-full font-bold shadow-xl z-[100] animate-bounce';
                toast.innerText = '✓ Cambios guardados correctamente';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              }}
              className="text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white px-3 py-1 rounded hover:bg-white/20 transition-colors"
            >
              Guardar
            </button>
            <button 
              onClick={() => {
                setSelectedClient(null);
                setScreen('dashboard');
              }}
              className="text-[10px] font-bold uppercase tracking-widest bg-primary text-bg-dark px-3 py-1 rounded"
            >
              Salir
            </button>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'welcome' && (
            <WelcomeScreen 
              onLogin={() => setScreen('login')} 
            />
          )}
          {screen === 'register' && (
            <RegisterScreen 
              onRegister={() => setScreen('onboarding')} 
              onBack={() => setScreen('dashboard')}
            />
          )}
          {screen === 'onboarding' && <OnboardingScreen onComplete={() => setScreen('dashboard')} />}
          {screen === 'login' && (
            <LoginScreen 
              onLogin={handleLogin} 
            />
          )}
          {screen === 'home' && <HomeScreen isCoach={isCoachViewing} clientData={selectedClient || (userRole === 'client' ? clients[0] : null)} />}
          {screen === 'dashboard' && (
            <DashboardScreen 
              coach={loggedInCoach}
              onAddClient={() => setScreen('register')} 
              onSelectClient={handleSelectClient}
            />
          )}
          {screen === 'workout' && <WorkoutScreen isCoach={isCoachViewing} clientData={selectedClient} />}
          {screen === 'timer' && <TimerScreen />}
          {screen === 'nutrition' && <NutritionScreen isCoach={isCoachViewing} clientData={selectedClient} />}
          {screen === 'progress' && <ProgressScreen isCoach={isCoachViewing} clientData={selectedClient} />}
          {screen === 'profile' && (
            <ProfileScreen 
              userRole={userRole}
              clientData={selectedClient}
              coachData={loggedInCoach}
              onLogout={() => {
                setUserRole(null);
                setSelectedClient(null);
                setLoggedInCoach(null);
                setScreen('welcome');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav active={screen} onChange={setScreen} role={userRole} />}
    </div>
  );
}
