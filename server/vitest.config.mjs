import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // No DOM here: this is plain Node code, unlike the client suite.
        environment: 'node',
        include: ['tests/**/*.test.js'],
        setupFiles: ['./tests/setup.js'],
    },
});
