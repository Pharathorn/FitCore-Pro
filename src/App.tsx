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
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
type Screen = 'dashboard' | 'workout' | 'timer' | 'nutrition' | 'progress' | 'profile' | 'onboarding' | 'login' | 'welcome' | 'register';

// --- Components ---

const BottomNav = ({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) => {
  const navItems = [
    { id: 'workout', label: 'Entrenar', icon: Dumbbell },
    { id: 'timer', label: 'Cronómetro', icon: TimerIcon },
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

// --- Screens ---

const DashboardScreen = () => {
  const engagementData = [
    { day: 'MON', value: 65 },
    { day: 'TUE', value: 85 },
    { day: 'WED', value: 45 },
    { day: 'THU', value: 95 },
    { day: 'FRI', value: 70 },
    { day: 'SAT', value: 30 },
    { day: 'SUN', value: 20 },
  ];

  const clients = [
    { name: 'Sarah Jenkins', program: 'Powerlifting • Phase 2', status: 'Today', active: true, img: 'https://picsum.photos/seed/sarah/100/100' },
    { name: 'Marcus Chen', program: 'Hypertrophy • Week 4', status: '2 days ago', active: false, img: 'https://picsum.photos/seed/marcus/100/100' },
    { name: 'Elena Rodriguez', program: 'Endurance • Advanced', status: 'Yesterday', active: true, img: 'https://picsum.photos/seed/elena/100/100' },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
      <header className="flex items-center p-4 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-primary/30">
          <img src="https://picsum.photos/seed/coach/100/100" className="w-full h-full object-cover" alt="Coach" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-xs text-slate-400 font-medium">Welcome back,</p>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Coach Alex</h2>
        </div>
        <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-5" />
        </button>
      </header>

      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex-1 min-w-[140px] glass-card rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Clients</p>
          <p className="text-2xl font-bold mt-1">124</p>
          <div className="flex items-center gap-1 mt-1 text-primary">
            <TrendingUp className="size-3" />
            <span className="text-xs font-bold">+5.2%</span>
          </div>
        </div>
        <div className="flex-1 min-w-[140px] glass-card rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Now</p>
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
              <h3 className="text-base font-bold">Weekly Engagement</h3>
              <p className="text-slate-400 text-xs">Average activity 85%</p>
            </div>
            <p className="text-primary text-xl font-bold neon-text">High</p>
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
          <h3 className="text-[22px] font-bold tracking-tight">Active Clients</h3>
          <button className="text-primary text-sm font-semibold">View All</button>
        </div>
        <div className="space-y-3">
          {clients.map((client, i) => (
            <div key={i} className="flex items-center gap-4 p-4 glass-card rounded-xl">
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
                  {client.active ? 'Active' : 'Rest'}
                </p>
              </div>
              <ChevronRight className="size-5 text-slate-400" />
            </div>
          ))}
        </div>
      </section>

      <button className="fixed bottom-24 right-6 size-14 rounded-full bg-primary text-bg-dark shadow-lg shadow-primary/20 flex items-center justify-center z-30 transition-transform active:scale-95">
        <Plus className="size-8" />
      </button>
    </div>
  );
};

const WelcomeScreen = ({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) => {
  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,102,0.1),transparent_70%)]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="bg-primary/20 p-6 rounded-3xl mb-8 animate-bounce">
          <Dumbbell className="text-primary size-16" />
        </div>
        
        <h1 className="text-5xl font-black text-center mb-4 tracking-tighter italic">
          FITCORE <span className="text-primary neon-text">PRO</span>
        </h1>
        <p className="text-slate-400 text-center text-lg mb-12 max-w-[280px]">
          Tu transformación física comienza con un plan inteligente.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={onLogin}
            className="w-full h-16 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <User className="size-5" />
            Iniciar Sesión
          </button>
          
          <button 
            onClick={onRegister}
            className="w-full h-16 bg-primary text-bg-dark font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <PlusCircle className="size-5" />
            Nuevo Cliente
          </button>
        </div>

        <p className="mt-12 text-slate-500 text-sm font-medium">
          v2.4.0 • Edición Élite
        </p>
      </div>
    </div>
  );
};

const RegisterScreen = ({ onRegister }: { onRegister: () => void }) => {
  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col p-6 max-w-md mx-auto w-full">
      <header className="pt-6 mb-12">
        <h1 className="text-3xl font-bold mb-2">Crear Cuenta</h1>
        <p className="text-slate-400">Introduce tus credenciales para empezar</p>
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

const LoginScreen = ({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const demoAccounts = [
      { email: 'cliente@cliente.com', password: '123' },
      { email: 'admin@admin.com', password: '123' }
    ];

    const user = demoAccounts.find(u => u.email === email && u.password === password);

    if (user) {
      onLogin();
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
        <p className="text-slate-400 text-sm">
          ¿No tienes una cuenta? <button onClick={onRegister} className="text-primary font-bold hover:underline">Regístrate</button>
        </p>
      </div>
    </div>
  );
};

const WorkoutScreen = () => {
  const [sets, setSets] = useState([
    { id: 1, kg: 185, reps: 8, rpe: 8, completed: true },
    { id: 2, kg: 185, reps: 0, rpe: 8, completed: false },
  ]);

  const toggleSet = (id: number) => {
    setSets(sets.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const updateSet = (id: number, field: string, value: any) => {
    setSets(sets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="size-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">Día 1: Pecho y Tríceps</h1>
              <p className="text-xs text-slate-400 font-medium">Fase de Hipertrofia • Semana 3</p>
            </div>
          </div>
          <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="size-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between items-end">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">3 Series • 10-12 Reps</p>
            <p className="text-primary text-sm font-bold">{sets.filter(s => s.completed).length} / 6 Series</p>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(sets.filter(s => s.completed).length / 6) * 100}%` }}></div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center group">
              <img 
                src="https://picsum.photos/seed/benchpress/800/450" 
                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                alt="Bench Press" 
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <button className="relative z-10 flex shrink-0 items-center justify-center rounded-full size-16 bg-primary text-bg-dark shadow-lg hover:scale-110 transition-transform">
                <Play className="size-8 fill-current" />
              </button>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">VÍDEO DE TÉCNICA</div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-1">Flat Barbell Bench Press</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Info className="size-3" /> Descanso: 120-180 segundos
                  </span>
                </div>
                <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                  <MoreVertical className="size-5" />
                </button>
              </div>

              <div className="space-y-3">
                {sets.map((set) => (
                  <div 
                    key={set.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      set.completed 
                        ? "bg-white/5 border border-white/10 opacity-60" 
                        : "bg-primary/5 border-2 border-primary ring-4 ring-primary/10"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors",
                      set.completed ? "bg-primary text-bg-dark" : "bg-white/10 text-white"
                    )}>
                      {set.id}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] uppercase text-slate-500 font-bold">KG</label>
                        <input 
                          className="w-full bg-transparent border-none text-center font-bold p-0 focus:ring-0 text-lg" 
                          type="number" 
                          value={set.kg}
                          onChange={(e) => updateSet(set.id, 'kg', parseInt(e.target.value) || 0)}
                          disabled={set.completed}
                        />
                      </div>
                      <div className="flex flex-col items-center border-x border-white/10">
                        <label className="text-[10px] uppercase text-slate-500 font-bold">REPS</label>
                        <input 
                          className="w-full bg-transparent border-none text-center font-bold p-0 focus:ring-0 text-lg" 
                          placeholder="0" 
                          type="number" 
                          value={set.reps || ''}
                          onChange={(e) => updateSet(set.id, 'reps', parseInt(e.target.value) || 0)}
                          disabled={set.completed}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] uppercase text-slate-500 font-bold">RPE</label>
                        <select 
                          defaultValue={set.rpe}
                          onChange={(e) => updateSet(set.id, 'rpe', parseInt(e.target.value))}
                          disabled={set.completed}
                          className="w-full bg-transparent border-none text-center font-bold p-0 focus:ring-0 text-lg appearance-none cursor-pointer"
                        >
                          {[7, 8, 9, 10].map(val => (
                            <option key={val} className="bg-bg-dark" value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {set.completed ? (
                      <CheckCircle2 onClick={() => toggleSet(set.id)} className="size-6 text-primary fill-current cursor-pointer" />
                    ) : (
                      <button 
                        onClick={() => toggleSet(set.id)}
                        className="bg-primary text-bg-dark px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all active:scale-95"
                      >
                        ANOTAR
                      </button>
                    )}
                  </div>
                ))}

                <div className="mt-4 bg-primary text-bg-dark p-4 rounded-xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <Timer className="size-8" />
                    <div>
                      <p className="text-[10px] font-bold uppercase leading-none">Descanso en curso</p>
                      <p className="text-2xl font-black">01:29</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-black/10 hover:bg-black/20 p-2 rounded-lg transition-colors">
                      <span className="text-xs font-bold">+15s</span>
                    </button>
                    <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">SALTAR</button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSets([...sets, { id: sets.length + 1, kg: 185, reps: 0, rpe: 8, completed: false }])}
                className="mt-4 w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <Plus className="size-4" /> Añadir Serie Extra
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">SIGUIENTE EJERCICIO</h3>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="size-16 rounded-lg bg-slate-800 bg-cover bg-center shrink-0 overflow-hidden" style={{ backgroundImage: 'url("https://picsum.photos/seed/flyes/100/100")' }}></div>
            <div className="flex-1">
              <h4 className="font-bold">Incline Dumbbell Flyes</h4>
              <p className="text-sm text-slate-400">3 Series • 10-12 Reps</p>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </div>
        </div>
      </main>
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

const NutritionScreen = () => {
  const [selectedDay, setSelectedDay] = useState(2); // 0: Mon, 1: Tue, 2: Wed, etc.
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weekDates = [22, 23, 24, 25, 26, 27, 28];

  const mealsData: Record<number, any[]> = {
    2: [
      { 
        name: 'Desayuno', 
        desc: 'Avena con bayas y proteína', 
        kcal: 420, 
        time: '08:30 AM', 
        checked: true,
        ingredients: [
          { name: 'Avena integral', amount: '60g', protein: '8g', carbs: '40g', fats: '4g' },
          { name: 'Proteína de suero', amount: '30g', protein: '24g', carbs: '2g', fats: '1g' },
          { name: 'Arándanos frescos', amount: '50g', protein: '0g', carbs: '7g', fats: '0g' },
        ]
      },
      { 
        name: 'Comida', 
        desc: 'Ensalada de pollo a la plancha', 
        kcal: 580, 
        time: '01:15 PM', 
        checked: true,
        ingredients: [
          { name: 'Pechuga de pollo', amount: '150g', protein: '45g', carbs: '0g', fats: '3g' },
          { name: 'Mezcla de lechugas', amount: '100g', protein: '1g', carbs: '3g', fats: '0g' },
          { name: 'Aceite de oliva', amount: '10ml', protein: '0g', carbs: '0g', fats: '9g' },
        ]
      },
      { 
        name: 'Cena', 
        desc: 'Salmón con quinoa y espárragos', 
        kcal: 450, 
        time: '07:00 PM', 
        checked: false,
        ingredients: [
          { name: 'Salmón fresco', amount: '120g', protein: '25g', carbs: '0g', fats: '15g' },
          { name: 'Quinoa cocida', amount: '100g', protein: '4g', carbs: '21g', fats: '2g' },
        ]
      },
      { 
        name: 'Merienda', 
        desc: 'Yogur griego y almendras', 
        kcal: 150, 
        time: '09:30 PM', 
        checked: false,
        ingredients: [
          { name: 'Yogur griego natural', amount: '125g', protein: '12g', carbs: '5g', fats: '0g' },
          { name: 'Almendras', amount: '15g', protein: '3g', carbs: '3g', fats: '8g' },
        ]
      },
    ]
  };

  const currentMeals = mealsData[selectedDay] || mealsData[2];

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="bg-bg-dark sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Utensils className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight tracking-tight">Mi Nutrición</h2>
              <p className="text-slate-400 text-xs">{selectedDay === 2 ? 'Miércoles, 24 Oct' : 'Octubre 2024'}</p>
            </div>
          </div>
          <button className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
            <CalendarDays className="size-5" />
          </button>
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
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proteínas', current: 120, target: 150, percent: 80 },
            { label: 'Carbos', current: 175, target: 250, percent: 70 },
            { label: 'Grasas', current: 35, target: 70, percent: 50 },
          ].map((macro) => (
            <div key={macro.label} className="flex flex-col items-center gap-3 rounded-xl p-4 glass-card">
              <div className="relative flex items-center justify-center">
                <svg className="size-16">
                  <circle className="text-white/10" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
                  <circle 
                    className="text-primary transition-all duration-500" 
                    cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                    strokeDasharray="176" strokeDashoffset={176 - (176 * macro.percent) / 100} 
                    strokeLinecap="round" strokeWidth="4" 
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold">{macro.percent}%</span>
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
            <h3 className="text-lg font-bold tracking-tight">Comidas de hoy</h3>
            <span className="text-primary text-sm font-medium">1,450 kcal consumidas</span>
          </div>
          <div className="space-y-3">
            {currentMeals.map((meal, i) => (
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
                    <p className={cn("font-semibold", meal.checked && "line-through text-slate-500")}>{meal.name}</p>
                    <p className="text-slate-400 text-sm">{meal.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{meal.kcal} kcal</p>
                  <p className="text-slate-400 text-xs">{meal.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-bg-dark font-bold hover:opacity-90 transition-opacity">
            <PlusCircle className="size-5" /> Añadir comida / snack
          </button>
        </div>
      </main>

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
              className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-white/10 rounded-t-[32px] p-6 z-[70] max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
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
                  {selectedMeal.ingredients.map((ing: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-white">{ing.name}</p>
                        <p className="text-primary font-black">{ing.amount}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center bg-black/20 rounded-lg py-2">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Prot</p>
                          <p className="text-xs font-bold">{ing.protein}</p>
                        </div>
                        <div className="text-center bg-black/20 rounded-lg py-2">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Carb</p>
                          <p className="text-xs font-bold">{ing.carbs}</p>
                        </div>
                        <div className="text-center bg-black/20 rounded-lg py-2">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Gras</p>
                          <p className="text-xs font-bold">{ing.fats}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setSelectedMeal(null)}
                className="w-full mt-8 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 active:scale-95 transition-transform"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProgressScreen = () => {
  const [range, setRange] = useState('1M');

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="sticky top-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center p-4 justify-between max-w-7xl mx-auto">
          <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
            <Menu className="size-6" />
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Mi Progreso</h1>
          <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
            <Bell className="size-6" />
          </button>
        </div>
        <nav className="flex border-b border-white/10 px-4 gap-8 max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          <button className="border-b-2 border-primary text-primary pb-3 pt-4 whitespace-nowrap text-sm font-bold">Resumen</button>
          <button className="border-b-2 border-transparent text-slate-500 pb-3 pt-4 whitespace-nowrap text-sm font-bold">Historial</button>
          <button className="border-b-2 border-transparent text-slate-500 pb-3 pt-4 whitespace-nowrap text-sm font-bold">Récords</button>
          <button className="border-b-2 border-transparent text-slate-500 pb-3 pt-4 whitespace-nowrap text-sm font-bold">Fotos</button>
        </nav>
      </header>

      <main className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase">Peso Actual</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">82.5 kg</p>
              <span className="text-red-500 text-xs font-bold">-1.2%</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase">Total Récords</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">48</p>
              <span className="text-primary text-xs font-bold">+5</span>
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
                {i === 7 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary neon-text">82.5</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            <span>{range === '1M' ? 'Sem 1' : 'Ene'}</span>
            <span>{range === '1M' ? 'Sem 4' : 'Jun'}</span>
            <span>Actual</span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Galería de Evolución</h2>
            <button className="text-primary text-sm font-bold flex items-center gap-1">
              Añadir <Camera className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { date: 'Jan 12, 2024', label: 'Inicio', img: 'https://picsum.photos/seed/p1/300/400' },
              { date: 'Feb 05, 2024', label: 'Semana 4', img: 'https://picsum.photos/seed/p2/300/400' },
            ].map((photo, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10">
                <img src={photo.img} className="w-full h-full object-cover grayscale" alt="Progress" />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-bold">{photo.date}</p>
                  <p className="text-primary text-[10px]">{photo.label}</p>
                </div>
              </div>
            ))}
            <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-all cursor-pointer">
              <PlusCircle className="size-8 mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider">Subir Nueva</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const ProfileScreen = () => {
  return (
    <div className="min-h-screen bg-bg-dark text-white pb-32">
      <header className="flex items-center p-4 justify-between border-b border-white/10 sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md">
        <h2 className="text-lg font-bold tracking-tight">Mi Perfil</h2>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <MoreVertical className="size-6" />
        </button>
      </header>

      <main className="p-6">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="relative">
            <div className="size-32 rounded-full border-4 border-primary overflow-hidden">
              <img src="https://picsum.photos/seed/sarah/200/200" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-bg-dark rounded-full p-1 border-2 border-bg-dark">
              <Verified className="size-4" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight">Sarah Jenkins</h3>
            <div className="flex items-center gap-2 mt-1 justify-center">
              <span className="size-2 rounded-full bg-primary neon-text"></span>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">ACTIVA • RACHA DE 8 MESES</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="glass-card rounded-xl p-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Peso</p>
            <p className="text-xl font-bold">64.2 kg</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Grasa Corporal</p>
            <p className="text-xl font-bold">21.4%</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40">
            <div className="flex items-center gap-3">
              <Settings className="size-5 text-slate-400" />
              <span className="font-semibold">Ajustes de cuenta</span>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-slate-400" />
              <span className="font-semibold">Soporte con mi entrenador</span>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-center p-4 mt-4 text-red-500 font-bold border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
            <LogOut className="size-5 mr-2" /> Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');

  const showNav = !['onboarding', 'login', 'welcome', 'register'].includes(screen);

  return (
    <div className="bg-bg-dark min-h-screen font-sans">
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
              onRegister={() => setScreen('register')} 
            />
          )}
          {screen === 'register' && <RegisterScreen onRegister={() => setScreen('onboarding')} />}
          {screen === 'onboarding' && <OnboardingScreen onComplete={() => setScreen('dashboard')} />}
          {screen === 'login' && (
            <LoginScreen 
              onLogin={() => setScreen('dashboard')} 
              onRegister={() => setScreen('register')}
            />
          )}
          {screen === 'dashboard' && <DashboardScreen />}
          {screen === 'workout' && <WorkoutScreen />}
          {screen === 'timer' && <TimerScreen />}
          {screen === 'nutrition' && <NutritionScreen />}
          {screen === 'progress' && <ProgressScreen />}
          {screen === 'profile' && <ProfileScreen />}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav active={screen} onChange={setScreen} />}
    </div>
  );
}
