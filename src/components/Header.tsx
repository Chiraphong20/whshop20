import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShoppingCart } from 'lucide-react';

interface HeaderProps {
  title: string;
  backTo?: string;
  cartCount: number;
  customBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, backTo, cartCount, customBack }) => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 bg-orange-600 z-20 px-4 py-3 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-3 text-white">
        {(backTo || customBack) && (
          <button onClick={() => customBack ? customBack() : navigate(backTo!)} className="p-1 hover:bg-orange-700 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-bold line-clamp-1">{title}</h1>
      </div>
      {cartCount > 0 && (
        <Link to="/cart" className="relative p-2 text-orange-100 hover:text-white">
          <ShoppingCart size={24} />
          <span className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-white font-bold shadow-sm">
            {cartCount}
          </span>
        </Link>
      )}
    </div>
  );
};

export default Header;