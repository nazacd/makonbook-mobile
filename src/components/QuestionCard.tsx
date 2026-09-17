import { Image, View } from 'react-native';

import { resolvePlacementImage } from '@/data/assetMap';
import type { Question } from '@/lib/types';

import { MathText } from './MathText';

export function QuestionCard({ question }: { question: Question }) {
  const image = resolvePlacementImage(question.content.image);

  return (
    <View className="gap-4">
      <MathText
        text={question.question}
        className="text-lg font-semibold text-black dark:text-white"
        fontSize={18}
      />
      {question.content.text ? (
        <View className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
          <MathText text={question.content.text} className="text-base text-black dark:text-white" fontSize={16} />
        </View>
      ) : null}
      {image ? (
        <Image source={image} className="aspect-[4/3] w-full rounded-xl" resizeMode="contain" />
      ) : null}
    </View>
  );
}
