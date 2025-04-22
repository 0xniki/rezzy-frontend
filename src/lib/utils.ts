export const formatTime = (timeString: string | null): string => {
  if (!timeString) return 'not set';
  
  // Parse the hours and minutes
  const [hours, minutes] = timeString.slice(0, 5).split(':').map(Number);
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
