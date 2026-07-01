export default function EducatorTransfer({ available, assigned, onChange }) {
  const moveToAssigned = (edu) => {
    onChange({
      available: available.filter(e => e.id !== edu.id),
      assigned: [...assigned, edu],
    });
  };

  const moveToAvailable = (edu) => {
    onChange({
      available: [...available, edu],
      assigned: assigned.filter(e => e.id !== edu.id),
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
      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Educators</label>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Available</p>
          <div className="border rounded h-36 overflow-y-auto bg-gray-50">
            {available.map(edu => (
              <div key={edu.id}
                onDoubleClick={() => moveToAssigned(edu)}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700">
                {edu.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-8">
          <button onClick={moveAllToAssigned}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">»</button>
          <button onClick={moveAllToAvailable}
            className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">«</button>
        </div>

        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Assigned</p>
          <div className="border rounded h-36 overflow-y-auto bg-gray-50">
            {assigned.map(edu => (
              <div key={edu.id}
                onDoubleClick={() => moveToAvailable(edu)}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-red-50 hover:text-red-600">
                {edu.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">Double-click an item to move it</p>
    </div>
  );
}