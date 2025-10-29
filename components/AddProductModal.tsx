import React, { useState } from 'react';
import { ProductUnit } from '../types';

interface AddProductModalProps {
  onAdd: (name: string, category: string, unit: ProductUnit, note: string, quantity: number) => void;
  onClose: () => void;
  categories: string[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onAdd, onClose, categories }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [unit, setUnit] = useState<ProductUnit>(ProductUnit.Units);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseFloat(quantity);
    if (name.trim() && category && !isNaN(numQuantity) && numQuantity >= 0) {
      onAdd(name.trim(), category, unit, note.trim(), numQuantity);
    } else if (!category) {
      alert('Por favor, crea una categoría en la configuración de la casa antes de añadir un producto.');
    }
  };
  
  const unitOptions = Object.values(ProductUnit);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Agregar Nuevo Producto</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
            <input
              id="productName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Leche"
              autoFocus
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="productNote" className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
            <textarea
                id="productNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: Comprar sin TACC"
                rows={2}
            />
          </div>
          <div className="mb-4">
              <label htmlFor="productQuantity" className="block text-sm font-medium text-gray-700 mb-1">Cantidad y Unidad</label>
              <div className="flex items-center space-x-2">
                <input
                    id="productQuantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-grow w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 1"
                    step={unit === ProductUnit.Units ? "1" : "any"}
                    min="0"
                    required
                />
                <div className="flex rounded-md shadow-sm">
                    {unitOptions.map((u, index) => (
                        <button
                            type="button"
                            key={u}
                            onClick={() => setUnit(u)}
                            className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                ${unit === u ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                                ${index === 0 ? 'rounded-l-md' : ''}
                                ${index === unitOptions.length - 1 ? 'rounded-r-md' : 'border-r-0'}
                            `}
                        >
                            {u}
                        </button>
                    ))}
                </div>
              </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            {categories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                    <div key={cat}>
                    <button
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 truncate ${
                        category === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {cat}
                    </button>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">No hay categorías. Ve a la configuración de la casa para crear la primera.</p>
                </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-300"
              disabled={!category}
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
