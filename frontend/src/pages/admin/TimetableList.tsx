import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Plus, Search, Edit2, Trash2, Loader2, Clock } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

export const TimetableList = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  
  // Need to fetch courses, classrooms, and teachers for the dropdowns
  const [courses, setCourses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [ttRes, cRes, classRes, tRes] = await Promise.all([
        apiClient.get('/academic/timetables'),
        apiClient.get('/academic/courses'),
        apiClient.get('/academic/classrooms'),
        apiClient.get('/academic/teachers')
      ]);
      setTimetables(ttRes.data);
      setCourses(cRes.data);
      setClassrooms(classRes.data);
      setTeachers(tRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await apiClient.post('/academic/timetables', {
        ...data,
        isRecurring: data.isRecurring === 'true' // Handle boolean conversion if needed
      });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Failed to create timetable entry', error);
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
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Timetable</h1>
          <p className="mt-1 text-muted-foreground">Manage class schedules and recurrence.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search schedule..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-zinc-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Day / Time</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Teacher</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Classroom</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {timetables.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{entry.dayOfWeek}</div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(entry.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(entry.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                    {entry.course?.code} - {entry.course?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {entry.teacher?.firstName} {entry.teacher?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {entry.classroom?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-foreground p-1"><Edit2 className="w-4 h-4" /></button>
                      <button className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {timetables.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No timetable schedules found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Schedule Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Course</label>
              <select {...register('courseId')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all">
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Teacher</label>
              <select {...register('teacherId')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Classroom</label>
              <select {...register('classroomId')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all">
                {classrooms.map(cr => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Day of Week</label>
              <select {...register('dayOfWeek')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Time</label>
              <input type="datetime-local" {...register('startTime')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Time</label>
              <input type="datetime-local" {...register('endTime')} className="w-full rounded-lg border-border shadow-sm focus:border-ring focus:ring-ring sm:text-sm border px-3 py-2 bg-transparent transition-all" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isRecurring')} value="true" className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-transparent" />
              <span className="text-sm text-foreground font-medium">Recurring every week</span>
            </label>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-foreground ring-1 ring-inset ring-border hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
