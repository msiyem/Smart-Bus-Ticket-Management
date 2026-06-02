import React from "react";

export const useSeatSelection = (maxSeats: number) => {
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);

  const toggleSeat = React.useCallback(
    (seatNumber: string) => {
      let error: string | null = null;

      setSelectedSeats((previous) => {
        if (previous.includes(seatNumber)) {
          return previous.filter((seat) => seat !== seatNumber);
        }

        if (previous.length >= maxSeats) {
          error = `You can only select up to ${maxSeats} seats.`;
          return previous;
        }

        return [...previous, seatNumber];
      });

      return error;
    },
    [maxSeats],
  );

  const clearSelectedSeats = React.useCallback(() => {
    setSelectedSeats([]);
  }, []);

  return {
    selectedSeats,
    setSelectedSeats,
    toggleSeat,
    clearSelectedSeats,
  };
};
