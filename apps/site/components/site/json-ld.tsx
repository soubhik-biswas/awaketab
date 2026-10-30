import type { TSchemaNode } from '@/lib/seo';

export function JsonLd({ schema }: { schema: TSchemaNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</gu, '\\u003c') }}
    />
  );
}
