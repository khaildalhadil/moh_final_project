import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <LogoMark className="mx-auto size-14" />
        <p className="mt-6 text-6xl font-bold tracking-tight text-brand-600">404</p>
        <h1 className="mt-3 text-2xl font-bold">{t.common.notFoundTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.common.notFoundText}</p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          {t.common.goHome}
        </Link>
      </div>
    </main>
  );
}
