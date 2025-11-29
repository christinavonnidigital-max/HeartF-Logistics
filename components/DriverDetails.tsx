
import React from 'react';
import { Driver, DriverAssignment, AssignmentStatus } from '../types';
import { UserCircleIcon, PhoneIcon, BriefcaseIcon, CalendarDaysIcon, ClipboardDocumentIcon, StarIcon, MapPinIcon } from './icons/Icons';
import { ShellCard, SubtleCard } from './UiKit';

interface DriverDetailsProps {
  driver: Driver & { user?: any };
  assignments: DriverAssignment[];
}

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="text-base font-semibold mb-3 flex items-center text-gray-800">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <SubtleCard className="p-4 space-y-2 text-sm">{children}</SubtleCard>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 py-1">
        <span className="text-slate-500 font-medium col-span-1">{label}</span>
        <span className="text-slate-900 col-span-2 break-words">{value || 'N/A'}</span>
    </div>
);

const getAssignmentStatusPill = (status: AssignmentStatus) => {
    switch(status) {
        case AssignmentStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800';
        case AssignmentStatus.IN_PROGRESS: return 'bg-sky-100 text-sky-800';
        case AssignmentStatus.ASSIGNED: return 'bg-amber-100 text-amber-800';
        case AssignmentStatus.CANCELLED: return 'bg-rose-100 text-rose-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

const DriverDetails: React.FC<DriverDetailsProps> = ({ driver, assignments }) => {
  const { user } = driver;

  const isLicenseExpired = new Date(driver.license_expiry_date) < new Date();
  const isMedicalExpired = driver.medical_certificate_expiry ? new Date(driver.medical_certificate_expiry) < new Date() : false;

  const sortedAssignments = [...assignments].sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

  return (
    <ShellCard className="p-6 overflow-y-auto">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-slate-900">{user?.first_name} {user?.last_name}</h3>
        <p className="mt-1 text-md text-slate-500">Driver Profile & Compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
            <DetailSection title="Personal & Contact" icon={<UserCircleIcon className="w-5 h-5" />}>
                <DetailItem label="Date of Birth" value={new Date(driver.date_of_birth + 'T00:00:00').toLocaleDateString()} />
                <DetailItem label="National ID" value={driver.national_id} />
                <DetailItem label="Email" value={user?.email} />
                <DetailItem label="Phone" value={user?.phone} />
                <DetailItem label="Address" value={`${driver.address}, ${driver.city}`} />
            </DetailSection>

            <DetailSection title="License & Compliance" icon={<ClipboardDocumentIcon className="w-5 h-5" />}>
                <DetailItem label="License #" value={driver.license_number} />
                <DetailItem label="License Type" value={driver.license_type} />
                <DetailItem label="License Expiry" value={
                    <span className={isLicenseExpired ? 'font-bold text-rose-600' : ''}>
                        {new Date(driver.license_expiry_date + 'T00:00:00').toLocaleDateString()}
                    </span>
                } />
                <DetailItem label="Medical Cert." value={
                     driver.medical_certificate_expiry ? (
                        <span className={isMedicalExpired ? 'font-bold text-rose-600' : ''}>
                            {new Date(driver.medical_certificate_expiry + 'T00:00:00').toLocaleDateString()}
                        </span>
                     ) : 'N/A'
                } />
            </DetailSection>
        </div>

        <div className="space-y-6">
             <DetailSection title="Employment" icon={<BriefcaseIcon className="w-5 h-5" />}>
                <DetailItem label="Hire Date" value={new Date(driver.hire_date + 'T00:00:00').toLocaleDateString()} />
                <DetailItem label="Status" value={<span className="capitalize font-semibold">{driver.employment_status.replace('_', ' ')}</span>} />
                <DetailItem label="Salary" value={driver.salary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(driver.salary) : 'N/A'} />
            </DetailSection>

            <DetailSection title="Performance" icon={<StarIcon className="w-5 h-5" />}>
                <DetailItem label="Rating" value={`${driver.rating || 'N/A'} / 5`} />
                <DetailItem label="Total Deliveries" value={driver.total_deliveries || 0} />
            </DetailSection>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center text-gray-800">
            <MapPinIcon className="w-5 h-5" />
            <span className="ml-2">Assignment History</span>
        </h3>
        <SubtleCard className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-500">Assignment</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-4 py-3 font-medium text-slate-500 text-right">Dates</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedAssignments.length > 0 ? sortedAssignments.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">
                                    {item.booking_id ? `Booking #${item.booking_id}` : 'General Task'}
                                </td>
                                <td className="px-4 py-3 text-slate-600 capitalize">
                                    {item.assignment_type.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getAssignmentStatusPill(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-slate-500">
                                    <div>Assigned: {new Date(item.assigned_at).toLocaleDateString()}</div>
                                    {item.completed_at && <div>Completed: {new Date(item.completed_at).toLocaleDateString()}</div>}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                    No assignment history recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </SubtleCard>
      </div>
    </ShellCard>
  );
};

export default DriverDetails;
