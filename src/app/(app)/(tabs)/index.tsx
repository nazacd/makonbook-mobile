import { StudentClasses } from '@/components/StudentClasses';
import { TeacherToday } from '@/components/TeacherToday';
import { useMe } from '@/lib/api/queries';

// "/" — students see their classes, teachers their lessons for the day.
export default function HomeTab() {
  const kind = useMe().data?.kind;
  return kind === 'teacher' ? <TeacherToday /> : <StudentClasses />;
}
