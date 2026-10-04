import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, Plus, Calendar } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

export const StudentLeaves = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchLeaves = async () => {
    try {
      const response = await apiClient.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await apiClient.post('/leaves', data);
      setIsModalOpen(false);
      reset();
      fetchLeaves();
    } catch (error) {
      console.error('Failed to submit leave request', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="inline-flex items-center bg-green-100/50 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-green-200">Approved</span>;
      case 'REJECTED': return <span className="inline-flex items-center bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-destructive/20">Rejected</span>;
      case 'PENDING':
      default: return <span className="inline-flex items-center bg-yellow-100/50 text-yellow-700 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-yellow-200">Pending</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Leave Requests</h1>
          <p className="mt-1 text-muted-foreground">Apply for leaves and track their approval status.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaves.map((leave) => (
          <div key={leave.id} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold font-display text-foreground">{leave.reason}</h3>
                {getStatusBadge(leave.status)}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground bg-zinc-50/50 p-3 rounded-xl border border-border">
                  <Calendar className="w-4 h-4 mr-3 text-zinc-400" />
                  <span className="font-medium text-foreground">{new Date(leave.startDate).toLocaleDateString()}</span>
                  <span className="mx-2 text-zinc-300">→</span>
                  <span className="font-medium text-foreground">{new Date(leave.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              {leave.comments && (
                <div className="mt-6 p-4 bg-zinc-50/80 rounded-xl text-sm text-muted-foreground border border-border/50">
                  <span className="font-semibold text-foreground block mb-1 uppercase tracking-wide text-xs">Remarks</span>
                  {leave.comments}
                </div>
              )}
            </div>
          </div>
        ))}

        {leaves.length === 0 && (
          <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-border border-dashed">
            <Calendar className="mx-auto h-12 w-12 text-zinc-300" />
            <h3 className="mt-4 text-sm font-semibold text-foreground tracking-wide uppercase">No leaves applied</h3>
            <p className="mt-1 text-sm text-muted-foreground">You haven't submitted any leave requests yet.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
              <input type="date" {...register('startDate')} required className="block w-full rounded-xl border-border bg-transparent shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2.5 transition-all outline-none text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
              <input type="date" {...register('endDate')} required className="block w-full rounded-xl border-border bg-transparent shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2.5 transition-all outline-none text-foreground" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Reason for Leave</label>
            <input type="text" {...register('reason')} required placeholder="e.g. Sick Leave, Medical Emergency" className="block w-full rounded-xl border-border bg-transparent shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2.5 transition-all outline-none placeholder:text-muted-foreground text-foreground" />
          </div>
          <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button type="submit" className="inline-flex w-full justify-center rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:col-start-2 transition-all">
              Submit Request
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-xl bg-card px-3 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-zinc-50 sm:col-start-1 sm:mt-0 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
