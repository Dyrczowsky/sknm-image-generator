import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bug, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CircleAlert, CircleDot, CircleHelp, CirclePause, CloudAlert, CloudCheck, CloudOff, Copy, Download, Ellipsis,
  ExternalLink, Eye, EyeOff, FilePlus, FolderOpen, GripVertical, HardDrive, History, Image, Images, Info, Keyboard,
  Languages, LayoutTemplate, Library, Lightbulb, Link, LoaderCircle, LogIn, LogOut, Palette, Pencil, Plus, QrCode,
  RefreshCw, RotateCcw, Save, Search, Share2, SlidersHorizontal, SquarePen, StickyNote, Trash2, TriangleAlert, Type,
  Upload, User, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Jedyny plik, który importuje `lucide-react`. Reszta aplikacji podaje nazwę
// z tej listy (`<Icon name="download" />`, `<Button icon="download">`), więc
// podmiana rysunku albo całej biblioteki dotyka tylko tego miejsca.
// Nowa ikona = import wyżej + wpis tutaj.
const ICONS = {
  // Strony w górnym pasku
  editor: SquarePen,
  projects: FolderOpen,
  graphics: Images,
  history: History,
  notes: StickyNote,
  // Zakładki edytora
  template: LayoutTemplate,
  content: Type,
  look: SlidersHorizontal,
  palette: Palette,
  // Stan zapisu projektu
  save: Save,
  saved: CloudCheck,
  saving: LoaderCircle,
  local: HardDrive,
  unsaved: CircleDot,
  saveError: CloudAlert,
  offline: CloudOff,
  paused: CirclePause,
  conflict: TriangleAlert,
  // Akcje
  download: Download,
  upload: Upload,
  eye: Eye,
  eyeOff: EyeOff,
  trash: Trash2,
  pencil: Pencil,
  share: Share2,
  plus: Plus,
  newProject: FilePlus,
  copy: Copy,
  restore: RotateCcw,
  retry: RefreshCw,
  search: Search,
  close: X,
  check: Check,
  more: Ellipsis,
  externalLink: ExternalLink,
  link: Link,
  qr: QrCode,
  image: Image,
  library: Library,
  // Kierunki i zmiana kolejności
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  grip: GripVertical,
  // Pomoc, zgłoszenia, konto
  keyboard: Keyboard,
  help: CircleHelp,
  bug: Bug,
  idea: Lightbulb,
  language: Languages,
  user: User,
  signIn: LogIn,
  signOut: LogOut,
  // Komunikaty
  info: Info,
  alert: CircleAlert,
  warning: TriangleAlert,
  spinner: LoaderCircle,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
export type IconSize = 'sm' | 'md' | 'lg'

// sm - w przyciskach i przy tekście 13-14px; md - samodzielne przyciski-ikony
// i nawigacja; lg - puste stany.
const PIXELS: Record<IconSize, number> = { sm: 16, md: 18, lg: 24 }

interface IconProps {
  name: IconName
  size?: IconSize
  // Bez etykiety ikona jest ozdobą (`aria-hidden`) - znaczenie niesie tekst
  // obok albo `aria-label` przycisku. Z etykietą staje się obrazem z nazwą.
  label?: string
  className?: string
}

export function Icon({ name, size = 'sm', label, className }: IconProps) {
  const Glyph = ICONS[name]
  const a11y = label ? ({ role: 'img', 'aria-label': label } as const) : ({ 'aria-hidden': true } as const)
  return <Glyph size={PIXELS[size]} strokeWidth={1.75} absoluteStrokeWidth className={`flex-none${className ? ` ${className}` : ''}`} focusable={false} {...a11y} />
}
