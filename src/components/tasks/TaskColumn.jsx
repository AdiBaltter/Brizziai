import React from 'react';
import TaskCard from './TaskCard';

const statusDisplay = {
  'פתוחה': { title: '🔵 פתוחות', bg: 'bg-blue-50/70' },
  'בביצוע': { title: '🟡 בביצוע', bg: 'bg-yellow-50/70' },
  'הושלמה': { title: '🟢 הושלמו', bg: 'bg-green-50/70' },
  'נדחתה': { title: '🔴 נדחו', bg: 'bg-red-50/70' },
};

export default function TaskColumn({ status, tasks, clients, onUpdate }) {
  const displayInfo = statusDisplay[status] || { title: status, bg: 'bg-gray-50/70' };

  return (
    <div className={`${displayInfo.bg} p-4 rounded-lg flex flex-col`}>
      <h2 className="text-lg font-semibold mb-4">{displayInfo.title} ({tasks.length})</h2>
      <div className="space-y-4 overflow-y-auto flex-1">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} client={clients[task.client_id]} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}