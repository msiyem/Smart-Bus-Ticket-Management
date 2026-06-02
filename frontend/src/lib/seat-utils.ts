import type { SeatRow } from "@/types/booking";

const parseSeatLabel = (seatNumber: string) => {
  const match = seatNumber.match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    return { row: seatNumber, column: Number.NaN };
  }

  return {
    row: match[1],
    column: Number(match[2]),
  };
};

const seatSort = (left: string, right: string) => {
  const leftSeat = parseSeatLabel(left);
  const rightSeat = parseSeatLabel(right);

  if (leftSeat.row !== rightSeat.row) {
    return leftSeat.row.localeCompare(rightSeat.row);
  }

  return leftSeat.column - rightSeat.column;
};

export const groupBookedSeatsByRow = (bookedSeats: string[]) => {
  const bookedByRow = new Map<string, string[]>();

  bookedSeats.forEach((seatNumber) => {
    const { row } = parseSeatLabel(seatNumber);
    const rowSeats = bookedByRow.get(row) ?? [];
    rowSeats.push(seatNumber);
    bookedByRow.set(row, rowSeats.sort(seatSort));
  });

  return bookedByRow;
};

export const generateSeatRows = (
  capacity: number,
  availableSeats: string[],
): SeatRow[] => {
  const grouped = new Map<string, Set<number>>();
  const availableSeatSet = new Set(availableSeats);

  const allSeats: string[] = [];
  if (capacity > 0) {
    let row = "A";
    let column = 1;

    for (let index = 0; index < capacity; index += 1) {
      allSeats.push(`${row}${column}`);
      column += 1;

      if (column > 4) {
        column = 1;
        row = String.fromCharCode(row.charCodeAt(0) + 1);
      }
    }
  }

  const seatsToRender = allSeats.length > 0 ? allSeats : availableSeats;

  seatsToRender.sort(seatSort).forEach((seatNumber) => {
    const seat = parseSeatLabel(seatNumber);

    if (!grouped.has(seat.row)) {
      grouped.set(seat.row, new Set());
    }

    grouped.get(seat.row)?.add(seat.column);
  });

  return Array.from(grouped.entries()).map(([row]) => ({
    row,
    cells: [1, 2, 3, 4].map((column) => ({
      seatNumber: `${row}${column}`,
      available: availableSeatSet.has(`${row}${column}`),
    })),
  }));
};
