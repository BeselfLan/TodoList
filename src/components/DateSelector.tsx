import { useState, useRef } from 'react';
import Accordian from './Accordian'

function DateSelector() {

    const [date, setDate] = useState(new Date(2026, 3, 12));

    type Item = { id: number; title: string; content: string }

    const [dateToItems, setDateToItems] = useState<Record<string, Item[]>>({});

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

    const dateKey = date.toISOString().slice(0, 10); // get rid of hms

    const handleAdd = (item: Omit<Item, 'id'>) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];
            const newItem: Item = {
                ...item,
                id: uniqueId.current ++,
            };
            return { ...prev, [dateKey]: [...prevItems, newItem] };
        });
    };

    const handleRemove = (id: number) => {
        setDateToItems(prev => {
            const prevItems = prev[dateKey] ?? [];
            return { ...prev, [dateKey]: prevItems.filter(i => i.id !== id) };
        });
    };

    const handleMove = (sourceId: number, targetId: number) => {

        setDateToItems(prev => {

            const prevItems = prev[dateKey] ?? [];

            const sourceIndex = prevItems.findIndex(item => item.id === sourceId);
            const targetIndex = prevItems.findIndex(item => item.id === targetId);

            if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
                return prev;
            }

            const newItems = [...prevItems];
            const [movedItem] = newItems.splice(sourceIndex, 1);
            newItems.splice(targetIndex, 0, movedItem);
            return {...prev, [dateKey]: newItems};
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
                    onMove={handleMove}
                />
            </div>
        </div>
    );
}

export default DateSelector;