/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
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
  X,
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
  UserPlus,
  ShoppingCart,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  FileDown,
  Droplets,
  Sun,
  Sword,
  Trophy,
  Moon,
  Footprints,
  MessageCircle,
  Search,
  Filter,
  List,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
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
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage, firebaseConfig } from './firebase';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
};

const normalizeEnabledSections = (sections: any): EnabledSections => {
  const defaultSections: EnabledSections = { training: true, nutrition: true, progress: true };
  if (!sections) return defaultSections;
  
  if (Array.isArray(sections)) {
    return {
      training: sections.includes('workout') || sections.includes('training'),
      nutrition: sections.includes('diet') || sections.includes('nutrition'),
      progress: sections.includes('progress')
    };
  }
  
  return {
    training: sections.training !== undefined ? !!sections.training : defaultSections.training,
    nutrition: sections.nutrition !== undefined ? !!sections.nutrition : defaultSections.nutrition,
    progress: sections.progress !== undefined ? !!sections.progress : defaultSections.progress
  };
};

const normalizeClient = (client: any): Client | null => {
  if (!client) return null;
  return {
    ...client,
    enabledSections: normalizeEnabledSections(client.enabledSections)
  } as Client;
};

// --- Constants ---
const getSafeLocalStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;
    const parsed = JSON.parse(saved);
    return parsed !== undefined ? parsed : defaultValue;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Entrenamiento (55)
  { id: 't1', title: 'Primer Paso', description: 'Primer entrenamiento completado', icon: 'Dumbbell', category: 'training', completed: true },
  { id: 't2', title: 'Semana Perfecta', description: 'Completa todos los entrenamientos de la semana', icon: 'CalendarDays', category: 'training', completed: false },
  { id: 't3', title: 'Madrugador', description: 'Entrena antes de las 8:00 AM', icon: 'Sun', category: 'training', completed: false },
  { id: 't4', title: 'Guerrero Nocturno', description: 'Entrena después de las 9:00 PM', icon: 'Moon', category: 'training', completed: false },
  { id: 't5', title: 'Fuerza Bruta', description: 'Supera tu récord personal en un ejercicio', icon: 'Trophy', category: 'training', completed: false },
  { id: 't6', title: 'Constancia de Hierro', description: 'Entrena 30 días seguidos', icon: 'Flame', category: 'training', completed: false },
  { id: 't7', title: 'Sin Excusas', description: 'Entrena en un día festivo', icon: 'Calendar', category: 'training', completed: false },
  { id: 't8', title: 'Guerrero del Finde', description: 'Entrena Sábado y Domingo', icon: 'Sword', category: 'training', completed: false },
  { id: 't9', title: 'Maestro del Cardio', description: 'Completa 60 min de cardio intenso', icon: 'Timer', category: 'training', completed: false },
  { id: 't10', title: 'Poder Absoluto', description: 'Levanta 2 veces tu peso corporal', icon: 'Trophy', category: 'training', completed: false },
  { id: 't11', title: 'Inmortal', description: 'Completa 100 entrenamientos', icon: 'Verified', category: 'training', completed: false },
  { id: 't12', title: 'Velocista', description: 'Corre 5km en menos de 25 min', icon: 'Flame', category: 'training', completed: false },
  { id: 't13', title: 'Fuerza de Voluntad', description: 'Entrena a pesar de tener un día difícil', icon: 'Sword', category: 'training', completed: false },
  { id: 't14', title: 'Técnica Perfecta', description: 'Recibe felicitación del coach por tu técnica', icon: 'CheckCircle2', category: 'training', completed: false },
  { id: 't15', title: 'Explosivo', description: 'Completa un circuito HIIT sin parar', icon: 'Flame', category: 'training', completed: false },
  { id: 't16', title: 'Volumen Máximo', description: 'Mueve más de 10,000kg en una sesión', icon: 'TrendingUp', category: 'training', completed: false },
  { id: 't17', title: 'Piernas de Acero', description: 'Completa 100 sentadillas en un día', icon: 'Dumbbell', category: 'training', completed: false },
  { id: 't18', title: 'Espalda de Titán', description: 'Logra tu primera dominada estricta', icon: 'Trophy', category: 'training', completed: false },
  { id: 't19', title: 'Core de Roca', description: 'Aguanta 3 min en plancha abdominal', icon: 'Timer', category: 'training', completed: false },
  { id: 't20', title: 'Atleta Híbrido', description: 'Entrena fuerza y cardio el mismo día', icon: 'LayoutGrid', category: 'training', completed: false },
  { id: 't21', title: 'Resiliencia', description: 'Vuelve a entrenar tras una semana de descanso', icon: 'History', category: 'training', completed: false },
  { id: 't22', title: 'Superación', description: 'Haz una repetición más que la semana pasada', icon: 'Plus', category: 'training', completed: false },
  { id: 't23', title: 'Enfoque Total', description: 'Entrena sin mirar el móvil ni una vez', icon: 'Info', category: 'training', completed: false },
  { id: 't24', title: 'Compañerismo', description: 'Entrena con un amigo y motívalo', icon: 'Users', category: 'training', completed: false },
  { id: 't25', title: 'Viajero Fitness', description: 'Entrena en un gimnasio diferente al tuyo', icon: 'Share2', category: 'training', completed: false },
  { id: 't26', title: 'Puntualidad', description: 'Llega al gym a la hora exacta 5 días seguidos', icon: 'Timer', category: 'training', completed: false },
  { id: 't27', title: 'Calentamiento Pro', description: 'Dedica 15 min a movilidad antes de entrenar', icon: 'Play', category: 'training', completed: false },
  { id: 't28', title: 'Vuelta a la Calma', description: 'Estira 10 min después de cada sesión semanal', icon: 'Leaf', category: 'training', completed: false },
  { id: 't29', title: 'Mente de Acero', description: 'Termina el entrenamiento más duro del mes', icon: 'Sword', category: 'training', completed: false },
  { id: 't30', title: 'Crecimiento', description: 'Aumenta el peso en todos tus ejercicios básicos', icon: 'TrendingUp', category: 'training', completed: false },
  { id: 't31', title: 'Disciplina', description: 'Entrena un día que no tenías ganas', icon: 'Flame', category: 'training', completed: false },
  { id: 't32', title: 'Poder de Agarre', description: 'Aguanta 1 min colgado de la barra', icon: 'Timer', category: 'training', completed: false },
  { id: 't33', title: 'Equilibrio', description: 'Haz 10 sentadillas a una pierna (pistols)', icon: 'Dumbbell', category: 'training', completed: false },
  { id: 't34', title: 'Empuje', description: 'Logra tu récord en Press Militar', icon: 'Trophy', category: 'training', completed: false },
  { id: 't35', title: 'Tracción', description: 'Logra tu récord en Peso Muerto', icon: 'Trophy', category: 'training', completed: false },
  { id: 't36', title: 'Fuerza Relativa', description: 'Haz 20 flexiones seguidas con técnica perfecta', icon: 'Check', category: 'training', completed: false },
  { id: 't37', title: 'Agilidad', description: 'Completa 50 saltos al cajón', icon: 'Flame', category: 'training', completed: false },
  { id: 't38', title: 'Resistencia', description: 'Completa un AMRAP de 20 minutos', icon: 'Timer', category: 'training', completed: false },
  { id: 't39', title: 'Variedad', description: 'Prueba una máquina nueva del gimnasio', icon: 'PlusCircle', category: 'training', completed: false },
  { id: 't40', title: 'Leyenda', description: 'Completa un año entero de entrenamientos', icon: 'Trophy', category: 'training', completed: false },
  { id: 't41', title: 'Sin Descanso', description: 'Completa un entrenamiento de 90 minutos', icon: 'Timer', category: 'training', completed: false },
  { id: 't42', title: 'Equilibrio Total', description: 'Haz el pino durante 10 segundos', icon: 'Dumbbell', category: 'training', completed: false },
  { id: 't43', title: 'Salto de Fe', description: 'Salta a un cajón de 60cm', icon: 'Flame', category: 'training', completed: false },
  { id: 't44', title: 'Resistencia Mental', description: 'Entrena bajo la lluvia o frío intenso', icon: 'Sword', category: 'training', completed: false },
  { id: 't45', title: 'Maestro de la Comba', description: 'Haz 100 saltos dobles seguidos', icon: 'Flame', category: 'training', completed: false },
  { id: 't46', title: 'Maestro del Burpee', description: 'Completa 50 burpees en menos de 5 min', icon: 'Flame', category: 'training', completed: false },
  { id: 't47', title: 'Fuerza de Agarre II', description: 'Aguanta 2 min colgado de la barra', icon: 'Timer', category: 'training', completed: false },
  { id: 't48', title: 'Sentadilla Profunda', description: 'Haz 50 sentadillas con pausa abajo', icon: 'Dumbbell', category: 'training', completed: false },
  { id: 't49', title: 'Flexiones Diamante', description: 'Haz 15 flexiones diamante seguidas', icon: 'Check', category: 'training', completed: false },
  { id: 't50', title: 'Dominadas Explosivas', description: 'Haz 5 dominadas al pecho', icon: 'Trophy', category: 'training', completed: false },
  { id: 't51', title: 'Zancadas de Gigante', description: 'Recorre 100m haciendo zancadas', icon: 'Footprints', category: 'training', completed: false },
  { id: 't52', title: 'Plancha Lateral', description: 'Aguanta 2 min por cada lado', icon: 'Timer', category: 'training', completed: false },
  { id: 't53', title: 'Salto Vertical', description: 'Mejora tu salto vertical en 5cm', icon: 'Flame', category: 'training', completed: false },
  { id: 't54', title: 'Resistencia de Acero', description: 'Corre 10km sin parar', icon: 'Flame', category: 'training', completed: false },
  { id: 't55', title: 'Maestro de la Técnica', description: 'Graba y analiza 10 ejercicios', icon: 'Camera', category: 'training', completed: false },

  // Nutrición (45)
  { id: 'n1', title: 'Chef Fitness', description: '7 días cumpliendo tus macros', icon: 'Utensils', category: 'nutrition', completed: true },
  { id: 'n2', title: 'Proteína al Día', description: 'Alcanza tu objetivo de proteína 5 días seguidos', icon: 'Egg', category: 'nutrition', completed: false },
  { id: 'n3', title: 'Verde que te quiero Verde', description: 'Come verdura en todas tus comidas del día', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n4', title: 'Hidratación Suprema', description: 'Bebe 3 litros de agua al día por una semana', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n5', title: 'Adiós Ultraprocesados', description: 'Una semana sin comer comida basura', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n6', title: 'Preparación Master', description: 'Haz Meal Prep para toda la semana', icon: 'ShoppingBasket', category: 'nutrition', completed: false },
  { id: 'n7', title: 'Fruta Diaria', description: 'Come 3 piezas de fruta al día por 5 días', icon: 'Apple', category: 'nutrition', completed: false },
  { id: 'n8', title: 'Omega 3', description: 'Come pescado azul 2 veces por semana', icon: 'Fish', category: 'nutrition', completed: false },
  { id: 'n9', title: 'Cero Alcohol', description: 'Un mes completo sin probar el alcohol', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n10', title: 'Desayuno de Campeones', description: 'Desayuna saludable 7 días seguidos', icon: 'Sun', category: 'nutrition', completed: false },
  { id: 'n11', title: 'Cena Ligera', description: 'Cena 2 horas antes de dormir por 3 días', icon: 'Moon', category: 'nutrition', completed: false },
  { id: 'n12', title: 'Fibra a Tope', description: 'Alcanza 30g de fibra al día', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n13', title: 'Control de Porciones', description: 'Pesa tu comida con precisión por una semana', icon: 'FileText', category: 'nutrition', completed: false },
  { id: 'n14', title: 'Sin Azúcar Añadido', description: '3 días sin consumir azúcares refinados', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n15', title: 'Nuevos Sabores', description: 'Prueba una receta saludable nueva', icon: 'Plus', category: 'nutrition', completed: false },
  { id: 'n16', title: 'Compra Inteligente', description: 'Haz la compra siguiendo una lista saludable', icon: 'ShoppingCart', category: 'nutrition', completed: false },
  { id: 'n17', title: 'Snack Saludable', description: 'Sustituye snacks industriales por frutos secos', icon: 'Apple', category: 'nutrition', completed: false },
  { id: 'n18', title: 'Conciencia', description: 'Registra todo lo que comes durante 10 días', icon: 'FileText', category: 'nutrition', completed: false },
  { id: 'n19', title: 'Sodio Bajo', description: 'Cocina sin sal añadida durante 3 días', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n20', title: 'Agua antes de Comer', description: 'Bebe un vaso de agua antes de cada comida', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n21', title: 'Legumbres Power', description: 'Come legumbres 3 veces por semana', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n22', title: 'Grasas Saludables', description: 'Incluye aguacate o AOVE en tu dieta diaria', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n23', title: 'Sin Picoteo', description: 'No comas nada entre horas por 3 días', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n24', title: 'Hidratación en Ayunas', description: 'Bebe agua nada más levantarte por 7 días', icon: 'Sun', category: 'nutrition', completed: false },
  { id: 'n25', title: 'Proteína Vegetal', description: 'Haz un día de comida 100% vegetal', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n26', title: 'Masticación Lenta', description: 'Tarda al menos 20 min en cada comida principal', icon: 'Timer', category: 'nutrition', completed: false },
  { id: 'n27', title: 'Sin Refrescos', description: 'Sustituye refrescos por agua o té por 10 días', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n28', title: 'Cero Procesados', description: 'Come solo alimentos de un solo ingrediente hoy', icon: 'Check', category: 'nutrition', completed: false },
  { id: 'n29', title: 'Suplementación', description: 'Toma tus suplementos recomendados sin falta', icon: 'PlusCircle', category: 'nutrition', completed: false },
  { id: 'n30', title: 'Gourmet Fitness', description: 'Prepara una cena saludable digna de restaurante', icon: 'Utensils', category: 'nutrition', completed: false },
  { id: 'n31', title: 'Agua Nocturna', description: 'Bebe un vaso de agua antes de dormir por 5 días', icon: 'Moon', category: 'nutrition', completed: false },
  { id: 'n32', title: 'Sin Cafeína', description: 'Pasa 3 días sin café ni té', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n33', title: 'Proteína Magra', description: 'Consume solo fuentes de proteína magra hoy', icon: 'Check', category: 'nutrition', completed: false },
  { id: 'n34', title: 'Fibra Master', description: 'Supera los 40g de fibra en un día', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n35', title: 'Sodio Zero', description: 'Cocina sin sal añadida durante un día entero', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n36', title: 'Cero Azúcar Semanal', description: 'Una semana entera sin azúcar añadido', icon: 'X', category: 'nutrition', completed: false },
  { id: 'n37', title: 'Hidratación Pro', description: 'Bebe 4 litros de agua en un día caluroso', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n38', title: 'Desayuno Proteico', description: 'Consume 30g de proteína en el desayuno por 5 días', icon: 'Egg', category: 'nutrition', completed: false },
  { id: 'n39', title: 'Cena Vegetal', description: 'Cena solo vegetales y legumbres por 3 días', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n40', title: 'Sin Comida Fuera', description: 'Una semana cocinando todas tus comidas', icon: 'ShoppingBasket', category: 'nutrition', completed: false },
  { id: 'n41', title: 'Frutos Secos', description: 'Consume un puñado de frutos secos naturales al día', icon: 'Apple', category: 'nutrition', completed: false },
  { id: 'n42', title: 'Té Verde', description: 'Sustituye el café por té verde durante 3 días', icon: 'Leaf', category: 'nutrition', completed: false },
  { id: 'n43', title: 'Sin Sal', description: 'Pasa un fin de semana sin usar sal añadida', icon: 'Droplets', category: 'nutrition', completed: false },
  { id: 'n44', title: 'Macros Exactos', description: 'Clava tus macros al gramo hoy', icon: 'Check', category: 'nutrition', completed: false },
  { id: 'n45', title: 'Hidratación Constante', description: 'Bebe agua cada hora durante tu jornada laboral', icon: 'Droplets', category: 'nutrition', completed: false },

  // Hábitos y Estilo de Vida (50)
  { id: 'h1', title: 'Sueño Reparador', description: 'Duerme 8 horas durante 3 días seguidos', icon: 'Moon', category: 'habits', completed: true },
  { id: 'h2', title: 'Caminante', description: 'Alcanza 10,000 pasos al día por una semana', icon: 'Footprints', category: 'habits', completed: true },
  { id: 'h3', title: 'Transformación', description: 'Sube 4 fotos de progreso', icon: 'Camera', category: 'habits', completed: false },
  { id: 'h4', title: 'Mente Clara', description: 'Medita 10 min después de entrenar', icon: 'Info', category: 'habits', completed: false },
  { id: 'h5', title: 'Desconexión Digital', description: 'Sin pantallas 1 hora antes de dormir', icon: 'Moon', category: 'habits', completed: false },
  { id: 'h6', title: 'Ducha Fría', description: 'Termina tu ducha con 1 min de agua fría', icon: 'Droplets', category: 'habits', completed: false },
  { id: 'h7', title: 'Lectura Fitness', description: 'Lee un artículo sobre salud o nutrición', icon: 'FileText', category: 'habits', completed: false },
  { id: 'h8', title: 'Adiós Ascensor', description: 'Usa solo las escaleras durante 3 días', icon: 'TrendingUp', category: 'habits', completed: false },
  { id: 'h9', title: 'Postura Perfecta', description: 'Mantén una buena postura en el trabajo hoy', icon: 'User', category: 'habits', completed: false },
  { id: 'h10', title: 'Productividad', description: 'Planifica tu semana de entrenamientos el domingo', icon: 'Calendar', category: 'habits', completed: false },
  { id: 'h11', title: 'Gratitud', description: 'Anota 3 cosas por las que estás agradecido hoy', icon: 'CheckCircle2', category: 'habits', completed: false },
  { id: 'h12', title: 'Movilidad Matutina', description: 'Haz 5 min de estiramientos al despertar', icon: 'Sun', category: 'habits', completed: false },
  { id: 'h13', title: 'Hidratación en el Trabajo', description: 'Ten siempre una botella de agua en tu mesa', icon: 'Droplets', category: 'habits', completed: false },
  { id: 'h14', title: 'Cero Estrés', description: 'Dedica 20 min a un hobby relajante', icon: 'Play', category: 'habits', completed: false },
  { id: 'h15', title: 'Sol Diario', description: 'Toma 15 min de sol al día', icon: 'Sun', category: 'habits', completed: false },
  { id: 'h16', title: 'Orden Mental', description: 'Mantén tu espacio de entrenamiento ordenado', icon: 'LayoutGrid', category: 'habits', completed: false },
  { id: 'h17', title: 'Consistencia Visual', description: 'Pésate a la misma hora 3 días seguidos', icon: 'BarChart3', category: 'habits', completed: false },
  { id: 'h18', title: 'Social Fitness', description: 'Comparte tu progreso con la comunidad', icon: 'Share2', category: 'habits', completed: false },
  { id: 'h19', title: 'Aprendizaje', description: 'Mira un video sobre técnica de ejercicios', icon: 'Play', category: 'habits', completed: false },
  { id: 'h20', title: 'Sin Cafeína', description: 'Pasa un día entero sin consumir cafeína', icon: 'X', category: 'habits', completed: false },
  { id: 'h21', title: 'Respiración', description: 'Haz 5 min de respiraciones profundas', icon: 'Info', category: 'habits', completed: false },
  { id: 'h22', title: 'Caminata Post-Comida', description: 'Camina 10 min después de comer', icon: 'Footprints', category: 'habits', completed: false },
  { id: 'h23', title: 'Objetivos Claros', description: 'Escribe tus metas para el próximo mes', icon: 'FileText', category: 'habits', completed: false },
  { id: 'h24', title: 'Autocuidado', description: 'Dedica tiempo a cuidar tu piel o cuerpo', icon: 'User', category: 'habits', completed: false },
  { id: 'h25', title: 'Sin Tabaco', description: 'Un día más libre de humos', icon: 'X', category: 'habits', completed: false },
  { id: 'h26', title: 'Paciencia', description: 'No te frustres si un día no sale perfecto', icon: 'Info', category: 'habits', completed: false },
  { id: 'h27', title: 'Inspiración', description: 'Sigue a alguien que te motive de verdad', icon: 'UserPlus', category: 'habits', completed: false },
  { id: 'h28', title: 'Organización', description: 'Prepara tu ropa de gym la noche anterior', icon: 'ShoppingBasket', category: 'habits', completed: false },
  { id: 'h29', title: 'Métrica de Oro', description: 'Mide tus perímetros corporales este mes', icon: 'BarChart3', category: 'habits', completed: false },
  { id: 'h30', title: 'Estilo de Vida', description: 'Siente que el fitness ya es parte de ti', icon: 'Verified', category: 'habits', completed: false },
  { id: 'h31', title: 'Lectura Profunda', description: 'Lee 20 páginas de un libro sobre desarrollo personal', icon: 'FileText', category: 'habits', completed: false },
  { id: 'h32', title: 'Ducha de Hielo', description: '3 minutos de agua fría al final de la ducha', icon: 'Droplets', category: 'habits', completed: false },
  { id: 'h33', title: 'Desconexión Total', description: 'Un domingo entero sin redes sociales', icon: 'X', category: 'habits', completed: false },
  { id: 'h34', title: 'Puntualidad Extrema', description: 'Llega 5 min antes a todas tus citas de la semana', icon: 'Timer', category: 'habits', completed: false },
  { id: 'h35', title: 'Mente en Calma', description: '15 min de meditación guiada', icon: 'Info', category: 'habits', completed: false },
  { id: 'h36', title: 'Escritura', description: 'Diario de progreso por 7 días seguidos', icon: 'FileText', category: 'habits', completed: false },
  { id: 'h37', title: 'Estiramiento', description: 'Sesión de yoga de 30 min', icon: 'Leaf', category: 'habits', completed: false },
  { id: 'h38', title: 'Orden', description: 'Limpia tu zona de entrenamiento', icon: 'LayoutGrid', category: 'habits', completed: false },
  { id: 'h39', title: 'Visualización', description: '5 min visualizando tus metas', icon: 'Eye', category: 'habits', completed: false },
  { id: 'h40', title: 'Comunidad', description: 'Ayuda a un compañero en el gym', icon: 'Users', category: 'habits', completed: false },
  { id: 'h41', title: 'Lectura Diaria', description: 'Lee 15 min antes de dormir por una semana', icon: 'FileText', category: 'habits', completed: false },
  { id: 'h42', title: 'Ducha de Contraste', description: 'Alterna agua fría y caliente por 5 min', icon: 'Droplets', category: 'habits', completed: false },
  { id: 'h43', title: 'Sin Cafeína Tarde', description: 'No consumas cafeína después de las 2 PM por 5 días', icon: 'Moon', category: 'habits', completed: false },
  { id: 'h44', title: 'Estiramiento de Espalda', description: 'Haz 5 min de movilidad de columna al día', icon: 'User', category: 'habits', completed: false },
  { id: 'h45', title: 'Desconexión de Notificaciones', description: 'Desactiva notificaciones no esenciales hoy', icon: 'Bell', category: 'habits', completed: false },
  { id: 'h46', title: 'Caminata en la Naturaleza', description: 'Pasea 30 min por un parque o bosque', icon: 'Leaf', category: 'habits', completed: false },
  { id: 'h47', title: 'Higiene del Sueño', description: 'Mantén tu habitación a 18-20 grados para dormir', icon: 'Moon', category: 'habits', completed: false },
  { id: 'h48', title: 'Mente Positiva', description: 'Escribe una afirmación positiva cada mañana', icon: 'Sun', category: 'habits', completed: false },
  { id: 'h49', title: 'Limpieza de Redes', description: 'Deja de seguir cuentas que te generen ansiedad', icon: 'UserPlus', category: 'habits', completed: false },
  { id: 'h50', title: 'Maestro de la Disciplina', description: 'Cumple todos tus hábitos por 14 días seguidos', icon: 'Verified', category: 'habits', completed: false },
];

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'home' | 'dashboard' | 'workout' | 'timer' | 'nutrition' | 'progress' | 'profile' | 'onboarding' | 'login' | 'welcome' | 'register' | 'coach_self' | 'user_management';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coach' | 'client';
  active: boolean;
  createdAt: any;
}

interface EnabledSections {
  training: boolean;
  nutrition: boolean;
  progress: boolean;
}

interface WeeklyWeightHistory {
  id: string;
  startDate: string;
  endDate: string;
  dailyWeights: (number | null)[];
  average: number;
}

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
  howTo?: string;
}

interface Coach {
  id: string;
  name: string;
  phone: string;
  img: string;
  email?: string;
  role: 'admin' | 'coach';
}

interface Notification {
  id: string;
  clientId: string;
  clientName: string;
  exerciseName: string;
  description?: string;
  painLevel?: number;
  timestamp: Date;
  read: boolean;
}

interface IntakeForm {
  general: {
    fullName: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    phone: string;
    profession: string;
  };
  objectives: {
    main: string;
    other: string;
    specific: string[];
    targetDate: string;
  };
  medical: {
    medication: string;
    smoker: string;
    injuries: string;
    pains: string;
    conditions: string;
    surgeries: string;
    limitations: string;
  };
  sports: {
    currentlyActive: string;
    type: string;
    frequency: string;
    experienceTime: string;
    workedWithCoach: string;
    ratings: {
      strength: number;
      endurance: number;
      flexibility: number;
      coordination: number;
    };
  };
  lifestyle: {
    activityLevel: string;
    workHours: string;
    workType: string;
    stressLevel: string;
    sleepHours: string;
    sleepQuality: string;
  };
  nutrition: {
    mealsPerDay: string;
    currentDiet: string;
    waterIntake: string;
    alcohol: string;
    supplements: string;
  };
  availability: {
    daysPerWeek: string;
    timePerSession: string;
    location: string;
  };
  measurements: {
    weight: string;
    waist: string;
    hips: string;
    chest: string;
    arm: string;
    thigh: string;
    calf: string;
  };
  selfAssessment: {
    fatigue: string;
    exerciseFrequency: string;
    mobilityLimits: string;
    abs10: string;
    perceivedLevel: string;
  };
  motivation: {
    level: number;
    obstacles: string;
    reason: string;
    coachNotes: string;
  };
}

interface Client {
  id: string;
  name: string;
  program: string;
  status: string;
  active: boolean;
  isDeleted?: boolean;
  img: string;
  weight?: string;
  bodyFat?: string;
  targetWeight?: string;
  dietType?: string;
  allergies?: string;
  stepsTarget?: number;
  waterTarget?: number;
  achievements?: Achievement[];
  progressPhotos?: ProgressPhoto[];
  assignedCoachId?: string;
  enabledSections: EnabledSections;
  diets?: DietFile[];
  workouts?: DietFile[];
  intakeForm?: IntakeForm;
}

interface DietFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: any;
}

interface DailyLog {
  date: string;
  weight?: number;
  bodyFat?: number;
  sleepHours?: number;
  sleepQuality?: 'Mal' | 'Regular' | 'Bien' | 'Excelente';
  stepsCompleted: boolean;
  waterCompleted: boolean;
  notes?: string;
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

interface ExerciseSet {
  id: number;
  kg: number | null;
  reps: number;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
}

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  video: string;
  initialSets: ExerciseSet[];
  gifUrl?: string; // From ExerciseDB
  bodyPart?: string;
  equipment?: string;
  target?: string;
  clientEntersWeight?: boolean;
}

interface WorkoutDay {
  id: number;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

interface ExtraMeal {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  kcal: number;
  photo?: string;
  timestamp: string;
}

interface DailyNutrition {
  day: string;
  meals: Meal[];
  extras?: ExtraMeal[];
}

// --- Constants & Data ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const DEFAULT_COACHES: Coach[] = [
  { id: 'c1', name: 'Coach Alex (Admin)', phone: '34600000000', img: 'https://picsum.photos/seed/coach1/100/100', role: 'admin' },
  { id: 'c2', name: 'Coach Maria', phone: '34611111111', img: 'https://picsum.photos/seed/coach2/100/100', role: 'coach' },
  { id: 'c3', name: 'Coach Juan', phone: '34622222222', img: 'https://picsum.photos/seed/coach3/100/100', role: 'coach' }
];

const commonEquipment = [
  'Mancuerna', 'Barra', 'Polea', 'Kettlebell', 'Máquina', 'Peso Corporal', 'Bandas', 'Multipower', 'Banco', 'Disco', 'TRX', 'Fitball'
];

const defaultSections: EnabledSections = { training: true, nutrition: true, progress: true };

const DEFAULT_CLIENTS: Client[] = [
  { id: '1', name: 'Sarah Jenkins', program: 'Powerlifting • Phase 2', status: 'Today', active: true, img: 'https://picsum.photos/seed/sarah/100/100', weight: '64.2 kg', bodyFat: '21.4%', stepsTarget: 10000, waterTarget: 2.5, assignedCoachId: 'c1', enabledSections: defaultSections },
  { id: '2', name: 'Marcus Chen', program: 'Hypertrophy • Week 4', status: '2 days ago', active: false, img: 'https://picsum.photos/seed/marcus/100/100', weight: '82.5 kg', bodyFat: '15.2%', stepsTarget: 8000, waterTarget: 3.0, assignedCoachId: 'c2', enabledSections: { ...defaultSections, nutrition: false } },
  { id: '3', name: 'Elena Rodriguez', program: 'Endurance • Advanced', status: 'Yesterday', active: true, img: 'https://picsum.photos/seed/elena/100/100', weight: '58.0 kg', bodyFat: '18.5%', stepsTarget: 12000, waterTarget: 2.0, assignedCoachId: 'c1', enabledSections: { ...defaultSections, training: false } },
];

// --- Components ---

const CustomToast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch(type) {
      case 'success': return "bg-primary text-bg-dark border-primary/20";
      case 'error': return "bg-red-500 text-white border-red-400/20";
      case 'info': return "bg-blue-500 text-white border-blue-400/20";
      default: return "bg-primary text-bg-dark border-primary/20";
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'success': return <CheckCircle2 className="size-5" />;
      case 'error': return <Bell className="size-5" />;
      case 'info': return <Info className="size-5" />;
      default: return <CheckCircle2 className="size-5" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={cn(
        "fixed bottom-24 left-1/2 z-[200] px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border whitespace-nowrap",
        getStyles()
      )}
    >
      {getIcon()}
      {message}
    </motion.div>
  );
};

const CustomConfirm = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = false
}: { 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-bg-dark border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <h3 className="text-xl font-black italic mb-2 text-text-bright">{title}</h3>
        <p className="text-text-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-bg-surface/50 text-text-bright font-bold rounded-xl border border-black/10 dark:border-white/10"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold shadow-lg",
              isDestructive ? "bg-red-500 text-white shadow-red-500/20" : "bg-primary text-bg-dark shadow-primary/20"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

const generateIntakePdf = (data: IntakeForm, clientName: string) => {
  const doc = new jsPDF();
  const primaryColor = [50, 95, 235]; // #325feb
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA NUEVO CLIENTE", 20, 25);
  doc.setFontSize(10);
  doc.text("ÁLVARO RUÍZ - ENTRENADOR PERSONAL", 20, 32);
  
  let y = 50;
  const checkPage = (height: number) => {
    if (y + height > 280) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(15);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y + 7);
    y += 15;
  };

  const field = (label: string, value: string, width: number = 90) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label.toUpperCase(), 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(value || "---", 20, y + 5);
  };

  // 1. Datos Generales
  sectionHeader("1. DATOS GENERALES");
  field("Nombre completo", data.general.fullName);
  doc.text("EDAD: " + (data.general.age || "---"), 110, y + 5);
  y += 15;
  field("Sexo", data.general.gender);
  doc.text("ALTURA: " + (data.general.height || "---") + " cm", 110, y + 5);
  y += 15;
  field("Peso actual", data.general.weight + " kg");
  doc.text("TELÉFONO: " + (data.general.phone || "---"), 110, y + 5);
  y += 15;
  field("Profesión", data.general.profession);
  y += 20;

  // 2. Objetivo Principal
  sectionHeader("2. OBJETIVO PRINCIPAL");
  field("Objetivo principal", data.objectives.main);
  if (data.objectives.main === 'Otro') doc.text("ESPECIFICA: " + data.objectives.other, 110, y + 5);
  y += 15;
  field("Objetivos específicos", data.objectives.specific.filter(s => s).join(", "));
  y += 15;
  field("Fecha objetivo", data.objectives.targetDate);
  y += 20;

  // 3. Historial Médico
  sectionHeader("3. HISTORIAL MÉDICO");
  field("Medicación", data.medical.medication);
  y += 12;
  field("Fumas", data.medical.smoker);
  y += 12;
  field("Lesiones relevantes", data.medical.injuries);
  y += 12;
  field("Dolores actuales", data.medical.pains);
  y += 12;
  field("Problemas cardiovasculares", data.medical.conditions);
  y += 12;
  field("Cirugías recientes", data.medical.surgeries);
  y += 12;
  field("Limitaciones médicas", data.medical.limitations);
  y += 20;

  // 4. Historial Deportivo
  sectionHeader("4. HISTORIAL DEPORTIVO");
  field("Practica ejercicio", data.sports.currentlyActive);
  y += 12;
  field("Tipo de entrenamiento", data.sports.type);
  y += 12;
  field("Frecuencia semanal", data.sports.frequency);
  y += 12;
  field("Tiempo entrenando", data.sports.experienceTime);
  y += 12;
  field("Entrenador anterior", data.sports.workedWithCoach);
  y += 15;
  doc.text(`VALORACIÓN (1-5): Fuerza: ${data.sports.ratings.strength} | Resistencia: ${data.sports.ratings.endurance} | Flex: ${data.sports.ratings.flexibility} | Coord: ${data.sports.ratings.coordination}`, 20, y);
  y += 20;

  // 5. Estilo de Vida
  sectionHeader("5. ESTILO DE VIDA");
  field("Nivel actividad", data.lifestyle.activityLevel);
  y += 12;
  field("Horas trabajo", data.lifestyle.workHours);
  y += 12;
  field("Tipo trabajo", data.lifestyle.workType);
  y += 12;
  field("Estrés", data.lifestyle.stressLevel);
  y += 12;
  field("Sueño", `${data.lifestyle.sleepHours}h (${data.lifestyle.sleepQuality})`);
  y += 20;

  // 6. Hábitos Nutricionales
  sectionHeader("6. HÁBITOS NUTRICIONALES");
  field("Comidas/día", data.nutrition.mealsPerDay);
  y += 12;
  field("Dieta actual", data.nutrition.currentDiet);
  y += 12;
  field("Agua (L/día)", data.nutrition.waterIntake);
  y += 12;
  field("Alcohol", data.nutrition.alcohol);
  y += 12;
  field("Suplementación", data.nutrition.supplements);
  y += 20;

  // 7. Disponibilidad
  sectionHeader("7. DISPONIBILIDAD");
  field("Días/semana", data.availability.daysPerWeek);
  y += 12;
  field("Tiempo/sesión", data.availability.timePerSession);
  y += 12;
  field("Lugar", data.availability.location);
  y += 20;

  // 8. Mediciones
  sectionHeader("8. MEDICIONES INICIALES");
  doc.text(`Peso: ${data.measurements.weight} | Cintura: ${data.measurements.waist} | Cadera: ${data.measurements.hips} | Pecho: ${data.measurements.chest}`, 20, y);
  y += 10;
  doc.text(`Brazo: ${data.measurements.arm} | Muslo: ${data.measurements.thigh} | Pantorrilla: ${data.measurements.calf}`, 20, y);
  y += 20;

  // 9. Autoevaluación
  sectionHeader("9. AUTOEVALUACIÓN FÍSICA");
  field("Fatiga", data.selfAssessment.fatigue);
  y += 12;
  field("Ejercicio >= 3/sem", data.selfAssessment.exerciseFrequency);
  y += 12;
  field("Movilidad", data.selfAssessment.mobilityLimits);
  y += 12;
  field("10 abdominales", data.selfAssessment.abs10);
  y += 12;
  field("Nivel percibido", data.selfAssessment.perceivedLevel);
  y += 20;

  // 10. Motivación
  sectionHeader("10. MOTIVACIÓN Y ADHERENCIA");
  field("Motivación (1-5)", data.motivation.level.toString());
  y += 12;
  field("Obstáculos", data.motivation.obstacles);
  y += 12;
  field("Razón del cambio", data.motivation.reason);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("OBSERVACIONES DEL ENTRENADOR:", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(data.motivation.coachNotes || "---", 20, y, { maxWidth: 170 });

  doc.save(`Ficha_${clientName.replace(/\s+/g, '_')}.pdf`);
};

const IntakeFormModal = ({ 
  isOpen, 
  onClose, 
  client, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  client: Client; 
  onSave: (data: IntakeForm) => void 
}) => {
  const [formData, setFormData] = useState<IntakeForm>(client.intakeForm || {
    general: { fullName: client.name, age: '', gender: '', height: '', weight: '', phone: '', profession: '' },
    objectives: { main: '', other: '', specific: ['', '', ''], targetDate: '' },
    medical: { medication: '', smoker: '', injuries: '', pains: '', conditions: '', surgeries: '', limitations: '' },
    sports: { currentlyActive: '', type: '', frequency: '', experienceTime: '', workedWithCoach: '', ratings: { strength: 3, endurance: 3, flexibility: 3, coordination: 3 } },
    lifestyle: { activityLevel: '', workHours: '', workType: '', stressLevel: '', sleepHours: '', sleepQuality: '' },
    nutrition: { mealsPerDay: '', currentDiet: '', waterIntake: '', alcohol: '', supplements: '' },
    availability: { daysPerWeek: '', timePerSession: '', location: '' },
    measurements: { weight: '', waist: '', hips: '', chest: '', arm: '', thigh: '', calf: '' },
    selfAssessment: { fatigue: '', exerciseFrequency: '', mobilityLimits: '', abs10: '', perceivedLevel: '' },
    motivation: { level: 5, obstacles: '', reason: '', coachNotes: '' }
  });

  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["General", "Médico", "Deporte", "Vida", "Nutri", "Medidas", "Auto"];

  if (!isOpen) return null;

  const updateSection = (section: keyof IntakeForm, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-bg-dark border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-black italic text-text-bright">FICHA NUEVO CLIENTE</h3>
            <p className="text-xs text-text-muted">Evaluación inicial profesional</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => generateIntakePdf(formData, client.name)}
              className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              title="Descargar PDF"
            >
              <Download className="size-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-bg-surface rounded-full">
              <X className="size-6" />
            </button>
          </div>
        </header>

        <div className="flex overflow-x-auto no-scrollbar border-b border-black/10 dark:border-white/10 px-4 shrink-0">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                activeTab === i ? "border-primary text-primary" : "border-transparent text-text-muted"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    type="text" value={formData.general.fullName}
                    onChange={(e) => updateSection('general', { fullName: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Edad</label>
                    <input 
                      type="number" value={formData.general.age}
                      onChange={(e) => updateSection('general', { age: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Sexo</label>
                    <input 
                      type="text" value={formData.general.gender}
                      onChange={(e) => updateSection('general', { gender: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Altura (cm)</label>
                  <input 
                    type="number" value={formData.general.height}
                    onChange={(e) => updateSection('general', { height: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Peso (kg)</label>
                  <input 
                    type="number" value={formData.general.weight}
                    onChange={(e) => updateSection('general', { weight: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Teléfono</label>
                  <input 
                    type="text" value={formData.general.phone}
                    onChange={(e) => updateSection('general', { phone: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Profesión</label>
                <input 
                  type="text" value={formData.general.profession}
                  onChange={(e) => updateSection('general', { profession: e.target.value })}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10">
                <h4 className="text-sm font-bold mb-4">Objetivos</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Objetivo Principal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Pérdida de grasa', 'Ganancia muscular', 'Recomp. corporal', 'Rendimiento deportivo', 'Salud general', 'Otro'].map(obj => (
                        <button
                          key={obj} type="button"
                          onClick={() => updateSection('objectives', { main: obj })}
                          className={cn(
                            "py-2 px-3 rounded-lg text-xs font-bold border transition-all",
                            formData.objectives.main === obj ? "bg-primary text-bg-dark border-primary" : "bg-bg-surface/50 border-black/10 dark:border-white/10 text-text-muted"
                          )}
                        >
                          {obj}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.objectives.main === 'Otro' && (
                    <input 
                      type="text" placeholder="Especifica otro objetivo..."
                      value={formData.objectives.other}
                      onChange={(e) => updateSection('objectives', { other: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Objetivos Específicos (Máx 3)</label>
                    {formData.objectives.specific.map((s, idx) => (
                      <input 
                        key={idx} type="text" placeholder={`Objetivo ${idx + 1}`}
                        value={s}
                        onChange={(e) => {
                          const newSpecific = [...formData.objectives.specific];
                          newSpecific[idx] = e.target.value;
                          updateSection('objectives', { specific: newSpecific });
                        }}
                        className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary mb-2"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              {[
                { id: 'medication', label: '¿Tomas medicación? ¿Cuál?' },
                { id: 'smoker', label: '¿Fumas?' },
                { id: 'injuries', label: '¿Has tenido alguna lesión relevante?' },
                { id: 'pains', label: 'Dolores actuales (espalda, rodilla, etc.)' },
                { id: 'conditions', label: 'Problemas cardiovasculares / resp / metabólicos' },
                { id: 'surgeries', label: '¿Cirugías recientes?' },
                { id: 'limitations', label: '¿Alguna limitación médica para entrenar?' },
              ].map(f => (
                <div key={f.id} className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                  <textarea 
                    value={(formData.medical as any)[f.id]}
                    onChange={(e) => updateSection('medical', { [f.id]: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">¿Practicas ejercicio actualmente?</label>
                  <input 
                    type="text" value={formData.sports.currentlyActive}
                    onChange={(e) => updateSection('sports', { currentlyActive: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tipo de entrenamiento</label>
                    <input 
                      type="text" value={formData.sports.type}
                      onChange={(e) => updateSection('sports', { type: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Frecuencia semanal</label>
                    <input 
                      type="text" value={formData.sports.frequency}
                      onChange={(e) => updateSection('sports', { frequency: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tiempo entrenando</label>
                    <input 
                      type="text" value={formData.sports.experienceTime}
                      onChange={(e) => updateSection('sports', { experienceTime: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">¿Entrenador antes?</label>
                    <input 
                      type="text" value={formData.sports.workedWithCoach}
                      onChange={(e) => updateSection('sports', { workedWithCoach: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-black/10 dark:border-white/10">
                <h4 className="text-sm font-bold mb-4">Valoración (1-5)</h4>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(formData.sports.ratings).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest capitalize">{key}</label>
                        <span className="text-primary font-black">{val}</span>
                      </div>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={val}
                        onChange={(e) => updateSection('sports', { ratings: { ...formData.sports.ratings, [key]: parseInt(e.target.value) } })}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              {[
                { id: 'activityLevel', label: 'Nivel de actividad diaria (sedentario / activo)' },
                { id: 'workHours', label: 'Horas de trabajo semanales' },
                { id: 'workType', label: 'Tipo de trabajo (sentado / activo)' },
                { id: 'stressLevel', label: 'Nivel de estrés' },
                { id: 'sleepHours', label: 'Horas de sueño' },
                { id: 'sleepQuality', label: 'Calidad del descanso' },
              ].map(f => (
                <div key={f.id} className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                  <input 
                    type="text" value={(formData.lifestyle as any)[f.id]}
                    onChange={(e) => updateSection('lifestyle', { [f.id]: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-4">
              {[
                { id: 'mealsPerDay', label: 'Número de comidas al día' },
                { id: 'currentDiet', label: '¿Sigues alguna dieta actualmente?' },
                { id: 'waterIntake', label: 'Consumo de agua (L/día)' },
                { id: 'alcohol', label: 'Alcohol' },
                { id: 'supplements', label: 'Suplementación' },
              ].map(f => (
                <div key={f.id} className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                  <input 
                    type="text" value={(formData.nutrition as any)[f.id]}
                    onChange={(e) => updateSection('nutrition', { [f.id]: e.target.value })}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
              <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                <h4 className="text-sm font-bold">Disponibilidad</h4>
                {[
                  { id: 'daysPerWeek', label: 'Días por semana disponibles' },
                  { id: 'timePerSession', label: 'Tiempo por sesión' },
                  { id: 'location', label: 'Lugar de entrenamiento' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                    <input 
                      type="text" value={(formData.availability as any)[f.id]}
                      onChange={(e) => updateSection('availability', { [f.id]: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'weight', label: 'Peso' },
                  { id: 'waist', label: 'Cintura' },
                  { id: 'hips', label: 'Cadera' },
                  { id: 'chest', label: 'Pecho' },
                  { id: 'arm', label: 'Brazo' },
                  { id: 'thigh', label: 'Muslo' },
                  { id: 'calf', label: 'Pantorrilla' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                    <input 
                      type="text" value={(formData.measurements as any)[f.id]}
                      onChange={(e) => updateSection('measurements', { [f.id]: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 6 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  { id: 'fatigue', label: '¿Te fatigas fácilmente?' },
                  { id: 'exerciseFrequency', label: '¿Realizas ejercicio >= 3 veces/semana?' },
                  { id: 'mobilityLimits', label: '¿Tienes limitaciones de movilidad?' },
                  { id: 'abs10', label: '¿Puedes hacer 10 abdominales?' },
                  { id: 'perceivedLevel', label: 'Nivel general percibido' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                    <input 
                      type="text" value={(formData.selfAssessment as any)[f.id]}
                      onChange={(e) => updateSection('selfAssessment', { [f.id]: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
                <h4 className="text-sm font-bold">Motivación</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nivel de motivación (1-5)</label>
                    <span className="text-primary font-black">{formData.motivation.level}</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={formData.motivation.level}
                    onChange={(e) => updateSection('motivation', { level: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
                {[
                  { id: 'obstacles', label: 'Principales obstáculos' },
                  { id: 'reason', label: 'Razón principal para lograr el cambio' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{f.label}</label>
                    <textarea 
                      value={(formData.motivation as any)[f.id]}
                      onChange={(e) => updateSection('motivation', { [f.id]: e.target.value })}
                      className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest">Observaciones del Entrenador</label>
                  <textarea 
                    value={formData.motivation.coachNotes}
                    onChange={(e) => updateSection('motivation', { coachNotes: e.target.value })}
                    className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary resize-none h-32"
                    placeholder="Notas internas para el seguimiento..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-black/10 dark:border-white/10 bg-bg-dark shrink-0">
          <button 
            onClick={() => onSave(formData)}
            className="w-full py-4 bg-primary text-bg-dark font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-5" />
            Guardar Ficha de Cliente
          </button>
        </footer>
      </motion.div>
    </div>
  );
};

const BottomNav = ({ active, onChange, role, clientData }: { active: Screen; onChange: (s: Screen) => void; role: 'admin' | 'coach' | 'client' | null; clientData?: Client | null }) => {
  const isCoach = role === 'admin' || role === 'coach';
  
  const navItems = [
    ...(isCoach ? [{ id: 'dashboard', label: 'Panel', icon: LayoutGrid }] : [{ id: 'home', label: 'Inicio', icon: LayoutGrid }]),
    { id: 'workout', label: 'Entrenar', icon: Dumbbell, section: 'training' },
    { id: 'nutrition', label: 'Nutrición', icon: Utensils, section: 'nutrition' },
    { id: 'progress', label: 'Progreso', icon: TrendingUp, section: 'progress' },
    { id: 'profile', label: 'Perfil', icon: User },
  ].filter(item => {
    if (!item.section) return true; // Profile and Home/Dashboard are always visible
    if (clientData) {
      return clientData.enabledSections?.[item.section as keyof EnabledSections] ?? true;
    }
    return isCoach; // Coaches see everything on dashboard if no client selected
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-dark/95 backdrop-blur-lg border-t border-black/10 dark:border-white/10 px-4 pb-6 pt-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id as Screen)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              active === item.id ? "text-primary" : "text-text-muted"
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

const HomeScreen = ({ clientData, isCoach, coaches }: { clientData: Client | null; isCoach?: boolean; coaches: Coach[] }) => {
  const assignedCoach = coaches.find(c => c.id === clientData?.assignedCoachId);
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => {
    const today = new Date().toISOString().split('T')[0];
    return getSafeLocalStorage(`dailyLog_${clientData?.id || 'default'}_${today}`, {
      date: today,
      stepsCompleted: false,
      waterCompleted: false
    });
  });

  const [targets, setTargets] = useState(() => {
    return getSafeLocalStorage(`clientTargets_${clientData?.id || 'default'}`, {
      steps: clientData?.stepsTarget || 10000,
      water: clientData?.waterTarget || 2.5
    });
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`dailyLog_${clientData?.id || 'default'}_${today}`, JSON.stringify(dailyLog));
  }, [dailyLog, clientData?.id]);

  useEffect(() => {
    if (clientData?.id) {
      localStorage.setItem(`clientTargets_${clientData.id}`, JSON.stringify(targets));
    }
  }, [targets, clientData?.id]);

  const updateLog = (updates: Partial<DailyLog>) => {
    if (isCoach) return; // Coach can't log daily metrics for client
    setDailyLog(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32 transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-primary/30">
          <img src={clientData?.img || "https://picsum.photos/seed/user/100/100"} className="w-full h-full object-cover" alt="User" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-xs text-text-muted font-medium">
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
                dailyLog.stepsCompleted && !isCoach ? "border-primary bg-primary/10" : "border-black/10 dark:border-white/10"
              )}
            >
              <div className={cn("p-3 rounded-xl", dailyLog.stepsCompleted && !isCoach ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-primary")}>
                <TrendingUp className="size-6" />
              </div>
              <div className="text-center w-full">
                <p className="text-[10px] font-bold uppercase text-text-muted">Pasos</p>
                {isCoach ? (
                  <input 
                    type="number" 
                    value={targets.steps}
                    onChange={(e) => setTargets(prev => ({ ...prev, steps: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-bg-surface/30 border border-black/10 dark:border-white/10 rounded-lg text-center font-black text-lg focus:ring-1 focus:ring-primary outline-none mt-1 text-text-bright"
                  />
                ) : (
                  <p className="text-lg font-black text-text-bright">{targets.steps}</p>
                )}
              </div>
              {!isCoach && (
                <button 
                  onClick={() => updateLog({ stepsCompleted: !dailyLog.stepsCompleted })}
                  className={cn(
                    "size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    dailyLog.stepsCompleted ? "bg-primary border-primary" : "border-black/20 dark:border-white/20"
                  )}
                >
                  {dailyLog.stepsCompleted && <Check className="size-4 text-bg-dark" />}
                </button>
              )}
            </div>

            <div 
              className={cn(
                "glass-card rounded-2xl p-4 flex flex-col items-center gap-3 transition-all border-2",
                dailyLog.waterCompleted && !isCoach ? "border-primary bg-primary/10" : "border-black/10 dark:border-white/10"
              )}
            >
              <div className={cn("p-3 rounded-xl", dailyLog.waterCompleted && !isCoach ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-primary")}>
                <Flame className="size-6" />
              </div>
              <div className="text-center w-full">
                <p className="text-[10px] font-bold uppercase text-text-muted">Agua (L)</p>
                {isCoach ? (
                  <input 
                    type="number" 
                    step="0.5"
                    value={targets.water}
                    onChange={(e) => setTargets(prev => ({ ...prev, water: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-bg-surface/30 border border-black/10 dark:border-white/10 rounded-lg text-center font-black text-lg focus:ring-1 focus:ring-primary outline-none mt-1 text-text-bright"
                  />
                ) : (
                  <p className="text-lg font-black text-text-bright">{targets.water}</p>
                )}
              </div>
              {!isCoach && (
                <button 
                  onClick={() => updateLog({ waterCompleted: !dailyLog.waterCompleted })}
                  className={cn(
                    "size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    dailyLog.waterCompleted ? "bg-primary border-primary" : "border-black/20 dark:border-white/20"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block">Peso (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={dailyLog.weight || ''}
                onChange={(e) => updateLog({ weight: parseFloat(e.target.value) || undefined })}
                disabled={isCoach}
                className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                placeholder={isCoach ? "Sin registro" : "64.2"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block">Grasa (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={dailyLog.bodyFat || ''}
                onChange={(e) => updateLog({ bodyFat: parseFloat(e.target.value) || undefined })}
                disabled={isCoach}
                className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                placeholder={isCoach ? "Sin registro" : "21.4"}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Horas de Sueño</label>
                <input 
                  type="number" 
                  value={dailyLog.sleepHours || ''}
                  onChange={(e) => updateLog({ sleepHours: parseInt(e.target.value) })}
                  placeholder={isCoach ? "-" : "Ej: 8"}
                  disabled={isCoach}
                  className="w-full bg-bg-surface/30 border border-black/10 dark:border-white/10 rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Calidad</label>
                <select 
                  value={dailyLog.sleepQuality || ''}
                  onChange={(e) => updateLog({ sleepQuality: e.target.value as any })}
                  disabled={isCoach}
                  className="w-full bg-bg-surface/30 border border-black/10 dark:border-white/10 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none disabled:opacity-50"
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
            <div className="glass-card rounded-2xl p-4 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="size-4 text-primary" />
                <span className="text-[10px] font-bold uppercase text-text-muted">Entrenamiento</span>
              </div>
              <p className="text-sm font-bold">Próxima sesión:</p>
              <p className="text-primary text-xs font-bold">Empuje (Mañana)</p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="size-4 text-primary" />
                <span className="text-[10px] font-bold uppercase text-text-muted">Nutrición</span>
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

const DashboardScreen = ({ 
  coach, 
  clients, 
  notifications, 
  onAddClient, 
  onSelectClient, 
  onMarkNotificationRead,
  onUpdateClient,
  userRole,
  setScreen
}: { 
  coach: Coach | null; 
  clients: Client[]; 
  notifications: any[]; 
  onAddClient: () => void; 
  onSelectClient: (client: Client) => void; 
  onMarkNotificationRead: (id: string) => void;
  onUpdateClient: (id: string, updates: Partial<Client>) => void;
  userRole: 'admin' | 'coach' | 'client' | null;
  setScreen: (screen: Screen) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingSections, setEditingSections] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  const unreadCount = notifications.filter(n => !n?.read).length;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '--:--';
    try {
      if (timestamp instanceof Date) return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return '--:--';
    } catch (e) {
      return '--:--';
    }
  };

  const engagementData = [
    { day: 'MON', value: 65 },
    { day: 'TUE', value: 85 },
    { day: 'WED', value: 45 },
    { day: 'THU', value: 95 },
    { day: 'FRI', value: 70 },
    { day: 'SAT', value: 30 },
    { day: 'SUN', value: 20 },
  ];

  const safeClients = (clients ?? [])
    .filter(Boolean)
    .map((client) => ({
      ...client,
      enabledSections: normalizeEnabledSections(client?.enabledSections),
    }));

  const filteredClients = safeClients.filter(c => {
    if (!c) return false;
    if (c.isDeleted) return false;
    
    const matchesSearch = c?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? c.active :
      !c.active;

    let matchesCoach = true;
    if (isAdmin) {
      matchesCoach = coachFilter === 'all' || c.assignedCoachId === coachFilter;
    } else if (userRole === 'coach') {
      matchesCoach = c.assignedCoachId === coach?.id || c?.id?.startsWith('self_');
    }

    return matchesSearch && matchesStatus && matchesCoach;
  });

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright pb-24 transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="size-10 shrink-0 overflow-hidden rounded-full border border-primary/30">
          <img src={coach?.img || "https://picsum.photos/seed/coach/100/100"} className="w-full h-full object-cover" alt="Coach" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-xs text-text-muted font-medium">{isAdmin ? 'Panel de Administrador' : 'Panel de Entrenador'}</p>
          <h2 className="text-lg font-bold leading-tight tracking-tight">{coach?.name || 'Coach'}</h2>
        </div>
        <button 
          onClick={() => setShowNotifications(true)}
          className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary relative"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-bg-dark">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-bg-dark border-l border-black/10 dark:border-white/10 z-50 flex flex-col"
            >
              <header className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black italic">Notificaciones</h3>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-bg-surface/50 rounded-full">
                  <ChevronRight className="size-6" />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        n.read ? "bg-bg-surface/50 border-black/10 dark:border-white/10 opacity-60" : "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Molestia Reportada</span>
                        <span className="text-[10px] text-text-muted">{formatTime(n.timestamp)}</span>
                      </div>
                      <p className="text-sm font-bold mb-1">
                        <span className="text-primary">{n.clientName}</span> reportó molestias en:
                      </p>
                      <p className="text-sm text-text-bright font-medium bg-bg-surface/50 p-2 rounded-lg border border-black/10 dark:border-white/10 mb-3">
                        {n.exerciseName}
                      </p>
                      {n.painLevel && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Intensidad:</span>
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black",
                            n.painLevel > 7 ? "bg-red-500 text-white" : n.painLevel > 4 ? "bg-orange-500 text-white" : "bg-yellow-500 text-bg-dark"
                          )}>
                            {n.painLevel}/10
                          </div>
                        </div>
                      )}
                      {n.description && (
                        <div className="mb-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Detalles de la molestia:</p>
                          <p className="text-xs text-text-muted italic">"{n.description}"</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {!n.read && (
                          <button 
                            onClick={() => onMarkNotificationRead(n.id)}
                            className="flex-1 py-2 bg-primary text-bg-dark text-[10px] font-black uppercase rounded-lg"
                          >
                            Marcar Leída
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            const client = clients.find(c => c.id === n.clientId);
                            if (client) {
                              onSelectClient(client);
                              setShowNotifications(false);
                            }
                          }}
                          className="flex-1 py-2 bg-bg-surface/50 text-text-bright text-[10px] font-black uppercase rounded-lg border border-black/10 dark:border-white/10"
                        >
                          Ver Perfil
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <Bell className="size-12 mb-4" />
                    <p className="font-bold">No tienes notificaciones</p>
                    <p className="text-xs mt-1">Todo está bajo control por ahora.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const selfClient = clients.find(c => c.id === `self_${coach?.id}`);
              if (selfClient) onSelectClient(selfClient);
            }}
            className="flex-1 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <User className="size-4" /> Mi Seguimiento
          </button>
          <button 
            onClick={onAddClient}
            className="flex-1 py-3 bg-primary text-bg-dark rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Plus className="size-4" /> Nuevo Cliente
          </button>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setScreen('user_management')}
            className="w-full py-3 bg-bg-surface/50 text-text-bright border border-black/10 dark:border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-bg-surface/80 transition-all"
          >
            <Users className="size-4" /> Gestión de Usuarios (Admin)
          </button>
        )}
      </div>

      <section className="px-4 py-2">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-base font-bold">Actividad Semanal</h3>
              <p className="text-text-muted text-xs">Media de actividad 85%</p>
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
                <span className={cn("text-[10px] font-bold", d.value > 70 ? "text-primary" : "text-text-muted")}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="p-4 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[22px] font-bold tracking-tight text-text-bright">Mis Clientes</h3>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-surface/50 px-2 py-1 rounded-md">
              {filteredClients.length} Resultados
            </span>
          </div>

          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
              <input 
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 text-sm text-text-bright focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {isAdmin ? (
                <select 
                  value={coachFilter}
                  onChange={(e) => setCoachFilter(e.target.value)}
                  className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="all">Todos los Coaches</option>
                  {/* We need to pass coaches list to DashboardScreen if we want to show names here */}
                  {/* For now, let's just show IDs or assume we have the list */}
                  {Array.from(new Set(clients.map(c => c.assignedCoachId))).filter(Boolean).map(id => (
                    <option key={id} value={id}>Coach {id.slice(0, 4)}</option>
                  ))}
                </select>
              ) : (
                <button 
                  onClick={() => setCoachFilter(coachFilter === 'all' ? (coach?.id || 'all') : 'all')}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                    coachFilter !== 'all' ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
                  )}
                >
                  <User className="size-3" /> {coachFilter !== 'all' ? 'Mis Clientes' : 'Todos'}
                </button>
              )}
              <button 
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === 'all' ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
                )}
              >
                Todos
              </button>
              <button 
                onClick={() => setStatusFilter('active')}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === 'active' ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
                )}
              >
                Activos
              </button>
              <button 
                onClick={() => setStatusFilter('inactive')}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === 'inactive' ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
                )}
              >
                Inactivos
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const enabledSections = normalizeEnabledSections(client?.enabledSections);
              
              return (
                <div key={client.id} className="relative">
                  <div 
                    className={cn(
                      "w-full flex items-center gap-4 p-4 glass-card rounded-xl transition-all hover:bg-bg-surface/50",
                      !client.active && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div 
                      className="flex-1 flex items-center gap-4 cursor-pointer"
                      onClick={() => onSelectClient(client)}
                    >
                      <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20">
                        <img src={client?.img} className="w-full h-full object-cover" alt={client?.name} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-text-bright">{client?.name}</h4>
                          {!client?.active && (
                            <span className="text-[8px] bg-text-muted text-bg-dark px-1.5 py-0.5 rounded-full font-bold uppercase">Inactivo</span>
                          )}
                        </div>
                        <p className="text-text-muted text-xs mt-0.5">{client.program}</p>
                        <div className="flex gap-2 mt-2">
                          {enabledSections.training && <Dumbbell className="size-3 text-primary" />}
                          {enabledSections.nutrition && <Utensils className="size-3 text-primary" />}
                          {enabledSections.progress && <TrendingUp className="size-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="text-right">
                        <p className="text-xs font-bold text-text-bright">{client.status}</p>
                        <p className={cn("text-[10px] font-medium uppercase tracking-tight", client.active ? "text-primary" : "text-text-muted")}>
                          {client.active ? 'Activo' : 'Descanso'}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSections(editingSections === client.id ? null : client.id);
                        }}
                        className="p-1.5 bg-bg-surface/50 rounded-lg text-text-muted hover:text-primary transition-colors"
                      >
                        <Settings className="size-4" />
                      </button>
                      {!isAdmin && client.assignedCoachId !== coach?.id && !client?.id?.startsWith('self_') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateClient(client.id, { assignedCoachId: coach?.id || '' });
                          }}
                          className="p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary/20 transition-colors"
                          title="Asignarme este cliente"
                        >
                          <UserPlus className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {editingSections === client.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-4 p-4 bg-bg-surface/50 border-x border-b border-black/10 dark:border-white/10 rounded-b-xl space-y-3">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Secciones Activas</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(['training', 'nutrition', 'progress'] as const).map(section => (
                              <button
                                key={section}
                                onClick={() => {
                                  onUpdateClient(client.id, {
                                    enabledSections: {
                                      ...(client.enabledSections || { training: true, nutrition: true, progress: true }),
                                      [section]: !(client.enabledSections?.[section] ?? true)
                                    }
                                  });
                                }}
                                className={cn(
                                  "py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                                  (client.enabledSections?.[section] ?? true) 
                                    ? "bg-primary/20 border-primary/40 text-primary" 
                                    : "bg-bg-surface/50 border-black/10 dark:border-white/10 text-text-muted"
                                )}
                              >
                                {section === 'training' ? 'Entreno' : section === 'nutrition' ? 'Nutri' : 'Progreso'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4 glass-card rounded-2xl border-dashed border-black/10 dark:border-white/10">
              <div className="size-16 rounded-full bg-bg-surface/50 flex items-center justify-center">
                <Search className="size-8 text-text-muted" />
              </div>
              <div>
                <p className="text-text-muted font-medium">No se encontraron clientes</p>
                <p className="text-text-muted text-xs mt-1">Prueba con otros filtros o términos de búsqueda</p>
              </div>
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="text-primary text-xs font-bold uppercase tracking-widest hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
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
    <div className="min-h-screen bg-bg-dark text-text-bright flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,95,235,0.1),transparent_70%)] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="bg-primary/20 p-6 rounded-3xl mb-8 animate-bounce">
          <Dumbbell className="text-primary size-16" />
        </div>
        
        <h1 className="text-5xl font-black text-center mb-4 tracking-tighter italic">
          BeFit <span className="text-primary neon-text">PRO</span>
        </h1>
        <p className="text-text-muted text-center text-lg mb-12 max-w-[280px]">
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

        <p className="mt-12 text-text-muted/60 text-sm font-medium">
          Álvaro Ruíz • Entrenador Personal
        </p>
      </div>
    </div>
  );
};

const UserManagementScreen = ({ 
  users, 
  onBack, 
  onBlockUser, 
  onDeleteUser 
}: { 
  users: UserProfile[]; 
  onBack: () => void;
  onBlockUser: (uid: string, disabled: boolean) => Promise<void>;
  onDeleteUser: (uid: string) => Promise<void>;
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coach' | 'client'>('all');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright p-4">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-bg-surface/50 rounded-full">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="text-2xl font-black italic">Gestión de Usuarios</h1>
      </header>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'admin', 'coach', 'client'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r as any)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                roleFilter === r ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
              )}
            >
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="p-4 glass-card rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{user.name}</h3>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                  user.role === 'admin' ? "bg-red-500 text-white" : user.role === 'coach' ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted"
                )}>
                  {user.role}
                </span>
                {!user.active && (
                  <span className="bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                    Bloqueado
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onBlockUser(user.id, user.active)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  user.active ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                )}
                title={user.active ? "Bloquear" : "Desbloquear"}
              >
                <Lock className="size-4" />
              </button>
              <button 
                onClick={() => setUserToDelete(user)}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                title="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {userToDelete && (
          <CustomConfirm
            title="¿Eliminar usuario?"
            message={`¿Estás seguro de eliminar a ${userToDelete.name}? Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            isDestructive={true}
            onConfirm={() => {
              onDeleteUser(userToDelete.id);
              setUserToDelete(null);
            }}
            onCancel={() => setUserToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RegisterScreen = ({ 
  onRegister, 
  onBack, 
  coaches, 
  userRole 
}: { 
  onRegister: (email: string, pass: string, name: string, role: 'client' | 'coach' | 'admin', assignedCoachId?: string) => void; 
  onBack: () => void;
  coaches: Coach[];
  userRole: 'admin' | 'coach' | 'client' | null;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'coach' | 'admin'>('client');
  const [assignedCoachId, setAssignedCoachId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === 'admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (role === 'client' && !assignedCoachId && !isAdmin) {
      setError('Debes asignar un coach');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (role === 'client' && isAdmin && !assignedCoachId) {
      setError('Por favor, asigna un coach al cliente');
      return;
    }

    setLoading(true);
    try {
      await onRegister(email, password, name, role, assignedCoachId);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright flex flex-col p-6 max-w-md mx-auto w-full transition-colors duration-300">
      <header className="pt-6 mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-bg-surface transition-colors">
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Nuevo Usuario</h1>
          <p className="text-text-muted">Crea una cuenta para tu cliente o coach</p>
        </div>
      </header>

      <form className="space-y-4 flex-1 pb-12" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-muted ml-1">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
              placeholder="Juan Pérez" 
              type="text" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-muted ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
            <input 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
              placeholder="cliente@ejemplo.com" 
              type="email" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-muted ml-1">Rol</label>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setRole('client')}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all border",
                role === 'client' ? "bg-primary text-bg-dark border-primary" : "bg-bg-surface/50 border-black/10 dark:border-white/10 text-text-muted"
              )}
            >
              Cliente
            </button>
            {isAdmin && (
              <>
                <button 
                  type="button"
                  onClick={() => setRole('coach')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm transition-all border",
                    role === 'coach' ? "bg-secondary text-bg-dark border-secondary" : "bg-bg-surface/50 border-black/10 dark:border-white/10 text-text-muted"
                  )}
                >
                  Coach
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('admin')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm transition-all border",
                    role === 'admin' ? "bg-red-500 text-white border-red-500" : "bg-bg-surface/50 border-black/10 dark:border-white/10 text-text-muted"
                  )}
                >
                  Admin
                </button>
              </>
            )}
          </div>
        </div>

        {role === 'client' && isAdmin && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted ml-1">Asignar Coach</label>
            <select 
              required
              value={assignedCoachId}
              onChange={(e) => setAssignedCoachId(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none"
            >
              <option value="" disabled>Seleccionar Coach</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-muted ml-1">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
            <input 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
              placeholder="••••••••" 
              type="password" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-muted ml-1">Confirmar Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
            <input 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
              placeholder="••••••••" 
              type="password" 
            />
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full h-14 bg-primary text-bg-dark font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="size-6 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
          ) : (
            <>
              <span>Crear Cuenta</span>
              <ChevronRight className="size-6" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState('');
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
    <div className="min-h-screen bg-bg-dark text-text-bright flex flex-col">
      <header className="w-full max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleBack}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full bg-bg-surface/50 text-text-bright transition-opacity",
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
            <p className="text-sm font-medium text-text-muted">Paso {step} de {totalSteps}</p>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{stepTitles[step - 1]}</p>
          </div>
          <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
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
                <h2 className="text-2xl font-bold mb-6 text-text-bright italic">Cuéntanos sobre ti</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Nombre y Apellidos</label>
                  <input className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Juan Pérez" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Género</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none outline-none">
                    <option disabled value="">Selecciona tu género</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">No binario / Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Fecha de nacimiento</label>
                  <div className="relative">
                    <input 
                      className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
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
                      <CalendarDays className="text-text-muted size-5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-6 text-text-bright italic">Tus medidas</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Altura (cm)</label>
                  <input className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="175" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Peso actual (kg)</label>
                    <input className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="70" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Peso objetivo (kg)</label>
                    <input className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="65" type="number" />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold mb-6 text-text-bright italic">Tu estilo de vida</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Nivel de actividad actual</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none outline-none">
                    <option disabled value="">Selecciona tu actividad</option>
                    <option value="sedentary">Sedentario (Poco o nada de ejercicio)</option>
                    <option value="active">Activo (Ejercicio 3-5 días/semana)</option>
                    <option value="very_active">Muy activo (Ejercicio 6-7 días/semana)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Volumen de entrenamiento actual</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none outline-none">
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
                <h2 className="text-2xl font-bold mb-6 text-text-bright italic">Experiencia y Motivación</h2>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Experiencia entrenando en gimnasio</label>
                  <select defaultValue="" className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none outline-none">
                    <option disabled value="">Selecciona tu experiencia</option>
                    <option value="beginner">Principiante (Menos de 6 meses)</option>
                    <option value="intermediate">Intermedio (6 meses a 2 años)</option>
                    <option value="advanced">Avanzado (Más de 2 años)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted ml-1">Nivel de motivación</label>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      defaultValue="7" 
                      className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
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
        <p className="text-center text-text-muted text-xs px-6">
          {step === 2 
            ? "Usamos esta información para calcular tu IMC y ajustar tu plan calórico de forma segura."
            : "Tus datos están seguros con nosotros y se usan exclusivamente para personalizar tu experiencia."}
        </p>
      </footer>
    </div>
  );
};

const LoginScreen = ({ setToast, onLogin, onBootstrap }: { 
  setToast: (toast: { show: boolean; message: string; type: 'success' | 'error' | 'info' }) => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onBootstrap: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminRecovery, setShowAdminRecovery] = useState(false);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setShowAdminRecovery(true);
      setToast({ show: true, message: "Modo recuperación activado", type: 'success' });
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setToast({ show: true, message: 'Por favor, introduce tu email', type: 'error' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setToast({ show: true, message: '✓ Email de recuperación enviado', type: 'success' });
      setShowForgotModal(false);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      setToast({ show: true, message: 'Error al enviar el email de recuperación', type: 'error' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError('Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright flex flex-col justify-center px-6 max-w-[480px] mx-auto w-full relative overflow-hidden transition-colors duration-300 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,95,235,0.08),transparent_70%)] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div 
          className="bg-primary/20 p-8 rounded-3xl mb-6 cursor-pointer active:scale-95 transition-transform select-none"
          onClick={handleLogoClick}
        >
          <Dumbbell className="text-primary size-16" />
        </div>
        <h1 className="text-[32px] font-bold leading-tight text-center">Bienvenido de nuevo</h1>
        <p className="text-text-muted text-base mt-2 text-center">Accede a tu plan personalizado</p>
      </div>

        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold ml-1">Correo electrónico</label>
          <div className="relative">
            <input 
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="ejemplo@email.com" 
              type="email" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Mail className="size-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold ml-1">Contraseña</label>
          <div className="relative">
            <input 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="••••••••" 
              type="password" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Lock className="size-5" />
            </div>
          </div>
          <p className="text-[10px] text-text-muted/60 ml-1">Mínimo 6 caracteres</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 bg-primary text-bg-dark font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
          {loading ? (
            <div className="size-6 border-2 border-bg-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Entrar</span>
              <ChevronRight className="size-6" />
            </>
          )}
        </button>

        <button 
          type="button"
          onClick={() => setShowForgotModal(true)}
          className="text-primary text-sm font-bold mt-2 hover:underline w-full text-center"
        >
          ¿Has olvidado tu contraseña?
        </button>

        {showAdminRecovery && (
          <button 
            type="button"
            onClick={onBootstrap}
            className="w-full h-14 bg-red-500 text-white font-bold rounded-xl mt-6 animate-pulse flex items-center justify-center gap-2"
          >
            <ShieldAlert className="size-5" />
            Reparar Acceso Admin
          </button>
        )}
      </form>

      <div className="mt-12 text-center relative z-10">
        <p className="text-text-muted text-sm italic">
          Solo el administrador puede crear nuevas cuentas.
        </p>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-text-muted font-mono opacity-50">
            DEBUG: {firebaseConfig.projectId} | {firebaseConfig.firestoreDatabaseId.substring(0, 8)}...
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showForgotModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-bg-dark border border-black/5 dark:border-white/10 rounded-3xl p-8 z-[110] shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Mail className="size-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight">Recuperar Acceso</h3>
                  <p className="text-sm text-text-muted mt-2">Introduce tu email y te enviaremos las instrucciones.</p>
                </div>
                
                <div className="w-full text-left space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Email de recuperación</label>
                  <input 
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full h-14 bg-bg-surface/50 border border-black/5 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={handleForgotPassword}
                    className="w-full py-4 bg-primary text-bg-dark rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    Enviar Instrucciones
                  </button>
                  <button 
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-4 bg-bg-surface text-text-bright rounded-xl font-bold text-sm border border-black/5 dark:border-white/10"
                  >
                    Volver
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const WorkoutScreen = ({ isCoach, clientData, onReportDiscomfort }: { isCoach?: boolean; clientData?: Client | null; onReportDiscomfort?: (exerciseName: string, description?: string, painLevel?: number) => void }) => {
  const [view, setView] = useState<'days' | 'exercises' | 'detail' | 'summary'>('days');
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [problematicExercises, setProblematicExercises] = useState<number[]>([]);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://picsum.photos/seed/benchpress/800/450");
  const [fatigue, setFatigue] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [showPainModal, setShowPainModal] = useState(false);
  const [painDescription, setPainDescription] = useState("");
  const [painLevel, setPainLevel] = useState(5);

  // ExerciseDB Integration
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem(`workoutDays_${clientData?.id || 'default'}`);
    if (saved) return JSON.parse(saved);
    return [
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
    ];
  });

  useEffect(() => {
    localStorage.setItem(`workoutDays_${clientData?.id || 'default'}`, JSON.stringify(workoutDays));
  }, [workoutDays, clientData?.id]);

  // Sync sets state back to workoutDays when it changes (for coach programming)
  useEffect(() => {
    if (isCoach && selectedDay && currentExerciseIdx !== -1 && sets.length > 0) {
      const currentEx = selectedDay?.exercises?.[currentExerciseIdx];
      if (!currentEx) return;
      // Only update if there's a meaningful change to avoid infinite loops
      if (JSON.stringify(currentEx.initialSets) !== JSON.stringify(sets)) {
        setWorkoutDays(prev => prev.map(d => {
          if (d.id === selectedDay.id) {
            const updatedExercises = d.exercises.map((ex, idx) => 
              idx === currentExerciseIdx ? { ...ex, initialSets: sets } : ex
            );
            return { ...d, exercises: updatedExercises };
          }
          return d;
        }));
        
        setSelectedDay(prev => {
          if (!prev || prev.id !== selectedDay.id) return prev;
          const updatedExercises = prev.exercises.map((ex, idx) => 
            idx === currentExerciseIdx ? { ...ex, initialSets: sets } : ex
          );
          return { ...prev, exercises: updatedExercises };
        });
      }
    }
  }, [sets, isCoach, currentExerciseIdx, selectedDay?.id]);

  const searchExercises = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Search in internal library
      const q = query(
        collection(db, "exercises_library"),
        where("name_lowercase", ">=", searchQuery.toLowerCase()),
        where("name_lowercase", "<=", searchQuery.toLowerCase() + "\uf8ff")
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "exercises_library");
        return;
      }
      const libraryResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSearchResults(libraryResults);
      
      if (libraryResults.length === 0) {
        setSearchError(`No se encontraron ejercicios en tu biblioteca para "${searchQuery}". Crea uno nuevo para guardarlo.`);
      }
    } catch (error: any) {
      console.error("Search Error:", error);
      setSearchError("Error al conectar con la base de datos interna.");
    } finally {
      setIsSearching(false);
    }
  };

  const saveExerciseToLibrary = async (exercise: Exercise) => {
    if (!exercise.name) return;
    setIsSavingLibrary(true);
    setLibraryMessage(null);

    try {
      const nameLower = exercise.name.toLowerCase().trim();
      const q = query(collection(db, "exercises_library"), where("name_lowercase", "==", nameLower));
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "exercises_library");
        return;
      }

      if (!querySnapshot.empty) {
        setLibraryMessage({ text: "Este ejercicio ya existe en la biblioteca.", type: 'info' });
        setIsSavingLibrary(false);
        return;
      }

      try {
        await addDoc(collection(db, "exercises_library"), {
          name: exercise.name,
          name_lowercase: nameLower,
          video: exercise.video,
          equipment: exercise.equipment || "",
          bodyPart: exercise.bodyPart || "",
          target: exercise.target || "",
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "exercises_library");
        return;
      }

      setLibraryMessage({ text: "Ejercicio guardado en la biblioteca.", type: 'success' });
    } catch (error: any) {
      console.error("Save Error:", error.message || error);
      setLibraryMessage({ text: error.message || "Error al guardar en la biblioteca.", type: 'error' });
    } finally {
      setIsSavingLibrary(false);
      setTimeout(() => setLibraryMessage(null), 3000);
    }
  };

  const addExerciseToDay = (exerciseData: any) => {
    if (!selectedDay) return;
    
    const newExercise: Exercise = {
      id: Date.now(),
      name: exerciseData.name.charAt(0).toUpperCase() + exerciseData.name.slice(1),
      sets: 3,
      reps: '10-12',
      rest: 90,
      video: exerciseData.gifUrl || "https://picsum.photos/seed/exercise/800/450",
      gifUrl: exerciseData.gifUrl,
      bodyPart: exerciseData.bodyPart,
      equipment: exerciseData.equipment,
      target: exerciseData.target,
      initialSets: [
        { id: 1, kg: null, reps: 10, rpe: null, rir: null, completed: false },
        { id: 2, kg: null, reps: 10, rpe: null, rir: null, completed: false },
        { id: 3, kg: null, reps: 10, rpe: null, rir: null, completed: false },
      ]
    };

    const updatedDays = workoutDays.map(d => {
      if (d.id === selectedDay.id) {
        return { ...d, exercises: [...d.exercises, newExercise] };
      }
      return d;
    });
    
    setWorkoutDays(updatedDays);
    setSelectedDay({ ...selectedDay, exercises: [...selectedDay.exercises, newExercise] });
    setShowExerciseSearch(false);
  };

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

  const startWorkout = (day: WorkoutDay) => {
    setSelectedDay(day);
    setCurrentExerciseIdx(0);
    if (isCoach) {
      setView('exercises');
    } else if (day.exercises.length > 0) {
      setSets(day.exercises[0].initialSets);
      setVideoUrl(day.exercises[0].video);
      setView('detail');
    } else {
      setView('exercises');
    }
  };

  const currentExercise = selectedDay?.exercises?.[currentExerciseIdx];

  const toggleSet = (id: number) => {
    if (isCoach) return;
    const set = sets.find(s => s.id === id);
    if (!set) return;

    const isMandatory = currentExercise?.clientEntersWeight;
    if (isMandatory && !set.kg && !set.completed) {
      return;
    }

    const newSets = sets.map(s => {
      if (s.id === id) {
        const newState = !s.completed;
        if (newState) {
          // Start rest timer automatically
          setRestTime(currentExercise?.rest ?? 0);
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
    const exercise = selectedDay?.exercises?.[currentExerciseIdx];
    if (onReportDiscomfort && exercise) {
      onReportDiscomfort(exercise.name, painDescription, painLevel);
    }
    if (exercise) {
      setProblematicExercises([...problematicExercises, exercise.id]);
    }
    setPainDescription("");
    setPainLevel(5);
    setShowPainModal(false);
    nextExercise();
  };

  const nextExercise = () => {
    if (selectedDay?.exercises?.[currentExerciseIdx + 1]) {
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const deleteWorkoutDay = (id: number) => {
    setWorkoutDays(workoutDays.filter(d => d.id !== id));
    setShowDeleteConfirm(null);
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

  const saveVideoUrl = () => {
    if (!selectedDay) return;
    const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
      idx === currentExerciseIdx ? { ...ex, video: videoUrl } : ex
    ) || [];
    const updatedDays = workoutDays.map(d => 
      d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d
    );
    setWorkoutDays(updatedDays);
    if (selectedDay) {
      setSelectedDay({ ...selectedDay, exercises: updatedExercises });
    }
    setShowVideoEditor(false);
  };

  const renderExerciseMedia = () => {
    if (!videoUrl) return null;

    const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isVimeo = videoUrl.includes('vimeo.com');
    const isGif = videoUrl.toLowerCase().endsWith('.gif') || videoUrl.includes('exercisedb');

    if (isYoutube) {
      let videoId = '';
      if (videoUrl.includes('v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
      }
      return (
        <iframe 
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (isVimeo) {
      const videoId = videoUrl.split('/').pop();
      return (
        <iframe 
          src={`https://player.vimeo.com/video/${videoId}`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <img 
        src={videoUrl} 
        className="absolute inset-0 w-full h-full object-cover" 
        alt="Exercise Media" 
        referrerPolicy="no-referrer"
      />
    );
  };

  // Remove the old definition of currentExercise since we moved it up

  const allSetsCompleted = sets.length > 0 && sets.every(s => {
    const isCompleted = s.completed;
    const weightEntered = !currentExercise?.clientEntersWeight || (s.kg !== undefined && s.kg !== null && s.kg > 0);
    return isCompleted && weightEntered;
  });

  if (view === 'days') {
    return (
      <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
        <header className="p-6">
          <h1 className="text-3xl font-black italic tracking-tighter text-text-bright">
            {isCoach ? `Programación: ${clientData?.name}` : 'Mis Entrenamientos'}
          </h1>
          <p className="text-text-muted font-medium">Selecciona una sesión para comenzar</p>
        </header>
        <main className="p-4 space-y-4">
          {workoutDays.map((day) => (
            <div key={day.id} className="relative group">
              <button 
                onClick={() => startWorkout(day)}
                className="w-full glass-card rounded-2xl p-5 text-left border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors text-text-bright">{day.title}</h3>
                    <p className="text-text-muted text-sm mt-1">{day.subtitle}</p>
                    <div className="flex gap-4 mt-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-text-muted">
                        <Dumbbell className="size-3" /> {day.exercises.length} Ejercicios
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-text-muted">
                        <Timer className="size-3" /> ~65 min
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-6 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </button>
              {isCoach && (
                <div className="absolute top-4 right-12 flex gap-2">
                  {showDeleteConfirm === day.id ? (
                    <div className="flex items-center gap-2 bg-red-500 rounded-lg px-3 py-1 animate-in fade-in slide-in-from-right-2">
                      <span className="text-[10px] font-bold text-white uppercase">¿Borrar?</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkoutDay(day.id);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-white"
                      >
                        <Check className="size-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(day.id);
                      }}
                      className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar día"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {isCoach && (
            <button 
              onClick={addWorkoutDay}
              className="w-full py-6 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl text-text-muted font-bold flex flex-col items-center gap-2 hover:border-primary/40 hover:text-primary transition-all"
            >
              <PlusCircle className="size-8" />
              <span>Añadir Nuevo Día de Entrenamiento</span>
            </button>
          )}
        </main>
      </div>
    );
  }

  if (view === 'exercises') {
    return (
      <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
        <header className="p-6 flex items-center gap-4 border-b border-black/10 dark:border-white/10 bg-bg-dark/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setView('days')} className="p-2 hover:bg-bg-surface/50 rounded-full transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-xl font-black italic tracking-tight text-text-bright">{selectedDay?.title}</h1>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Gestión de Ejercicios</p>
          </div>
        </header>

        <main className="p-4 space-y-3">
          {selectedDay?.exercises?.map((ex, idx) => (
            <div key={ex.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-black/5 dark:border-white/5">
              <div className="size-16 rounded-xl bg-bg-surface bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${ex.video})` }}></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-bright truncate">{ex.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{ex.sets} Series • {ex.reps} Reps</p>
                  {ex.equipment && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                      {ex.equipment}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCurrentExerciseIdx(idx);
                    setSets(ex.initialSets);
                    setVideoUrl(ex.video);
                    setView('detail');
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <Settings className="size-5" />
                </button>
                <button 
                  onClick={() => {
                    const updatedExercises = selectedDay?.exercises?.filter(e => e.id !== ex.id) || [];
                    const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                    setWorkoutDays(updatedDays);
                    if (selectedDay) {
                      setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => setShowExerciseSearch(true)}
            className="w-full py-6 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl text-primary font-bold flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/40 transition-all"
          >
            <PlusCircle className="size-8" />
            <span>Añadir Ejercicio de la Base de Datos</span>
          </button>

          <button 
            onClick={() => {
              const newEx: Exercise = {
                id: Date.now(),
                name: 'Nuevo Ejercicio',
                sets: 3,
                reps: '10-12',
                rest: 90,
                video: 'https://picsum.photos/seed/exercise/800/450',
                initialSets: [
                  { id: 1, kg: null, reps: 10, rpe: null, rir: null, completed: false },
                  { id: 2, kg: null, reps: 10, rpe: null, rir: null, completed: false },
                  { id: 3, kg: null, reps: 10, rpe: null, rir: null, completed: false },
                ]
              };
              const updatedExercises = [...(selectedDay?.exercises || []), newEx];
              const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
              setWorkoutDays(updatedDays);
              if (selectedDay) {
                setSelectedDay({ ...selectedDay, exercises: updatedExercises });
              }
            }}
            className="w-full py-4 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-2xl text-text-bright font-bold text-sm hover:bg-bg-surface transition-all"
          >
            Añadir Ejercicio Manualmente
          </button>
        </main>

        <AnimatePresence>
          {showExerciseSearch && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowExerciseSearch(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80]"
              />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-black/10 dark:border-white/10 rounded-t-[32px] p-6 z-[90] max-h-[90vh] overflow-y-auto"
              >
                <div className="w-12 h-1.5 bg-bg-surface/50 rounded-full mx-auto mb-6" />
                <h3 className="text-2xl font-black italic mb-6 text-text-bright">Buscar Ejercicios</h3>
                
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchExercises()}
                      placeholder="Ej: Bench press, Squat..."
                      className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <button 
                    onClick={searchExercises}
                    disabled={isSearching}
                    className="bg-primary text-bg-dark px-6 rounded-xl font-black disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'BUSCAR'}
                  </button>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      const newEx = {
                        name: searchQuery || 'Nuevo Ejercicio',
                        bodyPart: 'Personalizado',
                        target: 'Varios',
                        equipment: 'Varios',
                        gifUrl: 'https://picsum.photos/seed/exercise/800/450'
                      };
                      addExerciseToDay(newEx);
                    }}
                    className="w-full py-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary font-bold text-sm hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="size-5" />
                    Añadir "{searchQuery || 'Nuevo Ejercicio'}" Manualmente
                  </button>

                  {searchError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-3">
                      <Info className="size-5 shrink-0 mt-0.5" />
                      <p>{searchError}</p>
                    </div>
                  )}

                  {searchResults.length > 0 ? searchResults.map((ex: any) => (
                    <button 
                      key={ex.id}
                      onClick={() => addExerciseToDay({
                        ...ex,
                        gifUrl: ex.video // Map video to gifUrl for consistency in existing code
                      })}
                      className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all text-left"
                    >
                      <div className="size-20 rounded-xl bg-bg-surface overflow-hidden shrink-0">
                        <img 
                          src={ex.video || ex.gifUrl} 
                          className="w-full h-full object-cover" 
                          alt={ex.name} 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg leading-tight text-text-bright">{ex.name.charAt(0).toUpperCase() + ex.name.slice(1)}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ex.bodyPart && <span className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-1 rounded-md">{ex.bodyPart}</span>}
                          {ex.target && <span className="bg-bg-surface/50 text-text-muted text-[8px] font-black uppercase px-2 py-1 rounded-md">{ex.target}</span>}
                          {ex.equipment && <span className="bg-bg-surface/50 text-text-muted text-[8px] font-black uppercase px-2 py-1 rounded-md">{ex.equipment}</span>}
                        </div>
                      </div>
                      <Plus className="size-6 text-primary" />
                    </button>
                  )) : searchQuery && !isSearching && !searchError && (
                    <div className="text-center py-12 text-text-muted">
                      <p>No se encontraron ejercicios.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }
  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-bg-dark text-text-bright p-6 flex flex-col">
        <header className="mb-8 text-center">
          <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-12 text-primary" />
          </div>
          <h1 className="text-3xl font-black italic text-text-bright">¡Entrenamiento Finalizado!</h1>
          <p className="text-text-muted">Gran trabajo hoy, completa el feedback para tu coach.</p>
        </header>
        <main className="flex-1 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-text-muted">Nivel de Fatiga (1-10)</label>
            <div className="flex flex-col gap-4">
              <input 
                type="range" min="1" max="10" value={fatigue} 
                onChange={(e) => setFatigue(parseInt(e.target.value))}
                className="w-full h-2 bg-bg-surface/50 rounded-lg appearance-none cursor-pointer accent-primary" 
              />
              <div className="flex justify-between text-xs font-bold text-text-muted">
                <span>Fresco</span>
                <span className="text-primary text-lg">{fatigue}</span>
                <span>Agotado</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-text-muted">Comentarios / Problemas</label>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="¿Alguna molestia? ¿Algún ejercicio que no pudiste hacer?"
              className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-2xl p-4 min-h-[120px] text-text-bright focus:ring-2 focus:ring-primary outline-none transition-all"
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


  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-6">
        <p className="text-text-muted mb-4">No se pudo cargar el ejercicio.</p>
        <button onClick={() => setView('days')} className="bg-primary text-bg-dark px-6 py-2 rounded-xl font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
      <header className="sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md border-b border-black/10 dark:border-white/10">
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setView(isCoach ? 'exercises' : 'days')} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="size-6 text-text-bright" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-text-bright">
                {currentExercise?.name || 'Ejercicio'}
              </h1>
              <p className="text-xs text-text-muted font-medium">
                {currentExerciseIdx + 1} de {selectedDay?.exercises?.length || 0} Ejercicios
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isCoach && (
              <>
                <button 
                  onClick={() => currentExercise && saveExerciseToLibrary(currentExercise)}
                  disabled={isSavingLibrary || !currentExercise}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg bg-bg-surface/50 transition-colors",
                    isSavingLibrary ? "opacity-50" : "text-text-muted hover:text-primary"
                  )}
                  title="Guardar en Biblioteca"
                >
                  {isSavingLibrary ? <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download className="size-5" />}
                </button>
                <button 
                  onClick={() => setView('exercises')}
                  className="flex size-10 items-center justify-center rounded-lg bg-bg-surface/50 text-text-muted hover:text-primary transition-colors"
                  title="Gestionar Ejercicios"
                >
                  <List className="size-5" />
                </button>
              </>
            )}
            <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="size-5" />
            </button>
          </div>
        </div>
        {libraryMessage && (
          <div className={cn(
            "absolute bottom-[-40px] left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-in fade-in slide-in-from-top-2",
            libraryMessage.type === 'success' ? "bg-green-500 text-white" : 
            libraryMessage.type === 'error' ? "bg-red-500 text-white" : "bg-primary text-bg-dark"
          )}>
            {libraryMessage.text}
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto w-full">
        {!isCoach && selectedDay?.exercises && (
          <div className="p-4">
            <div className="h-1.5 w-full bg-bg-surface/50 rounded-full overflow-hidden flex gap-1">
              {selectedDay?.exercises?.map((_, i) => (
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
          <div className="glass-card rounded-2xl overflow-hidden border border-black/10 dark:border-white/10">
            <div className="relative aspect-video w-full bg-bg-surface/50 flex items-center justify-center group">
              {renderExerciseMedia()}
              
              {isCoach && (
                <button 
                  onClick={() => setShowVideoEditor(true)}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-lg text-white hover:text-primary transition-colors z-20"
                >
                  <Settings className="size-5" />
                </button>
              )}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest z-20">VÍDEO DE TÉCNICA</div>
            </div>

            <div className="p-5">
              <div className="mb-6 space-y-4">
                <div className="w-full">
                  {isCoach ? (
                    <div className="space-y-3">
                      <input 
                        className="text-2xl font-black italic tracking-tight bg-transparent border-b border-white/10 w-full outline-none focus:border-primary pb-1"
                        value={currentExercise?.name || ''}
                        onChange={(e) => {
                          const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
                            idx === currentExerciseIdx ? { ...ex, name: e.target.value } : ex
                          ) || [];
                          const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                          setWorkoutDays(updatedDays);
                          if (selectedDay) {
                            setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        {commonEquipment.map(eq => (
                          <button
                            key={eq}
                            onClick={() => {
                              const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
                                idx === currentExerciseIdx ? { ...ex, equipment: eq } : ex
                              ) || [];
                              const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                              setWorkoutDays(updatedDays);
                              if (selectedDay) {
                                setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                              currentExercise?.equipment === eq 
                                ? "bg-primary text-bg-dark border-primary" 
                                : "bg-bg-surface/50 text-text-muted border-black/10 dark:border-white/10 hover:border-primary/30"
                            )}
                          >
                            {eq}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-black italic tracking-tight">{currentExercise?.name}</h2>
                      {currentExercise?.equipment && (
                        <div className="flex">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            <Dumbbell className="size-3" /> {currentExercise.equipment}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3 items-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-text-muted uppercase tracking-widest">
                        <Info className="size-3" /> {sets.length} Series • 
                        {isCoach ? (
                          <input 
                            className="bg-transparent border-b border-white/10 w-16 outline-none focus:border-primary ml-1"
                            value={currentExercise?.reps || ''}
                            onChange={(e) => {
                              const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
                                idx === currentExerciseIdx ? { ...ex, reps: e.target.value } : ex
                              ) || [];
                              const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                              setWorkoutDays(updatedDays);
                              if (selectedDay) {
                                setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                              }
                            }}
                          />
                        ) : (
                          ` ${currentExercise?.reps}`
                        )} Reps
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest">
                        <Timer className="size-3" /> 
                        {isCoach ? (
                          <input 
                            type="number"
                            className="bg-transparent border-b border-primary/30 w-12 outline-none focus:border-primary ml-1 text-primary"
                            value={currentExercise?.rest || 0}
                            onChange={(e) => {
                              const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
                                idx === currentExerciseIdx ? { ...ex, rest: parseInt(e.target.value) || 0 } : ex
                              ) || [];
                              const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                              setWorkoutDays(updatedDays);
                              if (selectedDay) {
                                setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                              }
                            }}
                          />
                        ) : (
                          ` ${currentExercise?.rest}`
                        )}s Descanso
                      </span>
                    </div>
                    {isCoach && (
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                          "size-4 rounded border flex items-center justify-center transition-all",
                          currentExercise?.clientEntersWeight 
                            ? "bg-primary border-primary" 
                            : "border-black/20 dark:border-white/20 group-hover:border-primary/50"
                        )}>
                          {currentExercise?.clientEntersWeight && <Check className="size-3 text-bg-dark" />}
                        </div>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={currentExercise?.clientEntersWeight || false}
                          onChange={(e) => {
                            const updatedExercises = selectedDay?.exercises?.map((ex, idx) => 
                              idx === currentExerciseIdx ? { ...ex, clientEntersWeight: e.target.checked } : ex
                            ) || [];
                            const updatedDays = workoutDays.map(d => d.id === selectedDay?.id ? { ...d, exercises: updatedExercises } : d);
                            setWorkoutDays(updatedDays);
                            if (selectedDay) {
                              setSelectedDay({ ...selectedDay, exercises: updatedExercises });
                            }
                            
                            // If coach checks this, clear weights for the client to fill
                            if (e.target.checked) {
                              setSets(sets.map(s => ({ ...s, kg: null })));
                            }
                          }}
                        />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Cliente introduce peso</span>
                      </label>
                    )}
                  </div>
                </div>

              {currentExercise?.clientEntersWeight && !isCoach && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <Info className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-primary leading-relaxed">
                    Introduce el peso que has utilizado para realizar las repeticiones indicadas.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {sets.map((set, idx) => (
                  <div 
                    key={set.id} 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl transition-all border shadow-sm",
                      set.completed && !isCoach
                        ? "bg-bg-surface/20 border-transparent opacity-60" 
                        : "bg-bg-surface border-black/5 dark:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center size-8 rounded-full font-black text-sm transition-colors border",
                      set.completed && !isCoach ? "bg-primary text-bg-dark border-primary" : "bg-bg-surface/50 text-text-bright border-black/10 dark:border-white/10"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center">
                        <label className={cn(
                          "text-[8px] uppercase font-black",
                          currentExercise?.clientEntersWeight && !isCoach ? "text-primary" : "text-text-muted"
                        )}>
                          KG {currentExercise?.clientEntersWeight && !isCoach && "*"}
                        </label>
                        <input 
                          className={cn(
                            "w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg",
                            currentExercise?.clientEntersWeight && !isCoach && !set.kg && "text-primary animate-pulse"
                          )} 
                          type="number" 
                          placeholder={currentExercise?.clientEntersWeight && !isCoach ? "?" : "0"}
                          value={set.kg ?? ''}
                          onChange={(e) => updateSet(set.id, 'kg', e.target.value === '' ? null : parseFloat(e.target.value))}
                          disabled={set.completed && !isCoach}
                        />
                      </div>
                      <div className="flex flex-col items-center border-x border-black/10 dark:border-white/10">
                        <label className="text-[8px] uppercase text-text-muted font-black">REPS</label>
                        <input 
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg" 
                          type="number" 
                          value={set.reps}
                          onChange={(e) => updateSet(set.id, 'reps', parseInt(e.target.value) || 0)}
                          disabled={set.completed && !isCoach}
                        />
                      </div>
                      <div className="flex flex-col items-center border-r border-black/10 dark:border-white/10">
                        <label className="text-[8px] uppercase text-text-muted font-black">RPE</label>
                        <select 
                          value={set.rpe ?? ''}
                          onChange={(e) => updateSet(set.id, 'rpe', e.target.value === '' ? null : parseInt(e.target.value))}
                          disabled={set.completed && !isCoach}
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-bg-dark">-</option>
                          {Array.from({length: 11}, (_, i) => i).map(val => (
                            <option key={val} className="bg-bg-dark" value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-text-muted font-black">RIR</label>
                        <select 
                          value={set.rir ?? ''}
                          onChange={(e) => updateSet(set.id, 'rir', e.target.value === '' ? null : parseInt(e.target.value))}
                          disabled={set.completed && !isCoach}
                          className="w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-lg appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-bg-dark">-</option>
                          {Array.from({length: 11}, (_, i) => i).map(val => (
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
                        disabled={currentExercise?.clientEntersWeight && !set.kg}
                        className={cn(
                          "px-3 py-2 rounded-xl font-black text-[10px] transition-all active:scale-95",
                          currentExercise?.clientEntersWeight && !set.kg 
                            ? "bg-bg-surface text-text-muted border border-black/10 dark:border-white/10 cursor-not-allowed opacity-50" 
                            : "bg-primary text-bg-dark hover:brightness-110"
                        )}
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
                        className="bg-bg-surface text-text-bright px-4 py-2 rounded-xl font-black text-xs border border-black/10 dark:border-white/10"
                      >
                        SALTAR
                      </button>
                    </div>
                  </div>
                )}
              </div>

                {isCoach && (
                  <button 
                    onClick={() => setSets([...sets, { id: Date.now(), kg: null, reps: 0, rpe: null, rir: null, completed: false }])}
                    className="mt-4 w-full py-4 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl text-text-muted font-bold text-sm flex items-center justify-center gap-2 hover:bg-bg-surface/50 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <Plus className="size-4" /> Añadir Serie Prescrita
                  </button>
                )}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {!isCoach && (
            <button 
              onClick={() => setShowPainModal(true)}
              className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Bell className="size-5" /> Reportar Molestia / Saltar Ejercicio
            </button>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-1">
              {isCoach ? 'SIGUIENTE EN LA RUTINA' : 'SIGUIENTE EJERCICIO'}
            </h3>
            {selectedDay?.exercises?.[currentExerciseIdx + 1] ? (
              <button 
                disabled={!allSetsCompleted && !isCoach}
                onClick={nextExercise}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                  allSetsCompleted || isCoach 
                    ? "bg-bg-surface/30 border-black/10 dark:border-white/10 hover:border-primary/40" 
                    : "bg-bg-surface/10 border-black/5 dark:border-white/5 opacity-40 grayscale cursor-not-allowed"
                )}
              >
                <div className="size-16 rounded-xl bg-bg-surface shrink-0 overflow-hidden" style={{ backgroundImage: `url(${selectedDay?.exercises?.[currentExerciseIdx + 1]?.video})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="flex-1">
                  <h4 className="font-bold">{selectedDay?.exercises?.[currentExerciseIdx + 1]?.name}</h4>
                  <p className="text-sm text-text-muted">{selectedDay?.exercises?.[currentExerciseIdx + 1]?.initialSets?.length || 0} Series • {selectedDay?.exercises?.[currentExerciseIdx + 1]?.reps} Reps</p>
                </div>
                {allSetsCompleted || isCoach ? (
                  <ChevronRight className="size-5 text-primary" />
                ) : (
                  <Settings className="size-5 text-text-muted/40" />
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
                    : "bg-bg-surface/30 text-text-muted opacity-40 grayscale cursor-not-allowed"
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
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Enlace de Vídeo (YouTube/Vimeo)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full h-14 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10 dark:border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-bg-dark px-4 text-text-muted">O subir archivo</span></div>
                </div>
                <button className="w-full h-14 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl text-text-muted font-bold flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary transition-all">
                  <Camera className="size-5" /> Seleccionar Archivo MP4/MOV
                </button>
                <button 
                  onClick={saveVideoUrl}
                  className="w-full py-4 bg-primary text-bg-dark font-black rounded-xl mt-4"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </motion.div>
          </>
        )}

        {showPainModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPainModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-white/10 rounded-t-[32px] p-8 z-[70]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                  <Bell className="size-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic">Reportar Molestia</h3>
                  <p className="text-text-muted text-sm">Cuéntale a tu coach qué sientes.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nivel de Dolor: <span className={cn("text-sm ml-2", painLevel > 7 ? "text-red-500" : painLevel > 4 ? "text-orange-500" : "text-yellow-500")}>{painLevel}/10</span></label>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setPainLevel(num)}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-xs font-black transition-all",
                          painLevel === num 
                            ? (num > 7 ? "bg-red-500 text-text-bright" : num > 4 ? "bg-orange-500 text-text-bright" : "bg-yellow-500 text-bg-dark")
                            : "bg-bg-surface/50 text-text-muted border border-black/10 dark:border-white/10"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Descripción (Opcional)</label>
                  <textarea 
                    value={painDescription}
                    onChange={(e) => setPainDescription(e.target.value)}
                    className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-4 text-text-bright focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                    placeholder="Ej: Siento un pinchazo en el hombro al bajar la barra..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPainModal(false)}
                    className="flex-1 py-4 bg-bg-surface/50 text-text-bright font-bold rounded-xl border border-black/10 dark:border-white/10"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={reportPain}
                    className="flex-1 py-4 bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-500/20"
                  >
                    REPORTAR Y SALTAR
                  </button>
                </div>
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
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
      <header className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 bg-bg-dark/50 sticky top-0 z-10 backdrop-blur-md">
        <button className="p-2 hover:bg-bg-surface/50 rounded-full transition-colors">
          <Menu className="size-6 text-text-muted" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-text-bright">Cronómetro</h1>
        <button className="p-2 hover:bg-bg-surface/50 rounded-full transition-colors">
          <Settings className="size-6 text-text-muted" />
        </button>
      </header>

      <nav className="flex border-b border-black/10 dark:border-white/10 bg-bg-dark">
        <button 
          onClick={() => setTimerMode('stopwatch')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'stopwatch' ? "border-primary text-primary" : "border-transparent text-text-muted")}
        >
          Cronómetro
        </button>
        <button 
          onClick={() => setTimerMode('timer')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'timer' ? "border-primary text-primary" : "border-transparent text-text-muted")}
        >
          Temporizador
        </button>
        <button 
          onClick={() => setTimerMode('tabata')}
          className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'tabata' ? "border-primary text-primary" : "border-transparent text-text-muted")}
        >
          Tabata
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 mt-8">
        <div className="relative flex flex-col items-center justify-center">
          <svg className="size-72 md:size-80 transform -rotate-90">
            <circle className="text-primary/5 dark:text-primary/10" cx="50%" cy="50%" fill="transparent" r="48%" stroke="currentColor" strokeWidth="4" />
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
              <span className="text-6xl md:text-7xl font-extrabold tracking-tighter text-text-bright">{timeDisplay.main}</span>
              <span className="text-2xl font-bold text-primary neon-text">.{timeDisplay.centi}</span>
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-text-muted mt-2">
              {mode === 'timer' && !isRunning ? 'Toca para ajustar' : (isRunning ? 'En curso' : 'Pausado')}
            </p>
          </div>
        </div>

        {mode === 'tabata' && (
          <div className="w-full max-w-sm grid grid-cols-2 gap-4">
            <div className="bg-bg-surface/50 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col items-center">
              <span className="text-xs font-bold text-primary uppercase mb-1">Trabajo</span>
              <span className="text-2xl font-bold text-text-bright">20s</span>
            </div>
            <div className="bg-bg-surface/50 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col items-center">
              <span className="text-xs font-bold text-text-muted uppercase mb-1">Descanso</span>
              <span className="text-2xl font-bold text-text-bright">10s</span>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 max-h-48 overflow-y-auto no-scrollbar">
          {laps.map((lapTime, i) => {
            const lapDisplay = formatTime(lapTime);
            return (
              <div key={i} className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-text-muted font-medium">Vuelta {laps.length - i}</span>
                <span className={cn("font-mono font-bold", i === 0 ? "text-primary" : "text-text-bright")}>
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
          className="w-16 h-16 rounded-full flex items-center justify-center bg-bg-surface/50 text-text-bright border border-black/10 dark:border-white/10 hover:scale-105 transition-transform active:scale-95"
        >
          <History className="size-8" />
        </button>
        <button 
          onClick={handleStartPause}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-bg-dark shadow-[0_0_30px_rgba(254,119,51,0.3)] hover:scale-110 transition-transform active:scale-95"
        >
          {isRunning ? <div className="size-10 flex gap-2 items-center justify-center"><div className="w-3 h-10 bg-bg-dark rounded-sm"></div><div className="w-3 h-10 bg-bg-dark rounded-sm"></div></div> : <Play className="size-10 fill-current" />}
        </button>
        <button 
          onClick={handleLap}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-bg-surface/50 text-text-bright border border-black/10 dark:border-white/10 hover:scale-105 transition-transform active:scale-95"
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-bg-dark border border-black/10 dark:border-white/10 rounded-3xl p-8 z-[70] shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 text-center text-text-bright">Ajustar Temporizador</h3>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Minutos</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="99"
                    value={pickerMin}
                    onChange={(e) => setPickerMin(parseInt(e.target.value) || 0)}
                    className="w-20 h-20 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-2xl text-3xl font-bold text-center text-text-bright focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <span className="text-3xl font-bold mt-6 text-text-bright">:</span>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Segundos</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    value={pickerSec}
                    onChange={(e) => setPickerSec(parseInt(e.target.value) || 0)}
                    className="w-20 h-20 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-2xl text-3xl font-bold text-center text-text-bright focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPicker(false)}
                  className="flex-1 py-4 bg-bg-surface/50 text-text-bright font-bold rounded-xl border border-black/10 dark:border-white/10 active:scale-95 transition-transform"
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
  const [expandedIngredientIdx, setExpandedIngredientIdx] = useState<number | null>(null);

  // Use the latest diet PDF from clientData if available
  const latestDietPdf = clientData?.diets && clientData.diets.length > 0 
    ? clientData.diets[clientData.diets.length - 1].url 
    : null;

  const currentPdfUrl = latestDietPdf || pdfUrl;

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

  useEffect(() => {
    if (!selectedMeal) setExpandedIngredientIdx(null);
  }, [selectedMeal]);

  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [extraPhoto, setExtraPhoto] = useState<string | null>(null);

  const currentDaily = nutritionPlan[selectedDay];
  const currentMeals = currentDaily.meals;
  const currentExtras = currentDaily.extras || [];

  // Calculate Macros
  const calculateDailyMacros = (meals: Meal[], extras: ExtraMeal[] = []) => {
    const base = meals.reduce((acc, meal) => {
      if (meal.checked) {
        meal.ingredients.forEach(ing => {
          acc.protein += ing.protein;
          acc.carbs += ing.carbs;
          acc.fats += ing.fats;
          acc.kcal += (ing.protein * 4) + (ing.carbs * 4) + (ing.fats * 9);
        });
      }
      return acc;
    }, { protein: 0, carbs: 0, fats: 0, kcal: 0 });

    return extras.reduce((acc, extra) => {
      acc.protein += extra.protein;
      acc.carbs += extra.carbs;
      acc.fats += extra.fats;
      acc.kcal += extra.kcal;
      return acc;
    }, base);
  };

  const dailyMacros = calculateDailyMacros(currentMeals, currentExtras);

  const handleAddExtra = (extra: Omit<ExtraMeal, 'id' | 'timestamp'>) => {
    const newExtra: ExtraMeal = {
      ...extra,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    setNutritionPlan(prev => prev.map((day, i) => {
      if (i === selectedDay) {
        return {
          ...day,
          extras: [...(day.extras || []), newExtra]
        };
      }
      return day;
    }));
    setShowAddExtraModal(false);
    setExtraPhoto(null);
    setShowToast({ message: 'Extra añadido correctamente', type: 'success' });
  };

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setIsParsingPdf(false);
        return;
      }
      setPdfUrl(base64);
      localStorage.setItem(`nutritionPdf_${clientData?.id || 'default'}`, base64);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                data: base64.includes(',') ? base64.split(',')[1] : base64,
                mimeType: file.type || "application/pdf"
              }
            },
            {
              text: `Analiza este documento de nutrición y extrae el plan semanal y los objetivos macro.
              Devuelve un objeto JSON con esta estructura exacta:
              {
                "targets": {
                  "protein": 150,
                  "carbs": 250,
                  "fats": 70,
                  "kcal": 2200
                },
                "days": [
                  {
                    "day": "Lunes",
                    "meals": [
                      {
                        "name": "Desayuno",
                        "desc": "Descripción",
                        "time": "08:00",
                        "kcal": 500,
                        "ingredients": [
                          { "name": "Avena", "amount": "100g", "protein": 10, "carbs": 60, "fats": 5 }
                        ]
                      }
                    ]
                  }
                ]
              }
              Extrae los 7 días de la semana. Si falta información, estímala profesionalmente basándote en el contexto.
              Asegúrate de que los targets sean la suma media diaria o los objetivos explícitos mencionados.`
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const parsed = JSON.parse(response.text);
        if (parsed.days && Array.isArray(parsed.days)) {
          setNutritionPlan(parsed.days.map((d: any, i: number) => ({
            day: days[i] || d.day,
            meals: d.meals.map((m: any) => ({ ...m, checked: false }))
          })));
        }
        if (parsed.targets) {
          setTargets(parsed.targets);
        }

        setShowToast({ message: 'Plan y objetivos importados con IA', type: 'success' });
      } catch (error) {
        console.error("Error parsing nutrition document:", error);
        setShowToast({ message: 'Error al procesar el documento con IA', type: 'error' });
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
    setShowConfirm({
      title: "¿Borrar Plan?",
      message: "¿Estás seguro de que quieres borrar todo el plan nutricional?",
      onConfirm: () => {
        setNutritionPlan(Array.from({ length: 7 }, (_, i) => ({
          day: days[i],
          meals: []
        })));
        setPdfUrl(null);
        localStorage.removeItem(`nutritionPdf_${clientData?.id || 'default'}`);
        setShowToast({ message: 'Plan nutricional borrado', type: 'success' });
      }
    });
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
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
      <header className="bg-bg-dark sticky top-0 z-30 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Utensils className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight tracking-tight text-text-bright">
                {isCoach ? `Nutrición: ${clientData?.name}` : 'Mi Nutrición'}
              </h2>
              <p className="text-text-muted text-xs">{days[selectedDay]}, {weekDates[selectedDay]} Oct</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowWeeklyView(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-bg-surface/50 text-primary hover:bg-primary/10 transition-colors"
              title="Vista Semanal"
            >
              <CalendarDays className="size-5" />
            </button>
            <button 
              onClick={() => setShowShoppingList(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-bg-surface/50 text-primary hover:bg-primary/10 transition-colors"
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
                selectedDay === i ? "bg-primary text-bg-dark" : "bg-bg-surface/50 text-text-muted"
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
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-black/5 dark:border-white/5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Objetivos Diarios (Coach)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Kcal</label>
                <input 
                  type="number" 
                  value={targets.kcal}
                  onChange={(e) => setTargets({ ...targets, kcal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm text-text-bright outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Prot (g)</label>
                <input 
                  type="number" 
                  value={targets.protein}
                  onChange={(e) => setTargets({ ...targets, protein: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm text-text-bright outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Carb (g)</label>
                <input 
                  type="number" 
                  value={targets.carbs}
                  onChange={(e) => setTargets({ ...targets, carbs: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm text-text-bright outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Grasa (g)</label>
                <input 
                  type="number" 
                  value={targets.fats}
                  onChange={(e) => setTargets({ ...targets, fats: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm text-text-bright outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {isCoach && (
          <div className="flex gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 bg-bg-surface/50 border border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all">
              <Upload className="size-5 text-primary" />
              <span className="text-sm font-bold">{isParsingPdf ? 'Procesando...' : 'Importar con IA (PDF/Imagen)'}</span>
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={handlePdfUpload} disabled={isParsingPdf} />
            </label>
            {currentPdfUrl && (
              <button 
                onClick={() => window.open(currentPdfUrl)}
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

        {!isCoach && currentPdfUrl && (
          <button 
            onClick={() => window.open(currentPdfUrl)}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-4 text-primary font-bold hover:bg-primary/20 transition-all"
          >
            <FileText className="size-5" /> Ver Plan Nutricional (PDF)
          </button>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proteínas', current: Math.round(dailyMacros.protein), target: targets.protein, color: 'text-primary' },
            { label: 'Carbos', current: Math.round(dailyMacros.carbs), target: targets.carbs, color: 'text-primary' },
            { label: 'Grasas', current: Math.round(dailyMacros.fats), target: targets.fats, color: 'text-orange-400' },
          ].map((macro) => {
            const isOver = macro.current > macro.target;
            const percentage = Math.round((macro.current / macro.target) * 100);
            
            return (
              <div key={macro.label} className={cn(
                "flex flex-col items-center gap-3 rounded-xl p-4 glass-card transition-all duration-300",
                isOver && "border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              )}>
                <div className="relative flex items-center justify-center">
                  <svg className="size-16">
                    <circle className="text-black/10 dark:text-white/10" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
                    <circle 
                      className={cn(
                        isOver ? "text-red-500" : macro.color, 
                        "transition-all duration-500"
                      )}
                      cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                      strokeDasharray="176" strokeDashoffset={176 - (176 * Math.min(100, (macro.current / macro.target) * 100)) / 100} 
                      strokeLinecap="round" strokeWidth="4" 
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={cn("text-[10px] font-bold", isOver && "text-red-500")}>{percentage}%</span>
                    {isOver && <Flame className="size-3 text-red-500 animate-pulse" />}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-text-muted text-[9px] font-bold uppercase tracking-tighter">{macro.label}</p>
                  <p className={cn("text-[10px] font-bold", isOver && "text-red-500")}>
                    {macro.current}g / {macro.target}g
                  </p>
                </div>
              </div>
            );
          })}
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
                    meal.checked ? "bg-primary border-primary" : "border-text-muted/40"
                  )}>
                    {meal.checked && <Check className="size-4 text-bg-dark font-bold" />}
                  </div>
                  <div className="flex flex-col">
                    <p className={cn("font-semibold", meal?.checked && !isCoach && "line-through text-text-muted")}>{meal?.name}</p>
                    <p className="text-text-muted text-sm">{meal?.desc}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-medium">{meal.kcal} kcal</p>
                    <p className="text-text-muted text-xs">{meal.time}</p>
                  </div>
                  {isCoach && <Settings className="size-5 text-text-muted group-hover:text-primary transition-colors" />}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-bg-surface/50 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                <p className="text-text-muted font-medium">No hay comidas programadas para hoy</p>
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

        {/* Extras Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold tracking-tight">Extras / Fuera de dieta</h3>
            {!isCoach && (
              <button 
                onClick={() => setShowAddExtraModal(true)}
                className="flex items-center gap-2 text-primary text-sm font-bold hover:opacity-80 transition-opacity"
              >
                <Plus className="size-4" /> Añadir Extra
              </button>
            )}
          </div>
          <div className="space-y-3">
            {currentExtras.length > 0 ? currentExtras.map((extra) => (
              <div 
                key={extra.id}
                className="flex items-center justify-between p-4 glass-card rounded-xl border-l-4 border-orange-500/50"
              >
                <div className="flex items-center gap-4">
                  {extra.photo ? (
                    <img src={extra.photo} alt={extra.name} className="size-12 rounded-lg object-cover" />
                  ) : (
                    <div className="size-12 rounded-lg bg-bg-surface flex items-center justify-center text-text-muted">
                      <Utensils className="size-6" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{extra.name}</p>
                    <div className="flex gap-2 text-[10px] font-bold text-text-muted uppercase">
                      <span>P: {extra.protein}g</span>
                      <span>C: {extra.carbs}g</span>
                      <span>G: {extra.fats}g</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-400">+{extra.kcal} kcal</p>
                  <p className="text-text-muted text-[10px]">
                    {new Date(extra.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-text-muted text-sm">No has registrado extras hoy</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Extra Modal */}
      <AnimatePresence>
        {showAddExtraModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddExtraModal(false);
                setExtraPhoto(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-bg-dark rounded-t-[32px] z-[80] p-6 max-h-[90vh] overflow-y-auto border-t border-black/5 dark:border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Añadir Extra</h3>
                <button 
                  onClick={() => {
                    setShowAddExtraModal(false);
                    setExtraPhoto(null);
                  }}
                  className="p-2 hover:bg-bg-surface/50 rounded-full transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddExtra({
                  name: formData.get('name') as string,
                  protein: parseInt(formData.get('protein') as string) || 0,
                  carbs: parseInt(formData.get('carbs') as string) || 0,
                  fats: parseInt(formData.get('fats') as string) || 0,
                  kcal: parseInt(formData.get('kcal') as string) || 0,
                  photo: extraPhoto || undefined
                });
              }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    {extraPhoto ? (
                      <div className="relative size-32 rounded-2xl overflow-hidden border-2 border-primary shadow-lg">
                        <img src={extraPhoto} alt="Extra" className="size-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setExtraPhoto(null)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white shadow-md"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="size-32 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-all bg-bg-surface/50">
                        <Camera className="size-8 text-text-muted" />
                        <span className="text-[10px] font-bold text-text-muted uppercase">Añadir Foto</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setExtraPhoto(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[10px] text-text-muted text-center italic px-4">
                      Puedes añadir una foto de lo que has comido para tener un registro visual.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block ml-1">Nombre del alimento</label>
                      <input 
                        name="name"
                        required
                        placeholder="Ej: Pizza, Helado, etc."
                        className="w-full bg-bg-surface/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block ml-1">Kcal Totales</label>
                        <input 
                          name="kcal"
                          type="number"
                          required
                          placeholder="0"
                          className="w-full bg-bg-surface/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block ml-1">Proteína (g)</label>
                        <input 
                          name="protein"
                          type="number"
                          placeholder="0"
                          className="w-full bg-bg-surface/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block ml-1">Carbos (g)</label>
                        <input 
                          name="carbs"
                          type="number"
                          placeholder="0"
                          className="w-full bg-bg-surface/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block ml-1">Grasas (g)</label>
                        <input 
                          name="fats"
                          type="number"
                          placeholder="0"
                          className="w-full bg-bg-surface/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-bg-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  Guardar Extra
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed bottom-0 left-0 right-0 bg-bg-dark border-t border-black/10 dark:border-white/10 rounded-t-[32px] p-6 z-[70] max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-bg-surface/50 rounded-full mx-auto mb-6" />
              
              {isCoach ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-primary italic">Editar Comida</h3>
                    <button onClick={() => setSelectedMeal(null)} className="text-text-muted hover:text-text-bright"><Plus className="size-6 rotate-45" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Nombre de la Comida</label>
                      <input 
                        type="text" 
                        value={selectedMeal?.name || ''}
                        onChange={(e) => updateMeal({ ...selectedMeal, name: e.target.value })}
                        className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Descripción / Notas</label>
                      <input 
                        type="text" 
                        value={selectedMeal?.desc || ''}
                        onChange={(e) => updateMeal({ ...selectedMeal, desc: e.target.value })}
                        className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Hora</label>
                        <input 
                          type="text" 
                          value={selectedMeal.time}
                          onChange={(e) => updateMeal({ ...selectedMeal, time: e.target.value })}
                          className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Kcal Totales</label>
                        <input 
                          type="number" 
                          value={selectedMeal.kcal}
                          onChange={(e) => updateMeal({ ...selectedMeal, kcal: parseInt(e.target.value) || 0 })}
                          className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Ingredientes</h4>
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
                        <div key={idx} className="bg-bg-surface/50 rounded-2xl p-4 border border-black/5 dark:border-white/10 space-y-3">
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
                              className="flex-1 bg-bg-dark/20 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm outline-none text-text-bright"
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
                              className="w-20 bg-bg-dark/20 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm text-center outline-none text-text-bright"
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
                              <span className="text-[8px] text-text-muted font-bold uppercase">Prot (g)</span>
                              <input 
                                type="number" 
                                value={ing.protein}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].protein = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-bg-dark/20 border border-black/10 dark:border-white/10 rounded-lg p-1 text-xs text-center outline-none text-text-bright"
                              />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-text-muted font-bold uppercase">Carb (g)</span>
                              <input 
                                type="number" 
                                value={ing.carbs}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].carbs = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-bg-dark/20 border border-black/10 dark:border-white/10 rounded-lg p-1 text-xs text-center outline-none text-text-bright"
                              />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] text-text-muted font-bold uppercase">Gras (g)</span>
                              <input 
                                type="number" 
                                value={ing.fats}
                                onChange={(e) => {
                                  const newIngs = [...selectedMeal.ingredients];
                                  newIngs[idx].fats = parseInt(e.target.value) || 0;
                                  updateMeal({ ...selectedMeal, ingredients: newIngs });
                                }}
                                className="w-full bg-bg-dark/20 border border-black/10 dark:border-white/10 rounded-lg p-1 text-xs text-center outline-none text-text-bright"
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
                      <h3 className="text-2xl font-black text-primary italic leading-tight">{selectedMeal.name}</h3>
                      <p className="text-text-muted text-sm font-medium">{selectedMeal.desc}</p>
                    </div>
                    <div className="text-right bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                      <p className="text-xl font-black text-primary leading-none">{selectedMeal.kcal}</p>
                      <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-1">KCAL</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Ingredientes y Macros</h4>
                      <p className="text-[10px] text-text-muted italic">Pulsa para ver detalles</p>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedMeal.ingredients.map((ing: Ingredient, idx: number) => {
                        const isExpanded = expandedIngredientIdx === idx;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setExpandedIngredientIdx(isExpanded ? null : idx)}
                            className={cn(
                              "bg-bg-surface/50 rounded-xl border border-black/5 dark:border-white/10 overflow-hidden transition-all duration-300 cursor-pointer",
                              isExpanded ? "ring-1 ring-primary/40 bg-bg-surface/80 shadow-lg shadow-black/20" : "hover:bg-bg-surface/80"
                            )}
                          >
                            <div className="flex justify-between items-center p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "size-8 rounded-lg flex items-center justify-center transition-colors",
                                  isExpanded ? "bg-primary text-bg-dark" : "bg-primary/10 text-primary"
                                )}>
                                  <Utensils className="size-4" />
                                </div>
                                <div>
                                  <p className="font-black text-text-bright text-base leading-tight">{ing.name}</p>
                                  <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">{ing.amount}</p>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown className="size-4 text-text-muted" />
                              </motion.div>
                            </div>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="px-4 pb-4"
                                >
                                  <div className="mb-3">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Detalle Nutricional</p>
                                    <p className="text-text-bright font-bold text-sm">{ing.name}</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/5 dark:border-white/10">
                                    <div className="text-center bg-bg-dark/20 rounded-lg py-2 border border-black/5 dark:border-white/10">
                                      <p className="text-[8px] text-text-muted font-bold uppercase tracking-tighter">Prot</p>
                                      <p className="text-xs font-bold text-text-bright">{ing.protein}g</p>
                                    </div>
                                    <div className="text-center bg-bg-dark/20 rounded-lg py-2 border border-black/5 dark:border-white/10">
                                      <p className="text-[8px] text-text-muted font-bold uppercase tracking-tighter">Carb</p>
                                      <p className="text-xs font-bold text-text-bright">{ing.carbs}g</p>
                                    </div>
                                    <div className="text-center bg-bg-dark/20 rounded-lg py-2 border border-black/5 dark:border-white/10">
                                      <p className="text-[8px] text-text-muted font-bold uppercase tracking-tighter">Gras</p>
                                      <p className="text-xs font-bold text-text-bright">{ing.fats}g</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
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
                      selectedMeal.checked ? "bg-bg-surface/50 text-text-bright" : "bg-primary text-bg-dark"
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
              <button onClick={() => setShowWeeklyView(false)} className="size-12 bg-bg-surface/50 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10"><Plus className="size-8 rotate-45" /></button>
            </div>
            <div className="space-y-6">
              {nutritionPlan.map((day, i) => {
                const macros = calculateDailyMacros(day.meals);
                return (
                  <div key={i} className="glass-card rounded-3xl p-6 border border-black/5 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">{day.day} - {weekDates[i]} Oct</h3>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{Math.round(macros.kcal)} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center bg-bg-surface/50 rounded-xl py-2">
                        <p className="text-[8px] text-text-muted font-bold uppercase">P</p>
                        <p className="text-xs font-bold">{Math.round(macros.protein)}g</p>
                      </div>
                      <div className="text-center bg-bg-surface/50 rounded-xl py-2">
                        <p className="text-[8px] text-text-muted font-bold uppercase">C</p>
                        <p className="text-xs font-bold">{Math.round(macros.carbs)}g</p>
                      </div>
                      <div className="text-center bg-bg-surface/50 rounded-xl py-2">
                        <p className="text-[8px] text-text-muted font-bold uppercase">G</p>
                        <p className="text-xs font-bold">{Math.round(macros.fats)}g</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.meals.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-text-muted">{m.name} - {m.desc}</span>
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
              <button onClick={() => setShowShoppingList(false)} className="size-12 bg-bg-surface/50 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10"><Plus className="size-8 rotate-45" /></button>
            </div>
            <div className="glass-card rounded-3xl p-6 border border-black/10 dark:border-white/10 mb-8">
              <div className="space-y-4">
                {Object.entries(generateShoppingList()).map(([name, amounts], i) => (
                  <div key={i} className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                    <span className="font-bold">{name}</span>
                    <span className="text-text-muted text-sm">{amounts.join(', ')}</span>
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
                  setShowToast({ message: 'Lista copiada al portapapeles', type: 'success' });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-bg-surface/50 text-text-bright py-4 rounded-2xl font-black border border-black/10 dark:border-white/10"
              >
                <Share2 className="size-5" /> COMPARTIR
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && <CustomToast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
      </AnimatePresence>

      {showConfirm && (
        <CustomConfirm 
          title={showConfirm.title}
          message={showConfirm.message}
          onConfirm={showConfirm.onConfirm}
          onCancel={() => setShowConfirm(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
};

const AchievementIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, any> = {
    Dumbbell, CalendarDays, Sun, Moon, Trophy, Flame, Calendar, Sword, Timer, Verified, 
    CheckCircle2, TrendingUp, LayoutGrid, History, Plus, Info, Users, Share2, Play, 
    Leaf, Egg, ShoppingBasket, Check, X, ShoppingCart, FileText, Apple, Fish, 
    BarChart3, User, UserPlus, PlusCircle, Footprints, Droplets, Utensils, Camera, Eye, Bell
  };
  const Icon = icons[name] || Trophy;
  return <Icon className={className} />;
};

const ProgressScreen = ({ isCoach, clientData }: { isCoach?: boolean; clientData?: Client | null }) => {
  const [range, setRange] = useState('1M');
  const [activeTab, setActiveTab] = useState<'resumen' | 'historial' | 'logros' | 'fotos'>('resumen');
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const [weightHistory, setWeightHistory] = useState<WeeklyWeightHistory[]>(() => {
    const saved = localStorage.getItem(`weightHistory_${clientData?.id || 'default'}`);
    return saved ? JSON.parse(saved) : [];
  });

  const currentWeekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const dailyWeights: (number | null)[] = [];
    let sum = 0;
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${dateStr}`);
      if (saved) {
        const log = JSON.parse(saved);
        if (log.weight) {
          dailyWeights.push(log.weight);
          sum += log.weight;
          count++;
        } else {
          dailyWeights.push(null);
        }
      } else {
        dailyWeights.push(null);
      }
    }

    return {
      monday,
      sunday,
      dailyWeights,
      average: count > 0 ? sum / count : 0
    };
  }, [clientData?.id]);

  // Effect to archive previous week if needed
  useEffect(() => {
    const lastArchiveDate = localStorage.getItem(`lastWeightArchive_${clientData?.id || 'default'}`);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (lastArchiveDate !== todayStr) {
      // Check if we should archive the previous week
      // This is a simplified logic: if today is Monday and we haven't archived last week yet
      if (today.getDay() === 1) {
        const lastMonday = new Date(currentWeekData.monday);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastSunday.getDate() + 6);

        const lastWeekId = lastMonday.toISOString().split('T')[0];
        const alreadyArchived = weightHistory.some(h => h.id === lastWeekId);

        if (!alreadyArchived) {
          // Collect last week's data
          const lastWeekWeights: (number | null)[] = [];
          let lastSum = 0;
          let lastCount = 0;

          for (let i = 0; i < 7; i++) {
            const d = new Date(lastMonday);
            d.setDate(lastMonday.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${dateStr}`);
            if (saved) {
              const log = JSON.parse(saved);
              if (log.weight) {
                lastWeekWeights.push(log.weight);
                lastSum += log.weight;
                lastCount++;
              } else {
                lastWeekWeights.push(null);
              }
            } else {
              lastWeekWeights.push(null);
            }
          }

          if (lastCount > 0) {
            const newHistory: WeeklyWeightHistory = {
              id: lastWeekId,
              startDate: lastMonday.toISOString(),
              endDate: lastSunday.toISOString(),
              dailyWeights: lastWeekWeights,
              average: lastSum / lastCount
            };
            const updatedHistory = [newHistory, ...weightHistory];
            setWeightHistory(updatedHistory);
            localStorage.setItem(`weightHistory_${clientData?.id || 'default'}`, JSON.stringify(updatedHistory));
          }
        }
      }
      localStorage.setItem(`lastWeightArchive_${clientData?.id || 'default'}`, todayStr);
    }
  }, [currentWeekData.monday, clientData?.id, weightHistory]);

  const [photos, setPhotos] = useState<ProgressPhoto[]>(() => {
    const saved = localStorage.getItem(`progressPhotos_${clientData?.id || 'default'}`);
    return saved ? JSON.parse(saved) : [
      { id: '1', date: '12 Ene, 2024', label: 'Inicio', img: 'https://picsum.photos/seed/p1/300/400' },
      { id: '2', date: '05 Feb, 2024', label: 'Semana 4', img: 'https://picsum.photos/seed/p2/300/400' },
    ];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(`achievements_${clientData?.id || 'default'}`);
    if (saved) {
      try {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved)) {
          // Merge: keep saved progress but add new achievements from DEFAULT_ACHIEVEMENTS
          const merged = [...DEFAULT_ACHIEVEMENTS].map(def => {
            const existing = parsedSaved.find(s => s && s.id === def.id);
            if (existing) {
              return { ...def, completed: existing.completed, howTo: existing.howTo };
            }
            return def;
          });
          return merged;
        }
      } catch (e) {
        console.error('Error parsing achievements:', e);
      }
    }
    return DEFAULT_ACHIEVEMENTS;
  });

  useEffect(() => {
    const saved = localStorage.getItem(`achievements_${clientData?.id || 'default'}`);
    if (saved) {
      try {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved)) {
          const merged = [...DEFAULT_ACHIEVEMENTS].map(def => {
            const existing = parsedSaved.find(s => s && s.id === def.id);
            if (existing) {
              return { ...def, completed: existing.completed, howTo: existing.howTo };
            }
            return def;
          });
          setAchievements(merged);
          return;
        }
      } catch (e) {
        console.error('Error parsing achievements in effect:', e);
      }
    }
    setAchievements(DEFAULT_ACHIEVEMENTS);
  }, [clientData?.id]);

  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [tempHowTo, setTempHowTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'training' | 'nutrition' | 'habits'>('all');

  useEffect(() => {
    localStorage.setItem(`progressPhotos_${clientData?.id || 'default'}`, JSON.stringify(photos));
  }, [photos, clientData?.id]);

  useEffect(() => {
    localStorage.setItem(`achievements_${clientData?.id || 'default'}`, JSON.stringify(achievements));
  }, [achievements, clientData?.id]);

  const toggleAchievement = (id: string) => {
    setAchievements(prev => prev.map(a => 
      a.id === id ? { ...a, completed: !a.completed } : a
    ));
  };

  const saveHowTo = () => {
    if (editingAchievement) {
      setAchievements(prev => prev.map(a => 
        a.id === editingAchievement.id ? { ...a, howTo: tempHowTo } : a
      ));
      setEditingAchievement(null);
    }
  };

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

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const latestWeight = (() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`dailyLog_${clientData?.id || 'default'}_${today}`);
    if (saved) {
      const log = JSON.parse(saved);
      if (log.weight) return `${log.weight} kg`;
    }
    return (isCoach ? clientData?.weight : '82.5 kg') || '82.5 kg';
  })();

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
      <header className="sticky top-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
        <div className="flex items-center p-4 justify-between max-w-7xl mx-auto">
          <div className="w-10"></div> {/* Spacer for alignment */}
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {isCoach ? `Progreso: ${clientData?.name}` : 'Mi Progreso'}
          </h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
        <nav className="flex border-b border-black/5 dark:border-white/10 px-4 gap-8 max-w-7xl mx-auto overflow-x-auto no-scrollbar">
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
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-text-muted"
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
                <p className="text-text-muted text-xs font-medium uppercase">Peso Actual</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{latestWeight}</p>
                  <span className="text-red-500 text-xs font-bold">-1.2%</span>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-text-muted text-xs font-medium uppercase">Media Semanal</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{currentWeekData.average > 0 ? `${currentWeekData.average.toFixed(1)} kg` : '--'}</p>
                  <span className="text-secondary text-xs font-bold">Actual</span>
                </div>
              </div>
            </div>

            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold">Semana Actual</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {currentWeekData.monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {currentWeekData.sunday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('historial')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
                >
                  <History className="size-3.5" /> Ver Histórico
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-6">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black text-text-muted">{day}</span>
                    <div className={cn(
                      "w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all",
                      currentWeekData.dailyWeights[i] 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "bg-bg-surface/50 border-black/5 dark:border-white/5 text-text-muted/30"
                    )}>
                      {currentWeekData.dailyWeights[i] ? currentWeekData.dailyWeights[i]?.toFixed(1) : '-'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Evolución</h2>
                <div className="flex gap-2">
                  {['1M', '3M', '1Y'].map((r) => (
                    <button 
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold transition-colors",
                        range === r ? "bg-primary text-bg-dark" : "bg-bg-surface text-text-bright border border-black/5 dark:border-white/10"
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
                    {i === 7 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary neon-text">{latestWeight?.split(' ')[0] || '0'}</div>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-medium text-text-muted uppercase tracking-widest">
                <span>{range === '1M' ? 'Sem 1' : 'Ene'}</span>
                <span>{range === '1M' ? 'Sem 4' : 'Jun'}</span>
                <span>Actual</span>
              </div>
            </section>

            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Resumen de Logros</h2>
                <button 
                  onClick={() => setActiveTab('logros')}
                  className="text-primary text-[10px] font-bold uppercase tracking-widest"
                >
                  Ver todos
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative size-16">
                  <svg className="size-full" viewBox="0 0 36 36">
                    <path
                      className="text-bg-surface stroke-current"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary stroke-current"
                      strokeWidth="3"
                      strokeDasharray={`${(achievements.filter(a => a.completed).length / achievements.length) * 100}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{Math.round((achievements.filter(a => a.completed).length / achievements.length) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold">{achievements.filter(a => a.completed).length} / {achievements.length}</p>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Logros Desbloqueados</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {achievements.filter(a => a.completed).slice(-5).map(a => (
                  <div key={a.id} className="size-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <AchievementIcon name={a.icon} className="size-5 text-primary" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'logros' && (
          <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
              {[
                { id: 'all', label: 'Todos', icon: Trophy },
                { id: 'training', label: 'Entreno', icon: Dumbbell },
                { id: 'nutrition', label: 'Nutrición', icon: Utensils },
                { id: 'habits', label: 'Hábitos', icon: Sun }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                    categoryFilter === cat.id 
                      ? "bg-primary text-bg-dark border-primary shadow-lg shadow-primary/20" 
                      : "bg-bg-surface text-text-muted border-black/5 dark:border-white/10"
                  )}
                >
                  <cat.icon className="size-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Completados ({achievements.filter(a => a.completed && (categoryFilter === 'all' || a.category === categoryFilter)).length})
                </h3>
                <div className="h-px flex-1 bg-primary/10 ml-4"></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {achievements.filter(a => a.completed && (categoryFilter === 'all' || a.category === categoryFilter)).map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="glass-card rounded-xl p-2 flex flex-col items-center text-center gap-1 border border-primary/20 bg-primary/5 relative overflow-hidden group"
                  >
                    <div className="p-1.5 rounded-lg bg-primary text-bg-dark mb-0.5">
                      <AchievementIcon name={achievement.icon} className="size-3.5" />
                    </div>
                    <h4 className="font-bold text-[8px] leading-tight line-clamp-2 h-5">{achievement.title}</h4>
                    <button 
                      onClick={() => toggleAchievement(achievement.id)}
                      className="mt-0.5 text-[6px] font-black uppercase text-text-muted hover:text-red-500 transition-colors"
                    >
                      Desmarcar
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Pendientes ({achievements.filter(a => !a.completed && (categoryFilter === 'all' || a.category === categoryFilter)).length})
                </h3>
                <div className="h-px flex-1 bg-white/5 ml-4"></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {achievements.filter(a => !a.completed && (categoryFilter === 'all' || a.category === categoryFilter)).map((achievement) => (
                  <div 
                    key={achievement.id}
                    onClick={() => {
                      setEditingAchievement(achievement);
                      setTempHowTo(achievement.howTo || '');
                    }}
                    className="glass-card rounded-xl p-2 flex flex-col items-center text-center gap-1 border border-black/10 dark:border-white/10 bg-bg-surface/30 opacity-60 hover:opacity-100 transition-all cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-bg-surface text-text-muted mb-0.5">
                      <AchievementIcon name={achievement.icon} className="size-3.5" />
                    </div>
                    <h4 className="font-bold text-[8px] leading-tight line-clamp-2 h-5">{achievement.title}</h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAchievement(achievement.id);
                      }}
                      className="mt-0.5 px-2 py-0.5 bg-bg-surface border border-black/10 dark:border-white/10 rounded-full text-[6px] font-black uppercase tracking-widest hover:bg-primary hover:text-bg-dark transition-all"
                    >
                      Lograr
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <AnimatePresence>
              {editingAchievement && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingAchievement(null)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-bg-dark border border-black/10 dark:border-white/10 rounded-3xl p-6 z-[70] shadow-2xl"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-full text-primary">
                        <AchievementIcon name={editingAchievement.icon} className="size-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight">{editingAchievement.title}</h3>
                        <p className="text-sm text-text-muted mt-1">{editingAchievement.description}</p>
                      </div>
                      
                      <div className="w-full text-left space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">¿Cuál es tu meta?</label>
                        <textarea 
                          value={tempHowTo}
                          onChange={(e) => setTempHowTo(e.target.value)}
                          placeholder="Ej: Entrenar 30 min antes de ir a trabajar..."
                          className="w-full bg-bg-surface/50 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-text-bright text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px] resize-none"
                        />
                      </div>

                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => setEditingAchievement(null)}
                          className="flex-1 py-3 bg-bg-surface text-text-bright rounded-xl font-bold text-sm border border-black/5 dark:border-white/10"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={saveHowTo}
                          className="flex-1 py-3 bg-primary text-bg-dark rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
                        >
                          Guardar Meta
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                <div key={photo.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group">
                  <img src={photo.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Progress" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xs font-bold">{photo.date}</p>
                    <p className="text-secondary text-[10px] font-bold uppercase tracking-wider">{photo.label}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleAddPhoto}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all cursor-pointer bg-bg-surface/30"
              >
                <PlusCircle className="size-8 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nueva Foto</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'historial' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold italic tracking-tight">Historial de Peso</h2>
              <button 
                onClick={() => setActiveTab('resumen')}
                className="text-primary text-xs font-bold uppercase tracking-widest"
              >
                Volver
              </button>
            </div>

            {weightHistory.length === 0 ? (
              <div className="glass-panel rounded-xl p-12 text-center">
                <History className="size-12 text-text-muted/10 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-muted">Sin histórico aún</h3>
                <p className="text-sm text-text-muted/40 mt-2">Los datos se archivarán automáticamente al finalizar cada semana.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weightHistory.map((week) => (
                  <div key={week.id} className="glass-panel rounded-2xl overflow-hidden border border-black/5 dark:border-white/10">
                    <button 
                      onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                          Semana del {new Date(week.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al {new Date(week.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black italic">{week.average.toFixed(1)}</span>
                          <span className="text-xs font-bold text-text-muted">kg (Media)</span>
                        </div>
                      </div>
                      <div className={cn(
                        "size-8 rounded-full bg-bg-surface flex items-center justify-center transition-transform",
                        expandedWeek === week.id ? "rotate-180" : ""
                      )}>
                        <ChevronDown className="size-5 text-text-muted" />
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedWeek === week.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-black/5 dark:border-white/10 bg-black/20"
                        >
                          <div className="p-4 grid grid-cols-7 gap-2">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <span className="text-[8px] font-bold text-text-muted">{day}</span>
                                <div className={cn(
                                  "w-full py-2 rounded-lg text-[10px] font-bold text-center border",
                                  week.dailyWeights[i] 
                                    ? "bg-bg-surface border-primary/20 text-text-bright" 
                                    : "bg-bg-surface/30 border-transparent text-text-muted/20"
                                )}>
                                  {week.dailyWeights[i] ? week.dailyWeights[i]?.toFixed(1) : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const ProfileScreen = ({ 
  userRole, 
  clientData, 
  coachData, 
  onUpdateClient, 
  onUpdateCoach, 
  onLogout, 
  onNavigate, 
  darkMode, 
  onToggleDarkMode, 
  coaches,
  setToast
}: { 
  userRole: 'admin' | 'coach' | 'client' | null; 
  clientData: Client | null; 
  coachData: Coach | null; 
  onUpdateClient: (id: string, updates: Partial<Client>) => void; 
  onUpdateCoach: (id: string, updates: Partial<Coach>) => void; 
  onLogout: () => void; 
  onNavigate?: (s: Screen) => void; 
  darkMode: boolean; 
  onToggleDarkMode: () => void; 
  coaches: Coach[];
  setToast: (toast: { show: boolean; message: string; type: 'success' | 'error' }) => void;
}) => {
  // Debug logging
  useEffect(() => {
    console.log('ProfileScreen Render:', {
      userRole,
      hasClientData: !!clientData,
      clientId: clientData?.id,
      hasCoachData: !!coachData,
      coachId: coachData?.id
    });
  }, [userRole, clientData, coachData]);

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [assignedCoachId, setAssignedCoachId] = useState(clientData?.assignedCoachId || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  const isCoach = userRole === 'admin' || userRole === 'coach';
  const isViewingClient = isCoach && clientData?.id && typeof clientData.id === 'string' && !clientData.id.startsWith('self_');
  const isCoachSelf = isCoach && (!clientData?.id || (typeof clientData.id === 'string' && clientData.id.startsWith('self_')));
  const isAdmin = userRole === 'admin';

  const [editedData, setEditedData] = useState({
    name: isViewingClient ? clientData?.name || '' : (isCoachSelf ? coachData?.name || '' : (clientData?.name || 'Sarah Jenkins')),
    img: isViewingClient ? clientData?.img || '' : (isCoachSelf ? coachData?.img || '' : (clientData?.img || 'https://picsum.photos/seed/sarah/200/200')),
    targetWeight: clientData?.targetWeight || '',
    bodyFat: clientData?.bodyFat || '',
    dietType: clientData?.dietType || '',
    allergies: clientData?.allergies || ''
  });

  // Update editedData when props change
  useEffect(() => {
    setEditedData({
      name: isViewingClient ? clientData?.name || '' : (isCoachSelf ? coachData?.name || '' : (clientData?.name || 'Sarah Jenkins')),
      img: isViewingClient ? clientData?.img || '' : (isCoachSelf ? coachData?.img || '' : (clientData?.img || 'https://picsum.photos/seed/sarah/200/200')),
      targetWeight: clientData?.targetWeight || '',
      bodyFat: clientData?.bodyFat || '',
      dietType: clientData?.dietType || '',
      allergies: clientData?.allergies || ''
    });
  }, [clientData, coachData, isViewingClient, isCoachSelf]);

  if (userRole === null) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="size-8 text-primary animate-pulse" />
          </div>
          <p className="text-text-muted font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!clientData && !coachData && !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <p className="text-text-bright font-bold">Error de Datos</p>
          <p className="text-text-muted text-sm">No se ha podido encontrar información de tu perfil.</p>
          <div className="flex flex-col gap-4 mt-4">
            <button 
              onClick={onLogout} 
              className="px-6 py-3 bg-primary text-bg-dark font-bold rounded-xl text-sm"
            >
              Cerrar Sesión
            </button>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('dashboard')} 
                className="text-text-muted text-xs hover:text-primary transition-colors"
              >
                Volver al Panel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (isViewingClient && clientData?.id) {
      onUpdateClient(clientData.id, { 
        name: editedData.name, 
        img: editedData.img,
        targetWeight: editedData.targetWeight,
        bodyFat: editedData.bodyFat,
        dietType: editedData.dietType,
        allergies: editedData.allergies,
        assignedCoachId: assignedCoachId
      });
    } else if (isCoachSelf && coachData?.id) {
      onUpdateCoach(coachData.id, { name: editedData.name, img: editedData.img });
      // Also update the self client doc if it exists
      if (clientData?.id) {
        onUpdateClient(clientData.id, { 
          name: editedData.name, 
          img: editedData.img,
          bodyFat: editedData.bodyFat,
          targetWeight: editedData.targetWeight
        });
      }
    }
    setIsEditing(false);
  };

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

  const handleFileUpload = async (type: 'diets' | 'workouts') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file && clientData?.id) {
        try {
          const fileRef = ref(storage, `${type}/${clientData.id}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(fileRef, file);
          const url = await getDownloadURL(snapshot.ref);
          
          const newFile: DietFile = {
            id: Date.now().toString(),
            name: file.name,
            url: url,
            uploadedAt: serverTimestamp()
          };
          
          const currentFiles = (clientData as any)[type] || [];
          if (clientData?.id) {
            onUpdateClient(clientData.id, { [type]: [...currentFiles, newFile] });
            setToast({ show: true, message: 'Archivo subido correctamente', type: 'success' });
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          setToast({ show: true, message: 'Error al subir el archivo', type: 'error' });
        }
      }
    };
    input.click();
  };

  const latestWeight = (() => {
    const today = new Date().toISOString().split('T')[0];
    const log = getSafeLocalStorage(`dailyLog_${clientData?.id || 'default'}_${today}`, null);
    if (log && log.weight) return `${log.weight} kg`;
    return (isViewingClient ? clientData?.weight : (clientData?.weight || '64.2 kg')) || '64.2 kg';
  })();

  const latestBodyFat = (() => {
    const today = new Date().toISOString().split('T')[0];
    const log = getSafeLocalStorage(`dailyLog_${clientData?.id || 'default'}_${today}`, null);
    if (log && log.bodyFat) return `${log.bodyFat}%`;
    return (isViewingClient ? clientData?.bodyFat : (clientData?.bodyFat || '21.4%')) || '21.4%';
  })();

  const achievements: Achievement[] = (() => {
    const saved = getSafeLocalStorage(`achievements_${clientData?.id || 'default'}`, []);
    return Array.isArray(saved) ? saved : [];
  })();

  const completedAchievements = achievements.filter(a => a.completed);

  return (
    <div className="min-h-screen bg-bg-dark text-text-bright pb-32">
      <header className="flex items-center p-4 justify-between border-b border-black/10 dark:border-white/10 sticky top-0 z-10 bg-bg-dark/80 backdrop-blur-md">
        <h2 className="text-lg font-bold tracking-tight">
          {isViewingClient ? `Perfil: ${clientData?.name}` : (isCoachSelf ? 'Mi Perfil (Coach)' : 'Mi Perfil')}
        </h2>
        <button 
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="p-2 rounded-full hover:bg-primary/10 transition-colors text-primary font-bold text-sm"
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
                className="bg-bg-surface/50 border border-black/5 dark:border-white/10 rounded-lg px-4 py-2 text-2xl font-bold text-center w-full focus:ring-2 focus:ring-primary outline-none"
              />
            ) : (
              <h3 className="text-2xl font-bold tracking-tight">
                {editedData.name} {isCoachSelf && coachData?.role === 'admin' && !editedData.name.includes('(Admin)') ? '(Admin)' : ''}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1 justify-center">
              <span className="size-2 rounded-full bg-primary neon-text"></span>
              <p className="text-text-muted text-xs font-medium uppercase tracking-widest">
                {isCoachSelf ? 'ENTRENADOR ÉLITE' : (clientData?.active || userRole === 'client' ? 'ACTIVA' : 'EN PAUSA')} • RACHA DE 8 MESES
              </p>
            </div>
          </div>
        </div>

        {clientData && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="glass-card rounded-xl p-4">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Peso Actual</p>
              <p className="text-xl font-bold">{latestWeight}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Grasa Corporal</p>
              <p className="text-xl font-bold">{latestBodyFat}</p>
            </div>
          </div>
        )}

        {clientData && isEditing && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Peso Objetivo</label>
                <input 
                  type="text"
                  value={editedData.targetWeight}
                  onChange={(e) => setEditedData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                  placeholder="70 kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Grasa Corporal</label>
                <input 
                  type="text"
                  value={editedData.bodyFat}
                  onChange={(e) => setEditedData(prev => ({ ...prev, bodyFat: e.target.value }))}
                  className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                  placeholder="21.4%"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Tipo de Dieta</label>
              <input 
                type="text"
                value={editedData.dietType}
                onChange={(e) => setEditedData(prev => ({ ...prev, dietType: e.target.value }))}
                className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ej: Cetogénica, Vegana..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Alergias / Intolerancias</label>
              <textarea 
                value={editedData.allergies}
                onChange={(e) => setEditedData(prev => ({ ...prev, allergies: e.target.value }))}
                className="w-full h-24 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl p-4 text-text-bright focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="Ej: Lactosa, Frutos secos..."
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Asignar Coach</label>
                <select 
                  value={assignedCoachId}
                  onChange={(e) => setAssignedCoachId(e.target.value)}
                  className="w-full h-12 bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-xl px-4 text-text-bright focus:ring-2 focus:ring-primary outline-none appearance-none"
                >
                  <option value="" disabled>Seleccionar Coach</option>
                  {coaches.filter(c => c && c.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {isViewingClient && (
          <div className="space-y-6 mb-8">
            {(userRole === 'admin' || userRole === 'coach') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Evaluación Inicial</h3>
                </div>
                <button 
                  onClick={() => setShowIntakeForm(true)}
                  className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="size-5 text-primary" />
                    <span className="font-semibold">Ficha de Nuevo Cliente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {clientData?.intakeForm ? (
                      <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Completada</span>
                    ) : (
                      <span className="text-[8px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">Pendiente</span>
                    )}
                    <ChevronRight className="size-5 text-text-muted" />
                  </div>
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Dietas (PDF)</h3>
                <button 
                  onClick={() => handleFileUpload('diets')}
                  className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                {clientData?.diets?.filter(d => d && d.id).map(diet => (
                  <div key={diet.id} className="flex items-center justify-between p-3 glass-card rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold">{diet.name}</p>
                        <p className="text-[10px] text-text-muted">Subido hace poco</p>
                      </div>
                    </div>
                    <a 
                      href={diet.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-bg-surface/50 rounded-lg text-text-muted hover:text-primary transition-colors"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                ))}
                {(!clientData?.diets || clientData.diets.length === 0) && (
                  <p className="text-xs text-text-muted italic text-center py-4">No hay dietas subidas</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Entrenamientos (PDF)</h3>
                <button 
                  onClick={() => handleFileUpload('workouts')}
                  className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                {clientData?.workouts?.filter(w => w && w.id).map(workout => (
                  <div key={workout.id} className="flex items-center justify-between p-3 glass-card rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold">{workout.name}</p>
                        <p className="text-[10px] text-text-muted">Subido hace poco</p>
                      </div>
                    </div>
                    <a 
                      href={workout.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-bg-surface/50 rounded-lg text-text-muted hover:text-primary transition-colors"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                ))}
                {(!clientData?.workouts || clientData.workouts.length === 0) && (
                  <p className="text-xs text-text-muted italic text-center py-4">No hay entrenamientos subidos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {clientData && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Logros Completados</h3>
              {onNavigate && (
                <button 
                  onClick={() => onNavigate('progress')}
                  className="text-primary text-[10px] font-bold uppercase tracking-widest"
                >
                  Ver todos
                </button>
              )}
            </div>
            {completedAchievements.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {completedAchievements.filter(a => a && a.id).map(a => (
                  <div key={a.id} className="size-14 shrink-0 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20 gap-1">
                    {a.icon === 'Dumbbell' && <Dumbbell className="size-5 text-primary" />}
                    {a.icon === 'Flame' && <Flame className="size-5 text-primary" />}
                    {a.icon === 'Droplets' && <Droplets className="size-5 text-primary" />}
                    {a.icon === 'Sun' && <Sun className="size-5 text-primary" />}
                    {a.icon === 'Sword' && <Sword className="size-5 text-primary" />}
                    {a.icon === 'Utensils' && <Utensils className="size-5 text-primary" />}
                    {a.icon === 'Camera' && <Camera className="size-5 text-primary" />}
                    {a.icon === 'Trophy' && <Trophy className="size-5 text-primary" />}
                    {a.icon === 'Moon' && <Moon className="size-5 text-primary" />}
                    {a.icon === 'Footprints' && <Footprints className="size-5 text-primary" />}
                    <span className="text-[7px] font-black uppercase text-primary truncate w-full text-center px-1">{a.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-6 text-center border border-dashed border-black/10 dark:border-white/10">
                <Trophy className="size-8 text-text-muted mx-auto mb-2 opacity-10" />
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Sin logros aún</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {isViewingClient && isAdmin && (
            <div className="space-y-3">
              <div className="glass-card rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Asignación de Entrenador</p>
                <select 
                  value={assignedCoachId}
                  onChange={(e) => {
                    setAssignedCoachId(e.target.value);
                    if (clientData?.id) onUpdateClient(clientData.id, { assignedCoachId: e.target.value });
                  }}
                  className="w-full bg-bg-surface/50 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="" disabled>Seleccionar Entrenador</option>
                  {coaches.filter(c => c && c.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-text-muted italic">Como administrador, puedes reasignar este cliente a otro coach.</p>
              </div>

              <div className="glass-card rounded-xl p-4 space-y-4">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Gestión de Cuenta</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      if (clientData?.id) onUpdateClient(clientData.id, { active: !clientData.active });
                    }}
                    className={cn(
                      "w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      clientData?.active 
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20" 
                        : "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20"
                    )}
                  >
                    {clientData?.active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="size-4" />
                    Eliminar Cuenta
                  </button>
                </div>
                <p className="text-[10px] text-text-muted italic">
                  Las cuentas desactivadas o eliminadas no podrán acceder a la aplicación.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <Settings className="size-5 text-text-muted" />
              <span className="font-semibold">{isViewingClient ? 'Ajustes del Cliente' : 'Ajustes de cuenta'}</span>
            </div>
            <ChevronRight className="size-5 text-text-muted" />
          </button>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Soporte Directo</p>
            {coaches && coaches.length > 0 ? (
              coaches.map((coach, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    const message = encodeURIComponent(`Hola ${coach.name}, necesito soporte con mi plan.`);
                    window.open(`https://wa.me/${coach.phone}?text=${message}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-4 glass-card rounded-xl group transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <MessageCircle className="size-4 text-secondary" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold block text-sm">Soporte con {coach.name}</span>
                      <span className="text-[10px] text-text-muted">WhatsApp Directo</span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-text-muted" />
                </button>
              ))
            ) : (
              <div className="p-4 glass-card rounded-xl text-center border border-dashed border-black/10 dark:border-white/10">
                <MessageCircle className="size-6 text-text-muted mx-auto mb-2 opacity-20" />
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">No hay entrenadores disponibles</p>
              </div>
            )}
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
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10">
              <button onClick={() => setShowSettings(false)} className="p-2">
                <ChevronLeft className="size-6" />
              </button>
              <h2 className="text-lg font-bold ml-2">Ajustes de Cuenta</h2>
            </header>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Apariencia</h3>
                <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="size-5 text-primary" /> : <Sun className="size-5 text-primary" />}
                    <span>Modo Oscuro</span>
                  </div>
                  <button 
                    onClick={onToggleDarkMode}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      darkMode ? "bg-primary" : "bg-bg-surface border border-black/10 dark:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 size-4 bg-bg-dark rounded-full transition-all",
                      darkMode ? "right-1" : "left-1"
                    )}></div>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Notificaciones</h3>
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
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Seguridad</h3>
                <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Cambiar Contraseña</span>
                  <ChevronRight className="size-5 text-text-muted" />
                </button>
                <button className="w-full flex items-center justify-between p-4 glass-card rounded-xl">
                  <span>Privacidad de Datos</span>
                  <ChevronRight className="size-5 text-text-muted" />
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

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-sm glass-panel p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="size-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">¿Eliminar cuenta?</h3>
                  <p className="text-text-muted text-sm mt-2">
                    Esta acción marcará la cuenta de <span className="text-text-bright font-bold">{clientData?.name}</span> como eliminada. No podrá volver a entrar.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-2 mt-2">
                  <button 
                    onClick={() => {
                      if (clientData?.id) {
                        onUpdateClient(clientData.id, { isDeleted: true });
                        setShowDeleteConfirm(false);
                        // Go back to dashboard
                        onLogout(); 
                      }
                    }}
                    className="w-full py-4 bg-red-500 text-white font-bold rounded-xl"
                  >
                    Sí, Eliminar Cuenta
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 bg-bg-surface text-text-bright font-bold rounded-xl border border-black/5 dark:border-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntakeForm && clientData && (
          <IntakeFormModal 
            isOpen={showIntakeForm}
            onClose={() => setShowIntakeForm(false)}
            client={clientData}
            onSave={(data) => {
              if (clientData?.id) {
                onUpdateClient(clientData.id, { intakeForm: data });
                setShowIntakeForm(false);
                setToast({ show: true, message: 'Ficha de cliente guardada', type: 'success' });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const [screen, setScreen] = useState<Screen>('welcome');
  const [userRole, setUserRole] = useState<'admin' | 'coach' | 'client' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loggedInCoach, setLoggedInCoach] = useState<Coach | null>(null);
  const [coachesList, setCoachesList] = useState<Coach[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            
            if (userData.role === 'coach' || userData.role === 'admin') {
              const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
              if (coachDoc.exists()) {
                setLoggedInCoach({ id: coachDoc.id, ...coachDoc.data() } as Coach);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoggedInCoach(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners for Coaches and Clients
  useEffect(() => {
    if (!isAuthReady) return;

    let coachesUnsubscribe = () => {};
    if (userRole === 'admin' || userRole === 'coach') {
      coachesUnsubscribe = onSnapshot(collection(db, 'coaches'), (snapshot) => {
        const coaches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
        setCoachesList(coaches);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'coaches'));
    } else {
      setCoachesList([]);
    }

    let clientsQuery;
    if (userRole === 'admin') {
      clientsQuery = collection(db, 'clients');
    } else if (userRole === 'coach' && currentUser) {
      clientsQuery = query(collection(db, 'clients'), where('assignedCoachId', '==', currentUser.uid));
    } else if (userRole === 'client' && currentUser) {
      clientsQuery = query(collection(db, 'clients'), where('id', '==', currentUser.uid));
    } else {
      setClientsList([]);
      return;
    }

    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const clients = snapshot.docs.map(doc => normalizeClient({ id: doc.id, ...doc.data() }) as Client);
      setClientsList(clients);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clients'));

    let notificationsQuery;
    if (userRole === 'admin') {
      notificationsQuery = collection(db, 'notifications');
    } else if (userRole === 'coach' && currentUser) {
      notificationsQuery = query(collection(db, 'notifications'), where('assignedCoachId', '==', currentUser.uid));
    } else if (userRole === 'client' && currentUser) {
      notificationsQuery = query(collection(db, 'notifications'), where('clientId', '==', currentUser.uid));
    }

    let notificationsUnsubscribe = () => {};
    if (notificationsQuery) {
      notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setNotifications(notifs);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
    }

    let usersQuery;
    if (userRole === 'admin' || userRole === 'coach') {
      usersQuery = collection(db, 'users');
    } else if (userRole === 'client' && currentUser) {
      usersQuery = query(collection(db, 'users'), where('__name__', '==', currentUser.uid));
    }

    let usersUnsubscribe = () => {};
    if (usersQuery) {
      usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsersList(users);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    }

    return () => {
      coachesUnsubscribe();
      clientsUnsubscribe();
      notificationsUnsubscribe();
      usersUnsubscribe();
    };
  }, [isAuthReady, userRole, currentUser]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Test connection to Firestore
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();
  }, []);

  const handleBlockUser = async (uid: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, disabled: currentActive })
      });
      
      if (!response.ok) throw new Error('Error al bloquear usuario');
      
      await setDoc(doc(db, 'users', uid), { active: !currentActive }, { merge: true });
      setToast({ show: true, message: currentActive ? 'Usuario bloqueado' : 'Usuario desbloqueado', type: 'success' });
    } catch (error) {
      console.error("Block User Error:", error);
      setToast({ show: true, message: 'Error al cambiar estado del usuario', type: 'error' });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      const response = await fetch(`/api/users/${uid}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar usuario');
      
      // Delete from Firestore
      await setDoc(doc(db, 'users', uid), { isDeleted: true, active: false }, { merge: true });
      setToast({ show: true, message: 'Usuario eliminado correctamente', type: 'success' });
    } catch (error) {
      console.error("Delete User Error:", error);
      setToast({ show: true, message: 'Error al eliminar usuario', type: 'error' });
    }
  };
  const handleBootstrap = async () => {
    try {
      setToast({ show: true, message: 'Reparando accesos de administrador...', type: 'info' });
      
      const response = await fetch('/api/admin/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Error al llamar al servidor de reparación');
      
      const data = await response.json();
      
      if (data.success) {
        setToast({ show: true, message: '✓ Accesos de administrador verificados y reparados. Usa "admin123" para entrar.', type: 'success' });
      } else {
        throw new Error('La reparación no fue exitosa');
      }
    } catch (error: any) {
      console.error("Bootstrap Error:", error);
      setToast({ show: true, message: 'Error al reparar administrador: ' + error.message, type: 'error' });
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'client') {
          const clientDoc = await getDoc(doc(db, 'clients', user.uid));
          if (clientDoc.exists()) {
            setSelectedClient(normalizeClient({ id: clientDoc.id, ...clientDoc.data() }));
            setScreen('home');
          }
        } else {
          setScreen('dashboard');
        }
      }
      setToast({ show: true, message: 'Bienvenido de nuevo', type: 'success' });
    } catch (error: any) {
      console.error("Login Error:", error);
      let message = 'Error al iniciar sesión. Correo o contraseña incorrectos.';
      
      if (pass === '123' && (email === 'admin@admin.com' || email === 'alvarowowplayer@gmail.com')) {
        message = 'La contraseña para administradores ha sido actualizada a "admin123" por seguridad (mínimo 6 caracteres).';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Credenciales inválidas. Si eres el administrador, prueba con "admin123" o usa "Recuperar Acceso Admin" en la pantalla inicial.';
      }
      
      setToast({ show: true, message, type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setLoggedInCoach(null);
      setSelectedClient(null);
      setScreen('welcome');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleRegister = async (email: string, pass: string, name: string, role: 'client' | 'coach' | 'admin', assignedCoachId?: string) => {
    try {
      // 1. Create user in Firebase Auth using a secondary app instance to avoid logging out the current admin/coach
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
      const user = userCredential.user;
      
      // 2. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        role: role,
        createdAt: serverTimestamp(),
        active: true
      });

      // 3. Create specific profile document
      if (role === 'client') {
        const newClient: Client = {
          id: user.uid,
          name: name,
          program: 'Nuevo Plan',
          status: 'Recién unido',
          active: true,
          img: `https://picsum.photos/seed/${user.uid}/100/100`,
          weight: '0 kg',
          bodyFat: '0%',
          stepsTarget: 10000,
          waterTarget: 2.5,
          assignedCoachId: assignedCoachId || loggedInCoach?.id || '',
          enabledSections: defaultSections
        };
        await setDoc(doc(db, 'clients', user.uid), newClient);
      } else if (role === 'coach' || role === 'admin') {
        const newCoach: Coach = {
          id: user.uid,
          name: name,
          role: role,
          img: `https://picsum.photos/seed/${user.uid}/100/100`,
          phone: '+34 600 000 000',
          email: email
        };
        await setDoc(doc(db, 'coaches', user.uid), newCoach);
        
        // Create self-client for coach/admin
        const selfClientId = `self_${user.uid}`;
        const selfClient: Client = {
          id: selfClientId,
          name: `${name} (Yo)`,
          program: 'Mi Propio Plan',
          status: 'Hoy',
          active: true,
          img: newCoach.img,
          enabledSections: defaultSections,
          assignedCoachId: user.uid
        };
        await setDoc(doc(db, 'clients', selfClientId), selfClient);
      }

      // 4. Clean up secondary app
      await deleteApp(secondaryApp);

      const roleLabel = role === 'client' ? 'cliente' : role === 'coach' ? 'entrenador' : 'administrador';
      setToast({ show: true, message: `✓ Nuevo ${roleLabel} creado correctamente`, type: 'success' });
      setScreen('dashboard');
    } catch (error: any) {
      console.error("Registration Error:", error);
      setToast({ show: true, message: 'Error al crear usuario: ' + error.message, type: 'error' });
    }
  };

  const showNav = !['onboarding', 'login', 'welcome', 'register'].includes(screen);

  const handleUpdateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      await setDoc(doc(db, 'clients', clientId), updates, { merge: true });
      
      // If we are updating the currently selected client, update that state too
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
      }

      // If this is a self-client update, we might also need to update the coach data
      if (clientId.startsWith('self_') && loggedInCoach) {
        const coachId = clientId.replace('self_', '');
        const coachUpdates: Partial<Coach> = {};
        if (updates.name) coachUpdates.name = updates.name.replace(' (Yo)', '');
        if (updates.img) coachUpdates.img = updates.img;
        
        if (Object.keys(coachUpdates).length > 0) {
          await handleUpdateCoach(coachId, coachUpdates);
        }
      }
    } catch (error) {
      console.error("Error updating client:", error);
      setToast({ show: true, message: "Error al actualizar los datos", type: 'error' });
    }
  };

  const handleUpdateCoach = async (coachId: string, updates: Partial<Coach>) => {
    try {
      await setDoc(doc(db, 'coaches', coachId), updates, { merge: true });
      
      // Also update the user document if name or email changed
      if (updates.name || updates.email) {
        const userUpdates: any = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.email) userUpdates.email = updates.email;
        await setDoc(doc(db, 'users', coachId), userUpdates, { merge: true });
      }

      // If this is the logged in coach, update state
      if (loggedInCoach && loggedInCoach.id === coachId) {
        setLoggedInCoach(prev => prev ? { ...prev, ...updates } : null);
      }

      // Also update the corresponding self-client if it exists
      const selfClientId = `self_${coachId}`;
      const selfClientUpdates: Partial<Client> = {};
      if (updates.name) selfClientUpdates.name = `${updates.name} (Yo)`;
      if (updates.img) selfClientUpdates.img = updates.img;

      if (Object.keys(selfClientUpdates).length > 0) {
        await setDoc(doc(db, 'clients', selfClientId), selfClientUpdates, { merge: true });
      }
    } catch (error) {
      console.error("Error updating coach:", error);
      setToast({ show: true, message: "Error al actualizar el perfil", type: 'error' });
    }
  };

  const handleReportDiscomfort = async (exerciseName: string, description?: string, painLevel?: number) => {
    if (userRole === 'client' && currentClient) {
      try {
        const newNotification = {
          clientId: currentClient.id,
          clientName: currentClient.name,
          exerciseName: exerciseName,
          description: description || '',
          painLevel: painLevel || 0,
          timestamp: serverTimestamp(),
          read: false,
          assignedCoachId: currentClient.assignedCoachId || ''
        };
        
        await addDoc(collection(db, 'notifications'), newNotification);
        setToast({ show: true, message: "Reporte enviado al coach", type: 'success' });
      } catch (error) {
        console.error("Error reporting discomfort:", error);
        setToast({ show: true, message: "Error al enviar el reporte", type: 'error' });
      }
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setScreen('home');
  };

  const isCoachViewing = (userRole === 'admin' || userRole === 'coach') && selectedClient !== null && screen !== 'dashboard';

  const currentClient = selectedClient || (
    userRole === 'client' 
      ? (clientsList.find(c => c && c.id === currentUser?.uid) || clientsList.find(c => c && c.id === '1') || clientsList[0] || null)
      : (userRole === 'admin' || userRole === 'coach') 
        ? (loggedInCoach ? (clientsList.find(c => c && c.id === `self_${loggedInCoach.id}`) || null) : null)
        : null
  ) || null;

  useEffect(() => {
    console.log('App State:', {
      screen,
      userRole,
      isAuthReady,
      hasCurrentUser: !!currentUser,
      hasCurrentClient: !!currentClient,
      hasLoggedInCoach: !!loggedInCoach
    });
  }, [screen, userRole, isAuthReady, currentUser, currentClient, loggedInCoach]);

  useEffect(() => {
    if (screen === 'profile') {
      console.log('Profile Screen Context:', {
        userRole,
        currentClientId: currentClient?.id,
        loggedInCoachId: loggedInCoach?.id,
        selectedClientId: selectedClient?.id,
        clientsListLength: clientsList.length
      });
    }
  }, [screen, userRole, currentClient, loggedInCoach, selectedClient, clientsList]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-4">
        <div className="bg-primary/20 p-6 rounded-3xl animate-pulse">
          <Dumbbell className="size-12 text-primary animate-bounce" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-text-bright tracking-tight">Cargando tu experiencia...</h2>
          <div className="flex gap-1">
            <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="size-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-dark min-h-screen font-sans selection:bg-primary selection:text-bg-dark flex flex-col transition-colors duration-300">
      {isCoachViewing && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full overflow-hidden border border-primary/40">
              <img src={selectedClient?.img} className="w-full h-full object-cover" alt={selectedClient?.name} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {selectedClient?.id?.startsWith && selectedClient.id.startsWith('self_') ? 'Mi Seguimiento' : `Modo Edición: ${selectedClient?.name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setToast({ show: true, message: '✓ Cambios guardados correctamente', type: 'success' });
              }}
              className="text-[10px] font-bold uppercase tracking-widest bg-bg-surface/50 text-text-bright px-3 py-1 rounded hover:bg-bg-surface/80 transition-colors border border-black/10 dark:border-white/10"
            >
              Guardar
            </button>
            <button 
              onClick={() => {
                setScreen('dashboard');
              }}
              className="text-[10px] font-bold uppercase tracking-widest bg-primary text-bg-dark px-3 py-1 rounded"
            >
              Salir
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-1 pb-24">
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
                onRegister={handleRegister} 
                onBack={() => setScreen('dashboard')}
                coaches={coachesList}
                userRole={userRole}
              />
            )}
            {screen === 'onboarding' && <OnboardingScreen onComplete={() => setScreen('dashboard')} />}
            {screen === 'login' && (
              <LoginScreen 
                setToast={setToast}
                onLogin={handleLogin}
                onBootstrap={handleBootstrap}
              />
            )}
            {screen === 'user_management' && (
              <UserManagementScreen 
                users={usersList}
                onBack={() => setScreen('dashboard')}
                onBlockUser={handleBlockUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
            {screen === 'home' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar el inicio</div>}>
                <HomeScreen isCoach={isCoachViewing} clientData={currentClient} coaches={coachesList} />
              </ErrorBoundary>
            )}
            {screen === 'dashboard' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar el panel de control</div>}>
                <DashboardScreen 
                  coach={loggedInCoach}
                  clients={clientsList}
                  notifications={notifications}
                  onAddClient={() => setScreen('register')} 
                  onSelectClient={handleSelectClient}
                  onMarkNotificationRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                  onUpdateClient={handleUpdateClient}
                  userRole={userRole}
                  setScreen={setScreen}
                />
              </ErrorBoundary>
            )}
            {screen === 'workout' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar el entrenamiento</div>}>
                <WorkoutScreen 
                  isCoach={isCoachViewing} 
                  clientData={currentClient} 
                  onReportDiscomfort={handleReportDiscomfort}
                />
              </ErrorBoundary>
            )}
            {screen === 'timer' && <TimerScreen />}
            {screen === 'nutrition' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar la nutrición</div>}>
                <NutritionScreen isCoach={isCoachViewing} clientData={currentClient} />
              </ErrorBoundary>
            )}
            {screen === 'progress' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar el progreso</div>}>
                <ProgressScreen isCoach={isCoachViewing} clientData={currentClient} />
              </ErrorBoundary>
            )}
            {screen === 'profile' && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-red-500">Error al cargar el perfil</div>}>
                <ProfileScreen 
                  userRole={userRole}
                  clientData={currentClient}
                  coachData={loggedInCoach}
                  onUpdateClient={handleUpdateClient}
                  onUpdateCoach={handleUpdateCoach}
                  onNavigate={setScreen}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  onLogout={handleLogout}
                  coaches={coachesList}
                  setToast={setToast}
                />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <BottomNav 
            active={screen} 
            onChange={setScreen} 
            role={userRole} 
            clientData={selectedClient || (userRole === 'client' ? (clientsList[0] || null) : null)} 
          />
        </div>
      )}

      <AnimatePresence>
        {toast.show && (
          <CustomToast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
