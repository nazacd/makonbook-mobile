import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { resolvePlacementImage } from '@/data/assetMap';
import type { Question } from '@/lib/types';

import { ImageViewerModal } from './ImageViewerModal';
import { MathText } from './MathText';

export function QuestionCard({ question }: { question: Question }) {
  const image = resolvePlacementImage(question.content.image);
  const [showImage, setShowImage] = useState(false);

  return (
    <View className="gap-4">
      <MathText text={question.question} className="text-lg font-semibold text-white" fontSize={18} />
      {question.content.text ? (
        <View className="rounded-xl bg-surface p-4">
          <MathText text={question.content.text} className="text-base text-white" fontSize={16} />
        </View>
      ) : null}
      {image ? (
        <>
          <Pressable
            onPress={() => setShowImage(true)}
            className="overflow-hidden rounded-xl bg-surface"
            style={{ width: '100%', aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </Pressable>
          <ImageViewerModal visible={showImage} source={image} onClose={() => setShowImage(false)} />
        </>
      ) : null}
    </View>
  );
}
