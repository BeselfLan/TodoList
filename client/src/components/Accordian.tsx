import { useRef, useState } from 'react';
import type { FormEvent, DragEvent } from 'react';
import { ChevronDownIcon, CloseIcon, GripIcon } from './Icons';
import { DropPosition, type AccordianCardProps, type AccordianProps, type AccordianAddButtonProps } from './types';


function Accordian({ items, loading = false, onAdd, onRemove, onToggle, onMove}: AccordianProps) {
    const [dragTarget, setDragTarget] = useState<{targetId: number, position: DropPosition} | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // handle drag and drop
    const handleDragStart = (event: DragEvent<HTMLDivElement>, id: number) => {
        event.dataTransfer.setData('text/plain', id.toString());
        event.dataTransfer.effectAllowed = 'move';
        setDragTarget(null);
        setDraggingId(id);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>, id: number) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const yPosRel = event.clientY - rect.top;

        if (yPosRel < rect.height / 2) {
            setDragTarget({targetId: id, position: DropPosition.ABOVE});
        } else {
            setDragTarget({targetId: id, position: DropPosition.BELOW});
        }

    };

    const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: number) => {
        event.preventDefault();

        const sourceId = Number(event.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(sourceId) && sourceId !== targetId) {
            onMove(sourceId, targetId, dragTarget!.position);
        }
        setDragTarget(null);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        // Only clear dragTarget when actually leaving the card container
        // Check if the new target is outside the current element
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
        }
        setDragTarget(null);
    }

    // Also fires when a drag is cancelled, which never reaches handleDrop
    const handleDragEnd = () => {
        setDragTarget(null);
        setDraggingId(null);
    };

    return (
        <div className='@container'>
            {items.length === 0 ? (
                <AccordianEmpty loading={loading} />
            ) : (
                <ul className='border-t border-line'>
                    {items.map(item => (
                        <li key={item.id}>
                            <AccordianCard
                                id={item.id}
                                title={item.title}
                                content={item.content}
                                completed={item.completed}
                                onRemove={onRemove}
                                onToggle={onToggle}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragLeave={handleDragLeave}
                                onDragEnd={handleDragEnd}
                                dropHint={dragTarget?.targetId == item.id && draggingId !== item.id ? dragTarget?.position : null}
                                isDragging={draggingId === item.id}
                            />
                        </li>
                    ))}
                </ul>
            )}
            <AccordianAddButton onAdd={onAdd}/>
        </div>
    );
}

export default Accordian;

function AccordianEmpty({ loading }: { loading: boolean }) {
    if (loading) {
        return (
            <div className='border-t border-line' aria-hidden='true'>
                {[60, 45, 70].map(width => (
                    <div key={width} className='flex items-center gap-3 border-b border-line py-4 pl-7'>
                        <div className='size-6 rounded bg-wash motion-safe:animate-pulse'></div>
                        <div className='h-4 rounded bg-wash motion-safe:animate-pulse' style={{ width: `${width}%` }}></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className='rounded-md bg-wash px-6 py-12 text-center'>
            <p className='font-display text-2xl font-bold'>A blank page.</p>
            <p className='mt-1 text-muted'>Add the first thing for this day below.</p>
        </div>
    );
}

function AccordianCard({id, title, content, completed, onRemove, onToggle, onDragStart, onDragOver, onDrop, onDragLeave, onDragEnd, dropHint, isDragging}: AccordianCardProps) {
    const [isExpanded, setExpansion] = useState(false);

    const toggle = () => setExpansion(expanded => !expanded);

    return (
        <div
        draggable
        onDragStart={(event) => onDragStart(event, id)}
        onDragOver={(event) => onDragOver(event, id)}
        onDrop={(event) => onDrop(event, id)}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        className={`group relative border-b border-line transition-colors hover:bg-wash motion-safe:animate-row-in ${isDragging ? 'opacity-40' : ''}`}
        >
            {/* Positioned over the border so showing it never shifts the list mid-drag */}
            {dropHint === DropPosition.ABOVE && <div className='absolute inset-x-0 -top-0.5 z-10 h-1 bg-marigold'></div>}
            <div className='flex items-start gap-2 py-3 pr-1'>
                <GripIcon className='mt-0.5 size-5 shrink-0 cursor-grab text-muted opacity-50 transition-opacity group-hover:opacity-100' />
                <input
                    type='checkbox'
                    className='task-check'
                    checked={completed}
                    onChange={() => onToggle(id)}
                    aria-label={`Mark ${title} as done`}
                />
                <div className='min-w-0 flex-1 pl-1'>
                    <button
                        type='button'
                        className='flex w-full items-start justify-between gap-2 text-left'
                        aria-expanded={isExpanded}
                        onClick={toggle}
                    >
                        <span className={`min-w-0 text-lg leading-6 font-medium wrap-break-word transition-colors ${completed ? 'text-muted line-through' : ''}`}>
                            {title}
                        </span>
                        <ChevronDownIcon className={`mt-0.5 size-5 shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && <p className='mt-1.5 pr-7 pb-1 wrap-break-word text-muted motion-safe:animate-row-in'>{content}</p>}
                </div>
                <button
                    type='button'
                    className='grid size-6 shrink-0 place-items-center rounded text-muted transition hover:bg-carbon/10 hover:text-ink'
                    aria-label={`Remove ${title}`}
                    onClick={() => onRemove(id)}
                >
                    <CloseIcon className='size-4' />
                </button>
            </div>
            {dropHint === DropPosition.BELOW && <div className='absolute inset-x-0 -bottom-0.5 z-10 h-1 bg-marigold'></div>}
        </div>
    );
}

const labelStyle = 'mb-1.5 block text-sm font-semibold';
const inputStyle = 'h-11 w-full rounded-md border border-line bg-transparent px-3 transition-colors placeholder:text-muted hover:border-muted focus:border-ink focus:outline-none';

function AccordianAddButton({ onAdd }: AccordianAddButtonProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const titleInput = useRef<HTMLInputElement>(null);

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
        titleInput.current?.focus();
    };

    return (
        <form onSubmit={handleSubmit} className='mt-8 grid gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] @xl:items-end'>
            <div>
                <label htmlFor="title" className={labelStyle}>Title</label>
                <input id="title" ref={titleInput} type='text' required placeholder='What needs doing?' value={title} onChange={handleTitle} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="content" className={labelStyle}>Content</label>
                <input id="content" type='text' required placeholder='The details' value={content} onChange={handleContent} className={inputStyle} />
            </div>
            <button type='submit' className='h-11 rounded-md bg-marigold px-5 font-semibold text-carbon transition hover:brightness-105 active:brightness-95'>Add Item</button>
        </form>
    );
}

