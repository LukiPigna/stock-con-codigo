import React, { useState, memo, useEffect } from 'react';
import { Product, ProductUnit, ProductUnits } from '../types';
import * as DB from '../services/database';

interface AddProductModalProps {
  initialData?: Partial<Omit<Product, 'id' | 'quantity'>> | null;
  onAdd: (productData: Omit<Product, 'id' | 'quantity'>, initialBatch: { quantity: number; expirationDate: string | null}) => void;
  onClose: () => void;
  categories: string[];
}

const AddProductModal: React.FC<AddProductModalProps> = memo(({ initialData, onAdd, onClose, categories }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [unit, setUnit] = useState<ProductUnit>(ProductUnits[0]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minimumStock, setMinimumStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    setName(initialData?.name ?? '');
  }, [initialData]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseFloat(quantity);
    const numMinimumStock = minimumStock ? parseFloat(minimumStock) : 0;

    if (name.trim() && category && !isNaN(numQuantity) && numQuantity >= 0) {
      const productData = {
          name: name.trim(),
          category,
          unit,
          note: note.trim(),
          minimumStock: numMinimumStock,
          onShoppingList: false,
      };
      const initialBatch = {
        quantity: numQuantity,
        expirationDate: expirationDate || null,
      };
      onAdd(productData, initialBatch);
    } else if (!category) {
      alert('Por favor, crea una categoría en la configuración de la casa antes de añadir un producto.');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Agregar Nuevo Producto</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
            <input id="productName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Leche" autoFocus required />
          </div>
          <div className="mb-4">
            <label htmlFor="productNote" className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
            <textarea id="productNote" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: Comprar sin TACC" rows={2} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="productQuantity" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial</label>
                <input id="productQuantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: 1" step={unit === 'un.' ? "1" : "any"} min="0" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <select value={unit} onChange={e => setUnit(e.target.value as ProductUnit)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                    {ProductUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input id="minimumStock" type="number" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej: 2" step="any" min="0" />
            </div>
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
              <input id="expirationDate" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 -translate-y-3">Recibirás un aviso para comprar cuando la cantidad llegue al stock mínimo.</p>


          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            {categories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                    <button type="button" key={cat} onClick={() => setCategory(cat)} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 truncate ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {cat}
                    </button>
                ))}
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md"><p className="text-sm text-gray-600">No hay categorías. Ve a la configuración para crear una.</p></div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold disabled:bg-indigo-300" disabled={!category}>Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AddProductModal;