import type { Metadata } from 'next';
import { ArticlePage, articleMetadata } from '@/components/site/article/article-page';
import { staticArticleParams } from '@/lib/content';
import { localeParam } from '@/lib/seo';

type TParams = Promise<{ locale: string; tool: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return staticArticleParams('vs').map(({ locale, slug }) => ({ locale, tool: slug }));
}

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { locale, tool } = await params;
  return articleMetadata('vs', locale, tool);
}

export default async function Page({ params }: { params: TParams }) {
  const { tool } = await params;
  const locale = await localeParam(params);
  return <ArticlePage kind="vs" locale={locale} slug={tool} />;
}
