'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import Logo from './Logo';
import { Menu, X, User as UserIcon, LogOut, Shield, Compass, Calendar, Bell } from 'lucide-react';

interface SettingsData {
  phone: string;
  instagram: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    phone: '+91 9322340365',
    instagram: 'https://www.instagram.com/trekwari'
  });

  // Notification Center States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);

  // Load public contact settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.settings.get();
        if (data) {
          setSettings({
            phone: data.phone,
            instagram: data.instagram
          });
        }
      } catch (err) {
        console.error('Navbar settings fetch error:', err);
      }
    }
    fetchSettings();
  }, []);

  // Fetch notifications hook
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
      // Poll every 30 seconds for new alerts
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

  // Monitor scroll for transparency toggle
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';
  // If we are on homepage and haven't scrolled, use transparent navigation
  const isNavbarTransparent = isHome && !scrolled;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Treks', path: '/treks' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/#contact' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white py-3 text-gray-800 border-b border-gray-100 shadow-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center">
            <Logo light={false} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm font-semibold tracking-wide transition-colors duration-305 hover:text-orange-600 ${
                    active ? 'text-orange-600 border-b-2 border-orange-600 pb-1' : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Quick Instagram / Contact */}
            <a 
              href={`tel:${settings.phone}`}
              className="text-xs text-gray-500 hover:text-orange-600 transition-colors"
            >
              📞 {settings.phone}
            </a>

            {/* Notification Bell Dropdown */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                  className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white font-extrabold text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notiDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl py-2 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <span className="text-xs font-bold text-orange-600">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllNotiRead} className="text-[10px] text-orange-500 hover:underline font-bold">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-gray-400 text-center py-6">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkNotiRead(n.id)}
                            className={`px-4 py-3 border-b border-gray-50 text-[11px] leading-relaxed cursor-pointer transition-colors hover:bg-gray-50 ${
                              !n.isRead ? 'bg-orange-50/30 border-l-2 border-l-orange-550' : ''
                            }`}
                          >
                            <p className="font-bold text-orange-600">{n.title}</p>
                            <p className="text-gray-500 mt-0.5">{n.message}</p>
                            <p className="text-[8px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Dropdowns or Signup CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-250 rounded-full px-3 py-1.5 transition-all focus:outline-none text-gray-800"
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                  <span className="text-xs font-semibold max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </button>

                {/* Dropdown Options */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                      <p className="text-sm font-bold truncate text-orange-600">{user.name}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-55 transition-colors"
                    >
                      <Compass className="h-4 w-4 mr-2 text-orange-600" />
                      My Dashboard
                    </Link>

                    {/* Leader Dashboard link */}
                    {(user.role === 'TREK_LEADER' || user.role === 'VOLUNTEER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        href="/leader"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                        Trek Leader Portal
                      </Link>
                    )}

                    {/* Admin Dashboard link */}
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Shield className="h-4 w-4 mr-2 text-orange-600" />
                        Admin Dashboard
                      </Link>
                    )}

                    <hr className="my-1 border-gray-100" />
                    
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex w-full items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-orange-500 hover:scale-105 transition-all shadow-md"
                >
                  Book a trek
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-orange-600 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in fade-in duration-200 shadow-md">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                    active 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            <hr className="border-gray-100 my-2" />

            {isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50"
                >
                  My Dashboard
                </Link>
                {(user.role === 'TREK_LEADER' || user.role === 'VOLUNTEER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/leader"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Trek Leader Portal
                  </Link>
                )}
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-semibold text-red-650 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
