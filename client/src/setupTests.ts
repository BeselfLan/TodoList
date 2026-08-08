// Registers the jest-dom matchers (toBeInTheDocument, toBeChecked, ...) and
// their types. The /vitest entrypoint hooks them into Vitest's expect.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only auto-cleans when Vitest globals are enabled. They are
// not here (tests import describe/it/expect explicitly), so unmount between
// tests by hand — otherwise renders pile up in the same document and queries
// start matching leftovers from the previous test.
afterEach(cleanup)
