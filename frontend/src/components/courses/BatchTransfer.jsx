
export default function BatchTransfer({ available, assigned, onChange }) {
  const moveToAssigned = (batch) => {
    onChange({
      available: available.filter(b => b.id !== batch.id),
      assigned: [...assigned, batch],
    });
  };

  const moveToAvailable = (batch) => {
    onChange({
      available: [...available, batch],
      assigned: assigned.filter(b => b.id !== batch.id),
    });
  };

  const moveAllToAssigned = () => {
    onChange({ available: [], assigned: [...assigned, ...available] });
  };

  const moveAllToAvailable = () => {
    onChange({ available: [...available, ...assigned], assigned: [] });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Batches</label>
      <div className="flex items-start gap-2">
        {/* Available */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Available</p>
          <div className="border rounded h-36 overflow-y-auto bg-gray-50">
            {available.map(batch => (
              <div key={batch.id}
                onDoubleClick={() => moveToAssigned(batch)}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                {batch.name}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1 mt-8">
          <button onClick={moveAllToAssigned} title="Move all"
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            »
          </button>
          <button onClick={moveAllToAvailable} title="Remove all"
            className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">
            «
          </button>
        </div>

        {/* Assigned */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Assigned</p>
          <div className="border rounded h-36 overflow-y-auto bg-gray-50">
            {assigned.map(batch => (
              <div key={batch.id}
                onDoubleClick={() => moveToAvailable(batch)}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-red-50 hover:text-red-600">
                {batch.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">Double-click an item to move it</p>
    </div>
  );
}