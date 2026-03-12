import { loadPage } from "@/lib/store";
import { STARTER_HTML } from "@/lib/starter-template";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import PageRenderer from "@/app/components/page-renderer";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function VibePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view } = await searchParams;

  if (id === "new") {
    const newId = nanoid(10);
    redirect(`/p/${newId}`);
  }

  const page = await loadPage(id);

  const html = page?.html || STARTER_HTML;
  const messages = page?.messages || [];
  const isViewOnly = view === "true";

  return (
    <PageRenderer
      pageId={id}
      initialHtml={html}
      initialMessages={messages}
      isViewOnly={isViewOnly}
    />
  );
}
