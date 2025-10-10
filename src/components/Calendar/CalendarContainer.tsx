import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent } from '../../types';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarContainerProps {
  events: CalendarEvent[];
  view: string;
  onViewChange: (view: string) => void;
  onSelectSlot: (slotInfo: any) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  eventStyleGetter: (event: CalendarEvent) => any;
  dayPropGetter: (date: Date) => any;
}

export const CalendarContainer: React.FC<CalendarContainerProps> = ({
  events,
  view,
  onViewChange,
  onSelectSlot,
  onSelectEvent,
  eventStyleGetter,
  dayPropGetter
}) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm min-h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '600px' }}
        view={view}
        onView={onViewChange}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        slotPropGetter={dayPropGetter}
        popup
      />
    </div>
  );
};
