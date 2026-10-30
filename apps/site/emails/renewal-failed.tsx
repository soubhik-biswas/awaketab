import { MailLayout } from './layout';

export const RENEWAL_FAILED_SUBJECT = 'Your Pro renewal didn’t go through';

export interface IRenewalFailedEmailProps {
  until: string;
  updateUrl: string;
}

export default function RenewalFailedEmail({ until, updateUrl }: IRenewalFailedEmailProps) {
  return (
    <MailLayout
      preview={`Pro stays on until ${until}.`}
      heading="We couldn’t renew Pro."
      body={`Polar declined the renewal. Nothing has changed yet — Pro stays on until ${until}. Update the card to keep it.`}
      action={{ label: 'Update payment', url: updateUrl }}
      fallback={`If nothing changes, your account moves to Free on ${until}. Presets and history stay on this device. Payment link:`}
      note="Keeping a screen awake never needs Pro — that part keeps working either way."
      why="You got this because a Pro renewal failed for this address."
    />
  );
}

RenewalFailedEmail.PreviewProps = {
  until: 'Friday, 6 November 2026',
  updateUrl: 'https://polar.sh/awaketab/portal',
} satisfies IRenewalFailedEmailProps;
