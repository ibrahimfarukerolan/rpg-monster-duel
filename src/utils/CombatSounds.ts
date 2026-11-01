
import { createAudioPlayer } from 'expo-audio';

const attackPlayer = createAudioPlayer(
  require('../../assets/sounds/attack.mp3')
);

const blockPlayer = createAudioPlayer(
  require('../../assets/sounds/block.mp3')
);

const victoryPlayer = createAudioPlayer(
  require('../../assets/sounds/victory.mp3')
);

const defeatPlayer = createAudioPlayer(
  require('../../assets/sounds/defeat.mp3')
);

function playSound(player: ReturnType<typeof createAudioPlayer>) {
  try {
    player.seekTo(0);
    player.play();
  } catch (error) {
    console.log('Sound error:', error);
  }
}

export const CombatSounds = {
  attack: () => playSound(attackPlayer),
  block: () => playSound(blockPlayer),
  victory: () => playSound(victoryPlayer),
  defeat: () => playSound(defeatPlayer),
};
