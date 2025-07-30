import { useState, useEffect } from 'react';

const GUEST_LIMIT = 3; // Allow 3 actions for guests
const STORAGE_KEY = 'guest_actions_count';

export const useGuestActions = () => {
  const [guestActionsUsed, setGuestActionsUsed] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setGuestActionsUsed(parseInt(saved, 10));
    }
  }, []);

  const incrementGuestActions = () => {
    const newCount = guestActionsUsed + 1;
    setGuestActionsUsed(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
  };

  const resetGuestActions = () => {
    setGuestActionsUsed(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const canPerformAction = guestActionsUsed < GUEST_LIMIT;

  return {
    guestActionsUsed,
    canPerformAction,
    incrementGuestActions,
    resetGuestActions,
    actionsRemaining: GUEST_LIMIT - guestActionsUsed,
  };
};