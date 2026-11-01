# RPG Monster Duel ⚔️

## Project Description

RPG Monster Duel is a mobile combat game developed with React Native and Expo. The player fights against a randomly selected enemy: Orc, Goblin, or Troll.

The game uses React hooks, gesture controls, and a round-based combat system.

## Technologies

- React Native
- Expo
- TypeScript
- React useState Hook
- React Native Gesture Handler
- Expo Audio
- React Native AppState API
- AsyncStorage

## Game Features

- Random enemy selection (Orc, Goblin, or Troll)
- Round-based combat system
- Three combat moves: Thrust, Sweep, and Block
- Gesture-based controls
- Strength and stamina system
- Random damage calculation
- Enemy component with useState
- Combat sound effects
- Victory and Defeat screens
- Automatic game saving with AsyncStorage
- Background detection using AppState
- Resume saved combat after reopening the application

## Combat Controls

| Gesture | Action |
|---|---|
| Swipe Left | Thrust |
| Swipe Right | Sweep |
| Long Press | Block |

Combat follows rock-paper-scissors rules:

- Thrust beats Sweep.
- Sweep beats Block.
- Block beats Thrust.
- If both characters choose the same move, the round continues.

## How to Run

1. Install Node.js.
2. Clone the repository.
3. Open the project folder.
4. Install dependencies:

```bash
npm install
```

5. Start the application:

```bash
npx expo start
```

6. Scan the QR code using Expo Go on your mobile device.

## Game Saving

The application automatically saves the current combat state using AsyncStorage. When the player closes and reopens the application, the saved fight is restored.

The AppState API detects when the application goes into the background and pauses the monster's turn until the player returns.

## Project Purpose

This project was developed for the Development of Hybrid Mobile Applications laboratory to demonstrate state management using React hooks, gesture handling, native APIs, and persistent storage.