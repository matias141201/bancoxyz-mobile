const { jest: testRuntime } = require('@jest/globals');

testRuntime.mock('@/features/history/presentation/filter-panel-motion', () => ({
  FilterPanelMotion: ({ children }) => children,
}));
