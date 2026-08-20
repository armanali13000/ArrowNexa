import { Achievement } from '../engine/types/game';

export const achievementCatalog: Achievement[] = [
  { id: 'first_escape', title: 'First Escape', description: 'Complete your first puzzle.', icon: 'N1', progress: 0, target: 1, unlocked: false },
  { id: 'getting_started', title: 'Getting Started', description: 'Complete 10 levels.', icon: '10', progress: 0, target: 10, unlocked: false },
  { id: 'arrow_apprentice', title: 'Arrow Apprentice', description: 'Complete 25 levels.', icon: '25', progress: 0, target: 25, unlocked: false },
  { id: 'arrow_expert', title: 'Arrow Expert', description: 'Complete 100 levels.', icon: '100', progress: 0, target: 100, unlocked: false },
  { id: 'perfectionist', title: 'Perfectionist', description: 'Complete a level without mistakes.', icon: '3S', progress: 0, target: 1, unlocked: false },
  { id: 'no_help', title: 'No Help Needed', description: 'Complete a difficult level without hints.', icon: 'NH', progress: 0, target: 1, unlocked: false },
  { id: 'hard_solver', title: 'Hard Solver', description: 'Complete your first Hard puzzle.', icon: 'H', progress: 0, target: 1, unlocked: false },
  { id: 'expert_escape', title: 'Expert Escape', description: 'Complete an Expert puzzle.', icon: 'E', progress: 0, target: 1, unlocked: false },
  { id: 'streak_master', title: 'Streak Master', description: 'Maintain a 7-day streak.', icon: '7D', progress: 0, target: 7, unlocked: false },
  { id: 'arrow_cleaner', title: 'Arrow Cleaner', description: 'Remove 1,000 arrows.', icon: '1K', progress: 0, target: 1000, unlocked: false },
];
