export const generateSeats = (capacity) => {
    const seats = [];
    let row = "A";
    let col = 1;
    for (let i = 0; i < capacity; i++) {
        seats.push(`${row}${col}`);
        col++;
        if (col > 4) {
            col = 1;
            row = String.fromCharCode(row.charCodeAt(0) + 1);
        }
    }

    return seats;
};