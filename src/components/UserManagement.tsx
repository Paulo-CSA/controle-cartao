import React, { useState } from 'react';
import { User, USER_COLORS } from '../types';
import { UserPlus, X, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagementProps {
  users: User[];
  onAddUser: (name: string, color: string) => void;
  onRemoveUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onRemoveUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedColor, setSelectedColor] = useState(USER_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onAddUser(userName.trim(), selectedColor);
      setUserName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100" id="user-management">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-gray-900 font-sans">Membros do Cartão</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
          id="btn-toggle-add-user"
        >
          {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Convidar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <AnimatePresence>
          {users.map(user => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-100 bg-gray-50/50 group transition-all hover:bg-white hover:shadow-sm"
              id={`user-pill-${user.id}`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.color }} />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <button 
                onClick={() => onRemoveUser(user.id)}
                className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                id={`btn-remove-user-${user.id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden space-y-4"
            id="add-user-form"
          >
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                <input 
                  autoFocus
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome do membro"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-sans"
                  id="input-user-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Escolher Cor</label>
                <div className="flex flex-wrap gap-2">
                  {USER_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      id={`btn-select-color-${color}`}
                    >
                      {selectedColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-inner" />}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-100"
                id="btn-confirm-add-user"
              >
                Adicionar Membro
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
