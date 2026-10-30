import type { Metadata } from 'next';
import { ArticlePage, articleMetadata } from '@/components/site/article/article-page';
import { staticArticleParams } from '@/lib/content';
import { localeParam } from '@/lib/seo';

type TParams = Promise<{ locale: string; device: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return staticArticleParams('on').map(({ locale, slug }) => ({ locale, device: slug }));
}

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { locale, device } = await params;
  return articleMetadata('on', locale, device);
}

export default async function Page({ params }: { params: TParams }) {
  const { device } = await params;
  const locale = await localeParam(params);
  return <ArticlePage kind="on" locale={locale} slug={device} />;
}
