// Bootstrap placeholder. Routing, the query client and the API layer land in
// the "app shell" step; the feature pages follow one at a time after that.
export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 px-6">
      <h1 className="text-2xl font-semibold">ACME · Salary Management</h1>
      <p className="text-muted-foreground">
        Internal tool for the HR manager. Frontend scaffolding is in place; pages are built next.
      </p>
    </main>
  );
}
