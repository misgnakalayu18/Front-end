export const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// utils/generateDate.ts
const generateDate = (params: { 
  year: number; 
  month?: number; 
  week?: number; 
  day?: number; 
}): string => {
  const { year, month, week, day } = params;
  
  if (!year) return 'Unknown Period';
  
  if (day && month) {
    // Daily: "Jan 15, 2024"
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } else if (month) {
    // Monthly: "January 2024"
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  } else if (week) {
    // Weekly: "Week 5, 2024"
    return `Week ${week}, ${year}`;
  } else {
    // Yearly: "2024"
    return year.toString();
  }
};

export default generateDate