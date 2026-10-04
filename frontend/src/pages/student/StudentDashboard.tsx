export const StudentDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Student Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your attendance records and upcoming classes.</p>
      </div>
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <p className="text-muted-foreground">Welcome to your dashboard. Your attendance records and courses will appear here.</p>
      </div>
    </div>
  );
};
