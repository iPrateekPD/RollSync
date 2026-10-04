import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

export const TeachersList = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/academic/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await apiClient.post('/academic/teachers', data);
      setIsModalOpen(false);
      reset();
      fetchTeachers();
    } catch (error) {
      console.error('Failed to create teacher', error);
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
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Teachers</h1>
          <p className="mt-1 text-muted-foreground">Manage college faculty and their credentials.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search teachers..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-zinc-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Teacher ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Access Badges</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{teacher.teacherId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{teacher.user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 border border-zinc-200">
                        RFID: {teacher.rfidTag || 'None'}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 border border-zinc-200">
                        BLE: {teacher.bleMacAddress || 'None'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-foreground p-1"><Edit2 className="w-4 h-4" /></button>
                      <button className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No teachers found. Add a teacher to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Teacher">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
              <input {...register('firstName')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
              <input {...register('lastName')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address (Creates Login)</label>
            <input type="email" {...register('email')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input type="password" {...register('password')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Teacher ID (Employee No)</label>
            <input {...register('teacherId')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">RFID Tag</label>
              <input {...register('rfidTag')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">BLE MAC Address</label>
              <input {...register('bleMacAddress')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-foreground ring-1 ring-inset ring-border hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
              Save Teacher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
