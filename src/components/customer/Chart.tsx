import React from 'react';

interface ChartProps {
  type: 'area' | 'bar';
  data: any[];
}

export const Chart: React.FC<ChartProps> = ({ type, data }) => {
  if (type === 'area') {
    return (
      <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-600">Quote Value Area Chart</div>
          <div className="text-sm text-gray-500 mt-1">Interactive chart showing quote trends over time</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-2">📈</div>
        <div className="text-gray-600">Margin Trend Bar Chart</div>
        <div className="text-sm text-gray-500 mt-1">Quote volume and margin analysis by month</div>
      </div>
    </div>
  );
};