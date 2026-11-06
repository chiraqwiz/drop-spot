// Date-of-birth validation shared by signup and profile updates.
// The client sends "YYYY-MM-DD" (native date input). DOB is required at
// signup; users must be at least 13.

export const MIN_AGE = 13;
export const MAX_AGE = 120;

export function parseDob(input: unknown): { date: Date } | { error: string } {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { error: 'Please enter your date of birth.' };
  }
  const [y, m, d] = input.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { error: 'That date of birth is not a real date.' };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date > today) {
    return { error: 'Date of birth cannot be in the future.' };
  }
  let age = today.getFullYear() - y;
  const hadBirthday = today.getMonth() > m - 1 || (today.getMonth() === m - 1 && today.getDate() >= d);
  if (!hadBirthday) age -= 1;
  if (age < MIN_AGE) {
    return { error: `You must be at least ${MIN_AGE} years old to join DROP SPOT.` };
  }
  if (age > MAX_AGE) {
    return { error: 'Please enter a valid date of birth.' };
  }
  // Store at UTC noon so the DATE column never shifts across timezones.
  return { date: new Date(Date.UTC(y, m - 1, d, 12)) };
}

// "1998-05-12" (or ISO string) -> "May 12, 1998"
export function formatDob(dob: string | Date): string {
  const s = typeof dob === 'string' ? dob.slice(0, 10) : dob.toISOString().slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "YYYY-MM-DD" for <input type="date"> values
export function dobToInputValue(dob: string | Date | null | undefined): string {
  if (!dob) return '';
  return typeof dob === 'string' ? dob.slice(0, 10) : dob.toISOString().slice(0, 10);
}
