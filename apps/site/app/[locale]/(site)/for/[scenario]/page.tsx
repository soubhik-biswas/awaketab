import type { Metadata } from 'next';
import { ArticlePage, articleMetadata } from '@/components/site/article/article-page';
import { staticArticleParams } from '@/lib/content';
import { localeParam } from '@/lib/seo';

type TParams = Promise<{ locale: string; scenario: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return staticArticleParams('for').map(({ locale, slug }) => ({ locale, scenario: slug }));
}

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { locale, scenario } = await params;
  return articleMetadata('for', locale, scenario);
}

export default async function Page({ params }: { params: TParams }) {
  const { scenario } = await params;
  const locale = await localeParam(params);
  return <ArticlePage kind="for" locale={locale} slug={scenario} />;
}
