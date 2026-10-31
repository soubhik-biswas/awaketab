import { MailLayout } from './layout';

export const SIGNIN_SUBJECT = 'Your AwakeTab sign-in link';

export interface ISignInEmailProps {
  url: string;
  minutes: number;
}

export default function SignInEmail({ url, minutes }: ISignInEmailProps) {
  return (
    <MailLayout
      preview={`Works once, for ${String(minutes)} minutes.`}
      heading="Sign in to AwakeTab"
      body="Someone — hopefully you — asked to sign in with this address. Open the link on the device where you asked for it."
      action={{ label: 'Sign in to AwakeTab', url }}
      fallback="Button not working? Paste this into your browser:"
      note="Didn’t ask for this? Ignore it — nothing changes, and the link expires on its own."
      why="You got this because a sign-in was requested for this address."
    />
  );
}

SignInEmail.PreviewProps = { url: 'https://awaketab.com/auth/preview-token', minutes: 15 } satisfies ISignInEmailProps;
