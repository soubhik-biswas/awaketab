import { notFound } from 'next/navigation';

// Any address no route claims ends on the not-found page, inside the site's header and footer.
export default function CatchAll() {
  notFound();
}
