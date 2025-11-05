import React, { useState, useEffect, memo } from 'react';
import { Product, ProductUnit, ProductUnits } from '../types';

interface EditProductModalProps {
  product: Product;
  onUpdate: (product: Product) => void;
  onClose: () => void;
  categories: string[];
}

const EditProductModal: React.FC<EditProductModalProps> = memo(({ product, onUpdate, onClose, categories }) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [unit, setUnit] = useState(product.unit);
  const [note, setNote] = useState(product.note || '');
  const [minimumStock, setMinimumStock] = useState(product.minimumStock ? String(product.minimumStock) : '');

  useEffect(() => {
    setName(product.name);
    setCategory(product.category);
    setUnit(product.unit);
    setNote(product.note || '');
    setMinimumStock(product.minimumStock ? String(product.minimumStock) : '');
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numMinimumStock = minimumStock ? parseFloat(minimumStock) : 0;

    if (name.trim() && category) {
      onUpdate({
        ...product,
        name: name.trim(),
        category,
        unit,
        note: note.trim(),
        minimumStock: numMinimumStock,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Editar Producto</h2>
        <p className="text-sm text-gray-500 -mt-3 mb-4">La cantidad total se gestiona desde "Gestionar Stock".</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input id="productName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" autoFocus required />
          </div>
          <div className="mb-4">
            <label htmlFor="productNote" className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
            <textarea id="productNote" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input id="minimumStock" type="number" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: 2" step="any" min="0" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <select value={unit} onChange={e => setUnit(e.target.value as ProductUnit)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                      {ProductUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
          </div>
           <p className="text-xs text-gray-500 mt-1 -translate-y-3">Aviso para comprar cuando la cantidad llegue a este número.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
                <button type="button" key={cat} onClick={() => setCategory(cat)} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 truncate ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    {cat}
                </button>
            ))}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-300" disabled={!category}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditProductModal;