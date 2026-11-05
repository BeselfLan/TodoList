// The big printed date on the calendar page. Remounts per day so the page-in
// animation replays when the date changes.
function DayHero({ date }: { date: Date }) {
    const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
    const monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    return (
        <div key={date.toDateString()} className='flex items-end gap-4 motion-safe:animate-page-in lg:flex-col lg:items-start lg:gap-0'>
            <p className='font-display text-[7.5rem] leading-[0.8] font-extrabold tracking-tight [font-stretch:75%] lg:text-[17rem]'>
                {date.getDate()}
            </p>
            <div className='min-w-0 lg:mt-5'>
                <p className='font-display text-2xl leading-tight font-bold lg:text-4xl'>{weekday}</p>
                <p className='text-base font-medium lg:mt-1 lg:text-lg'>{monthYear}</p>
            </div>
        </div>
    );
}

export default DayHero;
