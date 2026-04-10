'use client';

import { useState } from 'react';
import {
  X, Plus, Hotel, Plane, Train, Utensils, MapPin,
  CheckCircle, Clock, XCircle, Edit3, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Booking } from '@/lib/types';
import EditModal from './EditModal';

const BOOKING_ICONS = {
  hotel: Hotel,
  flight: Plane,
  transport: Train,
  activity: MapPin,
  restaurant: Utensils,
};

const BOOKING_LABELS: Record<string, string> = {
  hotel: 'מלון',
  flight: 'טיסה',
  transport: 'תחבורה',
  activity: 'אטרקציה',
  restaurant: 'מסעדה',
};

const STATUS_CONFIG = {
  pending: { label: 'ממתין', color: 'text-warning bg-warning/10', icon: Clock },
  confirmed: { label: 'מאושר', color: 'text-success bg-success/10', icon: CheckCircle },
  cancelled: { label: 'בוטל', color: 'text-danger bg-danger/10', icon: XCircle },
};

const BOOKING_FIELDS = [
  { key: 'title', label: 'כותרת', type: 'text' as const },
  {
    key: 'type', label: 'סוג', type: 'select' as const,
    options: [
      { value: 'hotel', label: 'מלון' },
      { value: 'flight', label: 'טיסה' },
      { value: 'transport', label: 'תחבורה' },
      { value: 'activity', label: 'אטרקציה' },
      { value: 'restaurant', label: 'מסעדה' },
    ],
  },
  {
    key: 'status', label: 'סטטוס', type: 'select' as const,
    options: [
      { value: 'pending', label: 'ממתין' },
      { value: 'confirmed', label: 'מאושר' },
      { value: 'cancelled', label: 'בוטל' },
    ],
  },
  { key: 'confirmationNumber', label: 'מספר אישור', type: 'text' as const },
  { key: 'date', label: 'תאריך', type: 'text' as const },
  { key: 'time', label: 'שעה', type: 'time' as const },
  { key: 'location', label: 'מיקום / כתובת', type: 'text' as const },
  { key: 'cost', label: 'עלות', type: 'text' as const },
  { key: 'details', label: 'פרטים נוספים', type: 'textarea' as const },
  { key: 'notes', label: 'הערות', type: 'textarea' as const },
];

interface BookingPanelProps {
  bookings: Booking[];
  onUpdate: (bookings: Booking[]) => void;
  onClose: () => void;
}

export default function BookingPanel({ bookings, onUpdate, onClose }: BookingPanelProps) {
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSave = (data: Record<string, string>) => {
    if (isAdding) {
      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        type: (data.type as Booking['type']) || 'hotel',
        title: data.title || '',
        status: (data.status as Booking['status']) || 'pending',
        confirmationNumber: data.confirmationNumber || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        details: data.details || '',
        cost: data.cost || '',
        notes: data.notes || '',
      };
      onUpdate([...bookings, newBooking]);
    } else if (editingBooking) {
      onUpdate(
        bookings.map((b) =>
          b.id === editingBooking.id
            ? { ...b, ...data, type: data.type as Booking['type'], status: data.status as Booking['status'] }
            : b
        )
      );
    }
    setEditingBooking(null);
    setIsAdding(false);
  };

  const handleDelete = () => {
    if (editingBooking) {
      onUpdate(bookings.filter((b) => b.id !== editingBooking.id));
      setEditingBooking(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card">
        <h3 className="font-bold text-lg">הזמנות וסגירות</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingBooking({
                id: '', type: 'hotel', title: '', status: 'pending',
                confirmationNumber: '', date: '', time: '', location: '',
                details: '', cost: '', notes: '',
              });
            }}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bookings list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Hotel className="w-12 h-12 text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm mb-4">עדיין אין הזמנות</p>
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingBooking({
                  id: '', type: 'hotel', title: '', status: 'pending',
                  confirmationNumber: '', date: '', time: '', location: '',
                  details: '', cost: '', notes: '',
                });
              }}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95"
            >
              <Plus className="w-4 h-4" />
              הוסף הזמנה
            </button>
          </div>
        ) : (
          bookings.map((booking) => {
            const Icon = BOOKING_ICONS[booking.type] || MapPin;
            const statusConfig = STATUS_CONFIG[booking.status];
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-card rounded-2xl border border-card-border overflow-hidden animate-fade-in"
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{booking.title || BOOKING_LABELS[booking.type]}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                      {booking.date} {booking.time && `· ${booking.time}`} {booking.location && `· ${booking.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAdding(false);
                        setEditingBooking(booking);
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-muted" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-card-border mt-0 pt-3 space-y-2 text-xs animate-fade-in">
                    {booking.confirmationNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted">מספר אישור:</span>
                        <span className="font-mono font-medium">{booking.confirmationNumber}</span>
                      </div>
                    )}
                    {booking.cost && (
                      <div className="flex justify-between">
                        <span className="text-muted">עלות:</span>
                        <span className="font-medium">{booking.cost}</span>
                      </div>
                    )}
                    {booking.details && (
                      <div>
                        <span className="text-muted">פרטים:</span>
                        <p className="mt-0.5">{booking.details}</p>
                      </div>
                    )}
                    {booking.notes && (
                      <div>
                        <span className="text-muted">הערות:</span>
                        <p className="mt-0.5">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit modal */}
      {editingBooking && (
        <EditModal
          title={isAdding ? 'הזמנה חדשה' : 'עריכת הזמנה'}
          fields={BOOKING_FIELDS}
          data={editingBooking as unknown as Record<string, string>}
          onSave={handleSave}
          onDelete={isAdding ? undefined : handleDelete}
          onClose={() => { setEditingBooking(null); setIsAdding(false); }}
        />
      )}
    </div>
  );
}
