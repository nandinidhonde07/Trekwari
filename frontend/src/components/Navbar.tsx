'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import Logo from './Logo';
import { 
  Menu, X, Bell, User as UserIcon, LogOut, Compass, 
  Shield, Calendar, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({ phone: '+91 9322340365' });

  // Handle scroll tracking
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic Settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.settings.get();
        if (data) {
          setSettings({ phone: data.phone });
        }
      } catch (err) {
        console.error('Navbar settings fetch error:', err);
      }
    }
    fetchSettings();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      async function fetchNotifications() {
        try {
          const data = await api.notifications.list();
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (err) {
          console.error('Navbar notifications load error:', err);
        }
      }
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const handleMarkNotiRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotiRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const isHome = pathname === '/';
  const isNavbarTransparent = isHome && !scrolled;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Treks', path: '/treks' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Blog', path: '/blog' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 py-4 ${
        isNavbarTransparent 
          ? 'bg-transparent text-white border-b border-white/10' 
          : 'glass-header text-dark-charcoal shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center scale-100 hover:scale-102 transition-transform duration-300">
            <Logo light={isNavbarTransparent} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-10 items-center">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-xs uppercase font-extrabold tracking-widest relative py-1 transition-colors duration-300 ${
                    active 
                      ? 'text-primary-orange' 
                      : isNavbarTransparent 
                      ? 'text-white/80 hover:text-white' 
                      : 'text-dark-charcoal/70 hover:text-primary-orange'
                  }`}
                >
                  {link.name}
                  {active && (
                    <motion.div 
                      layoutId="navUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-orange"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* Contact Phone */}
            <a 
              href={`tel:${settings.phone}`}
              className={`text-xs font-bold font-sans tracking-wide transition-colors ${
                isNavbarTransparent ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-primary-orange'
              }`}
            >
              📞 {settings.phone}
            </a>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                  className={`relative p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                    isNavbarTransparent 
                      ? 'hover:bg-white/10 text-white' 
                      : 'hover:bg-gray-100 text-dark-charcoal/80'
                  }`}
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary-orange text-white font-extrabold text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notiDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-80 bg-white text-dark-charcoal rounded-[20px] shadow-xl py-3 border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary-orange">Alert Feed</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllNotiRead} className="text-[9px] text-primary-orange hover:underline font-bold uppercase tracking-wider">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-8">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => handleMarkNotiRead(n.id)}
                              className={`px-4 py-3 border-b border-gray-50 text-[10px] leading-relaxed cursor-pointer transition-colors hover:bg-gray-50 ${
                                !n.isRead ? 'bg-orange-50/20 border-l-2 border-l-primary-orange' : ''
                              }`}
                            >
                              <p className="font-bold text-dark-charcoal">{n.title}</p>
                              <p className="text-gray-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2.5 border rounded-full px-4 py-2 transition-all duration-300 focus:outline-none cursor-pointer hover:shadow-sm ${
                    isNavbarTransparent 
                      ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' 
                      : 'border-gray-250 bg-gray-50 hover:bg-gray-100 text-dark-charcoal'
                  }`}
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="" 
                      className="h-5.5 w-5.5 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                  <span className="text-xs font-bold max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-52 bg-white text-dark-charcoal rounded-[20px] shadow-xl py-2.5 border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hiker Profile</p>
                        <p className="text-xs font-bold truncate text-primary-orange mt-0.5">{user.name}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-650 hover:bg-gray-50 transition-colors"
                      >
                        <Compass className="h-4 w-4 mr-2 text-primary-orange" />
                        My Dashboard
                      </Link>

                      {(user.role === 'TREK_LEADER' || user.role === 'VOLUNTEER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link
                          href="/leader"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-650 hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="h-4 w-4 mr-2 text-primary-orange" />
                          Leader Portal
                        </Link>
                      )}

                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-650 hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="h-4 w-4 mr-2 text-primary-orange" />
                          Admin Console
                        </Link>
                      )}

                      <hr className="my-1.5 border-gray-100" />
                      
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-5">
                <Link
                  href="/login"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isNavbarTransparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-primary-orange'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-orange hover:bg-orange-600 hover:scale-[1.03] active:scale-[0.97] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                isNavbarTransparent ? 'text-white' : 'text-dark-charcoal'
              }`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-widest ${
                    pathname === link.path 
                      ? 'bg-orange-50 text-primary-orange' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <hr className="border-gray-100 my-2" />

              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs font-bold text-gray-750 hover:bg-gray-50"
                  >
                    My Dashboard
                  </Link>
                  {(user.role === 'TREK_LEADER' || user.role === 'VOLUNTEER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/leader"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-gray-750 hover:bg-gray-50"
                    >
                      Trek Leader Portal
                    </Link>
                  )}
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-gray-750 hover:bg-gray-50"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-3 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider text-gray-750 hover:bg-gray-50"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center bg-primary-orange text-white px-4 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
