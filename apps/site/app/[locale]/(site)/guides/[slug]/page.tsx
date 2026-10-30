import type { Metadata } from 'next';
import { ArticlePage, articleMetadata } from '@/components/site/article/article-page';
import { staticArticleParams } from '@/lib/content';
import { localeParam } from '@/lib/seo';

type TParams = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return staticArticleParams('guides').map(({ locale, slug }) => ({ locale, slug: slug }));
}

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  return articleMetadata('guides', locale, slug);
}

export default async function Page({ params }: { params: TParams }) {
  const { slug } = await params;
  const locale = await localeParam(params);
  return <ArticlePage kind="guides" locale={locale} slug={slug} />;
}
