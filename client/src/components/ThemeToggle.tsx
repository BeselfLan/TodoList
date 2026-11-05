import { useState } from 'react';
import { MoonIcon, SunIcon } from './Icons';

function ThemeToggle() {
    const [isDark, setIsDark] = useState(document.documentElement.dataset.theme === 'dark');

    const toggle = () => {
        const theme = isDark ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('todoTheme', theme);
        setIsDark(!isDark);
    };

    return (
        <button
            onClick={toggle}
            className='grid size-10 place-items-center rounded-md transition hover:bg-carbon/10 lg:hover:bg-wash'
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <SunIcon className='size-5' /> : <MoonIcon className='size-5' />}
        </button>
    );
}

export default ThemeToggle;
