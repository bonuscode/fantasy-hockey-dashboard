export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Team Dashboard
      </h1>
      <div className="bg-surface border border-border rounded-lg p-6">
        <p className="text-text-secondary">
          Team {teamId} details will appear here once connected to the Yahoo
          Fantasy API.
        </p>
      </div>
    </div>
  );
}
