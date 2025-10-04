import { useState, useEffect } from "react";
import type { CalendarDay } from "../types";
import { api } from "../api";
import "./Calendar.css";

interface CalendarProps {
  month: Date;
  onDayClick?: (day: CalendarDay) => void;
}

export default function Calendar({ month, onDayClick }: CalendarProps) {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, [month]);

  async function loadCalendar() {
    setLoading(true);
    try {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      const startDate = firstDay.toISOString().slice(0, 10);
      const endDate = lastDay.toISOString().slice(0, 10);

      const response = await api.getCalendar(startDate, endDate);
      setCalendar(response.calendar);
    } catch (error) {
      console.error("Failed to load calendar:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDayColor(status: CalendarDay["status"]): string {
    switch (status) {
      case "available":
        return "white";
      case "pending":
        return "grey";
      case "approved":
        return "red";
      default:
        return "white";
    }
  }

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="calendar">
      <h2>{monthName}</h2>
      <div className="calendar-grid">
        <div className="calendar-header">Sun</div>
        <div className="calendar-header">Mon</div>
        <div className="calendar-header">Tue</div>
        <div className="calendar-header">Wed</div>
        <div className="calendar-header">Thu</div>
        <div className="calendar-header">Fri</div>
        <div className="calendar-header">Sat</div>

        {calendar.map((day) => {
          const date = new Date(day.date + "T00:00:00");
          const dayOfWeek = date.getDay();
          const dayNumber = date.getDate();
          const backgroundColor = getDayColor(day.status);

          return (
            <div
              key={day.date}
              className="calendar-day"
              style={{
                backgroundColor,
                gridColumnStart: dayNumber === 1 ? dayOfWeek + 1 : undefined,
                cursor: onDayClick ? "pointer" : "default",
              }}
              onClick={() => onDayClick?.(day)}
            >
              <div className="day-number">{dayNumber}</div>
              {day.requests.length > 0 && (
                <div className="day-requests">
                  {day.requests.map((req) => (
                    <div key={req.id} className="request-badge" title={req.employeeName}>
                      {req.employeeName.split(" ")[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "white", border: "1px solid #ccc" }}></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "grey" }}></div>
          <span>Booked (Pending)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "red" }}></div>
          <span>Approved</span>
        </div>
      </div>
    </div>
  );
}
