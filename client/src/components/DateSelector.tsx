import { useState, useRef, useEffect, useCallback } from 'react';
import Accordian from './Accordian'
import { API_URL, DropPosition, type AccordianItem, type NewAccordianItem } from './types';

function DateSelector() {

    

    const getDateKey = (value: Date) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // note: Date stores month 0 indexed (i.e. 0 is January)
    const [date, setDate] = useState(new Date(2026, 5, 23));

    const [dateToItems, setDateToItems] = useState<Record<string, AccordianItem[]>>({});

    const uniqueId = useRef(0);

    const updateDate = (numDays: number) => (
        setDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + numDays);
            return newDate;
        })
    );

    const updateDateFromString = (value: string) => {
        const newDate = new Date(value);
        setDate(newDate);
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

        fetchItems();
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

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex justify-between max-w-200 gap-6'>
                <button className='bg-pink-100 px-1' onClick={() => updateDate(-1)}> &lt; </button>
                <input
                    className='bg-blue-100' type="date"
                    value={date.toISOString().slice(0, 10)}
                    onChange={(e) => updateDateFromString(e.target.value)}
                />
                <button className='bg-pink-100 px-1' onClick={() => updateDate(1)}> &gt; </button>
            </div>
            <div className='ml-5 mr-5'>
                <Accordian 
                    items={dateToItems[dateKey] ?? []}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onToggle={handleToggle}
                    onMove={handleMove}
                />
            </div>
        </div>
    );
}

export default DateSelector;