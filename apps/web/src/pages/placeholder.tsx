import { PageHeader } from '@/components/states';

// Temporary landing for routes whose pages are built in later commits, so the
// shell and navigation are reviewable on their own.
export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Coming up next." />
      <p className="text-sm text-muted-foreground">This page is under construction.</p>
    </>
  );
}
