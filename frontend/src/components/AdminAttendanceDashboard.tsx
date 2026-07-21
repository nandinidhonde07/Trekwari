import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './ui/toast';
import { Search, Printer, Download, Bus, Users, CheckCircle2, AlertTriangle, UserMinus } from 'lucide-react';

export function AdminAttendanceDashboard() {
  const { toast } = useToast();
  const [activeTrekId, setActiveTrekId] = useState('');
  const [treksList, setTreksList] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [busFilter, setBusFilter] = useState('');

  useEffect(() => {
    loadUpcomingTreks();
  }, []);

  useEffect(() => {
    if (activeTrekId) {
      loadAttendanceStats();
    }
  }, [activeTrekId]);

  const loadUpcomingTreks = async () => {
    try {
      const data = await api.events.list();
      // Only show events that are active / registration open / upcoming
      setTreksList(data);
      if (data.length > 0) {
        setActiveTrekId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load treks:', err);
    }
  };

  const loadAttendanceStats = async () => {
    try {
      setLoading(true);
      const data = await api.bookings.getAttendanceStats(activeTrekId, searchQuery);
      setAttendanceData(data);
    } catch (err: any) {
      toast('Error loading attendance stats: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (memberId: string) => {
    try {
      await api.bookings.checkIn(memberId, 'Manual Admin Override', 'Admin Portal Dashboard');
      toast('Check-In recorded successfully!', 'success');
      loadAttendanceStats();
    } catch (err: any) {
      toast('Manual check-in failed: ' + err.message, 'error');
    }
  };

  const handleManualAbsent = async (memberId: string) => {
    // Check-in status change
    try {
      await api.leader.markAttendance(memberId, 'ABSENT');
      toast('Hiker marked ABSENT', 'success');
      loadAttendanceStats();
    } catch (err: any) {
      toast('Action failed: ' + err.message, 'error');
    }
  };

  // Printable layout triggers
  const handlePrint = () => {
    window.print();
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (!attendanceData || !attendanceData.roster || attendanceData.roster.length === 0) return;

    const headers = [
      'Booking ID', 'Participant Name', 'Gender', 'Age', 'Phone', 'Email', 
      'Blood Group', 'Emergency Name', 'Emergency Contact', 'Medical Notes', 
      'Allergies', 'Fitness Level', 'ID Proof', 'ID Number', 'Bus No', 
      'Seat No', 'Status', 'Boarded At', 'Boarded By'
    ];

    const rows = attendanceData.roster.map((r: any) => [
      r.bookingId, r.name, r.gender, r.age, r.phone || '', r.email || '',
      r.bloodGroup || '', r.emergencyName || '', r.emergencyPhone || '', r.medicalConditions || '',
      r.allergies || '', r.fitnessLevel || '', r.idProofType || '', r.idProofNumber || '',
      r.busNumber, r.seatNumber || '', r.checkedIn ? 'Checked In' : 'Pending',
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : '', r.checkedInBy || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `boarding-list-${activeTrekId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !attendanceData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const stats = attendanceData?.stats || { totalSeats: 0, checkedIn: 0, pending: 0, absent: 0, busOccupancy: {} };
  const roster = attendanceData?.roster || [];
  const buses = Object.keys(stats.busOccupancy || {});

  // Apply frontend bus filtering
  const filteredRoster = busFilter ? roster.filter((m: any) => m.busNumber === busFilter) : roster;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print:bg-white print:p-0">
      {/* Selection & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Bus className="h-6 w-6 text-orange-500 shrink-0" />
          <select
            value={activeTrekId}
            onChange={(e) => setActiveTrekId(e.target.value)}
            className="bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl font-bold text-gray-700 focus:outline-none w-full md:w-[280px]"
          >
            {treksList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({new Date(t.startDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={roster.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={roster.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-orange text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Print Roster
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <Users className="h-5.5 w-5.5 text-blue-500 mb-2" />
          <span className="text-[9px] uppercase font-bold text-gray-400">Total Booked</span>
          <p className="text-xl font-extrabold text-gray-700 mt-0.5">{stats.totalSeats} seats</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500 mb-2" />
          <span className="text-[9px] uppercase font-bold text-emerald-600">Checked In</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
            {stats.checkedIn} <span className="text-xs text-gray-400 font-normal">({stats.totalSeats > 0 ? Math.round((stats.checkedIn / stats.totalSeats) * 100) : 0}%)</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm">
          <AlertTriangle className="h-5.5 w-5.5 text-yellow-500 mb-2" />
          <span className="text-[9px] uppercase font-bold text-yellow-600">Pending Boarding</span>
          <p className="text-xl font-extrabold text-gray-700 mt-0.5">{stats.pending} seats</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
          <UserMinus className="h-5.5 w-5.5 text-red-500 mb-2" />
          <span className="text-[9px] uppercase font-bold text-red-500">Absent</span>
          <p className="text-xl font-extrabold text-gray-700 mt-0.5">{stats.absent} seats</p>
        </div>
      </div>

      {/* Bus Occupancy bars */}
      {buses.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 print:hidden">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Bus Boarding Ratios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus) => {
              const busData = stats.busOccupancy[bus];
              const pct = busData.booked > 0 ? Math.round((busData.checkedIn / busData.booked) * 100) : 0;
              return (
                <div key={bus} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-gray-700 flex items-center gap-1.5"><Bus className="h-4 w-4" /> {bus}</span>
                    <span className="text-orange-600">{busData.checkedIn} / {busData.booked} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, Booking ID, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAttendanceStats()}
              className="w-full bg-gray-50 border border-gray-150 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {buses.length > 0 && (
            <select
              value={busFilter}
              onChange={(e) => setBusFilter(e.target.value)}
              className="bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl font-bold focus:outline-none"
            >
              <option value="">All Buses</option>
              {buses.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </div>

        {/* Printable header */}
        <div className="hidden print:block text-center py-6 border-b border-gray-200">
          <h2 className="text-xl font-extrabold text-gray-800 uppercase tracking-widest">TrekWari Official Boarding List</h2>
          <p className="text-xs text-gray-500 mt-1">
            Date: {new Date().toLocaleDateString()} | Active Trek: {treksList.find(t => t.id === activeTrekId)?.title}
          </p>
        </div>

        {/* Boarding List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500 border-collapse">
            <thead className="bg-gray-50 font-extrabold text-gray-700 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4">Seat / Bus</th>
                <th className="px-5 py-4">Participant Name</th>
                <th className="px-5 py-4">Gender/Age</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Medical / Notes</th>
                <th className="px-5 py-4">Attendance Status</th>
                <th className="px-5 py-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.length > 0 ? (
                filteredRoster.map((m: any, index: number) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-gray-800">{m.seatNumber || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400 block">{m.busNumber}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-700">
                      {m.name}
                      <span className="text-[9px] text-gray-400 font-normal block">Booking: {m.bookingId}</span>
                    </td>
                    <td className="px-5 py-4">{m.gender} / {m.age} yrs</td>
                    <td className="px-5 py-4">
                      {m.phone || 'N/A'}
                      <span className="text-[9px] text-gray-400 block">Lead: {m.primaryPhone || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 max-w-[200px] truncate" title={m.medicalConditions || 'None'}>
                      {m.medicalConditions || m.allergies ? (
                        <span className="text-red-500 font-bold block truncate">
                          ⚠️ {m.medicalConditions || m.allergies}
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                      <span className="text-[9px] text-gray-400 block">Blood: {m.bloodGroup || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      {m.checkedIn ? (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase">
                            ✔ Checked In
                          </span>
                          <span className="text-[8px] text-gray-400 block tracking-tighter">
                            {m.checkedInAt ? new Date(m.checkedInAt).toLocaleTimeString() : ''} by {m.checkedInBy || 'Staff'}
                          </span>
                        </div>
                      ) : m.attendanceStatus === 'ABSENT' ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase">
                          ❌ Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 print:hidden">
                      {!m.checkedIn && (
                        <button
                          onClick={() => handleManualCheckIn(m.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded cursor-pointer transition-colors"
                        >
                          Check In
                        </button>
                      )}
                      {m.attendanceStatus !== 'ABSENT' && !m.checkedIn && (
                        <button
                          onClick={() => handleManualAbsent(m.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded cursor-pointer transition-colors"
                        >
                          Mark Absent
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-gray-400">
                    No participants matched your filters or search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
