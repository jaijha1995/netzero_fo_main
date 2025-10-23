import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaArrowRight, FaArrowLeft, FaCheckCircle, FaCloudUploadAlt, FaSpinner, FaDownload } from 'react-icons/fa';
import esgService from '../../services/esgService';
import { toast } from 'react-toastify';
import { getMediaUrl } from './../../config';
const CompanyInfoForm = () => {
    const [formData, setFormData] = useState({
        companyName: null,
        registrationNumber: null,
        establishmentYear: null,
        companyAddress: null,
        businessType: null,
        registrationCertificate: null,
        rolesDefinedClearly: null,
        organizationRoles: [
            { role: null, responsibility: null }
        ],
        certificates: [
            { type: null, level: null, validity: null }
        ],
        remarks: null,
        points: 0
    });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [apiReady, setApiReady] = useState(false);

    const steps = [
        { id: 'basic', label: 'Basic Company Details' },
        { id: 'leadership', label: 'Leadership/Organization' },
        { id: 'sustainability', label: 'Sustainability Certificate' }
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [fileLabel, setFileLabel] = useState('Choose profile photo');

    // Test API connection when component mounts
    useEffect(() => {
        const testApiConnection = async () => {
            try {
                setLoading(true);
                const response = await esgService.testConnection();

                if (response.success) {
                    console.log('ESG API is accessible and working');
                    setApiReady(true);
                } else {
                    console.error('ESG API test failed:', response.message);
                    toast.error('Could not connect to the ESG service. Please try again later.');
                }
            } catch (error) {
                console.error('Error testing API connection:', error);
                toast.error('Connection to the ESG service failed. Please check if the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        testApiConnection();
    }, []);

    // Fetch existing company info data when API is ready
    useEffect(() => {
        if (!apiReady) return;

        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                const response = await esgService.getCompanyInfo();

                if (response.success && response.data && response.data.companyInfo) {
                    // Update form data with existing values
                    const companyData = response.data.companyInfo;
                    console.log(companyData);
                    setFormData({
                        ...formData,
                        ...companyData
                    });

                    // Update file label if certificate exists
                    if (companyData.registrationCertificate) {
                        setFileLabel(companyData.registrationCertificate.split('/').pop());
                    }

                    setSaved(true);
                    toast.success('Company data loaded successfully');
                } else if (!response.success) {
                    console.log('No existing company data found:', response.message);
                    if (!response.message.includes('not found')) {
                        toast.info('Please fill out your company information');
                    }
                }
            } catch (error) {
                console.error('Error fetching company data:', error);
                toast.error('Failed to load your company data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [apiReady]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setSaved(false);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files); // convert FileList to array
        if (files.length > 0) {
            setFileLabel(files.map(file => file.name).join(", ")); // show file names
            setFormData({
                ...formData,
                registrationCertificate: files  // store all files
            });
            setSaved(false);
        }
    };


    const handleCertificateChange = (index, field, value) => {
        // Ensure certificates array exists and is valid
        const updatedCertificates = Array.isArray(formData.certificates)
            ? [...formData.certificates]
            : [];

        // Ensure the specific index exists
        if (!updatedCertificates[index]) {
            updatedCertificates[index] = { type: null, level: null, validity: null };
        }

        // Safely set the value (null if empty)
        updatedCertificates[index] = {
            ...updatedCertificates[index],
            [field]: value === '' ? null : value  // ✅ convert empty string to null
        };

        setFormData({
            ...formData,
            certificates: updatedCertificates
        });

        setSaved(false);
    };


    const addCertificate = () => {
        setFormData({
            ...formData,
            certificates: [...formData.certificates, { type: '', level: '', validity: '' }]
        });
        setSaved(false);
    };

    const removeCertificate = (index) => {
        const certificates = [...formData.certificates];
        certificates.splice(index, 1);
        setFormData({
            ...formData,
            certificates
        });
        setSaved(false);
    };

    const handleRoleChange = (index, field, value) => {
        const updatedRoles = [...formData.organizationRoles];
        updatedRoles[index] = {
            ...updatedRoles[index],
            [field]: value
        };
        setFormData({
            ...formData,
            organizationRoles: updatedRoles
        });
        setSaved(false);
    };

    const addRole = () => {
        setFormData({
            ...formData,
            organizationRoles: [...formData.organizationRoles, { role: '', responsibility: '' }]
        });
        setSaved(false);
    };

    const removeRole = (index) => {
        const roles = [...formData.organizationRoles];
        roles.splice(index, 1);
        setFormData({
            ...formData,
            organizationRoles: roles
        });
        setSaved(false);
    };

    const validateBasicInfo = () => {
        const optionalFields = {
            companyName: 'Company Name',
            registrationNumber: 'Registration Number',
            establishmentYear: 'Establishment Year',
            businessType: 'Business Type',
            companyAddress: 'Company Address'
        };

        for (const [field, label] of Object.entries(optionalFields)) {
            const value = formData[field];

            // This safely checks value but does NOT throw or show error
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                // Field is null or empty — that’s okay now
                continue;
            }
        }

        // Registration certificate also optional
        // if (!formData.registrationCertificate) {
        //     // optional, so skip
        // }

        return true; // ✅ All good, no fields required
    };


    const validateLeadershipInfo = () => {
        if (!formData.rolesDefinedClearly) {
            toast.error('Please specify if roles are clearly defined');
            return false;
        }

        if (formData.rolesDefinedClearly === 'YES') {
            for (let i = 0; i < formData.organizationRoles.length; i++) {
                const role = formData.organizationRoles[i];
                if (!role.role || !role.responsibility ||
                    role.role.trim() === '' || role.responsibility.trim() === '') {
                    toast.error(`Please fill in all role and responsibility fields for entry ${i + 1}`);
                    return false;
                }
            }
        }

        return true;
    };

    const validateSustainabilityInfo = () => {
        for (let i = 0; i < formData.certificates.length; i++) {
            const cert = formData.certificates[i];
            if (!cert.type || !cert.level || !cert.validity ||
                cert.type.trim() === '') {
                toast.error(`Please fill in all certificate fields for entry ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const validateCurrentStep = () => {
        switch (steps[currentStep].id) {
            case 'basic':
                return validateBasicInfo();
            case 'leadership':
                return validateLeadershipInfo();
            case 'sustainability':
                return validateSustainabilityInfo();
            default:
                return true;
        }
    };

    const nextStep = async () => {
        if (currentStep < steps.length - 1) {
            if (!validateCurrentStep()) {
                return;
            }
            // Save current data before proceeding
            await saveCompanyData();
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const saveCompanyData = async () => {
        if (!validateCurrentStep()) {
            return;
        }

        try {
            setLoading(true);

            // First upload certificate if available
            let certificateUrls = [];
            if (formData.registrationCertificate && formData.registrationCertificate instanceof File) {
                const uploadResponse = await esgService.uploadCertificate(
                    formData.registrationCertificate,
                    'companyInfo',
                    'registrationCertificate',
                );

                if (uploadResponse.success) {
                    certificateUrls.push(uploadResponse.data.filePath);
                }
            }

            // Prepare data for API
            const companyData = {
                ...formData,
                registrationCertificate: certificateUrls || formData.registrationCertificate
            };

            // Update company info
            const response = await esgService.updateCompanyInfo(companyData);

            if (response.success) {
                setSaved(true);
                toast.success('Company information saved successfully');
            } else {
                toast.error('Failed to save company data');
            }
        } catch (error) {
            console.error('Error saving company data:', error);
            toast.error('Error saving data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all steps before submitting
        if (!validateBasicInfo() || !validateLeadershipInfo() || !validateSustainabilityInfo()) {
            toast.error('Please fill in all required fields before submitting');
            return;
        }

        try {
            setSubmitting(true);

            // First save the current data
            await saveCompanyData();

            // Then submit the entire ESG data for review
            const response = await esgService.submitESGData();

            if (response.success) {
                toast.success('Your company information has been submitted for review!');
            } else {
                toast.error('Failed to submit data for review');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Error submitting data. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async () => {
        if (formData.registrationCertificate && typeof formData.registrationCertificate === 'string') {
            try {
                setLoading(true);
                const fileUrl = getMediaUrl(formData.registrationCertificate);
                const filename = formData.registrationCertificate.split('/').pop();

                // Fetch the file
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error('Network response was not ok');

                // Get the blob from the response
                const blob = await response.blob();

                // Create a blob URL
                const blobUrl = window.URL.createObjectURL(blob);

                // Create a temporary link and trigger download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename; // Force download with filename
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                // Clean up
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);

                toast.success('Download started');
            } catch (error) {
                console.error('Error downloading certificate:', error);
                toast.error('Error downloading certificate. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Helper function to render step content
    const renderStepContent = () => {
        const currentSection = steps[currentStep].id;

        switch (currentSection) {
            case 'basic':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Company Name"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Registration Number 
                            </label>
                            <input
                                type="number"
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                required
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Registration Number"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Establishment Year
                            </label>
                            <input
                                type="date"
                                name="establishmentYear"
                                value={formData.establishmentYear}
                                onChange={handleChange}
                                required
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Business Type
                            </label>
                            <input
                                type="text"
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                required
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Business Type"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Company Address
                            </label>
                            <textarea
                                name="companyAddress"
                                value={formData.companyAddress}
                                onChange={handleChange}
                                required
                                rows={3}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Company Address"
                            ></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                                Registration Certificate
                            </label>
                            <div className="mt-1">
                                <input
                                    type="file"
                                    id="registrationCertificate"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                />
                                <div className="flex items-center space-x-2">
                                    <label
                                        htmlFor="registrationCertificate"
                                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-500 hover:text-white cursor-pointer text-sm sm:text-base"
                                    >
                                        <FaCloudUploadAlt className="mr-2" />
                                        Upload File
                                    </label>

                                    {formData.registrationCertificate && typeof formData.registrationCertificate === 'string' && (
                                        <button
                                            type="button"
                                            onClick={handleDownload}
                                            disabled={loading}
                                            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <FaSpinner className="animate-spin mr-2" />
                                            ) : (
                                                <FaDownload className="mr-2" />
                                            )}
                                            {loading ? 'Downloading...' : 'Download'}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <span className="text-gray-600 text-sm sm:text-base break-all">
                                        {fileLabel}
                                        {saved && <FaCheckCircle className="ml-2 text-green-500 inline" />}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Registration certificate, company profile, business license, etc.
                                    </p>
                                </div>

                                {
                                    formData.points > 0 && (
                                        <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            {formData.points > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-700">Rating</span>
                                                            <span className="text-sm font-semibold text-green-600">{formData.points.toFixed(2)}/1</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${Math.min(formData.points * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.remarks && (
                                                <div className="border-t border-gray-200 pt-3">
                                                    <div className="flex items-start space-x-2">
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-gray-700 block mb-1">Remarks</span>
                                                            <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                                                {formData.remarks}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }


                            </div>
                        </div>
                    </div>
                );

            case 'leadership':
                return (
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 sm:mb-2">
                            Are roles and responsibilities clearly defined with an established organogram and regular reviews?
                        </label>
                        <div className="mt-2 flex flex-wrap items-center space-x-4">
                            <label className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    name="rolesDefinedClearly"
                                    value="YES"
                                    checked={formData.rolesDefinedClearly === 'YES'}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-green-600"
                                />
                                <span className="ml-2 text-gray-700">YES</span>
                            </label>
                            <label className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    name="rolesDefinedClearly"
                                    value="NO"
                                    checked={formData.rolesDefinedClearly === 'NO'}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-green-600"
                                />
                                <span className="ml-2 text-gray-700">NO</span>
                            </label>
                        </div>

                        {formData.rolesDefinedClearly === 'YES' && (
                            <div className="mt-4">
                                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                                    Please list key roles and responsibilities in your organization:
                                </p>

                                {formData.organizationRoles.map((roleInfo, index) => (
                                    <div key={index} className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-200 rounded-md">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={roleInfo.role}
                                                    onChange={(e) => handleRoleChange(index, 'role', e.target.value)}
                                                    required
                                                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    placeholder="Role/Position"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={roleInfo.responsibility}
                                                    onChange={(e) => handleRoleChange(index, 'responsibility', e.target.value)}
                                                    required
                                                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    placeholder="Key Responsibilities"
                                                />
                                            </div>
                                            <div className="flex justify-end md:col-span-2">
                                                {formData.organizationRoles.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRole(index)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        aria-label="Remove role"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addRole}
                                    className="flex items-center text-green-500 border border-green-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-green-50 text-sm sm:text-base"
                                >
                                    <FaPlus className="mr-2" />
                                    Add Role
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'sustainability':
                return (
                    <div>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">
                            What sustainability certifications does your facility hold (e.g., ZED, Green Rating)?
                            Specify the level (Bronze/Silver/Gold) and validity.
                        </p>

                        {formData.certificates.map((cert, index) => (
                            <div key={index} className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-200 rounded-md">
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            value={cert.type}
                                            onChange={(e) => handleCertificateChange(index, 'type', e.target.value)}
                                            required
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Certificate Type"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                        <select
                                            value={cert.level}
                                            onChange={(e) => handleCertificateChange(index, 'level', e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="">Select Level</option>
                                            <option value="Bronze">Bronze</option>
                                            <option value="Silver">Silver</option>
                                            <option value="Gold">Gold</option>
                                        </select>

                                        <input
                                            type="date"
                                            value={cert.validity}
                                            onChange={(e) => handleCertificateChange(index, 'validity', e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        {formData.certificates.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCertificate(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                aria-label="Remove certificate"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addCertificate}
                            className="flex items-center text-green-500 border border-green-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-green-50 text-sm sm:text-base"
                        >
                            <FaPlus className="mr-2" />
                            Add Certificate
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading && Object.values(formData).every(item =>
        item === '' ||
        item === null ||
        (Array.isArray(item) && item.length === 1 && Object.values(item[0]).every(v => v === '')))) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-green-600 text-4xl" />
                <p className="ml-2 text-gray-600">Loading your data...</p>
            </div>
        );
    }

    if (!apiReady && !loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold">Connection Error</p>
                    <p>Could not connect to the ESG service. The backend server may not be running.</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="w-full container mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 my-4 sm:my-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-green-600 mb-2">Company Information</h1>
                <p className="text-center text-gray-600 mb-4 sm:mb-6">Please provide your company details</p>

                {/* Stepper */}
                <div className="mb-6 sm:mb-8">
                    <ol className="flex items-center w-full space-x-2 sm:space-x-4">
                        {steps.map((step, index) => (
                            <li key={step.id} className={`flex items-center space-x-1 sm:space-x-2 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                                <span className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 ${index <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {index < currentStep ? <FaCheckCircle /> : index + 1}
                                </span>
                                <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-500">
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <span className="flex-1 h-0.5 w-full bg-gray-200 border-dashed"></span>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>

                <form onSubmit={handleSubmit}>
                    {renderStepContent()}

                    <div className="flex justify-between mt-8">
                        <button
                            type="button"
                            onClick={prevStep}
                            className={`px-4 py-2 text-sm sm:text-base rounded-md ${currentStep === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            disabled={currentStep === 0 || loading}
                        >
                            <FaArrowLeft className="inline mr-2" /> Previous
                        </button>

                        <div>
                            <button
                                type="button"
                                onClick={saveCompanyData}
                                disabled={loading}
                                className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                            >
                                {loading ? <FaSpinner className="inline animate-spin mr-2" /> : null}
                                Save
                            </button>

                            {currentStep === steps.length - 1 ? (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    {submitting ? <FaSpinner className="inline animate-spin mr-2" /> : null}
                                    Submit for Review
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Next <FaArrowRight className="inline ml-2" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanyInfoForm; 