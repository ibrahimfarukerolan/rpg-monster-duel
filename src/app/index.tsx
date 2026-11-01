
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AppState,
  AppStateStatus,
  Button,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import CombatGestures from '../components/CombatGestures';
import Enemy from '../components/Enemy';
import { CombatSounds } from '../utils/CombatSounds';

type Move = 'Thrust' | 'Sweep' | 'Block';
type GameResult = 'playing' | 'victory' | 'defeat';
type Phase = 'ready' | 'choosing' | 'monsterTurn' | 'finished';

type Monster = {
  name: string;
  emoji: string;
  strength: number;
  stamina: number;
};

type GameState = {
  monster: Monster;
  enemyStamina: number;
  playerStamina: number;
  round: number;
  phase: Phase;
  result: GameResult;
  message: string;
  pendingMove: Move | null;
};

const STORAGE_KEY = '@rpg_monster_duel_save_v1';

const PLAYER_STRENGTH = 4;
const PLAYER_MAX_STAMINA = 30;

const monsters: Monster[] = [
  { name: 'Orc', emoji: '👹', strength: 4, stamina: 25 },
  { name: 'Goblin', emoji: '👺', strength: 3, stamina: 20 },
  { name: 'Troll', emoji: '🧌', strength: 5, stamina: 35 },
];

const moves: Move[] = ['Thrust', 'Sweep', 'Block'];

function randomMonster(): Monster {
  return monsters[Math.floor(Math.random() * monsters.length)];
}

function randomMove(): Move {
  return moves[Math.floor(Math.random() * moves.length)];
}

function calculateDamage(strength: number) {
  const dice = Math.floor(Math.random() * 6) + 1;
  return Math.floor((dice - 0.5) * strength);
}

function getWinner(player: Move, enemy: Move) {
  if (player === enemy) return 'tie';

  if (
    (player === 'Thrust' && enemy === 'Sweep') ||
    (player === 'Sweep' && enemy === 'Block') ||
    (player === 'Block' && enemy === 'Thrust')
  ) {
    return 'player';
  }

  return 'enemy';
}

function createNewGame(): GameState {
  const monster = randomMonster();

  return {
    monster,
    enemyStamina: monster.stamina,
    playerStamina: PLAYER_MAX_STAMINA,
    round: 1,
    phase: 'ready',
    result: 'playing',
    message: 'Press START ROUND to begin!',
    pendingMove: null,
  };
}

export default function MainScreen() {
  const [game, setGame] = useState<GameState>(createNewGame);
  const [loaded, setLoaded] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== 'background'
  );

  const gameRef = useRef(game);
  const activeRef = useRef(appActive);
  const processingRef = useRef(false);

  const updateGame = (next: GameState) => {
    gameRef.current = next;
    setGame(next);
  };

  // Restore the saved game before enabling combat.
  useEffect(() => {
    let mounted = true;

    const loadGame = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved && mounted) {
          const restored = JSON.parse(saved) as GameState;

          if (
            restored.monster &&
            typeof restored.round === 'number' &&
            typeof restored.enemyStamina === 'number' &&
            typeof restored.playerStamina === 'number'
          ) {
            gameRef.current = restored;
            setGame(restored);
          }
        }
      } catch (error) {
        console.log('Could not load saved game:', error);
      } finally {
        if (mounted) setLoaded(true);
      }
    };

    loadGame();

    return () => {
      mounted = false;
    };
  }, []);

  // Save every game state change.
  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(game)
    ).catch((error) => {
      console.log('Could not save game:', error);
    });
  }, [game, loaded]);

  // Monitor foreground and background transitions.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const isActive = nextState === 'active';

        activeRef.current = isActive;
        setAppActive(isActive);

        if (!isActive) {
          AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(gameRef.current)
          ).catch(console.log);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // Execute the monster's turn only while foregrounded.
  useEffect(() => {
    if (
      !loaded ||
      !appActive ||
      game.phase !== 'monsterTurn' ||
      processingRef.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (!activeRef.current || processingRef.current) {
        return;
      }

      processingRef.current = true;

      const current = gameRef.current;

      if (current.phase !== 'monsterTurn') {
        processingRef.current = false;
        return;
      }

      const playerMove = current.pendingMove;

      if (!playerMove) {
        updateGame({
          ...current,
          phase: 'choosing',
          message: 'Choose your combat gesture!',
        });
        processingRef.current = false;
        return;
      }

      const enemyMove = randomMove();
      const winner = getWinner(playerMove, enemyMove);

      if (winner === 'tie') {
        updateGame({
          ...current,
          phase: 'choosing',
          pendingMove: null,
          message:
            `You: ${playerMove} | Enemy: ${enemyMove}\n` +
            'Tie! Choose another gesture.',
        });

        processingRef.current = false;
        return;
      }

      if (winner === 'player') {
        const damage = calculateDamage(PLAYER_STRENGTH);
        const remaining = Math.max(
          0,
          current.enemyStamina - damage
        );

        const victory = remaining <= 0;

        updateGame({
          ...current,
          enemyStamina: remaining,
          round: victory ? current.round : current.round + 1,
          phase: victory ? 'finished' : 'ready',
          result: victory ? 'victory' : 'playing',
          pendingMove: null,
          message:
            `You: ${playerMove} | Enemy: ${enemyMove}\n` +
            `You dealt ${damage} damage!`,
        });

        if (victory) {
          CombatSounds.victory();
        } else {
          CombatSounds.attack();
        }
      } else {
        const damage = calculateDamage(current.monster.strength);
        const remaining = Math.max(
          0,
          current.playerStamina - damage
        );

        const defeat = remaining <= 0;

        updateGame({
          ...current,
          playerStamina: remaining,
          round: defeat ? current.round : current.round + 1,
          phase: defeat ? 'finished' : 'ready',
          result: defeat ? 'defeat' : 'playing',
          pendingMove: null,
          message:
            `You: ${playerMove} | Enemy: ${enemyMove}\n` +
            `${current.monster.name} dealt ${damage} damage!`,
        });

        if (defeat) {
          CombatSounds.defeat();
        } else {
          CombatSounds.attack();
        }
      }

      processingRef.current = false;
    }, 700);

    return () => clearTimeout(timer);
  }, [game.phase, game.pendingMove, loaded, appActive]);

  const startRound = () => {
    const current = gameRef.current;

    if (!loaded || current.phase !== 'ready') return;

    updateGame({
      ...current,
      phase: 'choosing',
      message: 'Choose your combat gesture!',
    });
  };

  const performMove = (move: Move) => {
    const current = gameRef.current;

    if (
      !loaded ||
      !activeRef.current ||
      current.phase !== 'choosing'
    ) {
      return;
    }

    if (move === 'Block') {
      CombatSounds.block();
    } else {
      CombatSounds.attack();
    }

    updateGame({
      ...current,
      phase: 'monsterTurn',
      pendingMove: move,
      message:
        `You selected ${move}.\n` +
        `${current.monster.name} is preparing a move...`,
    });
  };

  const restartGame = () => {
    if (!loaded) return;
    updateGame(createNewGame());
  };

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading saved battle...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle="light-content" />

        <Text style={styles.title}>
          ⚔️ RPG MONSTER DUEL ⚔️
        </Text>

        <Text style={styles.subtitle}>
          Defeat the monster and survive the arena!
        </Text>

        <View style={styles.arena}>
          <View style={styles.characterCard}>
            <Text style={styles.characterEmoji}>🧙</Text>
            <Text style={styles.characterName}>Your Hero</Text>

            <Text style={styles.statText}>
              Strength: {PLAYER_STRENGTH}
            </Text>

            <Text style={styles.staminaText}>
              ❤️ Stamina: {game.playerStamina}/{PLAYER_MAX_STAMINA}
            </Text>

            <View style={styles.healthBar}>
              <View
                style={[
                  styles.healthFill,
                  {
                    width:
                      `${(game.playerStamina /
                        PLAYER_MAX_STAMINA) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <Enemy
            name={game.monster.name}
            emoji={game.monster.emoji}
            strength={game.monster.strength}
            initialStamina={game.monster.stamina}
            currentStamina={game.enemyStamina}
            onStaminaChange={(value) => {
              const current = gameRef.current;
              updateGame({ ...current, enemyStamina: value });
            }}
          />
        </View>

        <View style={styles.roundBox}>
          {game.result === 'victory' ? (
            <Text style={styles.victory}>🏆 VICTORY!</Text>
          ) : game.result === 'defeat' ? (
            <Text style={styles.defeat}>💀 DEFEAT...</Text>
          ) : (
            <Text style={styles.roundTitle}>
              ROUND {game.round}
            </Text>
          )}

          <Text style={styles.roundMessage}>
            {game.message}
          </Text>
        </View>

        {game.result === 'playing' && (
          <>
            <View style={styles.startButton}>
              <Button
                title="START ROUND"
                color="#B88A42"
                onPress={startRound}
                disabled={
                  game.phase !== 'ready' || !appActive
                }
              />
            </View>

            {game.phase === 'choosing' && appActive && (
              <CombatGestures onMove={performMove} />
            )}

            {game.phase === 'monsterTurn' && (
              <Text style={styles.waiting}>
                {appActive
                  ? '⚔️ Monster is taking its turn...'
                  : '⏸️ Monster is waiting for you...'}
              </Text>
            )}
          </>
        )}

        {game.result !== 'playing' && (
          <Pressable
            style={styles.restartButton}
            onPress={restartGame}
          >
            <Text style={styles.restartText}>
              PLAY AGAIN
            </Text>
          </Pressable>
        )}

        <Text style={styles.footer}>
          Swipe Left: Thrust | Swipe Right: Sweep | Hold: Block
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#14121C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#E8BE65',
    fontSize: 18,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#14121C',
    padding: 20,
    paddingTop: 65,
    paddingBottom: 50,
  },
  title: {
    color: '#E8BE65',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#B7B0C4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  arena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  characterCard: {
    flex: 1,
    backgroundColor: '#252131',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#55476B',
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 55,
    marginBottom: 10,
  },
  characterName: {
    color: '#E8BE65',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  staminaText: {
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
  vsText: {
    color: '#E8BE65',
    fontSize: 19,
    fontWeight: 'bold',
  },
  roundBox: {
    backgroundColor: '#252131',
    borderRadius: 14,
    padding: 24,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#55476B',
    alignItems: 'center',
  },
  roundTitle: {
    color: '#E8BE65',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  victory: {
    color: '#7EE0A2',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  defeat: {
    color: '#E56B6B',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roundMessage: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
  },
  startButton: {
    marginTop: 25,
    borderRadius: 12,
    overflow: 'hidden',
  },
  waiting: {
    color: '#E8BE65',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  restartButton: {
    backgroundColor: '#E8BE65',
    padding: 18,
    borderRadius: 14,
    marginTop: 25,
    alignItems: 'center',
  },
  restartText: {
    color: '#14121C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    color: '#B7B0C4',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 25,
  },
});
