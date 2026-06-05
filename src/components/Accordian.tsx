import { useState } from 'react';
import type { FormEvent, DragEvent } from 'react';

type AccordianItem = { id: number; title: string; content: string };

// Accordian takes function argument to 
type AccordianAddButtonProps = {
  onAdd: (item: Omit<AccordianItem, 'id'>) => void;
};

type AccordianProps = {
    items: AccordianItem[];
    onAdd: (item: Omit<AccordianItem, 'id'>) => void;
    onRemove: (id: number) => void;
    onMove: (sourceId: number, targetId: number) => void;
}

function Accordian({ items, onAdd, onRemove, onMove}: AccordianProps) {

    // handle drag and drop
    const handleDragStart = (event: DragEvent<HTMLDivElement>, id: number) => {
        event.dataTransfer.setData('text/plain', id.toString());
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: number) => {
        event.preventDefault();

        const sourceId = Number(event.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(sourceId) && sourceId !== targetId) {
            onMove(sourceId, targetId);
        }
    };

    return (
        <div>
            {items.map(item => (
                <AccordianCard 
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    content={item.content}
                    onRemove={onRemove}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
            ))}
            <AccordianAddButton onAdd={onAdd}/>
        </div>
    );
}

export default Accordian;

type AccordianCardProps = { 
    id: number; 
    title: string; 
    content: string; 
    onRemove: (id: number) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, id: number) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>, targetId: number) => void;
};

function AccordianCard({id, title, content, onRemove, onDragStart, onDragOver, onDrop}: AccordianCardProps) {
    const [isExpanded, setExpansion] = useState(false);

    const toggle = () => setExpansion(expanded => !expanded);

    return (
        <div
        draggable
        onDragStart={(event) => onDragStart(event, id)}
        onDragOver={onDragOver}
        onDrop={(event) => onDrop(event, id)}
        className='border-5 mb-1 flex justify-between cursor-move'>
            <div
            className='bg-red-100 pl-1'
            role='button' // this is for aria, treats the div as a button
            onClick={toggle}>
                <h1>{title}</h1>
                {isExpanded && <p>{content}</p>}
            </div>
            <div className='bg-blue-100 pl-2 pr-2 max-h-6 min-w-12 flex justify-between'>
                <input type='checkbox' />
                <button onClick={() => onRemove(id)}>X</button>
            </div>
        </div>
    );
}

function AccordianAddButton({ onAdd }: AccordianAddButtonProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleTitle = (event: FormEvent<HTMLInputElement>) => {
        setTitle((event.target as HTMLInputElement).value);
    };

    const handleContent = (event: FormEvent<HTMLInputElement>) => {
        setContent((event.target as HTMLInputElement).value);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!title.trim() || !content.trim()) return;

        onAdd({ title: title.trim(), content: content.trim() });
        setTitle('');
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="title">Title</label>
            <input id="title" type='text' value={title} onChange={handleTitle} className='border ml-2' />
            <label htmlFor="content" className='ml-2'>Content</label>
            <input id="content" type='text' value={content} onChange={handleContent} className='border ml-2 mr-2' />
            <button type='submit' className='bg-amber-400 p-2'>Add Item</button>
        </form>
    );
}

