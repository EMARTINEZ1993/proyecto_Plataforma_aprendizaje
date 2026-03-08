export const badges = [
    { id: 1, name: "First Steps", icon: "👶", condition: (stats) => stats.score >= 1 },
    { id: 2, name: "10 Correct", icon: "🎯", condition: (stats) => stats.score >= 10 },
    { id: 3, name: "25 Correct", icon: "⭐", condition: (stats) => stats.score >= 25 },
    { id: 4, name: "50 Perfect", icon: "🏆", condition: (stats) => stats.score >= 50 },
    { id: 5, name: "Combo x10", icon: "🔥", condition: (stats) => stats.maxStreak >= 10 },
    { id: 6, name: "Speed Demon", icon: "⚡", condition: (stats) => stats.points >= 100 },
    { id: 7, name: "Code Master", icon: "💻", condition: (stats) => Object.keys(stats.ownedBlocks || {}).filter(k => stats.ownedBlocks[k]).length >= 5 },
    { id: 8, name: "Level 10", icon: "🚀", condition: (stats) => stats.level >= 10 }
];
