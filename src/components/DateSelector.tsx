import { useState } from 'react';
import Accordian from './Accordian'

function DateSelector() {

    const [date, setDate] = useState(new Date(2026, 3, 12));

    type Item = { id: number; title: string; content: string }

    const [dateToItems, setDateToItems] = useState<Record<string, Item[]>>({});

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
            const newId = prevItems.length;
            const newItem: Item = {
                ...item,
                id: newId
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
                <Accordian items={dateToItems[dateKey] ?? []} onAdd={handleAdd} onRemove={handleRemove} />
            </div>
        </div>
    );
}

export default DateSelector;