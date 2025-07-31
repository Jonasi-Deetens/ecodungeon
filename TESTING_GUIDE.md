# 🧪 Enhanced Creature AI Testing Guide

## **🎯 Testing Objectives**

Test the new enhanced creature AI system with biome-specific behaviors, memory, learning, and improved combat mechanics.

## **🚀 How to Test**

### **1. Start the Game**

```bash
npm run web
```

Open http://localhost:19006 in your browser.

### **2. Test Different Biomes**

#### **🌲 Forest Zone (Easy)**

- **Location**: Starting room (bottom-left)
- **Expected Behaviors**:
  - Balanced, peaceful creatures
  - Moderate speed differences
  - Low aggression levels
  - Stable ecosystem

**Test Cases**:

- [ ] Observe different creature speeds (rabbit=3.5, deer=2.8, mouse=4.2, turtle=1.2)
- [ ] Watch herbivores flee from carnivores
- [ ] Check if creatures establish territories
- [ ] Verify memory system (creatures return to food spots)

#### **🏜️ Desert Zone (Medium)**

- **Location**: Middle room (connected via teleporter)
- **Expected Behaviors**:
  - Faster, more aggressive creatures
  - Better memory retention
  - Higher territory awareness
  - Scarce resources

**Test Cases**:

- [ ] Notice increased creature speeds
- [ ] Observe enhanced memory (longer food/predator memory)
- [ ] Check territory establishment and return behavior
- [ ] Verify wall avoidance during fleeing

#### **🧪 Laboratory Zone (Hard)**

- **Location**: Rightmost room (connected via teleporter)
- **Expected Behaviors**:
  - Maximum aggression and speed
  - Pack hunting behavior
  - Poor memory but high damage
  - Unstable ecosystem

**Test Cases**:

- [ ] Observe pack hunting (wolves coordinate)
- [ ] Check high damage output (bears=50, wolves=35)
- [ ] Verify poor memory retention
- [ ] Test wall avoidance in large rooms

### **3. Test Combat System**

#### **Damage Mechanics**

- [ ] Carnivores attack herbivores and deal damage
- [ ] Herbivores don't die instantly but lose health
- [ ] Injured herbivores enter fleeing state
- [ ] Creatures die when health reaches 0
- [ ] **NEW**: Predators only hunt when 70% hungry (more realistic)
- [ ] **NEW**: Herbivores only eat when 60% hungry (more realistic)
- [ ] **NEW**: Predators target closest/weakest prey (smarter hunting)
- [ ] **NEW**: Herbivores eat closest plants (efficient foraging)
- [ ] **NEW**: Predators only gain hunger satisfaction when prey dies
- [ ] **NEW**: Hunger satisfaction based on prey weight (10-15 hunger per kg)
- [ ] **NEW**: Different predators have different metabolic efficiency (snake=15x, wolf=12x, rat=11x, bear=8x)
- [ ] **NEW**: Herbivore hunger satisfaction based on plant weight (15-25 hunger per kg)
- [ ] **NEW**: Different herbivores have different digestive efficiency (mouse=25x, rabbit=22x, deer=18x, turtle=15x)
- [ ] **NEW**: Max hunger scales with creature weight (heavier creatures need more food)

#### **Speed Differences**

- [ ] Mice (4.2 speed) are fastest
- [ ] Turtles (1.2 speed) are slowest
- [ ] Wolves (3.8 speed) are fast predators
- [ ] Bears (1.8 speed) are slow but powerful

### **4. Test AI Features**

#### **Memory System**

- [ ] Creatures remember food locations
- [ ] Creatures remember predator positions
- [ ] Carnivores remember successful hunting spots
- [ ] Memory fades over time (biome-dependent)

#### **Territory Behavior**

- [ ] Creatures establish territory centers
- [ ] Return to territory when too far
- [ ] Territory size varies by biome
- [ ] Territory behavior affects movement patterns

#### **Wall Avoidance**

- [ ] Fleeing creatures avoid walls
- [ ] Bounce off walls instead of getting stuck
- [ ] Wall avoidance works in all room sizes
- [ ] Buffer zone prevents wall collisions

### **5. Test Biome Modifiers**

#### **Forest Modifiers**

- [ ] Balanced speed multipliers
- [ ] Moderate memory retention
- [ ] Low aggression levels
- [ ] Stable reproduction rates

#### **Desert Modifiers**

- [ ] Increased speed multipliers
- [ ] Enhanced memory retention
- [ ] Higher aggression levels
- [ ] Larger territory sizes

#### **Laboratory Modifiers**

- [ ] Maximum speed multipliers
- [ ] Poor memory retention
- [ ] Maximum aggression levels
- [ ] Pack behavior enabled

## **🔍 What to Look For**

### **Visual Indicators**

- **Speed**: Faster creatures move more smoothly
- **Fleeing**: Creatures change direction when predators approach
- **Memory**: Creatures return to previous food locations
- **Territory**: Creatures circle back to home areas
- **Wall Avoidance**: Fleeing creatures bounce off walls
- **Hunger-Based Behavior**: Predators only hunt when hungry, herbivores only eat when hungry
- **Smart Targeting**: Predators choose closest/weakest prey, herbivores choose closest plants
- **Distributed Spawning**: Creatures spawn evenly across rooms, not clustered in corners
- **Realistic Consumption**: Predators only gain hunger satisfaction when prey dies
- **Weight-Based System**: Hunger satisfaction based on weight of consumed food
- **Species-Specific Efficiency**: Different creatures have different metabolic efficiency
- **Scaled Hunger**: Heavier creatures need more food to survive

### **Behavioral Patterns**

- **Pack Hunting**: Wolves coordinate attacks
- **Territory Defense**: Creatures return to established areas
- **Resource Competition**: Multiple creatures seek same food
- **Ecosystem Balance**: Population dynamics emerge

### **Performance Metrics**

- **FPS**: Should remain stable (30+ FPS)
- **Memory Usage**: No memory leaks
- **AI Responsiveness**: Creatures react quickly to threats
- **Collision Detection**: No creatures stuck in walls

## **🐛 Known Issues to Watch For**

1. **Position Clone Errors**: Should be fixed with safety checks
2. **Undefined Parameters**: AI calls now include biome/difficulty
3. **Wall Sticking**: Wall avoidance should prevent this
4. **Memory Leaks**: Memory arrays have size limits

## **✅ Success Criteria**

- [ ] All creatures move at different speeds
- [ ] Combat system works (damage, fleeing, death)
- [ ] Memory system functions (food/predator memory)
- [ ] Territory behavior is observable
- [ ] Wall avoidance prevents stuck creatures
- [ ] Biome differences are noticeable
- [ ] **NEW**: Predators only hunt when hungry (realistic behavior)
- [ ] **NEW**: Herbivores only eat when hungry (realistic behavior)
- [ ] **NEW**: Creatures spawn distributed across rooms (no corner clustering)
- [ ] **NEW**: Smart targeting (closest/weakest prey, closest plants)
- [ ] **NEW**: Predators only gain hunger satisfaction when prey dies
- [ ] **NEW**: Weight-based hunger system (heavier creatures need more food)
- [ ] **NEW**: Metabolic efficiency varies by species (snakes very efficient, bears less efficient)
- [ ] **NEW**: Digestive efficiency varies by herbivore species (mice very efficient, turtles less efficient)
- [ ] No console errors
- [ ] Stable performance

## **📊 Expected Results**

### **Forest Zone**

- Peaceful, balanced ecosystem
- Moderate creature speeds
- Stable population dynamics

### **Desert Zone**

- Faster, more aggressive creatures
- Better memory and territory behavior
- Resource competition visible

### **Laboratory Zone**

- Maximum aggression and speed
- Pack hunting behavior
- Unstable but dynamic ecosystem

## **🚨 If Issues Occur**

1. **Check Console**: Look for JavaScript errors
2. **Restart Game**: Use reset button or refresh page
3. **Test Individual Zones**: Focus on one zone at a time
4. **Check Performance**: Monitor FPS and memory usage

---

**Happy Testing! 🎮✨**
