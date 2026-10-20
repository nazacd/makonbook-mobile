import { StudentPractice } from '@/components/practice/StudentPractice';
import { TeacherPractice } from '@/components/practice/TeacherPractice';
import { useMe } from '@/lib/api/queries';

// Practice tests: students take them, teachers follow their groups' results.
export default function PracticeTab() {
  const kind = useMe().data?.kind;
  return kind === 'teacher' ? <TeacherPractice /> : <StudentPractice />;
}
