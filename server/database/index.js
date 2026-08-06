const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, { max: 10 });

const initializeDatabase = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS todo_items (
            id INTEGER NOT NULL,
            user_id TEXT NOT NULL DEFAULT '',
            date_key TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `;

    const existingColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'todo_items' AND table_schema = 'public'
    `;

    const hasUserIdColumn = existingColumns.some((column) => column.column_name === 'user_id');
    if (!hasUserIdColumn) {
        await sql`ALTER TABLE todo_items ADD COLUMN user_id TEXT NOT NULL DEFAULT '';`;
    }

    await sql`ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;`;

    await sql`ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_pkey;`;
    await sql`ALTER TABLE todo_items ADD CONSTRAINT todo_items_pkey PRIMARY KEY (user_id, date_key, id);`;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_todo_items_user_date_order
            ON todo_items(user_id, date_key, sort_order, id);
    `;
};

const listDates = async (userId) => {
    const rows = await sql`SELECT DISTINCT date_key FROM todo_items WHERE user_id = ${userId} ORDER BY date_key`;
    return rows.map(({ date_key }) => date_key);
};

const getItemsForDate = async (userId, dateKey) => {
    return sql`
        SELECT id, title, content, completed
        FROM todo_items
        WHERE user_id = ${userId} AND date_key = ${dateKey}
        ORDER BY sort_order, id
    `;
};

const saveItemsForDate = async (userId, dateKey, items) => {
    await sql.begin(async (tx) => {
        await tx`DELETE FROM todo_items WHERE user_id = ${userId} AND date_key = ${dateKey}`;

        for (const [index, item] of items.entries()) {
            await tx`
                INSERT INTO todo_items (id, user_id, date_key, title, content, completed, sort_order)
                VALUES (${item.id}, ${userId}, ${dateKey}, ${item.title}, ${item.content}, ${item.completed === true}, ${index})
            `;
        }
    });
};

module.exports = {
    initializeDatabase,
    listDates,
    getItemsForDate,
    saveItemsForDate,
};
