import type { SVGProps } from 'react';

const Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        {...props}
    />
);

export const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}><path d='M15 5l-7 7 7 7' /></Icon>
);

export const ArrowRightIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}><path d='M9 5l7 7-7 7' /></Icon>
);

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}><path d='M6 9l6 6 6-6' /></Icon>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}><path d='M6 6l12 12M18 6L6 18' /></Icon>
);

export const GripIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon fill='currentColor' stroke='none' {...props}>
        <circle cx='9' cy='6' r='1.6' />
        <circle cx='15' cy='6' r='1.6' />
        <circle cx='9' cy='12' r='1.6' />
        <circle cx='15' cy='12' r='1.6' />
        <circle cx='9' cy='18' r='1.6' />
        <circle cx='15' cy='18' r='1.6' />
    </Icon>
);

export const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}><path d='M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' /></Icon>
);

export const SunIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
        <circle cx='12' cy='12' r='4' />
        <path d='M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </Icon>
);

export const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
        <path fill='#4285F4' d='M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z' />
        <path fill='#34A853' d='M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z' />
        <path fill='#FBBC05' d='M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z' />
        <path fill='#EA4335' d='M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z' />
    </svg>
);
