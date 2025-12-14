import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Menu.css';

const Menu = () => {
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Fetch categories and menu items on mount
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      // API returns { categories: [...] }
      const cats = response.data.categories || [];
      setCategories([{ id: 'all', name: 'All' }, ...cats.map(c => ({ id: c.id, name: c.name }))]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get('/menu');
      const items = res.data.menu || [];
      setMenuItems(items);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError('Category name cannot be empty');
      return;
    }

    setCategoryLoading(true);
    setCategoryError('');
    try {
      await axios.post('/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowCategoryModal(false);
      await fetchCategories();
    } catch (error) {
      setCategoryError(error.response?.data?.error || 'Error adding category');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Mock data - TODO: Replace with API calls
  // const fetchMenuItems = async () => {
  //   const response = await fetch('/api/menu');
  //   return response.json();
  // };
  // const createMenuItem = async (itemData) => {
  //   const response = await fetch('/api/menu', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(itemData),
  //   });
  //   return response.json();
  // };
  // const updateMenuItem = async (id, itemData) => {
  //   const response = await fetch(`/api/menu/${id}`, {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(itemData),
  //   });
  //   return response.json();
  // };
  // const deleteMenuItem = async (id) => {
  //   const response = await fetch(`/api/menu/${id}`, {
  //     method: 'DELETE',
  //   });
  //   return response.json();
  // };

  const [menuItems, setMenuItems] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '', // will store category_id
    prepTime: '',
    tags: '',
    imageUrl: '',
    isVeg: true,
    available: true
  });

  const [priceError, setPriceError] = useState('');

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => String(item.category_id) === String(selectedCategory));

  const handlePriceChange = (value) => {
    const numValue = parseFloat(value);
    if (value === '') {
      setPriceError('');
      setFormData({ ...formData, price: '' });
      return;
    }
    if (isNaN(numValue) || numValue < 0) {
      setPriceError('Price must be a valid positive number');
    } else if (numValue > 10000) {
      setPriceError('Price cannot exceed ₹10,000');
    } else {
      setPriceError('');
    }
    setFormData({ ...formData, price: value });
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price != null ? item.price.toString() : '',
        category: item.category_id || '',
        prepTime: item.prep_time != null ? String(item.prep_time) : '',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        imageUrl: item.image_url || '',
        isVeg: !!item.veg,
        available: item.available !== undefined ? item.available : true
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        prepTime: '',
        tags: '',
        imageUrl: '',
        isVeg: true,
        available: true
      });
    }
    setPriceError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setPriceError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (priceError) return;

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.category ? parseInt(formData.category) : null,
      prep_time: parseInt(formData.prepTime) || 0,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
      image_url: formData.imageUrl || null,
      veg: !!formData.isVeg,
      available: !!formData.available
    };

    const doSubmit = async () => {
      try {
        if (editingItem) {
          const res = await axios.put(`/menu/${editingItem.id}`, itemData);
          const updated = res.data.menu;
          setMenuItems(menuItems.map(it => (it.id === updated.id ? updated : it)));
        } else {
          const res = await axios.post('/menu', itemData);
          const created = res.data.menu;
          setMenuItems(prev => [...prev, created]);
        }
      } catch (err) {
        console.error('Error saving menu item', err);
        alert(err.response?.data?.error || 'Error saving menu item');
      }
    };

    doSubmit();

    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      (async () => {
        try {
          await axios.delete(`/menu/${id}`);
          setMenuItems(menuItems.filter(item => item.id !== id));
        } catch (err) {
          console.error('Error deleting item', err);
          alert(err.response?.data?.error || 'Error deleting item');
        }
      })();
    }
  };

  const handleToggleAvailability = (id) => {
    (async () => {
      try {
        const current = menuItems.find(i => i.id === id);
        const res = await axios.put(`/menu/${id}`, { available: !current.available });
        const updated = res.data.menu;
        setMenuItems(menuItems.map(it => (it.id === updated.id ? updated : it)));
      } catch (err) {
        console.error('Error toggling availability', err);
        alert(err.response?.data?.error || 'Error updating availability');
      }
    })();
  };

  const handleBulkToggleAvailability = () => {
    if (selectedItems.length === 0) return;
    (async () => {
      try {
        const updates = selectedItems.map(id => {
          const current = menuItems.find(i => i.id === id);
          return axios.put(`/menu/${id}`, { available: !current.available });
        });
        const results = await Promise.all(updates);
        const updatedItems = results.map(r => r.data.menu);
        setMenuItems(prev => prev.map(it => {
          const upd = updatedItems.find(u => u.id === it.id);
          return upd ? upd : it;
        }));
        setSelectedItems([]);
      } catch (err) {
        console.error('Error bulk toggling availability', err);
        alert('Error updating items');
      }
    })();
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    alert('CSV export functionality will be implemented');
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  return (
    <div className="menu-page" style={{ padding: '1.5rem' }}>
      <div className="menu-layout">
        {/* Left Sidebar - Categories */}
        <aside className="menu-sidebar">
          <div className="flex items-center justify-between mb-4">
            <h2>Categories</h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition"
              title="Add Category"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <nav className="category-list">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`category-item ${selectedCategory === String(cat.id) ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="menu-content">
          {/* Header */}
          <div className="menu-header">
            <div>
              <h1>Menu Management</h1>
              <p className="text-gray-600">Manage your restaurant menu items</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Grid View"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  title="List View"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="add-item-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="bulk-actions">
              <span className="text-sm text-gray-700 font-medium">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkToggleAvailability}
                className="bulk-action-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Toggle Availability
              </button>
              <button
                onClick={handleExportCSV}
                className="bulk-action-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          )}

          {/* Menu Items Grid/List */}
          {viewMode === 'grid' ? (
            <div className="menu-grid">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`menu-item-card ${selectedItems.includes(item.id) ? 'selected' : ''} ${!item.available ? 'unavailable' : ''}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="item-checkbox"
                  />

                  {/* Image Section with Overlay */}
                  <div className="menu-item-image-wrapper">
                  <div className="menu-item-image">
                    {(item.image_url || item.imageUrl) ? (
                        <img src={item.image_url || item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="menu-item-image-placeholder">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Image Overlay Badges */}
                    <div className="menu-item-image-overlay">
                      {/* Veg/Non-Veg Badge */}
                      <div className={`menu-item-badge veg-badge ${(item.veg !== undefined ? item.veg : item.isVeg) ? 'veg' : 'non-veg'}`}>
                        <span className="badge-dot"></span>
                        <span className="badge-text">{(item.veg !== undefined ? item.veg : item.isVeg) ? 'VEG' : 'NON-VEG'}</span>
                      </div>
                      
                      {/* Availability Badge */}
                      {!item.available && (
                        <div className="menu-item-badge availability-badge">
                          <span className="badge-text">UNAVAILABLE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="menu-item-content">
                    {/* Category Badge */}
                    <div className="menu-item-category">
                      <span className="category-badge">
                        {categories.find(c => String(c.id) === String(item.category_id))?.name || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Item Name */}
                    <h3 className="menu-item-name">{item.name}</h3>

                    {/* Description */}
                    {item.description && (
                      <p className="menu-item-description">{item.description}</p>
                    )}

                    {/* Tags */}
                    {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="menu-item-tags">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="tag-badge">{tag}</span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="tag-badge more-tags">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Price and Prep Time Row */}
                    <div className="menu-item-meta">
                      <div className="menu-item-price-wrapper">
                        <span className="price-currency">₹</span>
                        <span className="menu-item-price">{item.price}</span>
                      </div>
                      {item.prep_time !== undefined && item.prep_time > 0 && (
                        <div className="menu-item-prep-time">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{item.prep_time} min</span>
                        </div>
                      )}
                  </div>

                    {/* Action Buttons */}
                  <div className="menu-item-actions">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`item-btn toggle ${item.available ? 'active' : 'inactive'}`}
                      title={item.available ? 'Mark Unavailable' : 'Mark Available'}
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {item.available ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        <span>{item.available ? 'Available' : 'Unavailable'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(item)}
                        className="item-btn edit-btn"
                      title="Edit Item"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="item-btn danger"
                      title="Delete Item"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prep Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={!item.available ? 'opacity-60' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                            {(item.image_url || item.imageUrl) ? (
                              <img src={item.image_url || item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded" />
                            ) : (
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{item.name}</h3>
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                item.isVeg ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'
                              }`}>
                                {item.isVeg ? (
                                  <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                                ) : (
                                  <div className="h-1.5 w-1.5 bg-white"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(categories.find(c => String(c.id) === String(item.category_id))?.name) || item.category || 'Uncategorized'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">₹{item.price}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(item.prep_time !== undefined ? item.prep_time : item.prepTime)} min</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className={`px-2 py-1 text-xs rounded-lg ${
                            item.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new menu item.</p>
            </div>
          )}

          {/* Add Category Modal */}
          {showCategoryModal && (
            <div className="menu-modal-overlay" onClick={() => setShowCategoryModal(false)}>
              <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="menu-modal-header">
                  <h2 className="menu-modal-title">Add New Category</h2>
                  <button
                    onClick={() => {
                      setShowCategoryModal(false);
                      setCategoryError('');
                      setNewCategoryName('');
                    }}
                    className="menu-modal-close"
                    aria-label="Close Modal"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddCategory}>
                  <div className="menu-form-group">
                    <label className="menu-form-label">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="menu-form-input"
                      placeholder="e.g., Appetizers, Soups, Salads"
                      disabled={categoryLoading}
                    />
                  </div>

                  {categoryError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {categoryError}
                    </div>
                  )}

                  <div className="menu-modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryModal(false);
                        setCategoryError('');
                        setNewCategoryName('');
                      }}
                      className="menu-btn-secondary"
                      disabled={categoryLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="menu-btn-primary"
                      disabled={categoryLoading}
                    >
                      {categoryLoading ? 'Adding...' : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add/Edit Item Modal */}
          {showModal && (
            <div className="menu-modal-overlay" onClick={handleCloseModal}>
              <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="menu-modal-header">
                  <h2 className="menu-modal-title">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="menu-modal-close"
                    aria-label="Close Modal"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="menu-form-group">
                    <label className="menu-form-label">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="menu-form-input"
                      placeholder="e.g., Paneer Tikka"
                    />
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="menu-form-textarea"
                      placeholder="Brief description of the item"
                    />
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10000"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`menu-form-input ${priceError ? 'price-error' : ''}`}
                      placeholder="0.00"
                    />
                    {priceError && (
                      <div className="price-error-message">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {priceError}
                      </div>
                    )}
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="menu-form-select"
                    >
                      <option value="">Select a category</option>
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Prep Time (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.prepTime}
                      onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                      className="menu-form-input"
                      placeholder="15"
                    />
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="menu-form-input"
                      placeholder="e.g., Popular, Spicy, Cold"
                    />
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="menu-form-input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.isVeg}
                          onChange={() => setFormData({ ...formData, isVeg: true })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-gray-700">Vegetarian</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={!formData.isVeg}
                          onChange={() => setFormData({ ...formData, isVeg: false })}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-gray-700">Non-Vegetarian</span>
                      </label>
                    </div>
                  </div>

                  <div className="menu-form-group">
                    <label className="menu-form-label">Availability</label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Available</span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="menu-modal-actions">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="menu-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!!priceError}
                      className="menu-btn-primary"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default Menu;


