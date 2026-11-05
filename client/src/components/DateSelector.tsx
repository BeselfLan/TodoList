import { useState, useRef, useEffect, useCallback } from 'react';
import Accordian from './Accordian'
import DayHero from './DayHero';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { API_URL, DropPosition, type AccordianItem, type NewAccordianItem } from './types';

const getDateKey = (value: Date) => {
    const year = String(value.getFullYear()).padStart(4, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const shiftDays = (value: Date, numDays: number) => {
    const newDate = new Date(value);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
};

// "Today's list" close to now, otherwise named after the weekday
const getListHeading = (value: Date) => {
    const today = new Date();
    const key = getDateKey(value);

    if (key === getDateKey(today)) return "Today's list";
    if (key === getDateKey(shiftDays(today, 1))) return "Tomorrow's list";
    if (key === getDateKey(shiftDays(today, -1))) return "Yesterday's list";
    return `${value.toLocaleDateString(undefined, { weekday: 'long' })}'s list`;
};

function DateSelector() {

    // note: Date stores month 0 indexed (i.e. 0 is January)
    const [date, setDate] = useState(new Date());

    const [dateToItems, setDateToItems] = useState<Record<string, AccordianItem[]>>({});

    const [loading, setLoading] = useState(true);

    const uniqueId = useRef(0);

    const updateDate = (numDays: number) => (
        setDate((prevDate) => shiftDays(prevDate, numDays))
    );

    const updateDateFromString = (value: string) => {
        // The input reports '' while its value is incomplete or cleared
        if (!value) return;
        // A bare YYYY-MM-DD would parse as UTC, the day before in the Americas
        setDate(new Date(`${value}T00:00:00`));
    };

    const dateKey = getDateKey(date);

    // Rows saved before the completed column existed come back without the flag.
    type StoredItem = NewAccordianItem & { id: number; completed?: boolean };

    // check if provided json is of correct format
    const isAccordianItemArray = (value: unknown): value is StoredItem[] => {
        return Array.isArray(value) && value.every((item) => {
            return item !== null
                && typeof item === 'object'
                && typeof item.id === 'number'
                && typeof item.title === 'string'
                && typeof item.content === 'string'
                && (item.completed === undefined || typeof item.completed === 'boolean');
        });
    };

    const normalizeItems = (items: StoredItem[]): AccordianItem[] => (
        items.map((item) => ({ ...item, completed: item.completed === true }))
    );

    const token = typeof window !== 'undefined' ? localStorage.getItem('todoToken') ?? '' : '';

    const fetchJSON = useCallback(async (url: string) => {
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Network response not ok: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to load JSON:', error);
            return undefined;
        }
    }, [token]);

    useEffect(() => {
        const fetchItems = async () => {
            const datesResponse = await fetchJSON(`${API_URL}/data/`);
            const dateStrings: string[] = Array.isArray(datesResponse?.dates)
                ? datesResponse.dates
                : [];

            if (dateStrings.length === 0) {
                console.warn('No dates returned from /data:', datesResponse);
                return;
            }

            const allLoaded = await Promise.all(dateStrings.map(async (rawDate) => {
                const [year, month, day] = rawDate.split('/');
                const paddedMonth = month.padStart(2, '0');
                const paddedDay = day.padStart(2, '0');
                const itemDateKey = `${year}-${paddedMonth}-${paddedDay}`;

                const json = await fetchJSON(`${API_URL}/data/${year}/${paddedMonth}/${paddedDay}`);

                if (!isAccordianItemArray(json)) {
                    console.error('Unexpected /data/:year/:month/:day payload for', rawDate, json);
                    return [itemDateKey, [] as AccordianItem[]] as const;
                }

                return [itemDateKey, normalizeItems(json)] as const;
            }));

            setDateToItems(prev => {
                const next = { ...prev };
                for (const [key, items] of allLoaded) {
                    if (items.length > 0) {
                        next[key] = items;
                    }
                }
                return next;
            });

            const currentItems = allLoaded.find(([key]) => key === dateKey)?.[1] ?? [];
            uniqueId.current = currentItems.reduce((nextId, item) => Math.max(nextId, item.id), 0) + 1;
        };

        fetchItems().finally(() => setLoading(false));
    }, [dateKey, fetchJSON]);

    const sendSaveRequest = async (payload: Record<string, AccordianItem[]> = dateToItems) => {
        try {
            const response = await fetch(`${API_URL}/data/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Server HTTP error, is server running?');
            }
        } catch (err) {
            console.error('Fetch failed:', err);
        }
    };

    const handleAdd = (item: NewAccordianItem) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];
            const newItem: AccordianItem = {
                ...item,
                id: uniqueId.current++,
                completed: false,
            };
            const next = { ...prev, [dateKey]: [...prevItems, newItem] };
            void sendSaveRequest(next);
            return next;
        });
    };

    const handleRemove = (id: number) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];
            const next = { ...prev, [dateKey]: prevItems.filter(i => i.id !== id) };
            void sendSaveRequest(next);
            return next;
        });
    };

    const handleToggle = (id: number) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];
            const next = {
                ...prev,
                [dateKey]: prevItems.map(item => (
                    item.id === id ? { ...item, completed: !item.completed } : item
                )),
            };
            void sendSaveRequest(next);
            return next;
        });
    };

    const handleMove = (sourceId: number, targetId: number, position: DropPosition | null) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];

            const sourceIndex = prevItems.findIndex(item => item.id === sourceId);
            let targetIndex = prevItems.findIndex(item => item.id === targetId);

            if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
                return prev;
            }

            const newItems = [...prevItems];
            const [movedItem] = newItems.splice(sourceIndex, 1);
            if (sourceIndex < targetIndex) {
                targetIndex -= 1;
            }
            if (position === DropPosition.BELOW) {
                targetIndex += 1;
            }
            newItems.splice(targetIndex, 0, movedItem);

            const next = { ...prev, [dateKey]: newItems };
            void sendSaveRequest(next);
            return next;
        });
    };

    const items = dateToItems[dateKey] ?? [];
    const doneCount = items.filter(item => item.completed).length;
    const isToday = dateKey === getDateKey(new Date());

    return (
        <div className='lg:grid lg:min-h-dvh lg:grid-cols-[minmax(22rem,30rem)_minmax(0,1fr)]'>
            <aside className='tear-edge flex flex-col gap-6 bg-marigold px-5 pt-5 pb-8 text-carbon lg:sticky lg:top-0 lg:h-dvh lg:justify-between lg:px-10 lg:py-8'>
                <h1 className='py-2 font-display text-sm font-extrabold tracking-[0.2em] lg:py-0'>THE TODOLIST</h1>
                <DayHero date={date} />
                <div className='flex flex-col gap-4'>
                    <WeekStrip date={date} dateToItems={dateToItems} onSelect={setDate} />
                    <div className='flex flex-wrap items-center gap-2'>
                        <button className={stepStyle} aria-label="Decrease-Date" onClick={() => updateDate(-1)}>
                            <ArrowLeftIcon className='size-5' />
                        </button>
                        <input
                            className='h-10 min-w-0 flex-1 rounded-md border-2 border-carbon bg-transparent px-2 font-medium scheme-light'
                            type="date"
                            aria-label="Date"
                            value={dateKey}
                            onChange={(e) => updateDateFromString(e.target.value)}
                        />
                        <button className={stepStyle} aria-label="Increase-Date" onClick={() => updateDate(1)}>
                            <ArrowRightIcon className='size-5' />
                        </button>
                        {/* Disabled rather than hidden, so the arrows never shift between clicks */}
                        <button
                            className='h-10 rounded-md bg-carbon px-3 text-sm font-semibold text-marigold transition hover:opacity-85 disabled:opacity-30 max-[359px]:w-full'
                            disabled={isToday}
                            onClick={() => setDate(new Date())}
                        >
                            Today
                        </button>
                    </div>
                </div>
            </aside>
            <main className='px-5 pt-10 pb-16 lg:px-12 lg:pt-20'>
                <div className='mx-auto max-w-2xl'>
                    <div className='mb-5 flex items-baseline justify-between gap-4'>
                        <h2 className='font-display text-3xl font-extrabold tracking-tight sm:text-4xl'>{getListHeading(date)}</h2>
                        {items.length > 0 && (
                            <p className='shrink-0 font-medium text-muted'>
                                {doneCount === items.length ? 'All done' : `${doneCount} of ${items.length} done`}
                            </p>
                        )}
                    </div>
                    {items.length > 0 && (
                        <div className='mb-6 h-2 overflow-hidden rounded-full bg-wash' aria-hidden='true'>
                            <div
                                className='h-full rounded-full bg-marigold transition-[width] duration-300'
                                style={{ width: `${(doneCount / items.length) * 100}%` }}
                            ></div>
                        </div>
                    )}
                    <Accordian
                        items={items}
                        loading={loading}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        onToggle={handleToggle}
                        onMove={handleMove}
                    />
                </div>
            </main>
        </div>
    );
}

const stepStyle = 'grid size-10 shrink-0 place-items-center rounded-md border-2 border-carbon transition hover:bg-carbon hover:text-marigold';

type WeekStripProps = {
    date: Date;
    dateToItems: Record<string, AccordianItem[]>;
    onSelect: (date: Date) => void;
};

// The Sunday-to-Saturday week around the selected date. A dot marks each day
// that already has items.
function WeekStrip({ date, dateToItems, onSelect }: WeekStripProps) {
    const selectedKey = getDateKey(date);
    const todayKey = getDateKey(new Date());
    const days = Array.from({ length: 7 }, (_, index) => shiftDays(date, index - date.getDay()));

    return (
        <div className='grid grid-cols-7 gap-1'>
            {days.map(day => {
                const key = getDateKey(day);
                const isSelected = key === selectedKey;
                const hasItems = (dateToItems[key]?.length ?? 0) > 0;

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(day)}
                        className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 transition ${isSelected ? 'bg-carbon text-marigold' : 'hover:bg-carbon/10'}`}
                        aria-label={day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        aria-pressed={isSelected}
                        aria-current={key === todayKey ? 'date' : undefined}
                    >
                        <span className='text-xs font-semibold'>{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                        <span className={`font-display text-lg leading-6 font-bold ${key === todayKey && !isSelected ? 'underline decoration-2 underline-offset-2' : ''}`}>
                            {day.getDate()}
                        </span>
                        <span className={`size-1 rounded-full ${hasItems ? 'bg-current' : ''}`}></span>
                    </button>
                );
            })}
        </div>
    );
}

export default DateSelector;