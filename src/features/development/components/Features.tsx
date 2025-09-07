import React from 'react';

export const Features: React.FC = () => {
  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-8`}>
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">🎲</div>
          <h4 className="font-semibold mb-1">Boggle-Style Generation</h4>
          <p className="text-sm text-gray-600">
            Grids use balanced letter distributions for better word yield
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">🔍</div>
          <h4 className="font-semibold mb-1">Real Dictionary</h4>
          <p className="text-sm text-gray-600">
            Words validated against a comprehensive English dictionary
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">♿</div>
          <h4 className="font-semibold mb-1">Accessible</h4>
          <p className="text-sm text-gray-600">
            Full keyboard navigation and screen reader support
          </p>
        </div>
      </div>
    </div>
  );
};
