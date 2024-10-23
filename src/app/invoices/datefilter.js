import React, { useState } from 'react';

const DateFilter = ({ onApply }) => {
  const [timeRange, setTimeRange] = useState('days');
  const [timeAmount, setTimeAmount] = useState(7); // Default to 7 days

  const handleApply = () => {
    // Create a date range based on the selection
    const currentDate = new Date();
    const startDate = new Date();

    if (timeRange === 'days') {
      startDate.setDate(currentDate.getDate() - timeAmount);
    } else if (timeRange === 'months') {
      startDate.setMonth(currentDate.getMonth() - timeAmount);
    }

    // Send the selected date range and time zone back to the parent component
    onApply({ startDate, endDate: currentDate });
  };

  return (
    <div className='bg-white p-4 shadow-lg rounded-lg border w-64'>
      <h3 className='text-lg font-semibold mb-4'>Filter by Date and time</h3>

      <div className='flex flex-col space-y-3 mb-4'>
        <label className='text-gray-500 text-sm'>is in the last</label>
        <div className='flex items-center space-x-2'>
          <input
            type='number'
            value={timeAmount}
            onChange={(e) => setTimeAmount(e.target.value)}
            className='border border-gray-300 rounded-md px-2 py-1 w-16'
          />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className='border border-gray-300 rounded-md px-2 py-1'
          >
            <option value='days'>days</option>
            <option value='months'>months</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleApply}
        className='bg-indigo-600 text-white rounded-md px-4 py-2 w-full hover:bg-indigo-700 transition'
      >
        Apply
      </button>
    </div>
  );
};

export default DateFilter;
