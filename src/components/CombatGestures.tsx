
import { StyleSheet, Text, View } from 'react-native';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

type Move = 'Thrust' | 'Sweep' | 'Block';

type CombatGesturesProps = {
  onMove: (move: Move) => void;
};

export default function CombatGestures({
  onMove,
}: CombatGesturesProps) {
  const swipeLeft = Gesture.Pan()
    .activeOffsetX(-35)
    .failOffsetY([-70, 70])
    .onEnd((event) => {
      if (event.translationX < -60) {
        onMove('Thrust');
      }
    })
    .runOnJS(true);

  const swipeRight = Gesture.Pan()
    .activeOffsetX(35)
    .failOffsetY([-70, 70])
    .onEnd((event) => {
      if (event.translationX > 60) {
        onMove('Sweep');
      }
    })
    .runOnJS(true);

  const hold = Gesture.LongPress()
    .minDuration(600)
    .onStart(() => {
      onMove('Block');
    })
    .runOnJS(true);

  const combinedGesture = Gesture.Race(
    swipeLeft,
    swipeRight,
    hold
  );

  return (
    <GestureDetector gesture={combinedGesture}>
      <View style={styles.gestureArea}>
        <Text style={styles.title}>
          ⚔️ COMBAT GESTURES
        </Text>

        <Text style={styles.instructions}>
          ⬅️ Swipe Left = THRUST
        </Text>

        <Text style={styles.instructions}>
          ➡️ Swipe Right = SWEEP
        </Text>

        <Text style={styles.instructions}>
          ✋ Hold = BLOCK
        </Text>

        <Text style={styles.hint}>
          Perform your gesture anywhere inside this box.
        </Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  gestureArea: {
    backgroundColor: '#252131',
    borderWidth: 2,
    borderColor: '#E8BE65',
    borderRadius: 18,
    padding: 24,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  title: {
    color: '#E8BE65',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  instructions: {
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 10,
  },
  hint: {
    color: '#B7B0C4',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
