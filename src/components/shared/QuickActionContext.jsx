import { createContext } from 'react';

export const QuickActionContext = createContext({
  openNewTask: () => {},
  openNewMeeting: () => {},
  refreshPendingApprovals: async () => {},
});