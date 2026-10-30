'use client';

import * as React from 'react';
import {
  AlarmClock,
  BatteryWarning,
  Ban,
  BellRing,
  CircleAlert,
  CircleCheck,
  Clock,
  Contrast,
  Copy,
  Ellipsis,
  Hourglass,
  Info,
  LayoutGrid,
  Lock,
  Maximize,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  Presentation,
  Puzzle,
  Search,
  Sparkles,
  Sun,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { AppMark, Mark, type TAppMarkState } from '@/components/brand/mark';
import { Banner, type TBannerKind } from '@/components/product/banner';
import { Chip } from '@/components/product/chip';
import { CommandPalette, type ICommandGroup } from '@/components/product/command-palette';
import { Countdown } from '@/components/product/countdown';
import {
  DevicePresence,
  DevicePresenceSkeleton,
  IDENTITIES,
  IDENTITY_CLASSES,
  PresenceMarker,
  type IDevice,
} from '@/components/product/device-presence';
import { EmptyState } from '@/components/product/empty-state';
import { ExtendBar } from '@/components/product/extend-bar';
import { FaceSwitcher } from '@/components/product/face-switcher';
import { FixPanel } from '@/components/product/fix-panel';
import { ListRowButton } from '@/components/product/list-row';
import { PresetGroup } from '@/components/product/preset-group';
import { PanelHeader, SectionHeader, SectionLink } from '@/components/product/section-header';
import { SegmentedControl } from '@/components/product/segmented-control';
import { StatusAlert } from '@/components/product/status-alert';
import { StatusPill, type TStatusState } from '@/components/product/status-pill';
import { SwitchRow } from '@/components/product/switch-row';
import {
  ProductToast,
  showEndedToast,
  showExtendedToast,
  showLowTimeToast,
  showSyncFailedToast,
} from '@/components/product/toasts';
import { TypedConfirm } from '@/components/product/typed-confirm';
import { Scene } from '@/components/scene/scene';
import { SCENES, type TSceneKey } from '@/components/scene/scene-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { endsLine, formatDuration, formatFullDate, formatFullDateTime, formatTime } from '@/lib/format';

type TVariant = 'default' | 'lamp' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

const VARIANTS: { variant: TVariant; name: string; label: string; icon?: boolean }[] = [
  { variant: 'default', name: 'Primary', label: 'Start', icon: true },
  { variant: 'lamp', name: 'Lamp', label: 'Awake' },
  { variant: 'secondary', name: 'Secondary', label: 'Extend' },
  { variant: 'outline', name: 'Outline', label: 'Preset' },
  { variant: 'ghost', name: 'Ghost', label: 'Cancel' },
  { variant: 'destructive', name: 'Destructive', label: 'Stop', icon: true },
  { variant: 'link', name: 'Link', label: 'Learn' },
];

// Hover and press can't be held open, so the gallery paints them with the same tokens the variants use.
const FORCED: Record<TVariant, { hover: string; pressed: string }> = {
  default: {
    hover: 'border-primary-hover bg-primary-hover',
    pressed: 'translate-y-px border-primary-press bg-primary-press shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
  },
  lamp: {
    hover: 'border-lamp-hover bg-lamp-hover',
    pressed: 'translate-y-px border-lamp-press bg-lamp-press shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
  },
  secondary: {
    hover: 'border-surface-3 bg-surface-3',
    pressed: 'translate-y-px border-border bg-border shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
  },
  outline: { hover: 'bg-secondary', pressed: 'translate-y-px border-surface-3 bg-surface-3' },
  ghost: { hover: 'border-secondary bg-secondary', pressed: 'translate-y-px border-surface-3 bg-surface-3' },
  destructive: {
    hover: 'border-destructive-hover bg-destructive-hover',
    pressed: 'translate-y-px border-destructive-press bg-destructive-press shadow-[inset_0_2px_0_rgba(0,0,0,.18)]',
  },
  link: { hover: 'decoration-2', pressed: 'decoration-2' },
};
const FOCUS = 'outline-2 outline-offset-2 outline-ring';

const PILLS: { state: TStatusState; time?: string }[] = [
  { state: 'idle' },
  { state: 'starting' },
  { state: 'awake', time: '11:42 AM' },
  { state: 'paused' },
  { state: 'needsyou' },
  { state: 'fallback' },
  { state: 'blocked' },
  { state: 'ended', time: '11:42 AM' },
  { state: 'unsupported' },
];

const APP_STATES: TAppMarkState[] = [
  'idle',
  'starting',
  'running',
  'fallback',
  'paused',
  'needsyou',
  'blocked',
  'unsupported',
  'ended',
];

const FACES = [
  { id: 'bold', name: 'Bold' },
  { id: 'analog', name: 'Analog' },
  { id: 'flip', name: 'Flip' },
  { id: 'ring', name: 'Ring' },
  { id: 'words', name: 'Words' },
  { id: 'horizon', name: 'Horizon' },
];

const DEVICES: IDevice[] = [
  {
    id: 'laptop',
    name: 'Work laptop',
    meta: 'This device · until 11:42 AM',
    kind: 'laptop',
    identity: 'cobalt',
    status: 'awake',
  },
  {
    id: 'ipad',
    name: 'Kitchen iPad',
    meta: 'Cooking · until 6:00 PM',
    kind: 'tablet',
    identity: 'bubblegum',
    status: 'awake',
  },
  { id: 'phone', name: 'Phone', meta: 'Tab hidden since 10:58 AM', kind: 'phone', identity: 'denim', status: 'paused' },
];

const SCENE_NAMES: [TSceneKey, string, string][] = [
  ['hero', 'Onboarding / hero', 'A kitchen tablet keeps its ring lit.'],
  ['firstaction', 'First action', 'Press Start; the lamp lights.'],
  ['welcome', 'Joined / welcome', 'Extension installed and pinned.'],
  ['success', 'Success', 'Session finished as planned.'],
  ['offline', 'Offline', 'No connection — the tool still works.'],
  ['conflict', 'Conflict', 'Another AwakeTab tab already holds the lamp.'],
  ['history', 'History', 'Your sessions this week.'],
  ['expired', 'Expired', 'A licence key ran out.'],
  ['notfound', 'Not found', 'Wrong turn, lantern still on.'],
  ['removed', 'Removed', 'This device was deactivated.'],
  ['error', 'Generic error', 'Something broke on our side.'],
  ['maintenance', 'Maintenance', 'Back shortly; local sessions keep running.'],
  ['noitems', 'No items yet', 'No notes yet.'],
  ['cooking', 'Use case · cooking', 'Recipe stays on beside the pot.'],
  ['presenting', 'Use case · presenting', 'Slides on until the talk ends.'],
  ['dashboard', 'Use case · wall display', 'A dashboard that never sleeps.'],
  ['nightdesk', 'Use case · long jobs', 'An overnight build, watched.'],
];

const noop = () => undefined;

function Block({
  title,
  code,
  children,
  className,
}: {
  title: string;
  code?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-[18px] ${className ?? ''}`}>
      <h3 className="m-0 flex flex-wrap items-baseline justify-between gap-3 text-[16px] font-bold">
        {title}
        {code ? <span className="font-mono text-[12px] font-medium text-muted-foreground-strong">{code}</span> : null}
      </h3>
      {children}
    </section>
  );
}

function Board({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <h2 className="m-0 text-[28px] leading-[1.2] font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{children}</span>;
}

function ThemeBar() {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      aria-label="Gallery theme"
      className="w-[360px] max-w-full"
      value={theme ?? 'system'}
      onValueChange={setTheme}
      options={[
        { value: 'system', label: 'Auto' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'oled', label: 'OLED' },
      ]}
    />
  );
}

function ButtonsBlock() {
  const states = ['Default', 'Hover', 'Focus', 'Pressed', 'Disabled', 'Loading'];
  return (
    <Block title="Button" code="<Button variant size>">
      <div className="grid grid-cols-[78px_repeat(6,minmax(0,1fr))] items-center gap-1.5">
        <span />
        {states.map((s) => (
          <span key={s} className="text-center font-mono text-[12px] text-muted-foreground-strong">
            {s}
          </span>
        ))}
        {VARIANTS.map(({ variant, name, label, icon }) => {
          const Icon = variant === 'destructive' ? X : Play;
          const content = (
            <>
              {icon ? <Icon aria-hidden="true" /> : null}
              {label}
            </>
          );
          return (
            <React.Fragment key={variant}>
              <span className="text-[13px] font-semibold text-muted-foreground-strong">{name}</span>
              <Button variant={variant} className="px-2.5">
                {content}
              </Button>
              <Button variant={variant} className={`px-2.5 ${FORCED[variant].hover}`}>
                {content}
              </Button>
              <Button variant={variant} className={`px-2.5 ${FOCUS}`}>
                {content}
              </Button>
              <Button variant={variant} className={`px-2.5 ${FORCED[variant].pressed}`}>
                {content}
              </Button>
              <Button variant={variant} className="px-2.5" disabled>
                {content}
              </Button>
              <Button variant={variant} className="px-2.5" loading>
                {content}
              </Button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-2.5 border-t border-dashed pt-1.5">
        {[
          {
            n: 'sm · 36',
            el: (
              <Button variant="secondary" size="sm">
                Extend
              </Button>
            ),
          },
          {
            n: 'default · 44',
            el: (
              <Button>
                <Play aria-hidden="true" />
                Start
              </Button>
            ),
          },
          {
            n: 'lg · 52',
            el: (
              <Button size="lg">
                <Play aria-hidden="true" />
                Keep awake
              </Button>
            ),
          },
          {
            n: 'xl · 64 · awake',
            el: (
              <Button size="xl">
                <Play aria-hidden="true" />
                Keep awake
              </Button>
            ),
          },
          {
            n: 'icon · 44',
            el: (
              <Button variant="outline" size="icon" aria-label="Fullscreen">
                <Maximize aria-hidden="true" />
              </Button>
            ),
          },
          {
            n: 'stage · 52',
            el: (
              <Button variant="secondary" size="stage">
                <Pause aria-hidden="true" />
                Pause
              </Button>
            ),
          },
          {
            n: 'cta · 60',
            el: (
              <Button size="cta">
                <Play aria-hidden="true" />
                Keep this screen awake
              </Button>
            ),
          },
          {
            n: 'icon-lg · 52',
            el: (
              <Button variant="outline" size="icon-lg" aria-label="Fullscreen">
                <Maximize aria-hidden="true" />
              </Button>
            ),
          },
        ].map(({ n, el }) => (
          <div key={n} className="flex flex-col items-center gap-1.5">
            {el}
            <span className="font-mono text-[12px] text-muted-foreground-strong">{n}</span>
          </div>
        ))}
      </div>
      <p className="m-0 text-[13px] leading-[1.5] text-muted-foreground-strong">
        sm is 36 px tall but keeps a 44 px hit area through 4 px of invisible padding. Hover darkens one ramp step on
        paper and lightens one on midnight. Disabled uses surface-2 and text-3, not opacity, so the label stays legible.
        Loading keeps the label and adds a spinner; the spinner stops under reduced motion.
      </p>
    </Block>
  );
}

function InputsBlock() {
  return (
    <Block title="Input" code="<Input> <Label> <FormMessage>">
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-min">Minutes · default</Label>
          <Input id="g-min" placeholder="e.g. 45" />
          <Help>Between 1 and 1,440.</Help>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-min-f">Minutes · focus</Label>
          <Input id="g-min-f" defaultValue="45" className="border-ring shadow-[0_0_0_3px_var(--ring-soft)]" />
          <Help>Ends at 11:27 AM.</Help>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-label">Session label · filled</Label>
          <Input id="g-label" defaultValue="Presenting to the board" />
          <Help>Shown on your other devices.</Help>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-err">Stay awake until · error</Label>
          <span className="relative flex items-center">
            <Input id="g-err" defaultValue="9:15 AM" aria-invalid className="pr-10" />
            <CircleAlert
              className="pointer-events-none absolute right-3 size-[18px] text-destructive"
              aria-hidden="true"
            />
          </span>
          <span className="text-[12px] leading-[1.45] font-semibold text-destructive">
            Error: pick a time after 10:42 AM.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-dis">Idle policy · disabled</Label>
          <span className="relative flex items-center">
            <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden="true" />
            <Input id="g-dis" disabled defaultValue="Set by your organisation" className="pl-9" />
          </span>
          <Help>Ask [CONTACT EMAIL] to change it.</Help>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-search">Search · with icon and hint</Label>
          <span className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 size-[18px] text-muted-foreground-strong"
              aria-hidden="true"
            />
            <Input id="g-search" placeholder="Search commands" className="pr-14 pl-[38px]" />
            <Kbd variant="soft" className="absolute right-3">
              ⌘K
            </Kbd>
          </span>
          <Help>Opens the command palette.</Help>
        </div>
      </div>
    </Block>
  );
}

function SelectSwitchBlock() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Block title="Select" code="<Select>">
        <div className="flex flex-col gap-1.5">
          <Label>Session length · closed (open it)</Label>
          <Select defaultValue="1h">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m" meta="15m">
                15 minutes
              </SelectItem>
              <SelectItem value="30m" meta="30m">
                30 minutes
              </SelectItem>
              <SelectItem value="1h" meta="1h">
                1 hour
              </SelectItem>
              <SelectItem value="6pm" meta="7h 18m">
                Until 6:00 PM
              </SelectItem>
              <SelectItem value="stop" meta="∞">
                Until I stop it
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Block>
      <Block title="Switch · Checkbox · Radio">
        <SwitchRow label="Keep screen awake" description="On · ends 11:42 AM" defaultChecked />
        <SwitchRow label="Dim the clock at night" description="Off" />
        <SwitchRow
          label="Sound when it ends"
          description="On · keyboard focus"
          defaultChecked
          className="[&_[data-slot=switch]]:outline-2 [&_[data-slot=switch]]:outline-offset-2 [&_[data-slot=switch]]:outline-ring"
        />
        <SwitchRow label="Block system sleep" description="Needs the desktop app" disabled />
        <div className="flex flex-col gap-0.5 border-t border-dashed pt-2">
          {[
            { label: 'Show seconds', checked: true as boolean | 'indeterminate' },
            { label: 'Remember last preset', checked: false as boolean | 'indeterminate' },
            { label: 'All devices (2 of 3 selected)', checked: 'indeterminate' as const },
          ].map(({ label, checked }) => (
            <label key={label} className="flex min-h-11 items-center gap-3 text-[14px]">
              <Checkbox defaultChecked={checked} />
              {label}
            </label>
          ))}
        </div>
        <RadioGroup
          defaultValue="bold"
          aria-label="Face"
          className="flex flex-wrap gap-3.5 border-t border-dashed pt-2"
        >
          {['Bold', 'Analog', 'Flip'].map((name) => (
            <label key={name} className="inline-flex min-h-11 items-center gap-2 text-[14px]">
              <RadioGroupItem value={name.toLowerCase()} />
              {name}
            </label>
          ))}
        </RadioGroup>
      </Block>
    </div>
  );
}

function SliderTabsBlock() {
  const [size, setSize] = React.useState([72]);
  return (
    <Block title="Slider · Tabs · Toggle group" code="<Slider> <Tabs> <ToggleGroup>">
      <div className="grid grid-cols-1 items-start gap-[18px] sm:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="flex justify-between text-[13px] font-semibold">
              Clock size{' '}
              <span className="font-mono text-[12px] font-normal text-muted-foreground-strong">{size[0]}%</span>
            </span>
            <Slider value={size} onValueChange={setSize} aria-label="Clock size" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="flex justify-between text-[13px] font-semibold">
              Dim after · focused{' '}
              <span className="font-mono text-[12px] font-normal text-muted-foreground-strong">10 min</span>
            </span>
            <Slider defaultValue={[34]} aria-label="Dim after" />
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <Tabs defaultValue="timer">
            <TabsList aria-label="Mode">
              <TabsTrigger value="timer">
                <Timer aria-hidden="true" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="clock">
                <Clock aria-hidden="true" />
                Clock
              </TabsTrigger>
              <TabsTrigger value="until">
                <Hourglass aria-hidden="true" />
                Until
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ToggleGroup type="single" defaultValue="dark" aria-label="Theme">
            <ToggleGroupItem value="light">
              <Sun aria-hidden="true" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark">
              <Moon aria-hidden="true" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem value="auto">
              <Monitor aria-hidden="true" />
              Auto
            </ToggleGroupItem>
          </ToggleGroup>
          <Help>
            Selected tab: raised surface + bold label. Pressed toggle: lamp-soft fill, lamp border and text,
            aria-pressed.
          </Help>
          <Tabs defaultValue="dark">
            <TabsList variant="segmented" aria-label="Theme segmented">
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="dark">Dark</TabsTrigger>
              <TabsTrigger value="oled">OLED</TabsTrigger>
            </TabsList>
          </Tabs>
          <SegmentedControl
            aria-label="Keep-awake level"
            defaultValue="screen"
            options={[
              { value: 'screen', label: 'Screen', icon: Monitor },
              { value: 'system', label: 'System · app', icon: Lock, disabled: true },
            ]}
          />
        </div>
      </div>
    </Block>
  );
}

function BadgeBlock() {
  return (
    <Block title="Badge" code="<Badge variant> · icon + word, never a bare dot">
      <div className="flex flex-wrap gap-2">
        <Badge variant="awake">
          <CircleCheck strokeWidth={2.25} aria-hidden="true" />
          Awake
        </Badge>
        <Badge variant="paused">
          <Pause strokeWidth={2.25} aria-hidden="true" />
          Paused
        </Badge>
        <Badge variant="blocked">
          <Ban strokeWidth={2.25} aria-hidden="true" />
          Blocked
        </Badge>
        <Badge variant="needsyou">
          <BellRing strokeWidth={2.25} aria-hidden="true" />
          Needs you
        </Badge>
        <Badge variant="ended">
          <Clock strokeWidth={2.25} aria-hidden="true" />
          Ended
        </Badge>
        <Badge variant="pro">
          <Sparkles strokeWidth={2.25} aria-hidden="true" />
          Pro
        </Badge>
        <Badge variant="secondary">
          <Info strokeWidth={2.25} aria-hidden="true" />
          Secondary
        </Badge>
        <Badge variant="outline">
          <Info strokeWidth={2.25} aria-hidden="true" />
          Outline
        </Badge>
        <Badge variant="pro" size="sm">
          Pro
        </Badge>
      </div>
    </Block>
  );
}

function OverlayBlock() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Tooltip · Popover">
          <div className="flex flex-col items-start gap-1.5">
            <span className="inline-flex items-center gap-2 rounded-[8px] bg-tip px-2.5 py-1.5 text-[13px] font-semibold text-tip-foreground">
              Fullscreen{' '}
              <span className="rounded-[5px] border border-tip-kbd px-1.5 py-px font-mono text-[12px]">F</span>
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Fullscreen" className={FOCUS}>
                  <Maximize aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Fullscreen <Kbd>F</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="self-start">
                Open popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverDescription>ENDS</PopoverDescription>
              <PopoverTitle>Thursday, 29 October 2026 · 11:42 AM</PopoverTitle>
              <div className="flex flex-wrap gap-1.5">
                <Chip>+15 min</Chip>
                <Chip>+30 min</Chip>
                <Chip>+1 hour</Chip>
              </div>
            </PopoverContent>
          </Popover>
        </Block>
        <Block title="Dropdown menu" code="<DropdownMenu>">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="self-start bg-surface-3 px-3.5 data-[state=open]:bg-surface-3">
                <Ellipsis className="size-[18px]" aria-hidden="true" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Plus aria-hidden="true" />
                Extend 15 minutes
                <DropdownMenuShortcut>+</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus aria-hidden="true" />
                Extend 1 hour
                <DropdownMenuShortcut>⇧+</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy aria-hidden="true" />
                Copy setup link
                <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Maximize aria-hidden="true" />
                Fullscreen
                <DropdownMenuShortcut>F</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <X aria-hidden="true" />
                Stop session
                <DropdownMenuShortcut>Esc</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Block>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Dialog" code="<Dialog> · e3 · scrim">
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Stop dialog (small)</Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop keeping this screen awake?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The session ends now. Your screen goes back to its usual sleep timer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="px-3.5">Keep awake</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" className="px-3.5">
                    Stop session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Tool dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear history</DialogTitle>
                  <DialogDescription className="sr-only">Type CLEAR to delete every saved session.</DialogDescription>
                </DialogHeader>
                <TypedConfirm onConfirm={noop} onCancel={noop} />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Welcome dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Welcome</DialogTitle>
                  <DialogDescription className="sr-only">First visit</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-3 text-center">
                  <Scene scene="welcome" width={300} />
                  <strong className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.025em]">
                    Keep this screen awake.
                  </strong>
                  <span className="max-w-[380px] text-[15px] leading-[1.55] text-muted-foreground-strong">
                    One button, right here in the browser. No install and no account — your settings stay on this
                    device.
                  </span>
                  <Button size="xl" className="px-[30px] font-bold">
                    <Play aria-hidden="true" />
                    Keep awake for 1 hour
                  </Button>
                  <SectionLink>Choose another length</SectionLink>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Block>
        <Block title="Sheet · phone" code='side="bottom"'>
          <div className="flex flex-wrap gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Bottom sheet</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[46dvh]" closeLabel="Close Extend session">
                <SheetHeader>
                  <SheetTitle>Extend session</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-4 gap-2">
                  {['+5 min', '+15 min', '+30 min', '+1 hour'].map((label) => (
                    <Chip key={label} shape="tile" pressed={label === '+15 min'}>
                      {label}
                    </Chip>
                  ))}
                </div>
                <Button className="h-13 w-full rounded-md text-[15px]">Extend to 12:12 PM</Button>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Right sheet</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <SwitchRow label="12-hour clock" description="Shows 11:42 AM instead of 11:42" defaultChecked />
              </SheetContent>
            </Sheet>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Presets</DrawerTitle>
                </DrawerHeader>
                <PresetGroup variant="list" value="presenting" onValueChange={noop} onCreate={noop} />
              </DrawerContent>
            </Drawer>
          </div>
        </Block>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Card · Progress" code="<Card> <Progress value>">
          <Card variant="inset">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-accent text-lamp">
                <Presentation className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <CardTitle className="text-[15px]">Presenting to the board</CardTitle>
                <CardDescription>Started 10:42 AM · ends 11:42 AM</CardDescription>
              </span>
            </div>
            <Progress value={37} aria-label="Session elapsed" />
            <div className="flex justify-between font-mono text-[12px] text-muted-foreground-strong">
              <span>22 min elapsed</span>
              <span>38 min left</span>
            </div>
          </Card>
        </Block>
        <Block title="Skeleton · Sonner" code="<Skeleton> toast()">
          <div className="flex items-center gap-2.5" aria-busy="true" aria-label="Loading devices">
            <Skeleton className="size-10 rounded-[12px]" />
            <span className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-[70%]" />
              <Skeleton className="h-3 w-[45%]" />
            </span>
          </div>
          <ProductToast
            toastId="static-extended"
            tone="success"
            title="Awake until 11:42 AM"
            description="Extended by 30 minutes."
            actionLabel="Undo"
            onAction={noop}
            duration={Infinity}
          />
        </Block>
      </div>
    </>
  );
}

function ProductBoard() {
  const [preset, setPreset] = React.useState('presenting');
  const [face, setFace] = React.useState('bold');
  const BANNERS: TBannerKind[] = ['offline', 'conflict', 'update', 'needsyou', 'blocked'];
  return (
    <>
      <Block title="Status pill" code="<StatusPill state> · 9 states">
        <div className="grid grid-cols-1 gap-x-3.5 gap-y-3 sm:grid-cols-2">
          {PILLS.map(({ state, time }) => (
            <div key={state} className="flex flex-col items-start gap-1.5">
              <span className="font-mono text-[12px] font-medium text-muted-foreground-strong">{state}</span>
              <StatusPill state={state} time={time} />
            </div>
          ))}
        </div>
      </Block>
      <Block title="Countdown ring · Extend bar" code="<Countdown> <ExtendBar>">
        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[170px_1fr]">
          <Countdown remain={2292} total={3600} endsAt="11:42 AM" />
          <div className="flex flex-col gap-3">
            <ExtendBar onExtend={noop} onUntil={noop} onPause={noop} onStop={noop} />
            <Help>
              Ring = time left, starting at 12 o’clock. The knob marks now. At 5 minutes left the ring turns amber and a
              toast offers +15 min.
            </Help>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 border-t border-dashed pt-3">
          <Countdown remain={280} total={3600} endsAt="11:42 AM" />
          <Countdown remain={2292} variant="digits" endsAt="11:42 AM" caption={endsLine(2292, Date.now())} />
        </div>
      </Block>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Preset group">
          <PresetGroup value={preset} onValueChange={setPreset} onCreate={noop} />
        </Block>
        <Block title="Face switcher">
          <FaceSwitcher
            faces={FACES}
            value={face}
            onValueChange={setFace}
            check
            renderThumb={(id) => (
              <span className="flex h-[78px] items-center font-mono text-[15px] font-bold text-foreground">{id}</span>
            )}
          />
        </Block>
      </div>
      <FixPanel
        layout="card"
        eyebrow="FIX PANEL · BLOCKED"
        onUseFallback={noop}
        onCheckAgain={noop}
        guideHref="/learn/battery"
      />
      <Block title="Alert" code="<Alert variant> · inline, never auto-dismissed">
        <StatusAlert variant="info" title="Keep this tab visible">
          Browsers release the wake lock when a tab is hidden. AwakeTab picks it up again when you come back.
        </StatusAlert>
        <StatusAlert variant="success" title="Wake lock active">
          Your screen stays on until 11:42 AM.
        </StatusAlert>
        <StatusAlert variant="paused" title="Paused — tab hidden" action={{ label: 'Resume now', onClick: noop }}>
          Resumes automatically when you return to this tab.
        </StatusAlert>
        <StatusAlert variant="refused" title="Wake lock refused" action={{ label: 'Try fallback', onClick: noop }}>
          This browser declined the request. The video fallback usually works here.
        </StatusAlert>
      </Block>
      <Block title="Banners" code="<Banner kind>">
        {BANNERS.map((kind) => (
          <Banner key={kind} kind={kind} onAction={noop} />
        ))}
      </Block>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Toasts · stacked">
          <div className="flex flex-col gap-2">
            <ProductToast
              toastId="s1"
              tone="success"
              title="Awake until 11:42 AM"
              description="Extended by 30 minutes."
              actionLabel="Undo"
              onAction={noop}
              duration={Infinity}
            />
            <ProductToast
              toastId="s2"
              tone="warning"
              title="5 minutes left"
              description="Ends at 11:42 AM."
              actionLabel="+15 min"
              onAction={noop}
              duration={Infinity}
            />
            <ProductToast
              toastId="s3"
              tone="error"
              title="Couldn’t sync"
              description="You are offline. Changes stay on this device."
              actionLabel="Retry"
              onAction={noop}
              duration={Infinity}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showExtendedToast({ until: '11:42 AM', minutes: 30, onUndo: noop })}
            >
              Extended
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showLowTimeToast({ endsAt: '11:42 AM', onExtend: noop })}
            >
              5 minutes left
            </Button>
            <Button variant="secondary" size="sm" onClick={() => showSyncFailedToast({ onRetry: noop })}>
              Couldn’t sync
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showEndedToast({ endedAt: '11:42 AM', onStartAgain: noop })}
            >
              Time’s up
            </Button>
          </div>
          <Help>
            Bottom-centre on phone, bottom-right on desktop. 6 s, paused on hover and focus; errors stay until
            dismissed.
          </Help>
        </Block>
        <Block title="Typed confirmation">
          <div className="rounded-lg bg-raised p-[18px] shadow-e3">
            <TypedConfirm
              size="compact"
              description="Deletes every saved session and preset on this device. This can’t be undone."
              onConfirm={noop}
              onCancel={noop}
            />
          </div>
        </Block>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title="Empty state">
          <PresetGroup presets={[]} onCreate={noop} />
          <div className="border-t border-dashed pt-3">
            <PresetGroup presets={[]} variant="list" onCreate={noop} />
          </div>
        </Block>
        <Block title="Devices · presence">
          <DevicePresence devices={DEVICES} />
          <div className="flex flex-col gap-2 border-t border-dashed pt-2.5">
            <span className="font-mono text-[12px] font-medium text-muted-foreground-strong">LOADING</span>
            <DevicePresenceSkeleton />
          </div>
          <div className="flex flex-wrap items-center gap-[22px] border-t border-dashed pt-3">
            <PresenceMarker kind="awake">Awake here</PresenceMarker>
            <PresenceMarker kind="device">Kitchen iPad</PresenceMarker>
            <PresenceMarker kind="paused">Paused here</PresenceMarker>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-dashed pt-3 sm:grid-cols-4">
            {IDENTITIES.map((id) => (
              <span key={id} className="flex items-center gap-2.5">
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-md text-[16px] font-bold shadow-[inset_0_0_0_1px_rgba(11,16,32,.15)] ${IDENTITY_CLASSES[id]}`}
                >
                  {id.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[14px] font-semibold capitalize">{id}</span>
              </span>
            ))}
          </div>
        </Block>
      </div>
      <Block title="Repeated pieces" code="SectionHeader · PanelHeader · ListRow · SwitchRow · Chip">
        <PanelHeader title="Faces" onClose={noop} />
        <SectionHeader label="Face" action={<SectionLink>All 33 faces</SectionLink>} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {['15 min', '30 min', '1 hour', '2 hours', 'Until…', '∞'].map((label) => (
            <Chip key={label} shape="tile" pressed={label === '1 hour'}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-col">
          <ListRowButton
            icon={LayoutGrid}
            title="Face studio"
            trailing={
              <Badge variant="pro" size="sm">
                Pro
              </Badge>
            }
          />
          <ListRowButton icon={Puzzle} title="Get the extension" />
          <ListRowButton icon={Trash2} title="Export my data" meta="Settings, presets and history as a file" />
        </div>
        <Button variant="outline" className="self-start border-destructive text-[15px] text-destructive">
          <Trash2 aria-hidden="true" />
          Clear history…
        </Button>
      </Block>
    </>
  );
}

function PaletteBoard() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const idle: ICommandGroup[] = [
    {
      heading: 'Recent',
      items: [
        {
          id: 'r1',
          label: 'Keep awake for 1 hour',
          icon: Play,
          keys: ['1'],
          sub: 'Last used today at 9:58 AM',
          onSelect: noop,
        },
        { id: 'r2', label: 'Presenting preset', icon: Presentation, sub: '1 hour · Bold face', onSelect: noop },
        { id: 'r3', label: 'Switch face: Flip', icon: LayoutGrid, onSelect: noop },
      ],
    },
    {
      heading: 'Suggested',
      items: [
        { id: 's1', label: 'Keep awake until…', icon: AlarmClock, keys: ['U'], onSelect: noop },
        { id: 's2', label: 'Fullscreen', icon: Maximize, keys: ['F'], onSelect: noop },
        { id: 's3', label: 'Toggle theme', icon: Contrast, keys: ['⇧', 'D'], onSelect: noop },
      ],
    },
  ];
  const groups: ICommandGroup[] = [
    {
      heading: 'Session',
      items: [
        {
          id: 'e15',
          label: 'Extend 15 minutes',
          icon: Plus,
          keys: ['+'],
          sub: 'Ends 11:57 AM instead of 11:42 AM',
          onSelect: noop,
        },
        { id: 'e30', label: 'Extend 30 minutes', icon: Plus, onSelect: noop },
        { id: 'e60', label: 'Extend 1 hour', icon: Plus, keys: ['⇧', '+'], onSelect: noop },
      ],
    },
    {
      heading: 'Settings',
      items: [{ id: 'txt', label: 'Text size on the clock', icon: Info, sub: 'Display', onSelect: noop }],
    },
    {
      heading: 'Fix',
      items: [
        {
          id: 'bat',
          label: 'Check battery saver',
          icon: BatteryWarning,
          sub: 'Runs the fix panel check',
          onSelect: noop,
        },
      ],
    },
    {
      heading: 'Get the app',
      items: [
        {
          id: 'ext',
          label: 'Install the browser extension',
          icon: Puzzle,
          sub: 'Chrome · Edge · Firefox',
          onSelect: noop,
        },
      ],
    },
  ];
  const openWith = (q: string, isLoading = false) => {
    setQuery(q);
    setLoading(isLoading);
    setOpen(true);
  };
  return (
    <Block title="⌘K command palette" code="<CommandPalette>">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => openWith('')}>
          1 · Open · recent and suggested
        </Button>
        <Button variant="outline" onClick={() => openWith('ext')}>
          2 · Typing “ext”
        </Button>
        <Button variant="outline" onClick={() => openWith('battery', true)}>
          3 · Loading “battery”
        </Button>
        <Button variant="outline" onClick={() => openWith('zzz')}>
          4 · No match “zzz”
        </Button>
      </div>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        idleGroups={idle}
        groups={groups}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setLoading(false);
        }}
        loading={loading}
        onSearchGuides={noop}
      />
    </Block>
  );
}

function ScenesBoard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {SCENE_NAMES.map(([key, title, description]) => (
          <figure key={key} className="m-0 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-[#D9D9E5]">
              <div className="flex items-center justify-center bg-[#FFFFFF] py-2">
                <Scene scene={key} theme="light" width={166} />
              </div>
              <div className="flex items-center justify-center bg-[#0E1424] py-2">
                <Scene scene={key} theme="dark" width={166} />
              </div>
            </div>
            <figcaption className="flex flex-col gap-0.5">
              <strong className="text-[16px]">{title}</strong>
              <span className="text-[14px] leading-[1.45] text-muted-foreground-strong">{description}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex items-center gap-6 rounded-xl border bg-card p-7">
          <Scene scene="hero" width={360} float className="max-w-full" />
          <span className="flex flex-col gap-2 text-[16px] leading-[1.55]">
            <strong className="text-[20px]">Hero placement · page theme</strong>
            Only hero and empty-state scenes float. Never inside the awake screen.
          </span>
        </div>
        <div className="flex items-center gap-6 rounded-xl bg-[#070B16] p-7 text-[#EEF2FA]">
          <Scene scene="nightdesk" theme="dark" width={360} float className="max-w-full" />
          <span className="flex flex-col gap-2 text-[16px] leading-[1.55]">
            <strong className="text-[20px]">Hero placement · dark</strong>
            In dark theme, outlines stay near-black and fills stay bright, so scenes read as lit objects on the night
            stage.
          </span>
        </div>
      </div>
      <Help>{Object.keys(SCENES).length} scenes.</Help>
    </>
  );
}

function BrandBoard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_2fr_1fr]">
        <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-[#D9D9E5] bg-[#FFFFFF]">
          <Mark size={80} tone="light" lockup="horizontal" />
        </div>
        <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-[#D9D9E5] bg-[#FFFFFF]">
          <Mark size={84} tone="light" lockup="stacked" />
        </div>
        <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-[#070B16]">
          <Mark size={80} tone="dark" lockup="horizontal" />
        </div>
        <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-[#070B16]">
          <Mark size={84} tone="dark" lockup="stacked" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex h-[200px] items-center justify-center rounded-[24px] border border-[#D9D9E5] bg-[#FFFFFF]">
          <Mark size={64} tone="mono-ink" lockup="horizontal" />
        </div>
        <div className="flex h-[200px] items-center justify-center rounded-[24px] bg-[#0B1020]">
          <Mark size={64} tone="mono-white" lockup="horizontal" />
        </div>
        <div className="flex h-[200px] items-center justify-center rounded-[24px] bg-[#9F7BFF]">
          <Mark size={64} tone="brand" lockup="horizontal" />
        </div>
        <div className="flex h-[200px] items-center justify-center rounded-[24px] bg-[#3DF58E]">
          <Mark size={64} tone="brand" lockup="horizontal" />
        </div>
      </div>
      <Block title="Mark · sizes, lamp states and the theme-following tone">
        <div className="flex flex-wrap items-end gap-7">
          <Mark size={16} tone="auto" small />
          <Mark size={24} tone="auto" />
          <Mark size={32} tone="auto" />
          <Mark size={48} tone="auto" lockup="horizontal" />
          {(['awake', 'paused', 'blocked', 'ended', 'info', 'off'] as const).map((lamp) => (
            <Mark key={lamp} size={48} tone="auto" lampState={lamp} label={`AwakeTab · ${lamp}`} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 border-t border-dashed pt-3">
          {APP_STATES.map((state) => (
            <span key={state} className="flex flex-col items-start gap-1">
              <AppMark state={state} />
              <span className="font-mono text-[12px] text-muted-foreground-strong">{state}</span>
            </span>
          ))}
          <AppMark state="running" size={28} wordSize={19} />
        </div>
      </Block>
    </>
  );
}

function FormatBoard() {
  const now = new Date(2026, 9, 29, 11, 4, 0);
  const late = new Date(2026, 9, 29, 23, 40, 0);
  return (
    <Block title="lib/format" code="formatTime · formatDuration · endsLine · formatFullDate">
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-[13px]">
        <li>formatTime → {formatTime(now)}</li>
        <li>formatTime 24 → {formatTime(late, 'en', 24)}</li>
        <li>formatTime de → {formatTime(now, 'de')}</li>
        <li>formatTime ja → {formatTime(now, 'ja', 12)}</li>
        <li>formatDuration(2292) → {formatDuration(2292)}</li>
        <li>formatDuration(3900) → {formatDuration(3900)}</li>
        <li>endsLine(2292, now) → {endsLine(2292, now)}</li>
        <li>endsLine(2292, 11:40 PM) → {endsLine(2292, late)}</li>
        <li>formatFullDate → {formatFullDate(new Date(2026, 9, 31))}</li>
        <li>formatFullDate de → {formatFullDate(new Date(2026, 9, 29), 'de')}</li>
        <li>formatFullDateTime → {formatFullDateTime(now)}</li>
      </ul>
    </Block>
  );
}

export function ComponentGallery() {
  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-10 sm:px-[72px] sm:py-[72px]">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[14px] tracking-[.12em] text-lamp">DEV · COMPONENT GALLERY</span>
          <h1 className="m-0 text-[56px] leading-[1.05] font-extrabold tracking-[-0.035em]">Components</h1>
        </div>
        <ThemeBar />
      </header>
      <Board id="primitives" title="Primitives">
        <ButtonsBlock />
        <InputsBlock />
        <SelectSwitchBlock />
        <SliderTabsBlock />
        <BadgeBlock />
        <OverlayBlock />
      </Board>
      <Board id="product" title="Product components">
        <ProductBoard />
      </Board>
      <Board id="palette" title="Command palette">
        <PaletteBoard />
      </Board>
      <Board id="scenes" title="Illustration scenes">
        <ScenesBoard />
      </Board>
      <Board id="brand" title="Logo and lockups">
        <BrandBoard />
      </Board>
      <Board id="format" title="Time and date">
        <FormatBoard />
      </Board>
    </main>
  );
}
