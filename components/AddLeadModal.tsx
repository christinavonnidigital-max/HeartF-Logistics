
import React, { useMemo, useState } from 'react';
import { Lead, LeadSource, LeadStatus, CompanySize, Industry } from '../types';
import {
    UserCircleIcon,
    BriefcaseIcon,
    EnvelopeIcon,
    PhoneIcon,
    DocumentTextIcon,
    MapPinIcon,
    GlobeIcon,
} from './icons';
import { ModalShell, Button, Input, Textarea, Select, SubtleCard, SectionHeader, Label } from './UiKit';

interface AddLeadModalProps {
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score'>) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose, onAddLead }) => {
    const [formData, setFormData] = useState({
        first_name: 'Sarah',
        last_name: 'Moyo',
        email: 'sarah.moyo@zimsupply.co.zw',
        phone: '+263 77 123 4567',
        company_name: 'ZimSupply Wholesale',
        lead_source: LeadSource.WEBSITE,
        lead_status: LeadStatus.NEW,
        company_size: CompanySize.MEDIUM,
        industry: Industry.RETAIL,
        position: 'Procurement Manager',
        website: 'https://zimsupply.co.zw',
        address: '12 Simon Mazorodze Rd',
        city: 'Harare',
        country: 'Zimbabwe',
        logistics_needs:
            'Weekly FMCG distribution between Harare, Gweru and Bulawayo. Need palletized freight and occasional cold chain.',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.first_name || !formData.company_name || !formData.email) {
            setError('First Name, Company, and Email are required.');
            return;
        }
        setError('');
        onAddLead(formData);
    };

        return (
            <ModalShell
                isOpen={true}
                onClose={onClose}
                title="Add New Lead"
                description="Capture prospect details for the pipeline"
                icon={<UserCircleIcon className="w-5 h-5 text-brand-600" />}
                maxWidthClass="max-w-3xl"
                footer={(
                    <>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" form="add-lead-form">Add Lead</Button>
                    </>
                )}
            >
                <form id="add-lead-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <main className="p-6 space-y-8">
                    
                    <SectionHeader title="Contact Information" actions={<UserCircleIcon className="w-4 h-4" />} />
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>First Name*</Label>
                                <Input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="" placeholder="Jane" />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" />
                            </div>
                            <div>
                                <Label>Email*</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-4 w-4 text-foreground-muted" />
                                    </div>
                                    <Input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-9" placeholder="jane@company.com" />
                                </div>
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-4 w-4 text-foreground-muted" />
                                    </div>
                                    <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="pl-9" placeholder="+263..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <SectionHeader title="Company Details" actions={<BriefcaseIcon className="w-4 h-4" />} />
                    <div className="space-y-4">
                        <SubtleCard className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label>Company Name*</Label>
                                <Input type="text" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Acme Logistics" />
                            </div>
                            <div>
                                <Label>Industry</Label>
                                <Select name="industry" value={formData.industry} onChange={handleChange} className="capitalize">
                                    {Object.values(Industry).map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label>Company Size</Label>
                                <Select name="company_size" value={formData.company_size} onChange={handleChange} className="capitalize">
                                    {Object.values(CompanySize).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Website</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <GlobeIcon className="h-4 w-4 text-foreground-muted" />
                                    </div>
                                    <Input type="url" name="website" value={formData.website} onChange={handleChange} className="pl-9" placeholder="https://company.com" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Location</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPinIcon className="h-4 w-4 text-foreground-muted" />
                                        </div>
                                            <Input type="text" name="city" value={formData.city} onChange={handleChange} className="pl-9" placeholder="City" />
                                    </div>
                                        <Input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
                                </div>
                            </div>
                        </SubtleCard>
                    </div>

                    <SectionHeader title="Lead Context" actions={<DocumentTextIcon className="w-4 h-4" />} />
                    <div className="space-y-4">
                        <SubtleCard className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Lead Source</Label>
                                <Select name="lead_source" value={formData.lead_source} onChange={handleChange} className="capitalize">
                                    {Object.values(LeadSource).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </Select>
                            </div>
                             <div>
                                <Label>Position</Label>
                                <Input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Logistics Manager" />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Logistics Needs / Notes</Label>
                                <Textarea name="logistics_needs" value={formData.logistics_needs} onChange={handleChange} rows={3} placeholder="Describe their shipping requirements..." />
                            </div>
                        </SubtleCard>
                    </div>

                    {error && <div className="bg-danger-600/10 border border-danger-600/20 text-danger-600 px-4 py-3 rounded-lg text-sm text-center font-medium">{error}</div>}
                </main>
                
                </form>
            </ModalShell>
    );
};

export default AddLeadModal;
