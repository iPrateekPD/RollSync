export const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Manage your institution's key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <p className="text-4xl font-display font-semibold text-foreground mt-4 tracking-tight">1,240</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Total Teachers</h3>
          <p className="text-4xl font-display font-semibold text-foreground mt-4 tracking-tight">84</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Active Devices</h3>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-display font-semibold text-foreground tracking-tight">12</p>
            <span className="text-sm text-muted-foreground">/ 15</span>
          </div>
        </div>
      </div>
    </div>
  );
};
