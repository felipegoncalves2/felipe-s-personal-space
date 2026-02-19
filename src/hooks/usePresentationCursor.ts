import { useEffect, useRef } from 'react';

const HIDE_DELAY_MS = 5000;

/**
 * Hook that hides the cursor after a period of inactivity in presentation mode.
 * @param isActive - Whether the cursor hiding behavior should be active.
 */
export function usePresentationCursor(isActive: boolean) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isActive) {
            // Ensure cursor is visible when not in presentation mode
            document.body.style.cursor = 'default';
            return;
        }

        const showCursor = () => {
            document.body.style.cursor = 'default';

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                document.body.style.cursor = 'none';
            }, HIDE_DELAY_MS);
        };

        // Start the initial timer
        timeoutRef.current = setTimeout(() => {
            document.body.style.cursor = 'none';
        }, HIDE_DELAY_MS);

        document.addEventListener('mousemove', showCursor);

        return () => {
            document.removeEventListener('mousemove', showCursor);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            // Always restore cursor on unmount
            document.body.style.cursor = 'default';
        };
    }, [isActive]);
}
