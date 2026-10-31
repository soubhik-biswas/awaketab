import { CONTACT_EMAIL, MailLayout } from './layout';

export const RECEIPT_SUBJECT = 'Receipt · AwakeTab Pro';

export interface IReceiptEmailProps {
  plan: 'pro_yearly' | 'pro_lifetime';
  amount: string;
  date: string;
  renews: string | null;
  manageUrl: string;
}

export default function ReceiptEmail({ plan, amount, date, renews, manageUrl }: IReceiptEmailProps) {
  const yearly = plan === 'pro_yearly';
  return (
    <MailLayout
      preview="Pro is on. Here is your receipt."
      heading="Thanks — Pro is on."
      body="Your other devices, history, sound and Face studio are ready. Keeping a screen awake was free before and stays free."
      rows={[
        ['Plan', yearly ? 'AwakeTab Pro · yearly' : 'AwakeTab Pro · pay once'],
        ['Amount', amount],
        ['Date', date],
        ['Paid with', 'Polar'],
      ]}
      action={{ label: 'Manage billing', url: manageUrl }}
      fallback={
        yearly && renews
          ? `Renews on ${renews}. Cancel any time from Settings → Account; Pro stays on until the end of the period. Billing link:`
          : 'A one-time purchase: it never renews. Billing link:'
      }
      note={`Need an invoice with your company details? Reply to ${CONTACT_EMAIL} with the name and address to show.`}
      why="You got this because you bought AwakeTab Pro."
    />
  );
}

ReceiptEmail.PreviewProps = {
  plan: 'pro_yearly',
  amount: '$12.00',
  date: 'Friday, 30 October 2026',
  renews: 'Saturday, 30 October 2027',
  manageUrl: 'https://polar.sh/awaketab/portal',
} satisfies IReceiptEmailProps;
