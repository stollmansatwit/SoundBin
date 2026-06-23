import { useEffect, useState } from 'react';

type SchemaTable = {
  tableName: string;
  columns: string[];
};

type SchemaResponse = {
  tables: SchemaTable[];
};

export function SchemaColumns() {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBaseUrl:string = 'http://127.0.0.1:3000';

    fetch(`${apiBaseUrl}/api/schema/columns`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json() as Promise<SchemaResponse>;
      })
      .then((data) => {
        setTables(data.tables);
      })
      .catch((fetchError: Error) => {
        setError(fetchError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading schema columns...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Database Columns</h2>
      {tables.map((table) => (
        <section
          key={table.tableName}
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>{table.tableName}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {table.columns.map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}