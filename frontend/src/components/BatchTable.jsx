export default function BatchTable({ batches, selectedId, onRowClick }) {
  if (!batches.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-400">
        No batches found.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Batch Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Institution
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {batches.map((batch) => (
          <tr
            key={batch.id}
            onClick={() => onRowClick(batch)}
            className={`cursor-pointer transition-colors ${
              selectedId === batch.id
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : "hover:bg-gray-50"
            }`}
          >
            <td className="px-6 py-3 text-gray-700">{batch.name}</td>
            <td className="px-6 py-3 text-gray-500">{batch.institution_name ?? batch.institution}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}