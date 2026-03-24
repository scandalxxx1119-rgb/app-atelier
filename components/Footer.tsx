import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-auto">
      <AdBanner />
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <p>© 2026 App Atelier</p>
        <nav className="flex flex-wrap gap-4 justify-center">
          <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            利用規約
          </Link>
          <Link href="/contact" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            運営者情報・お問い合わせ
          </Link>
          <Link href="/feedback" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            不具合・フィードバック報告
          </Link>
        </nav>
      </div>
    </footer>
  );
}
