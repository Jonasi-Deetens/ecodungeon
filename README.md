# 🌿 EcoDungeon 🌿

A unique web-based game where you explore a living dungeon ecosystem. Every action you take affects the delicate balance of life within the dungeon. Will you be a guardian of nature or its destroyer?

## 🎮 Game Concept

EcoDungeon is a turn-based strategy game where you navigate through a dungeon that functions as a living ecosystem. The dungeon contains:

- **🌿 Plants**: The foundation of the ecosystem, providing food and oxygen
- **🐀 Herbivores**: Feed on plants and are prey for carnivores
- **🕷️ Carnivores**: Hunt herbivores and help control population
- **🧙 You**: The player who can interact with all entities

## 🎯 How to Play

### Objective

Maintain a healthy ecosystem balance while exploring the dungeon. Your ecological impact is tracked - positive actions help the ecosystem, while destructive actions harm it.

### Controls

- **Click on empty cells** to move your character
- **Click on entities** to select them for interaction
- **Use action buttons** to perform various actions

### Actions

- **📦 Gather**: Collect resources (negative eco impact)
- **⚔️ Attack**: Attack creatures (high negative eco impact)
- **🌱 Plant**: Plant new life (positive eco impact)
- **🔍 Observe**: Study ecosystem (minimal positive impact)
- **✨ Restore**: Restore area (high positive eco impact)

### Ecosystem Health

The game tracks ecosystem health based on the balance of entities:

- **Excellent**: Perfect balance (60% plants, 30% herbivores, 10% carnivores)
- **Good**: Healthy ecosystem
- **Fair**: Stable but could be better
- **Poor**: Unstable ecosystem
- **Critical**: Ecosystem is collapsing

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd EcoDungeon
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run web
```

4. Open your browser and navigate to `http://localhost:19006`

### Alternative Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator (macOS only)
- `npm run type-check` - Run TypeScript type checking
- `npm run type-check:watch` - Run TypeScript type checking in watch mode

## 🏗️ Project Structure

```
EcoDungeon/
├── src/
│   ├── components/          # React components
│   │   ├── GameWorld.tsx    # Main game grid
│   │   ├── PlayerStats.tsx  # Player information panel
│   │   ├── EcosystemStatus.tsx # Ecosystem health display
│   │   └── ActionPanel.tsx  # Player actions and controls
│   ├── context/             # React context for state management
│   │   └── GameContext.tsx  # Main game state and logic
│   ├── types/               # Game type definitions
│   │   └── gameTypes.ts     # Entity classes and constants
│   └── utils/               # Utility functions
├── App.tsx                  # Main app component
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🎲 Game Mechanics

### Entity Lifecycle

- **Plants**: Grow over time, reproduce when healthy
- **Herbivores**: Get hungry, eat plants, reproduce when well-fed
- **Carnivores**: Hunt herbivores, reproduce when well-fed
- **All entities**: Age, lose energy, and can die

### Ecological Impact

Your actions affect the ecosystem:

- **Positive actions** (planting, observing, restoring) improve balance
- **Negative actions** (gathering, attacking) harm the ecosystem
- **Movement** has minimal impact

### Population Dynamics

- Entities reproduce when healthy and well-fed
- Predators hunt nearby prey
- Overpopulation can lead to resource scarcity
- Death and decay are part of the natural cycle

## 🎨 Features

- **Real-time ecosystem simulation**
- **Visual health indicators** for all entities
- **Comprehensive statistics** and monitoring
- **Interactive game world** with click-based navigation
- **Action-based gameplay** with ecological consequences
- **Pause/resume functionality**
- **Game reset option**

## 🔧 Technical Details

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Platform**: Web (with mobile support)

## 🎯 Future Enhancements

- [ ] More entity types (decomposers, fungi, etc.)
- [ ] Different dungeon biomes
- [ ] Weather and environmental effects
- [ ] Player progression and skills
- [ ] Multiplayer support
- [ ] Advanced AI behaviors
- [ ] Sound effects and music
- [ ] Mobile-optimized controls

## 🤝 Contributing

This is a learning project, but contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the MIT License.

---

**Remember**: In EcoDungeon, every action has consequences. Choose wisely and become a true guardian of the ecosystem! 🌿✨
