import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/states';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description="That page doesn’t exist." />
      <Button asChild variant="outline" size="sm">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </>
  );
}
