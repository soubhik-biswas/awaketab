import { render } from '@react-email/render';
import { createElement, type ReactElement } from 'react';
import ReceiptEmail, { RECEIPT_SUBJECT, type IReceiptEmailProps } from './receipt';
import RenewalFailedEmail, { RENEWAL_FAILED_SUBJECT } from './renewal-failed';
import SignInEmail, { SIGNIN_SUBJECT } from './sign-in';

export interface IEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Every email goes out as HTML with a plain-text version alongside.
async function build(to: string, subject: string, element: ReactElement): Promise<IEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { to, subject, html, text };
}

export const SIGNIN_MINUTES = 15;

export function signinEmail(to: string, url: string, minutes = SIGNIN_MINUTES): Promise<IEmail> {
  return build(to, SIGNIN_SUBJECT, createElement(SignInEmail, { url, minutes }));
}

export function receiptEmail(to: string, props: IReceiptEmailProps): Promise<IEmail> {
  return build(to, RECEIPT_SUBJECT, createElement(ReceiptEmail, props));
}

export function renewalFailedEmail(to: string, until: string, updateUrl: string): Promise<IEmail> {
  return build(to, RENEWAL_FAILED_SUBJECT, createElement(RenewalFailedEmail, { until, updateUrl }));
}
