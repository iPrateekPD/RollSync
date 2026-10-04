export const TeacherDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Teacher Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your upcoming classes and recent activity.</p>
      </div>
      
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <p className="text-muted-foreground">Welcome to your dashboard. Upcoming classes and attendance summaries will appear here.</p>
      </div>
    </div>
  );
};
