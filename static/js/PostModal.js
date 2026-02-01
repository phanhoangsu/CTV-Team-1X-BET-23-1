const { useState, useEffect, useRef } = React;

const PostModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('LOST'); // LOST or FOUND
    const [step, setStep] = useState(1); // 1: Info, 2: Success
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        category_id: '5', // Default: Khác
        event_date: '',
        location_building: 'Alpha',
        location_detail: '',
        description: '',
        images: [], // Array of URLs
        contact_phone: ''
    });

    useEffect(() => {
        // Expose open function to global window
        window.openPostModal = () => setIsOpen(true);
        return () => {
            window.openPostModal = undefined;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Validation Loop
        const validFiles = [];
        for (const file of files) {
            // Check size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`File "${file.name}" quá lớn, tối đa 5MB thôi Sử ơi!`);
                continue;
            }

            // Check type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
                alert(`File "${file.name}" không đúng định dạng ảnh rồi Sử ơi.`);
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        setUploading(true);

        // Upload in parallel
        try {
            const uploadPromises = validFiles.map(async (file) => {
                const data = new FormData();
                data.append('file', file);
                
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: data
                });
                const result = await res.json();
                if (!result.url) throw new Error(result.error || 'Upload failed');
                return result.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
            
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi upload ảnh: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input to allow re-selecting same files
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Title validation: 10-100 characters
        if (!formData.title || formData.title.trim().length === 0) {
            newErrors.title = 'Tiêu đề không được để trống.';
        } else if (formData.title.trim().length < 10) {
            newErrors.title = 'Tiêu đề cần cụ thể một chút (ít nhất 10 ký tự) bạn nhé.';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự.';
        } else if (/^\d+$/.test(formData.title.trim())) {
            newErrors.title = 'Tiêu đề không được chỉ chứa số.';
        }

        // Type validation: Must be LOST or FOUND
        if (type !== 'LOST' && type !== 'FOUND') {
            newErrors.type = 'Vui lòng chọn bạn làm mất hay nhặt được đồ.';
        }

        // Category validation: Must select a category
        if (!formData.category_id || formData.category_id === '') {
            newErrors.category_id = 'Vui lòng chọn loại đồ vật.';
        }

        // Description validation: Not empty, max 1000 characters
        if (!formData.description || formData.description.trim().length === 0) {
            newErrors.description = 'Mô tả không được để trống.';
        } else if (formData.description.length > 1000) {
            newErrors.description = 'Mô tả không được vượt quá 1000 ký tự.';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Hãy mô tả chi tiết để mọi người dễ nhận diện đồ vật (ít nhất 10 ký tự).';
        }

        // Location validation: Not empty
        if (!formData.location_detail || formData.location_detail.trim().length === 0) {
            newErrors.location_detail = 'Vui lòng cho biết bạn mất/nhặt được ở đâu.';
        }

        // Date validation: Cannot be in the future
        if (formData.event_date) {
            // Parse the datetime-local value (format: YYYY-MM-DDTHH:mm)
            const selectedDate = new Date(formData.event_date);
            const now = new Date();
            
            // Add a small buffer (1 minute) to account for timezone differences
            // This allows selecting current time without issues
            const buffer = 60 * 1000; // 1 minute in milliseconds
            
            if (selectedDate.getTime() > (now.getTime() + buffer)) {
                newErrors.event_date = 'Ngày không thể là ngày mai được!';
            }
            
            // Debug log
            console.log('Date validation:', {
                selected: selectedDate.toISOString(),
                now: now.toISOString(),
                selectedTime: selectedDate.getTime(),
                nowTime: now.getTime(),
                isFuture: selectedDate.getTime() > (now.getTime() + buffer)
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        // Validate form
        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: type,
                title: formData.title,
                category_id: parseInt(formData.category_id),
                event_date: formData.event_date,
                location: {
                    building: formData.location_building,
                    detail: formData.location_detail
                },
                description: formData.description,
                images: formData.images,
                contact_phone: formData.contact_phone
            };

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (res.ok) {
                setStep(2); // Success
            } else {
                // Handle validation errors from backend
                if (result.errors) {
                    const newErrors = {};
                    // Map backend field names to frontend field names
                    Object.keys(result.errors).forEach(key => {
                        const frontendKey = key.replace('location.detail', 'location_detail')
                                              .replace('location.building', 'location_building');
                        newErrors[frontendKey] = result.errors[key];
                    });
                    setErrors(newErrors);
                    
                    // Scroll to first error
                    const firstErrorField = Object.keys(newErrors)[0];
                    if (firstErrorField) {
                        const element = document.querySelector(`[name="${firstErrorField}"]`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.focus();
                        }
                    }
                } else {
                    alert('Lỗi đăng bài: ' + (result.message || result.error || 'Server Error'));
                }
            }
        } catch (err) {
            console.error(err);
            alert('Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category_id: '5',
            event_date: '',
            location_building: 'Alpha',
            location_detail: '',
            description: '',
            images: [],
            contact_phone: ''
        });
        setStep(1);
        setIsOpen(false);
        window.location.reload(); // Reload to show new post
    };

    if (!isOpen) return null;

    const themeColor = type === 'LOST' ? 'red' : 'green';
    const bgColor = type === 'LOST' ? 'bg-red-50' : 'bg-green-50';
    const btnColor = type === 'LOST' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
    const textColor = type === 'LOST' ? 'text-red-600' : 'text-green-600';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                
                {/* Overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                                {step === 1 ? 'Đăng tin mới' : 'Thành công!'}
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="px-4 py-5 sm:p-6">
                            
                            {/* Segmented Control */}
                            <div className="flex rounded-md shadow-sm mb-6" role="group">
                                <button
                                    type="button"
                                    onClick={() => setType('LOST')}
                                    className={`flex-1 py-2 px-4 text-sm font-medium border rounded-l-lg transition
                                        ${type === 'LOST' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-search mr-2"></i> Mất Đồ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('FOUND')}
                                    className={`flex-1 py-2 px-4 text-sm font-medium border-t border-b border-r rounded-r-lg transition
                                        ${type === 'FOUND' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-hand-holding-heart mr-2"></i> Nhặt Được
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                
                                {/* Title */}
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Tiêu đề ngắn gọn</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder={type === 'LOST' ? "Ví dụ: Mất ví Sen màu nâu" : "Ví dụ: Nhặt được thẻ SV Nguyễn Văn A"}
                                            className={`shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border ${errors.title ? 'border-red-500' : ''}`}
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                        )}
                                        {!errors.title && formData.title && (
                                            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 ký tự</p>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full py-2 px-3 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        <option value="1">Thẻ Sinh Viên</option>
                                        <option value="2">Ví / Bóp</option>
                                        <option value="3">Laptop / Điện thoại</option>
                                        <option value="4">Chìa khóa</option>
                                        <option value="5">Giấy tờ tùy thân</option>
                                        <option value="6">Khác</option>
                                    </select>
                                    {errors.category_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Thời gian</label>
                                    <input
                                        type="datetime-local"
                                        name="event_date"
                                        value={formData.event_date}
                                        onChange={handleChange}
                                        max={new Date().toISOString().slice(0, 16)}
                                        className={`mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${errors.event_date ? 'border-red-500' : ''}`}
                                    />
                                    {errors.event_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>
                                    )}
                                </div>

                                {/* Location: Building */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Tòa nhà</label>
                                    <select
                                        name="location_building"
                                        value={formData.location_building}
                                        onChange={handleChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                    >
                                        <option>Alpha</option>
                                        <option>Beta</option>
                                        <option>Gamma</option>
                                        <option>Delta</option>
                                        <option>Epsilon</option>
                                        <option>Canteen</option>
                                        <option>Thư viện</option>
                                        <option>Bãi xe</option>
                                        <option>Khác</option>
                                    </select>
                                </div>

                                {/* Location: Detail */}
                                <div className="sm:col-span-4">
                                    <label className="block text-sm font-medium text-gray-700">Vị trí cụ thể</label>
                                    <input
                                        type="text"
                                        name="location_detail"
                                        value={formData.location_detail}
                                        onChange={handleChange}
                                        placeholder="VD: Phòng 201, Bàn số 5..."
                                        className={`mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border ${errors.location_detail ? 'border-red-500' : ''}`}
                                    />
                                    {errors.location_detail && (
                                        <p className="mt-1 text-sm text-red-600">{errors.location_detail}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                    <textarea
                                        name="description"
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Mô tả đặc điểm nhận dạng, trầy xước, móc khóa..."
                                        maxLength={1000}
                                        className={`shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border mt-1 ${errors.description ? 'border-red-500' : ''}`}
                                    ></textarea>
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                    )}
                                    {!errors.description && formData.description && (
                                        <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 ký tự</p>
                                    )}
                                </div>

                                {/* Images */}
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Hình ảnh</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition">
                                        <div className="space-y-1 text-center">
                                            {uploading ? (
                                                <div className="flex flex-col items-center">
                                                    <i className="fas fa-circle-notch fa-spin text-3xl text-orange-500"></i>
                                                    <p className="text-sm text-gray-500 mt-2">Đang tải ảnh lên...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <i className="fas fa-camera text-gray-400 text-3xl mb-3"></i>
                                                    <div className="flex text-sm text-gray-600 justify-center">
                                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                                                            <span>Tải ảnh lên (Chọn nhiều)</span>
                                                            <input type="file" multiple className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                                        </label>
                                                    </div>
                                                    <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Image List */}
                                    {formData.images.length > 0 && (
                                        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                                                    <img src={img} className="w-full h-full object-cover rounded-md border" />
                                                    <button
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Contact */}
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Thông tin liên hệ (SĐT/Facebook)</label>
                                    <input
                                        type="text"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="px-4 py-5 sm:p-6 text-center">
                            <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng bài thành công!</h3>
                            <p className="text-gray-500">Bài viết của bạn đã được đăng lên hệ thống.</p>
                            <p className="text-sm text-gray-400 mt-2">Hệ thống sẽ tự động tải lại sau giây lát...</p>
                        </div>
                    )}

                    {/* Footer / Buttons */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {step === 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || uploading}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                                     ${loading ? 'bg-gray-400 cursor-not-allowed' : btnColor}`}
                                >
                                    {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Đang xử lý</> : 'Đăng Tin Ngay'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Hủy
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Hoàn tất
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<PostModal />, document.getElementById('post-modal-root'));
