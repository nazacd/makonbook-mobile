import { StudentWords } from '@/components/vocab/StudentWords';
import { TeacherWords } from '@/components/vocab/TeacherWords';
import { useMe } from '@/lib/api/queries';

// Vocabulary: students study words, teachers follow their groups' progress.
export default function WordsTab() {
  const kind = useMe().data?.kind;
  return kind === 'teacher' ? <TeacherWords /> : <StudentWords />;
}
