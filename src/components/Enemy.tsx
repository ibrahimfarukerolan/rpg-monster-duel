
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type EnemyProps = {
  name: string;
  emoji: string;
  strength: number;
  initialStamina: number;
  currentStamina: number;
  onStaminaChange: (value: number) => void;
};

export default function Enemy({
  name,
  emoji,
  strength,
  initialStamina,
  currentStamina,
  onStaminaChange,
}: EnemyProps) {
  const [stamina, setStamina] = useState(currentStamina);

  // Synchronize local state after loading or restarting.
  useEffect(() => {
    setStamina(currentStamina);
  }, [currentStamina]);

  const staminaPercentage =
    (stamina / initialStamina) * 100;

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>

      <Text style={styles.name}>{name}</Text>

      <Text style={styles.stat}>
        Strength: {strength}
      </Text>

      <Text style={styles.stamina}>
        ❤️ Stamina: {stamina}/{initialStamina}
      </Text>

      <View style={styles.healthBar}>
        <View
          style={[
            styles.healthFill,
            { width: `${Math.max(0, staminaPercentage)}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#252131',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#55476B',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 55,
    marginBottom: 10,
  },
  name: {
    color: '#E8BE65',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stat: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  stamina: {
    color: '#7EE0A2',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  healthBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#514557',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 12,
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#7EE0A2',
  },
});
