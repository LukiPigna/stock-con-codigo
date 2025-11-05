import React, { useState, memo, useEffect, useMemo } from 'react';
import { Product, ProductBatch } from '../types';
import * as DB from '../services/database';
import { Timestamp } from 'firebase/firestore';

interface ManageBatchesModalProps {
  product: Product;
  householdId: string;
  onClose: () => void;
}

const formatDateForInput = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return '';
  // Add a day to counteract timezone issues that might push the date back.
  const date = timestamp.toDate();
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - userTimezoneOffset).toISOString().split('T')[0];
};

const ManageBatchesModal: React.FC<ManageBatchesModalProps> = memo(({ product, householdId, onClose }) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [newQuantity, setNewQuantity] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');

  useEffect(() => {
      const unsubscribe = DB.onBatchesUpdate(householdId, product.id, setBatches);
      return () => unsubscribe();
  }, [householdId, product.id]);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseFloat(newQuantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      alert('Por favor, ingresa una cantidad válida.');
      return;
    }
    
    const newBatch: Omit<ProductBatch, 'id' | 'addedDate'> = {
      quantity: numQuantity,
      expirationDate: newExpirationDate ? Timestamp.fromDate(new Date(newExpirationDate)) : null,
    };

    try {
      await DB.addProductBatch(householdId, product.id, newBatch);
      setNewQuantity('');
      setNewExpirationDate('');
    } catch (error) {
      console.error("Error adding batch:", error);
      alert("No se pudo añadir el lote. Inténtalo de nuevo.");
    }
  };

  const handleBatchQuantityChange = (batch: ProductBatch, value: string) => {
    const numQuantity = parseFloat(value);
    if (!isNaN(numQuantity) && numQuantity >= 0) {
      DB.updateBatch(householdId, product.id, batch.id, { quantity: numQuantity });
    }
  };

  const handleBatchDateChange = (batch: ProductBatch, value: string) => {
     const newDate = value ? Timestamp.fromDate(new Date(value)) : null;
     DB.updateBatch(householdId, product.id, batch.id, { expirationDate: newDate });
  };
  
  const handleDeleteBatch = (batchId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este lote?")) {
        DB.deleteBatch(householdId, product.id, batchId);
    }
  }

  const sortedBatches = useMemo(() => [...batches].sort((a, b) => {
    if (a.expirationDate && b.expirationDate) return a.expirationDate.toMillis() - b.expirationDate.toMillis();
    if (a.expirationDate) return -1; // Batches with expiration date first
    if (b.expirationDate) return 1;
    if (!a.addedDate) return 1; // Handle case where addedDate is still pending from server
    if (!b.addedDate) return -1;
    return a.addedDate.toMillis() - b.addedDate.toMillis(); // Then by oldest added
  }), [batches]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Gestionar Stock: {product.name}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-grow overflow-y-auto mb-4 pr-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Lotes Actuales</h3>
            {sortedBatches.length > 0 ? (
                <ul className="space-y-3">
                    {sortedBatches.map(batch => (
                        <li key={batch.id} className="bg-slate-50 p-3 rounded-md flex flex-col sm:flex-row items-center gap-3">
                           <div className="flex-grow w-full flex items-center gap-2">
                             <input type="number" defaultValue={batch.quantity} onBlur={(e) => handleBatchQuantityChange(batch, e.target.value)} className="w-24 px-2 py-1 border border-gray-300 rounded-md" step={product.unit === 'un.' ? '1' : 'any'}/>
                             <span className="text-gray-600 font-medium">{product.unit}</span>
                           </div>
                           <div className="flex-grow w-full">
                            <input type="date" value={formatDateForInput(batch.expirationDate)} onChange={(e) => handleBatchDateChange(batch, e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md" />
                           </div>
                           <button onClick={() => handleDeleteBatch(batch.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                           </button>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500 text-sm">No hay lotes para este producto. Añade una compra para empezar.</p>}
        </div>

        <div className="border-t pt-4">
             <h3 className="text-lg font-semibold text-gray-700 mb-2">Añadir Nueva Compra</h3>
             <form onSubmit={handleAddBatch} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-grow w-full">
                    <label className="text-sm font-medium text-gray-600">Cantidad</label>
                    <input type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} placeholder={`Ej: 2 ${product.unit}`} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" required step={product.unit === 'un.' ? '1' : 'any'} min="0.01"/>
                </div>
                <div className="flex-grow w-full">
                    <label className="text-sm font-medium text-gray-600">Vencimiento (Opcional)</label>
                    <input type="date" value={newExpirationDate} onChange={e => setNewExpirationDate(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Añadir</button>
             </form>
        </div>
      </div>
    </div>
  );
});

export default ManageBatchesModal;