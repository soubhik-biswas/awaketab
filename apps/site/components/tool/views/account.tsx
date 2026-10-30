'use client';

import Link from 'next/link';
import {
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Laptop,
  LogOut,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pro } from '@/lib/tool/pro';
import { useTool } from '@/components/tool/context';
import { BTN_DANGER_OUT, BTN_FULL, H3, HELP, PRO_CHIP, ROW_BTN, TILE } from '@/components/tool/kit';

const PLAN = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Pay once' } as const;

async function exportData() {
  const blob = await pro.exportData();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'awaketab-data.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function AccountView() {
  const { pro: data, a } = useTool();
  const acct = data.account;
  const rows: Array<{ n: string; d: string; icon: LucideIcon; go: () => void }> = [
    { n: 'Devices', d: `${data.devices.length} of ${data.maxDevices} in use`, icon: Laptop, go: () => a.go('devices') },
    { n: 'Export my data', d: 'Settings, presets and history as a file', icon: Download, go: () => void exportData() },
    { n: 'Sign out', d: 'This device keeps working offline', icon: LogOut, go: () => void pro.signOut() },
  ];
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-lamp bg-accent text-lamp"
        >
          <User className="size-[22px]" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <strong className="text-[16px]">{acct?.name ?? 'Not signed in'}</strong>
          <span className={HELP}>
            {acct ? `${acct.email} · signed in with a magic link` : 'Sign in to sync your devices.'}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 rounded-[16px] border border-border bg-secondary p-4">
        <span className="flex items-center justify-between gap-2">
          <strong className={H3}>AwakeTab Pro</strong>
          {acct ? <span className={PRO_CHIP}>{PLAN[acct.plan]}</span> : null}
        </span>
        <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
          {acct?.plan === 'lifetime'
            ? 'Paid once. Pro never renews and stays on.'
            : `Renews on ${acct?.renewsOn || '[DATE]'}. Cancel any time — you keep Pro until the end of the period.`}
        </span>
        <Button asChild variant="outline" className={BTN_FULL}>
          <Link href={pro.billingUrl()}>
            <CreditCard className="size-4" strokeWidth={2} aria-hidden="true" />
            Manage billing
            <ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="flex flex-col">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <button key={r.n} type="button" className={ROW_BTN} onClick={r.go}>
              <span className={TILE}>
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-px">
                <span className="text-[15px] font-semibold">{r.n}</span>
                <span className={HELP}>{r.d}</span>
              </span>
              <ChevronRight
                className="size-[18px] shrink-0 text-muted-foreground-strong"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
      <Button type="button" variant="outline" className={BTN_DANGER_OUT} onClick={() => void pro.deleteAccount()}>
        <Trash2 strokeWidth={2} aria-hidden="true" />
        Delete account…
      </Button>
      <span className={HELP}>
        Billing is handled by Polar. Without an account, AwakeTab still works — settings simply stay on this device.
      </span>
    </>
  );
}
