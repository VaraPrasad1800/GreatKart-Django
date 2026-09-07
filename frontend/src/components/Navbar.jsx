import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { categoriesApi } from '../api/categories';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsCatDropdownOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide">
        ⚡ Free express delivery on all orders across the country!
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">
                GreatKart
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link to="/store" className="hover:text-blue-600 transition-colors">
              All Products
            </Link>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors py-2"
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCatDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setIsCatDropdownOpen(false)}
                >
                  <Link
                    to="/store"
                    className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-blue-600"
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/store?category=${cat.slug}`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {cat.category_name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100/90 text-slate-900 pl-10 pr-4 py-2 text-sm rounded-full border border-transparent focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {user?.first_name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    <div className="my-1 border-t border-slate-100"></div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 px-2 space-y-3 animate-in slide-in-from-top-4 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 pl-10 pr-4 py-2 text-sm rounded-xl border border-transparent focus:bg-white focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="flex flex-col space-y-1 pt-2 font-medium text-slate-700">
              <Link to="/" className="px-3 py-2 rounded-lg hover:bg-slate-100">
                Home
              </Link>
              <Link to="/store" className="px-3 py-2 rounded-lg hover:bg-slate-100">
                All Products
              </Link>
              <div className="pt-2">
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Categories</p>
                <div className="mt-1 space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/store?category=${cat.slug}`}
                      className="block px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md"
                    >
                      {cat.category_name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
