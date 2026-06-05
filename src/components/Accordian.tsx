import { useState } from 'react';
import type { FormEvent } from 'react';

type AccordianItem = { id: number; title: string; content: string };

// Accordian takes function argument to 
type AccordianAddButtonProps = {
  onAdd: (item: Omit<AccordianItem, 'id'>) => void;
};

type AccordianProps = {
    items: AccordianItem[];
    onAdd: (item: Omit<AccordianItem, 'id'>) => void;
    onRemove: (id: number) => void;
}

function Accordian({ items, onAdd, onRemove }: AccordianProps) {

    return (
        <div>
            {items.map(item => (
                <AccordianCard key={item.id} id={item.id} title={item.title} content={item.content} onRemove={onRemove} />
            ))}
            <AccordianAddButton onAdd={onAdd}/>
        </div>
    );
}

export default Accordian;

type AccordianCardProps = { id: number; title: string; content: string; onRemove: (id: number) => void};

function AccordianCard({id, title, content, onRemove }: AccordianCardProps) {
    const [isExpanded, setExpansion] = useState(false);

    const toggle = () => setExpansion(expanded => !expanded);

    return (
        <div className='border-5 mb-1 flex justify-between'>
            <div
            className='bg-red-100 pl-1'
            role='button' // this is for aria, treats the div as a button
            onClick={toggle}>
                <h1>{title}</h1>
                {isExpanded && <p>{content}</p>}
            </div>
            <div className='bg-blue-100 pl-2 pr-2 max-h-6 min-w-12 flex justify-between'>
                <input type='checkbox'></input>
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

